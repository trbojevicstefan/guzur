import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

/**
 * Generate SEO metadata for a listing.
 *
 * @param {movininTypes.SeoGeneratePayload} data
 * @returns {Promise<movininTypes.SeoGenerateResult>}
 */
export const generate = (data: movininTypes.SeoGeneratePayload): Promise<movininTypes.SeoGenerateResult> =>
  axiosInstance
    .post(
      '/api/seo-generate',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)
