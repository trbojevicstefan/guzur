import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LeadTable from '@/components/LeadTable'
import DevelopmentList from '@/components/DevelopmentList'
import ListingTable from '@/components/ListingTable'
import { strings as dashboardStrings } from '@/lang/dashboard'
import { strings as onboardingStrings } from '@/lang/onboarding'
import { strings as commonStrings } from '@/lang/common'
import * as LeadService from '@/services/LeadService'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as PropertyService from '@/services/PropertyService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { buildUpdatePayload } from '@/utils/listingHelper'

import '@/assets/css/dashboard.css'

const DeveloperDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<movininTypes.User>()
  const [leads, setLeads] = useState<movininTypes.Lead[]>([])
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [inventory, setInventory] = useState<movininTypes.Property[]>([])
  const [inventoryDevelopmentId, setInventoryDevelopmentId] = useState('')
  const [inventoryStatus, setInventoryStatus] = useState<movininTypes.ListingStatus | ''>('')
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loadingDevelopments, setLoadingDevelopments] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)

  const onLoad = (currentUser?: movininTypes.User) => {
    if (!currentUser) {
      return
    }
    const hasOrg = !!(currentUser.primaryOrg && (typeof currentUser.primaryOrg === 'string' || (currentUser.primaryOrg as movininTypes.Organization)?._id))
    if (!currentUser.onboardingCompleted && !hasOrg) {
      navigate('/onboarding')
      return
    }
    if (currentUser.type !== movininTypes.UserType.Developer) {
      navigate('/dashboard')
      return
    }
    setUser(currentUser)
  }

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user?._id) {
        return
      }
      try {
        setLoadingLeads(true)
        const payload: movininTypes.GetLeadsPayload = {
          assignedTo: user._id as string,
        }
        const data = await LeadService.getLeads(payload, 1, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        setLeads(rows)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoadingLeads(false)
      }
    }

    const fetchDevelopments = async () => {
      if (!user?._id) {
        return
      }
      try {
        setLoadingDevelopments(true)
        const orgId = typeof user.primaryOrg === 'string'
          ? user.primaryOrg
          : user.primaryOrg?._id
        const payload: movininTypes.GetDevelopmentsPayload = {
          developer: orgId ? undefined : (user._id as string),
          developerOrgs: orgId ? [orgId] : undefined,
        }
        const data = await DevelopmentService.getDevelopments(payload, 1, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        setDevelopments(rows)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoadingDevelopments(false)
      }
    }

    fetchLeads()
    fetchDevelopments()
  }, [user])

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user?._id) {
        return
      }
      try {
        setLoadingInventory(true)
        const developmentId = inventoryDevelopmentId || undefined
        const data = await PropertyService.getMyProperties('', 1, env.PAGE_SIZE, developmentId, inventoryStatus || undefined)
        const rows = data?.[0]?.resultData ?? []
        setInventory(rows)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoadingInventory(false)
      }
    }

    fetchInventory()
  }, [user, inventoryDevelopmentId, inventoryStatus])

  const handleDevelopmentChange = (event: SelectChangeEvent<string>) => {
    setInventoryDevelopmentId(event.target.value)
  }

  const handleInventoryStatusChange = (event: SelectChangeEvent<string>) => {
    setInventoryStatus(event.target.value as movininTypes.ListingStatus | '')
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      <div className="dashboard">
        <h1>{dashboardStrings.DASHBOARD}</h1>
        {user && (
          <section className="dashboard-section">
            <h2>{dashboardStrings.PROFILE}</h2>
            <div className="dashboard-profile">
              <div><strong>{commonStrings.FULL_NAME}:</strong> {user.fullName}</div>
              <div><strong>{commonStrings.EMAIL}:</strong> {user.email}</div>
              <div><strong>{commonStrings.PHONE}:</strong> {user.phone}</div>
              <div><strong>{commonStrings.DEVELOPER}:</strong> {user.company || '-'}</div>
              <div><strong>{commonStrings.APPROVAL_STATUS}:</strong> {user.approved ? commonStrings.VERIFIED : commonStrings.UNVERIFIED}</div>
              <div><strong>{onboardingStrings.LICENSE_ID}:</strong> {user.licenseId || '-'}</div>
              <div><strong>{onboardingStrings.SERVICE_AREAS}:</strong> {(user.serviceAreas || []).join(', ') || '-'}</div>
              <div><strong>{onboardingStrings.WEBSITE}:</strong> {user.website || '-'}</div>
            </div>
            <div className="dashboard-actions">
              <Button
                variant="outlined"
                className="btn-secondary"
                onClick={() => navigate('/dashboard/organization')}
              >
                {dashboardStrings.ORGANIZATION}
              </Button>
            </div>
          </section>
        )}

        <section className="dashboard-section">
          <div className="dashboard-header">
            <h2>{dashboardStrings.DEVELOPMENTS}</h2>
            <Button
              variant="contained"
              className="btn-primary"
              onClick={() => navigate('/dashboard/developments/new')}
            >
              {dashboardStrings.CREATE_DEVELOPMENT}
            </Button>
          </div>
          {loadingDevelopments ? (
            <div className="dashboard-loading">{commonStrings.LOADING}</div>
          ) : (
            <>
              <DevelopmentList developments={developments} />
              {developments.length === 0 && (
                <div className="dashboard-note">{dashboardStrings.EMPTY_DEVELOPMENTS}</div>
              )}
            </>
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-header">
            <h2>{dashboardStrings.INVENTORY}</h2>
            <Button
              variant="contained"
              className="btn-primary"
              onClick={() => navigate('/dashboard/listings/new')}
            >
              {dashboardStrings.CREATE_UNIT}
            </Button>
          </div>
          <div className="dashboard-note">
            {dashboardStrings.LISTINGS_VIA_INVENTORY}
          </div>
          <FormControl fullWidth margin="dense">
            <InputLabel>{dashboardStrings.DEVELOPMENT}</InputLabel>
            <Select
              value={inventoryDevelopmentId}
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
          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.STATUS}</InputLabel>
            <Select
              value={inventoryStatus}
              onChange={handleInventoryStatusChange}
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
          {loadingInventory ? (
            <div className="dashboard-loading">{commonStrings.LOADING}</div>
          ) : (
              <ListingTable
                listings={inventory}
                onEdit={(listing) => navigate(`/dashboard/listings/${listing._id}`)}
                onView={(listing) => navigate(`/property/${listing._id}`, { state: { propertyId: listing._id } })}
                onSubmitReview={async (listing) => {
                try {
                  const full = await PropertyService.getProperty(listing._id)
                  const payload = buildUpdatePayload(full, { listingStatus: movininTypes.ListingStatus.PendingReview })
                  const status = await PropertyService.update(payload)
                  if (status === 200) {
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
                  const status = await PropertyService.update(payload)
                  if (status === 200) {
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

        <section className="dashboard-section">
          <h2>{dashboardStrings.LEADS}</h2>
          {loadingLeads ? <div className="dashboard-loading">{commonStrings.LOADING}</div> : <LeadTable leads={leads} />}
        </section>
      </div>
    </Layout>
  )
}

export default DeveloperDashboard
