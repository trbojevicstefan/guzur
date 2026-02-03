import React, { useEffect, useMemo, useRef, useState } from 'react'
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

const Brokerages = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [organizations, setOrganizations] = useState<movininTypes.Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const observerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await OrganizationService.getFrontendOrganizations(
          movininTypes.OrganizationType.Brokerage,
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

  const visibleOrganizations = useMemo(
    () => (verifiedOnly ? organizations.filter((org) => org.verified) : organizations),
    [organizations, verifiedOnly],
  )

  const subtitle = orgStrings.BROKERAGES_SUBTITLE
    ? orgStrings.BROKERAGES_SUBTITLE.replace('{count}', String(visibleOrganizations.length))
    : `${visibleOrganizations.length} ${commonStrings.RESULTS}`

  return (
    <Layout strict={false}>
      <div className="agencies">
        <div className="agencies-hero">
          <div className="agencies-hero-text">
            <div className="agencies-breadcrumb">
              <span>{headerStrings.HOME}</span>
              <span className="agencies-breadcrumb-sep">/</span>
              <span className="agencies-breadcrumb-current">{orgStrings.BROKERAGES}</span>
            </div>
            <h1>{orgStrings.BROKERAGES_TITLE || orgStrings.BROKERAGES}</h1>
            <p className="agencies-subtitle">{subtitle}</p>
          </div>
          <div className="agencies-toolbar">
            <label className="agencies-search">
              <Search className="agencies-search-icon" />
              <input
                type="text"
                value={keyword}
                autoComplete="off"
                placeholder={orgStrings.BROKERAGES_SEARCH_PLACEHOLDER || orgStrings.SEARCH}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="agencies-filters"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <Tune className="agencies-filters-icon" />
              {commonStrings.FILTERS}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="agencies-filters-panel">
            <label className="agencies-filter-item">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(event) => setVerifiedOnly(event.target.checked)}
              />
              <span>{commonStrings.VERIFIED_ONLY}</span>
            </label>
            <button
              type="button"
              className="agencies-filter-clear"
              onClick={() => setVerifiedOnly(false)}
            >
              {commonStrings.CLEAR}
            </button>
          </div>
        )}

        {loading ? (
          <div className="agencies-empty">{commonStrings.LOADING}</div>
        ) : visibleOrganizations.length === 0 ? (
          <div className="agencies-empty">{orgStrings.EMPTY}</div>
        ) : (
          <OrganizationList
            organizations={visibleOrganizations}
            onSelect={(org) => org.slug && navigate(`/brokers/${org.slug}`)}
          />
        )}
        <div ref={observerRef} className="agencies-sentinel" />
      </div>
      <Footer />
    </Layout>
  )
}

export default Brokerages
