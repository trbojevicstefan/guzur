import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  FormControl,
  Input,
  InputLabel,
} from '@mui/material'
import { format } from 'date-fns'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import ListingTable from '@/components/ListingTable'
import Pager from '@/components/Pager'
import NoMatch from '@/pages/NoMatch'
import Progress from '@/components/Progress'
import Map from '@/components/Map'
import env from '@/config/env.config'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as PropertyService from '@/services/PropertyService'
import * as UserService from '@/services/UserService'
import * as movininHelper from ':movinin-helper'
import * as helper from '@/utils/helper'
import { strings as projectStrings } from '@/lang/project'
import { strings as commonStrings } from '@/lang/common'

import '@/assets/css/project.css'

const Project = () => {
  const { id } = useParams()
  const [development, setDevelopment] = useState<movininTypes.Development>()
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [units, setUnits] = useState<movininTypes.Property[]>([])
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const navigate = useNavigate()
  const currentUser = UserService.getCurrentUser()

  useEffect(() => {
    const fetchDevelopment = async () => {
      if (!id) {
        setNoMatch(true)
        return
      }

      try {
        setLoading(true)
        const data = await DevelopmentService.getFrontendDevelopment(id)
        if (!data || !data._id) {
          if (currentUser?._id) {
            const authData = await DevelopmentService.getDevelopment(id)
            if (authData && authData._id) {
              setDevelopment(authData)
              return
            }
          }
          setNoMatch(true)
          return
        }
        setDevelopment(data)
      } catch (err) {
        helper.error(err)
        try {
          if (currentUser?._id) {
            const authData = await DevelopmentService.getDevelopment(id)
            if (authData && authData._id) {
              setDevelopment(authData)
              return
            }
          }
        } catch {
          // ignore fallback errors
        }
        setNoMatch(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopment()
  }, [id, currentUser?._id])

  useEffect(() => {
    const fetchUnits = async () => {
      if (!id) {
        return
      }

      try {
        setLoadingUnits(true)
        const data = await PropertyService.getFrontendDevelopmentUnits(id, keyword, page, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        const total = Array.isArray(data?.[0]?.pageInfo) && data?.[0]?.pageInfo.length > 0
          ? data[0].pageInfo[0].totalRecords
          : rows.length
        setUnits(rows)
        setRowCount((page - 1) * env.PAGE_SIZE + rows.length)
        setTotalRecords(total)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoadingUnits(false)
      }
    }

    fetchUnits()
  }, [id, keyword, page])

  const developer = development && typeof development.developer === 'object'
    ? development.developer
    : undefined

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

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const fallbackSrc = event.currentTarget.dataset.fallback
    if (fallbackSrc) {
      event.currentTarget.src = fallbackSrc
      event.currentTarget.removeAttribute('data-fallback')
      return
    }
    event.currentTarget.style.opacity = '0'
  }

  const getCompletionDate = (value?: Date | string) => {
    if (!value) {
      return '-'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }
    return format(date, 'MMM yyyy')
  }

  const summary = (development?.description || '').trim()
  const heroSummary = summary.length > 180 ? `${summary.slice(0, 177)}...` : summary
  const statusLabel = development ? helper.getDevelopmentStatus(development.status) : ''
  const heroImage = development
    ? resolveImage(development.images?.[0] || development.masterPlan || development.floorPlans?.[0])
    : { src: '', fallbackSrc: '' }
  const masterPlanSource = development ? resolveImage(development.masterPlan) : { src: '', fallbackSrc: '' }

  return (
    <Layout strict={false}>
      {loading && <Progress />}
      {noMatch && <NoMatch hideHeader />}
      {!loading && development && (
        <>
          <div className="project-page">
            <div className="project-hero">
              <div className="project-hero-media">
                {heroImage.src ? (
                  <img
                    src={heroImage.src}
                    data-fallback={heroImage.fallbackSrc || undefined}
                    onError={onImageError}
                    alt={development.name}
                  />
                ) : (
                  <div className="project-hero-placeholder">{development.name?.charAt(0) || 'P'}</div>
                )}
                <div className="project-hero-overlay" />
                <div className="project-hero-badges">
                  {statusLabel && (
                    <span className={`project-hero-badge status-${development.status?.toLowerCase()}`}>
                      {statusLabel}
                    </span>
                  )}
                  {development.location && (
                    <span className="project-hero-badge">{development.location}</span>
                  )}
                  <span className="project-hero-badge">
                    {development.unitsCount ?? 0} {projectStrings.UNITS}
                  </span>
                </div>
              </div>

              <div className="project-hero-content">
                <span className="project-hero-kicker">{projectStrings.HEADING}</span>
                <h1>{development.name || projectStrings.HEADING}</h1>
                {heroSummary && <p className="project-hero-summary">{heroSummary}</p>}
                <div className="project-hero-actions">
                  {developer ? (
                    <Link to={`/developers/${developer._id}`} className="project-hero-link">
                      {projectStrings.VIEW_DEVELOPER}
                      {developer.fullName ? `: ${developer.fullName}` : ''}
                    </Link>
                  ) : (
                    <span className="project-hero-muted">{projectStrings.DEVELOPER}: -</span>
                  )}
                  <a href="#project-units" className="project-hero-cta">{projectStrings.UNITS}</a>
                </div>

                <div className="project-meta">
                  <div className="project-meta-item">
                    <span>{projectStrings.LOCATION}</span>
                    {development.location ? (
                      <Link to={`/projects?location=${encodeURIComponent(development.location)}`}>
                        {development.location}
                      </Link>
                    ) : (
                      <strong>-</strong>
                    )}
                  </div>
                  <div className="project-meta-item">
                    <span>{projectStrings.STATUS}</span>
                    <strong>{statusLabel || '-'}</strong>
                  </div>
                  <div className="project-meta-item">
                    <span>{projectStrings.UNITS}</span>
                    <strong>{development.unitsCount ?? '-'}</strong>
                  </div>
                  <div className="project-meta-item">
                    <span>{projectStrings.COMPLETION}</span>
                    <strong>{getCompletionDate(development.completionDate)}</strong>
                  </div>
                  <div className="project-meta-item">
                    <span>{projectStrings.DEVELOPER}</span>
                    {developer ? (
                      <div className="project-developer">
                        {developer.avatar && (
                          <span className="project-developer-avatar">
                            <img
                              src={developer.avatar.startsWith('http') ? developer.avatar : movininHelper.joinURL(env.CDN_USERS, developer.avatar)}
                              alt={developer.fullName}
                            />
                          </span>
                        )}
                        <strong>{developer.fullName}</strong>
                      </div>
                    ) : (
                      <strong>-</strong>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {development.description && (
              <div className="project-section">
                <h2>{projectStrings.DESCRIPTION}</h2>
                <div className="project-description">{development.description}</div>
              </div>
            )}

            {development.images && development.images.length > 0 && (
              <div className="project-section">
                <h2>{projectStrings.GALLERY}</h2>
                <div className="project-gallery">
                  {development.images.map((img) => {
                    const imageSource = resolveImage(img)
                    return (
                      <div key={img} className="project-gallery-item">
                        {imageSource.src ? (
                          <img
                            src={imageSource.src}
                            data-fallback={imageSource.fallbackSrc || undefined}
                            onError={onImageError}
                            alt={development.name}
                          />
                        ) : (
                          <div className="project-gallery-placeholder">{development.name?.charAt(0) || 'P'}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(development.masterPlan || (development.floorPlans && development.floorPlans.length > 0)) && (
              <div className="project-section">
                <h2>{projectStrings.PLANS}</h2>
                <div className="project-plans">
                  {development.masterPlan && (
                    <div className="project-plan">
                      <div className="project-plan-title">{projectStrings.MASTER_PLAN}</div>
                      {masterPlanSource.src ? (
                        <img
                          src={masterPlanSource.src}
                          data-fallback={masterPlanSource.fallbackSrc || undefined}
                          onError={onImageError}
                          alt={projectStrings.MASTER_PLAN}
                        />
                      ) : (
                        <div className="project-plan-placeholder">{projectStrings.MASTER_PLAN}</div>
                      )}
                    </div>
                  )}
                  {(development.floorPlans || []).map((plan, index) => {
                    const planSource = resolveImage(plan)
                    return (
                      <div key={plan} className="project-plan">
                        <div className="project-plan-title">{projectStrings.FLOOR_PLAN} {index + 1}</div>
                        {planSource.src ? (
                          <img
                            src={planSource.src}
                            data-fallback={planSource.fallbackSrc || undefined}
                            onError={onImageError}
                            alt={projectStrings.FLOOR_PLAN}
                          />
                        ) : (
                          <div className="project-plan-placeholder">{projectStrings.FLOOR_PLAN}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {development.latitude && development.longitude && (
              <div className="project-section">
                <h2>{projectStrings.MAP}</h2>
                <Map
                  position={[development.latitude, development.longitude]}
                  initialZoom={12}
                  showTileToggle
                  className="project-map"
                />
              </div>
            )}

            <div className="project-section" id="project-units">
              <h2>{projectStrings.UNITS}</h2>
              <div className="project-units-filters">
                <FormControl fullWidth margin="dense">
                  <InputLabel>{projectStrings.SEARCH_UNITS}</InputLabel>
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
              </div>

              {loadingUnits ? (
                <div>{commonStrings.LOADING}</div>
              ) : units.length ? (
                <ListingTable
                  listings={units}
                  onMessage={currentUser ? (listing) => {
                    if (listing._id) {
                      navigate(`/messages?propertyId=${listing._id}`)
                    }
                  } : undefined}
                />
              ) : (
                <div className="project-units-empty">{projectStrings.EMPTY_UNITS}</div>
              )}

              <Pager
                page={page}
                pageSize={env.PAGE_SIZE}
                rowCount={rowCount}
                totalRecords={totalRecords}
                onNext={() => setPage(page + 1)}
                onPrevious={() => setPage(page - 1)}
              />
            </div>
          </div>
          <Footer />
        </>
      )}
    </Layout>
  )
}

export default Project
