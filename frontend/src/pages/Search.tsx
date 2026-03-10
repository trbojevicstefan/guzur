import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@mui/material'
import {
  Search as SearchIcon,
  MapOutlined,
  ApartmentOutlined,
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import * as helper from '@/utils/helper'
import * as LocationService from '@/services/LocationService'
import * as AgencyService from '@/services/AgencyService'
import Layout from '@/components/Layout'
import NoMatch from './NoMatch'
import PropertyFilter from '@/components/PropertyFilter'
import AgencyFilter from '@/components/AgencyFilter'
import RentalTermFilter from '@/components/RentalTermFilter'
import PropertyList from '@/components/PropertyList'
import PropertyTypeFilter from '@/components/PropertyTypeFilter'
import ListingTypeFilter from '@/components/ListingTypeFilter'
import Map from '@/components/Map'
import ViewOnMapButton from '@/components/ViewOnMapButton'
import MapDialog from '@/components/MapDialog'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as mapStrings } from '@/lang/map'
import { strings } from '@/lang/search'
import {
  buildPropertySearchParams,
  parsePropertySearchParams,
  sanitizePropertySearchState,
} from '@/utils/publicSearch'

import '@/assets/css/search.css'

const Properties = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchState = parsePropertySearchParams(searchParams)
  const requiresDates = helper.selectionIncludesRent(searchState.listingType)
  const listingTypes = helper.listingTypesFromSelection(searchState.listingType)
  const allPropertyTypes = movininHelper.getAllPropertyTypes()
  const allRentalTerms = movininHelper.getAllRentalTerms()

  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [location, setLocation] = useState<movininTypes.Location>()
  const [allAgencies, setAllAgencies] = useState<movininTypes.User[]>([])
  const [loading, setLoading] = useState(true)
  const [openMapDialog, setOpenMapDialog] = useState(false)
  const [mapProperties, setMapProperties] = useState<movininTypes.Property[]>([])
  const [propertyCount, setPropertyCount] = useState(0)
  const [allLocations, setAllLocations] = useState<movininTypes.Location[]>([])
  const [mapLocations, setMapLocations] = useState<movininTypes.Location[]>([])

  const updateSearchState = (partial: Partial<typeof searchState>) => {
    const nextState = sanitizePropertySearchState({
      ...searchState,
      ...partial,
    })
    const params = buildPropertySearchParams(nextState)
    setSearchParams(params, { replace: false })
  }

  const handlePropertyFilterSubmit = (filter: movininTypes.PropertyFilter) => {
    updateSearchState({
      q: filter.q || '',
      locationId: filter.location?._id || '',
      from: filter.from,
      to: filter.to,
      priceMin: filter.priceMin,
      priceMax: filter.priceMax,
      bedroomsMin: filter.bedroomsMin,
      areaMin: filter.areaMin,
      areaMax: filter.areaMax,
      features: filter.features || [],
    })
  }

  const handlePropertyListLoad = (data?: movininTypes.Data<movininTypes.Property>) => {
    const rows = data?.rows || []
    setMapProperties(rows)
    setPropertyCount(data?.rowCount || 0)
  }

  useEffect(() => {
    if (!searchState.locationId) {
      setLocation(undefined)
      return
    }

    const loadLocation = async () => {
      try {
        const nextLocation = await LocationService.getLocation(searchState.locationId)
        setLocation(nextLocation)
      } catch (err) {
        helper.error(err)
      }
    }

    loadLocation()
  }, [searchState.locationId])

  useEffect(() => {
    if (allLocations.length > 0 && mapProperties.length > 0) {
      const locationIds = new Set(
        mapProperties
          .map((property) => {
            if (typeof property.location === 'string') {
              return property.location
            }
            if (property.location && typeof property.location === 'object') {
              return property.location._id
            }
            return undefined
          })
          .filter((loc): loc is string => typeof loc === 'string'),
      )
      const filteredLocations = allLocations.filter((loc) => locationIds.has(String(loc._id)))
      setMapLocations(filteredLocations)
      return
    }

    if (location) {
      setMapLocations([location])
      return
    }

    setMapLocations([])
  }, [allLocations, location, mapProperties])

  const onLoad = async (user?: movininTypes.User) => {
    try {
      const [_allAgencies, _allLocations] = await Promise.all([
        AgencyService.getAllAgencies(),
        LocationService.getLocationsWithPosition(),
      ])
      setAllAgencies(_allAgencies)
      setAllLocations(Array.isArray(_allLocations) ? _allLocations : [])
      if (!user || user.verified) {
        setVisible(true)
      }
    } catch (err) {
      helper.error(err)
      setNoMatch(true)
    } finally {
      setLoading(false)
    }
  }

  const agencyIds = movininHelper.flattenAgencies(allAgencies)
  const selectedAgencyIds = searchState.agencies.length > 0 ? searchState.agencies : []
  const selectedPropertyTypes = searchState.propertyTypes.length < allPropertyTypes.length ? searchState.propertyTypes : []
  const selectedRentalTerms = searchState.rentalTerms.length < allRentalTerms.length ? searchState.rentalTerms : []

  return (
    <Layout onLoad={onLoad} strict={false}>
      {visible && (
        <div className="properties-page">
          <div className="search-header">
            <div className="search-breadcrumbs">
              <span>{strings.HOME}</span>
              <span className="separator">&gt;</span>
              <span>{strings.PROPERTIES_IN} {location?.name || strings.OUR_MARKET}</span>
            </div>
            <div className="search-top-bar">
              <div className="search-input">
                <span className="search-input-icon">
                  <SearchIcon fontSize="small" />
                </span>
                <input
                  type="text"
                  placeholder={strings.SEARCH_PLACEHOLDER}
                  value={searchState.q}
                  onChange={(e) => updateSearchState({ q: e.target.value })}
                />
              </div>
              <div className="search-sort">
                <label htmlFor="search-sort-select">{strings.SORT_BY}</label>
                <select
                  id="search-sort-select"
                  value={searchState.sort}
                  onChange={(event) => updateSearchState({ sort: event.target.value as movininTypes.PropertySort })}
                >
                  <option value={movininTypes.PropertySort.Newest}>{commonStrings.SORT_BY_NEWEST}</option>
                  <option value={movininTypes.PropertySort.PriceAsc}>{commonStrings.SORT_BY_PRICE_LOW}</option>
                  <option value={movininTypes.PropertySort.PriceDesc}>{commonStrings.SORT_BY_PRICE_HIGH}</option>
                </select>
              </div>
              <Button
                variant="outlined"
                className="search-action search-action-map"
                onClick={() => setOpenMapDialog(true)}
              >
                <MapOutlined fontSize="small" />
                {strings.MAP_VIEW}
              </Button>
              <Button
                variant="outlined"
                className="search-action search-action-compounds"
                onClick={() => navigate('/projects')}
              >
                <ApartmentOutlined fontSize="small" />
                {strings.SWITCH_COMPOUNDS}
              </Button>
            </div>
            <div className="search-title">
              <h1>{strings.PROPERTIES_IN} {location?.name || strings.OUR_MARKET}</h1>
              <span>{propertyCount} {strings.PROPERTIES}</span>
            </div>
          </div>

          {requiresDates && (!searchState.from || !searchState.to) && (
            <div className="search-requires-dates">{strings.SELECT_DATES_TO_SEARCH_RENTALS}</div>
          )}

          <div className="properties">
            <div className="col-1">
              <PropertyFilter
                className="filter"
                q={searchState.q}
                location={location}
                from={searchState.from}
                to={searchState.to}
                priceMin={searchState.priceMin}
                priceMax={searchState.priceMax}
                bedroomsMin={searchState.bedroomsMin}
                areaMin={searchState.areaMin}
                areaMax={searchState.areaMax}
                features={searchState.features}
                showDates={requiresDates}
                requireDates={false}
                requireLocation={false}
                collapse
                onSubmit={handlePropertyFilterSubmit}
              />
              <ListingTypeFilter
                className="filter"
                value={searchState.listingType}
                onChange={(value) => {
                  updateSearchState({
                    listingType: value,
                    from: helper.selectionIncludesRent(value) ? searchState.from : undefined,
                    to: helper.selectionIncludesRent(value) ? searchState.to : undefined,
                  })
                }}
              />
              {!env.HIDE_AGENCIES && allAgencies.length > 0 && (
                <AgencyFilter
                  className="filter"
                  agencies={allAgencies}
                  value={selectedAgencyIds}
                  onChange={(newAgencies) => {
                    const nextAgencyIds = newAgencies.length === agencyIds.length ? [] : newAgencies
                    updateSearchState({ agencies: nextAgencyIds })
                  }}
                />
              )}
              <PropertyTypeFilter
                className="filter"
                value={selectedPropertyTypes}
                onChange={(values) => {
                  const nextTypes = values.length === allPropertyTypes.length ? [] : values
                  updateSearchState({ propertyTypes: nextTypes.length > 0 ? nextTypes : allPropertyTypes })
                }}
              />
              {requiresDates && (
                <RentalTermFilter
                  className="filter"
                  value={selectedRentalTerms}
                  onChange={(values) => {
                    const nextTerms = values.length === allRentalTerms.length ? [] : values
                    updateSearchState({ rentalTerms: nextTerms.length > 0 ? nextTerms : allRentalTerms })
                  }}
                />
              )}
              {!env.isMobile && (
                <Map
                  position={[
                    location?.latitude || env.MAP_LATITUDE,
                    location?.longitude || env.MAP_LONGITUDE,
                  ]}
                  initialZoom={location?.latitude && location?.longitude ? 10 : env.MAP_ZOOM}
                  locations={mapLocations.length > 0 ? mapLocations : location ? [location] : allLocations}
                  properties={mapProperties}
                  onSelectProperty={(propertyId) => navigate(`/property/${propertyId}`)}
                  className="map"
                  showTileToggle
                  showLocationSearch
                  streetLabel={mapStrings.STREET}
                  satelliteLabel={mapStrings.SATELLITE}
                  clickToActivate
                  lockOnMouseLeave
                >
                  <ViewOnMapButton onClick={() => setOpenMapDialog(true)} />
                </Map>
              )}
            </div>

            <div className="col-2">
              <PropertyList
                q={searchState.q}
                agencies={env.HIDE_AGENCIES
                  ? undefined
                  : (searchState.agencies.length > 0
                    ? searchState.agencies
                    : (agencyIds.length > 0 ? agencyIds : undefined))}
                types={searchState.propertyTypes}
                rentalTerms={requiresDates ? searchState.rentalTerms : undefined}
                listingTypes={listingTypes}
                location={searchState.locationId || undefined}
                loading={loading}
                from={searchState.from}
                to={searchState.to}
                priceMin={searchState.priceMin}
                priceMax={searchState.priceMax}
                bedroomsMin={searchState.bedroomsMin}
                areaMin={searchState.areaMin}
                areaMax={searchState.areaMax}
                features={searchState.features}
                sort={searchState.sort}
                hideAgency={env.HIDE_AGENCIES}
                className="property-list-list"
                onLoad={handlePropertyListLoad}
              />
            </div>
          </div>
        </div>
      )}

      <MapDialog
        location={location}
        properties={mapProperties}
        locations={mapLocations.length > 0 ? mapLocations : location ? [location] : allLocations}
        onSelectProperty={(propertyId) => navigate(`/property/${propertyId}`)}
        openMapDialog={openMapDialog}
        onClose={() => setOpenMapDialog(false)}
        showTileToggle
        showLocationSearch
      />

      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default Properties
