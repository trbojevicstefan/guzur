import 'dotenv/config'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import * as logger from '../utils/logger'
import * as authHelper from '../utils/authHelper'
import User from '../models/User'

type SeedUser = {
  email: string
  fullName: string
  password: string
  type: movininTypes.UserType
  company?: string
  licenseId?: string
  serviceAreas?: string[]
  website?: string
  approved?: boolean
}

const users: SeedUser[] = [
  {
    email: 'admin.test@guzur.com',
    fullName: 'Guzur Admin',
    password: 'Test1234!',
    type: movininTypes.UserType.Admin,
    approved: true,
  },
  {
    email: 'broker.test@guzur.com',
    fullName: 'Guzur Broker',
    password: 'Test1234!',
    type: movininTypes.UserType.Broker,
    company: 'Guzur Brokerage',
    licenseId: 'BRK-0001',
    serviceAreas: ['Greater Cairo', 'Fifth Settlement'],
    website: 'https://broker.guzur.com',
    approved: false,
  },
  {
    email: 'developer.test@guzur.com',
    fullName: 'Guzur Developer',
    password: 'Test1234!',
    type: movininTypes.UserType.Developer,
    company: 'Guzur Developments',
    licenseId: 'DEV-0001',
    serviceAreas: ['North Coast', 'Red Sea'],
    website: 'https://developer.guzur.com',
    approved: false,
  },
  {
    email: 'owner.test@guzur.com',
    fullName: 'Guzur Owner',
    password: 'Test1234!',
    type: movininTypes.UserType.Owner,
    company: 'Guzur Owner',
    licenseId: 'OWN-0001',
    serviceAreas: ['6th of October'],
    website: 'https://owner.guzur.com',
    approved: false,
  },
]

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)
  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  for (const record of users) {
    await User.deleteOne({ email: record.email })

    const passwordHash = await authHelper.hashPassword(record.password)
    const user = new User({
      fullName: record.fullName,
      email: record.email,
      password: passwordHash,
      language: env.DEFAULT_LANGUAGE,
      type: record.type,
      active: true,
      verified: true,
      approved: record.approved ?? false,
      onboardingCompleted: true,
      company: record.company,
      licenseId: record.licenseId,
      serviceAreas: record.serviceAreas || [],
      website: record.website,
    })
    await user.save()
  }

  logger.info('Seeded test accounts successfully')
  process.exit(0)
} catch (err) {
  logger.error('Failed to seed test accounts:', err)
  process.exit(1)
}
