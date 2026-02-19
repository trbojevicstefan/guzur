import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, Button } from '@mui/material'
import {
  BedOutlined,
  BathtubOutlined,
  Straighten,
  DirectionsCarFilledOutlined,
  CheckBox,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import L from 'leaflet'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import { strings } from '@/lang/home'
import { strings as commonStrings } from '@/lang/common'
import * as CountryService from '@/services/CountryService'
import * as LocationService from '@/services/LocationService'
import * as PropertyService from '@/services/PropertyService'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import SearchForm from '@/components/SearchForm'
import Map from '@/components/Map'
import { strings as mapStrings } from '@/lang/map'
import Footer from '@/components/Footer'

import '@/assets/css/home.css'

gsap.registerPlugin(ScrollTrigger)
const DIFFERENT_STEP_COLORS = ['#d97d74', '#a8b69f', '#d4bc8d', '#9eb8cd', '#b8a9c9']

const Home = () => {
  const navigate = useNavigate()
  const language = UserService.getLanguage()

  const [countries, setCountries] = useState<movininTypes.CountryInfo[]>([])
  const [openLocationSearchFormDialog, setOpenLocationSearchFormDialog] = useState(false)
  const [locations, setLocations] = useState<movininTypes.Location[]>([])
  const [topLocations, setTopLocations] = useState<movininTypes.Location[]>([])
  const [location, setLocation] = useState('')
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [featuredListings, setFeaturedListings] = useState<movininTypes.Property[]>([])
  const [homeListings, setHomeListings] = useState<movininTypes.Property[]>([])
  const [projects, setProjects] = useState<movininTypes.Development[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [loadedListingImages, setLoadedListingImages] = useState<Record<string, boolean>>({})
  const [failedListingImages, setFailedListingImages] = useState<Record<string, boolean>>({})
  const [activeDifferentStep, setActiveDifferentStep] = useState(0)
  const featuredRowRef = useRef<HTMLDivElement | null>(null)
  const projectsRowRef = useRef<HTMLDivElement | null>(null)
  const differentSectionRef = useRef<HTMLElement | null>(null)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)

  const resolveImageName = useCallback((value?: string) => {
    if (!value) {
      return ''
    }
    const trimmed = value.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      return ''
    }
    return trimmed
  }, [])

  const getPropertyImageUrl = useCallback((property?: movininTypes.Property) => {
    if (!property) {
      return ''
    }
    const fallbackImageName = (property.images || [])
      .map(resolveImageName)
      .find((img) => img)
    const propertyImageName = resolveImageName(property.image) || fallbackImageName

    if (!propertyImageName) {
      return ''
    }

    return propertyImageName.startsWith('http')
      ? propertyImageName
      : movininHelper.joinURL(env.CDN_PROPERTIES, propertyImageName)
  }, [resolveImageName])

  const getDevelopmentImageUrl = useCallback((development?: movininTypes.Development) => {
    if (!development) {
      return ''
    }
    const candidates = [
      ...(development.images || []),
      development.masterPlan || '',
      ...(development.floorPlans || []),
    ]
      .map(resolveImageName)
      .filter((imageName) => imageName)

    const imageName = candidates[0]
    if (!imageName) {
      return ''
    }

    return imageName.startsWith('http')
      ? imageName
      : movininHelper.joinURL(env.CDN_PROPERTIES, imageName)
  }, [resolveImageName])

  const getLocationImageUrl = useCallback((loc?: movininTypes.Location) => {
    const imageName = resolveImageName(loc?.image)
    if (!imageName) {
      return ''
    }
    return imageName.startsWith('http')
      ? imageName
      : movininHelper.joinURL(env.CDN_LOCATIONS, imageName)
  }, [resolveImageName])

  const getDeveloperLogoUrl = useCallback((developer?: movininTypes.User | string) => {
    if (!developer || typeof developer === 'string') {
      return ''
    }
    const imageName = resolveImageName(developer.avatar)
    if (!imageName) {
      return ''
    }
    return imageName.startsWith('http')
      ? imageName
      : movininHelper.joinURL(env.CDN_USERS, imageName)
  }, [resolveImageName])

  const getProjectDeveloperInfo = useCallback((project?: movininTypes.Development) => {
    const developer = project?.developer
    if (!developer || typeof developer === 'string') {
      return { name: '-', logoUrl: '' }
    }

    const name = developer.company || developer.fullName || developer.email || '-'
    const logoUrl = getDeveloperLogoUrl(developer)
    return { name, logoUrl }
  }, [getDeveloperLogoUrl])

  const getProjectLocationLabel = useCallback((project?: movininTypes.Development) => {
    const value = project?.location as unknown
    if (typeof value === 'string') {
      const normalized = value.trim()
      return normalized || '-'
    }
    if (value && typeof value === 'object' && 'name' in value) {
      const name = (value as { name?: string }).name
      if (name) {
        return name
      }
    }
    return '-'
  }, [])

  const getProjectCompletionLabel = useCallback((project?: movininTypes.Development) => {
    if (!project?.completionDate) {
      return '-'
    }
    const date = new Date(project.completionDate)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }
    return date.toLocaleDateString(language, { month: 'short', year: 'numeric' })
  }, [language])

  const marketsCount = countries.length > 0 ? countries.length : locations.length
  const differentStats = [
    {
      label: strings.FEATURED_TITLE,
      value: `${movininHelper.formatNumber(featuredListings.length, language)}+`,
    },
    {
      label: strings.LISTINGS_TITLE,
      value: `${movininHelper.formatNumber(homeListings.length, language)}+`,
    },
    {
      label: strings.DESTINATIONS_TITLE,
      value: `${movininHelper.formatNumber(marketsCount, language)}+`,
    },
  ]

  const featuredImageSource = featuredListings.length > 0 ? featuredListings : homeListings
  const differentStepImages = useMemo(() => Array.from({ length: 5 }, (_, index) => (
    getPropertyImageUrl(featuredImageSource[index])
    || getPropertyImageUrl(homeListings[index])
    || '/hero.jpeg'
  )), [featuredImageSource, homeListings, getPropertyImageUrl])
  const differentSteps = useMemo(() => ([
    {
      id: 'selection',
      color: DIFFERENT_STEP_COLORS[0],
      tag: strings.SERVICES_FLEET_TITLE,
      title: strings.SERVICES_FLEET_TITLE,
      description: strings.SERVICES_FLEET,
      image: differentStepImages[0],
    },
    {
      id: 'availability',
      color: DIFFERENT_STEP_COLORS[1],
      tag: strings.SERVICES_FLEXIBLE_TITLE,
      title: strings.SERVICES_FLEXIBLE_TITLE,
      description: strings.SERVICES_FLEXIBLE,
      image: differentStepImages[1],
    },
    {
      id: 'value',
      color: DIFFERENT_STEP_COLORS[2],
      tag: strings.SERVICES_PRICES_TITLE,
      title: strings.SERVICES_PRICES_TITLE,
      description: strings.SERVICES_PRICES,
      image: differentStepImages[2],
    },
    {
      id: 'process',
      color: DIFFERENT_STEP_COLORS[3],
      tag: strings.SERVICES_BOOKING_ONLINE_TITLE,
      title: strings.SERVICES_BOOKING_ONLINE_TITLE,
      description: strings.SERVICES_BOOKING_ONLINE,
      image: differentStepImages[3],
    },
    {
      id: 'commitment',
      color: DIFFERENT_STEP_COLORS[4],
      tag: strings.SERVICE_INSTANT_BOOKING_TITLE,
      title: strings.SERVICE_INSTANT_BOOKING_TITLE,
      description: strings.SERVICE_INSTANT_BOOKING,
      image: differentStepImages[4],
    },
  ]), [differentStepImages])
  const activeStepColor = differentSteps[activeDifferentStep]?.color || DIFFERENT_STEP_COLORS[0]
  const nextStepColor = differentSteps[(activeDifferentStep + 1) % differentSteps.length]?.color || DIFFERENT_STEP_COLORS[1]
  const differentStyle = {
    '--home-different-accent': activeStepColor,
    '--home-different-secondary': nextStepColor,
  } as React.CSSProperties

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
      const data = await LocationService.getLocations('', 1, 500)
      const rows = data?.[0]?.resultData ?? []
      setTopLocations(Array.isArray(rows) ? rows : [])
    } catch {
      setTopLocations([])
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
    }

    try {
      const data = await DevelopmentService.getFrontendDevelopments({}, 1, 12)
      const rows = data?.[0]?.resultData ?? []
      setProjects(Array.isArray(rows) ? rows : [])
    } catch {
      setProjects([])
    } finally {
      setListingsLoading(false)
    }
  }

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video || videoEnded) {
      return undefined
    }

    const tryPlay = () => {
      video.play().catch(() => {
        // Keep fallback still if autoplay is blocked.
      })
    }

    if (video.readyState >= 2) {
      tryPlay()
      return undefined
    }

    video.addEventListener('canplay', tryPlay, { once: true })
    return () => {
      video.removeEventListener('canplay', tryPlay)
    }
  }, [videoEnded])

  useLayoutEffect(() => {
    const section = differentSectionRef.current
    if (!section) {
      return undefined
    }

    const stepNodes = Array.from(section.querySelectorAll<HTMLDivElement>('.home-different-step'))
    const imageNodes = Array.from(section.querySelectorAll<HTMLImageElement>('.home-different-frame img'))
    const ringNodes = Array.from(section.querySelectorAll<HTMLDivElement>('.home-different-ring'))
    const bubbleNodes = Array.from(section.querySelectorAll<HTMLDivElement>('.home-different-bubble'))
    const frameNode = section.querySelector<HTMLDivElement>('.home-different-frame')
    const glowNode = section.querySelector<HTMLDivElement>('.home-different-glow')
    const totalSteps = differentSteps.length

    if (stepNodes.length === 0 || imageNodes.length === 0 || totalSteps === 0) {
      return undefined
    }

    gsap.set(stepNodes, { autoAlpha: 0, y: 40 })
    gsap.set(imageNodes, { autoAlpha: 0, scale: 1.14 })
    gsap.set(bubbleNodes, { autoAlpha: 0, y: 20, scale: 0.88 })
    gsap.set(stepNodes[0], { autoAlpha: 1, y: 0 })
    gsap.set(imageNodes[0], { autoAlpha: 1, scale: 1 })

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let refreshHandle = 0
    const ctx = gsap.context(() => {
      const ringBaseOpacity = [0.12, 0.2, 0.42, 0.62]

      if (prefersReducedMotion) {
        gsap.set(bubbleNodes, { autoAlpha: 1, y: 0, scale: 1 })
      } else {
        const ringMeta = ringNodes.map((ring, index) => ({
          ring,
          baseOpacity: ringBaseOpacity[index] || 0.22,
        }))
        const waveOrder = [...ringMeta].reverse()

        ringMeta.forEach(({ ring, baseOpacity }) => {
          gsap.set(ring, {
            scale: 1,
            opacity: baseOpacity,
            transformOrigin: '50% 50%',
          })
        })

        const waveTimeline = gsap.timeline({
          repeat: -1,
          defaults: { ease: 'sine.inOut' },
        })
        waveOrder.forEach(({ ring, baseOpacity }, waveIndex) => {
          const peakScale = 1.12 - (waveIndex * 0.02)
          const peakOpacity = Math.min(baseOpacity + 0.28, 0.86)
          const startAt = waveIndex * 0.14

          waveTimeline.to(ring, {
            scale: peakScale,
            opacity: peakOpacity,
            duration: 0.3,
            ease: 'sine.out',
          }, startAt)
          waveTimeline.to(ring, {
            scale: 1,
            opacity: baseOpacity,
            duration: 1.05,
            ease: 'sine.inOut',
          }, startAt + 0.3)
        })
        waveTimeline.to({}, { duration: 0.2 })

        if (glowNode) {
          gsap.to(glowNode, {
            scale: 1.18,
            opacity: 0.34,
            duration: 0.62,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
            transformOrigin: '50% 50%',
          })
        }

        if (frameNode) {
          gsap.to(frameNode, {
            y: -14,
            duration: 3.4,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          })
        }
  
        gsap.to(bubbleNodes, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
        })
        bubbleNodes.forEach((bubble, index) => {
          gsap.to(bubble, {
            y: -(8 + (index * 2)),
            duration: 2.4 + (index * 0.3),
            repeat: -1,
            yoyo: true,
            delay: 0.65 + (index * 0.12),
            ease: 'sine.inOut',
          })
        })
      }

      const animateStep = (index: number) => {
        setActiveDifferentStep((prev) => (prev === index ? prev : index))
        const activeColor = differentSteps[index]?.color || DIFFERENT_STEP_COLORS[0]
        const nextColor = differentSteps[(index + 1) % totalSteps]?.color || DIFFERENT_STEP_COLORS[1]

        gsap.to(section, {
          '--home-different-accent': activeColor,
          '--home-different-secondary': nextColor,
          duration: 0.7,
          ease: 'power2.out',
          overwrite: 'auto',
        })
        gsap.to(ringNodes, {
          borderColor: activeColor,
          duration: 0.7,
          stagger: 0.03,
          ease: 'power2.out',
          overwrite: 'auto',
        })

        stepNodes.forEach((stepNode, stepIndex) => {
          gsap.to(stepNode, {
            autoAlpha: stepIndex === index ? 1 : 0,
            y: stepIndex === index ? 0 : 40,
            x: stepIndex === index ? 0 : -10,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        })

        imageNodes.forEach((imageNode, imageIndex) => {
          gsap.to(imageNode, {
            autoAlpha: imageIndex === index ? 1 : 0,
            scale: imageIndex === index ? 1 : 1.14,
            duration: 0.8,
            ease: 'power3.out',
            overwrite: 'auto',
          })
        })
      }

      let currentStep = 0
      animateStep(0)

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        // Use a 1s catch-up for smoother, less robotic scroll-linked motion.
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const nextStep = Math.min(totalSteps - 1, Math.floor(self.progress * totalSteps))
          if (nextStep !== currentStep) {
            currentStep = nextStep
            animateStep(nextStep)
          }
        },
      })
    }, section)
    refreshHandle = window.requestAnimationFrame(() => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    })

    return () => {
      if (refreshHandle) {
        window.cancelAnimationFrame(refreshHandle)
      }
      ctx.revert()
    }
  }, [differentSteps])

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
    const propertyImageUrl = getPropertyImageUrl(property)
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
          <div className="home-listing-amenities">
            {property.bedrooms ? (
              <span className="home-listing-amenity">
                <BedOutlined fontSize="inherit" />
                {property.bedrooms}
              </span>
            ) : null}
            {property.bathrooms ? (
              <span className="home-listing-amenity">
                <BathtubOutlined fontSize="inherit" />
                {property.bathrooms}
              </span>
            ) : null}
            {property.size ? (
              <span className="home-listing-amenity">
                <Straighten fontSize="inherit" />
                {`${movininHelper.formatNumber(property.size, language)} ${env.SIZE_UNIT}`}
              </span>
            ) : null}
            {property.parkingSpaces ? (
              <span className="home-listing-amenity">
                <DirectionsCarFilledOutlined fontSize="inherit" />
                {property.parkingSpaces}
              </span>
            ) : null}
          </div>
          <div className="home-listing-meta">
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

  const renderProjectCard = (project: movininTypes.Development) => {
    const imageUrl = getDevelopmentImageUrl(project)
    const { name: developerName, logoUrl: developerLogoUrl } = getProjectDeveloperInfo(project)
    const locationLabel = getProjectLocationLabel(project)
    const completionLabel = getProjectCompletionLabel(project)
    const unitsLabel = typeof project.unitsCount === 'number'
      ? movininHelper.formatNumber(project.unitsCount, language)
      : '-'
    const developerInitial = developerName && developerName !== '-'
      ? developerName.charAt(0).toUpperCase()
      : 'D'

    return (
      <div key={project._id} className="home-project-card">
        <button
          type="button"
          className="home-project-image"
          onClick={() => {
            if (project._id) {
              navigate(`/projects/${project._id}`)
            }
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={project.name} loading="lazy" />
          ) : (
            <div className="home-project-placeholder">{project.name?.charAt(0) || 'P'}</div>
          )}
        </button>
        <div className="home-project-body">
          <h3>{project.name}</h3>
          <div className="home-project-developer">
            <span className="home-project-developer-logo" aria-hidden>
              {developerLogoUrl ? (
                <img src={developerLogoUrl} alt={developerName} loading="lazy" />
              ) : (
                <span>{developerInitial}</span>
              )}
            </span>
            <span className="home-project-developer-name">{developerName}</span>
          </div>
          <div className="home-project-details">
            <div className="home-project-detail-item home-project-detail-item-wide">
              <span>{strings.PROJECT_LOCATION_LABEL}</span>
              <strong>{locationLabel}</strong>
            </div>
            <div className="home-project-detail-item">
              <span>{strings.PROJECT_COMPLETION_LABEL}</span>
              <strong>{completionLabel}</strong>
            </div>
            <div className="home-project-detail-item">
              <span>{strings.PROJECT_UNITS_LABEL}</span>
              <strong>{unitsLabel}</strong>
            </div>
          </div>
          <button
            type="button"
            className="home-project-link"
            onClick={() => {
              if (project._id) {
                navigate(`/projects/${project._id}`)
              }
            }}
          >
            View Project
          </button>
        </div>
      </div>
    )
  }

  const renderProjectsRow = (rows: movininTypes.Development[], ref: React.RefObject<HTMLDivElement | null>) => (
    <div className="home-listings-row-wrapper">
      <button
        type="button"
        className="home-listings-nav prev"
        onClick={() => scrollRow(ref, 'left')}
        aria-label="Scroll left"
      >
        <ChevronLeft />
      </button>
      <div className="home-listings-row home-projects-row" ref={ref}>
        {rows.length > 0 ? rows.map(renderProjectCard) : (
          <div className="home-projects-empty">{commonStrings.NO_DATA}</div>
        )}
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

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="home">

        <div className="home-content">

          <div className="video">
            <video
              id="cover"
              ref={heroVideoRef}
              className={`home-hero-video${videoLoaded ? ' is-loaded' : ''}${videoEnded ? ' is-ended' : ''}`}
              muted
              autoPlay
              playsInline
              preload="auto"
              poster="/hero.jpeg"
              disablePictureInPicture
              onCanPlay={() => {
                heroVideoRef.current?.play().catch(() => {
                  // Keep poster/fallback visible if autoplay is blocked.
                })
              }}
              onPlaying={() => {
                setVideoLoaded(true)
              }}
              onLoadedData={() => {
                setVideoLoaded(true)
                heroVideoRef.current?.play().catch(() => {
                  // Keep poster/fallback visible if autoplay is blocked.
                })
              }}
              onEnded={() => {
                setVideoEnded(true)
              }}
              onError={() => {
                setVideoLoaded(true)
                setVideoEnded(true)
              }}
            >
              <source src="/hero2.mp4" type="video/mp4" />
              <source src="/hero2.original.mp4" type="video/mp4" />
              <track kind="captions" />
            </video>

            <div
              className={`video-background video-background-parallax${videoEnded ? ' is-active' : ''}`}
            >
              <div
                className="video-parallax-layer video-parallax-base"
                style={{ backgroundImage: "url('/hero-lastframe.png')" }}
              />
            </div>

            {!videoLoaded && (
              <div
                className="video-background"
                style={{
                  backgroundImage: "url('/hero.jpeg')",
                }}
              />
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

        <div className="home-listings featured-listings">
          <h1 className="home-section-title home-section-title-featured">{strings.FEATURED_TITLE}</h1>
          {listingsLoading ? (
            renderListingsSkeletonRow(6)
          ) : (
            renderListingsRow(featuredListings, featuredRowRef)
          )}
        </div>

        <div className="home-listings all-listings home-projects">
          <h1 className="home-section-title home-section-title-left">{strings.PROJECTS_TITLE}</h1>
          {listingsLoading ? (
            renderListingsSkeletonRow(8)
          ) : (
            renderProjectsRow(projects, projectsRowRef)
          )}
        </div>

        <div className="home-listings top-locations">
          <h1 className="home-section-title home-section-title-left">{strings.TOP_LOCATIONS_TITLE}</h1>
          <div className="home-top-locations-meta">
            {`${movininHelper.formatNumber(topLocations.length, language)} Results Available`}
          </div>
          <div className="home-top-locations-grid">
            {topLocations.slice(0, 6).map((_location) => {
              const locationImageUrl = getLocationImageUrl(_location)
              return (
                <button
                  key={_location._id}
                  type="button"
                  className="home-top-location-item"
                  onClick={() => {
                    setLocation(_location._id)
                    setOpenLocationSearchFormDialog(true)
                  }}
                >
                  <span className="home-top-location-image">
                    {locationImageUrl ? (
                      <img src={locationImageUrl} alt={_location.name} loading="lazy" />
                    ) : (
                      <span className="home-top-location-placeholder">{_location.name?.charAt(0) || 'L'}</span>
                    )}
                  </span>
                  <span className="home-top-location-name">{_location.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="home-listings home-intent-strip" aria-label={strings.HOME_INTENT_SECTION_LABEL}>
          <button
            type="button"
            className="home-intent-card home-intent-card-sell"
            onClick={() => {
              navigate('/sign-up/role')
            }}
          >
            <span className="home-intent-card-deco" aria-hidden />
            <span className="home-intent-card-title">{strings.SELL_NOW_TITLE}</span>
            <span className="home-intent-card-text">{strings.SELL_NOW_TEXT}</span>
            <span className="home-intent-card-link">{strings.LEARN_MORE}</span>
          </button>

          <button
            type="button"
            className="home-intent-card home-intent-card-buy"
            onClick={() => {
              navigate('/search')
            }}
          >
            <span className="home-intent-card-deco" aria-hidden />
            <span className="home-intent-card-title">{strings.BUY_HOME_TITLE}</span>
            <span className="home-intent-card-text">{strings.BUY_HOME_TEXT}</span>
            <span className="home-intent-card-link">{strings.LEARN_MORE}</span>
          </button>
        </div>

        <div className="services">
          <section className="home-different-section" style={differentStyle} ref={differentSectionRef}>
            <div className="home-different-sticky">
              <div className="home-different-orb home-different-orb-one" />
              <div className="home-different-orb home-different-orb-two" />

              <div className="home-different-grid">
                <div className="home-different-copy">
                  <div className="home-different-heading">
                    <h1>{strings.SERVICES_TITLE}</h1>
                  </div>
                  <div className="home-different-text">
                    {differentSteps.map((step) => (
                      <div
                        key={step.id}
                        className="home-different-step"
                      >
                        <span className="home-different-tag" style={{ color: step.color }}>
                          {step.tag}
                        </span>
                        <h2>{step.title}</h2>
                        <p>{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="home-different-visual">
                  <div className="home-different-glow" />

                  <div className="home-different-ring-container">
                    <div className="home-different-ring home-different-ring-1" />
                    <div className="home-different-ring home-different-ring-2" />
                    <div className="home-different-ring home-different-ring-3" />
                    <div className="home-different-ring home-different-ring-4" />
                  </div>

                  <div className="home-different-frame">
                    {differentSteps.map((step) => (
                      <img
                        key={`${step.id}-image`}
                        src={step.image}
                        alt={step.title}
                        loading="lazy"
                      />
                    ))}
                  </div>

                  <div className="home-different-bubbles">
                    {differentStats.map((stat, index) => (
                      <div
                        key={`${stat.label}-${index}`}
                        className={`home-different-bubble home-different-bubble-${index + 1}`}
                      >
                        <span className="label">{stat.label}</span>
                        <span className="value">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          </div>

        <div className="home-map">
          <Map
            position={new L.LatLng(env.MAP_LATITUDE, env.MAP_LONGITUDE)}
            initialZoom={env.MAP_ZOOM}
            locations={locations}
            properties={homeListings}
            showTileToggle
            clickToActivate
            activationTheme="home-different"
            lockOnMouseLeave
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
