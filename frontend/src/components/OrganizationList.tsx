import React from 'react'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'

import '@/assets/css/organization-list.css'

interface OrganizationListProps {
  organizations: movininTypes.Organization[]
  onSelect?: (organization: movininTypes.Organization) => void
}

const OrganizationList = ({ organizations, onSelect }: OrganizationListProps) => (
  <div className="organization-list">
    {organizations.map((org) => (
      <div
        key={org._id}
        className="organization-card"
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(org)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
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
        </div>
        <div className="organization-logo">
          {org.logo ? (
            <img
              src={org.logo.startsWith('http') ? org.logo : (env.CDN_USERS ? movininHelper.joinURL(env.CDN_USERS, org.logo) : org.logo)}
              alt={org.name}
            />
          ) : (
            <span className="organization-initials">
              {(org.name || '').split(' ').map((word) => word[0]).join('').substring(0, 2).toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="organization-name">{org.name}</div>
        {org.location && <div className="organization-meta">{org.location}</div>}
        {org.description && <div className="organization-description">{org.description}</div>}
        {org.serviceAreas && org.serviceAreas.length > 0 && (
          <div className="organization-tags">
            {org.serviceAreas.slice(0, 3).map((area) => (
              <span key={area} className="organization-tag">{area}</span>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
)

export default OrganizationList
