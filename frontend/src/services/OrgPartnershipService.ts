import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

export const requestPartnership = (data: movininTypes.CreateOrgPartnershipPayload): Promise<movininTypes.OrgPartnership> =>
  axiosInstance
    .post(
      '/api/request-org-partnership',
      data,
      { withCredentials: true },
    )
    .then((res) => res.data)

export const getOrgPartnerships = (orgId: string): Promise<movininTypes.OrgPartnership[]> =>
  axiosInstance
    .get(
      `/api/org-partnerships/${encodeURIComponent(orgId)}`,
      { withCredentials: true },
    )
    .then((res) => res.data)

export const updatePartnership = (data: movininTypes.UpdateOrgPartnershipPayload): Promise<movininTypes.OrgPartnership> =>
  axiosInstance
    .put(
      '/api/update-org-partnership',
      data,
      { withCredentials: true },
    )
    .then((res) => res.data)
