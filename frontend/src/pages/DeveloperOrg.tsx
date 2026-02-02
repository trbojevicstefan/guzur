import React, { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import { useParams } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import DevelopmentList from '@/components/DevelopmentList'
import Footer from '@/components/Footer'
import { strings as orgStrings } from '@/lang/organizations'
import { strings as developmentStrings } from '@/lang/developments'
import { strings as commonStrings } from '@/lang/common'
import * as OrganizationService from '@/services/OrganizationService'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as OrgPartnershipService from '@/services/OrgPartnershipService'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'
import * as movininHelper from ':movinin-helper'

import '@/assets/css/organization-profile.css'

const DeveloperOrg = () => {
  const { slug } = useParams()
  const [organization, setOrganization] = useState<movininTypes.Organization>()
  const [members, setMembers] = useState<movininTypes.OrgMembership[]>([])
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [loading, setLoading] = useState(true)
  const [partnershipStatus, setPartnershipStatus] = useState<movininTypes.OrgPartnershipStatus>()
  const [requesting, setRequesting] = useState(false)

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

  const currentUser = UserService.getCurrentUser()
  const brokerOrgId = typeof currentUser?.primaryOrg === 'string'
    ? currentUser.primaryOrg
    : currentUser?.primaryOrg?._id
  const canApply = currentUser?.type === movininTypes.UserType.Broker && !!brokerOrgId && !!organization?._id

  useEffect(() => {
    const fetchDevelopments = async () => {
      if (!organization?._id) {
        setDevelopments([])
        return
      }
      try {
        const payload: movininTypes.GetDevelopmentsPayload = {
          developerOrgs: [organization._id as string],
        }
        const data = await DevelopmentService.getFrontendDevelopments(payload, 1, env.PAGE_SIZE)
        setDevelopments(data?.[0]?.resultData ?? [])
      } catch (err) {
        helper.error(err)
        setDevelopments([])
      }
    }

    fetchDevelopments()
  }, [organization?._id])

  useEffect(() => {
    const fetchPartnership = async () => {
      if (!brokerOrgId || !organization?._id) {
        setPartnershipStatus(undefined)
        return
      }
      try {
        const data = await OrgPartnershipService.getOrgPartnerships(brokerOrgId)
        const match = data.find((row) => {
          const devId = typeof row.developerOrg === 'string' ? row.developerOrg : row.developerOrg?._id
          return devId === organization._id
        })
        setPartnershipStatus(match?.status)
      } catch (err) {
        helper.error(err)
        setPartnershipStatus(undefined)
      }
    }
    fetchPartnership()
  }, [brokerOrgId, organization?._id])

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
              {canApply && (
                <div className="organization-cta">
                  <Button
                    variant="contained"
                    className="btn-primary"
                    disabled={requesting || partnershipStatus === movininTypes.OrgPartnershipStatus.Approved || partnershipStatus === movininTypes.OrgPartnershipStatus.Pending}
                    onClick={async () => {
                      try {
                        if (!organization?._id) {
                          return
                        }
                        setRequesting(true)
                        const data = await OrgPartnershipService.requestPartnership({
                          developerOrg: organization._id as string,
                        })
                        setPartnershipStatus(data.status)
                      } catch (err) {
                        helper.error(err)
                      } finally {
                        setRequesting(false)
                      }
                    }}
                  >
                    {partnershipStatus === movininTypes.OrgPartnershipStatus.Pending
                      ? orgStrings.REQUEST_SENT
                      : partnershipStatus === movininTypes.OrgPartnershipStatus.Approved
                        ? orgStrings.APPROVED
                        : orgStrings.APPLY}
                  </Button>
                  {partnershipStatus && partnershipStatus !== movininTypes.OrgPartnershipStatus.Approved && (
                    <div className="organization-status">
                      {orgStrings.PARTNERSHIP_STATUS}: {orgStrings[partnershipStatus as keyof typeof orgStrings] || partnershipStatus}
                    </div>
                  )}
                </div>
              )}
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
                <h2>{orgStrings.PROJECTS}</h2>
                <DevelopmentList
                  developments={developments}
                  showDeveloper={false}
                  labels={{
                    EMPTY_DEVELOPMENTS: developmentStrings.EMPTY,
                    NAME: developmentStrings.NAME,
                    LOCATION: developmentStrings.LOCATION,
                    DEVELOPER: developmentStrings.DEVELOPER,
                    STATUS: developmentStrings.STATUS,
                    UNITS: developmentStrings.UNITS,
                    UPDATED: developmentStrings.UPDATED,
                  }}
                />
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

export default DeveloperOrg
