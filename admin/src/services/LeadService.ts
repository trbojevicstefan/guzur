import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

export const getLeads = (
  payload: movininTypes.GetLeadsPayload,
  page: number,
  size: number
): Promise<movininTypes.Result<movininTypes.Lead>> =>
  axiosInstance
    .post(
      `/api/leads/${page}/${size}`,
      payload,
      { withCredentials: true }
    )
    .then((res) => res.data)

export const updateLead = (data: movininTypes.UpdateLeadPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-lead',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

export const deleteLeads = (ids: string[]): Promise<number> =>
  axiosInstance
    .delete(
      '/api/delete-leads',
      { data: ids, withCredentials: true }
    )
    .then((res) => res.status)
