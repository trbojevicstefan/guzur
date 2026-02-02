import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
} from '@mui/material'
import { Group as MembersIcon, ManageAccounts as ManageIcon } from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import Const from '@/config/const'
import * as OrganizationService from '@/services/OrganizationService'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/organizations'
import Pager from '@/components/Pager'
import Progress from '@/components/Progress'

import '@/assets/css/organization-list.css'

interface OrganizationListProps {
  keyword?: string
  type?: movininTypes.OrganizationType | ''
  onLoad?: movininTypes.DataEvent<movininTypes.Organization>
}

const OrganizationList = ({ keyword: listKeyword, type, onLoad }: OrganizationListProps) => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(listKeyword || '')
  const [init, setInit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)
  const [rows, setRows] = useState<movininTypes.Organization[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)

  const fetchData = async (_page: number, _keyword?: string, _type?: movininTypes.OrganizationType | '') => {
    try {
      setLoading(true)
      const data = await OrganizationService.getOrganizations(_keyword || '', _type, _page, env.PAGE_SIZE)
      const _data = data && data.length > 0 ? data[0] as { pageInfo: Array<{ totalRecords?: number }>; resultData: movininTypes.Organization[] } : { pageInfo: [], resultData: [] }
      if (!_data) {
        helper.error()
        return
      }
      const _totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0
        ? (_data.pageInfo[0]?.totalRecords ?? 0)
        : 0

      let _rows: movininTypes.Organization[] = []
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

  useEffect(() => {
    if (listKeyword !== keyword || type !== undefined) {
      fetchData(1, listKeyword, type)
    }
    setKeyword(listKeyword || '')
  }, [listKeyword, keyword, type]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData(page, keyword, type)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [fetch, loading, page, keyword, type])

  return (
    <>
      <section className="organization-list-admin">
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
          : rows.map((org) => (
            <article key={org._id}>
              <div className="organization-item">
                <div className="organization-item-details">
                  <span className="organization-item-title">{org.name}</span>
                  <span className="organization-item-subtitle">{strings.TYPE}: {org.type}</span>
                  <div className="organization-item-meta">
                    {org.email && <span>{org.email}</span>}
                    {org.phone && <span>{org.phone}</span>}
                    {org.website && <span>{org.website}</span>}
                  </div>
                </div>
              </div>
              <div className="organization-actions">
                <Chip
                  size="small"
                  className={org.approved ? 'status approved' : 'status pending'}
                  label={org.approved ? strings.APPROVED : strings.PENDING}
                />
                <Chip
                  size="small"
                  className={org.active ? 'status active' : 'status inactive'}
                  label={org.active ? strings.ACTIVE : strings.INACTIVE}
                />
                <Button
                  size="small"
                  startIcon={<ManageIcon />}
                  className="organization-action-btn"
                  onClick={() => navigate(`/organization?o=${org._id}`)}
                >
                  {strings.MANAGE}
                </Button>
                <Button
                  size="small"
                  startIcon={<MembersIcon />}
                  className="organization-action-btn"
                  onClick={() => navigate(`/organization?o=${org._id}#members`)}
                >
                  {strings.MEMBERS}
                </Button>
              </div>
            </article>
          ))}

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

export default OrganizationList
