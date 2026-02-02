import { Request, Response } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import asyncFs from 'fs/promises'
import escapeStringRegexp from 'escape-string-regexp'
import nodemailer from 'nodemailer'
import { nanoid } from 'nanoid'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import * as helper from '../utils/helper'
import * as authHelper from '../utils/authHelper'
import * as mailHelper from '../utils/mailHelper'
import * as logger from '../utils/logger'
import i18n from '../lang/i18n'
import Organization from '../models/Organization'
import OrgMembership from '../models/OrgMembership'
import User from '../models/User'
import Token from '../models/Token'

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

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
  if (user.type === movininTypes.UserType.Admin) {
    return true
  }

  if (!helper.isValidObjectId(orgId)) {
    return false
  }

  const membership = await OrgMembership.findOne({
    org: new mongoose.Types.ObjectId(orgId),
    user: user._id,
    status: movininTypes.OrgMemberStatus.Active,
    role: { $in: [movininTypes.OrgMemberRole.OwnerAdmin, movininTypes.OrgMemberRole.Admin] },
  })

  return Boolean(membership)
}

/**
 * Create an organization (admin only).
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user || user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    const { body }: { body: movininTypes.CreateOrganizationPayload } = req
    if (!body.name || !body.type) {
      throw new Error('Missing required fields')
    }

    const slugBase = slugify(body.slug || body.name)
    const slug = `${slugBase || 'org'}-${nanoid(6)}`

    const org = new Organization({
      ...body,
      slug,
      createdBy: user._id,
    })

    await org.save()
    res.json(org)
  } catch (err) {
    logger.error(`[organization.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update organization (admin or org admin).
 */
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    const { body }: { body: movininTypes.UpdateOrganizationPayload } = req
    if (!body._id || !helper.isValidObjectId(body._id)) {
      throw new Error('Organization id is not valid')
    }

    if (!(await canManageOrg(user, body._id))) {
      res.sendStatus(403)
      return
    }

    const org = await Organization.findById(body._id)
    if (!org) {
      res.sendStatus(204)
      return
    }

    const moveTempImage = async (image?: string, prefix?: string) => {
      if (!image) {
        return undefined
      }
      if (image.startsWith('http')) {
        return image
      }
      const tempPath = path.join(env.CDN_TEMP_USERS, image)
      if (await helper.pathExists(tempPath)) {
        const filename = `${prefix || org._id}_${Date.now()}${path.extname(image)}`
        const newPath = path.join(env.CDN_USERS, filename)
        await asyncFs.rename(tempPath, newPath)
        return filename
      }
      return image
    }

    if (body.name) {
      org.name = body.name
    }
    if (body.slug) {
      org.slug = body.slug
    }
    org.description = body.description ?? org.description
    if (typeof body.logo !== 'undefined') {
      const nextLogo = await moveTempImage(body.logo || undefined, `${org._id}_logo`)
      org.logo = nextLogo ?? org.logo
    }
    if (typeof body.cover !== 'undefined') {
      const nextCover = await moveTempImage(body.cover || undefined, `${org._id}_cover`)
      org.cover = nextCover ?? org.cover
    }
    org.email = body.email ?? org.email
    org.phone = body.phone ?? org.phone
    org.website = body.website ?? org.website
    org.location = body.location ?? org.location
    org.serviceAreas = body.serviceAreas ?? org.serviceAreas
    if (typeof body.verified !== 'undefined') {
      org.verified = body.verified
    }
    if (typeof body.approved !== 'undefined') {
      org.approved = body.approved
    }
    if (typeof body.active !== 'undefined') {
      org.active = body.active
    }
    org.seats = body.seats ?? org.seats
    org.plan = body.plan ?? org.plan
    org.expiresAt = body.expiresAt ?? org.expiresAt

    await org.save()
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[organization.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete organization (admin only).
 */
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user || user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    const id = helper.normalizeParam(req.params.id) as string
    if (!helper.isValidObjectId(id)) {
      throw new Error('Organization id is not valid')
    }

    await OrgMembership.deleteMany({ org: new mongoose.Types.ObjectId(id) })
    await Organization.deleteOne({ _id: new mongoose.Types.ObjectId(id) })
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[organization.delete] ${i18n.t('DB_ERROR')} ${req.params.id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get organization (admin or org member).
 */
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    const id = helper.normalizeParam(req.params.id) as string
    if (!helper.isValidObjectId(id)) {
      throw new Error('Organization id is not valid')
    }

    if (user.type !== movininTypes.UserType.Admin) {
      const membership = await OrgMembership.findOne({
        org: new mongoose.Types.ObjectId(id),
        user: user._id,
        status: movininTypes.OrgMemberStatus.Active,
      })
      if (!membership) {
        res.sendStatus(403)
        return
      }
    }

    const org = await Organization.findById(id)
    if (!org) {
      res.sendStatus(204)
      return
    }
    res.json(org)
  } catch (err) {
    logger.error(`[organization.get] ${i18n.t('DB_ERROR')} ${req.params.id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get organizations (admin).
 */
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user || user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    const keyword: string = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'
    const page: number = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size: number = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const type = helper.normalizeParam(req.query.type as string | string[] | undefined)

    const $match: mongoose.QueryFilter<env.Organization> = {
      $and: [
        {
          $or: [
            { name: { $regex: keyword, $options: options } },
            { email: { $regex: keyword, $options: options } },
          ],
        },
      ],
    }

    if (type && Object.values(movininTypes.OrganizationType).includes(type as movininTypes.OrganizationType)) {
      $match.$and!.push({ type })
    }

    const orgs = await Organization.aggregate([
      { $match },
      {
        $facet: {
          resultData: [{ $sort: { name: 1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
          pageInfo: [{ $count: 'totalRecords' }],
        },
      },
    ])

    res.json(orgs)
  } catch (err) {
    logger.error(`[organization.getOrganizations] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get public organizations by type.
 */
export const getFrontendOrganizations = async (req: Request, res: Response) => {
  try {
    const type = helper.normalizeParam(req.params.type) as string
    const page: number = Number.parseInt(helper.normalizeParam(req.params.page) ?? '0', 10)
    const size: number = Number.parseInt(helper.normalizeParam(req.params.size) ?? '0', 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const $match: mongoose.QueryFilter<env.Organization> = {
      $and: [
        { approved: true },
        { active: true },
      ],
    }

    if (Object.values(movininTypes.OrganizationType).includes(type as movininTypes.OrganizationType)) {
      $match.$and!.push({ type })
    }
    if (keyword) {
      $match.$and!.push({ name: { $regex: keyword, $options: options } })
    }

    const orgs = await Organization.aggregate([
      { $match },
      {
        $facet: {
          resultData: [{ $sort: { name: 1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
          pageInfo: [{ $count: 'totalRecords' }],
        },
      },
    ])

    res.json(orgs)
  } catch (err) {
    logger.error(`[organization.getFrontendOrganizations] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get public organization members.
 */
export const getFrontendOrgMembers = async (req: Request, res: Response) => {
  try {
    const orgId = helper.normalizeParam(req.params.orgId) as string
    if (!helper.isValidObjectId(orgId)) {
      throw new Error('Organization id is not valid')
    }

    const members = await OrgMembership.find({
      org: new mongoose.Types.ObjectId(orgId),
      status: movininTypes.OrgMemberStatus.Active,
    })
      .populate({ path: 'user', select: '_id fullName email phone avatar type' })
      .sort({ createdAt: 1, _id: 1 })
      .lean()

    res.json(members)
  } catch (err) {
    logger.error(`[organization.getFrontendOrgMembers] ${i18n.t('DB_ERROR')} ${req.params.orgId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get public organization by id.
 */
export const getFrontendOrganization = async (req: Request, res: Response) => {
  try {
    const id = helper.normalizeParam(req.params.id) as string
    if (!helper.isValidObjectId(id)) {
      throw new Error('Organization id is not valid')
    }

    const org = await Organization.findOne({ _id: id, approved: true, active: true })
    if (!org) {
      res.sendStatus(204)
      return
    }
    res.json(org)
  } catch (err) {
    logger.error(`[organization.getFrontendOrganization] ${i18n.t('DB_ERROR')} ${req.params.id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get public organization by slug.
 */
export const getFrontendOrganizationBySlug = async (req: Request, res: Response) => {
  try {
    const slug = helper.normalizeParam(req.params.slug) as string
    const org = await Organization.findOne({ slug, approved: true, active: true })
    if (!org) {
      res.sendStatus(204)
      return
    }
    res.json(org)
  } catch (err) {
    logger.error(`[organization.getFrontendOrganizationBySlug] ${i18n.t('DB_ERROR')} ${req.params.slug}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get org members.
 */
export const getOrgMembers = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    const orgId = helper.normalizeParam(req.params.orgId) as string
    if (!helper.isValidObjectId(orgId)) {
      throw new Error('Organization id is not valid')
    }

    if (!(await canManageOrg(user, orgId)) && user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    const members = await OrgMembership.find({ org: new mongoose.Types.ObjectId(orgId) })
      .populate({ path: 'user', select: '_id fullName email phone avatar type' })
      .sort({ createdAt: 1, _id: 1 })
      .lean()

    res.json(members)
  } catch (err) {
    logger.error(`[organization.getOrgMembers] ${i18n.t('DB_ERROR')} ${req.params.orgId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Invite a new org member (org admin).
 */
export const inviteOrgMember = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.InviteOrgMemberPayload } = req
  try {
    const user = await getRequestUser(req)
    if (!user) {
      res.sendStatus(401)
      return
    }

    if (!helper.isValidObjectId(body.org)) {
      throw new Error('Organization id is not valid')
    }

    if (!(await canManageOrg(user, body.org)) && user.type !== movininTypes.UserType.Admin) {
      res.sendStatus(403)
      return
    }

    const org = await Organization.findById(body.org)
    if (!org) {
      res.sendStatus(204)
      return
    }

    const email = helper.trim(body.email, ' ')
    if (!helper.isValidEmail(email)) {
      throw new Error('Email is not valid')
    }

    const targetType = org.type === movininTypes.OrganizationType.Brokerage
      ? movininTypes.UserType.Broker
      : movininTypes.UserType.Developer

    let invitedUser = await User.findOne({ email })
    if (invitedUser && invitedUser.type !== targetType && invitedUser.type !== movininTypes.UserType.Admin) {
      res.status(400).send('User type not allowed for this organization')
      return
    }

    if (!invitedUser) {
      invitedUser = new User({
        fullName: body.fullName,
        email,
        phone: body.phone,
        language: body.language || env.DEFAULT_LANGUAGE,
        active: false,
        verified: false,
        approved: false,
        blacklisted: false,
        type: targetType,
      })
      await invitedUser.save()
    }

    const existingMembership = await OrgMembership.findOne({ org: org._id, user: invitedUser._id })
    if (existingMembership) {
      existingMembership.role = body.role
      existingMembership.title = body.title
      existingMembership.status = invitedUser.active ? movininTypes.OrgMemberStatus.Active : movininTypes.OrgMemberStatus.Invited
      await existingMembership.save()
    } else {
      const membership = new OrgMembership({
        org: org._id,
        user: invitedUser._id,
        role: body.role,
        title: body.title,
        status: invitedUser.active ? movininTypes.OrgMemberStatus.Active : movininTypes.OrgMemberStatus.Invited,
        invitedBy: user._id,
        invitedAt: new Date(),
        acceptedAt: invitedUser.active ? new Date() : undefined,
      })
      await membership.save()
    }

    if (!invitedUser.active) {
      const token = new Token({ user: invitedUser._id, token: helper.generateToken() })
      await token.save()

      i18n.locale = invitedUser.language || env.DEFAULT_LANGUAGE
      const mailOptions: nodemailer.SendMailOptions = {
        from: env.SMTP_FROM,
        to: invitedUser.email,
        subject: i18n.t('ACCOUNT_ACTIVATION_SUBJECT'),
        html:
          `<p>${i18n.t('HELLO')}${invitedUser.fullName},<br><br>
          ${i18n.t('ACCOUNT_ACTIVATION_LINK')}<br><br>
          ${helper.joinURL(env.FRONTEND_HOST, 'activate')}/?u=${encodeURIComponent(invitedUser._id.toString())}&e=${encodeURIComponent(invitedUser.email)}&t=${encodeURIComponent(token.token)}<br><br>
          ${i18n.t('REGARDS')}<br></p>`,
      }

      await mailHelper.sendMail(mailOptions)
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[organization.invite] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
