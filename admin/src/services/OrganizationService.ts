import axiosInstance from './axiosInstance'
import * as movininTypes from ':movinin-types'

export const getOrganizations = async (
  keyword: string,
  type: movininTypes.OrganizationType | '' | undefined,
  page: number,
  size: number,
): Promise<any[]> => {
  const data = {
    params: {
      s: (keyword || '').trim(),
      type: type || undefined,
    },
  }
  const res = await axiosInstance.get(`/api/organizations/${page}/${size}`, data)
  return res.data
}

export const getOrganization = async (id: string): Promise<movininTypes.Organization> => {
  const res = await axiosInstance.get(`/api/organization/${id}`)
  return res.data
}

export const updateOrganization = async (payload: movininTypes.UpdateOrganizationPayload): Promise<number> => {
  const res = await axiosInstance.put('/api/update-organization', payload)
  return res.status
}

export const getOrgMembers = async (orgId: string): Promise<movininTypes.OrgMembership[]> => {
  const res = await axiosInstance.get(`/api/org-members/${orgId}`)
  return res.data
}

export const inviteOrgMember = async (payload: movininTypes.InviteOrgMemberPayload): Promise<number> => {
  const res = await axiosInstance.post('/api/invite-org-member', payload)
  return res.status
}
