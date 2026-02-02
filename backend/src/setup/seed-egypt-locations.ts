import 'dotenv/config'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import * as logger from '../utils/logger'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Country from '../models/Country'

const LANGUAGES = env.LANGUAGES

const locationPlan = [
  {
    name: 'Greater Cairo',
    children: ['Fifth Settlement', '6th of October'],
  },
  { name: 'East Coast' },
  { name: 'West Coast' },
  { name: 'North Coast' },
  { name: 'Red Sea' },
]

const getOrCreateLocationValues = async (name: string) => {
  const values = await Promise.all(
    LANGUAGES.map(async (language) => {
      const existing = await LocationValue.findOne({
        language,
        value: { $regex: new RegExp(`^${name}$`, 'i') },
      })
      if (existing) {
        return existing
      }
      const created = new LocationValue({ language, value: name })
      await created.save()
      return created
    }),
  )
  return values
}

const getOrCreateCountry = async (name: string) => {
  const englishValue = await LocationValue.findOne({
    language: 'en',
    value: { $regex: new RegExp(`^${name}$`, 'i') },
  })
  if (englishValue) {
    const existing = await Country.findOne({ values: englishValue._id })
    if (existing) {
      return existing
    }
  }

  const values = await getOrCreateLocationValues(name)
  const country = new Country({ values: values.map((value) => value._id) })
  await country.save()
  return country
}

const getLocationByName = async (name: string) => {
  const value = await LocationValue.findOne({
    language: 'en',
    value: { $regex: new RegExp(`^${name}$`, 'i') },
  })
  if (!value) {
    return null
  }
  return Location.findOne({ values: value._id })
}

const getOrCreateLocation = async (name: string, countryId: string, parentId?: string) => {
  const existing = await getLocationByName(name)
  if (existing) {
    if (parentId && !existing.parentLocation) {
      existing.parentLocation = parentId as any
      await existing.save()
    }
    return existing
  }

  const values = await getOrCreateLocationValues(name)
  const location = new Location({
    country: countryId,
    values: values.map((value) => value._id),
    parentLocation: parentId,
  })
  await location.save()
  return location
}

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)
  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  const country = await getOrCreateCountry('Egypt')

  const rootLocations: Record<string, string> = {}

  for (const entry of locationPlan) {
    const parent = await getOrCreateLocation(entry.name, country._id.toString())
    rootLocations[entry.name] = parent._id.toString()

    if (entry.children?.length) {
      for (const child of entry.children) {
        await getOrCreateLocation(child, country._id.toString(), parent._id.toString())
      }
    }
  }

  logger.info('Seeded Egypt locations successfully')
  process.exit(0)
} catch (err) {
  logger.error('Failed to seed Egypt locations:', err)
  process.exit(1)
}
