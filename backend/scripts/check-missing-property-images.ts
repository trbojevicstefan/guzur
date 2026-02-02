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

await mongoose.connect(uri)

const properties = await Property.find({}).select('_id name image').lean()
const missing = properties.filter((p) => !p.image || !fs.existsSync(path.join(cdnDir, p.image)))

console.log({ total: properties.length, missing: missing.length })
console.log(missing.map((m) => ({ id: String(m._id), name: m.name, image: m.image })))

await mongoose.disconnect()
