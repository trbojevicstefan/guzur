import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import Property from '../src/models/Property'

const uri = process.env.MI_DB_URI
if (!uri) throw new Error('MI_DB_URI is not set')

const cdnDir = process.env.MI_CDN_PROPERTIES
if (!cdnDir) throw new Error('MI_CDN_PROPERTIES is not set')
if (!fs.existsSync(cdnDir)) throw new Error(`CDN folder not found: ${cdnDir}`)

const imageFiles = fs
  .readdirSync(cdnDir)
  .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))

await mongoose.connect(uri)

const properties = await Property.find({}).select('_id createdAt').sort({ createdAt: 1, _id: 1 }).lean()
if (imageFiles.length < properties.length) {
  throw new Error(`Not enough images (${imageFiles.length}) for properties (${properties.length})`)
}

// Shuffle images once, then assign sequentially for uniqueness
for (let i = imageFiles.length - 1; i > 0; i -= 1) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[imageFiles[i], imageFiles[j]] = [imageFiles[j], imageFiles[i]]
}

let updated = 0
for (let i = 0; i < properties.length; i += 1) {
  const property = properties[i]
  const image = imageFiles[i]
  const result = await Property.updateOne({ _id: property._id }, { $set: { image } })
  if (result.modifiedCount) updated += 1
}

console.log(`Assigned ${properties.length} unique images to properties (updated ${updated}).`)
console.log('First few assignments:', properties.slice(0, 5).map((p, idx) => ({ id: String(p._id), image: imageFiles[idx] })))

await mongoose.disconnect()
