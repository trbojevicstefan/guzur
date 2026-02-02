import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, FormControl, Input, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import * as MessageService from '@/services/MessageService'
import * as NotificationService from '@/services/NotificationService'
import * as OrganizationService from '@/services/OrganizationService'
import * as PropertyService from '@/services/PropertyService'
import * as UserService from '@/services/UserService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/messages'
import { strings as commonStrings } from '@/lang/common'
import { useNotificationContext, NotificationContextType } from '@/context/NotificationContext'

import '@/assets/css/messages.css'

const getId = (value?: movininTypes.User | string) =>
  typeof value === 'string' ? value : value?._id

const getOrgName = (org?: movininTypes.Organization | string) =>
  typeof org === 'string' ? '' : (org?.name || '')

const getThreadKey = (thread: movininTypes.MessageThread) => {
  const propertyKey = typeof thread.property === 'string'
    ? thread.property
    : thread.property?._id
  return thread._id || propertyKey || thread.lastMessage?._id
}

const getThreadTypeLabel = (type?: movininTypes.MessageThreadType) => {
  switch (type) {
    case movininTypes.MessageThreadType.Broadcast:
      return strings.THREAD_BROADCAST
    case movininTypes.MessageThreadType.Group:
      return strings.THREAD_GROUP
    default:
      return strings.THREAD_DIRECT
  }
}

const getThreadTypeClass = (type?: movininTypes.MessageThreadType) => {
  switch (type) {
    case movininTypes.MessageThreadType.Broadcast:
      return 'message-thread-type message-thread-type-broadcast'
    case movininTypes.MessageThreadType.Group:
      return 'message-thread-type message-thread-type-group'
    default:
      return 'message-thread-type message-thread-type-direct'
  }
}

const Messages = () => {
  const [searchParams] = useSearchParams()
  const [property, setProperty] = useState<movininTypes.Property>()
  const [currentThread, setCurrentThread] = useState<movininTypes.MessageThread>()
  const [messages, setMessages] = useState<movininTypes.Message[]>([])
  const [threads, setThreads] = useState<movininTypes.MessageThread[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [messagesPage, setMessagesPage] = useState(1)
  const [threadsPage, setThreadsPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [hasMoreThreads, setHasMoreThreads] = useState(true)
  const [threadSearch, setThreadSearch] = useState('')
  const [threadListingType, setThreadListingType] = useState<movininTypes.ListingType | ''>('')
  const [orgInfo, setOrgInfo] = useState<movininTypes.Organization>()
  const [orgMembers, setOrgMembers] = useState<movininTypes.OrgMembership[]>([])
  const [groupTitle, setGroupTitle] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [pulseNote, setPulseNote] = useState('')

  const propertyId = searchParams.get('propertyId') || ''
  const threadId = searchParams.get('threadId') || ''
  const user = UserService.getCurrentUser()
  const navigate = useNavigate()
  const { setMessageCount } = useNotificationContext() as NotificationContextType
  const readKey = user?._id ? `mi-message-read-${user._id}` : ''
  const pageSize = env.PAGE_SIZE
  const primaryOrgId = typeof user?.primaryOrg === 'string' ? user.primaryOrg : user?.primaryOrg?._id
  const activeOrgMembers = useMemo(
    () => orgMembers.filter((m) => m.status === movininTypes.OrgMemberStatus.Active),
    [orgMembers],
  )

  const readMap = useMemo(
    () => (readKey ? JSON.parse(localStorage.getItem(readKey) || '{}') as Record<string, string> : {}),
    [readKey, threads, threadId, propertyId, messages],
  )

  const recipientId = useMemo(() => {
    if (!user?._id) {
      return undefined
    }

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const senderId = getId(lastMessage.sender)
      const recipient = getId(lastMessage.recipient)
      if (senderId && recipient) {
        return senderId === user._id ? recipient : senderId
      }
    }

    if (!property) {
      if (currentThread?.participants && currentThread.participants.length > 0) {
        const other = currentThread.participants.find((p) => getId(p) !== user._id)
        return getId(other)
      }
      return undefined
    }

    const candidates = [
      getId(property.owner),
      getId(property.broker),
      getId(property.developer),
      getId(property.agency),
    ].filter(Boolean) as string[]

    return candidates.find((id) => id !== user._id)
  }, [property, user, messages])

  const senderIsBroker = user?.type === movininTypes.UserType.Broker
  const ownerId = property ? getId(property.owner) : undefined
  const recipientIsOwner = !!ownerId && ownerId === recipientId
  const canSend = !!recipientId && (
    !propertyId ||
    !senderIsBroker ||
    !recipientIsOwner ||
    messages.length > 0
  )

  const filteredThreads = useMemo(() => {
    const search = threadSearch.trim().toLowerCase()
    return threads.filter((thread) => {
      const propertyInfo = typeof thread.property === 'object' ? thread.property : undefined
      const propertyName = (propertyInfo?.name || '').toLowerCase()
      const otherName = (thread.otherUser?.fullName || '').toLowerCase()
      const titleName = (thread.title || '').toLowerCase()
      const developerName = getOrgName(thread.developerOrg).toLowerCase()
      const brokerageName = getOrgName(thread.brokerageOrg).toLowerCase()
      const matchesSearch = !search || propertyName.includes(search) || otherName.includes(search)
      const matchesListingType = !threadListingType || !propertyInfo || propertyInfo.listingType === threadListingType
      return (matchesSearch || titleName.includes(search) || developerName.includes(search) || brokerageName.includes(search)) && matchesListingType
    })
  }, [threads, threadSearch, threadListingType])

  const getLastMessageTime = (thread: movininTypes.MessageThread) => {
    if (thread.lastMessageAt) {
      return new Date(thread.lastMessageAt).getTime()
    }
    if (thread.lastMessage?.createdAt) {
      return new Date(thread.lastMessage.createdAt).getTime()
    }
    return 0
  }

  const isThreadUnread = (thread: movininTypes.MessageThread) => {
    const threadKey = getThreadKey(thread)
    if (!threadKey) {
      return false
    }
    const lastRead = readMap[threadKey]
    const lastMessageTime = getLastMessageTime(thread)
    if (!lastRead) {
      return lastMessageTime > 0
    }
    return lastMessageTime > new Date(lastRead).getTime()
  }

  const unreadThreadCount = useMemo(
    () => filteredThreads.filter((thread) => isThreadUnread(thread)).length,
    [filteredThreads, readMap],
  )

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        return
      }
      try {
        const data = await PropertyService.getProperty(propertyId)
        setProperty(data)
      } catch (err) {
        helper.error(err)
      }
    }

    fetchProperty()
  }, [propertyId])

  useEffect(() => {
    const fetchOrgContext = async () => {
      if (!user?._id || !primaryOrgId) {
        return
      }
      try {
        const [org, members] = await Promise.all([
          OrganizationService.getOrganization(primaryOrgId),
          OrganizationService.getOrgMembers(primaryOrgId),
        ])
        setOrgInfo(org)
        setOrgMembers(members)
      } catch (err) {
        try {
          const [org, members] = await Promise.all([
            OrganizationService.getOrganization(primaryOrgId),
            OrganizationService.getFrontendOrgMembers(primaryOrgId),
          ])
          setOrgInfo(org)
          setOrgMembers(members)
        } catch (fallbackErr) {
          helper.error(fallbackErr)
        }
      }
    }

    fetchOrgContext()
  }, [user?._id, primaryOrgId])

  useEffect(() => {
    const fetchMessages = async () => {
      if ((!propertyId && !threadId) || !user?._id) {
        return
      }
      try {
        setLoading(true)
        const data = threadId
          ? await MessageService.getMessagesByThread(threadId, messagesPage, pageSize)
          : await MessageService.getMessages(propertyId, messagesPage, pageSize)
        setMessages((prev) => (messagesPage === 1 ? data : [...prev, ...data]))
        setHasMoreMessages(data.length === pageSize)

        const threadFromMessages = data.find((m) => typeof m.thread === 'object')?.thread as movininTypes.MessageThread | undefined
        if (threadFromMessages?._id) {
          setCurrentThread(threadFromMessages)
        }
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [propertyId, threadId, user?._id, messagesPage, pageSize])

  useEffect(() => {
    const clearMessageNotifications = async () => {
      if (!user?._id) {
        return
      }
      try {
        await NotificationService.markAsReadByType(user._id, [movininTypes.NotificationType.Message])
        setMessageCount(0)
      } catch (err) {
        helper.error(err)
      }
    }

    clearMessageNotifications()
  }, [user?._id, setMessageCount])

  useEffect(() => {
    if ((!propertyId && !threadId) || !user?._id || messages.length === 0) {
      return
    }
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.createdAt || !readKey) {
      return
    }
    const readMap = JSON.parse(localStorage.getItem(readKey) || '{}') as Record<string, string>
    const readId = threadId || propertyId
    if (readId) {
      readMap[readId] = new Date(lastMessage.createdAt).toISOString()
    }
    localStorage.setItem(readKey, JSON.stringify(readMap))
  }, [messages, propertyId, threadId, readKey, user?._id])

  useEffect(() => {
    setMessagesPage(1)
    setMessages([])
    setHasMoreMessages(true)
  }, [propertyId, threadId])

  useEffect(() => {
    setThreadsPage(1)
    setThreads([])
    setHasMoreThreads(true)
  }, [propertyId, threadId, user?._id])

  const markThreadRead = (id?: string) => {
    if (!id || !readKey) {
      return
    }
    const readMap = JSON.parse(localStorage.getItem(readKey) || '{}') as Record<string, string>
    readMap[id] = new Date().toISOString()
    localStorage.setItem(readKey, JSON.stringify(readMap))
    setThreads((prev) => [...prev])
  }

  const markAllThreadsRead = () => {
    if (!readKey) {
      return
    }
    const nextReadMap = JSON.parse(localStorage.getItem(readKey) || '{}') as Record<string, string>
    const now = new Date().toISOString()
    filteredThreads.forEach((thread) => {
      const key = getThreadKey(thread)
      if (key) {
        nextReadMap[key] = now
      }
    })
    localStorage.setItem(readKey, JSON.stringify(nextReadMap))
    setThreads((prev) => [...prev])
  }

  useEffect(() => {
    const fetchThreads = async () => {
      if (!user?._id || (propertyId && !threadId)) {
        return
      }
      try {
        setLoading(true)
        const data = await MessageService.getThreads(threadsPage, pageSize)
        setThreads((prev) => (threadsPage === 1 ? data : [...prev, ...data]))
        setHasMoreThreads(data.length === pageSize)

        if (threadId) {
          const activeThread = data.find((t) => t._id === threadId)
          if (activeThread) {
            setCurrentThread(activeThread)
          }
        }
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchThreads()
  }, [user?._id, propertyId, threadId, threadsPage, pageSize])

  const handleCreateOrgGroup = async () => {
    if (!user?._id || !primaryOrgId) {
      return
    }
    try {
      setLoading(true)
      const participantIds = activeOrgMembers
        .map((m) => getId(m.user))
        .filter(Boolean) as string[]
      const title = groupTitle.trim() || `${orgInfo?.name || 'Team'} Pulse`
      const thread = await MessageService.createThread({
        title,
        participants: participantIds,
        orgId: primaryOrgId,
      })
      if (thread._id) {
        navigate(`/messages?threadId=${thread._id}`)
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastBody.trim()) {
      return
    }
    try {
      setLoading(true)
      const result = await MessageService.broadcastMessage({
        developerOrg: primaryOrgId,
        title: broadcastTitle.trim() || undefined,
        message: broadcastBody.trim(),
      })
      setPulseNote(`${strings.BROADCAST_SENT} ${result.delivered}`)
      setBroadcastBody('')
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!recipientId || !message.trim() || !canSend) {
      return
    }
    try {
      setLoading(true)
      const payload: movininTypes.CreateMessagePayload = {
        threadId: threadId || undefined,
        property: threadId ? undefined : propertyId,
        recipient: recipientId,
        message: message.trim(),
      }
      const msg = await MessageService.createMessage(payload)
      setMessages((prev) => [...prev, msg])
      setMessage('')
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleListingTypeChange = (event: SelectChangeEvent<string>) => {
    setThreadListingType(event.target.value as movininTypes.ListingType | '')
  }

  return (
    <Layout strict={false}>
      <div className="messages-page">
        <div className="messages-header">
          <h1>{strings.HEADING}</h1>
        </div>
        {property && (
          <div className="messages-meta">
            <strong>{strings.PROPERTY}:</strong> {property.name}
          </div>
        )}

        {(propertyId || threadId) ? (
          <div className="messages-list">
            {messages.length === 0 && !loading && (
              <div>{strings.EMPTY}</div>
            )}
            {messages.map((row) => (
              <div key={row._id} className="message-item">
                <div className="message-item-header">
                  {typeof row.sender === 'object' ? row.sender.fullName : ''}
                </div>
                <div>{row.message}</div>
              </div>
            ))}
            {hasMoreMessages && !loading && (
              <div className="messages-actions">
                <Button
                  variant="outlined"
                  onClick={() => setMessagesPage((prev) => prev + 1)}
                >
                  {strings.LOAD_MORE}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="messages-list">
            <div className="message-item-header">{strings.INBOX}</div>
            {primaryOrgId && (
              <div className="messages-actions pulse-actions">
                <FormControl margin="dense">
                  <InputLabel>{strings.GROUP_TITLE}</InputLabel>
                  <Input
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    disabled={loading}
                  />
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleCreateOrgGroup}
                  disabled={loading || activeOrgMembers.length === 0}
                >
                  {strings.CREATE_GROUP}
                </Button>
              </div>
            )}
            {orgInfo?.type === movininTypes.OrganizationType.Developer && (
              <div className="messages-actions pulse-actions">
                <FormControl margin="dense">
                  <InputLabel>{strings.BROADCAST_TITLE}</InputLabel>
                  <Input
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    disabled={loading}
                  />
                </FormControl>
                <FormControl margin="dense" fullWidth>
                  <InputLabel>{strings.BROADCAST_BODY}</InputLabel>
                  <Input
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    disabled={loading}
                  />
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleBroadcast}
                  disabled={loading || !broadcastBody.trim()}
                >
                  {strings.BROADCAST}
                </Button>
                {pulseNote && <div className="messages-hint">{pulseNote}</div>}
              </div>
            )}
            <div className="messages-filters">
              <FormControl margin="dense">
                <InputLabel>{strings.SEARCH}</InputLabel>
                <Input
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  disabled={loading}
                />
              </FormControl>
              <FormControl margin="dense">
                <InputLabel>{strings.LISTING_TYPE}</InputLabel>
                <Select
                  value={threadListingType}
                  onChange={handleListingTypeChange}
                  variant="standard"
                >
                  <MenuItem value="">{commonStrings.ALL}</MenuItem>
                  {Object.values(movininTypes.ListingType).map((value) => (
                    <MenuItem key={value} value={value}>
                      {helper.getListingType(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {unreadThreadCount > 0 && (
              <div className="messages-top-actions">
                <Button
                  variant="text"
                  onClick={markAllThreadsRead}
                  disabled={loading}
                >
                  {strings.MARK_ALL_READ}
                </Button>
              </div>
            )}
            {threads.length === 0 && !loading && (
              <div className="messages-empty-state">
                <div className="messages-empty-card">
                  <div className="messages-empty-title">{strings.NO_THREADS}</div>
                  <div className="messages-empty-subtitle">{strings.EMPTY_STATE_HINT}</div>
                </div>
              </div>
            )}
            {filteredThreads.map((thread) => {
              const propertyKey = typeof thread.property === 'string'
                ? thread.property
                : thread.property?._id
              const threadKey = getThreadKey(thread)
              const key = threadKey || thread.lastMessage?._id
              const isUnread = isThreadUnread(thread)

              const propertyName = typeof thread.property === 'object' ? thread.property.name : ''
              const developerName = getOrgName(thread.developerOrg)
              const brokerageName = getOrgName(thread.brokerageOrg)
              const computedTitle = thread.title
                || (thread.type === movininTypes.MessageThreadType.Broadcast
                  ? `${developerName || 'Developer'} -> ${brokerageName || 'Brokerage'}`
                  : propertyName || thread.otherUser?.fullName || strings.INBOX)
              return (
              <div key={key} className="message-item">
                <div className="message-item-header">
                  {computedTitle}
                  <span className={getThreadTypeClass(thread.type)}>{getThreadTypeLabel(thread.type)}</span>
                  {isUnread && <span className="message-unread">{strings.UNREAD}</span>}
                </div>
                <div className="messages-meta">
                  <strong>{strings.RECIPIENT}:</strong>{' '}
                  {thread.otherUser?.fullName || brokerageName || developerName || '-'}
                </div>
                <div>{thread.lastMessage?.message}</div>
                <div className="messages-actions">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (thread._id) {
                        navigate(`/messages?threadId=${thread._id}${propertyKey ? `&propertyId=${propertyKey}` : ''}`)
                      } else if (propertyKey) {
                        navigate(`/messages?propertyId=${propertyKey}`)
                      }
                    }}
                  >
                    {strings.OPEN}
                  </Button>
                  {isUnread && (
                    <Button
                      variant="text"
                      onClick={() => {
                        markThreadRead(threadKey)
                      }}
                    >
                      {strings.MARK_READ}
                    </Button>
                  )}
                </div>
              </div>
            )})}
            {hasMoreThreads && !loading && (
              <div className="messages-actions">
                <Button
                  variant="outlined"
                  onClick={() => setThreadsPage((prev) => prev + 1)}
                >
                  {strings.LOAD_MORE}
                </Button>
              </div>
            )}
          </div>
        )}

        {!user && <div>{strings.SIGN_IN_REQUIRED}</div>}

        {user && recipientId && (
          <div className="message-form">
            <FormControl fullWidth margin="dense">
              <InputLabel>{strings.TYPE_MESSAGE}</InputLabel>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading || !canSend}
              />
            </FormControl>
            <Button
              variant="contained"
              onClick={handleSend}
              size="small"
              disabled={!message.trim() || loading || !canSend}
              className="message-send"
            >
              {strings.SEND}
            </Button>
          </div>
        )}

        {user && propertyId && !threadId && !recipientId && !loading && messages.length === 0 && (
          <div>{strings.NO_RECIPIENT}</div>
        )}
        {user && propertyId && !threadId && recipientId && !canSend && (
          <div className="messages-hint">{strings.OWNER_INITIATES}</div>
        )}
      </div>
      <Footer />
    </Layout>
  )
}

export default Messages
