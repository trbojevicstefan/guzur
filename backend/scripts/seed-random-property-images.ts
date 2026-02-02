import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import Property from '../src/models/Property'

const uri = process.env.MI_DB_URI
if (!uri) throw new Error('MI_DB_URI is not set')

const cdnDir = process.env.MI_CDN_PROPERTIES
if (!cdnDir) throw new Error('MI_CDN_PROPERTIES is not set')

if (!fs.existsSync(cdnDir)) {
  throw new Error(`MI_CDN_PROPERTIES folder not found: ${cdnDir}`)
}

const imageFiles = fs
  .readdirSync(cdnDir)
  .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))

if (imageFiles.length === 0) {
  throw new Error(`No images found in ${cdnDir}`)
}

const pickRandom = () => imageFiles[Math.floor(Math.random() * imageFiles.length)]

await mongoose.connect(uri)

const properties = await Property.find({}).select('_id').lean()

let updated = 0
for (const property of properties) {
  const image = pickRandom()
  const result = await Property.updateOne({ _id: property._id }, { $set: { image } })
  if (result.modifiedCount) updated += 1
}

console.log(`Randomized images for ${updated} properties using ${imageFiles.length} available images from ${path.resolve(cdnDir)}`)

await mongoose.disconnect()
