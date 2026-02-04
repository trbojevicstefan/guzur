import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LeadTable from '@/components/LeadTable'
import ListingTable from '@/components/ListingTable'
import { Bolt, Add, Search, FilterList } from '@mui/icons-material'
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
  const [activeTab, setActiveTab] = useState<'organization' | 'listings'>('listings')

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
      <div className="dashboard dashboard-portal">
        <main className="dashboard-main">
          <div className="dashboard-action-bar">
            <p>
              {dashboardStrings.WELCOME_BACK}{' '}
              <span>{user?.fullName || dashboardStrings.BROKER_LABEL}</span>. {dashboardStrings.OVERVIEW}
            </p>
            <div className="dashboard-action-buttons">
              <button type="button" className="dashboard-ghost">
                <Bolt fontSize="small" /> {dashboardStrings.UPGRADE_PLAN}
              </button>
              <button
                type="button"
                className="dashboard-primary"
                onClick={() => navigate('/dashboard/listings/new')}
              >
                <Add fontSize="small" /> {dashboardStrings.CREATE_LISTING}
              </button>
            </div>
          </div>

          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <Add />
              </div>
              <div>
                <p>{dashboardStrings.ACTIVE_LISTINGS}</p>
                <div className="dashboard-stat-value">
                  <h3>{listings.length}</h3>
                  <span>+12%</span>
                </div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon alt">
                <Bolt />
              </div>
              <div>
                <p>{dashboardStrings.TOTAL_LEADS}</p>
                <div className="dashboard-stat-value">
                  <h3>{leads.length}</h3>
                  <span>+6%</span>
                </div>
              </div>
            </div>
          </div>

          {user && (
            <section className="dashboard-section">
              <div className="dashboard-section-title">
                <span>{dashboardStrings.PROFILE_DETAILS}</span>
              </div>
              <div className="dashboard-profile-card">
                <div>
                  <label>{commonStrings.FULL_NAME}</label>
                  <p>{user.fullName}</p>
                </div>
                <div>
                  <label>{commonStrings.EMAIL}</label>
                  <p>{user.email}</p>
                </div>
                <div>
                  <label>{commonStrings.PHONE}</label>
                  <p>{user.phone || '-'}</p>
                </div>
                <div>
                  <label>{dashboardStrings.BROKERAGE_LABEL}</label>
                  <p className="highlight">{user.company || '-'}</p>
                </div>
                <div>
                  <label>{commonStrings.APPROVAL_STATUS}</label>
                  <p className="status">
                    <span className="status-dot" />
                    {user.approved ? commonStrings.VERIFIED : commonStrings.UNVERIFIED}
                  </p>
                </div>
                <div>
                  <label>{onboardingStrings.LICENSE_ID}</label>
                  <p>{user.licenseId || '-'}</p>
                </div>
                <div>
                  <label>{onboardingStrings.SERVICE_AREAS}</label>
                  <p>{(user.serviceAreas || []).join(', ') || '-'}</p>
                </div>
                <div>
                  <label>{onboardingStrings.WEBSITE}</label>
                  <p className="link">{user.website || '-'}</p>
                </div>
                <button type="button" className="dashboard-edit">
                  {dashboardStrings.EDIT_PROFILE_SETTINGS}
                </button>
              </div>
            </section>
          )}

          <section className="dashboard-section">
            <div className="dashboard-listings-header">
              <h2>{dashboardStrings.MY_LISTINGS}</h2>
              <div className="dashboard-tabs">
                {[
                  { key: 'organization', label: dashboardStrings.ORGANIZATION, route: '/dashboard/organization' },
                  { key: 'listings', label: dashboardStrings.MY_LISTINGS, route: '/dashboard/listings' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={activeTab === tab.key ? 'is-active' : ''}
                    onClick={() => {
                      setActiveTab(tab.key as 'organization' | 'listings')
                      navigate(tab.route)
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="dashboard-table-card">
              <div className="dashboard-table-toolbar">
                <div className="dashboard-search">
                  <Search fontSize="small" />
                  <input placeholder={dashboardStrings.SEARCH_LISTINGS} />
                </div>
                <button type="button" className="dashboard-filter">
                  <FilterList fontSize="small" /> {dashboardStrings.FILTER_SORT}
                </button>
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

              <div className="dashboard-load-more">
                {dashboardStrings.LOAD_MORE_LISTINGS}
              </div>
            </div>
          </section>

          <section className="dashboard-section dashboard-leads">
            <h2>{dashboardStrings.LEADS}</h2>
            {loading ? (
              <div className="dashboard-loading">{commonStrings.LOADING}</div>
            ) : leads.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon" />
                <h4>{dashboardStrings.LEADS_EMPTY_TITLE}</h4>
                <p>{dashboardStrings.LEADS_EMPTY_BODY}</p>
                <button type="button">{dashboardStrings.MARKETING_TIPS}</button>
              </div>
            ) : (
              <LeadTable leads={leads} />
            )}
          </section>
        </main>
      </div>
    </Layout>
  )
}

export default BrokerDashboard
