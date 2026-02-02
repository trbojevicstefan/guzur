import React, { useEffect, useRef, useState } from 'react'
import { Input, InputLabel, FormControl, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import OrganizationList from '@/components/OrganizationList'
import Footer from '@/components/Footer'
import { strings as orgStrings } from '@/lang/organizations'
import { strings as commonStrings } from '@/lang/common'
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

  return (
    <Layout strict={false}>
      <div className="agencies">
        <div className="agencies-header">
          <div>
            <h1>{orgStrings.BROKERAGES}</h1>
            <div className="agencies-subtitle">{organizations.length} {commonStrings.RESULTS}</div>
          </div>
          <div className="agencies-toolbar">
            <FormControl fullWidth margin="dense">
              <InputLabel>{orgStrings.SEARCH}</InputLabel>
              <Input
                type="text"
                value={keyword}
                autoComplete="off"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </FormControl>
            <Button
              variant="outlined"
              className="agencies-clear"
              onClick={() => setKeyword('')}
            >
              {commonStrings.CLEAR}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="agencies-empty">{commonStrings.LOADING}</div>
        ) : organizations.length === 0 ? (
          <div className="agencies-empty">{orgStrings.EMPTY}</div>
        ) : (
          <OrganizationList
            organizations={organizations}
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
