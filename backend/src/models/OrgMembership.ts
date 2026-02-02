import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'

const orgMembershipSchema = new Schema<env.OrgMembership>(
  {
    org: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        movininTypes.OrgMemberRole.OwnerAdmin,
        movininTypes.OrgMemberRole.Admin,
        movininTypes.OrgMemberRole.Manager,
        movininTypes.OrgMemberRole.Agent,
        movininTypes.OrgMemberRole.Accounting,
        movininTypes.OrgMemberRole.Marketing,
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        movininTypes.OrgMemberStatus.Invited,
        movininTypes.OrgMemberStatus.Active,
        movininTypes.OrgMemberStatus.Removed,
      ],
      default: movininTypes.OrgMemberStatus.Invited,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'OrgMembership',
  },
)

orgMembershipSchema.index({ org: 1, user: 1 }, { unique: true })

const OrgMembership = model<env.OrgMembership>('OrgMembership', orgMembershipSchema)

export default OrgMembership
