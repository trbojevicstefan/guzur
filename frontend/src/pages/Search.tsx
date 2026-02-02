import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
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
import { strings as mapStrings } from '@/lang/map'
import { strings } from '@/lang/search'

import '@/assets/css/search.css'

const Properties = () => {
  const reactLocation = useLocation()
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [location, setLocation] = useState<movininTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [allAgencies, setAllAgencies] = useState<movininTypes.User[]>([])
  const [agencies, setAgencies] = useState<string[]>()
  const [loading, setLoading] = useState(true)
  const [propertyTypes, setPropertyTypes] = useState(movininHelper.getAllPropertyTypes())
  const [rentalTerms, setRentalTerms] = useState(movininHelper.getAllRentalTerms())
  const [openMapDialog, setOpenMapDialog] = useState(false)
  const [listingType, setListingType] = useState(movininTypes.ListingType.Both)
  const [mapProperties, setMapProperties] = useState<movininTypes.Property[]>([])
  const [propertyCount, setPropertyCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [allLocations, setAllLocations] = useState<movininTypes.Location[]>([])
  const [mapLocations, setMapLocations] = useState<movininTypes.Location[]>([])

  const requiresDates = helper.selectionIncludesRent(listingType)
  const listingTypes = useMemo(
    () => helper.listingTypesFromSelection(listingType),
    [listingType],
  )

  const handleAgencyFilterChange = (newAgencies: string[]) => {
    setAgencies(newAgencies)
  }

  const handlePropertyFilterSubmit = (filter: movininTypes.PropertyFilter) => {
    setLocation(filter.location)
    setFrom(filter.from)
    setTo(filter.to)
  }

  const handlePropertyTypeFilterChange = (values: movininTypes.PropertyType[]) => {
    setPropertyTypes(values)
  }

  const handleRentalTermFilterChange = (values: movininTypes.RentalTerm[]) => {
    setRentalTerms(values)
  }

  const handlePropertyListLoad = (data?: movininTypes.Data<movininTypes.Property>) => {
    const rows = data?.rows || []
    setMapProperties(rows)
    setPropertyCount(data?.rowCount || 0)
  }

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
  }, [allLocations, mapProperties, location])

  const onLoad = async (user?: movininTypes.User) => {
    const { state } = reactLocation
    const locationId = state?.locationId as string | undefined
    const _from = state?.from as Date | undefined
    const _to = state?.to as Date | undefined
    const _listingTypes = state?.listingTypes as movininTypes.ListingType[] | undefined

    const listingTypes = Array.isArray(_listingTypes) && _listingTypes.length > 0
      ? _listingTypes
      : [movininTypes.ListingType.Rent, movininTypes.ListingType.Sale]

    const hasRent = listingTypes.includes(movininTypes.ListingType.Rent)
    const hasSale = listingTypes.includes(movininTypes.ListingType.Sale)
    const nextListingType = hasRent && hasSale
      ? movininTypes.ListingType.Both
      : hasRent
        ? movininTypes.ListingType.Rent
        : movininTypes.ListingType.Sale

    try {
      let _location: movininTypes.Location | undefined
      if (locationId) {
        _location = await LocationService.getLocation(locationId)
      }

      const _allAgencies = await AgencyService.getAllAgencies()
      const _agencies = movininHelper.flattenAgencies(_allAgencies)
      const _allLocations = await LocationService.getLocationsWithPosition()

      setLocation(_location)
      if (hasRent) {
        setFrom(_from)
        setTo(_to)
      } else {
        setFrom(undefined)
        setTo(undefined)
      }
      setListingType(nextListingType)
      setAllAgencies(_allAgencies)
      setAgencies(_agencies.length > 0 ? _agencies : undefined)
      setAllLocations(Array.isArray(_allLocations) ? _allLocations : [])
      if (_location) {
        setMapLocations([_location])
      } else {
        setMapLocations([])
      }
      if (!user || (user && user.verified)) {
        setVisible(true)
      }
    } catch (err) {
      helper.error(err)
      setNoMatch(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      {visible && (
        <div className="properties">
          <div className="col-1">
            {!loading && (
              <>
                <Map
                  position={[
                    location?.latitude || env.MAP_LATITUDE,
                    location?.longitude || env.MAP_LONGITUDE,
                  ]}
                  initialZoom={location?.latitude && location?.longitude ? 10 : env.MAP_ZOOM}
                  locations={mapLocations.length > 0 ? mapLocations : location ? [location] : allLocations}
                  properties={mapProperties}
                  onSelectProperty={(propertyId) => navigate(`/property/${propertyId}`, { state: { propertyId } })}
                  className="map"
                  showTileToggle
                  streetLabel={mapStrings.STREET}
                  satelliteLabel={mapStrings.SATELLITE}
                >
                  <ViewOnMapButton onClick={() => setOpenMapDialog(true)} />
                </Map>
                <PropertyFilter
                  className="filter"
                  location={location}
                  from={from}
                  to={to}
                  showDates={requiresDates}
                  requireDates={false}
                  requireLocation={false}
                  collapse
                  onSubmit={handlePropertyFilterSubmit}
                />
                <ListingTypeFilter
                  className="filter"
                  value={listingType}
                  onChange={(value) => {
                    setListingType(value)
                    if (!helper.selectionIncludesRent(value)) {
                      setFrom(undefined)
                      setTo(undefined)
                    }
                  }}
                />
                {!env.HIDE_AGENCIES && allAgencies.length > 0 && (
                  <AgencyFilter
                    className="filter"
                    agencies={allAgencies}
                    onChange={handleAgencyFilterChange}
                  />
                )}
                <PropertyTypeFilter
                  className="filter"
                  onChange={handlePropertyTypeFilterChange}
                />
                <RentalTermFilter
                  className="filter"
                  onChange={handleRentalTermFilterChange}
                />
              </>
            )}
          </div>
          <div className="col-2">
            <div className="search-header">
              <div className="search-breadcrumbs">
                <span>{strings.HOME}</span>
                <span className="separator">›</span>
                <span>{strings.PROPERTIES_IN} {location?.name || strings.OUR_MARKET}</span>
              </div>
                <div className="search-top-bar">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder={strings.SEARCH_PLACEHOLDER}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outlined" className="search-action">
                  {strings.SORT_BY}
                </Button>
                <Button variant="outlined" className="search-action" onClick={() => setOpenMapDialog(true)}>
                  {strings.MAP_VIEW}
                </Button>
                <Button
                  variant="outlined"
                  className="search-action"
                  onClick={() => navigate('/projects')}
                >
                  {strings.SWITCH_COMPOUNDS}
                </Button>
              </div>
                <div className="search-title">
                  <h1>{strings.PROPERTIES_IN} {location?.name || strings.OUR_MARKET}</h1>
                  <span>{propertyCount} {strings.PROPERTIES}</span>
                </div>
            </div>
            <PropertyList
              agencies={agencies}
              types={propertyTypes}
              rentalTerms={rentalTerms}
              listingTypes={listingTypes}
              location={location?._id}
              loading={loading}
              from={from}
              to={to}
              hideAgency={env.HIDE_AGENCIES}
              className="property-list-list"
              onLoad={handlePropertyListLoad}
            />
          </div>
        </div>
      )}

      <MapDialog
        location={location}
        properties={mapProperties}
        locations={mapLocations.length > 0 ? mapLocations : location ? [location] : allLocations}
        onSelectProperty={(propertyId) => navigate(`/property/${propertyId}`, { state: { propertyId } })}
        openMapDialog={openMapDialog}
        onClose={() => setOpenMapDialog(false)}
        showTileToggle
      />

      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default Properties
