import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import * as helper from '@/utils/helper'

export interface PublicPropertySearchState {
  q: string
  locationId: string
  listingType: movininTypes.ListingType
  from?: Date
  to?: Date
  priceMin?: number
  priceMax?: number
  bedroomsMin?: number
  areaMin?: number
  areaMax?: number
  features: movininTypes.PropertyFeature[]
  sort: movininTypes.PropertySort
  propertyTypes: movininTypes.PropertyType[]
  rentalTerms: movininTypes.RentalTerm[]
  agencies: string[]
}

export interface PublicProjectBrowseState {
  q: string
  location: string
  status: movininTypes.DevelopmentStatus | ''
  layout: 'grid' | 'list'
  page: number
}

export const DEFAULT_PROPERTY_SEARCH_STATE: PublicPropertySearchState = {
  q: '',
  locationId: '',
  listingType: movininTypes.ListingType.Both,
  features: [],
  sort: movininTypes.PropertySort.Newest,
  propertyTypes: movininHelper.getAllPropertyTypes(),
  rentalTerms: movininHelper.getAllRentalTerms(),
  agencies: [],
}

export const DEFAULT_PROJECT_BROWSE_STATE: PublicProjectBrowseState = {
  q: '',
  location: '',
  status: '',
  layout: 'grid',
  page: 1,
}

const arrayFromParam = (value: string | null) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const parseNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseDate = (value: string | null): Date | undefined => {
  if (!value) {
    return undefined
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const formatDate = (value?: Date) => {
  if (!value) {
    return ''
  }
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const sanitizePropertySearchState = (state: PublicPropertySearchState): PublicPropertySearchState => {
  const nextState = { ...state }

  if (!helper.selectionIncludesRent(nextState.listingType)) {
    nextState.from = undefined
    nextState.to = undefined
    nextState.rentalTerms = []
  }

  if (nextState.priceMin && nextState.priceMax && nextState.priceMin > nextState.priceMax) {
    const previousMin = nextState.priceMin
    nextState.priceMin = nextState.priceMax
    nextState.priceMax = previousMin
  }

  if (nextState.areaMin && nextState.areaMax && nextState.areaMin > nextState.areaMax) {
    const previousMin = nextState.areaMin
    nextState.areaMin = nextState.areaMax
    nextState.areaMax = previousMin
  }

  return nextState
}

export const parsePropertySearchParams = (params: URLSearchParams): PublicPropertySearchState => {
  const listingTypeParam = params.get('listingType') as movininTypes.ListingType | null
  const listingType = Object.values(movininTypes.ListingType).includes(listingTypeParam as movininTypes.ListingType)
    ? listingTypeParam as movininTypes.ListingType
    : DEFAULT_PROPERTY_SEARCH_STATE.listingType

  const propertyTypes = arrayFromParam(params.get('types'))
    .filter((value): value is movininTypes.PropertyType => movininHelper.getAllPropertyTypes().includes(value as movininTypes.PropertyType))
  const rentalTerms = arrayFromParam(params.get('rentalTerms'))
    .filter((value): value is movininTypes.RentalTerm => movininHelper.getAllRentalTerms().includes(value as movininTypes.RentalTerm))
  const features = arrayFromParam(params.get('features'))
    .filter((value): value is movininTypes.PropertyFeature => helper.getPropertyFeatures().includes(value as movininTypes.PropertyFeature))
  const sortParam = params.get('sort') as movininTypes.PropertySort | null
  const sort = Object.values(movininTypes.PropertySort).includes(sortParam as movininTypes.PropertySort)
    ? sortParam as movininTypes.PropertySort
    : DEFAULT_PROPERTY_SEARCH_STATE.sort

  return sanitizePropertySearchState({
    q: params.get('q') || '',
    locationId: params.get('location') || '',
    listingType,
    from: parseDate(params.get('from')),
    to: parseDate(params.get('to')),
    priceMin: parseNumber(params.get('priceMin')),
    priceMax: parseNumber(params.get('priceMax')),
    bedroomsMin: parseNumber(params.get('bedroomsMin')),
    areaMin: parseNumber(params.get('areaMin')),
    areaMax: parseNumber(params.get('areaMax')),
    features,
    sort,
    propertyTypes: propertyTypes.length > 0 ? propertyTypes : DEFAULT_PROPERTY_SEARCH_STATE.propertyTypes,
    rentalTerms: rentalTerms.length > 0 ? rentalTerms : DEFAULT_PROPERTY_SEARCH_STATE.rentalTerms,
    agencies: arrayFromParam(params.get('agencies')),
  })
}

export const buildPropertySearchParams = (state: PublicPropertySearchState) => {
  const params = new URLSearchParams()
  const nextState = sanitizePropertySearchState(state)

  if (nextState.q) {
    params.set('q', nextState.q)
  }
  if (nextState.locationId) {
    params.set('location', nextState.locationId)
  }
  if (nextState.listingType !== DEFAULT_PROPERTY_SEARCH_STATE.listingType) {
    params.set('listingType', nextState.listingType)
  }
  if (nextState.from) {
    params.set('from', formatDate(nextState.from))
  }
  if (nextState.to) {
    params.set('to', formatDate(nextState.to))
  }
  if (typeof nextState.priceMin === 'number') {
    params.set('priceMin', String(nextState.priceMin))
  }
  if (typeof nextState.priceMax === 'number') {
    params.set('priceMax', String(nextState.priceMax))
  }
  if (typeof nextState.bedroomsMin === 'number') {
    params.set('bedroomsMin', String(nextState.bedroomsMin))
  }
  if (typeof nextState.areaMin === 'number') {
    params.set('areaMin', String(nextState.areaMin))
  }
  if (typeof nextState.areaMax === 'number') {
    params.set('areaMax', String(nextState.areaMax))
  }
  if (nextState.features.length > 0) {
    params.set('features', nextState.features.join(','))
  }
  if (nextState.sort !== DEFAULT_PROPERTY_SEARCH_STATE.sort) {
    params.set('sort', nextState.sort)
  }
  if (nextState.propertyTypes.length > 0 && nextState.propertyTypes.length < movininHelper.getAllPropertyTypes().length) {
    params.set('types', nextState.propertyTypes.join(','))
  }
  if (nextState.rentalTerms.length > 0 && nextState.rentalTerms.length < movininHelper.getAllRentalTerms().length) {
    params.set('rentalTerms', nextState.rentalTerms.join(','))
  }
  if (nextState.agencies.length > 0) {
    params.set('agencies', nextState.agencies.join(','))
  }

  return params
}

export const toGetPropertiesPayload = (state: PublicPropertySearchState): movininTypes.GetPropertiesPayload => {
  const nextState = sanitizePropertySearchState(state)
  return {
    agencies: nextState.agencies,
    listingTypes: helper.listingTypesFromSelection(nextState.listingType),
    location: nextState.locationId || undefined,
    from: nextState.from,
    to: nextState.to,
    q: nextState.q || undefined,
    priceMin: nextState.priceMin,
    priceMax: nextState.priceMax,
    bedroomsMin: nextState.bedroomsMin,
    areaMin: nextState.areaMin,
    areaMax: nextState.areaMax,
    features: nextState.features,
    sort: nextState.sort,
    types: nextState.propertyTypes,
    rentalTerms: helper.selectionIncludesRent(nextState.listingType) ? nextState.rentalTerms : undefined,
  }
}

export const parseProjectBrowseParams = (params: URLSearchParams): PublicProjectBrowseState => {
  const layout = params.get('layout') === 'list' ? 'list' : 'grid'
  const status = params.get('status') as movininTypes.DevelopmentStatus | null
  const page = Number(params.get('page') || '1')

  return {
    q: params.get('q') || '',
    location: params.get('location') || '',
    status: Object.values(movininTypes.DevelopmentStatus).includes(status as movininTypes.DevelopmentStatus)
      ? status as movininTypes.DevelopmentStatus
      : '',
    layout,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export const buildProjectBrowseParams = (state: PublicProjectBrowseState) => {
  const params = new URLSearchParams()

  if (state.q) {
    params.set('q', state.q)
  }
  if (state.location) {
    params.set('location', state.location)
  }
  if (state.status) {
    params.set('status', state.status)
  }
  if (state.layout !== DEFAULT_PROJECT_BROWSE_STATE.layout) {
    params.set('layout', state.layout)
  }
  if (state.page > 1) {
    params.set('page', String(state.page))
  }

  return params
}
