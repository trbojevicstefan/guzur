import 'dotenv/config'
import { jest } from '@jest/globals'
import request from 'supertest'
import path from 'path'
import url from 'url'
import asyncFs from 'node:fs/promises'
import { nanoid } from 'nanoid'
import * as movininTypes from ':movinin-types'
import * as databaseHelper from '../src/utils/databaseHelper'
import app from '../src/app'
import * as env from '../src/config/env.config'
import * as testHelper from './testHelper'
import * as helper from '../src/utils/helper'
import * as authHelper from '../src/utils/authHelper'
import Development from '../src/models/Development'
import User from '../src/models/User'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MAIN_IMAGE1_PATH = path.resolve(__dirname, './img/main1.jpg')
const ADDITIONAL_IMAGE1_1_PATH = path.resolve(__dirname, './img/additional1-1.jpg')
const ADDITIONAL_IMAGE1_2_PATH = path.resolve(__dirname, './img/additional1-2.jpg')
const MAIN_IMAGE2_PATH = path.resolve(__dirname, './img/main2.jpg')

let DEVELOPER_ID = ''
const DEVELOPMENT_IDS: string[] = []
const TEMP_FILENAMES = new Set<string>()
const PROMOTED_FILENAMES = new Set<string>()

const trackPromoted = (value?: string | null) => {
  if (!value || value.startsWith('http')) {
    return
  }
  PROMOTED_FILENAMES.add(value)
}

const createTempImage = async (sourcePath: string) => {
  const filename = `development-${nanoid()}${path.extname(sourcePath)}`
  const destination = path.join(env.CDN_TEMP_PROPERTIES, filename)
  TEMP_FILENAMES.add(filename)
  await asyncFs.copyFile(sourcePath, destination)
  return filename
}

const createDevelopment = async (
  token: string,
  payload: Partial<movininTypes.CreateDevelopmentPayload> = {},
) => {
  const image1 = await createTempImage(MAIN_IMAGE1_PATH)
  const image2 = await createTempImage(ADDITIONAL_IMAGE1_1_PATH)
  const masterPlan = await createTempImage(ADDITIONAL_IMAGE1_2_PATH)
  const floorPlan = await createTempImage(MAIN_IMAGE2_PATH)
  const body: movininTypes.CreateDevelopmentPayload = {
    name: `Development ${nanoid()}`,
    description: 'Development description',
    location: 'New Cairo',
    developer: DEVELOPER_ID,
    status: movininTypes.DevelopmentStatus.Planning,
    approved: true,
    images: [image1, image2],
    masterPlan,
    floorPlans: [floorPlan],
    ...payload,
  }

  const res = await request(app)
    .post('/api/create-development')
    .set(env.X_ACCESS_TOKEN, token)
    .send(body)
  expect(res.statusCode).toBe(200)
  const development = res.body as movininTypes.Development
  expect(development._id).toBeDefined()
  DEVELOPMENT_IDS.push(development._id as string)
  trackPromoted(development.masterPlan)
  ;(development.images || []).forEach((image) => trackPromoted(image))
  ;(development.floorPlans || []).forEach((plan) => trackPromoted(plan))
  return {
    development,
    source: {
      images: [image1, image2],
      masterPlan,
      floorPlans: [floorPlan],
    },
  }
}

beforeAll(async () => {
  testHelper.initializeLogger()

  await databaseHelper.connect(env.DB_URI, false, false)
  await testHelper.initialize()

  const passwordHash = await authHelper.hashPassword(testHelper.PASSWORD)
  const developer = new User({
    fullName: `Developer ${nanoid()}`,
    email: testHelper.GetRandomEmail(),
    language: testHelper.LANGUAGE,
    password: passwordHash,
    type: movininTypes.UserType.Developer,
    onboardingCompleted: true,
  })
  await developer.save()
  DEVELOPER_ID = developer._id.toString()
})

afterAll(async () => {
  await Development.deleteMany({ _id: { $in: DEVELOPMENT_IDS } })
  for (const filename of PROMOTED_FILENAMES) {
    const filePath = path.join(env.CDN_PROPERTIES, filename)
    if (await helper.pathExists(filePath)) {
      await asyncFs.unlink(filePath)
    }
  }
  for (const filename of TEMP_FILENAMES) {
    const filePath = path.join(env.CDN_TEMP_PROPERTIES, filename)
    if (await helper.pathExists(filePath)) {
      await asyncFs.unlink(filePath)
    }
  }
  if (DEVELOPER_ID) {
    await User.deleteOne({ _id: DEVELOPER_ID })
  }

  await testHelper.close()
  await databaseHelper.close()
})

afterEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})

describe('POST /api/create-development', () => {
  it('should promote temporary development assets to permanent CDN storage', async () => {
    const token = await testHelper.signinAsAdmin()
    const { development, source } = await createDevelopment(token)

    expect(development.images).toHaveLength(2)
    expect(development.masterPlan).toBeDefined()
    expect(development.floorPlans).toHaveLength(1)

    const promotedMainImage = (development.images || [])[0]
    const promotedGalleryImage = (development.images || [])[1]
    const promotedMasterPlan = development.masterPlan as string
    const promotedFloorPlan = (development.floorPlans || [])[0]

    expect(promotedMainImage).not.toBe(source.images[0])
    expect(promotedGalleryImage).not.toBe(source.images[1])
    expect(promotedMasterPlan).not.toBe(source.masterPlan)
    expect(promotedFloorPlan).not.toBe(source.floorPlans[0])

    expect(promotedMainImage.startsWith(`${development._id}_`)).toBeTruthy()
    expect(promotedGalleryImage.startsWith(`${development._id}_`)).toBeTruthy()
    expect(promotedMasterPlan.startsWith(`${development._id}_`)).toBeTruthy()
    expect(promotedFloorPlan.startsWith(`${development._id}_`)).toBeTruthy()

    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, promotedMainImage))).toBeTruthy()
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, promotedGalleryImage))).toBeTruthy()
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, promotedMasterPlan))).toBeTruthy()
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, promotedFloorPlan))).toBeTruthy()

    expect(await helper.pathExists(path.join(env.CDN_TEMP_PROPERTIES, source.images[0]))).toBeFalsy()
    expect(await helper.pathExists(path.join(env.CDN_TEMP_PROPERTIES, source.images[1]))).toBeFalsy()
    expect(await helper.pathExists(path.join(env.CDN_TEMP_PROPERTIES, source.masterPlan))).toBeFalsy()
    expect(await helper.pathExists(path.join(env.CDN_TEMP_PROPERTIES, source.floorPlans[0]))).toBeFalsy()

    await testHelper.signout(token)
  })
})

describe('PUT /api/update-development', () => {
  it('should skip missing image and floor plan references instead of persisting broken filenames', async () => {
    const token = await testHelper.signinAsAdmin()
    const { development } = await createDevelopment(token)
    const unknownImage = `${nanoid()}.jpg`
    const unknownFloorPlan = `${nanoid()}.jpg`
    const payload: movininTypes.UpdateDevelopmentPayload = {
      _id: development._id as string,
      name: `${development.name} Updated`,
      description: development.description,
      location: development.location,
      developer: DEVELOPER_ID,
      status: movininTypes.DevelopmentStatus.InProgress,
      approved: true,
      unitsCount: 12,
      images: [unknownImage],
      masterPlan: development.masterPlan,
      floorPlans: [unknownFloorPlan],
      latitude: 30.0444,
      longitude: 31.2357,
    }
    const res = await request(app)
      .put('/api/update-development')
      .set(env.X_ACCESS_TOKEN, token)
      .send(payload)
    expect(res.statusCode).toBe(200)
    const updated = res.body as movininTypes.Development

    expect(updated.images).toEqual([])
    expect(updated.floorPlans).toEqual([])
    expect(updated.images).not.toContain(unknownImage)
    expect(updated.floorPlans).not.toContain(unknownFloorPlan)
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, unknownImage))).toBeFalsy()
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, unknownFloorPlan))).toBeFalsy()

    await testHelper.signout(token)
  })

  it('should preserve existing master plan when the requested replacement does not exist', async () => {
    const token = await testHelper.signinAsAdmin()
    const { development } = await createDevelopment(token)
    const currentMasterPlan = development.masterPlan as string
    const unknownMasterPlan = `${nanoid()}.jpg`

    const payload: movininTypes.UpdateDevelopmentPayload = {
      _id: development._id as string,
      name: `${development.name} Updated`,
      description: development.description,
      location: development.location,
      developer: DEVELOPER_ID,
      status: movininTypes.DevelopmentStatus.InProgress,
      approved: true,
      unitsCount: 5,
      images: development.images,
      masterPlan: unknownMasterPlan,
      floorPlans: development.floorPlans,
      latitude: 30.0444,
      longitude: 31.2357,
    }

    const res = await request(app)
      .put('/api/update-development')
      .set(env.X_ACCESS_TOKEN, token)
      .send(payload)
    expect(res.statusCode).toBe(200)
    const updated = res.body as movininTypes.Development

    expect(updated.masterPlan).toBe(currentMasterPlan)
    expect(updated.masterPlan).not.toBe(unknownMasterPlan)
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, currentMasterPlan))).toBeTruthy()
    expect(await helper.pathExists(path.join(env.CDN_PROPERTIES, unknownMasterPlan))).toBeFalsy()

    await testHelper.signout(token)
  })
})
