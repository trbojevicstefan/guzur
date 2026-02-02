import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

/**
 * Create a Development.
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

/**
 * Update a Development.
 *
 * @param {movininTypes.UpdateDevelopmentPayload} data
 * @returns {Promise<number>}
 */
export const update = (data: movininTypes.UpdateDevelopmentPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-development',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Delete a Development.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const deleteDevelopment = (id: string): Promise<number> =>
  axiosInstance
    .delete(
      `/api/delete-development/${encodeURIComponent(id)}`,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get a Development by ID.
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
 * Get Developments.
 *
 * @param {movininTypes.GetDevelopmentsPayload} data
 * @param {string} keyword
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Development>>}
 */
export const getDevelopments = (
  data: movininTypes.GetDevelopmentsPayload,
  keyword: string,
  page: number,
  size: number
): Promise<movininTypes.Result<movininTypes.Development>> => {
  const params = new URLSearchParams()
  if (data.developer) {
    params.set('developer', data.developer)
  }
  if (data.status) {
    params.set('status', data.status)
  }
  if (keyword) {
    params.set('s', keyword)
  }
  const query = params.toString()
  return axiosInstance
    .get(
      `/api/developments/${page}/${size}${query ? `?${query}` : ''}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
}
