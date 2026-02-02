import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FormControl,
  Input,
  InputLabel,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import DevelopmentList from '@/components/DevelopmentList'
import LocationSelectList from '@/components/LocationSelectList'
import Pager from '@/components/Pager'
import { strings as developmentStrings } from '@/lang/developments'
import { strings as commonStrings } from '@/lang/common'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as LocationService from '@/services/LocationService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

import '@/assets/css/developments.css'

const Projects = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Location | undefined>(undefined)
  const [status, setStatus] = useState<movininTypes.DevelopmentStatus | ''>('')
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    const fetchDevelopments = async () => {
      try {
        setLoading(true)
        const payload: movininTypes.GetDevelopmentsPayload = {
          keyword,
          location: location || undefined,
          status: status || undefined,
        }
        const data = await DevelopmentService.getFrontendDevelopments(payload, page, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        const total = Array.isArray(data?.[0]?.pageInfo) && data?.[0]?.pageInfo.length > 0
          ? data[0].pageInfo[0].totalRecords
          : rows.length
        setDevelopments(rows)
        setRowCount((page - 1) * env.PAGE_SIZE + rows.length)
        setTotalRecords(total)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopments()
  }, [keyword, location, status, page])

  useEffect(() => {
    const initLocation = async () => {
      const paramLocation = searchParams.get('location') || ''
      if (!paramLocation) {
        setLocation('')
        setSelectedLocation(undefined)
        setPage(1)
        return
      }
      if (paramLocation !== location) {
        setLocation(paramLocation)
        setPage(1)
        try {
          const loc = await LocationService.getLocation(paramLocation)
          setSelectedLocation(loc)
        } catch (err) {
          helper.error(err)
        }
      }
    }

    initLocation()
  }, [searchParams])

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value as movininTypes.DevelopmentStatus | '')
    setPage(1)
  }

  return (
    <Layout strict={false}>
      <div className="developments-page">
        <div className="developments-page-header">
          <h1>{developmentStrings.HEADING}</h1>
          <Link to="/projects/browse" className="developments-browse-link">
            {developmentStrings.BROWSE_BY_LOCATION}
          </Link>
        </div>
        {selectedLocation?.name && (
          <div className="developments-filter-summary">
            <span>
              {developmentStrings.FILTERED_BY_LOCATION}: {selectedLocation.name}
            </span>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setLocation('')
                setSelectedLocation(undefined)
                setPage(1)
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.delete('location')
                  return next
                })
              }}
            >
              {developmentStrings.CLEAR_LOCATION}
            </Button>
          </div>
        )}

        <section className="developments-filters">
          <FormControl fullWidth margin="dense">
            <InputLabel>{developmentStrings.SEARCH}</InputLabel>
            <Input
              type="text"
              value={keyword}
              className="developments-search-input"
              autoComplete="off"
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <LocationSelectList
              label={developmentStrings.LOCATION}
              variant="standard"
              hidePopupIcon
              init
              value={selectedLocation}
              onChange={(values) => {
                const selected = values[0]
                const nextLocation = selected?._id || ''
                setLocation(nextLocation)
                setSelectedLocation(selected as movininTypes.Location)
                setPage(1)
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  if (nextLocation) {
                    next.set('location', nextLocation)
                  } else {
                    next.delete('location')
                  }
                  return next
                })
              }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{developmentStrings.STATUS}</InputLabel>
            <Select
              value={status}
              onChange={handleStatusChange}
              variant="standard"
              fullWidth
            >
              <MenuItem value="">{developmentStrings.ALL_STATUSES}</MenuItem>
              {Object.values(movininTypes.DevelopmentStatus).map((value) => (
                <MenuItem key={value} value={value}>
                  {helper.getDevelopmentStatus(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </section>

        <section className="developments-results">
          {loading ? (
            <div className="developments-loading">{commonStrings.LOADING}</div>
          ) : (
            <DevelopmentList
              developments={developments}
              showLocation
              showDeveloper
              labels={{
                EMPTY_DEVELOPMENTS: developmentStrings.EMPTY,
                NAME: developmentStrings.NAME,
                STATUS: developmentStrings.STATUS,
                UNITS: developmentStrings.UNITS,
                UPDATED: developmentStrings.UPDATED,
                LOCATION: developmentStrings.LOCATION,
                DEVELOPER: developmentStrings.DEVELOPER,
              }}
              onSelect={(development) => {
                if (development._id) {
                  navigate(`/projects/${development._id}`)
                }
              }}
            />
          )}
        </section>

        <Pager
          page={page}
          pageSize={env.PAGE_SIZE}
          rowCount={rowCount}
          totalRecords={totalRecords}
          onNext={() => setPage(page + 1)}
          onPrevious={() => setPage(page - 1)}
        />
      </div>
    </Layout>
  )
}

export default Projects
