import * as movininTypes from ':movinin-types'
import axiosInstance from './axiosInstance'

export const createRfq = (payload: movininTypes.CreateRfqPayload): Promise<movininTypes.RfqRequest> =>
  axiosInstance
    .post(
      '/api/rfq',
      payload,
      { withCredentials: true }
    )
    .then((res) => res.data)
