import 'dotenv/config'
import mongoose from 'mongoose'
import Property from '../src/models/Property'
import Location from '../src/models/Location'
import LocationValue from '../src/models/LocationValue'

const cairoLat = 30.0444
const cairoLng = 31.2357
const jitterStep = 0.003
const jitterSpan = 5

const uri = process.env.MI_DB_URI
if (!uri) {
  throw new Error('MI_DB_URI is not set')
}

await mongoose.connect(uri)

const cairoValues = await LocationValue.find({ value: /cairo/i }).lean()
const cairoValueIds = cairoValues.map((v) => v._id)
const cairoLocation = cairoValueIds.length > 0
  ? await Location.findOne({ values: { $in: cairoValueIds } }).lean()
  : null

const cairoLocationId = cairoLocation?._id
if (!cairoLocationId) {
  throw new Error('Could not find a Cairo location to assign')
}

const properties = await Property.find({}).select('_id name').lean()

let index = 0
for (const property of properties) {
  const dx = ((index % (jitterSpan * 2 + 1)) - jitterSpan) * jitterStep
  const dy = ((Math.floor(index / (jitterSpan * 2 + 1)) % (jitterSpan * 2 + 1)) - jitterSpan) * jitterStep

  const latitude = cairoLat + dy
  const longitude = cairoLng + dx

  await Property.updateOne(
    { _id: property._id },
    {
      $set: {
        latitude,
        longitude,
        location: cairoLocationId,
      },
    },
  )

  index += 1
}

console.log(`Updated ${properties.length} properties to Cairo coordinates (${String(cairoLocationId)})`)

await mongoose.disconnect()
