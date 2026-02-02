import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/organizations'
import { strings as commonStrings } from '@/lang/common'
import * as OrganizationService from '@/services/OrganizationService'
import * as helper from '@/utils/helper'

import '@/assets/css/organization-admin.css'

const Organization = () => {
  const [searchParams] = useSearchParams()
  const [organization, setOrganization] = useState<movininTypes.Organization>()
  const [members, setMembers] = useState<movininTypes.OrgMembership[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [role, setRole] = useState<movininTypes.OrgMemberRole>(movininTypes.OrgMemberRole.Agent)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')

  const orgId = (searchParams.get('o') || '').trim()

  const loadOrg = async () => {
    if (!orgId) {
      return
    }
    try {
      setLoading(true)
      const org = await OrganizationService.getOrganization(orgId)
      setOrganization(org)
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

  useEffect(() => {
    loadOrg()
  }, [orgId])

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setRole(event.target.value as movininTypes.OrgMemberRole)
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

  const handleSave = async () => {
    if (!organization?._id) {
      return
    }
    try {
      setSaving(true)
      const payload: movininTypes.UpdateOrganizationPayload = {
        _id: organization._id as string,
        name: organization.name,
        type: organization.type,
        slug: organization.slug,
        description: organization.description,
        email: organization.email,
        phone: organization.phone,
        website: organization.website,
        location: organization.location,
        serviceAreas: organization.serviceAreas,
        verified: organization.verified,
        approved: organization.approved,
        active: organization.active,
        seats: organization.seats,
        plan: organization.plan,
        expiresAt: organization.expiresAt,
      }
      await OrganizationService.updateOrganization(payload)
      await loadOrg()
    } catch (err) {
      helper.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout strict>
      <div className="organization-admin">
        <h1>{strings.ORGANIZATION}</h1>
        {loading ? (
          <div className="organization-loading">{commonStrings.LOADING}</div>
        ) : organization ? (
          <>
            <div className="organization-card">
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.NAME}</InputLabel>
                <OutlinedInput
                  value={organization.name || ''}
                  label={strings.NAME}
                  onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.SLUG}</InputLabel>
                <OutlinedInput
                  value={organization.slug || ''}
                  label={strings.SLUG}
                  onChange={(e) => setOrganization({ ...organization, slug: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.DESCRIPTION}</InputLabel>
                <OutlinedInput
                  value={organization.description || ''}
                  label={strings.DESCRIPTION}
                  onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.EMAIL}</InputLabel>
                <OutlinedInput
                  value={organization.email || ''}
                  label={strings.EMAIL}
                  onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.PHONE}</InputLabel>
                <OutlinedInput
                  value={organization.phone || ''}
                  label={strings.PHONE}
                  onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.WEBSITE}</InputLabel>
                <OutlinedInput
                  value={organization.website || ''}
                  label={strings.WEBSITE}
                  onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.LOCATION}</InputLabel>
                <OutlinedInput
                  value={organization.location || ''}
                  label={strings.LOCATION}
                  onChange={(e) => setOrganization({ ...organization, location: e.target.value })}
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.SERVICE_AREAS}</InputLabel>
                <OutlinedInput
                  value={(organization.serviceAreas || []).join(', ')}
                  label={strings.SERVICE_AREAS}
                  onChange={(e) => setOrganization({
                    ...organization,
                    serviceAreas: e.target.value.split(',').map((value) => value.trim()).filter(Boolean),
                  })}
                />
              </FormControl>
              <div className="organization-toggle-row">
                <FormControl>
                  <InputLabel>{strings.APPROVED}</InputLabel>
                  <Select
                    value={organization.approved ? 'yes' : 'no'}
                    label={strings.APPROVED}
                    onChange={(e) => setOrganization({ ...organization, approved: e.target.value === 'yes' })}
                  >
                    <MenuItem value="yes">{strings.YES}</MenuItem>
                    <MenuItem value="no">{strings.NO}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>{strings.ACTIVE}</InputLabel>
                  <Select
                    value={organization.active ? 'yes' : 'no'}
                    label={strings.ACTIVE}
                    onChange={(e) => setOrganization({ ...organization, active: e.target.value === 'yes' })}
                  >
                    <MenuItem value="yes">{strings.YES}</MenuItem>
                    <MenuItem value="no">{strings.NO}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>{strings.VERIFIED}</InputLabel>
                  <Select
                    value={organization.verified ? 'yes' : 'no'}
                    label={strings.VERIFIED}
                    onChange={(e) => setOrganization({ ...organization, verified: e.target.value === 'yes' })}
                  >
                    <MenuItem value="yes">{strings.YES}</MenuItem>
                    <MenuItem value="no">{strings.NO}</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="organization-toggle-row">
                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.SEATS}</InputLabel>
                  <OutlinedInput
                    value={organization.seats || ''}
                    label={strings.SEATS}
                    onChange={(e) => setOrganization({ ...organization, seats: Number(e.target.value) || 0 })}
                  />
                </FormControl>
                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.PLAN}</InputLabel>
                  <OutlinedInput
                    value={organization.plan || ''}
                    label={strings.PLAN}
                    onChange={(e) => setOrganization({ ...organization, plan: e.target.value })}
                  />
                </FormControl>
              </div>
              <Button variant="contained" className="btn-primary" onClick={handleSave} disabled={saving}>
                {strings.SAVE}
              </Button>
            </div>

            <div className="organization-section" id="members">
              <h2>{strings.INVITE_MEMBER}</h2>
              <div className="organization-invite-form">
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
                  <InputLabel>{strings.ROLE}</InputLabel>
                  <Select value={role} label={strings.ROLE} onChange={handleRoleChange}>
                    {Object.values(movininTypes.OrgMemberRole).map((value) => (
                      <MenuItem value={value} key={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.TITLE}</InputLabel>
                  <OutlinedInput value={title} label={strings.TITLE} onChange={(e) => setTitle(e.target.value)} />
                </FormControl>
                <Button
                  variant="contained"
                  disabled={inviteLoading || !email || !fullName}
                  onClick={handleInvite}
                >
                  {strings.SEND_INVITE}
                </Button>
              </div>
            </div>

            <div className="organization-section">
              <h2>{strings.MEMBERS}</h2>
              {members.length === 0 ? (
                <div className="organization-empty">{strings.NO_MEMBERS}</div>
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
          </>
        ) : (
          <div className="organization-empty">{strings.EMPTY}</div>
        )}
      </div>
    </Layout>
  )
}

export default Organization
