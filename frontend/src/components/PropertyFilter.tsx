import React, { useState, useEffect } from 'react'
import { FormControl, Button, TextField } from '@mui/material'
import { DateTimeValidationError } from '@mui/x-date-pickers'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import LocationSelectList from './LocationSelectList'
import DatePicker from './DatePicker'
import * as helper from '@/utils/helper'

import '@/assets/css/property-filter.css'
import Accordion from './Accordion'

interface PropertyFilterProps {
  q?: string
  from?: Date
  to?: Date
  location?: movininTypes.Location
  priceMin?: number
  priceMax?: number
  bedroomsMin?: number
  areaMin?: number
  areaMax?: number
  features?: movininTypes.PropertyFeature[]
  className?: string
  collapse?: boolean
  showDates?: boolean
  requireDates?: boolean
  requireLocation?: boolean
  onSubmit: movininTypes.PropertyFilterSubmitEvent
}

const parseNumberInput = (value: string) => {
  if (!value.trim()) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const PropertyFilter = ({
  q: filterQ,
  from: filterFrom,
  to: filterTo,
  location: filterLocation,
  priceMin: filterPriceMin,
  priceMax: filterPriceMax,
  bedroomsMin: filterBedroomsMin,
  areaMin: filterAreaMin,
  areaMax: filterAreaMax,
  features: filterFeatures,
  className,
  collapse,
  showDates,
  requireDates = true,
  requireLocation = true,
  onSubmit,
}: PropertyFilterProps) => {
  const _minDate = new Date()
  _minDate.setDate(_minDate.getDate() + 1)

  const [q, setQ] = useState(filterQ || '')
  const [from, setFrom] = useState<Date | undefined>(filterFrom)
  const [to, setTo] = useState<Date | undefined>(filterTo)
  const [minDate, setMinDate] = useState<Date>()
  const [location, setLocation] = useState<movininTypes.Location | null | undefined>(filterLocation)
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)
  const [priceMin, setPriceMin] = useState(filterPriceMin ? String(filterPriceMin) : '')
  const [priceMax, setPriceMax] = useState(filterPriceMax ? String(filterPriceMax) : '')
  const [bedroomsMin, setBedroomsMin] = useState(filterBedroomsMin ? String(filterBedroomsMin) : '')
  const [areaMin, setAreaMin] = useState(filterAreaMin ? String(filterAreaMin) : '')
  const [areaMax, setAreaMax] = useState(filterAreaMax ? String(filterAreaMax) : '')
  const [features, setFeatures] = useState<movininTypes.PropertyFeature[]>(filterFeatures || [])

  const shouldShowDates = showDates ?? requireDates

  useEffect(() => {
    setQ(filterQ || '')
  }, [filterQ])

  useEffect(() => {
    setLocation(filterLocation)
  }, [filterLocation])

  useEffect(() => {
    setPriceMin(filterPriceMin ? String(filterPriceMin) : '')
    setPriceMax(filterPriceMax ? String(filterPriceMax) : '')
    setBedroomsMin(filterBedroomsMin ? String(filterBedroomsMin) : '')
    setAreaMin(filterAreaMin ? String(filterAreaMin) : '')
    setAreaMax(filterAreaMax ? String(filterAreaMax) : '')
    setFeatures(filterFeatures || [])
  }, [filterAreaMax, filterAreaMin, filterBedroomsMin, filterFeatures, filterPriceMax, filterPriceMin])

  useEffect(() => {
    setFrom(filterFrom)
    setTo(filterTo)
    if (filterFrom) {
      const __minDate = new Date(filterFrom)
      __minDate.setDate(filterFrom.getDate() + 1)
      setMinDate(__minDate)
    } else {
      setMinDate(undefined)
    }
  }, [filterFrom, filterTo])

  const handleLocationChange = (values: movininTypes.Option[]) => {
    const _location = (values.length > 0 && values[0]) || null
    setLocation(_location)
  }

  const toggleFeature = (feature: movininTypes.PropertyFeature) => {
    setFeatures((currentFeatures) => (
      currentFeatures.includes(feature)
        ? currentFeatures.filter((value) => value !== feature)
        : [...currentFeatures, feature]
    ))
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

    const nextLocation = (location || filterLocation) as movininTypes.Location
    const filter: movininTypes.PropertyFilter = {
      q: q.trim(),
      location: nextLocation,
      from: shouldShowDates ? from : undefined,
      to: shouldShowDates ? to : undefined,
      priceMin: parseNumberInput(priceMin),
      priceMax: parseNumberInput(priceMax),
      bedroomsMin: parseNumberInput(bedroomsMin),
      areaMin: parseNumberInput(areaMin),
      areaMax: parseNumberInput(areaMax),
      features,
    }
    onSubmit(filter)
  }

  return (
    <Accordion
      title={commonStrings.LOCATION_TERM}
      collapse={collapse}
      className={`${className ? `${className} ` : ''}property-filter`}
    >
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth className="keyword">
          <TextField
            label={commonStrings.KEYWORD}
            value={q}
            variant="standard"
            onChange={(event) => setQ(event.target.value)}
          />
        </FormControl>

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

        <div className="property-filter-grid">
          <FormControl fullWidth className="price-min">
            <TextField
              type="number"
              label={commonStrings.MIN_PRICE}
              value={priceMin}
              variant="standard"
              onChange={(event) => setPriceMin(event.target.value)}
            />
          </FormControl>
          <FormControl fullWidth className="price-max">
            <TextField
              type="number"
              label={commonStrings.MAX_PRICE}
              value={priceMax}
              variant="standard"
              onChange={(event) => setPriceMax(event.target.value)}
            />
          </FormControl>
          <FormControl fullWidth className="bedrooms-min">
            <TextField
              type="number"
              label={commonStrings.MIN_BEDROOMS}
              value={bedroomsMin}
              variant="standard"
              onChange={(event) => setBedroomsMin(event.target.value)}
            />
          </FormControl>
          <FormControl fullWidth className="area-min">
            <TextField
              type="number"
              label={commonStrings.MIN_AREA}
              value={areaMin}
              variant="standard"
              onChange={(event) => setAreaMin(event.target.value)}
            />
          </FormControl>
          <FormControl fullWidth className="area-max">
            <TextField
              type="number"
              label={commonStrings.MAX_AREA}
              value={areaMax}
              variant="standard"
              onChange={(event) => setAreaMax(event.target.value)}
            />
          </FormControl>
        </div>

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
                  setFromError(Boolean(err))
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
                  setToError(Boolean(err))
                }}
                language={UserService.getLanguage()}
              />
            </FormControl>
          </>
        )}

        <div className="property-filter-features">
          {helper.getPropertyFeatures().map((feature) => (
            <button
              key={feature}
              type="button"
              className={`property-filter-feature ${features.includes(feature) ? 'is-active' : ''}`}
              onClick={() => toggleFeature(feature)}
            >
              {helper.getPropertyFeatureLabel(feature)}
            </button>
          ))}
        </div>

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
