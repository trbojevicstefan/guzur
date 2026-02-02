import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

export const getFrontendOrganizations = (
  type: movininTypes.OrganizationType,
  page: number,
  size: number,
  keyword?: string,
): Promise<movininTypes.Result<movininTypes.Organization>> => {
  const params = new URLSearchParams()
  if (keyword) {
    params.set('s', keyword)
  }
  const query = params.toString()
  return axiosInstance
    .get(
      `/api/frontend-organizations/${encodeURIComponent(type)}/${page}/${size}${query ? `?${query}` : ''}`,
    )
    .then((res) => res.data)
}

export const getFrontendOrganizationBySlug = (slug: string): Promise<movininTypes.Organization> =>
  axiosInstance
    .get(
      `/api/frontend-organization-by-slug/${encodeURIComponent(slug)}`,
    )
    .then((res) => res.data)

export const getFrontendOrgMembers = (orgId: string): Promise<movininTypes.OrgMembership[]> =>
  axiosInstance
    .get(
      `/api/frontend-org-members/${encodeURIComponent(orgId)}`,
    )
    .then((res) => res.data)

export const getOrganization = (orgId: string): Promise<movininTypes.Organization> =>
  axiosInstance
    .get(
      `/api/organization/${encodeURIComponent(orgId)}`,
      { withCredentials: true },
    )
    .then((res) => res.data)

export const getOrgMembers = (orgId: string): Promise<movininTypes.OrgMembership[]> =>
  axiosInstance
    .get(
      `/api/org-members/${encodeURIComponent(orgId)}`,
      { withCredentials: true },
    )
    .then((res) => res.data)

export const inviteOrgMember = (data: movininTypes.InviteOrgMemberPayload): Promise<number> =>
  axiosInstance
    .post(
      '/api/invite-org-member',
      data,
      { withCredentials: true },
    )
    .then((res) => res.status)

export const updateOrganization = (data: movininTypes.UpdateOrganizationPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-organization',
      data,
      { withCredentials: true },
    )
    .then((res) => res.status)
