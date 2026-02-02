import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as movininTypes from ':movinin-types'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as authHelper from '../utils/authHelper'
import * as notificationHelper from '../utils/notificationHelper'
import i18n from '../lang/i18n'
import * as env from '../config/env.config'
import Message from '../models/Message'
import MessageThread from '../models/MessageThread'
import OrgMembership from '../models/OrgMembership'
import OrgPartnership from '../models/OrgPartnership'
import Organization from '../models/Organization'
import Property from '../models/Property'
import User from '../models/User'

const getRequestUser = async (req: Request) => {
  try {
    const cookieName = authHelper.getAuthCookieName(req)
    const token = cookieName === env.X_ACCESS_TOKEN
      ? (req.headers[env.X_ACCESS_TOKEN] as string)
      : (req.signedCookies[cookieName] as string)

    if (!token) {
      return null
    }

    const sessionData = await authHelper.decryptJWT(token)
    if (!sessionData || !helper.isValidObjectId(sessionData.id)) {
      return null
    }

    return await User.findById(sessionData.id)
  } catch {
    return null
  }
}

const resolveRecipientAllowed = (property: env.Property, recipientId: string) => {
  const candidates = [
    property.owner,
    property.broker,
    property.developer,
    property.agency,
  ]
  return candidates.some((candidate) => {
    if (!candidate) {
      return false
    }
    return candidate.toString() === recipientId
  })
}

const resolveSenderAllowed = (property: env.Property, senderId: string) => {
  const candidates = [
    property.owner,
    property.broker,
    property.developer,
    property.agency,
  ]
  return candidates.some((candidate) => {
    if (!candidate) {
      return false
    }
    return candidate.toString() === senderId
  })
}

const toObjectId = (value: string | mongoose.Types.ObjectId) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value

const ensureParticipants = async (
  thread: env.MessageThread,
  participantIds: Array<string | mongoose.Types.ObjectId>,
) => {
  const current = new Set(thread.participants.map((p) => p.toString()))
  participantIds.forEach((id) => current.add(toObjectId(id).toString()))
  thread.participants = Array.from(current).map((id) => new mongoose.Types.ObjectId(id))
  await thread.save()
}

const findDirectThread = async (propertyId: string, userId: string, otherUserId: string) =>
  MessageThread.findOne({
    type: movininTypes.MessageThreadType.Direct,
    property: new mongoose.Types.ObjectId(propertyId),
    participants: {
      $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(otherUserId)],
    },
  })

const findOrCreateDirectThread = async (
  listing: env.Property,
  userId: string,
  otherUserId: string,
) => {
  const propertyId = listing._id.toString()
  let thread = await findDirectThread(propertyId, userId, otherUserId)
  if (!thread) {
    thread = new MessageThread({
      type: movininTypes.MessageThreadType.Direct,
      property: listing._id,
      title: listing.name,
      participants: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(otherUserId)],
      lastMessageAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    await thread.save()
  }
  return thread
}

const getUserDeveloperOrg = async (userId: string, developerOrgId?: string) => {
  const memberships = await OrgMembership.find({
    user: new mongoose.Types.ObjectId(userId),
    status: movininTypes.OrgMemberStatus.Active,
  }).populate('org')

  const developerMemberships = memberships.filter((m) => {
    const org = m.org as unknown as env.Organization | undefined
    return org?.type === movininTypes.OrganizationType.Developer
  })

  if (developerOrgId) {
    return developerMemberships.find((m) => m.org?._id?.toString() === developerOrgId) || null
  }

  return developerMemberships[0] || null
}

const notifyThreadParticipants = async (
  thread: env.MessageThread,
  sender: env.User,
  messageText: string,
) => {
  const participantIds = thread.participants
    .map((p) => p.toString())
    .filter((id) => id !== sender._id.toString())

  if (participantIds.length === 0) {
    return
  }

  const recipients = await User.find({ _id: { $in: participantIds.map((id) => new mongoose.Types.ObjectId(id)) } })
  const link = `/messages?threadId=${thread._id}`
  await Promise.all(recipients.map((recipientUser) =>
    notificationHelper.notifyUser(
      recipientUser,
      `New message from ${sender.fullName}: ${messageText.slice(0, 120)}`,
      link,
      movininTypes.NotificationType.Message,
    )))
}

/**
 * Create a message for a property conversation.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createMessage = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreateMessagePayload } = req
  try {
    const user = await getRequestUser(req)
    if (!user?._id) {
      res.sendStatus(401)
      return
    }

    const { threadId, property, recipient, message } = body
    const trimmedMessage = message?.trim()
    if (!trimmedMessage) {
      throw new Error('Message is required')
    }

    if (threadId && helper.isValidObjectId(threadId)) {
      const thread = await MessageThread.findById(threadId)
      if (!thread) {
        res.sendStatus(204)
        return
      }

      const isParticipant = thread.participants.some((p) => p.toString() === user._id.toString())
      if (!isParticipant) {
        res.sendStatus(403)
        return
      }

      let recipientObjectId: mongoose.Types.ObjectId | undefined
      if (recipient && helper.isValidObjectId(recipient)) {
        recipientObjectId = new mongoose.Types.ObjectId(recipient)
        const recipientUser = await User.findById(recipientObjectId)
        if (!recipientUser) {
          res.sendStatus(204)
          return
        }
        await ensureParticipants(thread, [user._id, recipientObjectId])
      }

      const msg = new Message({
        thread: thread._id,
        property: thread.property,
        sender: user._id,
        recipient: recipientObjectId,
        message: trimmedMessage,
      })
      await msg.save()

      thread.lastMessageAt = new Date()
      await thread.save()

      await notifyThreadParticipants(thread, user, trimmedMessage)

      res.json(msg)
      return
    }

    if (!helper.isValidObjectId(property) || !helper.isValidObjectId(recipient)) {
      throw new Error('Invalid property or recipient')
    }
    const propertyId = property as string
    const recipientId = recipient as string

    const listing = await Property.findById(propertyId)
    if (!listing) {
      res.sendStatus(204)
      return
    }

    if (recipientId === user._id.toString()) {
      res.status(400).send(i18n.t('ERROR') + 'recipient must be different from sender')
      return
    }

    const senderAllowed = resolveSenderAllowed(listing, user._id.toString())
    const recipientAllowed = resolveRecipientAllowed(listing, recipientId)

    const recipientUser = await User.findById(recipientId)
    if (!recipientUser) {
      res.sendStatus(204)
      return
    }

    const existingThread = await findDirectThread(propertyId, user._id.toString(), recipientId)
    const threadExists = !!existingThread

    const senderIsBroker = user.type === movininTypes.UserType.Broker
    const recipientIsOwner = recipientUser.type === movininTypes.UserType.Owner
    if (!threadExists && senderIsBroker && recipientIsOwner) {
      res.sendStatus(403)
      return
    }

    if (!recipientAllowed && !threadExists) {
      res.sendStatus(403)
      return
    }

    if (listing.listingStatus !== movininTypes.ListingStatus.Published && !senderAllowed && !threadExists) {
      res.sendStatus(403)
      return
    }

    const thread = existingThread || await findOrCreateDirectThread(listing, user._id.toString(), recipientId)
    if (!existingThread) {
      await ensureParticipants(thread, [user._id, recipientUser._id])
    }

    const msg = new Message({
      thread: thread._id,
      property: propertyId,
      sender: user._id,
      recipient: recipientId,
      message: trimmedMessage,
    })
    await msg.save()

    thread.lastMessageAt = new Date()
    await thread.save()

    const link = `/messages?threadId=${thread._id}&propertyId=${propertyId}`
    await notificationHelper.notifyUser(
      recipientUser,
      `New message from ${user.fullName}.`,
      link,
      movininTypes.NotificationType.Message,
    )

    res.json(msg)
  } catch (err) {
    logger.error(`[message.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get messages for a property conversation.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user?._id) {
      res.sendStatus(401)
      return
    }

    const propertyId = helper.normalizeParam(req.params.propertyId) as string
    const threadIdParam = helper.normalizeParam((req.params as { threadId?: string }).threadId) as string
    const threadIdQuery = helper.normalizeParam(req.query.threadId as string | string[] | undefined) as string
    const threadId = helper.isValidObjectId(threadIdParam) ? threadIdParam : threadIdQuery
    const page = Number.parseInt(helper.normalizeParam(req.query.page as string | string[] | undefined) ?? '1', 10)
    const size = Number.parseInt(helper.normalizeParam(req.query.size as string | string[] | undefined) ?? '20', 10)
    if (!helper.isValidObjectId(propertyId) && !helper.isValidObjectId(threadId)) {
      throw new Error('params.propertyId is not valid')
    }

    let query: mongoose.QueryFilter<env.Message>
    if (helper.isValidObjectId(threadId)) {
      const thread = await MessageThread.findById(threadId)
      if (!thread) {
        res.sendStatus(204)
        return
      }
      const isParticipant = thread.participants.some((p) => p.toString() === user._id.toString())
      if (!isParticipant) {
        res.sendStatus(403)
        return
      }
      query = { thread: thread._id }
    } else {
      const threads = await MessageThread.find({
        property: new mongoose.Types.ObjectId(propertyId),
        participants: new mongoose.Types.ObjectId(user._id.toString()),
      }).select('_id')
      const threadIds = threads.map((t) => t._id)
      query = {
        property: new mongoose.Types.ObjectId(propertyId),
        thread: { $in: threadIds },
      }
    }
    const messages = await Message.find(query)
      .populate({
        path: 'thread',
        select: '_id type title property participants developerOrg brokerageOrg',
        populate: { path: 'participants', select: '_id fullName avatar type' },
      })
      .populate({ path: 'sender', select: '_id fullName avatar' })
      .populate({ path: 'recipient', select: '_id fullName avatar' })
      .sort({ createdAt: 1, _id: 1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean()

    res.json(messages)
  } catch (err) {
    logger.error(`[message.getMessages] ${i18n.t('DB_ERROR')} ${req.params.propertyId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get message threads for the current user.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getThreads = async (req: Request, res: Response) => {
  try {
    const user = await getRequestUser(req)
    if (!user?._id) {
      res.sendStatus(401)
      return
    }

    const userId = user._id.toString()
    const page = Number.parseInt(helper.normalizeParam(req.query.page as string | string[] | undefined) ?? '1', 10)
    const size = Number.parseInt(helper.normalizeParam(req.query.size as string | string[] | undefined) ?? '20', 10)
    const threads = await MessageThread.aggregate([
      {
        $match: {
          participants: new mongoose.Types.ObjectId(userId),
        },
      },
      { $sort: { lastMessageAt: -1, updatedAt: -1, _id: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      {
        $lookup: {
          from: 'Message',
          let: { threadId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$thread', '$$threadId'] } } },
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage',
        },
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'Property',
          localField: 'property',
          foreignField: '_id',
          as: 'property',
        },
      },
      { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'User',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
        },
      },
      {
        $lookup: {
          from: 'Organization',
          localField: 'developerOrg',
          foreignField: '_id',
          as: 'developerOrg',
        },
      },
      { $unwind: { path: '$developerOrg', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'Organization',
          localField: 'brokerageOrg',
          foreignField: '_id',
          as: 'brokerageOrg',
        },
      },
      { $unwind: { path: '$brokerageOrg', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: 1,
          title: 1,
          property: 1,
          participants: {
            _id: 1,
            fullName: 1,
            avatar: 1,
          },
          developerOrg: 1,
          brokerageOrg: 1,
          updatedAt: 1,
          lastMessageAt: 1,
          lastMessage: 1,
        },
      },
    ])

    const response = threads.map((thread) => {
      const participants = (thread.participants || []) as movininTypes.User[]
      const otherUser = participants.find((p) => p._id?.toString() !== userId)
      return {
        _id: thread._id,
        type: thread.type,
        title: thread.title,
        property: thread.property,
        lastMessage: thread.lastMessage,
        participants,
        developerOrg: thread.developerOrg,
        brokerageOrg: thread.brokerageOrg,
        updatedAt: thread.lastMessageAt || thread.updatedAt,
        lastMessageAt: thread.lastMessageAt,
        otherUser,
      }
    })

    res.json(response)
  } catch (err) {
    logger.error(`[message.getThreads] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Create a group thread.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createThread = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.CreateMessageThreadPayload } = req
  try {
    const user = await getRequestUser(req)
    if (!user?._id) {
      res.sendStatus(401)
      return
    }

    const { title, participants, orgId } = body
    const trimmedTitle = title?.trim()
    if (!trimmedTitle) {
      throw new Error('Thread title is required')
    }
    if (!Array.isArray(participants) || participants.length === 0) {
      throw new Error('At least one participant is required')
    }

    const validParticipants = participants.filter((id) => helper.isValidObjectId(id))
    const uniqueParticipants = Array.from(new Set([...validParticipants, user._id.toString()]))

    if (orgId && helper.isValidObjectId(orgId)) {
      const senderMembership = await OrgMembership.findOne({
        org: new mongoose.Types.ObjectId(orgId),
        user: user._id,
        status: movininTypes.OrgMemberStatus.Active,
      }).select('_id')
      if (!senderMembership) {
        res.sendStatus(403)
        return
      }

      const orgMemberships = await OrgMembership.find({
        org: new mongoose.Types.ObjectId(orgId),
        status: movininTypes.OrgMemberStatus.Active,
      }).select('user')
      const orgUserIds = new Set(orgMemberships.map((m) => m.user.toString()))
      const allInOrg = uniqueParticipants.every((id) => orgUserIds.has(id))
      if (!allInOrg) {
        res.sendStatus(403)
        return
      }
    }

    const thread = new MessageThread({
      type: movininTypes.MessageThreadType.Group,
      title: trimmedTitle,
      participants: uniqueParticipants.map((id) => new mongoose.Types.ObjectId(id)),
      createdBy: user._id,
      lastMessageAt: new Date(),
    })
    await thread.save()

    res.json(thread)
  } catch (err) {
    logger.error(`[message.createThread] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Broadcast a message from a developer org to partnered broker orgs.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const broadcastMessage = async (req: Request, res: Response) => {
  const { body }: { body: movininTypes.BroadcastMessagePayload } = req
  try {
    const user = await getRequestUser(req)
    if (!user?._id) {
      res.sendStatus(401)
      return
    }

    const { developerOrg, title, message } = body
    const trimmedMessage = message?.trim()
    if (!trimmedMessage) {
      throw new Error('Message is required')
    }

    const developerMembership = await getUserDeveloperOrg(user._id.toString(), developerOrg)
    if (!developerMembership?.org?._id) {
      res.sendStatus(403)
      return
    }

    const developerOrgId = developerMembership.org._id.toString()
    const developerOrgDoc = await Organization.findById(developerOrgId)
    const partnerships = await OrgPartnership.find({
      developerOrg: new mongoose.Types.ObjectId(developerOrgId),
      status: movininTypes.OrgPartnershipStatus.Approved,
    })

    if (partnerships.length === 0) {
      res.json({ delivered: 0, threads: 0 })
      return
    }

    let deliveredCount = 0
    let threadCount = 0

    for (const partnership of partnerships) {
      const brokerOrgId = partnership.brokerOrg.toString()
      const brokerOrg = await Organization.findById(brokerOrgId)
      if (!brokerOrg) {
        continue
      }

      const memberships = await OrgMembership.find({
        org: new mongoose.Types.ObjectId(brokerOrgId),
        status: movininTypes.OrgMemberStatus.Active,
      }).select('user')

      const brokerUserIds = memberships.map((m) => m.user.toString())
      if (brokerUserIds.length === 0) {
        continue
      }

      const participantIds = Array.from(new Set([user._id.toString(), ...brokerUserIds]))

      let thread = await MessageThread.findOne({
        type: movininTypes.MessageThreadType.Broadcast,
        developerOrg: new mongoose.Types.ObjectId(developerOrgId),
        brokerageOrg: new mongoose.Types.ObjectId(brokerOrgId),
      })

      if (!thread) {
        thread = new MessageThread({
          type: movininTypes.MessageThreadType.Broadcast,
          title: title?.trim() || `${developerOrgDoc?.name || 'Developer'} -> ${brokerOrg.name}`,
          participants: participantIds.map((id) => new mongoose.Types.ObjectId(id)),
          developerOrg: new mongoose.Types.ObjectId(developerOrgId),
          brokerageOrg: new mongoose.Types.ObjectId(brokerOrgId),
          createdBy: user._id,
          lastMessageAt: new Date(),
        })
        await thread.save()
        threadCount += 1
      } else {
        await ensureParticipants(thread, participantIds)
      }

      const msg = new Message({
        thread: thread._id,
        sender: user._id,
        message: trimmedMessage,
      })
      await msg.save()

      thread.lastMessageAt = new Date()
      await thread.save()

      await notifyThreadParticipants(thread, user, trimmedMessage)
      deliveredCount += brokerUserIds.length
    }

    res.json({ delivered: deliveredCount, threads: threadCount })
  } catch (err) {
    logger.error(`[message.broadcastMessage] ${i18n.t('DB_ERROR')} ${JSON.stringify(body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
