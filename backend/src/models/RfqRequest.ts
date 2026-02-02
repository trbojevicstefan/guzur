import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'

const rfqSchema = new Schema<movininTypes.RfqRequest>(
  {
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
    location: {
      type: String,
      trim: true,
    },
    listingType: {
      type: String,
      enum: [
        movininTypes.ListingType.Rent,
        movininTypes.ListingType.Sale,
        movininTypes.ListingType.Both,
      ],
    },
    propertyType: {
      type: String,
      enum: [
        movininTypes.PropertyType.Apartment,
        movininTypes.PropertyType.Commercial,
        movininTypes.PropertyType.Farm,
        movininTypes.PropertyType.House,
        movininTypes.PropertyType.Industrial,
        movininTypes.PropertyType.Plot,
        movininTypes.PropertyType.Townhouse,
      ],
    },
    bedrooms: {
      type: Number,
    },
    bathrooms: {
      type: Number,
    },
    budget: {
      type: Number,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        movininTypes.RfqStatus.New,
        movininTypes.RfqStatus.Contacted,
        movininTypes.RfqStatus.ClosedWon,
        movininTypes.RfqStatus.ClosedLost,
      ],
      default: movininTypes.RfqStatus.New,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'RfqRequest',
  },
)

rfqSchema.index({ status: 1, updatedAt: -1, _id: 1 })

const RfqRequest = model<movininTypes.RfqRequest>('RfqRequest', rfqSchema)

export default RfqRequest
