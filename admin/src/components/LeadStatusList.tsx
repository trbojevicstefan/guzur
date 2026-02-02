import React, { useState, useEffect, CSSProperties } from 'react'
import {
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextFieldVariants
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'

import '@/assets/css/status-list.css'

interface LeadStatusListProps {
  value?: movininTypes.LeadStatus
  label?: string
  required?: boolean
  variant?: TextFieldVariants
  disabled?: boolean
  style?: CSSProperties
  onChange?: (value: movininTypes.LeadStatus) => void
}

const LeadStatusList = ({
  value: statusListValue,
  label,
  required,
  variant,
  disabled,
  style,
  onChange
}: LeadStatusListProps) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (statusListValue && statusListValue !== value) {
      setValue(statusListValue)
    }
  }, [statusListValue, value])

  const handleChange = (e: SelectChangeEvent<string>) => {
    setValue(e.target.value)

    if (onChange) {
      onChange(e.target.value as movininTypes.LeadStatus)
    }
  }

  return (
    <div style={style || {}}>
      {disabled ? (
        <span className={`bs-s-sv bs-s-${value.toLowerCase()}`} style={{ marginTop: 5 }}>
          {helper.getLeadStatus(value as movininTypes.LeadStatus)}
        </span>
      ) : (
        <>
          <InputLabel className={required ? 'required' : ''}>{label}</InputLabel>
          <Select
            label={label}
            value={value}
            onChange={handleChange}
            variant={variant || 'standard'}
            required={required}
            fullWidth
            renderValue={(_value) => (
              <span className={`bs-s-sv bs-s-${_value.toLowerCase()}`}>
                {helper.getLeadStatus(_value as movininTypes.LeadStatus)}
              </span>
            )}
          >
            <MenuItem value={movininTypes.LeadStatus.New} className="bs-s bs-s-new">
              {commonStrings.LEAD_STATUS_NEW}
            </MenuItem>
            <MenuItem value={movininTypes.LeadStatus.Contacted} className="bs-s bs-s-contacted">
              {commonStrings.LEAD_STATUS_CONTACTED}
            </MenuItem>
            <MenuItem value={movininTypes.LeadStatus.ViewingScheduled} className="bs-s bs-s-viewing_scheduled">
              {commonStrings.LEAD_STATUS_VIEWING_SCHEDULED}
            </MenuItem>
            <MenuItem value={movininTypes.LeadStatus.ClosedWon} className="bs-s bs-s-closed_won">
              {commonStrings.LEAD_STATUS_CLOSED_WON}
            </MenuItem>
            <MenuItem value={movininTypes.LeadStatus.ClosedLost} className="bs-s bs-s-closed_lost">
              {commonStrings.LEAD_STATUS_CLOSED_LOST}
            </MenuItem>
          </Select>
        </>
      )}
    </div>
  )
}

export default LeadStatusList
