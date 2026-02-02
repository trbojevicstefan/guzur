import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'

const messageThreadSchema = new Schema<env.MessageThread>(
  {
    type: {
      type: String,
      enum: [
        movininTypes.MessageThreadType.Direct,
        movininTypes.MessageThreadType.Group,
        movininTypes.MessageThreadType.Broadcast,
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
    ],
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    developerOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    brokerageOrg: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    lastMessageAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'MessageThread',
  },
)

messageThreadSchema.index({ participants: 1, updatedAt: -1 })
messageThreadSchema.index({ property: 1, type: 1 })
messageThreadSchema.index({ developerOrg: 1, brokerageOrg: 1, type: 1 })

const MessageThread = model<env.MessageThread>('MessageThread', messageThreadSchema)

export default MessageThread

