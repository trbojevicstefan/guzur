import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
} from '@mui/material'
import { Apartment as ProjectsIcon, Person as ProfileIcon } from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import Const from '@/config/const'
import * as UserService from '@/services/UserService'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/developers'
import Pager from '@/components/Pager'
import Progress from '@/components/Progress'

import '@/assets/css/developer-list.css'

interface DeveloperListProps {
  keyword?: string
  onLoad?: movininTypes.DataEvent<movininTypes.User>
}

const DeveloperList = ({ keyword: listKeyword, onLoad }: DeveloperListProps) => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(listKeyword || '')
  const [init, setInit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)
  const [rows, setRows] = useState<movininTypes.User[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({})

  const fetchData = async (_page: number, _keyword?: string) => {
    try {
      setLoading(true)
      const payload: movininTypes.GetUsersBody = {
        user: '',
        types: [movininTypes.UserType.Developer],
      }
      const data = await UserService.getUsers(payload, _keyword || '', _page, env.PAGE_SIZE)
      const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
      if (!_data) {
        helper.error()
        return
      }
      const _totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0

      let _rows: movininTypes.User[] = []
      if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
        _rows = _page === 1 ? _data.resultData : [...rows, ..._data.resultData]
      } else {
        _rows = _data.resultData
      }

      setRows(_rows)
      setRowCount((_page - 1) * env.PAGE_SIZE + _rows.length)
      setTotalRecords(_totalRecords)
      setFetch(_data.resultData.length > 0)

      if (onLoad) {
        onLoad({ rows: _data.resultData, rowCount: _totalRecords })
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      setInit(false)
    }
  }

  const loadCounts = async (developers: movininTypes.User[]) => {
    const pending = developers.filter((dev) => dev._id && projectCounts[dev._id as string] === undefined)
    if (pending.length === 0) {
      return
    }
    const updates: Record<string, number> = {}
    await Promise.all(pending.map(async (dev) => {
      try {
        const data = await DevelopmentService.getDevelopments({ developer: dev._id as string }, '', 1, 1)
      const _data = (data && data.length > 0 ? data[0] : undefined) ?? { pageInfo: [], resultData: [] }
      const pageInfo = Array.isArray(_data.pageInfo) ? _data.pageInfo : []
      const total = pageInfo.length > 0 ? (pageInfo[0] as { totalRecords?: number }).totalRecords ?? 0 : 0
        updates[dev._id as string] = total
      } catch {
        updates[dev._id as string] = 0
      }
    }))
    setProjectCounts((prev) => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    if (listKeyword !== keyword) {
      fetchData(1, listKeyword)
    }
    setKeyword(listKeyword || '')
  }, [listKeyword, keyword]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData(page, keyword)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rows.length > 0) {
      loadCounts(rows)
    }
  }, [rows]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
      const element = document.querySelector('body')
      if (element) {
        element.onscroll = () => {
          if (fetch
            && !loading
            && window.scrollY > 0
            && window.scrollY + window.innerHeight + env.INFINITE_SCROLL_OFFSET >= document.body.scrollHeight) {
            setLoading(true)
            setPage(page + 1)
          }
        }
      }
    }
  }, [fetch, loading, page, keyword])

  return (
    <>
      <section className="developer-list">
        {rows.length === 0
          ? !init
          && !loading
          && (
            <Card variant="outlined" className="empty-list">
              <CardContent>
                <Typography color="textSecondary">{strings.EMPTY_LIST}</Typography>
              </CardContent>
            </Card>
          )
          : rows.map((developer) => {
            const avatarUrl = developer.avatar && env.CDN_USERS
              ? movininHelper.joinURL(env.CDN_USERS, developer.avatar)
              : ''
            const initials = (developer.fullName || '').split(' ').map((word) => word[0]).join('').substring(0, 2).toUpperCase()
            const projectCount = developer._id ? projectCounts[developer._id as string] : undefined
            const isApproved = !!developer.approved

            return (
              <article key={developer._id}>
                <div className="developer-item">
                  <div className="developer-item-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={developer.fullName} />
                    ) : (
                      <span className="developer-item-initials">{initials || '?'}</span>
                    )}
                  </div>
                  <div className="developer-item-details">
                    <span className="developer-item-title">{developer.fullName}</span>
                    {developer.company && (
                      <span className="developer-item-subtitle">{developer.company}</span>
                    )}
                    <div className="developer-item-meta">
                      {developer.email && <span>{developer.email}</span>}
                      {developer.phone && <span>{developer.phone}</span>}
                      {developer.website && <span>{developer.website}</span>}
                    </div>
                  </div>
                </div>
                <div className="developer-actions">
                  <Chip
                    size="small"
                    className={isApproved ? 'status approved' : 'status pending'}
                    label={isApproved ? strings.APPROVED : strings.PENDING}
                  />
                  <span className="developer-projects">
                    {strings.PROJECTS}: {projectCount ?? '-'}
                  </span>
                  <Button
                    size="small"
                    startIcon={<ProjectsIcon />}
                    className="developer-action-btn"
                    onClick={() => navigate(`/developments?developer=${developer._id}`)}
                  >
                    {strings.VIEW_PROJECTS}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ProfileIcon />}
                    className="developer-action-btn"
                    onClick={() => navigate(`/user?u=${developer._id}`)}
                  >
                    {strings.VIEW_PROFILE}
                  </Button>
                </div>
              </article>
            )
          })}

        {loading && <Progress />}
      </section>

      {env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile && (
        <Pager
          page={page}
          pageSize={env.PAGE_SIZE}
          rowCount={rowCount}
          totalRecords={totalRecords}
          onNext={() => setPage(page + 1)}
          onPrevious={() => setPage(page - 1)}
        />
      )}
    </>
  )
}

export default DeveloperList
