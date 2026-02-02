import escapeStringRegexp from 'escape-string-regexp'
import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import i18n from '../lang/i18n'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as authHelper from '../utils/authHelper'
import RfqRequest from '../models/RfqRequest'
import Lead from '../models/Lead'

/**
 * Create RFQ request (public).
 */
export const createRfq = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreateRfqPayload } = req
  try {
    if (!body.name) {
      throw new Error('Name is required')
    }

    const rfq = new RfqRequest({
      ...body,
      status: movininTypes.RfqStatus.New,
    })
    await rfq.save()

    const notesParts = [
      body.location ? `Location: ${body.location}` : null,
      body.propertyType ? `Property type: ${body.propertyType}` : null,
      typeof body.bedrooms === 'number' ? `Bedrooms: ${body.bedrooms}` : null,
      typeof body.bathrooms === 'number' ? `Bathrooms: ${body.bathrooms}` : null,
      typeof body.budget === 'number' ? `Budget: ${body.budget}` : null,
    ].filter(Boolean)

    const lead = new Lead({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      listingType: body.listingType,
      source: 'RFQ',
      status: movininTypes.LeadStatus.New,
      notes: notesParts.length > 0 ? notesParts.join(' | ') : undefined,
    })
    await lead.save()

    res.json(rfq)
  } catch (err) {
    logger.error(`[rfq.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get RFQ requests (admin).
 */
export const getRfqs = async (req: Request, res: Response) => {
  try {
    if (!authHelper.isAdmin(req)) {
      res.sendStatus(403)
      return
    }

    const page = Number.parseInt(helper.normalizeParam(req.params.page) ?? '1', 10)
    const size = Number.parseInt(helper.normalizeParam(req.params.size) ?? '10', 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const status = req.query.status as movininTypes.RfqStatus | undefined

    const $match: Record<string, any> = {}
    if (status && Object.values(movininTypes.RfqStatus).includes(status)) {
      $match.status = status
    }
    if (keyword) {
      $match.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } },
      ]
    }

    const data = await RfqRequest.aggregate(
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
    )

    res.json(data)
  } catch (err) {
    logger.error(`[rfq.getRfqs] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update RFQ status (admin).
 */
export const updateRfq = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.UpdateRfqPayload } = req
  try {
    if (!authHelper.isAdmin(req)) {
      res.sendStatus(403)
      return
    }

    const { _id, status, assignedTo } = body
    if (!_id || !helper.isValidObjectId(_id)) {
      throw new Error('RFQ id is not valid')
    }

    const rfq = await RfqRequest.findById(_id)
    if (!rfq) {
      res.sendStatus(204)
      return
    }

    if (status && Object.values(movininTypes.RfqStatus).includes(status)) {
      rfq.status = status
    }
    if (assignedTo && helper.isValidObjectId(assignedTo)) {
      rfq.assignedTo = new mongoose.Types.ObjectId(assignedTo) as any
    }

    await rfq.save()
    res.json(rfq)
  } catch (err) {
    logger.error(`[rfq.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
