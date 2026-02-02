import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LeadTable from '@/components/LeadTable'
import ListingTable from '@/components/ListingTable'
import { Button } from '@mui/material'
import { strings as dashboardStrings } from '@/lang/dashboard'
import { strings as onboardingStrings } from '@/lang/onboarding'
import { strings as commonStrings } from '@/lang/common'
import * as LeadService from '@/services/LeadService'
import * as PropertyService from '@/services/PropertyService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { buildUpdatePayload } from '@/utils/listingHelper'

import '@/assets/css/dashboard.css'

const BrokerDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<movininTypes.User>()
  const [leads, setLeads] = useState<movininTypes.Lead[]>([])
  const [listings, setListings] = useState<movininTypes.Property[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingListings, setLoadingListings] = useState(false)

  const onLoad = (currentUser?: movininTypes.User) => {
    if (!currentUser) {
      return
    }
    const hasOrg = !!(currentUser.primaryOrg && (typeof currentUser.primaryOrg === 'string' || (currentUser.primaryOrg as movininTypes.Organization)?._id))
    if (!currentUser.onboardingCompleted && !hasOrg) {
      navigate('/onboarding')
      return
    }
    if (![movininTypes.UserType.Broker].includes(currentUser.type as movininTypes.UserType)) {
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
        setLoading(true)
        const payload: movininTypes.GetLeadsPayload = {
          assignedTo: user._id as string,
        }
        const data = await LeadService.getLeads(payload, 1, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        setLeads(rows)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()

    const fetchListings = async () => {
      if (!user?._id) {
        return
      }
      try {
        setLoadingListings(true)
        const data = await PropertyService.getMyProperties('', 1, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        setListings(rows)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoadingListings(false)
      }
    }
    fetchListings()
  }, [user])

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
              <div><strong>{commonStrings.BROKER}:</strong> {user.company || '-'}</div>
              <div><strong>{commonStrings.APPROVAL_STATUS}:</strong> {user.approved ? commonStrings.VERIFIED : commonStrings.UNVERIFIED}</div>
              <div><strong>{onboardingStrings.LICENSE_ID}:</strong> {user.licenseId || '-'}</div>
              <div><strong>{onboardingStrings.SERVICE_AREAS}:</strong> {(user.serviceAreas || []).join(', ') || '-'}</div>
              <div><strong>{onboardingStrings.WEBSITE}:</strong> {user.website || '-'}</div>
            </div>
          </section>
        )}

        <section className="dashboard-section">
          <h2>{dashboardStrings.MY_LISTINGS}</h2>
          <div className="dashboard-actions">
            <Button
              variant="outlined"
              className="btn-secondary"
              onClick={() => navigate('/dashboard/organization')}
            >
              {dashboardStrings.ORGANIZATION}
            </Button>
            <Button
              variant="contained"
              className="btn-primary"
              onClick={() => navigate('/dashboard/listings')}
            >
              {dashboardStrings.MY_LISTINGS}
            </Button>
            <Button
              variant="outlined"
              className="btn-secondary"
              onClick={() => navigate('/dashboard/listings/new')}
            >
              {dashboardStrings.CREATE_LISTING}
            </Button>
          </div>
          {loadingListings ? (
            <div className="dashboard-loading">{commonStrings.LOADING}</div>
          ) : (
              <ListingTable
                listings={listings}
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
          {loading ? <div className="dashboard-loading">{commonStrings.LOADING}</div> : <LeadTable leads={leads} />}
        </section>
      </div>
    </Layout>
  )
}

export default BrokerDashboard
