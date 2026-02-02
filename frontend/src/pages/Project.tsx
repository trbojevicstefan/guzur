import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  FormControl,
  Input,
  InputLabel,
} from '@mui/material'
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

  const resolveImage = (value?: string) => {
    if (!value) {
      return ''
    }
    if (value.startsWith('http')) {
      return value
    }
    return movininHelper.joinURL(env.CDN_PROPERTIES, value)
  }

  return (
    <Layout strict={false}>
      {loading && <Progress />}
      {noMatch && <NoMatch hideHeader />}
      {!loading && development && (
        <>
          <div className="project-page">
            <div className="project-header">
              <h1>{development.name || projectStrings.HEADING}</h1>
            </div>

            <h2>{projectStrings.DETAILS}</h2>
            <div className="project-meta">
              <div className="project-meta-item">
                <strong>{projectStrings.LOCATION}:</strong>{' '}
                {development.location ? (
                  <Link to={`/projects?location=${encodeURIComponent(development.location)}`}>
                    {development.location}
                  </Link>
                ) : (
                  '-'
                )}
              </div>
              <div className="project-meta-item">
                <strong>{projectStrings.STATUS}:</strong>{' '}
                {helper.getDevelopmentStatus(development.status) || '-'}
              </div>
              <div className="project-meta-item">
                <strong>{projectStrings.UNITS}:</strong> {development.unitsCount ?? '-'}
              </div>
              <div className="project-meta-item">
                <strong>{projectStrings.DEVELOPER}:</strong>{' '}
                {developer ? (
                  <Link to={`/developers/${developer._id}`} className="project-developer-link">
                    {developer.avatar && (
                      <span className="project-developer-avatar">
                        <img
                          src={developer.avatar.startsWith('http') ? developer.avatar : movininHelper.joinURL(env.CDN_USERS, developer.avatar)}
                          alt={developer.fullName}
                        />
                      </span>
                    )}
                    {developer.fullName}
                  </Link>
                ) : (
                  '-'
                )}
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
                  {development.images.map((img) => (
                    <div key={img} className="project-gallery-item">
                      <img src={resolveImage(img)} alt={development.name} />
                    </div>
                  ))}
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
                      <img src={resolveImage(development.masterPlan)} alt={projectStrings.MASTER_PLAN} />
                    </div>
                  )}
                  {(development.floorPlans || []).map((plan, index) => (
                    <div key={plan} className="project-plan">
                      <div className="project-plan-title">{projectStrings.FLOOR_PLAN} {index + 1}</div>
                      <img src={resolveImage(plan)} alt={projectStrings.FLOOR_PLAN} />
                    </div>
                  ))}
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

            <div className="project-section">
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
