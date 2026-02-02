import React from 'react'
import * as movininTypes from ':movinin-types'
import * as helper from '@/utils/helper'

import '@/assets/css/rfq-status.css'

interface RfqStatusProps {
  value: movininTypes.RfqStatus
}

const RfqStatus = ({ value }: RfqStatusProps) => (
  <div className="rfq-status">
    <span className={`rs rs-${value.toLowerCase()}`}>{helper.getRfqStatus(value)}</span>
  </div>
)

export default RfqStatus
