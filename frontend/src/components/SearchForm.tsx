import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormControl, Button } from '@mui/material'
import { DateTimeValidationError } from '@mui/x-date-pickers'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as LocationService from '@/services/LocationService'
import LocationSelectList from '@/components/LocationSelectList'
import DatePicker from '@/components/DatePicker'
import ListingTypeSelect from '@/components/ListingTypeSelect'
import * as helper from '@/utils/helper'

import '@/assets/css/search-form.css'

interface SearchFormProps {
  location?: string
  onCancel?: () => void
  listingTypeOptions?: movininTypes.ListingType[]
  defaultListingType?: movininTypes.ListingType
  requireLocation?: boolean
}

const SearchForm = (
  {
    location: __location,
    onCancel,
    listingTypeOptions,
    defaultListingType,
    requireLocation = true,
  }: SearchFormProps
) => {
  const navigate = useNavigate()

  const _minDate = new Date()
  _minDate.setDate(_minDate.getDate() + 1)

  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Location | undefined>(undefined)
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [minDate, setMinDate] = useState<Date>(_minDate)
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)
  const initialListingType = defaultListingType
    ?? (listingTypeOptions && listingTypeOptions.length > 0
      ? listingTypeOptions[0]
      : movininTypes.ListingType.Both)
  const [listingType, setListingType] = useState(initialListingType)

  const requiresDates = helper.selectionIncludesRent(listingType)

  useEffect(() => {
    if (listingTypeOptions && listingTypeOptions.length > 0 && !listingTypeOptions.includes(listingType)) {
      setListingType(initialListingType)
    }
  }, [listingTypeOptions, listingType, initialListingType])

  useEffect(() => {
    const init = async () => {
      if (__location) {
        const _location = await LocationService.getLocation(__location)
        setSelectedLocation(_location)
        setLocation(__location)
      }
    }
    init()
  }, [__location])

  const handleLocationChange = async (values: movininTypes.Option[]) => {
    const locationId = (values.length > 0 && values[0]._id) || ''
    setLocation(locationId)
    if (locationId) {
      const _location = await LocationService.getLocation(locationId)
      setSelectedLocation(_location)
    } else {
      setSelectedLocation(undefined)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if ((requireLocation && !location) || (requiresDates && (!from || !to)) || fromError || toError) {
      return
    }

    setTimeout(navigate, 0, '/search', {
      state: {
        locationId: location || undefined,
        from,
        to,
        listingTypes: helper.listingTypesFromSelection(listingType),
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="home-search-form">
      <FormControl className="location">
        <LocationSelectList
          label={commonStrings.LOCATION}
          variant="outlined"
          hidePopupIcon
          customOpen={env.isMobile}
          init={!env.isMobile}
          required={requireLocation}
          value={selectedLocation}
          onChange={handleLocationChange}
        />
      </FormControl>
      <FormControl className="listing-type">
        <ListingTypeSelect
          label=""
          value={listingType}
          options={listingTypeOptions}
          variant="outlined"
          onChange={(value) => {
            setListingType(value)
            if (!helper.selectionIncludesRent(value)) {
              setFrom(undefined)
              setTo(undefined)
              setFromError(false)
              setToError(false)
            }
          }}
        />
      </FormControl>
      {requiresDates && (
        <>
          <FormControl className="from">
            <DatePicker
              label={commonStrings.FROM}
              value={from}
              minDate={_minDate}
              variant="outlined"
              required={requiresDates}
              onChange={(date) => {
                if (date) {
                  const __minDate = new Date(date)
                  __minDate.setDate(date.getDate() + 1)
                  setFrom(date)
                  setMinDate(__minDate)
                  setFromError(false)

                  if (to && (to.getTime() - date.getTime() < 24 * 60 * 60 * 1000)) {
                    setTo(undefined)
                  }
                } else {
                  setFrom(undefined)
                  setMinDate(_minDate)
                }
              }}
              onError={(err: DateTimeValidationError) => {
                if (err) {
                  setFromError(true)
                } else {
                  setFromError(false)
                }
              }}
              language={UserService.getLanguage()}
            />
          </FormControl>
          <FormControl className="to">
            <DatePicker
              label={commonStrings.TO}
              value={to}
              minDate={minDate}
              variant="outlined"
              required={requiresDates}
              onChange={(date) => {
                if (date) {
                  setTo(date)
                  setToError(false)
                } else {
                  setTo(undefined)
                }
              }}
              onError={(err: DateTimeValidationError) => {
                if (err) {
                  setToError(true)
                } else {
                  setToError(false)
                }
              }}
              language={UserService.getLanguage()}
            />
          </FormControl>
        </>
      )}
      <Button type="submit" variant="contained" className="btn-search">
        {commonStrings.SEARCH}
      </Button>
      {onCancel && (
        <Button
          variant="outlined"
          color="inherit"
          className="btn-cancel"
          onClick={() => {
            onCancel()
          }}
        >
          {commonStrings.CANCEL}
        </Button>
      )}
    </form>
  )
}

export default SearchForm
