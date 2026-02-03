import React from 'react'
import { ArrowForward, Star } from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import { strings as orgStrings } from '@/lang/organizations'

import '@/assets/css/organization-list.css'

interface OrganizationListProps {
  organizations: movininTypes.Organization[]
  onSelect?: (organization: movininTypes.Organization) => void
}

const OrganizationList = ({ organizations, onSelect }: OrganizationListProps) => (
  <div className="organization-list">
    {organizations.map((org) => {
      const ratingValue = Number.isFinite(Number((org as { rating?: number }).rating))
        ? Number((org as { rating?: number }).rating)
        : undefined
      const listingCountRaw = (org as {
        activeListings?: number
        listingCount?: number
        propertiesCount?: number
        listingsCount?: number
      }).activeListings
        ?? (org as { listingCount?: number }).listingCount
        ?? (org as { propertiesCount?: number }).propertiesCount
        ?? (org as { listingsCount?: number }).listingsCount
      const listingCount = Number.isFinite(Number(listingCountRaw)) ? Number(listingCountRaw) : 0
      const initials = (org.name || '')
        .split(' ')
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
        || '?'

      return (
        <div
          key={org._id}
          className="organization-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(org)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect?.(org)
            }
          }}
        >
          <div className="organization-card-cover">
            {org.cover ? (
              <img
                src={org.cover.startsWith('http') ? org.cover : (env.CDN_USERS ? movininHelper.joinURL(env.CDN_USERS, org.cover) : org.cover)}
                alt={org.name}
              />
            ) : (
              <span className="organization-card-cover-fallback" />
            )}
            <span className="organization-card-gradient" />
            {org.verified && (
              <span className="organization-card-badge">{orgStrings.TOP_RATED}</span>
            )}
          </div>
          <div className="organization-card-body">
            <div className="organization-card-logo">
              <div className="organization-card-logo-inner">
                {org.logo ? (
                  <img
                    src={org.logo.startsWith('http') ? org.logo : (env.CDN_USERS ? movininHelper.joinURL(env.CDN_USERS, org.logo) : org.logo)}
                    alt={org.name}
                  />
                ) : (
                  <span className="organization-card-initials">{initials}</span>
                )}
              </div>
            </div>
            <div className="organization-card-header">
              <h3 className="organization-card-title">{org.name}</h3>
              {ratingValue !== undefined && (
                <div className="organization-card-rating">
                  <Star className="organization-card-rating-icon" />
                  {ratingValue.toFixed(1)}
                </div>
              )}
            </div>
            {org.description && (
              <p className="organization-card-description">{org.description}</p>
            )}
            {org.serviceAreas && org.serviceAreas.length > 0 && (
              <div className="organization-card-tags">
                {org.serviceAreas.slice(0, 2).map((area) => (
                  <span key={area} className="organization-card-tag">{area}</span>
                ))}
              </div>
            )}
            <div className="organization-card-footer">
              <div className="organization-card-listings">
                <span className="organization-card-listings-count">{listingCount}</span> {orgStrings.ACTIVE_LISTINGS}
              </div>
              <button
                type="button"
                className="organization-card-link"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect?.(org)
                }}
              >
                {orgStrings.VIEW_PROFILE}
                <ArrowForward className="organization-card-link-icon" />
              </button>
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export default OrganizationList
