import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import PropertyList from '@/components/PropertyList'
import Footer from '@/components/Footer'
import { strings as orgStrings } from '@/lang/organizations'
import { strings as commonStrings } from '@/lang/common'
import * as OrganizationService from '@/services/OrganizationService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'
import * as movininHelper from ':movinin-helper'

import '@/assets/css/organization-profile.css'

const Brokerage = () => {
  const { slug } = useParams()
  const [organization, setOrganization] = useState<movininTypes.Organization>()
  const [members, setMembers] = useState<movininTypes.OrgMembership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!slug) {
        return
      }
      try {
        setLoading(true)
        const org = await OrganizationService.getFrontendOrganizationBySlug(slug)
        setOrganization(org)
        if (org?._id) {
          const orgMembers = await OrganizationService.getFrontendOrgMembers(org._id)
          setMembers(Array.isArray(orgMembers) ? orgMembers : [])
        } else {
          setMembers([])
        }
      } catch (err) {
        helper.error(err)
        setOrganization(undefined)
        setMembers([])
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [slug])

  const brokerageOrgId = organization?._id ? [organization._id as string] : []

  return (
    <Layout strict={false}>
      <div className="organization-profile">
        {loading ? (
          <div className="organization-loading">{commonStrings.LOADING}</div>
        ) : organization ? (
          <>
            {organization.cover && (
              <div className="organization-cover">
                <img
                  src={organization.cover.startsWith('http') ? organization.cover : movininHelper.joinURL(env.CDN_USERS, organization.cover)}
                  alt={organization.name}
                />
              </div>
            )}
            <section className="organization-hero">
              <div className="organization-hero-main">
                {organization.logo && (
                  <span className="organization-hero-logo">
                    <img
                      src={organization.logo.startsWith('http') ? organization.logo : movininHelper.joinURL(env.CDN_USERS, organization.logo)}
                      alt={organization.name}
                    />
                  </span>
                )}
                <h1>{organization.name}</h1>
                {organization.description && <p>{organization.description}</p>}
                {organization.website && <a href={organization.website} target="_blank" rel="noreferrer">{organization.website}</a>}
              </div>
            </section>

            <div className="organization-columns">
              <section className="organization-section">
                <h2>{orgStrings.MEMBERS}</h2>
                {members.length === 0 ? (
                  <p className="organization-empty">{orgStrings.NO_MEMBERS}</p>
                ) : (
                  <div className="organization-members">
                    {members.map((member) => {
                      const user = member.user as movininTypes.User
                      return (
                        <div key={member._id} className="organization-member">
                          <div className="member-name">
                            {user?.avatar && (
                              <span className="member-avatar">
                                <img
                                  src={user.avatar.startsWith('http') ? user.avatar : movininHelper.joinURL(env.CDN_USERS, user.avatar)}
                                  alt={user.fullName}
                                />
                              </span>
                            )}
                            {user?.fullName || '-'}
                          </div>
                          <div className="member-role">{member.title || member.role}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="organization-section">
                <h2>{orgStrings.LISTINGS}</h2>
                <PropertyList brokerageOrgs={brokerageOrgId} />
              </section>
            </div>
          </>
        ) : (
          <div className="organization-empty">{orgStrings.EMPTY}</div>
        )}
      </div>
      <Footer />
    </Layout>
  )
}

export default Brokerage
