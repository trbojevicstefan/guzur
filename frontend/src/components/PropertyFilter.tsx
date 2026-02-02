import React, { useState, useEffect } from 'react'
import { FormControl, Button } from '@mui/material'
import { DateTimeValidationError } from '@mui/x-date-pickers'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import LocationSelectList from './LocationSelectList'
import DatePicker from './DatePicker'

import '@/assets/css/property-filter.css'
import Accordion from './Accordion'

interface PropertyFilterProps {
  from?: Date
  to?: Date
  location?: movininTypes.Location
  className?: string
  collapse?: boolean
  showDates?: boolean
  requireDates?: boolean
  requireLocation?: boolean
  onSubmit: movininTypes.PropertyFilterSubmitEvent
}

const PropertyFilter = ({
  from: filterFrom,
  to: filterTo,
  location: filterLocation,
  className,
  collapse,
  showDates,
  requireDates = true,
  requireLocation = true,
  onSubmit
}: PropertyFilterProps) => {
  const _minDate = new Date()
  _minDate.setDate(_minDate.getDate() + 1)

  const [from, setFrom] = useState<Date | undefined>(filterFrom)
  const [to, setTo] = useState<Date | undefined>(filterTo)
  const [minDate, setMinDate] = useState<Date>()
  const [location, setLocation] = useState<movininTypes.Location | null | undefined>(filterLocation)
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)

  const shouldShowDates = showDates ?? requireDates

  useEffect(() => {
    if (filterFrom) {
      const __minDate = new Date(filterFrom)
      __minDate.setDate(filterFrom.getDate() + 1)
      setMinDate(__minDate)
    }
  }, [filterFrom])

  const handleLocationChange = (values: movininTypes.Option[]) => {
    const _location = (values.length > 0 && values[0]) || null

    setLocation(_location)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (requireDates) {
      if (!from) {
        setFromError(true)
      }
      if (from && !to) {
        setToError(true)
      }
    }

    if ((requireLocation && !location) || (requireDates && (!from || !to)) || fromError || toError) {
      return
    }

    if (onSubmit) {
      const nextLocation = (location || filterLocation) as movininTypes.Location
      const filter: movininTypes.PropertyFilter = {
        location: nextLocation,
        from: requireDates ? from : undefined,
        to: requireDates ? to : undefined,
      }
      onSubmit(filter)
    }
  }

  return (
    <Accordion
      title={commonStrings.LOCATION_TERM}
      collapse={collapse}
      className={`${className ? `${className} ` : ''}property-filter`}
    >
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth className="location">
          <LocationSelectList
            label={commonStrings.LOCATION}
            hidePopupIcon
            customOpen={env.isMobile}
            init={!env.isMobile}
            required={requireLocation}
            variant="standard"
            value={location as movininTypes.Location}
            onChange={handleLocationChange}
          />
        </FormControl>

      {shouldShowDates && (
        <>
          <FormControl fullWidth className="from">
            <DatePicker
              label={commonStrings.FROM}
              value={from}
              minDate={_minDate}
              variant="standard"
              required={requireDates}
              error={fromError}
              helperText={fromError ? commonStrings.REQUIRED : undefined}
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
          <FormControl fullWidth className="to">
            <DatePicker
              label={commonStrings.TO}
              value={to}
              minDate={minDate || _minDate}
              variant="standard"
              required={requireDates}
              error={toError}
              helperText={toError ? commonStrings.REQUIRED : undefined}
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
        <FormControl fullWidth className="search">
          <Button type="submit" variant="contained" className="btn-search">
            {commonStrings.SEARCH}
          </Button>
        </FormControl>
      </form>
    </Accordion>
  )
}

export default PropertyFilter
