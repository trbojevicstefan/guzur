import asyncFs from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import escapeStringRegexp from 'escape-string-regexp'
import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import Booking from '../models/Booking'
import Property from '../models/Property'
import User from '../models/User'
import i18n from '../lang/i18n'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Development from '../models/Development'
import Organization from '../models/Organization'
import * as authHelper from '../utils/authHelper'
import * as notificationHelper from '../utils/notificationHelper'

const getRequestUser = async (req: Request) => {
  try {
    const cookieName = authHelper.getAuthCookieName(req)
    const token = cookieName === env.X_ACCESS_TOKEN
      ? (req.headers[env.X_ACCESS_TOKEN] as string)
      : (req.signedCookies[cookieName] as string)

    if (!token) {
      return null
    }

    const sessionData = await authHelper.decryptJWT(token)
    if (!sessionData || !helper.isValidObjectId(sessionData.id)) {
      return null
    }

    return await User.findById(sessionData.id)
  } catch {
    return null
  }
}

/**
 * Create a Property.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreatePropertyPayload } = req

  try {
    const user = await getRequestUser(req)
    const isAdmin = authHelper.isAdmin(req)
    const {
      name,
      type,
      agency,
      broker,
      developer,
      owner,
      brokerageOrg,
      developerOrg,
      developmentId,
      description,
      aiDescription,
      useAiDescription,
      image: imageFile,
      images,
      bedrooms,
      bathrooms,
      kitchens,
      parkingSpaces,
      size,
      petsAllowed,
      furnished,
      minimumAge,
      location,
      address,
      latitude,
      longitude,
      price,
      salePrice,
      hidden,
      cancellation,
      aircon,
      rentalTerm,
      listingType,
      listingStatus: listingStatusInput,
      reviewedBy,
      reviewedAt,
      reviewNotes,
      blockOnPay,
      seoTitle,
      seoDescription,
      seoKeywords,
      seoGeneratedAt,
    } = body

      const hasSeo = !!seoTitle && !!seoDescription
      let listingStatus = (listingStatusInput as movininTypes.ListingStatus | undefined)
        || (isAdmin ? movininTypes.ListingStatus.Published : movininTypes.ListingStatus.PendingReview)

      if (listingStatus === movininTypes.ListingStatus.Published && (!hasSeo || (!isAdmin && !user?.approved))) {
        listingStatus = movininTypes.ListingStatus.PendingReview
      }

      let resolvedBrokerageOrg = brokerageOrg
        || (user?.type === movininTypes.UserType.Broker ? user?.primaryOrg : undefined)
      let resolvedDeveloperOrg = developerOrg
        || (user?.type === movininTypes.UserType.Developer ? user?.primaryOrg : undefined)

      if (!resolvedBrokerageOrg && broker && helper.isValidObjectId(broker)) {
        const brokerUser = await User.findById(broker)
        if (brokerUser?.primaryOrg) {
          resolvedBrokerageOrg = brokerUser.primaryOrg
        }
      }
      if (!resolvedDeveloperOrg && developer && helper.isValidObjectId(developer)) {
        const developerUser = await User.findById(developer)
        if (developerUser?.primaryOrg) {
          resolvedDeveloperOrg = developerUser.primaryOrg
        }
      }

      const _property = {
        name,
        type,
        agency,
        broker,
        developer,
        owner,
        brokerageOrg: resolvedBrokerageOrg,
        developerOrg: resolvedDeveloperOrg,
        developmentId,
      description,
      aiDescription,
      useAiDescription,
      bedrooms,
      bathrooms,
      kitchens,
      parkingSpaces,
      size,
      petsAllowed,
      furnished,
      minimumAge,
      location,
      address,
      latitude,
      longitude,
      price,
      salePrice,
      hidden,
      cancellation,
      aircon,
      rentalTerm,
      listingType,
      listingStatus,
      reviewedBy,
      reviewedAt,
      reviewNotes,
      blockOnPay,
      seoTitle,
      seoDescription,
      seoKeywords,
      seoGeneratedAt: seoGeneratedAt || (hasSeo ? new Date() : undefined),
    }

    const property = new Property(_property)
    await property.save()

    // image
    if (imageFile) {
      const _image = path.join(env.CDN_TEMP_PROPERTIES, imageFile)
      if (await helper.pathExists(_image)) {
        const filename = `${property._id}_${Date.now()}${path.extname(imageFile)}`
        const newPath = path.join(env.CDN_PROPERTIES, filename)

        await asyncFs.rename(_image, newPath)
        property.image = filename
      } else {
        logger.warn(`[property.create] main image not found in temp: ${_image}`)
      }
    }

    // images
    const maxImages = 10
    const inputImages = Array.isArray(images) ? images.slice(0, maxImages) : []
    property.images = []
    if (inputImages.length > 0) {
      let i = 1
      for (const img of inputImages) {
        const _img = path.join(env.CDN_TEMP_PROPERTIES, img)

        if (await helper.pathExists(_img)) {
          const filename = `${property._id}_${nanoid()}_${Date.now()}_${i}${path.extname(img)}`
          const newPath = path.join(env.CDN_PROPERTIES, filename)

          await asyncFs.rename(_img, newPath)
          property.images.push(filename)
        } else {
          logger.warn(`[property.create] additional image not found in temp: ${_img}`)
        }
        i += 1
      }
    }

    await property.save()

    res.json(property)
  } catch (err) {
    logger.error(`[property.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Update a Property.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.UpdatePropertyPayload } = req
  const { _id } = body

  try {
    const user = await getRequestUser(req)
    const isAdmin = authHelper.isAdmin(req)
    if (!helper.isValidObjectId(_id)) {
      throw new Error('body._id is not valid')
    }
    const property = await Property.findById(_id)

    if (property) {
      const previousStatus = property.listingStatus
      const {
          name,
          type,
          agency,
          broker,
          developer,
          owner,
          brokerageOrg,
          developerOrg,
          developmentId,
          description,
          aiDescription,
          useAiDescription,
          available,
          image,
          images,
        bedrooms,
        bathrooms,
        kitchens,
        parkingSpaces,
        size,
        petsAllowed,
        furnished,
        minimumAge,
        location,
        address,
        latitude,
        longitude,
        price,
        salePrice,
        hidden,
        cancellation,
        aircon,
        rentalTerm,
        listingType,
        listingStatus: listingStatusInput,
        reviewedBy,
        reviewedAt,
        reviewNotes,
        blockOnPay,
        seoTitle,
        seoDescription,
        seoKeywords,
        seoGeneratedAt,
      } = body

        property.name = name
        property.type = type as movininTypes.PropertyType
        property.agency = new mongoose.Types.ObjectId(agency)
        property.broker = broker ? new mongoose.Types.ObjectId(broker) : property.broker
        property.developer = developer ? new mongoose.Types.ObjectId(developer) : property.developer
        property.owner = owner ? new mongoose.Types.ObjectId(owner) : property.owner
        let nextBrokerageOrg = brokerageOrg
          || (user?.type === movininTypes.UserType.Broker ? user?.primaryOrg : property.brokerageOrg)
        let nextDeveloperOrg = developerOrg
          || (user?.type === movininTypes.UserType.Developer ? user?.primaryOrg : property.developerOrg)

        if (!nextBrokerageOrg && broker && helper.isValidObjectId(broker)) {
          const brokerUser = await User.findById(broker)
          if (brokerUser?.primaryOrg) {
            nextBrokerageOrg = brokerUser.primaryOrg
          }
        }
        if (!nextDeveloperOrg && developer && helper.isValidObjectId(developer)) {
          const developerUser = await User.findById(developer)
          if (developerUser?.primaryOrg) {
            nextDeveloperOrg = developerUser.primaryOrg
          }
        }

        const normalizeOrgId = (value?: string | mongoose.Types.ObjectId) => {
          if (!value) {
            return undefined
          }
          if (value instanceof mongoose.Types.ObjectId) {
            return value
          }
          return helper.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : undefined
        }

        property.brokerageOrg = normalizeOrgId(nextBrokerageOrg)
        property.developerOrg = normalizeOrgId(nextDeveloperOrg)
        property.developmentId = developmentId ? new mongoose.Types.ObjectId(developmentId) : property.developmentId
        property.description = description
      property.aiDescription = aiDescription
      property.useAiDescription = useAiDescription
      property.available = available
      property.bedrooms = bedrooms
      property.bathrooms = bathrooms
      property.kitchens = kitchens
      property.parkingSpaces = parkingSpaces
      property.size = size
      property.petsAllowed = petsAllowed
      property.furnished = furnished
      property.minimumAge = minimumAge
      property.location = new mongoose.Types.ObjectId(location)
      property.address = address
      property.latitude = latitude
      property.longitude = longitude
      property.price = price
      property.salePrice = salePrice
      property.hidden = hidden
      property.cancellation = cancellation
      property.aircon = aircon
      property.rentalTerm = rentalTerm as movininTypes.RentalTerm
      property.listingType = listingType as movininTypes.ListingType
      property.reviewedBy = reviewedBy ? new mongoose.Types.ObjectId(reviewedBy) : undefined
      property.reviewedAt = reviewedAt ? new Date(reviewedAt) : undefined
      property.reviewNotes = reviewNotes
      property.blockOnPay = blockOnPay
      property.seoTitle = seoTitle
      property.seoDescription = seoDescription
      property.seoKeywords = seoKeywords

      const hasSeo = !!seoTitle && !!seoDescription
      let listingStatus = (listingStatusInput as movininTypes.ListingStatus | undefined) || property.listingStatus
      if (listingStatus === movininTypes.ListingStatus.Published && (!hasSeo || (!isAdmin && !user?.approved))) {
        listingStatus = movininTypes.ListingStatus.PendingReview
      }
      property.listingStatus = listingStatus
      if (hasSeo) {
        property.seoGeneratedAt = seoGeneratedAt || new Date()
      }

      if (image && image !== property.image) {
        if (property.image) {
          const oldImage = path.join(env.CDN_PROPERTIES, property.image)
          if (await helper.pathExists(oldImage)) {
            await asyncFs.unlink(oldImage)
          }
        }

        const filename = `${property._id}_${Date.now()}${path.extname(image)}`
        const filepath = path.join(env.CDN_PROPERTIES, filename)

        const tempImagePath = path.join(env.CDN_TEMP_PROPERTIES, image)
        await asyncFs.rename(tempImagePath, filepath)
        property.image = filename
      }

      const maxImages = 10
      const inputImages = Array.isArray(images) ? images.slice(0, maxImages) : []
      // delete deleted images
      const _images: string[] = []
      if (inputImages && property.images) {
        if (inputImages.length === 0) {
          for (const img of property.images) {
            const _image = path.join(env.CDN_PROPERTIES, img)
            if (await helper.pathExists(_image)) {
              await asyncFs.unlink(_image)
            }
          }
        } else {
          for (const img of property.images) {
            if (!inputImages.includes(img)) {
              const _image = path.join(env.CDN_PROPERTIES, img)
              if (await helper.pathExists(_image)) {
                await asyncFs.unlink(_image)
              }
            } else {
              _images.push(img)
            }
          }
        }
      }
      property.images = _images

      // add new images
      if (inputImages) {
        let i = 1
        for (const img of inputImages) {
          if (!property.images.includes(img)) {
            const _image = path.join(env.CDN_TEMP_PROPERTIES, img)

            if (await helper.pathExists(_image)) {
              const filename = `${property._id}_${nanoid()}_${Date.now()}_${i}${path.extname(img)}`
              const newPath = path.join(env.CDN_PROPERTIES, filename)

              await asyncFs.rename(_image, newPath)
              property.images.push(filename)
            }
          }
          i += 1
        }
      }

      await property.save()

      if (previousStatus !== property.listingStatus) {
        const recipientId =
          property.broker
          || property.developer
          || property.owner
          || property.agency
        if (recipientId) {
          const recipient = await User.findById(recipientId)
          if (recipient) {
            const messageText = `Listing ${property.name} is now ${property.listingStatus}.`
            const link = helper.joinURL(env.FRONTEND_HOST, 'dashboard')
            await notificationHelper.notifyUser(recipient, messageText, link)
          }
        }
      }

      res.json(property)
      return
    }

    logger.error('[property.update] Property not found:', _id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[property.update] ${i18n.t('DB_ERROR')} ${_id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Check if a Property is related to a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const checkProperty = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string

  try {
    const _id = new mongoose.Types.ObjectId(id)
    const count = await Booking
      .find({ property: _id })
      .limit(1)
      .countDocuments()

    if (count === 1) {
      res.sendStatus(200)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(`[property.check] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Delete a Property.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteProperty = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string

  try {
    const property = await Property.findById(id)
    if (property) {
      await Property.deleteOne({ _id: id })

      if (property.image) {
        const image = path.join(env.CDN_PROPERTIES, property.image)
        if (await helper.pathExists(image)) {
          await asyncFs.unlink(image)
        }
      }

      if (Array.isArray(property.images)) {
        for (const imageName of property.images) {
          const image = path.join(env.CDN_PROPERTIES, imageName)
          if (await helper.pathExists(image)) {
            await asyncFs.unlink(image)
          }
        }
      }

      await Booking.deleteMany({ property: property._id })
    } else {
      res.sendStatus(204)
      return
    }
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[property.delete] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Upload a Property image to temp folder.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error('[property.uploadImage] req.file not found')
    }

    const filename = `${helper.getFilenameWithoutExtension(req.file.originalname)}_${nanoid()}_${Date.now()}${path.extname(req.file.originalname)}`
    const filepath = path.join(env.CDN_TEMP_PROPERTIES, filename)

    await asyncFs.writeFile(filepath, req.file.buffer)
    res.json(filename)
  } catch (err) {
    logger.error(i18n.t('ERROR'), err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Delete a temp Property image.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteTempImage = async (req: Request, res: Response) => {
  try {
    const fileName = helper.normalizeParam(req.params.fileName) as string
    const imageFile = path.join(env.CDN_TEMP_PROPERTIES, fileName)
    if (!(await helper.pathExists(imageFile))) {
      res.sendStatus(204)
      return
    }

    await asyncFs.unlink(imageFile)

    res.sendStatus(200)
  } catch (err) {
    logger.error(i18n.t('ERROR'), err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Delete a Property image.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const propertyId = helper.normalizeParam(req.params.property) as string
    const imageFileName = helper.normalizeParam(req.params.image) as string

    const property = await Property.findById(propertyId)

    if (property && property.images) {
      const index = property.images.findIndex((i) => i === imageFileName)

      if (index > -1) {
        const _image = path.join(env.CDN_PROPERTIES, imageFileName)
        if (await helper.pathExists(_image)) {
          await asyncFs.unlink(_image)
        }
        property.images.splice(index, 1)
        await property.save()
        res.sendStatus(200)
        return
      }

      res.sendStatus(204)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(i18n.t('ERROR'), err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Get a Property by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getProperty = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string
  const language = helper.normalizeParam(req.params.language) as string

    try {
      const property = await Property.findById(id)
        .populate<{ agency: env.UserInfo }>('agency')
        .populate({
          path: 'broker',
          select: '_id fullName company phone email avatar type primaryOrg',
        })
        .populate({
          path: 'developer',
          select: '_id fullName company phone email avatar type primaryOrg',
        })
        .populate({
          path: 'owner',
          select: '_id fullName phone email avatar type',
        })
        .populate({
          path: 'brokerageOrg',
          select: '_id name slug type logo',
        })
        .populate({
          path: 'developerOrg',
          select: '_id name slug type logo',
        })
        .populate({
          path: 'developmentId',
          select: '_id name',
        })
        .populate<{ location: env.LocationInfo }>({
          path: 'location',
          populate: {
            path: 'values',
            model: 'LocationValue',
        },
      })
      .lean()

    if (property) {
      if (property.agency) {
        const {
          _id,
          fullName,
          avatar,
          payLater,
        } = property.agency
        property.agency = {
          _id,
          fullName,
          avatar,
          payLater,
        }
      }

      if (property.location?.values) {
        const localized = property.location.values.filter((value) => value.language === language)[0]
        property.location.name = localized?.value || property.location.name
      }

      res.json(property)
      return
    }

    logger.error('[property.getProperty] Property not found:', id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[property.getProperty] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Get Properties.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getProperties = async (req: Request, res: Response) => {
  try {
    const { body }: { body: movininTypes.GetPropertiesPayload } = req
    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const agencies = Array.isArray(body.agencies) ? body.agencies : []
    const brokerageOrgs = Array.isArray(body.brokerageOrgs) ? body.brokerageOrgs : []
    const developerOrgs = Array.isArray(body.developerOrgs) ? body.developerOrgs : []
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const types = body.types || []
    const rentalTerms = body.rentalTerms || []
    const listingTypes = body.listingTypes || []
    const listingStatuses = body.listingStatuses || []
    const brokers = body.brokers || []
    const developers = body.developers || []
    const owners = body.owners || []
    const { availability } = body
    const options = 'i'
    // const language = body.language || env.DEFAULT_LANGUAGE

    const $match: mongoose.QueryFilter<movininTypes.Property> = {
      $and: [
        { type: { $in: types } },
      ],
    }

    if (agencies.length > 0) {
      $match.$and!.push({ agency: { $in: agencies.map((id) => new mongoose.Types.ObjectId(id)) } })
    }
    if (brokerageOrgs.length > 0) {
      $match.$and!.push({ brokerageOrg: { $in: brokerageOrgs.map((id) => new mongoose.Types.ObjectId(id)) } })
    }
    if (developerOrgs.length > 0) {
      $match.$and!.push({ developerOrg: { $in: developerOrgs.map((id) => new mongoose.Types.ObjectId(id)) } })
    }

    const hasRentSelection = listingTypes.includes(movininTypes.ListingType.Rent)
    const hasSaleSelection = listingTypes.includes(movininTypes.ListingType.Sale)
    const hasBothSelection = listingTypes.includes(movininTypes.ListingType.Both)
    const includeAllListingTypes = listingTypes.length === 0 || hasBothSelection || (hasRentSelection && hasSaleSelection)

    if (includeAllListingTypes) {
      const rentalTermMatch = rentalTerms.length > 0 ? { rentalTerm: { $in: rentalTerms } } : {}
      $match.$and!.push({
        $or: [
          { $and: [{ listingType: { $in: [movininTypes.ListingType.Rent, movininTypes.ListingType.Both] } }, rentalTermMatch] },
          { listingType: { $in: [movininTypes.ListingType.Sale, movininTypes.ListingType.Both] } },
        ],
      })
    } else if (hasRentSelection) {
      $match.$and!.push({ listingType: { $in: [movininTypes.ListingType.Rent, movininTypes.ListingType.Both] } })
      if (rentalTerms.length > 0) {
        $match.$and!.push({ rentalTerm: { $in: rentalTerms } })
      }
    } else if (hasSaleSelection) {
      $match.$and!.push({ listingType: { $in: [movininTypes.ListingType.Sale, movininTypes.ListingType.Both] } })
    }

    if (availability) {
      if (availability.length === 1 && availability[0] === movininTypes.Availablity.Available) {
        $match.$and!.push({ available: true })
      } else if (availability.length === 1 && availability[0] === movininTypes.Availablity.Unavailable) {
        $match.$and!.push({ available: false })
      } else if (availability.length === 0) {
        res.json([{ resultData: [], pageInfo: [] }])
        return
      }
    }

    if (listingStatuses.length > 0) {
      $match.$and!.push({ listingStatus: { $in: listingStatuses } })
    }

    if (brokers.length > 0) {
      $match.$and!.push({ broker: { $in: brokers.map((id) => new mongoose.Types.ObjectId(id)) } })
    }

    if (developers.length > 0) {
      $match.$and!.push({ developer: { $in: developers.map((id) => new mongoose.Types.ObjectId(id)) } })
    }

    if (owners.length > 0) {
      $match.$and!.push({ owner: { $in: owners.map((id) => new mongoose.Types.ObjectId(id)) } })
    }

    const data = await Property.aggregate(
      [
        { $match },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$agency' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
                },
              },
            ],
            as: 'agency',
          },
        },
        { $unwind: { path: '$agency', preserveNullAndEmptyArrays: false } },
        // {
        //   $lookup: {
        //     from: 'Location',
        //     let: { locationId: '$location' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $eq: ['$_id', '$$locationId'] },
        //         },
        //       },
        //       {
        //         $lookup: {
        //           from: 'LocationValue',
        //           let: { values: '$values' },
        //           pipeline: [
        //             {
        //               $match: {
        //                 $and: [
        //                   { $expr: { $in: ['$_id', '$$values'] } },
        //                   { $expr: { $eq: ['$language', language] } },
        //                 ],
        //               },
        //             },
        //           ],
        //           as: 'value',
        //         },
        //       },
        //       { $unwind: { path: '$value', preserveNullAndEmptyArrays: false } },
        //       {
        //         $addFields: { name: '$value.value' },
        //       },
        //     ],
        //     as: 'location',
        //   },
        // },
        // { $unwind: { path: '$location', preserveNullAndEmptyArrays: false } },
        // {
        //   $match: {
        //     $or: [
        //       { name: { $regex: keyword, $options: options } },
        //       { 'location.name': { $regex: keyword, $options: options } },
        //     ],
        //   },
        // },
        {
          $match: {
            name: { $regex: keyword, $options: options },
          },
        },
        {
          $facet: {
            resultData: [{ $sort: { updatedAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
            pageInfo: [
              {
                $count: 'totalRecords',
              },
            ],
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    for (const property of data[0].resultData) {
      const { _id, fullName, avatar } = property.agency
      property.agency = { _id, fullName, avatar }
    }

    res.json(data)
  } catch (err) {
    logger.error(`[property.getProperties] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get properties for the logged-in partner (broker/developer/owner).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
  export const getMyProperties = async (req: Request, res: Response) => {
    try {
      const user = await getRequestUser(req)
      if (!user?._id) {
        res.sendStatus(401)
        return
      }

      const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
      const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
      const keyword = escapeStringRegexp(String(req.query.s || ''))
      const developmentId = helper.normalizeParam(req.query.developmentId as string | string[] | undefined)
      const status = helper.normalizeParam(req.query.status as string | string[] | undefined)
      const options = 'i'

    const $and: mongoose.QueryFilter<movininTypes.Property>[] = [
      {
        $or: [
          { name: { $regex: keyword, $options: options } },
          { description: { $regex: keyword, $options: options } },
        ],
      },
    ]

      if (user.type === movininTypes.UserType.Broker) {
        const brokerFilters: mongoose.QueryFilter<movininTypes.Property>[] = [
          { broker: user._id },
          { agency: user._id },
        ]
        if (user.primaryOrg) {
          brokerFilters.push({ brokerageOrg: new mongoose.Types.ObjectId(user.primaryOrg) })
        }
        $and.push({ $or: brokerFilters })
      } else if (user.type === movininTypes.UserType.Developer) {
        const developerFilters: mongoose.QueryFilter<movininTypes.Property>[] = [
          { developer: user._id },
        ]
        if (user.primaryOrg) {
          developerFilters.push({ developerOrg: new mongoose.Types.ObjectId(user.primaryOrg) })
        }
        $and.push({ $or: developerFilters })
      } else if (user.type === movininTypes.UserType.Owner) {
        $and.push({ owner: user._id })
      } else {
        res.sendStatus(403)
        return
      }

      if (developmentId) {
        if (!helper.isValidObjectId(developmentId)) {
          res.status(400).send(i18n.t('ERROR') + 'developmentId is not valid')
          return
        }
        $and.push({ developmentId: new mongoose.Types.ObjectId(developmentId) })
      }

      if (status && Object.values(movininTypes.ListingStatus).includes(status as movininTypes.ListingStatus)) {
        $and.push({ listingStatus: status })
      }

      const $match: mongoose.QueryFilter<movininTypes.Property> = { $and }

    const data = await Property.aggregate(
      [
        { $match },
        {
          $facet: {
            resultData: [{ $sort: { updatedAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
            pageInfo: [
              {
                $count: 'totalRecords',
              },
            ],
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    res.json(data)
  } catch (err) {
    logger.error(`[property.getMyProperties] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Properties by Agency and Location.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookingProperties = async (req: Request, res: Response) => {
  try {
    const { body }: { body: movininTypes.GetBookingPropertiesPayload } = req
    const agency = new mongoose.Types.ObjectId(body.agency)
    const location = new mongoose.Types.ObjectId(body.location)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'
    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)

    const properties = await Property.aggregate(
      [
        {
          $match: {
            $and: [
              { agency: { $eq: agency } },
              { location },
              { name: { $regex: keyword, $options: options } }],
          },
        },
        { $sort: { name: 1, _id: 1 } },
        { $skip: (page - 1) * size },
        { $limit: size },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    res.json(properties)
  } catch (err) {
    logger.error(`[property.getBookingProperties] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Properties available for rental.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
  export const getFrontendProperties = async (req: Request, res: Response) => {
    try {
      const { body }: { body: movininTypes.GetPropertiesPayload } = req
      const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
      const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
      const agencies = Array.isArray(body.agencies) ? body.agencies : []
      const brokerageOrgs = Array.isArray(body.brokerageOrgs) ? body.brokerageOrgs : []
      const developerOrgs = Array.isArray(body.developerOrgs) ? body.developerOrgs : []
      const locationParam = body.location
      const types = body.types || []
      const rentalTerms = body.rentalTerms || []
      const listingTypes = body.listingTypes || []
      const listingStatuses = body.listingStatuses && body.listingStatuses.length > 0
        ? body.listingStatuses
        : [movininTypes.ListingStatus.Published]
      const features = Array.isArray(body.features) ? body.features : []
      const q = escapeStringRegexp(String(body.q || body.keyword || req.query.q || req.query.s || ''))
      const sort = body.sort || movininTypes.PropertySort.Newest
      const priceMin = typeof body.priceMin === 'number' ? body.priceMin : undefined
      const priceMax = typeof body.priceMax === 'number' ? body.priceMax : undefined
      const bedroomsMin = typeof body.bedroomsMin === 'number' ? body.bedroomsMin : undefined
      const areaMin = typeof body.areaMin === 'number' ? body.areaMin : undefined
      const areaMax = typeof body.areaMax === 'number' ? body.areaMax : undefined
      const { from, to } = body

    let rentFrom: Date | undefined
    let rentTo: Date | undefined

    const hasRentSelection = listingTypes.includes(movininTypes.ListingType.Rent)
    const hasSaleSelection = listingTypes.includes(movininTypes.ListingType.Sale)
    const hasBothSelection = listingTypes.includes(movininTypes.ListingType.Both)
    const includeAllListingTypes = listingTypes.length === 0 || hasBothSelection || (hasRentSelection && hasSaleSelection)

    const hasRentDates = hasRentSelection && !!from && !!to
    if (hasRentDates) {
      rentFrom = new Date(from)
      rentTo = new Date(to)
    }

    let locationIds: mongoose.Types.ObjectId[] | undefined
    if (locationParam && helper.isValidObjectId(locationParam)) {
      const location = new mongoose.Types.ObjectId(locationParam)
      const locIds = await Location.find({
        $or: [
          { _id: location },
          { parentLocation: location },
        ],
      }).select('_id').lean()

      locationIds = locIds.map((loc) => loc._id)
    }

    const $match: mongoose.QueryFilter<movininTypes.Property> = {
      $and: [
        ...(locationIds ? [{ location: { $in: locationIds } }] : []),
        ...(types.length > 0 ? [{ type: { $in: types } }] : []),
        { available: true },
        { hidden: false },
        { listingStatus: { $in: listingStatuses } },
      ],
    }

      if (agencies.length > 0) {
        $match.$and!.push({ agency: { $in: agencies.map((id) => new mongoose.Types.ObjectId(id)) } })
      }
      if (brokerageOrgs.length > 0) {
        $match.$and!.push({ brokerageOrg: { $in: brokerageOrgs.map((id) => new mongoose.Types.ObjectId(id)) } })
      }
      if (developerOrgs.length > 0) {
        $match.$and!.push({ developerOrg: { $in: developerOrgs.map((id) => new mongoose.Types.ObjectId(id)) } })
      }

    if (includeAllListingTypes) {
      const rentalTermMatch = rentalTerms.length > 0 ? { rentalTerm: { $in: rentalTerms } } : {}
      $match.$and!.push({
        $or: [
          { $and: [{ listingType: { $in: [movininTypes.ListingType.Rent, movininTypes.ListingType.Both] } }, rentalTermMatch] },
          { listingType: { $in: [movininTypes.ListingType.Sale, movininTypes.ListingType.Both] } },
        ],
      })
    } else if (hasRentSelection) {
      $match.$and!.push({ listingType: { $in: [movininTypes.ListingType.Rent, movininTypes.ListingType.Both] } })
      if (rentalTerms.length > 0) {
        $match.$and!.push({ rentalTerm: { $in: rentalTerms } })
      }
    } else if (hasSaleSelection) {
      $match.$and!.push({ listingType: { $in: [movininTypes.ListingType.Sale, movininTypes.ListingType.Both] } })
    }

    if (typeof bedroomsMin === 'number') {
      $match.$and!.push({ bedrooms: { $gte: bedroomsMin } })
    }
    if (typeof areaMin === 'number' || typeof areaMax === 'number') {
      const sizeMatch: { $gte?: number, $lte?: number } = {}
      if (typeof areaMin === 'number') {
        sizeMatch.$gte = areaMin
      }
      if (typeof areaMax === 'number') {
        sizeMatch.$lte = areaMax
      }
      $match.$and!.push({ size: sizeMatch })
    }

    if (features.includes(movininTypes.PropertyFeature.Furnished)) {
      $match.$and!.push({ furnished: true })
    }
    if (features.includes(movininTypes.PropertyFeature.AirConditioning)) {
      $match.$and!.push({ aircon: true })
    }
    if (features.includes(movininTypes.PropertyFeature.PetsAllowed)) {
      $match.$and!.push({ petsAllowed: true })
    }
    if (features.includes(movininTypes.PropertyFeature.Parking)) {
      $match.$and!.push({ parkingSpaces: { $gt: 0 } })
    }
    if (features.includes(movininTypes.PropertyFeature.InCompound)) {
      $match.$and!.push({ developmentId: { $exists: true, $ne: null } })
    }

    if (q) {
      const [matchedLocationValues, matchedDevelopments, matchedOrganizations, matchedUsers] = await Promise.all([
        LocationValue.find({ value: { $regex: q, $options: 'i' } }).select('_id').lean(),
        Development.find({ name: { $regex: q, $options: 'i' } }).select('_id').lean(),
        Organization.find({ name: { $regex: q, $options: 'i' } }).select('_id').lean(),
        User.find({
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { company: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }).select('_id').lean(),
      ])

      const matchedLocationIds = matchedLocationValues.length > 0
        ? await Location.find({ values: { $in: matchedLocationValues.map((value) => value._id) } }).select('_id').lean()
        : []

      const keywordOr: mongoose.QueryFilter<movininTypes.Property>[] = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ]

      if (matchedLocationIds.length > 0) {
        keywordOr.push({ location: { $in: matchedLocationIds.map((location) => location._id) } })
      }
      if (matchedDevelopments.length > 0) {
        keywordOr.push({ developmentId: { $in: matchedDevelopments.map((development) => development._id) } })
      }
      if (matchedOrganizations.length > 0) {
        const orgIds = matchedOrganizations.map((organization) => organization._id)
        keywordOr.push({ developerOrg: { $in: orgIds } })
        keywordOr.push({ brokerageOrg: { $in: orgIds } })
      }
      if (matchedUsers.length > 0) {
        const userIds = matchedUsers.map((user) => user._id)
        keywordOr.push({ agency: { $in: userIds } })
        keywordOr.push({ broker: { $in: userIds } })
        keywordOr.push({ developer: { $in: userIds } })
        keywordOr.push({ owner: { $in: userIds } })
      }

      $match.$and!.push({ $or: keywordOr })
    }

    const priceExpression = hasSaleSelection && !hasRentSelection
      ? { $ifNull: ['$salePrice', '$price'] }
      : includeAllListingTypes
        ? {
          $cond: [
            { $eq: ['$listingType', movininTypes.ListingType.Sale] },
            { $ifNull: ['$salePrice', '$price'] },
            '$price',
          ],
        }
        : '$price'

    const pipeline: mongoose.PipelineStage[] = [
      { $match },
      {
        $lookup: {
          from: 'User',
          let: { userId: '$agency' },
          pipeline: [
            {
              $match: {
                // $expr: { $eq: ['$_id', '$$userId'] },
                $and: [{ $expr: { $eq: ['$_id', '$$userId'] } }, { blacklisted: false }]
              },
            },
          ],
          as: 'agency',
        },
      },
      { $unwind: { path: '$agency', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          searchPrice: priceExpression,
        },
      },
    ]

    if (typeof priceMin === 'number' || typeof priceMax === 'number') {
      const priceMatch: { $gte?: number, $lte?: number } = {}
      if (typeof priceMin === 'number') {
        priceMatch.$gte = priceMin
      }
      if (typeof priceMax === 'number') {
        priceMatch.$lte = priceMax
      }
      pipeline.push({ $match: { searchPrice: priceMatch } })
    }

    if (hasRentSelection && rentFrom && rentTo) {
      pipeline.push(
        // begining of booking overlap check -----------------------------------
        // if property.blockOnPay is true and (from, to) overlaps with paid, confirmed or deposit bookings of the property the property will
        // not be included in search results
        // ----------------------------------------------------------------------
        {
          $lookup: {
            from: 'Booking',
            let: { propertyId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$property', '$$propertyId'] },
                      {
                        // Match only bookings that overlap with the requested rental period
                        // (i.e., NOT completely before or after the requested time range)
                        $not: [
                          {
                            $or: [
                              // Booking ends before the requested rental period starts �+' no overlap
                              { $lt: ['$to', rentFrom] },
                              // Booking starts after the requested rental period ends �+' no overlap
                              { $gt: ['$from', rentTo] }
                            ]
                          }
                        ]
                      },
                      {
                        // include Paid, Reserved and Deposit bookings
                        $in: ['$status', [
                          movininTypes.BookingStatus.Paid,
                          movininTypes.BookingStatus.Reserved,
                          movininTypes.BookingStatus.Deposit,
                        ]]
                      },
                    ]
                  }
                }
              }
            ],
            as: 'overlappingBookings'
          }
        },
        {
          $match: {
            $expr: {
              $or: [
                { $eq: [{ $ifNull: ['$blockOnPay', false] }, false] },
                { $eq: [{ $size: '$overlappingBookings' }, 0] }
              ]
            }
          }
        },
        // end of booking overlap check -----------------------------------
      )
    }

    const sortStage: mongoose.PipelineStage.Sort['$sort'] = sort === movininTypes.PropertySort.PriceAsc
      ? { searchPrice: 1, updatedAt: -1, _id: 1 }
      : sort === movininTypes.PropertySort.PriceDesc
        ? { searchPrice: -1, updatedAt: -1, _id: 1 }
        : { updatedAt: -1, _id: 1 }

    pipeline.push({
      $facet: {
        resultData: [{ $sort: sortStage }, { $skip: (page - 1) * size }, { $limit: size }],
        pageInfo: [
          {
            $count: 'totalRecords',
          },
        ],
      },
    })

    const data = await Property.aggregate(pipeline, { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } })
    for (const property of data[0].resultData) {
      if (property.agency) {
        const { _id, fullName, avatar } = property.agency
        property.agency = { _id, fullName, avatar }
      }
    }

    res.json(data)
  } catch (err) {
    logger.error(`[property.getFrontendProperties] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get published units for a development (Frontend/Public).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getFrontendDevelopmentUnits = async (req: Request, res: Response) => {
  try {
    const developmentId = helper.normalizeParam(req.params.developmentId) as string
    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    if (!helper.isValidObjectId(developmentId)) {
      throw new Error('params.developmentId is not valid')
    }

    const $match: mongoose.QueryFilter<movininTypes.Property> = {
      $and: [
        { developmentId: new mongoose.Types.ObjectId(developmentId) },
        { listingStatus: movininTypes.ListingStatus.Published },
        { hidden: false },
        {
          $or: [
            { name: { $regex: keyword, $options: options } },
            { description: { $regex: keyword, $options: options } },
          ],
        },
      ],
    }

    const data = await Property.aggregate(
      [
        { $match },
        {
          $facet: {
            resultData: [{ $sort: { updatedAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
            pageInfo: [
              {
                $count: 'totalRecords',
              },
            ],
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    res.json(data)
  } catch (err) {
    logger.error(`[property.getFrontendDevelopmentUnits] ${i18n.t('DB_ERROR')} ${req.params.developmentId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

