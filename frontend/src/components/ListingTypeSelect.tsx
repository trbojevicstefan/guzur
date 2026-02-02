import React, { useEffect, useState, CSSProperties } from 'react'
import {
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextFieldVariants
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import { strings as commonStrings } from '@/lang/common'

interface ListingTypeSelectProps {
  value?: movininTypes.ListingType
  options?: movininTypes.ListingType[]
  label?: string
  required?: boolean
  variant?: TextFieldVariants
  disabled?: boolean
  style?: CSSProperties
  onChange?: (value: movininTypes.ListingType) => void
}

const ListingTypeSelect = ({
  value: listingTypeValue,
  options,
  label,
  required,
  variant,
  disabled,
  style,
  onChange
}: ListingTypeSelectProps) => {
  const listingOptions = options && options.length > 0
    ? options
    : [
      movininTypes.ListingType.Both,
      movininTypes.ListingType.Rent,
      movininTypes.ListingType.Sale,
    ]
  const [value, setValue] = useState(movininTypes.ListingType.Both)

  useEffect(() => {
    if (listingTypeValue && listingTypeValue !== value) {
      setValue(listingTypeValue)
      return
    }
    if (listingOptions.length > 0 && !listingOptions.includes(value)) {
      const nextValue = listingOptions[0]
      setValue(nextValue)
      if (onChange) {
        onChange(nextValue)
      }
    }
  }, [listingTypeValue, value, listingOptions, onChange])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const nextValue = e.target.value as movininTypes.ListingType
    setValue(nextValue)
    if (onChange) {
      onChange(nextValue)
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
      >
        {listingOptions.map((type) => (
          <MenuItem key={type} value={type}>
            {type === movininTypes.ListingType.Both
              ? commonStrings.LISTING_TYPE_BOTH
              : type === movininTypes.ListingType.Rent
                ? commonStrings.LISTING_TYPE_RENT
                : commonStrings.LISTING_TYPE_SALE}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export default ListingTypeSelect
