import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

/**
 * Get developments.
 *
 * @param {movininTypes.GetDevelopmentsPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Development>>}
 */
export const getDevelopments = (data: movininTypes.GetDevelopmentsPayload, page: number, size: number): Promise<movininTypes.Result<movininTypes.Development>> => {
  const params = new URLSearchParams()
  if (data.developer) {
    params.set('developer', data.developer)
  }
  if (data.developers && data.developers.length > 0) {
    params.set('developers', data.developers.join(','))
  }
  if (data.developerOrgs && data.developerOrgs.length > 0) {
    params.set('developerOrgs', data.developerOrgs.join(','))
  }
  if (data.status) {
    params.set('status', data.status)
  }
  if (data.location) {
    params.set('location', data.location)
  }
  if (data.keyword) {
    params.set('s', data.keyword)
  }
  const query = params.toString()
  return axiosInstance
    .get(
      `/api/developments/${page}/${size}${query ? `?${query}` : ''}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
}

/**
 * Get developments for frontend browsing.
 *
 * @param {movininTypes.GetDevelopmentsPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Development>>}
 */
export const getFrontendDevelopments = (data: movininTypes.GetDevelopmentsPayload, page: number, size: number): Promise<movininTypes.Result<movininTypes.Development>> => {
  const params = new URLSearchParams()
  if (data.developer) {
    params.set('developer', data.developer)
  }
  if (data.developers && data.developers.length > 0) {
    params.set('developers', data.developers.join(','))
  }
  if (data.developerOrgs && data.developerOrgs.length > 0) {
    params.set('developerOrgs', data.developerOrgs.join(','))
  }
  if (data.status) {
    params.set('status', data.status)
  }
  if (data.location) {
    params.set('location', data.location)
  }
  if (data.keyword) {
    params.set('s', data.keyword)
  }
  const query = params.toString()
  return axiosInstance
    .get(
      `/api/frontend-developments/${page}/${size}${query ? `?${query}` : ''}`
    )
    .then((res) => res.data)
}

/**
 * Get a development by ID for frontend browsing.
 *
 * @param {string} id
 * @returns {Promise<movininTypes.Development>}
 */
export const getFrontendDevelopment = (id: string): Promise<movininTypes.Development> =>
  axiosInstance
    .get(
      `/api/frontend-development/${encodeURIComponent(id)}`
    )
    .then((res) => res.data)

/**
 * Get a development by ID (authenticated).
 *
 * @param {string} id
 * @returns {Promise<movininTypes.Development>}
 */
export const getDevelopment = (id: string): Promise<movininTypes.Development> =>
  axiosInstance
    .get(
      `/api/development/${encodeURIComponent(id)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Create a development (authenticated).
 *
 * @param {movininTypes.CreateDevelopmentPayload} data
 * @returns {Promise<movininTypes.Development>}
 */
export const create = (data: movininTypes.CreateDevelopmentPayload): Promise<movininTypes.Development> =>
  axiosInstance
    .post(
      '/api/create-development',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)
