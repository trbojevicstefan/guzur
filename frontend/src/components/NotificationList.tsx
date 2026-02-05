import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import {
  CheckCircle,
  Search,
  FilterList,
  Visibility,
  Archive,
  Delete,
  ChevronLeft,
  ChevronRight,
  NotificationsActive,
  ChatBubbleOutline,
  Bolt,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/notifications'
import * as NotificationService from '@/services/NotificationService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'
import Backdrop from '@/components/SimpleBackdrop'
import { useNotificationContext, NotificationContextType } from '@/context/NotificationContext'

import '@/assets/css/notification-list.css'

interface NotificationListProps {
  user?: movininTypes.User
}

const NotificationList = ({ user }: NotificationListProps) => {
  const navigate = useNavigate()
  const { setNotificationCount } = useNotificationContext() as NotificationContextType

  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<movininTypes.Notification[]>([])
  const [rowCount, setRowCount] = useState(-1)
  const [totalRecords, setTotalRecords] = useState(-1)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedRows, setSelectedRows] = useState<movininTypes.Notification[]>([])
  const [search, setSearch] = useState('')
  const notificationsListRef = useRef<HTMLDivElement>(null)

  const _fr = user && user.language === 'fr'
  const _locale = _fr ? fr : enUS
  const _format = _fr ? 'eee d LLLL • kk:mm' : 'eee, d LLLL • kk:mm'

  const fetch = useCallback(async () => {
    if (user && user._id) {
      try {
        setLoading(true)
        const data = await NotificationService.getNotifications(
          user._id,
          page,
          [movininTypes.NotificationType.General],
        )
        const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
        if (!_data) {
          helper.error()
          return
        }
        const _rows = _data.resultData.map((row) => ({
          checked: false,
          ...row,
        }))
        const _totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0
        setTotalRecords(_totalRecords)
        setRowCount((page - 1) * env.PAGE_SIZE + _rows.length)
        setRows(_rows)
        if (notificationsListRef.current) {
          notificationsListRef.current.scrollTo(0, 0)
        }
        setLoading(false)
      } catch (err) {
        helper.error(err)
      }
    }
  }, [user, page])

  useEffect(() => {
    fetch()
  }, [fetch])

  const checkedRows = rows.filter((row) => row.checked)
  const allChecked = rows.length > 0 && checkedRows.length === rows.length

  const handleSelectAll = () => {
    const _rows = movininHelper.clone(rows) as movininTypes.Notification[]
    const nextChecked = !allChecked
    for (const row of _rows) {
      row.checked = nextChecked
    }
    setRows(_rows)
  }

  const toggleSelect = (id: string) => {
    const _rows = movininHelper.clone(rows) as movininTypes.Notification[]
    const target = _rows.find((row) => row._id === id)
    if (target) {
      target.checked = !target.checked
      setRows(_rows)
    }
  }

  const markSelectedAsRead = async () => {
    try {
      if (!user || !user._id) {
        helper.error()
        return
      }
      const _rows = checkedRows.filter((row) => !row.isRead)
      const ids = _rows.map((row) => row._id)
      if (!ids.length) {
        return
      }
      const status = await NotificationService.markAsRead(user._id, ids)
      if (status === 200) {
        const __rows = movininHelper.clone(rows) as movininTypes.Notification[]
        __rows.filter((row) => ids.includes(row._id)).forEach((row) => {
          row.isRead = true
        })
        setRows(__rows)
        setNotificationCount((prev) => prev - _rows.length)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const markSelectedAsUnread = async () => {
    try {
      if (!user || !user._id) {
        helper.error()
        return
      }
      const _rows = checkedRows.filter((row) => row.isRead)
      const ids = _rows.map((row) => row._id)
      if (!ids.length) {
        return
      }
      const status = await NotificationService.markAsUnread(user._id, ids)
      if (status === 200) {
        const __rows = movininHelper.clone(rows) as movininTypes.Notification[]
        __rows.filter((row) => ids.includes(row._id)).forEach((row) => {
          row.isRead = false
        })
        setRows(__rows)
        setNotificationCount((prev) => prev + _rows.length)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleDeleteSelected = () => {
    setSelectedRows(checkedRows)
    setOpenDeleteDialog(true)
  }

  const getNotificationIcon = (row: movininTypes.Notification) => {
    if (row.type === movininTypes.NotificationType.Message) {
      return <ChatBubbleOutline fontSize="small" />
    }
    if (row.message?.toLowerCase().includes('lead')) {
      return <Bolt fontSize="small" />
    }
    return <NotificationsActive fontSize="small" />
  }

  const visibleRows = rows.filter((row) =>
    row.message?.toLowerCase().includes(search.trim().toLowerCase()),
  )

  const pageStart = totalRecords > 0 ? (page - 1) * env.PAGE_SIZE + 1 : 0
  const pageEnd = rowCount > 0 ? rowCount : 0

  return (
    <>
      <div className="notifications">
        <div className="notifications-header">
          <span className="notifications-badge">{strings.LIVE_ACTIVITY}</span>
          <h1>{strings.HEADING}</h1>
          <p>{strings.SUBHEADING}</p>
        </div>

        {totalRecords === 0 && !loading && (
          <div className="notifications-empty">{strings.EMPTY_LIST}</div>
        )}

        {totalRecords > 0 && (
          <div className="notifications-card">
            <div className="notifications-toolbar">
              <div className="notifications-select" onClick={handleSelectAll}>
                <input type="checkbox" checked={allChecked} readOnly />
                <span>
                  {checkedRows.length > 0
                    ? strings.SELECTED.replace('{count}', String(checkedRows.length))
                    : strings.SELECT_ALL}
                </span>
              </div>

              {checkedRows.length > 0 ? (
                <div className="notifications-actions">
                  <button type="button" onClick={markSelectedAsRead} title={strings.MARK_ALL_AS_READ}>
                    <Visibility fontSize="small" />
                  </button>
                  <button type="button" onClick={markSelectedAsUnread} title={strings.MARK_ALL_AS_UNREAD}>
                    <Archive fontSize="small" />
                  </button>
                  <button type="button" onClick={handleDeleteSelected} title={strings.DELETE_ALL}>
                    <Delete fontSize="small" />
                  </button>
                </div>
              ) : (
                <div className="notifications-search">
                  <div className="notifications-search-input">
                    <Search fontSize="small" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={strings.SEARCH_PLACEHOLDER}
                    />
                  </div>
                  <button type="button" className="notifications-filter">
                    <FilterList fontSize="small" />
                  </button>
                </div>
              )}
            </div>

            <div ref={notificationsListRef} className="notifications-list">
              {visibleRows.map((row) => {
                const unread = !row.isRead
                return (
                  <div
                    key={row._id}
                    className={`notification-row${row.checked ? ' is-selected' : ''}${unread ? ' is-unread' : ''}`}
                    onClick={() => toggleSelect(row._id)}
                  >
                    {unread && <span className="notification-unread" />}
                    <div className="notification-checkbox">
                      <input type="checkbox" checked={row.checked} readOnly />
                    </div>
                    <div className="notification-icon">
                      {getNotificationIcon(row)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-meta">
                        <span>
                          {row.createdAt && movininHelper.capitalize(
                            format(new Date(row.createdAt), _format, {
                              locale: _locale,
                            }),
                          )}
                        </span>
                        {unread && <span className="notification-new">{strings.NEW}</span>}
                      </div>
                      <p>{row.message}</p>
                    </div>
                    <div className="notification-row-actions" onClick={(event) => event.stopPropagation()}>
                      {(row.booking || row.link) && (
                        <button
                          type="button"
                          title={strings.VIEW}
                          onClick={async () => {
                            try {
                              if (!user || !user._id) {
                                helper.error()
                                return
                              }

                              const __navigate__ = () => {
                                const link = row.link || (row.booking ? `/booking?b=${row.booking}` : '')
                                if (!link) {
                                  return
                                }
                                if (link.startsWith('http')) {
                                  window.location.href = link
                                  return
                                }
                                navigate(link)
                              }

                              if (!row.isRead) {
                                const status = await NotificationService.markAsRead(user._id, [row._id])

                                if (status === 200) {
                                  const _rows = movininHelper.cloneArray(rows) as movininTypes.Notification[]
                                  const target = _rows.find((item) => item._id === row._id)
                                  if (target) {
                                    target.isRead = true
                                  }
                                  setRows(_rows)
                                  setNotificationCount((prev) => prev - 1)
                                  __navigate__()
                                } else {
                                  helper.error()
                                }
                              } else {
                                __navigate__()
                              }
                            } catch (err) {
                              helper.error(err)
                            }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </button>
                      )}
                      {!row.isRead ? (
                        <button
                          type="button"
                          title={strings.MARK_AS_READ}
                          onClick={async () => {
                            try {
                              if (!user || !user._id) {
                                helper.error()
                                return
                              }

                              const status = await NotificationService.markAsRead(user._id, [row._id])

                              if (status === 200) {
                                const _rows = movininHelper.cloneArray(rows) as movininTypes.Notification[]
                                const target = _rows.find((item) => item._id === row._id)
                                if (target) {
                                  target.isRead = true
                                }
                                setRows(_rows)
                                setNotificationCount((prev) => prev - 1)
                              } else {
                                helper.error()
                              }
                            } catch (err) {
                              helper.error(err)
                            }
                          }}
                        >
                          <Archive fontSize="small" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title={strings.MARK_AS_UNREAD}
                          onClick={async () => {
                            try {
                              if (!user || !user._id) {
                                helper.error()
                                return
                              }

                              const status = await NotificationService.markAsUnread(user._id, [row._id])

                              if (status === 200) {
                                const _rows = movininHelper.cloneArray(rows) as movininTypes.Notification[]
                                const target = _rows.find((item) => item._id === row._id)
                                if (target) {
                                  target.isRead = false
                                }
                                setRows(_rows)
                                setNotificationCount((prev) => prev + 1)
                              } else {
                                helper.error()
                              }
                            } catch (err) {
                              helper.error(err)
                            }
                          }}
                        >
                          <Archive fontSize="small" />
                        </button>
                      )}
                      <button
                        type="button"
                        title={commonStrings.DELETE}
                        onClick={() => {
                          setSelectedRows([row])
                          setOpenDeleteDialog(true)
                        }}
                      >
                        <Delete fontSize="small" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="notifications-footer">
              <span>{`${pageStart}-${pageEnd} ${commonStrings.OF} ${totalRecords} ${strings.TOTAL}`}</span>
              <div className="notifications-pagination">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => {
                    const _page = page - 1
                    setRowCount(_page < Math.ceil(totalRecords / env.PAGE_SIZE) ? (_page - 1) * env.PAGE_SIZE + env.PAGE_SIZE : totalRecords)
                    setPage(_page)
                  }}
                >
                  <ChevronLeft fontSize="small" />
                </button>
                <span className="notifications-page">{page}</span>
                <button
                  type="button"
                  disabled={(page - 1) * env.PAGE_SIZE + rows.length >= totalRecords}
                  onClick={() => {
                    const _page = page + 1
                    setRowCount(_page < Math.ceil(totalRecords / env.PAGE_SIZE) ? (_page - 1) * env.PAGE_SIZE + env.PAGE_SIZE : totalRecords)
                    setPage(_page)
                  }}
                >
                  <ChevronRight fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        )}

        <Dialog disableEscapeKeyDown maxWidth="xs" open={openDeleteDialog}>
          <DialogTitle className="dialog-header">{commonStrings.CONFIRM_TITLE}</DialogTitle>
          <DialogContent>{selectedRows.length > 1 ? strings.DELETE_NOTIFICATIONS : strings.DELETE_NOTIFICATION}</DialogContent>
          <DialogActions className="dialog-actions">
            <Button
              onClick={() => {
                setOpenDeleteDialog(false)
              }}
              variant="outlined"
            >
              {commonStrings.CANCEL}
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (!user || !user._id) {
                    helper.error()
                    return
                  }

                  const ids = selectedRows.map((row) => row._id)
                  const status = await NotificationService.deleteNotifications(user._id, ids)

                  if (status === 200) {
                    if (selectedRows.length === rows.length) {
                      const _page = 1
                      const _totalRecords = totalRecords - selectedRows.length
                      setRowCount(_page < Math.ceil(_totalRecords / env.PAGE_SIZE) ? (_page - 1) * env.PAGE_SIZE + env.PAGE_SIZE : _totalRecords)

                      if (page > 1) {
                        setPage(1)
                      } else {
                        fetch()
                      }
                    } else {
                      const _rows = movininHelper.clone(rows) as movininTypes.Notification[]
                      setRows(_rows.filter((row) => !ids.includes(row._id)))
                      setRowCount(rowCount - selectedRows.length)
                      setTotalRecords(totalRecords - selectedRows.length)
                    }
                    setNotificationCount((prev) => prev - selectedRows.filter((row) => !row.isRead).length)
                    setOpenDeleteDialog(false)
                  } else {
                    helper.error()
                  }
                } catch (err) {
                  helper.error(err)
                }
              }}
              variant="contained"
              color="primary"
            >
              {commonStrings.DELETE}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      {loading && <Backdrop text={commonStrings.LOADING} />}
    </>
  )
}

export default NotificationList
