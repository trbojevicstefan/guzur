import escapeStringRegexp from 'escape-string-regexp'
import asyncFs from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import i18n from '../lang/i18n'
import Development from '../models/Development'
import User from '../models/User'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'

const isRemoteAsset = (value: string) => /^https?:\/\//i.test(value)

const normalizeAssetReference = (value?: string | null) => {
  if (!value) {
    return ''
  }
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return ''
  }
  return isRemoteAsset(trimmed) ? trimmed : path.basename(trimmed)
}

const parseDate = (value?: Date | string) => {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date
}

const promoteAsset = async (developmentId: string, assetRef: string, suffix: string) => {
  const normalized = normalizeAssetReference(assetRef)
  if (!normalized) {
    return null
  }
  if (isRemoteAsset(normalized)) {
    return normalized
  }

  const tempPath = path.join(env.CDN_TEMP_PROPERTIES, normalized)
  if (await helper.pathExists(tempPath)) {
    const filename = `${developmentId}_${nanoid()}_${Date.now()}_${suffix}${path.extname(normalized)}`
    const newPath = path.join(env.CDN_PROPERTIES, filename)
    await asyncFs.rename(tempPath, newPath)
    return filename
  }

  const storedPath = path.join(env.CDN_PROPERTIES, normalized)
  if (await helper.pathExists(storedPath)) {
    return normalized
  }

  return null
}

const removeLocalAsset = async (assetRef?: string | null) => {
  const normalized = normalizeAssetReference(assetRef)
  if (!normalized || isRemoteAsset(normalized)) {
    return
  }
  const storedPath = path.join(env.CDN_PROPERTIES, normalized)
  if (await helper.pathExists(storedPath)) {
    await asyncFs.unlink(storedPath)
  }
}

/**
 * Create Development.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreateDevelopmentPayload } = req

  try {
    const { name, developer } = body
    if (!name || !developer || !helper.isValidObjectId(developer)) {
      throw new Error('Invalid development payload')
    }

    let resolvedDeveloperOrg = body.developerOrg
    if (!resolvedDeveloperOrg && helper.isValidObjectId(developer)) {
      const developerUser = await User.findById(developer).lean()
      if (developerUser && developerUser.primaryOrg) {
        resolvedDeveloperOrg = developerUser.primaryOrg.toString()
      }
    }

    const development = new Development({
      ...body,
      developerOrg: resolvedDeveloperOrg,
      completionDate: parseDate(body.completionDate),
      images: [],
      masterPlan: undefined,
      floorPlans: [],
    })
    await development.save()

    const maxImages = 10
    const maxFloorPlans = 10
    const inputImages = Array.isArray(body.images) ? body.images.slice(0, maxImages) : []
    const nextImages: string[] = []
    let imageIndex = 1
    for (const imageRef of inputImages) {
      const moved = await promoteAsset(String(development._id), imageRef, `img_${imageIndex}`)
      if (moved) {
        nextImages.push(moved)
      }
      imageIndex += 1
    }
    development.images = nextImages

    if (body.masterPlan) {
      const nextMaster = await promoteAsset(String(development._id), body.masterPlan, 'master')
      if (nextMaster) {
        development.masterPlan = nextMaster
      }
    }

    if (Array.isArray(body.floorPlans) && body.floorPlans.length > 0) {
      const nextPlans: string[] = []
      const limitedPlans = body.floorPlans.slice(0, maxFloorPlans)
      let index = 1
      for (const plan of limitedPlans) {
        const moved = await promoteAsset(String(development._id), plan, `floor_${index}`)
        if (moved) {
          nextPlans.push(moved)
        }
        index += 1
      }
      development.floorPlans = nextPlans
    }

    await development.save()
    res.json(development)
  } catch (err) {
    logger.error(`[development.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update Development.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.UpdateDevelopmentPayload } = req
  const { _id } = body

  try {
    if (!_id || !helper.isValidObjectId(_id)) {
      throw new Error('body._id is not valid')
    }

    const development = await Development.findById(_id)
    if (!development) {
      logger.error('[development.update] Development not found:', _id)
      res.sendStatus(204)
      return
    }

    const {
      name,
      description,
      location,
      developer,
      developerOrg,
      unitsCount,
      status,
      completionDate,
      approved,
      images,
      masterPlan,
      floorPlans,
      latitude,
      longitude,
    } = body

    development.name = name
    development.description = description
    development.location = location
    development.developer = developer as any
    let resolvedDeveloperOrg = developerOrg || development.developerOrg
    if (!resolvedDeveloperOrg && developer && helper.isValidObjectId(developer)) {
      const developerUser = await User.findById(developer).lean()
      if (developerUser && developerUser.primaryOrg) {
        resolvedDeveloperOrg = developerUser.primaryOrg.toString()
      }
    }
    development.developerOrg = resolvedDeveloperOrg as any
    development.unitsCount = unitsCount
    development.status = status
    if (completionDate !== undefined) {
      development.completionDate = parseDate(completionDate)
    }
    development.approved = typeof approved === 'boolean' ? approved : development.approved

    const maxImages = 10
    const maxFloorPlans = 10

    if (Array.isArray(images)) {
      const previousImages = (development.images || [])
        .map((imageRef) => normalizeAssetReference(imageRef))
        .filter((imageRef) => Boolean(imageRef))
      const requestedImages = images
        .map((imageRef) => normalizeAssetReference(imageRef))
        .filter((imageRef) => Boolean(imageRef))
        .slice(0, maxImages)

      for (const existing of previousImages) {
        if (!requestedImages.includes(existing)) {
          await removeLocalAsset(existing)
        }
      }

      const nextImages: string[] = []
      let imageIndex = 1
      for (const imageRef of requestedImages) {
        const moved = await promoteAsset(String(development._id), imageRef, `img_${imageIndex}`)
        if (moved) {
          nextImages.push(moved)
        } else {
          nextImages.push(imageRef)
        }
        imageIndex += 1
      }
      development.images = nextImages
    }

    if (masterPlan !== undefined) {
      const previousMasterPlan = normalizeAssetReference(development.masterPlan)
      const requestedMasterPlan = normalizeAssetReference(masterPlan)

      if (!requestedMasterPlan) {
        if (previousMasterPlan) {
          await removeLocalAsset(previousMasterPlan)
          development.masterPlan = undefined
        }
      } else {
        if (requestedMasterPlan !== previousMasterPlan) {
          await removeLocalAsset(previousMasterPlan)
        }

        const nextMaster = await promoteAsset(String(development._id), requestedMasterPlan, 'master')
        development.masterPlan = nextMaster || requestedMasterPlan
      }
    }

    if (Array.isArray(floorPlans)) {
      const previousFloorPlans = (development.floorPlans || [])
        .map((plan) => normalizeAssetReference(plan))
        .filter((plan) => Boolean(plan))
      const requestedFloorPlans = floorPlans
        .map((plan) => normalizeAssetReference(plan))
        .filter((plan) => Boolean(plan))
        .slice(0, maxFloorPlans)

      for (const existing of previousFloorPlans) {
        if (!requestedFloorPlans.includes(existing)) {
          await removeLocalAsset(existing)
        }
      }

      const nextFloorPlans: string[] = []
      let planIndex = 1
      for (const plan of requestedFloorPlans) {
        const moved = await promoteAsset(String(development._id), plan, `floor_${planIndex}`)
        if (moved) {
          nextFloorPlans.push(moved)
        } else {
          nextFloorPlans.push(plan)
        }
        planIndex += 1
      }
      development.floorPlans = nextFloorPlans
    }

    development.latitude = latitude
    development.longitude = longitude

    await development.save()
    res.json(development)
  } catch (err) {
    logger.error(`[development.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Development.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteDevelopment = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('params.id is not valid')
    }

    await Development.deleteOne({ _id: id })
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[development.delete] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Development.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getDevelopment = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('params.id is not valid')
    }

    const development = await Development.findById(id)
      .populate('developer')
      .lean()

    if (!development) {
      logger.error('[development.getDevelopment] Development not found:', id)
      res.sendStatus(204)
      return
    }

    res.json(development)
  } catch (err) {
    logger.error(`[development.getDevelopment] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Developments.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getDevelopments = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const developer = req.query.developer as string | undefined
    const developers = req.query.developers as string | undefined
    const developerOrgs = req.query.developerOrgs as string | undefined
    const status = req.query.status as movininTypes.DevelopmentStatus | undefined

    const $match: Record<string, unknown> = {}
    if (developerOrgs) {
      const ids = developerOrgs.split(',').map((value) => value.trim()).filter((value) => helper.isValidObjectId(value))
      if (ids.length > 0) {
        $match.developerOrg = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
      }
    } else if (developers) {
      const ids = developers.split(',').map((value) => value.trim()).filter((value) => helper.isValidObjectId(value))
      if (ids.length > 0) {
        $match.developer = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
      }
    } else if (developer && helper.isValidObjectId(developer)) {
      $match.developer = new mongoose.Types.ObjectId(developer)
    }
    if (status) {
      $match.status = status
    }
    if (keyword) {
      $match.name = { $regex: keyword, $options: options }
    }

    const data = await Development.aggregate(
      [
        { $match },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$developer' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  fullName: 1,
                  email: 1,
                  avatar: 1,
                },
              },
            ],
            as: 'developer',
          },
        },
        { $unwind: { path: '$developer', preserveNullAndEmptyArrays: true } },
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
    logger.error(`[development.getDevelopments] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Developments (Frontend/Public).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getFrontendDevelopments = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const developer = req.query.developer as string | undefined
    const developers = req.query.developers as string | undefined
    const developerOrgs = req.query.developerOrgs as string | undefined
    const status = req.query.status as movininTypes.DevelopmentStatus | undefined
    const location = req.query.location as string | undefined

    const $match: Record<string, unknown> = {}
    if (developerOrgs) {
      const ids = developerOrgs.split(',').map((value) => value.trim()).filter((value) => helper.isValidObjectId(value))
      if (ids.length > 0) {
        $match.developerOrg = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
      }
    } else if (developers) {
      const ids = developers.split(',').map((value) => value.trim()).filter((value) => helper.isValidObjectId(value))
      if (ids.length > 0) {
        $match.developer = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }
      }
    } else if (developer && helper.isValidObjectId(developer)) {
      $match.developer = new mongoose.Types.ObjectId(developer)
    }
    if (status) {
      $match.status = status
    }
    if (location) {
      $match.location = { $regex: escapeStringRegexp(location), $options: options }
    }
    if (keyword) {
      $match.name = { $regex: keyword, $options: options }
    }

    const data = await Development.aggregate(
      [
        { $match },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$developer' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  fullName: 1,
                  avatar: 1,
                },
              },
            ],
            as: 'developer',
          },
        },
        { $unwind: { path: '$developer', preserveNullAndEmptyArrays: true } },
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
    logger.error(`[development.getFrontendDevelopments] ${i18n.t('DB_ERROR')} ${req.query.s}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Development (Frontend/Public).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getFrontendDevelopment = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('params.id is not valid')
    }

    const development = await Development.findOne({ _id: id, approved: true })
      .populate({
        path: 'developer',
        select: '_id fullName avatar company website',
      })
      .lean()

    if (!development) {
      logger.error('[development.getFrontendDevelopment] Development not found:', id)
      res.sendStatus(204)
      return
    }

    res.json(development)
  } catch (err) {
    logger.error(`[development.getFrontendDevelopment] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
