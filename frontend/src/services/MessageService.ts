import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

/**
 * Get messages for a property conversation.
 *
 * @param {string} propertyId
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Message[]>}
 */
export const getMessages = (
  propertyId: string,
  page?: number,
  size?: number,
): Promise<movininTypes.Message[]> =>
  axiosInstance
    .get(
      `/api/messages/${encodeURIComponent(propertyId)}`,
      { withCredentials: true, params: { page, size } }
    )
    .then((res) => res.data)

/**
 * Get messages for a thread conversation.
 *
 * @param {string} threadId
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Message[]>}
 */
export const getMessagesByThread = (
  threadId: string,
  page?: number,
  size?: number,
): Promise<movininTypes.Message[]> =>
  axiosInstance
    .get(
      `/api/messages-thread/${encodeURIComponent(threadId)}`,
      { withCredentials: true, params: { page, size } }
    )
    .then((res) => res.data)

/**
 * Create a message.
 *
 * @param {movininTypes.CreateMessagePayload} data
 * @returns {Promise<movininTypes.Message>}
 */
export const createMessage = (data: movininTypes.CreateMessagePayload): Promise<movininTypes.Message> =>
  axiosInstance
    .post(
      '/api/message',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Create a group thread.
 *
 * @param {movininTypes.CreateMessageThreadPayload} data
 * @returns {Promise<movininTypes.MessageThread>}
 */
export const createThread = (data: movininTypes.CreateMessageThreadPayload): Promise<movininTypes.MessageThread> =>
  axiosInstance
    .post(
      '/api/message-thread',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Broadcast a message to partnered broker orgs from a developer org.
 *
 * @param {movininTypes.BroadcastMessagePayload} data
 * @returns {Promise<{ delivered: number, threads: number }>}
 */
export const broadcastMessage = (data: movininTypes.BroadcastMessagePayload): Promise<{ delivered: number, threads: number }> =>
  axiosInstance
    .post(
      '/api/message-broadcast',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get message threads for current user.
 *
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.MessageThread[]>}
 */
export const getThreads = (
  page?: number,
  size?: number,
): Promise<movininTypes.MessageThread[]> =>
  axiosInstance
    .get(
      '/api/message-threads',
      { withCredentials: true, params: { page, size } }
    )
    .then((res) => res.data)
