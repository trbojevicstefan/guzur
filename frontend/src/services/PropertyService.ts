import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Get properties.
 *
 * @param {movininTypes.GetPropertiesPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Property>>}
 */
export const getProperties = (data: movininTypes.GetPropertiesPayload, page: number, size: number): Promise<movininTypes.Result<movininTypes.Property>> =>
  axiosInstance
    .post(
      `/api/frontend-properties/${page}/${size}`,
      data
    ).then((res) => res.data)

/**
 * Get a Property by ID.
 *
 * @param {string} id
 * @returns {Promise<movininTypes.Property>}
 */
export const getProperty = (id: string): Promise<movininTypes.Property> =>
  axiosInstance
    .get(
      `/api/property/${encodeURIComponent(id)}/${UserService.getLanguage()}`
    )
    .then((res) => res.data)

/**
 * Create a Property.
 *
 * @param {movininTypes.CreatePropertyPayload} data
 * @returns {Promise<movininTypes.Property>}
 */
export const create = (data: movininTypes.CreatePropertyPayload): Promise<movininTypes.Property> =>
  axiosInstance
    .post(
      '/api/create-property',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update a Property.
 *
 * @param {movininTypes.UpdatePropertyPayload} data
 * @returns {Promise<number>}
 */
export const update = (data: movininTypes.UpdatePropertyPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-property',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Upload a temporary Property image.
 *
 * @param {Blob} file
 * @returns {Promise<string>}
 */
export const uploadImage = (file: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)

  return axiosInstance
    .post(
      '/api/upload-property-image',
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    .then((res) => res.data)
}

/**
 * Delete a temporary Property image.
 *
 * @param {string} image
 * @returns {Promise<number>}
 */
export const deleteTempImage = (image: string): Promise<number> =>
  axiosInstance
    .post(
      `/api/delete-temp-property-image/${encodeURIComponent(image)}`,
      null,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get properties for the logged-in partner.
 *
 * @param {string} keyword
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Property>>}
 */
export const getMyProperties = (
  keyword: string,
  page: number,
  size: number,
  developmentId?: string,
  status?: movininTypes.ListingStatus
): Promise<movininTypes.Result<movininTypes.Property>> => {
  const params = new URLSearchParams({ s: keyword || '' })
  if (developmentId) {
    params.set('developmentId', developmentId)
  }
  if (status) {
    params.set('status', status)
  }

  return axiosInstance
    .get(
      `/api/my-properties/${page}/${size}/?${params.toString()}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
}

/**
 * Get properties by agency and location.
 *
 * @param {string} keyword
 * @param {movininTypes.GetBookingPropertiesPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Property[]>}
 */
export const getBookingProperties = (keyword: string, data: movininTypes.GetBookingPropertiesPayload, page: number, size: number): Promise<movininTypes.Property[]> =>
  axiosInstance
    .post(
      `/api/booking-properties/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get development units for frontend browsing.
 *
 * @param {string} developmentId
 * @param {string} keyword
 * @param {number} page
 * @param {number} size
 * @returns {Promise<movininTypes.Result<movininTypes.Property>>}
 */
export const getFrontendDevelopmentUnits = (
  developmentId: string,
  keyword: string,
  page: number,
  size: number
): Promise<movininTypes.Result<movininTypes.Property>> => {
  const params = new URLSearchParams()
  if (keyword) {
    params.set('s', keyword)
  }
  const query = params.toString()

  return axiosInstance
    .get(
      `/api/frontend-development-units/${encodeURIComponent(developmentId)}/${page}/${size}${query ? `?${query}` : ''}`
    )
    .then((res) => res.data)
}
