import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  FilterList,
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

import '@/assets/css/developments.css'

const cairoLocations = [
  'Fifth Settlement, New Cairo',
  'Sheikh Zayed City',
  'Zamalek, Cairo',
  'Maadi, Cairo',
  'Heliopolis, Cairo',
  'New Capital, Cairo',
]

const Projects = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Location | undefined>(undefined)
  const [status] = useState<movininTypes.DevelopmentStatus | ''>('')
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [projectLayout, setProjectLayout] = useState<'grid' | 'list'>('grid')

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
  }, [location, searchParams])

  const formatCompletionDate = (value?: Date | string) => {
    if (!value) {
      return ''
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return format(date, 'MMM yyyy')
  }

  const getOpenDate = (development: movininTypes.Development) => {
    const explicitCompletion = formatCompletionDate(development.completionDate)
    if (explicitCompletion) {
      return explicitCompletion
    }

    const base = development.updatedAt ? new Date(development.updatedAt) : new Date()
    let monthsToAdd = 18
    if (development.status === movininTypes.DevelopmentStatus.InProgress) {
      monthsToAdd = 12
    }
    if (development.status === movininTypes.DevelopmentStatus.Completed) {
      monthsToAdd = 6
    }
    if (development.status === movininTypes.DevelopmentStatus.Planning) {
      monthsToAdd = 24
    }
    const future = new Date(base)
    future.setMonth(future.getMonth() + monthsToAdd)
    if (future <= new Date()) {
      future.setMonth(future.getMonth() + 6)
    }
    return format(future, 'MMM yyyy')
  }

  const getDisplayLocation = (development: movininTypes.Development) => {
    if (selectedLocation?.name) {
      return selectedLocation.name
    }
    if (development.location && !/\d/.test(development.location)) {
      return development.location
    }
    const seed = (development.name || '').length
    return cairoLocations[seed % cairoLocations.length]
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
      fallbackSrc: movininHelper.joinURL(`${env.API_HOST}/cdn/movinin/temp/properties`, imageName),
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

  const visibleDevelopments = useMemo(() => developments, [developments])

  const pageStart = totalRecords > 0 ? (page - 1) * env.PAGE_SIZE + 1 : 0
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
                className={projectLayout === 'grid' ? 'is-active' : ''}
                onClick={() => setProjectLayout('grid')}
              >
                <GridView fontSize="small" />
              </button>
              <button
                type="button"
                className={projectLayout === 'list' ? 'is-active' : ''}
                onClick={() => setProjectLayout('list')}
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
              value={keyword}
              placeholder={developmentStrings.SEARCH_PLACEHOLDER}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
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
          </div>

          <div className="projects-divider" />

          <button type="button" className="projects-more-filters">
            <FilterList fontSize="small" />
            {developmentStrings.MORE_FILTERS}
          </button>
        </div>

        {loading ? (
          <div className="projects-loading">{commonStrings.LOADING}</div>
        ) : projectLayout === 'grid' ? (
          <div className="projects-grid">
            {visibleDevelopments.map((project) => {
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
                    <p>{developmentStrings.DEVELOPED_BY.replace('{name}', getDevelopmentName(project) || '-')}</p>
                    <div className="project-card-footer">
                      <div>
                        <span>{developmentStrings.OPEN_DATE}</span>
                        <div>
                          <AccessTime fontSize="inherit" />
                          {getOpenDate(project)}
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
                {visibleDevelopments.map((project) => {
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
                      <td>{getDevelopmentName(project) || '-'}</td>
                      <td className="project-table-units">{project.unitsCount || 0}</td>
                      <td className="project-table-date">
                        <AccessTime fontSize="inherit" />
                        {getOpenDate(project)}
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
          <span>{`${pageStart}-${pageEnd} ${commonStrings.OF} ${totalRecords} ${developmentStrings.TOTAL}`}</span>
          <div>
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
            <span>{page}</span>
            <button
              type="button"
              disabled={(page - 1) * env.PAGE_SIZE + developments.length >= totalRecords}
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
    </Layout>
  )
}

export default Projects
