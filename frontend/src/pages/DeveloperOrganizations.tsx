import React, { useEffect, useRef, useState } from 'react'
import { Search, Tune } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import OrganizationList from '@/components/OrganizationList'
import Footer from '@/components/Footer'
import { strings as orgStrings } from '@/lang/organizations'
import { strings as commonStrings } from '@/lang/common'
import { strings as headerStrings } from '@/lang/header'
import * as OrganizationService from '@/services/OrganizationService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

import '@/assets/css/agencies.css'

const DeveloperOrganizations = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [organizations, setOrganizations] = useState<movininTypes.Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await OrganizationService.getFrontendOrganizations(
          movininTypes.OrganizationType.Developer,
          page,
          env.PAGE_SIZE,
          keyword,
        )
        const rows = data?.[0]?.resultData ?? []
        setOrganizations((prev) => (page === 1 ? rows : [...prev, ...rows]))
        setHasMore(rows.length === env.PAGE_SIZE)
      } catch (err) {
        helper.error(err)
        if (page === 1) {
          setOrganizations([])
        }
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [keyword, page])

  useEffect(() => {
    setPage(1)
    setHasMore(true)
  }, [keyword])

  useEffect(() => {
    if (!observerRef.current) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage((prev) => prev + 1)
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [loading, hasMore])

  return (
    <Layout strict={false}>
      <div className="agencies">
        <div className="agencies-hero">
          <div className="agencies-hero-text">
            <div className="agencies-breadcrumb">
              <span>{headerStrings.HOME}</span>
              <span className="agencies-breadcrumb-sep">/</span>
              <span className="agencies-breadcrumb-current">{orgStrings.DEVELOPERS}</span>
            </div>
            <h1>{orgStrings.DEVELOPERS_TITLE || orgStrings.DEVELOPERS}</h1>
            <p className="agencies-subtitle">
              {orgStrings.DEVELOPERS_SUBTITLE
                ? orgStrings.DEVELOPERS_SUBTITLE.replace('{count}', String(organizations.length))
                : `${organizations.length} ${commonStrings.RESULTS}`}
            </p>
          </div>
          <div className="agencies-toolbar">
            <label className="agencies-search">
              <Search className="agencies-search-icon" />
              <input
                type="text"
                value={keyword}
                autoComplete="off"
                placeholder={orgStrings.DEVELOPERS_SEARCH_PLACEHOLDER || orgStrings.SEARCH}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="agencies-filters"
              onClick={() => setKeyword('')}
            >
              <Tune className="agencies-filters-icon" />
              {commonStrings.CLEAR}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="agencies-empty">{commonStrings.LOADING}</div>
        ) : organizations.length === 0 ? (
          <div className="agencies-empty">{orgStrings.EMPTY}</div>
        ) : (
          <OrganizationList
            organizations={organizations}
            onSelect={(org) => org.slug && navigate(`/developers/org/${org.slug}`)}
          />
        )}
        <div ref={observerRef} className="agencies-sentinel" />
      </div>
      <Footer />
    </Layout>
  )
}

export default DeveloperOrganizations
