import React, { useEffect, useState } from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  OutlinedInput,
} from '@mui/material'
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
      <div className="organization-admin">
        <h1>{orgStrings.ORGANIZATION}</h1>
        {loading ? (
          <div className="organization-loading">{commonStrings.LOADING}</div>
        ) : organization ? (
          <>
            <div className="organization-card">
              <div className="organization-name">{organization.name}</div>
              {organization.description && <div className="organization-desc">{organization.description}</div>}
            </div>

            <div className="organization-section">
              <h2>{orgStrings.ORGANIZATION_PROFILE}</h2>
              <div className="organization-form">
                <div className="organization-media-grid">
                  <div className="organization-media-card">
                    <div className="organization-media-label">{orgStrings.LOGO}</div>
                    <div className="organization-media-preview org-logo-preview">
                      {logoPreview ? (
                        <img src={logoPreview} alt={orgStrings.LOGO} />
                      ) : (
                        <span className="organization-media-placeholder">{orgStrings.NO_LOGO}</span>
                      )}
                    </div>
                    <label className="organization-media-upload">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={logoUploading}
                        onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                      />
                      {logoUploading ? commonStrings.LOADING : orgStrings.UPLOAD_LOGO}
                    </label>
                  </div>
                  <div className="organization-media-card">
                    <div className="organization-media-label">{orgStrings.COVER}</div>
                    <div className="organization-media-preview org-cover-preview">
                      {coverPreview ? (
                        <img src={coverPreview} alt={orgStrings.COVER} />
                      ) : (
                        <span className="organization-media-placeholder">{orgStrings.NO_COVER}</span>
                      )}
                    </div>
                    <label className="organization-media-upload">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={coverUploading}
                        onChange={(event) => handleCoverUpload(event.target.files?.[0])}
                      />
                      {coverUploading ? commonStrings.LOADING : orgStrings.UPLOAD_COVER}
                    </label>
                  </div>
                </div>
                <div className="organization-form-grid">
                  <FormControl fullWidth margin="dense">
                    <InputLabel className="required">{orgStrings.ORGANIZATION_NAME}</InputLabel>
                    <OutlinedInput value={orgName} label={orgStrings.ORGANIZATION_NAME} onChange={(e) => setOrgName(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{orgStrings.WEBSITE}</InputLabel>
                    <OutlinedInput value={orgWebsite} label={orgStrings.WEBSITE} onChange={(e) => setOrgWebsite(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{orgStrings.EMAIL}</InputLabel>
                    <OutlinedInput value={orgEmail} label={orgStrings.EMAIL} onChange={(e) => setOrgEmail(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{orgStrings.PHONE}</InputLabel>
                    <OutlinedInput value={orgPhone} label={orgStrings.PHONE} onChange={(e) => setOrgPhone(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <LocationSelectList
                      label={orgStrings.LOCATION}
                      value={selectedLocation}
                      onChange={handleLocationSelect}
                    />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{orgStrings.SERVICE_AREAS}</InputLabel>
                    <OutlinedInput value={orgServiceAreas} label={orgStrings.SERVICE_AREAS} onChange={(e) => setOrgServiceAreas(e.target.value)} />
                  </FormControl>
                </div>
                <FormControl fullWidth margin="dense">
                  <InputLabel>{orgStrings.DESCRIPTION}</InputLabel>
                  <OutlinedInput
                    value={orgDescription}
                    label={orgStrings.DESCRIPTION}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    multiline
                    minRows={3}
                  />
                </FormControl>
                <Button
                  variant="contained"
                  disabled={saving || !orgName}
                  onClick={handleSaveProfile}
                >
                  {orgStrings.SAVE_PROFILE}
                </Button>
              </div>
            </div>

            <div className="organization-section">
              <h2>{orgStrings.INVITE_MEMBER}</h2>
              <div className="organization-form">
                <div className="organization-form-grid">
                  <FormControl fullWidth margin="dense">
                    <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                    <OutlinedInput value={fullName} label={commonStrings.FULL_NAME} onChange={(e) => setFullName(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                    <OutlinedInput value={email} label={commonStrings.EMAIL} onChange={(e) => setEmail(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{commonStrings.PHONE}</InputLabel>
                    <OutlinedInput value={phone} label={commonStrings.PHONE} onChange={(e) => setPhone(e.target.value)} />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{orgStrings.ROLE}</InputLabel>
                    <Select value={role} label={orgStrings.ROLE} onChange={handleRoleChange}>
                      {Object.values(movininTypes.OrgMemberRole).map((value) => (
                        <MenuItem value={value} key={value}>{value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>{orgStrings.TITLE}</InputLabel>
                    <OutlinedInput value={title} label={orgStrings.TITLE} onChange={(e) => setTitle(e.target.value)} />
                  </FormControl>
                </div>
                <Button
                  variant="contained"
                  disabled={inviteLoading || !email || !fullName}
                  onClick={handleInvite}
                >
                  {orgStrings.SEND_INVITE}
                </Button>
              </div>
            </div>

            <div className="organization-section">
              <h2>{orgStrings.MEMBERS}</h2>
              {members.length === 0 ? (
                <div className="organization-empty">{orgStrings.NO_MEMBERS}</div>
              ) : (
                <div className="organization-members">
                  {members.map((member) => {
                    const memberUser = member.user as movininTypes.User
                    return (
                      <div className="organization-member" key={member._id}>
                        <div className="member-name">{memberUser?.fullName || '-'}</div>
                        <div className="member-role">{member.title || member.role}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="organization-section">
              <h2>{orgStrings.PARTNERSHIPS}</h2>
              {partnershipLoading ? (
                <div className="organization-loading">{commonStrings.LOADING}</div>
              ) : partnerships.length === 0 ? (
                <div className="organization-empty">{orgStrings.NO_PARTNERSHIPS}</div>
              ) : (
                <div className="organization-members">
                  {partnerships.map((partnership) => {
                    const isDeveloperOrg = organization.type === movininTypes.OrganizationType.Developer
                    const otherOrg = isDeveloperOrg ? partnership.brokerOrg : partnership.developerOrg
                    const otherName = typeof otherOrg === 'string' ? otherOrg : otherOrg?.name
                    const canReview = isDeveloperOrg && partnership.status === movininTypes.OrgPartnershipStatus.Pending
                    return (
                      <div className="organization-member" key={partnership._id}>
                        <div className="member-name">{otherName || '-'}</div>
                        <div className="member-role">
                          {orgStrings.PARTNERSHIP_STATUS}: {orgStrings[partnership.status as keyof typeof orgStrings] || partnership.status}
                        </div>
                        {canReview && (
                          <div className="organization-actions">
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
          </>
        ) : (
          <div className="organization-empty">{orgStrings.EMPTY}</div>
        )}
      </div>
    </Layout>
  )
}

export default Organization
