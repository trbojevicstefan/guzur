import React from 'react'
import * as movininTypes from ':movinin-types'
import * as helper from '@/utils/helper'

import '@/assets/css/listing-status.css'

interface ListingStatusProps {
  value: movininTypes.ListingStatus
}

const ListingStatus = ({ value }: ListingStatusProps) => (
  <div className="listing-status">
    <span className={`ls ls-${value.toLowerCase()}`}>{helper.getListingStatus(value)}</span>
  </div>
)

export default ListingStatus
