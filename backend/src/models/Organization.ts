import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'

const organizationSchema = new Schema<env.Organization>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: [movininTypes.OrganizationType.Brokerage, movininTypes.OrganizationType.Developer],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    cover: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    serviceAreas: {
      type: [String],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    seats: {
      type: Number,
    },
    plan: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Organization',
  },
)

organizationSchema.index({ type: 1, name: 1 })
organizationSchema.index({ type: 1, slug: 1 })

const Organization = model<env.Organization>('Organization', organizationSchema)

export default Organization
