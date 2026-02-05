import React, { useEffect, useState } from 'react'
import {
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import {
  Business,
  Language,
  EmailOutlined,
  PlaceOutlined,
  ImageOutlined,
  PhotoCamera,
  Save,
  CheckCircle,
  PersonAddAlt,
  MoreVert,
  DeleteOutline,
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LocationSelectList from '@/components/LocationSelectList'
import env from '@/config/env.config'
import { strings as orgStrings } from '@/lang/organizations'
import { strings as commonStrings } from '@/lang/common'
import * as OrganizationService from '@/services/OrganizationService'
import * as OrgPartnershipService from '@/services/OrgPartnershipService'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import * as helper from '@/utils/helper'
import * as movininHelper from ':movinin-helper'

import '@/assets/css/organization-admin.css'

const Organization = () => {
  const { user } = useUserContext() as UserContextType
  const [organization, setOrganization] = useState<movininTypes.Organization>()
  const [members, setMembers] = useState<movininTypes.OrgMembership[]>([])
  const [partnerships, setPartnerships] = useState<movininTypes.OrgPartnership[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [partnershipLoading, setPartnershipLoading] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgDescription, setOrgDescription] = useState('')
  const [orgWebsite, setOrgWebsite] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [orgLocation, setOrgLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Location | undefined>()
  const [orgServiceAreas, setOrgServiceAreas] = useState('')
  const [orgLogo, setOrgLogo] = useState('')
  const [orgCover, setOrgCover] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<movininTypes.OrgMemberRole>(movininTypes.OrgMemberRole.Agent)
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')

  const orgId = typeof user?.primaryOrg === 'string' ? user.primaryOrg : user?.primaryOrg?._id

  const loadOrg = async () => {
    if (!orgId) {
      return
    }
    try {
      setLoading(true)
      const org = await OrganizationService.getOrganization(orgId)
      setOrganization(org)
      setOrgName(org.name || '')
      setOrgDescription(org.description || '')
      setOrgWebsite(org.website || '')
      setOrgEmail(org.email || '')
      setOrgPhone(org.phone || '')
      setOrgLocation(org.location || '')
      setSelectedLocation(org.location ? { _id: org.location, name: org.location } : undefined)
      setOrgServiceAreas((org.serviceAreas || []).join(', '))
      setOrgLogo(org.logo || '')
      setOrgCover(org.cover || '')
      setLogoPreview(org.logo ? (org.logo.startsWith('http') ? org.logo : movininHelper.joinURL(env.CDN_USERS, org.logo)) : '')
      setCoverPreview(org.cover ? (org.cover.startsWith('http') ? org.cover : movininHelper.joinURL(env.CDN_USERS, org.cover)) : '')
      const data = await OrganizationService.getOrgMembers(orgId)
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) {
      helper.error(err)
      setOrganization(undefined)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const loadPartnerships = async () => {
    if (!orgId) {
      return
    }
    try {
      setPartnershipLoading(true)
      const data = await OrgPartnershipService.getOrgPartnerships(orgId)
      setPartnerships(Array.isArray(data) ? data : [])
    } catch (err) {
      helper.error(err)
      setPartnerships([])
    } finally {
      setPartnershipLoading(false)
    }
  }

  useEffect(() => {
    loadOrg()
    loadPartnerships()
  }, [orgId])

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setRole(event.target.value as movininTypes.OrgMemberRole)
  }

  const handleLocationSelect = (values: movininTypes.Option[]) => {
    const value = values[0] as movininTypes.Location | undefined
    setSelectedLocation(value)
    setOrgLocation(value?.name || '')
  }

  const handleLogoUpload = async (file?: File) => {
    if (!file) {
      return
    }
    try {
      setLogoUploading(true)
      const filename = await UserService.createAvatar(file)
      setOrgLogo(filename)
      setLogoPreview(movininHelper.joinURL(env.CDN_TEMP_USERS, filename))
    } catch (err) {
      helper.error(err)
    } finally {
      setLogoUploading(false)
    }
  }

  const handleCoverUpload = async (file?: File) => {
    if (!file) {
      return
    }
    try {
      setCoverUploading(true)
      const filename = await UserService.createAvatar(file)
      setOrgCover(filename)
      setCoverPreview(movininHelper.joinURL(env.CDN_TEMP_USERS, filename))
    } catch (err) {
      helper.error(err)
    } finally {
      setCoverUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!organization?._id) {
      return
    }
    try {
      setSaving(true)
      const payload: movininTypes.UpdateOrganizationPayload = {
        _id: organization._id,
        type: organization.type,
        name: orgName || organization.name,
        description: orgDescription || undefined,
        website: orgWebsite || undefined,
        email: orgEmail || undefined,
        phone: orgPhone || undefined,
        location: orgLocation || undefined,
        serviceAreas: orgServiceAreas
          ? orgServiceAreas.split(',').map((value) => value.trim()).filter(Boolean)
          : undefined,
        logo: orgLogo || undefined,
        cover: orgCover || undefined,
      }
      const status = await OrganizationService.updateOrganization(payload)
      if (status === 200) {
        await loadOrg()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    if (!orgId) {
      return
    }
    try {
      setInviteLoading(true)
      const payload: movininTypes.InviteOrgMemberPayload = {
        org: orgId,
        email,
        fullName,
        role,
        title: title || undefined,
        phone: phone || undefined,
      }
      const status = await OrganizationService.inviteOrgMember(payload)
      if (status === 200) {
        setEmail('')
        setFullName('')
        setTitle('')
        setPhone('')
        await loadOrg()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setInviteLoading(false)
    }
  }

  const onLoad = (currentUser?: movininTypes.User) => {
    if (!currentUser) {
      return
    }
    if (![movininTypes.UserType.Broker, movininTypes.UserType.Developer].includes(currentUser.type as movininTypes.UserType)) {
      return
    }
  }

  return (
    <Layout strict onLoad={onLoad}>
      <div className="org-profile">
        <div className="org-profile-header">
          <span className="org-badge">
            <Business fontSize="inherit" />
            {orgStrings.ORGANIZATION_PROFILE}
          </span>
          <h1>{orgStrings.ORGANIZATION}</h1>
          <p>{orgStrings.ORGANIZATION_PROFILE}</p>
        </div>

        {loading ? (
          <div className="org-loading">{commonStrings.LOADING}</div>
        ) : organization ? (
          <div className="org-card">
            <div className="org-cover">
              {coverPreview ? (
                <img src={coverPreview} alt={orgStrings.COVER} />
              ) : (
                <div className="org-cover-placeholder" />
              )}
              <div className="org-cover-overlay" />
              <label className="org-cover-upload">
                <ImageOutlined fontSize="small" />
                {coverUploading ? commonStrings.LOADING : orgStrings.UPLOAD_COVER}
                <input
                  type="file"
                  accept="image/*"
                  disabled={coverUploading}
                  onChange={(event) => handleCoverUpload(event.target.files?.[0])}
                />
              </label>

              <div className="org-logo">
                <div className="org-logo-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt={orgStrings.LOGO} />
                  ) : (
                    <span>{orgStrings.NO_LOGO}</span>
                  )}
                </div>
                <label className="org-logo-upload">
                  <PhotoCamera fontSize="small" />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={logoUploading}
                    onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <div className="org-card-body">
              <div className="org-card-head">
                <div>
                  <h3>{organization.name}</h3>
                  <div className="org-status">
                    {organization.approved && (
                      <span>
                        <CheckCircle fontSize="inherit" />
                        {commonStrings.VERIFIED}
                      </span>
                    )}
                    <span>{organization.active ? orgStrings.APPROVED : orgStrings.PENDING}</span>
                  </div>
                </div>
                <button type="button" className="org-save" onClick={handleSaveProfile} disabled={saving || !orgName}>
                  <Save fontSize="small" />
                  {orgStrings.SAVE_PROFILE}
                </button>
              </div>

              <form className="org-form" onSubmit={(event) => event.preventDefault()}>
                <div className="org-grid">
                  <div className="org-field">
                    <label className="required">{orgStrings.ORGANIZATION_NAME}</label>
                    <div className="org-input">
                      <Business fontSize="small" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="org-field">
                    <label>{orgStrings.WEBSITE}</label>
                    <div className="org-input">
                      <Language fontSize="small" />
                      <input
                        type="text"
                        value={orgWebsite}
                        onChange={(e) => setOrgWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="org-grid">
                  <div className="org-field">
                    <label>{orgStrings.EMAIL}</label>
                    <div className="org-input">
                      <EmailOutlined fontSize="small" />
                      <input
                        type="email"
                        value={orgEmail}
                        onChange={(e) => setOrgEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="org-field">
                    <label>{orgStrings.SERVICE_AREAS}</label>
                    <div className="org-input">
                      <PlaceOutlined fontSize="small" />
                      <input
                        type="text"
                        value={orgServiceAreas}
                        onChange={(e) => setOrgServiceAreas(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="org-field">
                  <label>{orgStrings.DESCRIPTION}</label>
                  <div className="org-textarea">
                    <textarea
                      rows={3}
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="org-team">
                  <div className="org-team-header">
                    <span>{orgStrings.INVITE_MEMBER}</span>
                  </div>
                  <div className="org-team-grid">
                    <div className="org-invite">
                      <h4>
                        <PersonAddAlt fontSize="small" />
                        {orgStrings.INVITE_MEMBER}
                      </h4>
                      <input
                        type="text"
                        placeholder={commonStrings.FULL_NAME}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                      />
                      <input
                        type="email"
                        placeholder={commonStrings.EMAIL}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                      <input
                        type="text"
                        placeholder={commonStrings.PHONE}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                      <Select value={role} onChange={handleRoleChange} variant="standard" disableUnderline>
                        {Object.values(movininTypes.OrgMemberRole).map((value) => (
                          <MenuItem value={value} key={value}>{value}</MenuItem>
                        ))}
                      </Select>
                      <input
                        type="text"
                        placeholder={orgStrings.TITLE}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                      <button type="button" onClick={handleInvite} disabled={inviteLoading || !email || !fullName}>
                        {orgStrings.SEND_INVITE}
                      </button>
                    </div>
                    <div className="org-members">
                      {members.length === 0 ? (
                        <div className="org-empty">{orgStrings.NO_MEMBERS}</div>
                      ) : (
                        members.map((member) => {
                          const memberUser = member.user as movininTypes.User
                          return (
                            <div className="org-member" key={member._id}>
                              <div className="org-member-info">
                                <div className="org-member-avatar">
                                  {(memberUser?.fullName || '-').charAt(0)}
                                </div>
                                <div>
                                  <p>{memberUser?.fullName || '-'}</p>
                                  <span>{member.title || member.role}</span>
                                </div>
                              </div>
                              <div className="org-member-actions">
                                <button type="button">
                                  <MoreVert fontSize="small" />
                                </button>
                                <button type="button">
                                  <DeleteOutline fontSize="small" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="org-partnerships">
                  <h4>{orgStrings.PARTNERSHIPS}</h4>
                  {partnershipLoading ? (
                    <div className="org-empty">{commonStrings.LOADING}</div>
                  ) : partnerships.length === 0 ? (
                    <div className="org-empty">{orgStrings.NO_PARTNERSHIPS}</div>
                  ) : (
                    <div className="org-partnership-list">
                      {partnerships.map((partnership) => {
                        const isDeveloperOrg = organization.type === movininTypes.OrganizationType.Developer
                        const otherOrg = isDeveloperOrg ? partnership.brokerOrg : partnership.developerOrg
                        const otherName = typeof otherOrg === 'string' ? otherOrg : otherOrg?.name
                        const canReview = isDeveloperOrg && partnership.status === movininTypes.OrgPartnershipStatus.Pending
                        return (
                          <div className="org-member" key={partnership._id}>
                            <div className="org-member-info">
                              <div className="org-member-avatar">
                                {(otherName || '-').charAt(0)}
                              </div>
                              <div>
                                <p>{otherName || '-'}</p>
                                <span>
                                  {orgStrings.PARTNERSHIP_STATUS}: {orgStrings[partnership.status as keyof typeof orgStrings] || partnership.status}
                                </span>
                              </div>
                            </div>
                            {canReview && (
                              <div className="org-partnership-actions">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      await OrgPartnershipService.updatePartnership({
                                        _id: partnership._id as string,
                                        status: movininTypes.OrgPartnershipStatus.Approved,
                                      })
                                      await loadPartnerships()
                                    } catch (err) {
                                      helper.error(err)
                                    }
                                  }}
                                >
                                  {orgStrings.APPROVE}
                                </Button>
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      await OrgPartnershipService.updatePartnership({
                                        _id: partnership._id as string,
                                        status: movininTypes.OrgPartnershipStatus.Rejected,
                                      })
                                      await loadPartnerships()
                                    } catch (err) {
                                      helper.error(err)
                                    }
                                  }}
                                >
                                  {orgStrings.REJECT}
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="org-empty">{orgStrings.EMPTY}</div>
        )}
      </div>
    </Layout>
  )
}

export default Organization
