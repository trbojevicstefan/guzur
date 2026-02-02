import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import DevelopmentList from '@/components/DevelopmentList'
import Pager from '@/components/Pager'
import NoMatch from '@/pages/NoMatch'
import Progress from '@/components/Progress'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'
import * as DevelopmentService from '@/services/DevelopmentService'
import { strings as developerStrings } from '@/lang/developer'
import { strings as developmentStrings } from '@/lang/developments'
import { strings as commonStrings } from '@/lang/common'

import '@/assets/css/developer.css'

const Developer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [developer, setDeveloper] = useState<movininTypes.User>()
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projects, setProjects] = useState<movininTypes.Development[]>([])
  const [noMatch, setNoMatch] = useState(false)
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const website = developer?.website
  const websiteHref = website && !website.startsWith('http') ? `https://${website}` : website

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!id) {
        setNoMatch(true)
        return
      }

      try {
        setLoading(true)
        const data = await UserService.getFrontendDeveloper(id)
        if (!data || !data._id) {
          setNoMatch(true)
          return
        }
        setDeveloper(data)
      } catch (err) {
        helper.error(err)
        setNoMatch(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDeveloper()
  }, [id])

  useEffect(() => {
    const fetchProjects = async () => {
      if (!id) {
        return
      }

      try {
        setLoadingProjects(true)
        const payload: movininTypes.GetDevelopmentsPayload = { developer: id }
        const data = await DevelopmentService.getFrontendDevelopments(payload, page, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        const total = Array.isArray(data?.[0]?.pageInfo) && data?.[0]?.pageInfo.length > 0
          ? data[0].pageInfo[0].totalRecords
          : rows.length
        setProjects(rows)
        setRowCount((page - 1) * env.PAGE_SIZE + rows.length)
        setTotalRecords(total)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [id, page])

  return (
    <Layout strict={false}>
      {loading && <Progress />}
      {noMatch && <NoMatch hideHeader />}
      {!loading && developer && (
        <>
          <div className="developer-page">
            <div className="developer-header">
              <h1>{developer.company || developer.fullName || developerStrings.HEADING}</h1>
              {developer.fullName && developer.company && (
                <div>{developer.fullName}</div>
              )}
            </div>

            <div className="developer-info">
              {developer.website && (
                <div className="developer-info-item">
                  <strong>{developerStrings.WEBSITE}:</strong>{' '}
                  {websiteHref ? <a href={websiteHref} target="_blank" rel="noreferrer">{developer.website}</a> : developer.website}
                </div>
              )}
              {developer.phone && (
                <div className="developer-info-item">
                  <strong>{developerStrings.PHONE}:</strong> {developer.phone}
                </div>
              )}
              {developer.serviceAreas && developer.serviceAreas.length > 0 && (
                <div className="developer-info-item">
                  <strong>{developerStrings.SERVICE_AREAS}:</strong> {developer.serviceAreas.join(', ')}
                </div>
              )}
            </div>

            {developer.bio && (
              <div className="developer-info-item">
                <strong>{developerStrings.ABOUT}:</strong> {developer.bio}
              </div>
            )}

            <div className="developer-projects">
              <h2>{developerStrings.PROJECTS}</h2>
              {loadingProjects ? (
                <div>{commonStrings.LOADING}</div>
              ) : projects.length ? (
                <DevelopmentList
                  developments={projects}
                  showLocation
                  labels={{
                    EMPTY_DEVELOPMENTS: developerStrings.EMPTY_PROJECTS,
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
              ) : (
                <div>{developerStrings.EMPTY_PROJECTS}</div>
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

export default Developer
