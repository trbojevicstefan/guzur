import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'

const developmentSchema = new Schema<movininTypes.Development>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
      trim: true,
    },
    developer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
      index: true,
    },
    developerOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    unitsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        movininTypes.DevelopmentStatus.Planning,
        movininTypes.DevelopmentStatus.InProgress,
        movininTypes.DevelopmentStatus.Completed,
      ],
      default: movininTypes.DevelopmentStatus.Planning,
    },
    completionDate: {
      type: Date,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
    },
    masterPlan: {
      type: String,
    },
    floorPlans: {
      type: [String],
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Development',
  },
)

developmentSchema.index({ developer: 1, updatedAt: -1, _id: 1 })
developmentSchema.index({ status: 1, updatedAt: -1, _id: 1 })
developmentSchema.index({ developerOrg: 1, updatedAt: -1, _id: 1 })

const Development = model<movininTypes.Development>('Development', developmentSchema)

export default Development
