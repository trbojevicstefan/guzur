import React, { useState, useEffect, CSSProperties } from 'react'
import {
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextFieldVariants
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'

interface DevelopmentStatusListProps {
  value?: movininTypes.DevelopmentStatus
  label?: string
  required?: boolean
  variant?: TextFieldVariants
  disabled?: boolean
  style?: CSSProperties
  includeAll?: boolean
  onChange?: (value: movininTypes.DevelopmentStatus) => void
}

const DevelopmentStatusList = ({
  value: statusValue,
  label,
  required,
  variant,
  disabled,
  style,
  includeAll,
  onChange
}: DevelopmentStatusListProps) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (statusValue && statusValue !== value) {
      setValue(statusValue)
    }
  }, [statusValue, value])

  const handleChange = (e: SelectChangeEvent<string>) => {
    setValue(e.target.value)
    if (onChange) {
      onChange(e.target.value as movininTypes.DevelopmentStatus)
    }
  }

  return (
    <div style={style || {}}>
      <InputLabel className={required ? 'required' : ''}>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={handleChange}
        variant={variant || 'standard'}
        required={required}
        disabled={disabled}
        fullWidth
        renderValue={(_value) => (_value ? helper.getDevelopmentStatus(_value as movininTypes.DevelopmentStatus) : commonStrings.ALL)}
      >
        {includeAll && (
          <MenuItem value="">
            {commonStrings.ALL}
          </MenuItem>
        )}
        {helper.getDevelopmentStatuses().map((status) => (
          <MenuItem key={status.value} value={status.value}>
            {status.label}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export default DevelopmentStatusList
