import mongoose from 'mongoose'
import { Request, Response } from 'express'
import i18n from '../lang/i18n'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import * as helper from '../utils/helper'
import * as logger from '../utils/logger'
import * as movininTypes from ':movinin-types'

/**
 * Get NotificationCounter by UserID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const notificationCounter = async (req: Request, res: Response) => {
  const userId = helper.normalizeParam(req.params.userId) as string
  try {
    const counter = await NotificationCounter.findOne({ user: userId })

    if (counter) {
      if (typeof counter.messageCount === 'undefined') {
        counter.messageCount = 0
        await counter.save()
      }
      res.json(counter)
      return
    }

    const cnt = new NotificationCounter({ user: userId, count: 0, messageCount: 0 })
    await cnt.save()
    res.json(cnt)
  } catch (err) {
    logger.error(`[notification.notificationCounter] ${i18n.t('DB_ERROR')} ${userId}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Get Notifications by UserID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getNotifications = async (req: Request, res: Response) => {
  const _userId = helper.normalizeParam(req.params.userId) as string
  const _page = helper.normalizeParam(req.params.page)
  const _size = helper.normalizeParam(req.params.size)
  const typeParam = helper.normalizeParam(req.query.type as string | string[] | undefined)

  try {
    const userId = new mongoose.Types.ObjectId(_userId)
    const page = Number.parseInt(_page ?? '0', 10)
    const size = Number.parseInt(_size ?? '0', 10)

    const $match: Record<string, any> = { user: userId }
    if (typeParam) {
      const types = typeParam.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean)
      const includeGeneral = types.includes(movininTypes.NotificationType.General)
      const includeMessage = types.includes(movininTypes.NotificationType.Message)
      const orFilters: Record<string, any>[] = []
      if (includeGeneral) {
        orFilters.push({ type: movininTypes.NotificationType.General })
        orFilters.push({ type: { $exists: false } })
      }
      if (includeMessage) {
        orFilters.push({ type: movininTypes.NotificationType.Message })
      }
      if (orFilters.length > 0) {
        $match.$or = orFilters
      }
    }

    const notifications = await Notification.aggregate([
      { $match },
      {
        $facet: {
          resultData: [{ $sort: { createdAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
          pageInfo: [
            {
              $count: 'totalRecords',
            },
          ],
        },
      },
    ])

    res.json(notifications)
  } catch (err) {
    logger.error(`[notification.getNotifications] ${i18n.t('DB_ERROR')} ${_userId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark Notifications as read.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { body }: { body: { ids: string[] } } = req
    const { ids: _ids } = body
    const ids = _ids.map((id) => new mongoose.Types.ObjectId(id))
    const _userId = helper.normalizeParam(req.params.userId) as string
    const userId = new mongoose.Types.ObjectId(_userId)

    const bulk = Notification.collection.initializeOrderedBulkOp()
    const notifications = await Notification.find({
      _id: { $in: ids },
      isRead: false,
    })
    const { length } = notifications
    const messageCount = notifications.filter((row) => row.type === movininTypes.NotificationType.Message).length
    const generalCount = length - messageCount

    bulk.find({ _id: { $in: ids }, isRead: false }).update({ $set: { isRead: true } })
    await bulk.execute()
    // const result = await bulk.execute()

    // if (result.modifiedCount !== length) {
    //   logger.error(`[notification.markAsRead] ${i18n.t('DB_ERROR')}`)
    //   res.status(400).send(i18n.t('DB_ERROR'))
    // }

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter || typeof counter.count === 'undefined') {
      res.sendStatus(204)
      return
    }
    counter.count = Math.max(0, (counter.count ?? 0) - generalCount)
    counter.messageCount = Math.max(0, (counter.messageCount ?? 0) - messageCount)
    await counter.save()

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[notification.markAsRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark Notifications as unread.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAsUnRead = async (req: Request, res: Response) => {
  try {
    const { body }: { body: { ids: string[] } } = req
    const { ids: _ids } = body
    const ids = _ids.map((id) => new mongoose.Types.ObjectId(id))
    const _userId = helper.normalizeParam(req.params.userId) as string
    const userId = new mongoose.Types.ObjectId(_userId)

    const bulk = Notification.collection.initializeOrderedBulkOp()
    const notifications = await Notification.find({
      _id: { $in: ids },
      isRead: true,
    })
    const { length } = notifications
    const messageCount = notifications.filter((row) => row.type === movininTypes.NotificationType.Message).length
    const generalCount = length - messageCount

    bulk.find({ _id: { $in: ids }, isRead: true }).update({ $set: { isRead: false } })
    await bulk.execute()
    // const result = await bulk.execute()

    // if (result.modifiedCount !== length) {
    //   logger.error(`[notification.markAsUnRead] ${i18n.t('DB_ERROR')}`)
    //   res.status(400).send(i18n.t('DB_ERROR'))
    // }

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter || typeof counter.count === 'undefined') {
      res.sendStatus(204)
      return
    }
    counter.count = (counter.count ?? 0) + generalCount
    counter.messageCount = (counter.messageCount ?? 0) + messageCount
    await counter.save()

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[notification.markAsUnRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Notifications.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteNotifications = async (req: Request, res: Response) => {
  try {
    const { body }: { body: { ids: string[] } } = req
    const { ids: _ids } = body
    const ids = _ids.map((id) => new mongoose.Types.ObjectId(id))
    const _userId = helper.normalizeParam(req.params.userId) as string
    const userId = new mongoose.Types.ObjectId(_userId)

    const notifications = await Notification.find({ _id: { $in: ids }, isRead: false })
    const messageCount = notifications.filter((row) => row.type === movininTypes.NotificationType.Message).length
    const generalCount = notifications.length - messageCount

    await Notification.deleteMany({ _id: { $in: ids } })

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter || typeof counter.count === 'undefined') {
      res.sendStatus(204)
      return
    }
    counter.count = Math.max(0, (counter.count ?? 0) - generalCount)
    counter.messageCount = Math.max(0, (counter.messageCount ?? 0) - messageCount)
    await counter.save()

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[notification.deleteNotifications] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark Notifications as read by type.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAsReadByType = async (req: Request, res: Response) => {
  try {
    const _userId = helper.normalizeParam(req.params.userId) as string
    const typeParam = helper.normalizeParam(req.params.type) as string
    if (!typeParam) {
      res.sendStatus(400)
      return
    }

    const userId = new mongoose.Types.ObjectId(_userId)
    const types = typeParam.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean)
    const typeFilters: Record<string, any>[] = []
    if (types.includes(movininTypes.NotificationType.General)) {
      typeFilters.push({ type: movininTypes.NotificationType.General })
      typeFilters.push({ type: { $exists: false } })
    }
    if (types.includes(movininTypes.NotificationType.Message)) {
      typeFilters.push({ type: movininTypes.NotificationType.Message })
    }

    if (typeFilters.length === 0) {
      res.sendStatus(204)
      return
    }

    const notifications = await Notification.find({
      user: userId,
      isRead: false,
      $or: typeFilters,
    })

    if (notifications.length === 0) {
      res.sendStatus(204)
      return
    }

    const ids = notifications.map((row) => row._id)
    const messageCount = notifications.filter((row) => row.type === movininTypes.NotificationType.Message).length
    const generalCount = notifications.length - messageCount

    await Notification.updateMany({ _id: { $in: ids } }, { $set: { isRead: true } })

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter) {
      res.sendStatus(204)
      return
    }
    counter.count = Math.max(0, (counter.count ?? 0) - generalCount)
    counter.messageCount = Math.max(0, (counter.messageCount ?? 0) - messageCount)
    await counter.save()

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[notification.markAsReadByType] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
