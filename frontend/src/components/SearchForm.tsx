import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormControl, Button, TextField } from '@mui/material'
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
import {
  DEFAULT_PROPERTY_SEARCH_STATE,
  PublicPropertySearchState,
  buildPropertySearchParams,
  sanitizePropertySearchState,
} from '@/utils/publicSearch'

import '@/assets/css/search-form.css'

interface SearchFormProps {
  location?: string
  initialState?: Partial<PublicPropertySearchState>
  onCancel?: () => void
  onSubmitState?: (state: PublicPropertySearchState) => void
  listingTypeOptions?: movininTypes.ListingType[]
  defaultListingType?: movininTypes.ListingType
  requireLocation?: boolean
}

const parseNumberInput = (value: string) => {
  if (!value.trim()) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const SearchForm = ({
  location: locationProp,
  initialState,
  onCancel,
  onSubmitState,
  listingTypeOptions,
  defaultListingType,
  requireLocation = true,
}: SearchFormProps) => {
  const navigate = useNavigate()

  const _minDate = new Date()
  _minDate.setDate(_minDate.getDate() + 1)

  const initialListingType = defaultListingType
    ?? initialState?.listingType
    ?? (listingTypeOptions && listingTypeOptions.length > 0
      ? listingTypeOptions[0]
      : movininTypes.ListingType.Both)

  const [query, setQuery] = useState(initialState?.q || '')
  const [location, setLocation] = useState(locationProp || initialState?.locationId || '')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Location | undefined>(undefined)
  const [from, setFrom] = useState<Date | undefined>(initialState?.from)
  const [to, setTo] = useState<Date | undefined>(initialState?.to)
  const [minDate, setMinDate] = useState<Date>(_minDate)
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)
  const [listingType, setListingType] = useState(initialListingType)
  const [priceMin, setPriceMin] = useState(initialState?.priceMin ? String(initialState.priceMin) : '')
  const [priceMax, setPriceMax] = useState(initialState?.priceMax ? String(initialState.priceMax) : '')
  const [bedroomsMin, setBedroomsMin] = useState(initialState?.bedroomsMin ? String(initialState.bedroomsMin) : '')
  const [areaMin, setAreaMin] = useState(initialState?.areaMin ? String(initialState.areaMin) : '')
  const [areaMax, setAreaMax] = useState(initialState?.areaMax ? String(initialState.areaMax) : '')
  const [features, setFeatures] = useState<movininTypes.PropertyFeature[]>(initialState?.features || [])

  const requiresDates = helper.selectionIncludesRent(listingType)

  useEffect(() => {
    if (listingTypeOptions && listingTypeOptions.length > 0 && !listingTypeOptions.includes(listingType)) {
      setListingType(initialListingType)
    }
  }, [initialListingType, listingType, listingTypeOptions])

  useEffect(() => {
    if (from) {
      const __minDate = new Date(from)
      __minDate.setDate(from.getDate() + 1)
      setMinDate(__minDate)
    }
  }, [from])

  useEffect(() => {
    const init = async () => {
      const currentLocation = locationProp || initialState?.locationId
      if (currentLocation) {
        const _location = await LocationService.getLocation(currentLocation)
        setSelectedLocation(_location)
        setLocation(currentLocation)
      }
    }
    init()
  }, [initialState?.locationId, locationProp])

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

  const toggleFeature = (feature: movininTypes.PropertyFeature) => {
    setFeatures((currentFeatures) => (
      currentFeatures.includes(feature)
        ? currentFeatures.filter((value) => value !== feature)
        : [...currentFeatures, feature]
    ))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if ((requireLocation && !location) || (requiresDates && (!from || !to)) || fromError || toError) {
      return
    }

    const nextState = sanitizePropertySearchState({
      ...DEFAULT_PROPERTY_SEARCH_STATE,
      ...initialState,
      q: query.trim(),
      locationId: location || '',
      listingType,
      from,
      to,
      priceMin: parseNumberInput(priceMin),
      priceMax: parseNumberInput(priceMax),
      bedroomsMin: parseNumberInput(bedroomsMin),
      areaMin: parseNumberInput(areaMin),
      areaMax: parseNumberInput(areaMax),
      features,
    })

    if (onSubmitState) {
      onSubmitState(nextState)
      return
    }

    const params = buildPropertySearchParams(nextState)
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <form onSubmit={handleSubmit} className="home-search-form">
      <FormControl className="keyword">
        <TextField
          label={commonStrings.KEYWORD}
          value={query}
          variant="outlined"
          onChange={(event) => setQuery(event.target.value)}
        />
      </FormControl>
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
      <FormControl className="price-min">
        <TextField
          type="number"
          label={commonStrings.MIN_PRICE}
          value={priceMin}
          variant="outlined"
          onChange={(event) => setPriceMin(event.target.value)}
        />
      </FormControl>
      <FormControl className="price-max">
        <TextField
          type="number"
          label={commonStrings.MAX_PRICE}
          value={priceMax}
          variant="outlined"
          onChange={(event) => setPriceMax(event.target.value)}
        />
      </FormControl>
      <FormControl className="bedrooms-min">
        <TextField
          type="number"
          label={commonStrings.MIN_BEDROOMS}
          value={bedroomsMin}
          variant="outlined"
          onChange={(event) => setBedroomsMin(event.target.value)}
        />
      </FormControl>
      <FormControl className="area-min">
        <TextField
          type="number"
          label={commonStrings.MIN_AREA}
          value={areaMin}
          variant="outlined"
          onChange={(event) => setAreaMin(event.target.value)}
        />
      </FormControl>
      <FormControl className="area-max">
        <TextField
          type="number"
          label={commonStrings.MAX_AREA}
          value={areaMax}
          variant="outlined"
          onChange={(event) => setAreaMax(event.target.value)}
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
                setFromError(Boolean(err))
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
                setToError(Boolean(err))
              }}
              language={UserService.getLanguage()}
            />
          </FormControl>
        </>
      )}
      <div className="search-form-features" aria-label={commonStrings.FEATURES}>
        {helper.getPropertyFeatures().map((feature) => (
          <button
            key={feature}
            type="button"
            className={`search-form-feature ${features.includes(feature) ? 'is-active' : ''}`}
            onClick={() => toggleFeature(feature)}
          >
            {helper.getPropertyFeatureLabel(feature)}
          </button>
        ))}
      </div>
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
