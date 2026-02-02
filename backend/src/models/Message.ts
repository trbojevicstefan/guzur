import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const messageSchema = new Schema<env.Message>(
  {
    thread: {
      type: Schema.Types.ObjectId,
      ref: 'MessageThread',
      required: [true, "can't be blank"],
      index: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    message: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Message',
  },
)

messageSchema.index({ thread: 1, createdAt: 1, _id: 1 })
messageSchema.index({ property: 1, createdAt: 1, _id: 1 })
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1, _id: 1 })

const Message = model<env.Message>('Message', messageSchema)

export default Message
