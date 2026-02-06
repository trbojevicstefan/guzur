import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, Tab, Dialog, DialogContent, Button } from '@mui/material'
import {
  RoomService,
  Apartment,
  AccessTime,
  AttachMoney,
  Public,
  FlashOn,
  CheckBox,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import L from 'leaflet'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/home'
import { strings as commonStrings } from '@/lang/common'
import * as CountryService from '@/services/CountryService'
import * as LocationService from '@/services/LocationService'
import * as PropertyService from '@/services/PropertyService'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import SearchForm from '@/components/SearchForm'
import LocationCarrousel from '@/components/LocationCarrousel'
import TabPanel, { a11yProps } from '@/components/TabPanel'
import Map from '@/components/Map'
import { strings as mapStrings } from '@/lang/map'
import Footer from '@/components/Footer'
import { useHeaderSearch } from '@/context/HeaderSearchContext'

import '@/assets/css/home.css'

const Home = () => {
  const navigate = useNavigate()
  const { setSearchSlot } = useHeaderSearch()

  const [countries, setCountries] = useState<movininTypes.CountryInfo[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [openLocationSearchFormDialog, setOpenLocationSearchFormDialog] = useState(false)
  const [locations, setLocations] = useState<movininTypes.Location[]>([])
  const [location, setLocation] = useState('')
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [featuredListings, setFeaturedListings] = useState<movininTypes.Property[]>([])
  const [homeListings, setHomeListings] = useState<movininTypes.Property[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [loadedListingImages, setLoadedListingImages] = useState<Record<string, boolean>>({})
  const [failedListingImages, setFailedListingImages] = useState<Record<string, boolean>>({})
  const [headerSearchActive, setHeaderSearchActive] = useState(false)
  const featuredRowRef = useRef<HTMLDivElement | null>(null)
  const allRowRef = useRef<HTMLDivElement | null>(null)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const video = entry.target as HTMLVideoElement
      if (entry.isIntersecting) {
        video.muted = true
        video.play()
      } else {
        video.pause()
      }
    })
  }

  const onLoad = async () => {
    try {
      const _countries = await CountryService.getCountriesWithLocations('', true, env.MIN_LOCATIONS)
      setCountries(Array.isArray(_countries) ? _countries : [])
    } catch {
      setCountries([])
    }

    try {
      const _locations = await LocationService.getLocationsWithPosition()
      setLocations(Array.isArray(_locations) ? _locations : [])
    } catch {
      setLocations([])
    }

    try {
      setListingsLoading(true)
      setLoadedListingImages({})
      setFailedListingImages({})
      const payload: movininTypes.GetPropertiesPayload = {
        agencies: [],
        types: movininHelper.getAllPropertyTypes(),
        rentalTerms: movininHelper.getAllRentalTerms(),
        listingStatuses: [movininTypes.ListingStatus.Published],
      }
      const data = await PropertyService.getProperties(payload, 1, 20)
      const _data = (data && data.length > 0 ? data[0] : undefined) ?? { resultData: [] as movininTypes.Property[] }
      const rows = Array.isArray(_data.resultData) ? _data.resultData : []
      const sorted = [...rows].sort((a, b) => {
        const nameA = a.location?.name || ''
        const nameB = b.location?.name || ''
        return nameA.localeCompare(nameB)
      })
      setHomeListings(sorted)
      setFeaturedListings(sorted.slice(0, 6))
    } catch {
      setFeaturedListings([])
      setHomeListings([])
    } finally {
      setListingsLoading(false)
    }

    const observer = new IntersectionObserver(handleIntersection)
    const video = document.getElementById('cover') as HTMLVideoElement
    if (video) {
      observer.observe(video)
    } else {
      console.error('Cover video not found')
    }
  }

  const language = UserService.getLanguage()

  useEffect(() => {
    const threshold = 180
    const onScroll = () => {
      const shouldActivate = window.scrollY > threshold
      setHeaderSearchActive(shouldActivate)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      setHeaderSearchActive(false)
      setSearchSlot(null)
    }
  }, [setSearchSlot])

  useEffect(() => {
    if (headerSearchActive) {
      setSearchSlot(
        <SearchForm
          listingTypeOptions={[movininTypes.ListingType.Sale, movininTypes.ListingType.Rent]}
          defaultListingType={movininTypes.ListingType.Sale}
          requireLocation={false}
        />,
      )
    } else {
      setSearchSlot(null)
    }
  }, [headerSearchActive, setSearchSlot])

  const setListingImageLoaded = (imageUrl: string) => {
    setLoadedListingImages((prev) => {
      if (prev[imageUrl]) {
        return prev
      }
      return { ...prev, [imageUrl]: true }
    })
  }

  const setListingImageFailed = (imageUrl: string) => {
    setFailedListingImages((prev) => {
      if (prev[imageUrl]) {
        return prev
      }
      return { ...prev, [imageUrl]: true }
    })
  }

  const renderListingCard = (property: movininTypes.Property) => {
    const isSaleListing = property.listingType === movininTypes.ListingType.Sale
      || property.listingType === movininTypes.ListingType.Both
    const priceValue = isSaleListing && property.salePrice ? property.salePrice : property.price
    const sellerName = typeof property.agency === 'object'
      ? (property.agency.fullName || property.agency.company || '')
      : ''
    const sizeLabel = property.size ? `${movininHelper.formatNumber(property.size, language)} ${env.SIZE_UNIT}` : ''
    const resolveImageName = (value?: string) => {
      if (!value) {
        return ''
      }
      const trimmed = value.trim()
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
        return ''
      }
      return trimmed
    }
    const fallbackImageName = (property.images || [])
      .map(resolveImageName)
      .find((img) => img)
    const propertyImageName = resolveImageName(property.image) || fallbackImageName
    const propertyImageUrl = propertyImageName
      ? (propertyImageName.startsWith('http')
        ? propertyImageName
        : movininHelper.joinURL(env.CDN_PROPERTIES, propertyImageName))
      : ''
    const imageLoaded = propertyImageUrl ? Boolean(loadedListingImages[propertyImageUrl]) : false
    const imageFailed = propertyImageUrl ? Boolean(failedListingImages[propertyImageUrl]) : false
    return (
      <div key={property._id} className="home-listing-card">
        <button
          type="button"
          className="home-listing-image"
          onClick={() => {
            navigate(`/property/${property._id}`, { state: { propertyId: property._id } })
          }}
        >
          {propertyImageUrl && !imageFailed ? (
            <div className={`home-listing-media${imageLoaded ? ' is-loaded' : ''}`}>
              {!imageLoaded && <span className="home-listing-image-skeleton shimmer" />}
              <img
                src={propertyImageUrl}
                alt={property.name}
                loading="lazy"
                onLoad={() => {
                  setListingImageLoaded(propertyImageUrl)
                }}
                onError={() => {
                  setListingImageFailed(propertyImageUrl)
                }}
              />
            </div>
          ) : (
            <div className="home-listing-placeholder">{property.name?.charAt(0) || 'P'}</div>
          )}
        </button>
        <div className="home-listing-body">
          <div className="home-listing-name">{property.name}</div>
          {sellerName && (
            <div className="home-listing-seller">
              {strings.SELLER_LABEL} {sellerName}
            </div>
          )}
          <div className="home-listing-meta">
            {sizeLabel && <span>{sizeLabel}</span>}
            <span className="home-listing-price">
              {movininHelper.formatPrice(priceValue, commonStrings.CURRENCY, language)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    const node = ref.current
    if (!node) {
      return
    }
    const offset = node.clientWidth * 0.8
    node.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    })
  }

  const renderListingsRow = (rows: movininTypes.Property[], ref: React.RefObject<HTMLDivElement | null>) => (
    <div className="home-listings-row-wrapper">
      <button
        type="button"
        className="home-listings-nav prev"
        onClick={() => scrollRow(ref, 'left')}
        aria-label="Scroll left"
      >
        <ChevronLeft />
      </button>
      <div className="home-listings-row" ref={ref}>
        {rows.map(renderListingCard)}
      </div>
      <button
        type="button"
        className="home-listings-nav next"
        onClick={() => scrollRow(ref, 'right')}
        aria-label="Scroll right"
      >
        <ChevronRight />
      </button>
    </div>
  )

  const renderListingsSkeletonRow = (count: number) => (
    <div className="home-listings-row home-listings-row-skeleton" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`listing-skeleton-${index}`} className="home-listing-card skeleton">
          <div className="home-listing-image-skeleton-block shimmer" />
          <div className="home-listing-body">
            <span className="home-line-skeleton home-line-lg shimmer" />
            <span className="home-line-skeleton home-line-md shimmer" />
            <div className="home-listing-meta">
              <span className="home-line-skeleton home-line-sm shimmer" />
              <span className="home-line-skeleton home-line-sm shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="home">

        <div className="home-content">

          <div className="video">
            <video
              id="cover"
              muted={!env.isSafari}
              autoPlay={!env.isSafari}
              loop
              playsInline
              disablePictureInPicture
              onLoadedData={async () => {
                setVideoLoaded(true)
              }}
            >
              <source src="hero2.mp4" type="video/mp4" />
              <track kind="captions" />
            </video>
            {!videoLoaded && (
              <div className="video-background" />
            )}
          </div>

          <div className="home-title">
            <span className="home-title-line">{strings.TITLE_LINE1}</span>
            <span className="home-title-line home-title-line-secondary">{strings.TITLE_LINE2}</span>
          </div>
          {strings.COVER && (
            <div className="home-cover">{strings.COVER}</div>
          )}
          {/* <div className="home-subtitle">{strings.SUBTITLE}</div> */}

        </div>

        {!headerSearchActive && (
          <div className="search">
            <div className="home-search">
              <SearchForm
                listingTypeOptions={[movininTypes.ListingType.Sale, movininTypes.ListingType.Rent]}
                defaultListingType={movininTypes.ListingType.Sale}
                requireLocation={false}
              />
            </div>
          </div>
        )}

        <div className="home-listings featured-listings">
          <h1>{strings.FEATURED_TITLE}</h1>
          {listingsLoading ? (
            renderListingsSkeletonRow(6)
          ) : (
            renderListingsRow(featuredListings, featuredRowRef)
          )}
        </div>

        <div className="home-listings all-listings">
          <h1>{strings.LISTINGS_TITLE}</h1>
          {listingsLoading ? (
            renderListingsSkeletonRow(8)
          ) : (
            renderListingsRow(homeListings, allRowRef)
          )}
        </div>

        <div className="services">

          <h1>{strings.SERVICES_TITLE}</h1>

          <div className="services-boxes">

            <div className="services-box">
              <div className="services-icon-wrapper">
                <Apartment className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_FLEET_TITLE}</span>
                <span className="services-text">{strings.SERVICES_FLEET}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <AccessTime className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_FLEXIBLE_TITLE}</span>
                <span className="services-text">{strings.SERVICES_FLEXIBLE}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <AttachMoney className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_PRICES_TITLE}</span>
                <span className="services-text">{strings.SERVICES_PRICES}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <Public className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_BOOKING_ONLINE_TITLE}</span>
                <span className="services-text">{strings.SERVICES_BOOKING_ONLINE}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <FlashOn className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICE_INSTANT_BOOKING_TITLE}</span>
                <span className="services-text">{strings.SERVICE_INSTANT_BOOKING}</span>
              </div>
            </div>

            <div className="services-box">
              <div className="services-icon-wrapper">
                <RoomService className="services-icon" />
              </div>
              <div className="services-text-wrapper">
                <span className="services-title">{strings.SERVICES_SUPPORT_TITLE}</span>
                <span className="services-text">{strings.SERVICES_SUPPORT}</span>
              </div>
            </div>

          </div>
        </div>

        {countries.length > 0 && (
          <div className="destinations">
            <h1>{strings.DESTINATIONS_TITLE}</h1>
            <div className="tabs">
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="destinations"
                TabIndicatorProps={{ sx: { display: env.isMobile ? 'none' : null } }}
                sx={{
                  '& .MuiTabs-flexContainer': {
                    flexWrap: 'wrap',
                  },
                }}
              >
                {
                  countries.map((country, index) => (
                    <Tab key={country._id} label={country.name?.toUpperCase()} {...a11yProps(index)} />
                  ))
                }
              </Tabs>

              {
                countries.map((country, index) => (
                  <TabPanel key={country._id} value={tabValue} index={index}>
                    <LocationCarrousel
                      locations={country.locations!}
                      onSelect={(_location) => {
                        setLocation(_location._id)
                        setOpenLocationSearchFormDialog(true)
                      }}
                    />
                  </TabPanel>
                ))
              }
            </div>
          </div>
        )}

        <div className="home-map">
          <Map
            title={strings.MAP_TITLE}
            position={new L.LatLng(env.MAP_LATITUDE, env.MAP_LONGITUDE)}
            initialZoom={env.MAP_ZOOM}
            locations={locations}
            properties={homeListings}
            showTileToggle
            streetLabel={mapStrings.STREET}
            satelliteLabel={mapStrings.SATELLITE}
            onSelelectLocation={async (locationId) => {
              setLocation(locationId)
              setOpenLocationSearchFormDialog(true)
            }}
          />
        </div>

        <div className="customer-care">
          <div className="customer-care-wrapper">
            <div className="customer-care-text">
              <h1>{strings.CUSTOMER_CARE_TITLE}</h1>
              <h2>{strings.CUSTOMER_CARE_SUBTITLE}</h2>
              <div className="customer-care-content">{strings.CUSTOMER_CARE_TEXT}</div>
              <div className="customer-care-boxes">
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_ASSISTANCE}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_MODIFICATION}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_GUIDANCE}</span>
                </div>
                <div className="customer-care-box">
                  <CheckBox className="customer-care-icon" />
                  <span>{strings.CUSTOMER_CARE_SUPPORT}</span>
                </div>
              </div>
              <Button
                variant="contained"
                className="btn-primary btn-home"
                onClick={() => navigate('/contact')}
              >
                {strings.CONTACT_US}
              </Button>
            </div>

            <div className="customer-care-img">
              <img src="/customer-care.png" alt="" />
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <Dialog
        fullWidth={env.isMobile}
        maxWidth={false}
        open={openLocationSearchFormDialog}
        onClose={() => {
          setOpenLocationSearchFormDialog(false)
        }}
      >
        <DialogContent className="search-dialog-content">
          <SearchForm
            location={location}
            listingTypeOptions={[movininTypes.ListingType.Sale, movininTypes.ListingType.Rent]}
            defaultListingType={movininTypes.ListingType.Sale}
            requireLocation={false}
          // onCancel={() => {
          //   setOpenLocationSearchFormDialog(false)
          // }}
          />
        </DialogContent>
      </Dialog>

    </Layout>
  )
}

export default Home
