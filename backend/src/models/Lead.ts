import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'

const leadSchema = new Schema<movininTypes.Lead>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    listingType: {
      type: String,
      enum: [
        movininTypes.ListingType.Rent,
        movininTypes.ListingType.Sale,
        movininTypes.ListingType.Both,
      ],
    },
    name: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: [
        movininTypes.LeadStatus.New,
        movininTypes.LeadStatus.Contacted,
        movininTypes.LeadStatus.ViewingScheduled,
        movininTypes.LeadStatus.ClosedWon,
        movininTypes.LeadStatus.ClosedLost,
      ],
      default: movininTypes.LeadStatus.New,
      index: true,
    },
    source: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Lead',
  },
)

leadSchema.index({ assignedTo: 1, status: 1, updatedAt: -1, _id: 1 })
leadSchema.index({ property: 1, status: 1, updatedAt: -1, _id: 1 })

const Lead = model<movininTypes.Lead>('Lead', leadSchema)

export default Lead
