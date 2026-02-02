import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

export const getRfqs = (
  page: number,
  size: number,
  status?: movininTypes.RfqStatus,
  keyword?: string,
): Promise<movininTypes.Result<movininTypes.RfqRequest>> => {
  const params: string[] = []
  if (status) {
    params.push(`status=${status}`)
  }
  if (keyword) {
    params.push(`s=${encodeURIComponent(keyword)}`)
  }
  const query = params.length > 0 ? `?${params.join('&')}` : ''
  return axiosInstance
    .get(
      `/api/rfqs/${page}/${size}${query}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
}

export const updateRfq = (data: movininTypes.UpdateRfqPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-rfq',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)
