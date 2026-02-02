import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'

const propertySchema = new Schema<env.Property>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
    },
    type: {
      type: String,
      enum: [
        movininTypes.PropertyType.House,
        movininTypes.PropertyType.Apartment,
        movininTypes.PropertyType.Townhouse,
        movininTypes.PropertyType.Plot,
        movininTypes.PropertyType.Farm,
        movininTypes.PropertyType.Commercial,
        movininTypes.PropertyType.Industrial,
      ],
      required: [true, "can't be blank"],
    },
    agency: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    broker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    developer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    brokerageOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    developerOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    developmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Development',
      index: true,
    },
    description: {
      type: String,
      required: [true, "can't be blank"],
    },
    aiDescription: {
      type: String,
      trim: true,
    },
    useAiDescription: {
      type: Boolean,
      default: false,
    },
    available: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    },
    images: {
      type: [String],
    },
    bedrooms: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    bathrooms: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    kitchens: {
      type: Number,
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    parkingSpaces: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    size: {
      type: Number,
    },
    petsAllowed: {
      type: Boolean,
      required: [true, "can't be blank"],
    },
    furnished: {
      type: Boolean,
      required: [true, "can't be blank"],
    },
    minimumAge: {
      type: Number,
      required: [true, "can't be blank"],
      min: env.MINIMUM_AGE,
      max: 99,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, "can't be blank"],
    },
    address: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    price: {
      type: Number,
      required: [true, "can't be blank"],
    },
    salePrice: {
      type: Number,
      default: null,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    cancellation: {
      type: Number,
      default: 0,
    },
    aircon: {
      type: Boolean,
      default: false,
    },
    rentalTerm: {
      type: String,
      enum: [
        movininTypes.RentalTerm.Monthly,
        movininTypes.RentalTerm.Weekly,
        movininTypes.RentalTerm.Daily,
        movininTypes.RentalTerm.Yearly,
      ],
      required: [true, "can't be blank"],
    },
    listingType: {
      type: String,
      enum: [
        movininTypes.ListingType.Rent,
        movininTypes.ListingType.Sale,
        movininTypes.ListingType.Both,
      ],
      default: movininTypes.ListingType.Rent,
    },
    listingStatus: {
      type: String,
      enum: [
        movininTypes.ListingStatus.Draft,
        movininTypes.ListingStatus.PendingReview,
        movininTypes.ListingStatus.Published,
        movininTypes.ListingStatus.Rejected,
        movininTypes.ListingStatus.Archived,
      ],
      default: movininTypes.ListingStatus.Published,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    seoKeywords: {
      type: [String],
      default: [],
    },
    seoGeneratedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    blockOnPay: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Property',
  },
)

propertySchema.index({ updatedAt: -1, _id: 1 })
propertySchema.index({ agency: 1, type: 1, rentalTerm: 1, available: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ type: 1, rentalTerm: 1, available: 1 })
propertySchema.index({ location: 1, available: 1 })
propertySchema.index({ listingStatus: 1, listingType: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ broker: 1, listingStatus: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ developer: 1, listingStatus: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ owner: 1, listingStatus: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ brokerageOrg: 1, listingStatus: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ developerOrg: 1, listingStatus: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ developmentId: 1, listingStatus: 1, updatedAt: -1, _id: 1 })
propertySchema.index(
  { name: 'text' },
  {
    default_language: 'none', // This disables stemming
    language_override: '_none', // Prevent MongoDB from expecting a language field
    background: true,
  },
)

const Property = model<env.Property>('Property', propertySchema)

export default Property
