import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

/**
 * Create lead.
 *
 * @param {movininTypes.CreateLeadPayload} data
 * @returns {Promise<movininTypes.Lead>}
 */
export const createLead = (data: movininTypes.CreateLeadPayload): Promise<movininTypes.Lead> =>
  axiosInstance
    .post(
      '/api/create-lead',
      data
    ).then((res) => res.data)

/**
 * Get leads.
 *
 * @param {movininTypes.GetLeadsPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Lead>>}
 */
export const getLeads = (data: movininTypes.GetLeadsPayload, page: number, size: number): Promise<movininTypes.Result<movininTypes.Lead>> =>
  axiosInstance
    .post(
      `/api/leads/${page}/${size}`,
      data,
      { withCredentials: true }
    ).then((res) => res.data)
