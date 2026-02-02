import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import i18n from '../lang/i18n'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as authHelper from '../utils/authHelper'
import * as env from '../config/env.config'
import Organization from '../models/Organization'
import OrgMembership from '../models/OrgMembership'
import OrgPartnership from '../models/OrgPartnership'
import User from '../models/User'

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

const canManageOrg = async (user: env.User, orgId: string) => {
  if (!user?._id || !helper.isValidObjectId(orgId)) {
    return false
  }

  if (user.type === movininTypes.UserType.Admin) {
    return true
  }

  const membership = await OrgMembership.findOne({
    org: new mongoose.Types.ObjectId(orgId),
    user: user._id,
    status: movininTypes.OrgMemberStatus.Active,
    role: { $in: [movininTypes.OrgMemberRole.OwnerAdmin, movininTypes.OrgMemberRole.Admin] },
  })

  return !!membership
}

/**
 * Broker requests partnership with a developer organization.
 */
export const requestPartnership = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreateOrgPartnershipPayload } = req
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    const developerOrg = helper.normalizeParam(body.developerOrg)
    const brokerOrg = helper.normalizeParam(body.brokerOrg) || (user.primaryOrg?.toString() || '')
    if (!helper.isValidObjectId(developerOrg) || !helper.isValidObjectId(brokerOrg)) {
      throw new Error('Invalid organization id')
    }

    const developer = await Organization.findById(developerOrg)
    const broker = await Organization.findById(brokerOrg)
    if (!developer || !broker) {
      res.sendStatus(204)
      return
    }

    if (developer.type !== movininTypes.OrganizationType.Developer || broker.type !== movininTypes.OrganizationType.Brokerage) {
      res.status(400).send('Organization type not allowed')
      return
    }

    if (user.type !== movininTypes.UserType.Admin && user.type !== movininTypes.UserType.Broker) {
      res.sendStatus(403)
      return
    }

    if (user.type !== movininTypes.UserType.Admin && user.primaryOrg?.toString() !== broker._id.toString()) {
      res.sendStatus(403)
      return
    }

    const existing = await OrgPartnership.findOne({ brokerOrg: broker._id, developerOrg: developer._id })
    if (existing) {
      res.json(existing)
      return
    }

    const partnership = new OrgPartnership({
      brokerOrg: broker._id,
      developerOrg: developer._id,
      status: movininTypes.OrgPartnershipStatus.Pending,
      message: body.message,
      requestedBy: user._id,
    })
    await partnership.save()
    res.json(partnership)
  } catch (err) {
    logger.error(`[orgPartnership.request] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get partnerships for an organization (broker or developer).
 */
export const getOrgPartnerships = async (req: Request, res: Response) => {
  const orgId = helper.normalizeParam(req.params.orgId) as string
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    if (!helper.isValidObjectId(orgId)) {
      throw new Error('Organization id is not valid')
    }

    if (!(await canManageOrg(user, orgId)) && user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    const partnerships = await OrgPartnership.find({
      $or: [
        { brokerOrg: new mongoose.Types.ObjectId(orgId) },
        { developerOrg: new mongoose.Types.ObjectId(orgId) },
      ],
    })
      .populate({ path: 'brokerOrg', select: '_id name slug type' })
      .populate({ path: 'developerOrg', select: '_id name slug type' })
      .populate({ path: 'requestedBy', select: '_id fullName email' })
      .populate({ path: 'reviewedBy', select: '_id fullName email' })
      .sort({ updatedAt: -1, _id: -1 })
      .lean()

    res.json(partnerships)
  } catch (err) {
    logger.error(`[orgPartnership.get] ${i18n.t('DB_ERROR')} ${orgId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update partnership status (developer org admin).
 */
export const updatePartnership = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.UpdateOrgPartnershipPayload } = req
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    const { _id, status } = body
    if (!helper.isValidObjectId(_id)) {
      throw new Error('Partnership id is not valid')
    }

    const partnership = await OrgPartnership.findById(_id)
    if (!partnership) {
      res.sendStatus(204)
      return
    }

    if (!(await canManageOrg(user, partnership.developerOrg.toString())) && user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    if (!Object.values(movininTypes.OrgPartnershipStatus).includes(status)) {
      throw new Error('Invalid status')
    }

    partnership.status = status
    partnership.reviewedBy = user._id
    partnership.reviewedAt = new Date()
    await partnership.save()

    res.json(partnership)
  } catch (err) {
    logger.error(`[orgPartnership.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
