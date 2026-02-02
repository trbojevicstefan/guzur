import escapeStringRegexp from 'escape-string-regexp'
import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import i18n from '../lang/i18n'
import Lead from '../models/Lead'
import Property from '../models/Property'
import User from '../models/User'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as notificationHelper from '../utils/notificationHelper'

/**
 * Create Lead.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreateLeadPayload } = req

  try {
    const { property, listingType, name, email, phone, message, source } = body

    if (property && !helper.isValidObjectId(property)) {
      throw new Error('body.property is not valid')
    }
    if (!name) {
      throw new Error('body.name is not valid')
    }

    let assignedTo: mongoose.Types.ObjectId | string | undefined
    let listing: any = null
    if (property) {
      listing = await Property.findById(property).lean()
      if (!listing) {
        logger.error('[lead.create] Property not found:', property)
        res.sendStatus(204)
        return
      }

      assignedTo =
        listing.broker
        || listing.developer
        || listing.owner
        || listing.agency
    }

    const lead = new Lead({
      property,
      listingType: listingType || listing?.listingType || undefined,
      name,
      email,
      phone,
      message,
      source,
      assignedTo,
      status: movininTypes.LeadStatus.New,
    })

    await lead.save()

    if (assignedTo && listing) {
      const recipient = await User.findById(assignedTo)
      if (recipient) {
        const messageText = `New lead from ${name} for ${listing.name}.`
        const link = helper.joinURL(env.FRONTEND_HOST, 'dashboard')
        await notificationHelper.notifyUser(recipient, messageText, link)
      }
    }

    res.json(lead)
  } catch (err) {
    logger.error(`[lead.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update Lead.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.UpdateLeadPayload } = req
  const { _id } = body

  try {
    if (!_id || !helper.isValidObjectId(_id)) {
      throw new Error('body._id is not valid')
    }

    const lead = await Lead.findById(_id)
    if (!lead) {
      logger.error('[lead.update] Lead not found:', _id)
      res.sendStatus(204)
      return
    }

    if (body.status) {
      lead.status = body.status
    }
    if (body.assignedTo) {
      lead.assignedTo = body.assignedTo as any
    }
    if (typeof body.notes !== 'undefined') {
      lead.notes = body.notes
    }

    await lead.save()
    res.json(lead)
  } catch (err) {
    logger.error(`[lead.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Leads.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteLeads = async (req: Request, res: Response) => {
  try {
    const { body }: { body: string[] } = req
    const ids = body.map((id) => id.toString())
    await Lead.deleteMany({ _id: { $in: ids } })
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[lead.deleteLeads] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Lead by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getLead = async (req: Request, res: Response) => {
  const id = helper.normalizeParam(req.params.id) as string

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('params.id is not valid')
    }

    const lead = await Lead.findById(id)
      .populate('property')
      .populate('assignedTo')
      .lean()

    if (!lead) {
      logger.error('[lead.getLead] Lead not found:', id)
      res.sendStatus(204)
      return
    }

    res.json(lead)
  } catch (err) {
    logger.error(`[lead.getLead] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Leads.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getLeads = async (req: Request, res: Response) => {
  try {
    const { body }: { body: movininTypes.GetLeadsPayload } = req
    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const options = 'i'

    const $match: Record<string, any> = {}
    if (body.statuses && body.statuses.length > 0) {
      $match.status = { $in: body.statuses }
    }
    if (body.assignedTo && helper.isValidObjectId(body.assignedTo)) {
      $match.assignedTo = new mongoose.Types.ObjectId(body.assignedTo)
    }
    if (body.property && helper.isValidObjectId(body.property)) {
      $match.property = new mongoose.Types.ObjectId(body.property)
    }
    if (body.listingType) {
      $match.listingType = body.listingType
    }
    if (body.keyword) {
      const keyword = escapeStringRegexp(body.keyword)
      $match.$or = [
        { name: { $regex: keyword, $options: options } },
        { email: { $regex: keyword, $options: options } },
        { phone: { $regex: keyword, $options: options } },
        { message: { $regex: keyword, $options: options } },
      ]
    }

    const data = await Lead.aggregate(
      [
        {
          $lookup: {
            from: 'Property',
            let: { propertyId: '$property' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$propertyId'] },
                },
              },
            ],
            as: 'property',
          },
        },
        { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'User',
            let: { userId: '$assignedTo' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
                },
              },
            ],
            as: 'assignedTo',
          },
        },
        { $unwind: { path: '$assignedTo', preserveNullAndEmptyArrays: true } },
        { $match },
        {
          $facet: {
            resultData: [{ $sort: { createdAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
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
    logger.error(`[lead.getLeads] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
