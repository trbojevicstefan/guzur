import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuItem, Select, SelectChangeEvent, IconButton, Tooltip } from '@mui/material'
import { Bolt, Add, Search, FilterList, VisibilityOutlined, EditOutlined, DeleteOutline } from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LeadTable from '@/components/LeadTable'
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
  const [activeTab, setActiveTab] = useState<'organization' | 'inventory'>('inventory')

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

  const getDevelopmentLocation = (value?: string) => {
    if (!value) {
      return '-'
    }
    if (/^[a-f0-9]{24}$/i.test(value)) {
      return '-'
    }
    return value
  }

  const handleDeleteDevelopment = async (development: movininTypes.Development) => {
    if (!development._id) {
      return
    }
    const confirmed = window.confirm(dashboardStrings.DELETE_DEVELOPMENT_CONFIRM)
    if (!confirmed) {
      return
    }
    try {
      const status = await DevelopmentService.remove(development._id as string)
      if (status === 200) {
        setDevelopments((prev) => prev.filter((item) => item._id !== development._id))
        helper.info(commonStrings.UPDATED)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      <div className="dashboard dashboard-portal">
        <main className="dashboard-main">
          <div className="dashboard-action-bar">
            <p>
              {dashboardStrings.WELCOME_BACK}{' '}
              <span>{user?.fullName || dashboardStrings.DEVELOPER_LABEL}</span>. {dashboardStrings.OVERVIEW}
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
                <Add fontSize="small" /> {dashboardStrings.CREATE_UNIT}
              </button>
            </div>
          </div>

          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <Add />
              </div>
              <div>
                <p>{dashboardStrings.ACTIVE_DEVELOPMENTS}</p>
                <div className="dashboard-stat-value">
                  <h3>{developments.length}</h3>
                  <span>+8%</span>
                </div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon alt">
                <Bolt />
              </div>
              <div>
                <p>{dashboardStrings.TOTAL_INVENTORY}</p>
                <div className="dashboard-stat-value">
                  <h3>{inventory.length}</h3>
                  <span>+4%</span>
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
                  <label>{commonStrings.DEVELOPER}</label>
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
                <button type="button" className="dashboard-edit" onClick={() => navigate('/dashboard/organization')}>
                  {dashboardStrings.EDIT_PROFILE_SETTINGS}
                </button>
              </div>
            </section>
          )}

          <section className="dashboard-section">
            <div className="dashboard-listings-header">
              <h2>{dashboardStrings.INVENTORY}</h2>
              <div className="dashboard-tabs">
                {[
                  { key: 'organization', label: dashboardStrings.ORGANIZATION, route: '/dashboard/organization' },
                  { key: 'inventory', label: dashboardStrings.INVENTORY, route: '/dashboard/listings' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={activeTab === tab.key ? 'is-active' : ''}
                    onClick={() => {
                      setActiveTab(tab.key as 'organization' | 'inventory')
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
              </div>

              <div className="dashboard-filter-row">
                <div className="dashboard-filter-label">
                  <FilterList fontSize="small" /> {dashboardStrings.FILTER_SORT}
                </div>
                <div className="dashboard-filter-controls">
                  <Select
                    value={inventoryDevelopmentId}
                    onChange={handleDevelopmentChange}
                    variant="standard"
                    fullWidth
                    disableUnderline
                  >
                    <MenuItem value="">{commonStrings.ALL}</MenuItem>
                    {developments.map((development) => (
                      <MenuItem key={development._id as string} value={development._id as string}>
                        {development.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Select
                    value={inventoryStatus}
                    onChange={handleInventoryStatusChange}
                    variant="standard"
                    fullWidth
                    disableUnderline
                  >
                    <MenuItem value="">{commonStrings.ALL}</MenuItem>
                    {Object.values(movininTypes.ListingStatus).map((value) => (
                      <MenuItem key={value} value={value}>
                        {helper.getListingStatus(value)}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="dashboard-note">{dashboardStrings.LISTINGS_VIA_INVENTORY}</div>

              {loadingInventory ? (
                <div className="dashboard-loading">{commonStrings.LOADING}</div>
              ) : inventory.length === 0 ? (
                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-icon" />
                  <h4>{dashboardStrings.INVENTORY_EMPTY_TITLE}</h4>
                  <p>{dashboardStrings.INVENTORY_EMPTY_BODY}</p>
                  <button
                    type="button"
                    className="dashboard-primary"
                    onClick={() => navigate('/dashboard/listings/new')}
                  >
                    <Add fontSize="small" /> {dashboardStrings.CREATE_UNIT}
                  </button>
                </div>
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

              <div className="dashboard-load-more">
                {dashboardStrings.LOAD_MORE_LISTINGS}
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-header">
              <h2>{dashboardStrings.DEVELOPMENTS}</h2>
              <button
                type="button"
                className="dashboard-primary"
                onClick={() => navigate('/dashboard/developments/new')}
              >
                <Add fontSize="small" /> {dashboardStrings.CREATE_DEVELOPMENT}
              </button>
            </div>
            {loadingDevelopments ? (
              <div className="dashboard-loading">{commonStrings.LOADING}</div>
            ) : developments.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon" />
                <h4>{dashboardStrings.DEVELOPMENTS_EMPTY_TITLE}</h4>
                <p>{dashboardStrings.DEVELOPMENTS_EMPTY_BODY}</p>
                <button
                  type="button"
                  className="dashboard-primary"
                  onClick={() => navigate('/dashboard/developments/new')}
                >
                  <Add fontSize="small" /> {dashboardStrings.CREATE_DEVELOPMENT}
                </button>
              </div>
            ) : (
              <div className="dashboard-table-card">
                <div className="dashboard-table-scroll">
                  <table className="dashboard-dev-table">
                    <thead>
                      <tr>
                        <th>{dashboardStrings.NAME}</th>
                        <th>{dashboardStrings.STATUS}</th>
                        <th>{dashboardStrings.UNITS}</th>
                        <th>{dashboardStrings.UPDATED}</th>
                        <th>{commonStrings.OPTIONS}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {developments.map((development) => (
                        <tr key={development._id as string}>
                          <td>
                            <div className="dashboard-dev-name">
                              <strong>{development.name}</strong>
                              <span>{getDevelopmentLocation(development.location)}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`dashboard-status status-${(development.status || movininTypes.DevelopmentStatus.Planning).toLowerCase()}`}>
                              {helper.getDevelopmentStatus(development.status) || '-'}
                            </span>
                          </td>
                          <td>{development.unitsCount ?? '-'}</td>
                          <td>{development.updatedAt ? new Date(development.updatedAt).toLocaleDateString() : '-'}</td>
                          <td>
                            <div className="dashboard-dev-actions">
                              <Tooltip title={commonStrings.VIEW} placement="top">
                                <IconButton
                                  className="dashboard-action"
                                  onClick={() => navigate(`/projects/${development._id}`)}
                                  aria-label={commonStrings.VIEW}
                                  size="small"
                                >
                                  <VisibilityOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={commonStrings.UPDATE} placement="top">
                                <IconButton
                                  className="dashboard-action"
                                  onClick={() => navigate('/dashboard/developments/new', { state: { developmentId: development._id } })}
                                  aria-label={commonStrings.UPDATE}
                                  size="small"
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={commonStrings.DELETE} placement="top">
                                <IconButton
                                  className="dashboard-action danger"
                                  onClick={() => handleDeleteDevelopment(development)}
                                  aria-label={commonStrings.DELETE}
                                  size="small"
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="dashboard-section dashboard-leads">
            <h2>{dashboardStrings.LEADS}</h2>
            {loadingLeads ? (
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

export default DeveloperDashboard
