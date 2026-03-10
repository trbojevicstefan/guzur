import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMediaQuery } from '@mui/material'
import {
  Search,
  GridView,
  ViewList,
  TrendingUp,
  PlaceOutlined,
  AccessTime,
  ArrowOutward,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import { format } from 'date-fns'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LocationSelectList from '@/components/LocationSelectList'
import { strings as developmentStrings } from '@/lang/developments'
import { strings as commonStrings } from '@/lang/common'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as LocationService from '@/services/LocationService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import * as movininHelper from ':movinin-helper'
import {
  buildProjectBrowseParams,
  parseProjectBrowseParams,
} from '@/utils/publicSearch'

import '@/assets/css/developments.css'

const Projects = () => {
  const navigate = useNavigate()
  const isCompactViewport = useMediaQuery('(max-width:900px)')
  const [searchParams, setSearchParams] = useSearchParams()
  const browseState = parseProjectBrowseParams(searchParams)

  const [keywordInput, setKeywordInput] = useState(browseState.q)
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Location | undefined>(undefined)
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [knownLocations, setKnownLocations] = useState<movininTypes.Location[]>([])

  const updateBrowseState = (partial: Partial<typeof browseState>) => {
    const nextState = {
      ...browseState,
      ...partial,
    }
    const params = buildProjectBrowseParams(nextState)
    setSearchParams(params, { replace: false })
  }

  useEffect(() => {
    setKeywordInput(browseState.q)
  }, [browseState.q])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (keywordInput !== browseState.q) {
        updateBrowseState({ q: keywordInput, page: 1 })
      }
    }, 350)

    return () => {
      window.clearTimeout(handle)
    }
  }, [browseState.q, keywordInput])

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await LocationService.getLocations('', 1, 500)
        const rows = data?.[0]?.resultData ?? []
        setKnownLocations(Array.isArray(rows) ? rows : [])
      } catch (err) {
        helper.error(err)
      }
    }

    loadLocations()
  }, [])

  useEffect(() => {
    if (!browseState.location || knownLocations.length === 0) {
      setSelectedLocation(undefined)
      return
    }

    const matchedLocation = knownLocations.find((location) => location.name === browseState.location)
    setSelectedLocation(matchedLocation)
  }, [browseState.location, knownLocations])

  useEffect(() => {
    const fetchDevelopments = async () => {
      try {
        setLoading(true)
        setError('')
        const payload: movininTypes.GetDevelopmentsPayload = {
          q: browseState.q || undefined,
          location: browseState.location || undefined,
          status: browseState.status || undefined,
        }
        const data = await DevelopmentService.getFrontendDevelopments(payload, browseState.page, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        const total = Array.isArray(data?.[0]?.pageInfo) && data?.[0]?.pageInfo.length > 0
          ? data[0].pageInfo[0].totalRecords
          : rows.length
        setDevelopments(rows)
        setRowCount((browseState.page - 1) * env.PAGE_SIZE + rows.length)
        setTotalRecords(total)
      } catch (err) {
        helper.error(err)
        setError(developmentStrings.LOAD_ERROR)
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopments()
  }, [browseState.location, browseState.page, browseState.q, browseState.status])

  const formatCompletionDate = (value?: Date | string) => {
    if (!value) {
      return developmentStrings.TBA
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return developmentStrings.TBA
    }
    return format(date, 'MMM yyyy')
  }

  const getDisplayLocation = (development: movininTypes.Development) => {
    const locationLabel = typeof development.location === 'string' ? development.location.trim() : ''
    return locationLabel || developmentStrings.TBA
  }

  const statusLabel = (value?: movininTypes.DevelopmentStatus) => {
    if (!value) {
      return ''
    }
    return helper.getDevelopmentStatus(value)
  }

  const getDevelopmentName = (development: movininTypes.Development) => {
    if (development.developerOrg && typeof development.developerOrg === 'object') {
      return development.developerOrg.name || ''
    }
    if (development.developer && typeof development.developer === 'object') {
      return development.developer.fullName || ''
    }
    return ''
  }

  const normalizeImageName = (value?: string) => {
    if (!value) {
      return ''
    }
    const trimmed = value.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      return ''
    }
    return trimmed
  }

  const resolveImage = (value?: string) => {
    const imageName = normalizeImageName(value)
    if (!imageName) {
      return { src: '', fallbackSrc: '' }
    }
    if (imageName.startsWith('http')) {
      return { src: imageName, fallbackSrc: '' }
    }
    return {
      src: movininHelper.joinURL(env.CDN_PROPERTIES, imageName),
      fallbackSrc: movininHelper.joinURL(env.CDN_TEMP_PROPERTIES, imageName),
    }
  }

  const getDevelopmentImage = (development: movininTypes.Development) =>
    resolveImage(development.images?.[0] || development.masterPlan || development.floorPlans?.[0])

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const fallbackSrc = event.currentTarget.dataset.fallback
    if (fallbackSrc) {
      event.currentTarget.src = fallbackSrc
      event.currentTarget.removeAttribute('data-fallback')
      return
    }
    event.currentTarget.style.opacity = '0'
  }

  const pageStart = totalRecords > 0 ? (browseState.page - 1) * env.PAGE_SIZE + 1 : 0
  const pageEnd = rowCount > 0 ? rowCount : 0

  return (
    <Layout strict={false}>
      <div className="projects-page">
        <div className="projects-header">
          <div className="projects-title">
            <span className="projects-badge">
              <TrendingUp fontSize="inherit" />
              {developmentStrings.MARKET_DEVELOPMENT}
            </span>
            <h1>{developmentStrings.HEADING}</h1>
            <p>{developmentStrings.SUBHEADING}</p>
          </div>

          <div className="projects-actions">
            <div className="projects-layout-toggle">
              <button
                type="button"
                className={browseState.layout === 'grid' ? 'is-active' : ''}
                onClick={() => updateBrowseState({ layout: 'grid' })}
              >
                <GridView fontSize="small" />
              </button>
              <button
                type="button"
                className={browseState.layout === 'list' ? 'is-active' : ''}
                onClick={() => updateBrowseState({ layout: 'list' })}
              >
                <ViewList fontSize="small" />
              </button>
            </div>
          </div>
        </div>

        <div className="projects-filters">
          <div className="projects-search">
            <Search fontSize="small" />
            <input
              type="text"
              value={keywordInput}
              placeholder={developmentStrings.SEARCH_PLACEHOLDER}
              onChange={(e) => {
                setKeywordInput(e.target.value)
              }}
            />
          </div>

          <div className="projects-divider" />

          <div className="projects-location">
            <PlaceOutlined fontSize="small" />
            <LocationSelectList
              label={developmentStrings.LOCATION}
              variant="outlined"
              hidePopupIcon
              init
              value={selectedLocation}
              onChange={(values) => {
                const selected = values[0] as movininTypes.Location | undefined
                setSelectedLocation(selected)
                updateBrowseState({
                  location: selected?.name || '',
                  page: 1,
                })
              }}
            />
          </div>

          <div className="projects-divider" />

          <label className="projects-status" htmlFor="projects-status-select">
            <span>{developmentStrings.STATUS}</span>
            <select
              id="projects-status-select"
              value={browseState.status}
              onChange={(event) => {
                updateBrowseState({
                  status: event.target.value as movininTypes.DevelopmentStatus | '',
                  page: 1,
                })
              }}
            >
              <option value="">{developmentStrings.ALL_STATUSES}</option>
              <option value={movininTypes.DevelopmentStatus.Planning}>{commonStrings.DEVELOPMENT_STATUS_PLANNING}</option>
              <option value={movininTypes.DevelopmentStatus.InProgress}>{commonStrings.DEVELOPMENT_STATUS_IN_PROGRESS}</option>
              <option value={movininTypes.DevelopmentStatus.Completed}>{commonStrings.DEVELOPMENT_STATUS_COMPLETED}</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="projects-loading">{commonStrings.LOADING}</div>
        ) : error ? (
          <div className="projects-loading">{error}</div>
        ) : developments.length === 0 ? (
          <div className="projects-loading">{developmentStrings.EMPTY}</div>
        ) : browseState.layout === 'grid' || isCompactViewport ? (
          <div className="projects-grid">
            {developments.map((project) => {
              const projectImage = getDevelopmentImage(project)
              return (
                <div key={project._id} className="project-card">
                  <div className="project-card-media">
                    {projectImage.src ? (
                      <img
                        src={projectImage.src}
                        data-fallback={projectImage.fallbackSrc || undefined}
                        onError={onImageError}
                        alt={project.name}
                      />
                    ) : (
                      <div className="project-card-placeholder">{project.name?.charAt(0) || 'P'}</div>
                    )}
                    <div className="project-card-overlay" />
                    {project.status && (
                      <span className={`project-card-status status-${project.status?.toLowerCase()}`}>
                        {statusLabel(project.status)}
                      </span>
                    )}
                    <div className="project-card-units">
                      {project.unitsCount || 0} {developmentStrings.PLANNED_UNITS}
                    </div>
                  </div>
                  <div className="project-card-body">
                    <div className="project-card-location">
                      <PlaceOutlined fontSize="inherit" />
                      {getDisplayLocation(project)}
                    </div>
                    <h3>{project.name}</h3>
                    <p>{developmentStrings.DEVELOPED_BY.replace('{name}', getDevelopmentName(project) || developmentStrings.TBA)}</p>
                    <div className="project-card-footer">
                      <div>
                        <span>{developmentStrings.OPEN_DATE}</span>
                        <div>
                          <AccessTime fontSize="inherit" />
                          {formatCompletionDate(project.completionDate)}
                        </div>
                      </div>
                      <button type="button" onClick={() => project._id && navigate(`/projects/${project._id}`)}>
                        <ArrowOutward fontSize="small" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="projects-table">
            <table>
              <thead>
                <tr>
                  <th>{developmentStrings.NAME}</th>
                  <th>{developmentStrings.LOCATION}</th>
                  <th>{developmentStrings.DEVELOPER}</th>
                  <th>{developmentStrings.UNITS}</th>
                  <th>{developmentStrings.COMPLETION}</th>
                  <th>{developmentStrings.ACTIONS}</th>
                </tr>
              </thead>
              <tbody>
                {developments.map((project) => {
                  const projectImage = getDevelopmentImage(project)
                  return (
                    <tr key={project._id}>
                      <td>
                        <div className="project-table-name">
                          {projectImage.src ? (
                            <img
                              src={projectImage.src}
                              data-fallback={projectImage.fallbackSrc || undefined}
                              onError={onImageError}
                              alt={project.name}
                            />
                          ) : (
                            <div className="project-table-placeholder">{project.name?.charAt(0) || 'P'}</div>
                          )}
                          <div>
                            <strong>{project.name}</strong>
                            {project.status && (
                              <span className={`project-card-status status-${project.status?.toLowerCase()}`}>
                                {statusLabel(project.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="project-table-location">
                          <PlaceOutlined fontSize="inherit" />
                          {getDisplayLocation(project)}
                        </span>
                      </td>
                      <td>{getDevelopmentName(project) || developmentStrings.TBA}</td>
                      <td className="project-table-units">{project.unitsCount || 0}</td>
                      <td className="project-table-date">
                        <AccessTime fontSize="inherit" />
                        {formatCompletionDate(project.completionDate)}
                      </td>
                      <td className="project-table-actions">
                        <button type="button" onClick={() => project._id && navigate(`/projects/${project._id}`)}>
                          <ArrowOutward fontSize="small" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="projects-pagination">
          <span className="projects-pagination-summary">{`${pageStart}-${pageEnd} ${commonStrings.OF} ${totalRecords} ${developmentStrings.TOTAL}`}</span>
          <div className="projects-pagination-controls">
            <button
              type="button"
              disabled={browseState.page === 1}
              onClick={() => updateBrowseState({ page: browseState.page - 1 })}
            >
              <ChevronLeft fontSize="small" />
            </button>
            <span className="projects-pagination-page">{browseState.page}</span>
            <button
              type="button"
              disabled={(browseState.page - 1) * env.PAGE_SIZE + developments.length >= totalRecords}
              onClick={() => updateBrowseState({ page: browseState.page + 1 })}
            >
              <ChevronRight fontSize="small" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Projects
