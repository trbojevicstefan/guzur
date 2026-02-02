import nodemailer from 'nodemailer'
import * as env from '../config/env.config'
import i18n from '../lang/i18n'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import * as helper from './helper'
import * as logger from './logger'
import * as mailHelper from './mailHelper'
import * as movininTypes from ':movinin-types'

export const notifyUser = async (
  user: env.User,
  message: string,
  link?: string,
  type: movininTypes.NotificationType = movininTypes.NotificationType.General,
) => {
  try {
    i18n.locale = user.language

    const notification = new Notification({
      user: user._id,
      message,
      link,
      type,
    })

    await notification.save()

    let counter = await NotificationCounter.findOne({ user: user._id })
    if (!counter) {
      counter = new NotificationCounter({ user: user._id, count: 0, messageCount: 0 })
    }

    const messageCount = counter.messageCount ?? 0
    const count = counter.count ?? 0

    if (type === movininTypes.NotificationType.Message) {
      counter.messageCount = messageCount + 1
    } else {
      counter.count = count + 1
      await counter.save()
    }
    await counter.save()

    if (user.enableEmailNotifications) {
    const notificationLink = link ? helper.joinURL(link, '') : ''
      const linkLine = notificationLink ? `${notificationLink}<br><br>` : ''
      const mailOptions: nodemailer.SendMailOptions = {
        from: env.SMTP_FROM,
        to: user.email,
        subject: message,
        html: `<p>
      ${i18n.t('HELLO')}${user.fullName},<br><br>
      ${message}<br><br>
      ${linkLine}
      ${i18n.t('REGARDS')}<br>
      </p>`,
      }

      await mailHelper.sendMail(mailOptions)
    }
  } catch (err) {
    logger.error('[notification.notifyUser] Failed to notify user', err)
  }
}
