import React from 'react'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'

import '@/assets/css/agency-badge.css'

interface AgencyBadgeProps {
  agency: movininTypes.User
  style?: React.CSSProperties
}

const AgencyBadge = ({ agency, style }: AgencyBadgeProps) => {
  if (!agency) {
    return <></>
  }

  const avatarUrl = agency.avatar && env.CDN_USERS
    ? movininHelper.joinURL(env.CDN_USERS, agency.avatar)
    : ''
  const initials = (agency.fullName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return (
    <div className="agency-badge" style={style || {}}>
      <span className="agency-badge-logo">
        {avatarUrl ? (
          <img src={avatarUrl} alt={agency.fullName} />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </span>
      <span className="agency-badge-text">{agency.fullName}</span>
    </div>
  )
}

export default AgencyBadge
