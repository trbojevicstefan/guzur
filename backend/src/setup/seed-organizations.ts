import 'dotenv/config'
import { nanoid } from 'nanoid'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import User from '../models/User'
import Organization from '../models/Organization'
import OrgMembership from '../models/OrgMembership'
import Property from '../models/Property'
import Development from '../models/Development'

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const ensureUniqueSlug = async (base: string): Promise<string> => {
  const slugBase = slugify(base) || 'org'
  let slug = `${slugBase}-${nanoid(6)}`
  let exists = await Organization.exists({ slug })
  while (exists) {
    slug = `${slugBase}-${nanoid(6)}`
    exists = await Organization.exists({ slug })
  }
  return slug
}

const createOrgForUser = async (user: any) => {
  const userType = user.type as movininTypes.UserType | undefined
  if (![movininTypes.UserType.Broker, movininTypes.UserType.Developer].includes(userType as movininTypes.UserType)) {
    return null
  }

  const orgType = userType === movininTypes.UserType.Broker
    ? movininTypes.OrganizationType.Brokerage
    : movininTypes.OrganizationType.Developer
  const name = helper.trim(user.company || user.fullName, ' ')
  const slug = await ensureUniqueSlug(name || (orgType === movininTypes.OrganizationType.Brokerage ? 'brokerage' : 'developer'))

  const org = new Organization({
    name: name || user.fullName,
    slug,
    type: orgType,
    description: user.bio,
    email: user.email,
    phone: user.phone,
    website: user.website,
    location: user.location,
    serviceAreas: user.serviceAreas || [],
    verified: user.verified,
    approved: true,
    active: true,
    createdBy: user._id,
    seats: 10,
    plan: 'default',
  })

  await org.save()

  const membership = new OrgMembership({
    org: org._id,
    user: user._id,
    role: movininTypes.OrgMemberRole.OwnerAdmin,
    status: movininTypes.OrgMemberStatus.Active,
    invitedBy: user._id,
    invitedAt: new Date(),
    acceptedAt: new Date(),
  })
  await membership.save()

  user.primaryOrg = org._id
  user.orgRole = movininTypes.OrgMemberRole.OwnerAdmin
  await user.save()

  return org
}

const ensureMembership = async (user: any) => {
  if (!user.primaryOrg) {
    return
  }
  const existing = await OrgMembership.findOne({ org: user.primaryOrg, user: user._id })
  if (!existing) {
    const membership = new OrgMembership({
      org: user.primaryOrg,
      user: user._id,
      role: movininTypes.OrgMemberRole.OwnerAdmin,
      status: movininTypes.OrgMemberStatus.Active,
      invitedBy: user._id,
      invitedAt: new Date(),
      acceptedAt: new Date(),
    })
    await membership.save()
  }
}

const backfillPropertyOrgs = async () => {
  const properties = await Property.find({
    $or: [
      { brokerageOrg: { $exists: false } },
      { brokerageOrg: null },
      { developerOrg: { $exists: false } },
      { developerOrg: null },
    ],
  })
    .select('_id broker agency developer owner brokerageOrg developerOrg')
    .lean()

  for (const property of properties) {
    let nextBrokerageOrg = property.brokerageOrg
    let nextDeveloperOrg = property.developerOrg

    if (!nextBrokerageOrg) {
      const brokerId = property.broker || property.agency
      if (brokerId) {
        const brokerUser = await User.findById(brokerId).select('primaryOrg').lean()
        if (brokerUser?.primaryOrg) {
          nextBrokerageOrg = brokerUser.primaryOrg
        }
      }
    }

    if (!nextDeveloperOrg && property.developer) {
      const developerUser = await User.findById(property.developer).select('primaryOrg').lean()
      if (developerUser?.primaryOrg) {
        nextDeveloperOrg = developerUser.primaryOrg
      }
    }

    if (nextBrokerageOrg || nextDeveloperOrg) {
      await Property.updateOne(
        { _id: property._id },
        {
          $set: {
            ...(nextBrokerageOrg ? { brokerageOrg: nextBrokerageOrg } : {}),
            ...(nextDeveloperOrg ? { developerOrg: nextDeveloperOrg } : {}),
          },
        },
      )
    }
  }
}

const backfillDevelopmentOrgs = async () => {
  const developments = await Development.find({
    $or: [{ developerOrg: { $exists: false } }, { developerOrg: null }],
  })
    .select('_id developer developerOrg')
    .lean()

  for (const development of developments) {
    if (!development.developer) {
      continue
    }
    const developerUser = await User.findById(development.developer).select('primaryOrg').lean()
    if (developerUser?.primaryOrg) {
      await Development.updateOne(
        { _id: development._id },
        { $set: { developerOrg: developerUser.primaryOrg } },
      )
    }
  }
}

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)
  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  const users = await User.find({
    type: { $in: [movininTypes.UserType.Broker, movininTypes.UserType.Developer] },
  })

  for (const user of users) {
    if (!user.primaryOrg) {
      await createOrgForUser(user)
      continue
    }

    const orgExists = await Organization.findById(user.primaryOrg)
    if (!orgExists) {
      user.primaryOrg = undefined
      await user.save()
      await createOrgForUser(user)
      continue
    }

    await ensureMembership(user)
  }

  await backfillPropertyOrgs()
  await backfillDevelopmentOrgs()

  logger.info('Organization seeding complete.')
  process.exit(0)
} catch (err) {
  logger.error('Error during organization seeding:', err)
  process.exit(1)
}
