import 'dotenv/config'
import mongoose from 'mongoose'
import Property from '../src/models/Property'

const uri = process.env.MI_DB_URI
if (!uri) {
  throw new Error('MI_DB_URI is not set')
}

const imageName = process.env.SEED_IMAGE_NAME || 'image.png'

await mongoose.connect(uri)

const result = await Property.updateMany(
  {},
  {
    $set: {
      image: imageName,
    },
  },
)

console.log(`Updated images for ${result.modifiedCount ?? 0} properties to ${imageName}`)

await mongoose.disconnect()
