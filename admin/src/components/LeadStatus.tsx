import React from 'react'
import * as movininTypes from ':movinin-types'
import * as helper from '@/utils/helper'

import '@/assets/css/lead-status.css'

interface LeadStatusProps {
  value: movininTypes.LeadStatus
}

const LeadStatus = ({ value }: LeadStatusProps) => (
  <div className="lead-status">
    <span className={`ls ls-${value.toLowerCase()}`}>{helper.getLeadStatus(value)}</span>
  </div>
)

export default LeadStatus
