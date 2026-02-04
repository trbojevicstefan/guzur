import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import {
  Add,
  AttachFile,
  MoreHoriz,
  OpenInNew,
  Search,
  Send,
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
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
  const [toolsOpen, setToolsOpen] = useState(false)
  const [threadTab, setThreadTab] = useState<'active' | 'archived' | 'starred'>('active')

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

  const activeProperty = useMemo(() => {
    if (property) {
      return property
    }
    if (typeof currentThread?.property === 'object') {
      return currentThread.property
    }
    return undefined
  }, [property, currentThread])

  const formatThreadTime = (thread: movininTypes.MessageThread) => {
    const time = getLastMessageTime(thread)
    if (!time) {
      return ''
    }
    const date = new Date(time)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (diffDays === 1) {
      return strings.YESTERDAY
    }
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const formatMessageDate = (value?: string | Date) => {
    if (!value) {
      return ''
    }
    const date = new Date(value)
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  }

  const getThreadAvatar = (thread: movininTypes.MessageThread) => {
    const name = thread.otherUser?.fullName || getOrgName(thread.brokerageOrg) || getOrgName(thread.developerOrg) || thread.title || 'G'
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getThreadTitle = (thread: movininTypes.MessageThread) => {
    const propertyName = typeof thread.property === 'object' ? thread.property.name : ''
    const developerName = getOrgName(thread.developerOrg)
    const brokerageName = getOrgName(thread.brokerageOrg)
    return thread.title
      || (thread.type === movininTypes.MessageThreadType.Broadcast
        ? `${developerName || 'Developer'} -> ${brokerageName || 'Brokerage'}`
        : propertyName || thread.otherUser?.fullName || strings.INBOX)
  }

  const getThreadSubtitle = (thread: movininTypes.MessageThread) => {
    const propertyName = typeof thread.property === 'object' ? thread.property.name : ''
    return propertyName || thread.title || ''
  }

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
      <div className="messages-page pulse-shell">
        <aside className="pulse-sidebar">
          <div className="pulse-sidebar-header">
            <div className="pulse-brand">
              <span className="pulse-brand-mark">G</span>
              <span className="pulse-brand-title">{strings.HEADING}</span>
            </div>
            <button
              type="button"
              className="pulse-add"
              onClick={() => setToolsOpen((prev) => !prev)}
              aria-label={strings.NEW_MESSAGE}
            >
              <Add />
            </button>
          </div>

          <div className="pulse-search">
            <Search className="pulse-search-icon" />
            <input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder={strings.SEARCH_PLACEHOLDER}
              disabled={loading}
            />
          </div>

          <div className="pulse-tabs">
            {(['active', 'archived', 'starred'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`pulse-tab ${threadTab === tab ? 'is-active' : ''}`}
                onClick={() => setThreadTab(tab)}
              >
                {tab === 'active' ? strings.ACTIVE : tab === 'archived' ? strings.ARCHIVED : strings.STARRED}
              </button>
            ))}
            <Select
              value={threadListingType}
              onChange={handleListingTypeChange}
              variant="standard"
              className="pulse-type-select"
              disableUnderline
            >
              <MenuItem value="">{commonStrings.ALL}</MenuItem>
              {Object.values(movininTypes.ListingType).map((value) => (
                <MenuItem key={value} value={value}>
                  {helper.getListingType(value)}
                </MenuItem>
              ))}
            </Select>
          </div>

          {toolsOpen && (
            <div className="pulse-tools">
              {primaryOrgId && (
                <div className="pulse-tool">
                  <input
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder={strings.GROUP_TITLE}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleCreateOrgGroup}
                    disabled={loading || activeOrgMembers.length === 0}
                  >
                    {strings.CREATE_GROUP}
                  </button>
                </div>
              )}
              {orgInfo?.type === movininTypes.OrganizationType.Developer && (
                <div className="pulse-tool pulse-tool-broadcast">
                  <input
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder={strings.BROADCAST_TITLE}
                    disabled={loading}
                  />
                  <input
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder={strings.BROADCAST_BODY}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleBroadcast}
                    disabled={loading || !broadcastBody.trim()}
                  >
                    {strings.BROADCAST}
                  </button>
                  {pulseNote && <div className="pulse-note">{pulseNote}</div>}
                </div>
              )}
            </div>
          )}

          <div className="pulse-thread-list">
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
              const subtitle = getThreadSubtitle(thread)
              return (
                <button
                  key={key}
                  type="button"
                  className={`pulse-thread ${threadId === thread._id ? 'is-selected' : ''}`}
                  onClick={() => {
                    if (thread._id) {
                      navigate(`/messages?threadId=${thread._id}${propertyKey ? `&propertyId=${propertyKey}` : ''}`)
                      markThreadRead(threadKey)
                    } else if (propertyKey) {
                      navigate(`/messages?propertyId=${propertyKey}`)
                      markThreadRead(threadKey)
                    }
                  }}
                >
                  <span className="pulse-avatar">{getThreadAvatar(thread)}</span>
                  <div className="pulse-thread-body">
                    <div className="pulse-thread-row">
                      <span className="pulse-thread-title">{getThreadTitle(thread)}</span>
                      <span className="pulse-thread-time">{formatThreadTime(thread)}</span>
                    </div>
                    {subtitle && <div className="pulse-thread-subject">{subtitle}</div>}
                    <div className="pulse-thread-preview">{thread.lastMessage?.message || strings.EMPTY}</div>
                  </div>
                  {isUnread && <span className="pulse-unread">1</span>}
                </button>
              )
            })}
            {hasMoreThreads && !loading && (
              <button
                type="button"
                className="pulse-load"
                onClick={() => setThreadsPage((prev) => prev + 1)}
              >
                {strings.LOAD_MORE}
              </button>
            )}
          </div>
        </aside>

        <section className="pulse-chat">
          <div className="pulse-chat-header">
            <div className="pulse-chat-person">
              <span className="pulse-chat-avatar">
                {currentThread ? getThreadAvatar(currentThread) : 'G'}
              </span>
              <div>
                <div className="pulse-chat-name">{currentThread ? getThreadTitle(currentThread) : strings.INBOX}</div>
                <div className="pulse-chat-status">
                  <span className="pulse-status-dot" />
                  {strings.ACTIVE_NOW}
                </div>
              </div>
            </div>
            {activeProperty && (
              <div className="pulse-linked">
                <div className="pulse-linked-icon">
                  <OpenInNew />
                </div>
                <div className="pulse-linked-body">
                  <div className="pulse-linked-label">{strings.LINKED_PROPERTY}</div>
                  <div className="pulse-linked-title">{activeProperty.name}</div>
                  {(activeProperty.salePrice || activeProperty.price) && (
                    <div className="pulse-linked-price">
                      {movininHelper.formatPrice(
                        Number(activeProperty.salePrice ?? activeProperty.price ?? 0),
                        commonStrings.CURRENCY,
                        user?.language || env.DEFAULT_LANGUAGE,
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <button type="button" className="pulse-chat-more" aria-label={strings.MORE}>
              <MoreHoriz />
            </button>
          </div>

          <div className="pulse-chat-body">
            {messages.length === 0 && !loading && (
              <div className="pulse-empty">{strings.EMPTY}</div>
            )}
            {messages.length > 0 && (
              <div className="pulse-date-pill">{formatMessageDate(messages[messages.length - 1]?.createdAt)}</div>
            )}
            <div className="pulse-bubbles">
              {messages.map((row) => {
                const senderId = getId(row.sender)
                const isMine = senderId === user?._id
                return (
                  <div key={row._id} className={`pulse-bubble ${isMine ? 'is-mine' : 'is-theirs'}`}>
                    <div className="pulse-bubble-text">{row.message}</div>
                    <div className="pulse-bubble-time">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                  </div>
                )
              })}
            </div>
            {hasMoreMessages && !loading && (
              <button
                type="button"
                className="pulse-load"
                onClick={() => setMessagesPage((prev) => prev + 1)}
              >
                {strings.LOAD_MORE}
              </button>
            )}
          </div>

          <div className="pulse-composer">
            <button type="button" className="pulse-attach" aria-label={strings.ATTACH}>
              <AttachFile />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || !canSend}
              placeholder={strings.TYPE_MESSAGE}
            />
            <button type="button" className="pulse-attach" aria-label={strings.PROFILE}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </button>
            <button
              type="button"
              className="pulse-send"
              onClick={handleSend}
              disabled={!message.trim() || loading || !canSend}
            >
              <Send />
            </button>
          </div>
          <div className="pulse-footer-note">{strings.VERIFIED_CHANNEL}</div>

          {!user && <div className="pulse-empty">{strings.SIGN_IN_REQUIRED}</div>}
          {user && propertyId && !threadId && !recipientId && !loading && messages.length === 0 && (
            <div className="pulse-empty">{strings.NO_RECIPIENT}</div>
          )}
          {user && propertyId && !threadId && recipientId && !canSend && (
            <div className="pulse-empty">{strings.OWNER_INITIATES}</div>
          )}
        </section>
      </div>
      <Footer />
    </Layout>
  )
}

export default Messages
