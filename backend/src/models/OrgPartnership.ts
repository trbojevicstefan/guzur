import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'

const orgPartnershipSchema = new Schema<env.OrgPartnership>(
  {
    brokerOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, "can't be blank"],
      index: true,
    },
    developerOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, "can't be blank"],
      index: true,
    },
    status: {
      type: String,
      enum: [
        movininTypes.OrgPartnershipStatus.Pending,
        movininTypes.OrgPartnershipStatus.Approved,
        movininTypes.OrgPartnershipStatus.Rejected,
      ],
      default: movininTypes.OrgPartnershipStatus.Pending,
      index: true,
    },
    message: {
      type: String,
      trim: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'OrgPartnership',
  },
)

orgPartnershipSchema.index({ brokerOrg: 1, developerOrg: 1 }, { unique: true })
orgPartnershipSchema.index({ developerOrg: 1, status: 1, updatedAt: -1, _id: 1 })
orgPartnershipSchema.index({ brokerOrg: 1, status: 1, updatedAt: -1, _id: 1 })

const OrgPartnership = model<env.OrgPartnership>('OrgPartnership', orgPartnershipSchema)

export default OrgPartnership
