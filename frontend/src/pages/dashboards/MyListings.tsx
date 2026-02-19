import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Input,
  InputLabel,
  FormControl,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import ListingTable from '@/components/ListingTable'
import Pager from '@/components/Pager'
import { strings as dashboardStrings } from '@/lang/dashboard'
import { strings as commonStrings } from '@/lang/common'
import * as PropertyService from '@/services/PropertyService'
import * as DevelopmentService from '@/services/DevelopmentService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { buildUpdatePayload } from '@/utils/listingHelper'

import '@/assets/css/dashboard.css'

const MyListings = () => {
  const navigate = useNavigate()
  const locationRoute = useLocation()
  const [user, setUser] = useState<movininTypes.User>()
  const [listings, setListings] = useState<movininTypes.Property[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<movininTypes.ListingStatus | ''>('')
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [developmentId, setDevelopmentId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(locationRoute.search)
    const nextDevelopmentId = params.get('developmentId')
    const nextStatus = params.get('status')
    if (nextDevelopmentId) {
      setDevelopmentId(nextDevelopmentId)
      setPage(1)
    }
    if (nextStatus && Object.values(movininTypes.ListingStatus).includes(nextStatus as movininTypes.ListingStatus)) {
      setStatus(nextStatus as movininTypes.ListingStatus)
      setPage(1)
    }
  }, [locationRoute.search])

  const onLoad = (currentUser?: movininTypes.User) => {
    if (!currentUser) {
      navigate('/sign-in')
      return
    }
    const hasOrg = !!(currentUser.primaryOrg && (typeof currentUser.primaryOrg === 'string' || (currentUser.primaryOrg as movininTypes.Organization)?._id))
    if (!currentUser.onboardingCompleted && !hasOrg) {
      navigate('/onboarding')
      return
    }
    if (![movininTypes.UserType.Broker, movininTypes.UserType.Owner, movininTypes.UserType.Developer].includes(currentUser.type as movininTypes.UserType)) {
      navigate('/dashboard')
      return
    }
    setUser(currentUser)
  }

  useEffect(() => {
    const fetchDevelopments = async () => {
      if (!user?._id || user.type !== movininTypes.UserType.Developer) {
        return
      }
      try {
        const payload: movininTypes.GetDevelopmentsPayload = {
          developer: user._id as string,
        }
        const data = await DevelopmentService.getDevelopments(payload, 1, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        setDevelopments(rows)
      } catch (err) {
        helper.error(err)
      }
    }

    fetchDevelopments()
  }, [user])

  useEffect(() => {
    const fetchListings = async () => {
      if (!user?._id) {
        return
      }
      try {
        setLoading(true)
        const data = await PropertyService.getMyProperties(
          keyword,
          page,
          env.PAGE_SIZE,
          developmentId || undefined,
          status || undefined,
        )
        const rows = data?.[0]?.resultData ?? []
        const total = Array.isArray(data?.[0]?.pageInfo) && data?.[0]?.pageInfo.length > 0
          ? data[0].pageInfo[0].totalRecords
          : rows.length
        setListings(rows)
        setRowCount((page - 1) * env.PAGE_SIZE + rows.length)
        setTotalRecords(total)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [user, page, keyword, status, developmentId])

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value as movininTypes.ListingStatus | '')
    setPage(1)
  }

  const handleDevelopmentChange = (event: SelectChangeEvent<string>) => {
    setDevelopmentId(event.target.value)
    setPage(1)
  }

  const heading = user?.type === movininTypes.UserType.Developer
    ? dashboardStrings.INVENTORY
    : dashboardStrings.MY_LISTINGS
  const createLabel = user?.type === movininTypes.UserType.Developer
    ? dashboardStrings.CREATE_UNIT
    : dashboardStrings.CREATE_LISTING

  return (
    <Layout strict onLoad={onLoad}>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>{heading}</h1>
          <Button
            variant="contained"
            className="btn-primary"
            onClick={() => navigate('/dashboard/listings/new')}
          >
            {createLabel}
          </Button>
        </div>

        <section className="dashboard-section">
          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.SEARCH}</InputLabel>
            <Input
              type="text"
              value={keyword}
              autoComplete="off"
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            />
          </FormControl>
          {user?.type === movininTypes.UserType.Developer && (
            <FormControl fullWidth margin="dense">
              <InputLabel>{dashboardStrings.DEVELOPMENT}</InputLabel>
              <Select
                value={developmentId}
                onChange={handleDevelopmentChange}
                variant="standard"
                fullWidth
              >
                <MenuItem value="">{commonStrings.ALL}</MenuItem>
                {developments.map((development) => (
                  <MenuItem key={development._id as string} value={development._id as string}>
                    {development.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.STATUS}</InputLabel>
            <Select
              value={status}
              onChange={handleStatusChange}
              variant="standard"
              fullWidth
            >
              <MenuItem value="">{commonStrings.ALL}</MenuItem>
              {Object.values(movininTypes.ListingStatus).map((value) => (
                <MenuItem key={value} value={value}>
                  {helper.getListingStatus(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </section>

        <section className="dashboard-section">
          {loading ? <div className="dashboard-loading">{commonStrings.LOADING}</div> : (
          <ListingTable
            listings={listings}
            onEdit={(listing) => navigate(`/dashboard/listings/${listing._id}`)}
            onView={(listing) => navigate(`/property/${listing._id}`, { state: { propertyId: listing._id } })}
            onSubmitReview={async (listing) => {
                try {
                  const full = await PropertyService.getProperty(listing._id)
                  const payload = buildUpdatePayload(full, { listingStatus: movininTypes.ListingStatus.PendingReview })
                  const result = await PropertyService.update(payload)
                  if (result === 200) {
                    helper.info(commonStrings.UPDATED)
                  } else {
                    helper.error()
                  }
                } catch (err) {
                  helper.error(err)
                }
              }}
              onArchive={async (listing) => {
                try {
                  const full = await PropertyService.getProperty(listing._id)
                  const payload = buildUpdatePayload(full, { listingStatus: movininTypes.ListingStatus.Archived })
                  const result = await PropertyService.update(payload)
                  if (result === 200) {
                    helper.info(commonStrings.UPDATED)
                  } else {
                    helper.error()
                  }
                } catch (err) {
                  helper.error(err)
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

export default MyListings
