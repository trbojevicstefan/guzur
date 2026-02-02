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

interface RfqStatusListProps {
  value?: movininTypes.RfqStatus
  label?: string
  required?: boolean
  variant?: TextFieldVariants
  disabled?: boolean
  style?: CSSProperties
  onChange?: (value: movininTypes.RfqStatus) => void
}

const RfqStatusList = ({
  value: statusListValue,
  label,
  required,
  variant,
  disabled,
  style,
  onChange
}: RfqStatusListProps) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (statusListValue && statusListValue !== value) {
      setValue(statusListValue)
    }
  }, [statusListValue, value])

  const handleChange = (e: SelectChangeEvent<string>) => {
    setValue(e.target.value)

    if (onChange) {
      onChange(e.target.value as movininTypes.RfqStatus)
    }
  }

  return (
    <div style={style || {}}>
      {disabled ? (
        <span className={`bs-s-sv bs-s-${value.toLowerCase()}`} style={{ marginTop: 5 }}>
          {helper.getRfqStatus(value as movininTypes.RfqStatus)}
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
                {helper.getRfqStatus(_value as movininTypes.RfqStatus)}
              </span>
            )}
          >
            <MenuItem value={movininTypes.RfqStatus.New} className="bs-s bs-s-new">
              {commonStrings.RFQ_STATUS_NEW}
            </MenuItem>
            <MenuItem value={movininTypes.RfqStatus.Contacted} className="bs-s bs-s-contacted">
              {commonStrings.RFQ_STATUS_CONTACTED}
            </MenuItem>
            <MenuItem value={movininTypes.RfqStatus.ClosedWon} className="bs-s bs-s-closed_won">
              {commonStrings.RFQ_STATUS_CLOSED_WON}
            </MenuItem>
            <MenuItem value={movininTypes.RfqStatus.ClosedLost} className="bs-s bs-s-closed_lost">
              {commonStrings.RFQ_STATUS_CLOSED_LOST}
            </MenuItem>
          </Select>
        </>
      )}
    </div>
  )
}

export default RfqStatusList
