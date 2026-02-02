import 'dotenv/config'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import * as logger from '../utils/logger'
import User from '../models/User'
import Property from '../models/Property'

type SchemaPath = {
  enumValues?: string[]
}

const hasSchemaPath = (model: { schema: { path: (value: string) => unknown } }, path: string) =>
  Boolean(model.schema.path(path))

try {
  const execute = process.argv.includes('--execute')
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  const logRoleCounts = async (label: string) => {
    const counts = await User.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    const summary = counts.map((item) => `${item._id}:${item.count}`).join(', ')
    logger.info(`${label} user counts by type: ${summary || 'none'}`)
  }

  const logPropertySummary = async (label: string) => {
    const total = await Property.countDocuments()
    logger.info(`${label} property total: ${total}`)
  }

  logger.info(`Migration mode: ${execute ? 'EXECUTE' : 'DRY_RUN'}`)

  await logRoleCounts('Before')
  await logPropertySummary('Before')

  const userTypePath = User.schema.path('type') as SchemaPath | undefined
  const allowedUserTypes = userTypePath?.enumValues || []
  const supportsBrokerRole = allowedUserTypes.includes('BROKER')

  const agencyCount = await User.countDocuments({ type: movininTypes.UserType.Agency })
  logger.info(`Users with type AGENCY: ${agencyCount}`)

  if (execute) {
    if (supportsBrokerRole) {
      const result = await User.updateMany(
        { type: movininTypes.UserType.Agency },
        { $set: { type: 'BROKER' } },
      )
      logger.info(`Updated user roles: ${result.modifiedCount}`)
    } else {
      logger.warn('User.type enum does not include BROKER. Skipping role migration.')
    }
  } else {
    logger.info('Dry-run: role migration skipped.')
  }

  const supportsListingType = hasSchemaPath(Property, 'listingType')
  const supportsListingStatus = hasSchemaPath(Property, 'listingStatus')
  const supportsSalePrice = hasSchemaPath(Property, 'salePrice')
  const supportsDeveloper = hasSchemaPath(Property, 'developer')
  const supportsOwner = hasSchemaPath(Property, 'owner')
  const supportsDevelopmentId = hasSchemaPath(Property, 'developmentId')
  const supportsBroker = hasSchemaPath(Property, 'broker')

  const propertyDefaults: Record<string, unknown> = {}
  if (supportsListingType) {
    propertyDefaults.listingType = 'RENT'
  }
  if (supportsListingStatus) {
    propertyDefaults.listingStatus = 'PUBLISHED'
  }
  if (supportsSalePrice) {
    propertyDefaults.salePrice = null
  }
  if (supportsDeveloper) {
    propertyDefaults.developer = null
  }
  if (supportsOwner) {
    propertyDefaults.owner = null
  }
  if (supportsDevelopmentId) {
    propertyDefaults.developmentId = null
  }

  if (!supportsListingType && !supportsListingStatus && !supportsSalePrice && !supportsDeveloper
    && !supportsOwner && !supportsDevelopmentId && !supportsBroker) {
    logger.warn('No listing fields detected on Property schema. Skipping property backfill.')
    process.exit(0)
  }

  if (supportsListingType) {
    const missingListingType = await Property.countDocuments({ listingType: { $exists: false } })
    logger.info(`Properties missing listingType: ${missingListingType}`)
  }

  if (supportsListingStatus) {
    const missingListingStatus = await Property.countDocuments({ listingStatus: { $exists: false } })
    logger.info(`Properties missing listingStatus: ${missingListingStatus}`)
  }

  if (supportsBroker) {
    const missingBroker = await Property.countDocuments({ broker: { $exists: false } })
    logger.info(`Properties missing broker: ${missingBroker}`)
  }

  if (execute) {
    const orConditions: Record<string, unknown>[] = []
    if (supportsListingType) {
      orConditions.push({ listingType: { $exists: false } })
    }
    if (supportsListingStatus) {
      orConditions.push({ listingStatus: { $exists: false } })
    }
    if (supportsSalePrice) {
      orConditions.push({ salePrice: { $exists: false } })
    }
    if (supportsDeveloper) {
      orConditions.push({ developer: { $exists: false } })
    }
    if (supportsOwner) {
      orConditions.push({ owner: { $exists: false } })
    }
    if (supportsDevelopmentId) {
      orConditions.push({ developmentId: { $exists: false } })
    }
    if (supportsBroker) {
      orConditions.push({ broker: { $exists: false } })
    }

    const filter = orConditions.length > 0 ? { $or: orConditions } : {}

    if (supportsBroker) {
      const updatePipeline = [{
        $set: {
          ...propertyDefaults,
          broker: { $ifNull: ['$broker', '$agency'] },
        },
      }]
      const result = await Property.updateMany(filter, updatePipeline, { updatePipeline: true })
      logger.info(`Updated properties: ${result.modifiedCount}`)
    } else if (Object.keys(propertyDefaults).length > 0) {
      const result = await Property.updateMany(filter, { $set: propertyDefaults })
      logger.info(`Updated properties: ${result.modifiedCount}`)
    } else {
      logger.info('No property updates required.')
    }
  } else {
    logger.info('Dry-run: property backfill skipped.')
  }

  if (execute) {
    await logRoleCounts('After')
    await logPropertySummary('After')
  }

  process.exit(0)
} catch (err) {
  logger.error('Error during migration:', err)
  process.exit(1)
}
