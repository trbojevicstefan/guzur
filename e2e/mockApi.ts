import { Page, Route } from 'playwright/test'

export const FIXTURE_IDS = {
  cairo: 'loc-cairo',
  giza: 'loc-giza',
  property: 'prop-palm-residence',
  development: 'dev-nile-gate',
} as const

const locations = [
  {
    _id: FIXTURE_IDS.cairo,
    name: 'Cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    image: '',
  },
  {
    _id: FIXTURE_IDS.giza,
    name: 'Giza',
    latitude: 29.987,
    longitude: 31.2118,
    image: '',
  },
]

const developments = [
  {
    _id: FIXTURE_IDS.development,
    name: 'Nile Gate Residences',
    location: 'Cairo',
    status: 'IN_PROGRESS',
    completionDate: '2027-06-01T00:00:00.000Z',
    unitsCount: 180,
    images: [],
    developerOrg: {
      _id: 'org-nile-dev',
      name: 'Nile Dev Co',
      slug: 'nile-dev',
    },
  },
  {
    _id: 'dev-harbor-point',
    name: 'Harbor Point',
    location: 'Giza',
    status: 'COMPLETED',
    completionDate: '2025-12-01T00:00:00.000Z',
    unitsCount: 96,
    images: [],
    developerOrg: {
      _id: 'org-harbor',
      name: 'Harbor Developments',
      slug: 'harbor-developments',
    },
  },
]

const properties = [
  {
    _id: FIXTURE_IDS.property,
    name: 'Palm Residence 12',
    listingType: 'BOTH',
    listingStatus: 'PUBLISHED',
    type: 'APARTMENT',
    price: 1800,
    salePrice: 350000,
    rentalTerm: 'MONTHLY',
    bedrooms: 3,
    bathrooms: 2,
    kitchens: 1,
    parkingSpaces: 2,
    furnished: true,
    aircon: true,
    petsAllowed: true,
    size: 165,
    latitude: 30.05,
    longitude: 31.24,
    address: 'Palm Residence, Cairo',
    description: '<p>Bright apartment in a gated community with sale and rent options.</p>',
    image: 'https://images.guzur.test/property-main.jpg',
    images: [
      'https://images.guzur.test/property-main.jpg',
      'https://images.guzur.test/property-gallery.jpg',
    ],
    agency: {
      _id: 'broker-atlas',
      fullName: 'Atlas Brokers',
      company: 'Atlas Brokers',
    },
    broker: {
      _id: 'broker-user-1',
      fullName: 'Mina Sameh',
      avatar: '',
    },
    brokerageOrg: {
      _id: 'org-atlas',
      name: 'Atlas Brokerage',
      slug: 'atlas-brokerage',
      logo: '',
    },
    developmentId: {
      _id: FIXTURE_IDS.development,
      name: 'Nile Gate Residences',
      location: 'Cairo',
      deliveryYear: '2027',
    },
    location: {
      ...locations[0],
    },
    createdAt: '2026-03-01T12:00:00.000Z',
  },
  {
    _id: 'prop-skyline-villa',
    name: 'Skyline Villa',
    listingType: 'SALE',
    listingStatus: 'PUBLISHED',
    type: 'HOUSE',
    price: 0,
    salePrice: 620000,
    bedrooms: 4,
    bathrooms: 3,
    kitchens: 1,
    parkingSpaces: 3,
    furnished: false,
    aircon: true,
    petsAllowed: false,
    size: 240,
    latitude: 29.99,
    longitude: 31.214,
    address: 'Skyline District, Giza',
    description: '<p>Large villa for sale with skyline views.</p>',
    image: '',
    images: [],
    owner: {
      _id: 'owner-1',
      fullName: 'Rana Adel',
      avatar: '',
    },
    location: {
      ...locations[1],
    },
    createdAt: '2026-02-10T12:00:00.000Z',
  },
  {
    _id: 'prop-harbor-rental',
    name: 'Harbor Rental Suite',
    listingType: 'RENT',
    listingStatus: 'PUBLISHED',
    type: 'APARTMENT',
    price: 1200,
    bedrooms: 2,
    bathrooms: 1,
    kitchens: 1,
    parkingSpaces: 0,
    furnished: false,
    aircon: false,
    petsAllowed: false,
    size: 112,
    rentalTerm: 'MONTHLY',
    latitude: 30.041,
    longitude: 31.228,
    address: 'Harbor District, Cairo',
    description: '<p>Rent-ready suite near the waterfront.</p>',
    image: '',
    images: [],
    developerOrg: {
      _id: 'org-harbor',
      name: 'Harbor Developments',
      slug: 'harbor-developments',
      logo: '',
    },
    location: {
      ...locations[0],
    },
    createdAt: '2026-01-14T12:00:00.000Z',
  },
]

const agencies: any[] = []

const countries = [
  {
    _id: 'country-eg',
    name: 'Egypt',
  },
]

const json = async (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

const paginate = <T>(items: T[], page: number, size: number) => {
  const start = Math.max((page - 1) * size, 0)
  return [{
    pageInfo: [{ totalRecords: items.length }],
    resultData: items.slice(start, start + size),
  }]
}

const normalize = (value?: string) => (value || '').trim().toLowerCase()

const propertyPrice = (property: any) =>
  property.listingType === 'RENT'
    ? property.price
    : property.salePrice ?? property.price

const propertyMatchesListingTypes = (property: any, listingTypes?: string[]) => {
  if (!listingTypes || listingTypes.length === 0) {
    return true
  }

  if (property.listingType === 'BOTH') {
    return listingTypes.includes('SALE') || listingTypes.includes('RENT')
  }

  return listingTypes.includes(property.listingType)
}

const propertyMatchesFeatures = (property: any, features?: string[]) => {
  if (!features || features.length === 0) {
    return true
  }

  return features.every((feature) => {
    switch (feature) {
      case 'FURNISHED':
        return Boolean(property.furnished)
      case 'AIR_CONDITIONING':
        return Boolean(property.aircon)
      case 'PETS_ALLOWED':
        return Boolean(property.petsAllowed)
      case 'PARKING':
        return Number(property.parkingSpaces || 0) > 0
      case 'IN_COMPOUND':
        return Boolean(property.developmentId)
      default:
        return true
    }
  })
}

const filterProperties = (payload: Record<string, any>) => {
  const keyword = normalize(payload.q)
  const listingTypes = Array.isArray(payload.listingTypes) ? payload.listingTypes : undefined

  let rows = [...properties].filter((property) => property.listingStatus === 'PUBLISHED')

  if (keyword) {
    rows = rows.filter((property) => (
      normalize(property.name).includes(keyword)
      || normalize(property.address).includes(keyword)
      || normalize(property.location?.name).includes(keyword)
    ))
  }

  if (payload.location) {
    rows = rows.filter((property) => property.location?._id === payload.location)
  }

  if (payload.types && payload.types.length > 0) {
    rows = rows.filter((property) => payload.types.includes(property.type))
  }

  rows = rows.filter((property) => propertyMatchesListingTypes(property, listingTypes))

  if (typeof payload.priceMin === 'number') {
    rows = rows.filter((property) => propertyPrice(property) >= payload.priceMin)
  }

  if (typeof payload.priceMax === 'number') {
    rows = rows.filter((property) => propertyPrice(property) <= payload.priceMax)
  }

  if (typeof payload.bedroomsMin === 'number') {
    rows = rows.filter((property) => Number(property.bedrooms || 0) >= payload.bedroomsMin)
  }

  if (typeof payload.areaMin === 'number') {
    rows = rows.filter((property) => Number(property.size || 0) >= payload.areaMin)
  }

  if (typeof payload.areaMax === 'number') {
    rows = rows.filter((property) => Number(property.size || 0) <= payload.areaMax)
  }

  rows = rows.filter((property) => propertyMatchesFeatures(property, payload.features))

  if (payload.sort === 'PRICE_ASC') {
    rows.sort((a, b) => propertyPrice(a) - propertyPrice(b))
  } else if (payload.sort === 'PRICE_DESC') {
    rows.sort((a, b) => propertyPrice(b) - propertyPrice(a))
  } else {
    rows.sort((a, b) => normalize(b.createdAt).localeCompare(normalize(a.createdAt)))
  }

  return rows
}

const filterDevelopments = (params: URLSearchParams) => {
  const keyword = normalize(params.get('q') || params.get('keyword') || '')
  const location = normalize(params.get('location') || '')
  const status = params.get('status') || ''

  return developments.filter((development) => {
    const matchesKeyword = !keyword
      || normalize(development.name).includes(keyword)
      || normalize(development.developerOrg?.name).includes(keyword)
    const matchesLocation = !location || normalize(development.location).includes(location)
    const matchesStatus = !status || development.status === status

    return matchesKeyword && matchesLocation && matchesStatus
  })
}

const findLocation = (id: string) => locations.find((location) => location._id === id) || locations[0]

const parsePathPageAndSize = (pathname: string, prefix: string) => {
  const match = pathname.match(new RegExp(`${prefix}/(\\d+)/(\\d+)`))
  if (!match) {
    return { page: 1, size: 30 }
  }

  return {
    page: Number(match[1]) || 1,
    size: Number(match[2]) || 30,
  }
}

const getPostPayload = (route: Route): Record<string, any> => {
  try {
    return route.request().postDataJSON() as Record<string, any>
  } catch {
    return {}
  }
}

export const installApiMocks = async (page: Page) => {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname, searchParams } = url

    if (pathname === '/api/sign-out') {
      await json(route, {})
      return
    }

    if (pathname === '/api/all-agencies') {
      await json(route, agencies)
      return
    }

    if (pathname.startsWith('/api/countries-with-locations/')) {
      await json(route, countries)
      return
    }

    if (pathname.startsWith('/api/locations-with-position/')) {
      await json(route, locations)
      return
    }

    if (pathname.startsWith('/api/locations/')) {
      const { page: currentPage, size } = parsePathPageAndSize(pathname, '/api/locations')
      const keyword = normalize(searchParams.get('s') || '')
      const rows = keyword
        ? locations.filter((location) => normalize(location.name).includes(keyword))
        : locations
      await json(route, paginate(rows, currentPage, size))
      return
    }

    if (pathname.startsWith('/api/location-id/')) {
      const name = decodeURIComponent(pathname.split('/')[3] || '')
      const matchedLocation = locations.find((location) => normalize(location.name) === normalize(name))
      await json(route, matchedLocation?._id || FIXTURE_IDS.cairo)
      return
    }

    if (pathname.startsWith('/api/location/')) {
      const locationId = decodeURIComponent(pathname.split('/')[3] || FIXTURE_IDS.cairo)
      await json(route, findLocation(locationId))
      return
    }

    if (pathname.startsWith('/api/frontend-properties/')) {
      const { page: currentPage, size } = parsePathPageAndSize(pathname, '/api/frontend-properties')
      const payload = getPostPayload(route)
      await json(route, paginate(filterProperties(payload), currentPage, size))
      return
    }

    if (pathname.startsWith('/api/property/')) {
      const propertyId = decodeURIComponent(pathname.split('/')[3] || FIXTURE_IDS.property)
      const property = properties.find((item) => item._id === propertyId) || properties[0]
      await json(route, property)
      return
    }

    if (pathname.startsWith('/api/frontend-developments/')) {
      const { page: currentPage, size } = parsePathPageAndSize(pathname, '/api/frontend-developments')
      await json(route, paginate(filterDevelopments(searchParams), currentPage, size))
      return
    }

    if (pathname === '/api/create-lead') {
      const payload = getPostPayload(route)
      await json(route, { _id: 'lead-smoke-1', ...payload })
      return
    }

    await json(route, {})
  })
}
