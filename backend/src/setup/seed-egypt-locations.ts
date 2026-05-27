import 'dotenv/config'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import * as logger from '../utils/logger'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Country from '../models/Country'

const LANGUAGES = env.LANGUAGES

type LocalizedName = {
  en: string
  ar: string
}

type PlannedLocation = {
  name: LocalizedName
  children?: LocalizedName[]
}

const EGYPT_NAME: LocalizedName = {
  en: 'Egypt',
  ar: 'مصر',
}

const locationPlan = [
  {
    name: {
      en: 'Greater Cairo',
      ar: 'القاهرة الكبرى',
    },
    children: [
      { en: 'Fifth Settlement', ar: 'التجمع الخامس' },
      { en: '6th of October', ar: 'السادس من أكتوبر' },
    ],
  },
  {
    name: {
      en: 'East Coast',
      ar: 'الساحل الشرقي',
    },
  },
  {
    name: {
      en: 'West Coast',
      ar: 'الساحل الغربي',
    },
  },
  {
    name: {
      en: 'North Coast',
      ar: 'الساحل الشمالي',
    },
  },
  {
    name: {
      en: 'Red Sea',
      ar: 'البحر الأحمر',
    },
  },
] satisfies PlannedLocation[]

const resolveLocalizedName = (name: LocalizedName, language: string) => name[language as keyof LocalizedName] || name.en

const getOrCreateLocationValues = async (name: LocalizedName) => {
  const values = await Promise.all(
    LANGUAGES.map(async (language) => {
      const value = resolveLocalizedName(name, language)
      const existing = await LocationValue.findOne({
        language,
        value: { $regex: new RegExp(`^${value}$`, 'i') },
      })
      if (existing) {
        return existing
      }
      const created = new LocationValue({ language, value })
      await created.save()
      return created
    }),
  )
  return values
}

const upsertLocalizedValues = async (
  valueIds: string[],
  name: LocalizedName,
) => {
  const values = await LocationValue.find({ _id: { $in: valueIds } })
  const valuesByLanguage = new Map(values.map((value) => [value.language, value]))
  const nextValueIds = [...valueIds]

  for (const language of LANGUAGES) {
    const localizedName = resolveLocalizedName(name, language)
    const existing = valuesByLanguage.get(language)

    if (existing) {
      if (existing.value !== localizedName) {
        existing.value = localizedName
        await existing.save()
      }
      continue
    }

    const created = new LocationValue({
      language,
      value: localizedName,
    })
    await created.save()
    nextValueIds.push(created._id.toString())
  }

  return nextValueIds
}

const getOrCreateCountry = async (name: LocalizedName) => {
  const englishValue = await LocationValue.findOne({
    language: 'en',
    value: { $regex: new RegExp(`^${name.en}$`, 'i') },
  })
  if (englishValue) {
    const existing = await Country.findOne({ values: englishValue._id })
    if (existing) {
      existing.values = await upsertLocalizedValues(
        existing.values.map((value) => value.toString()),
        name,
      ) as any
      await existing.save()
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

const getOrCreateLocation = async (name: LocalizedName, countryId: string, parentId?: string) => {
  const existing = await getLocationByName(name.en)
  if (existing) {
    if (parentId && !existing.parentLocation) {
      existing.parentLocation = parentId as any
    }
    existing.values = await upsertLocalizedValues(
      existing.values.map((value) => value.toString()),
      name,
    ) as any
    await existing.save()
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

  const country = await getOrCreateCountry(EGYPT_NAME)

  const rootLocations: Record<string, string> = {}

  for (const entry of locationPlan) {
    const parent = await getOrCreateLocation(entry.name, country._id.toString())
    rootLocations[entry.name.en] = parent._id.toString()

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
