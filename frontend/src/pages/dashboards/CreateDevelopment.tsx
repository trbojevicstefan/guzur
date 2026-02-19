import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Input,
  InputLabel,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Switch,
  Button,
  TextField,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import Layout from '@/components/Layout'
import ListingTypeSelect from '@/components/ListingTypeSelect'
import LocationSelectList from '@/components/LocationSelectList'
import MapPicker from '@/components/MapPicker'
import SimpleBackdrop from '@/components/SimpleBackdrop'
import Error from '@/components/Error'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/create-development'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as PropertyService from '@/services/PropertyService'
import * as LocationService from '@/services/LocationService'
import * as SeoService from '@/services/SeoService'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

import '@/assets/css/listing-form.css'
import '@/assets/css/create-development.css'

type DevelopmentStep = 'basic' | 'media' | 'seo' | 'units' | 'review'

const STEPS: DevelopmentStep[] = ['basic', 'media', 'seo', 'units', 'review']

const CreateDevelopment = () => {
  const MAX_FLOOR_PLANS = 10
  const MAX_GALLERY_IMAGES = 10
  const navigate = useNavigate()
  const locationState = useLocation()
  const [activeStep, setActiveStep] = useState(0)
  const [user, setUser] = useState<movininTypes.User>()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<movininTypes.Option>()
  const [unitsCount, setUnitsCount] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [status, setStatus] = useState<movininTypes.DevelopmentStatus>(movininTypes.DevelopmentStatus.Planning)
  const [approved, setApproved] = useState(false)
  const [mainImage, setMainImage] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [masterPlan, setMasterPlan] = useState('')
  const [floorPlans, setFloorPlans] = useState<string[]>([])
  const [tempUploads, setTempUploads] = useState<string[]>([])
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [editingId, setEditingId] = useState<string | undefined>()
  const [useAiDescription, setUseAiDescription] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState<string[]>([])
  const [seoError, setSeoError] = useState(false)
  const [bulkUnitsEnabled, setBulkUnitsEnabled] = useState(false)
  const [bulkUnitsCount, setBulkUnitsCount] = useState('')
  const [bulkListingType, setBulkListingType] = useState<movininTypes.ListingType>(movininTypes.ListingType.Both)
  const [bulkPropertyType, setBulkPropertyType] = useState<movininTypes.PropertyType>(movininTypes.PropertyType.Apartment)
  const [bulkBedrooms, setBulkBedrooms] = useState('1')
  const [bulkBathrooms, setBulkBathrooms] = useState('1')
  const [bulkKitchens, setBulkKitchens] = useState('1')
  const [bulkParkingSpaces, setBulkParkingSpaces] = useState('0')
  const [bulkSize, setBulkSize] = useState('')
  const [bulkRentalTerm, setBulkRentalTerm] = useState<movininTypes.RentalTerm>(movininTypes.RentalTerm.Monthly)
  const [bulkRentPrice, setBulkRentPrice] = useState('')
  const [bulkSalePrice, setBulkSalePrice] = useState('')
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const galleryImagesInputRef = useRef<HTMLInputElement>(null)
  const masterPlanInputRef = useRef<HTMLInputElement>(null)
  const floorPlansInputRef = useRef<HTMLInputElement>(null)
  const cleanupOnUnmountRef = useRef(true)
  const tempUploadsRef = useRef<string[]>([])

  const toDateInputValue = (value?: Date | string) => {
    if (!value) {
      return ''
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const onLoad = (currentUser?: movininTypes.User) => {
    if (!currentUser) {
      navigate('/sign-in')
      return
    }
    const hasOrg = !!(currentUser.primaryOrg && (typeof currentUser.primaryOrg === 'string' || (currentUser.primaryOrg as movininTypes.Organization)?._id))
    if (!currentUser.onboardingCompleted && !hasOrg) {
      navigate('/onboarding')
      return
    }
    if (![movininTypes.UserType.Developer, movininTypes.UserType.Broker].includes(currentUser.type as movininTypes.UserType)) {
      navigate('/dashboard')
      return
    }
    setUser(currentUser)
  }

  useEffect(() => {
    const state = locationState.state as { developmentId?: string } | null
    if (state?.developmentId) {
      setEditingId(state.developmentId)
    }
  }, [locationState.state])

  useEffect(() => {
    const loadDevelopment = async () => {
      if (!editingId) {
        return
      }
      try {
        setLoading(true)
        const development = await DevelopmentService.getDevelopment(editingId)
        setName(development.name || '')
        setDescription(development.description || '')
        setAiDescription(development.aiDescription || '')
        setUseAiDescription(Boolean(development.useAiDescription))
        setSeoTitle(development.seoTitle || '')
        setSeoDescription(development.seoDescription || '')
        setSeoKeywords(development.seoKeywords || [])
        if (development.location) {
          try {
            const loc = await LocationService.getLocation(development.location)
            setLocation(loc)
          } catch {
            setLocation({ _id: development.location, name: development.location })
          }
        }
        setUnitsCount(development.unitsCount ? String(development.unitsCount) : '')
        setCompletionDate(toDateInputValue(development.completionDate))
        setStatus(development.status || movininTypes.DevelopmentStatus.Planning)
        setApproved(Boolean(development.approved))
        const images = development.images || []
        setMainImage(images[0] || '')
        setGalleryImages(images.slice(1))
        setMasterPlan(development.masterPlan || '')
        setFloorPlans(development.floorPlans || [])
        setLatitude(typeof development.latitude === 'number' ? development.latitude.toFixed(6) : '')
        setLongitude(typeof development.longitude === 'number' ? development.longitude.toFixed(6) : '')
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadDevelopment()
  }, [editingId])

  useEffect(() => () => {
    if (cleanupOnUnmountRef.current && tempUploadsRef.current.length > 0) {
      Promise.allSettled(tempUploadsRef.current.map((file) => PropertyService.deleteTempImage(file))).catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    tempUploadsRef.current = tempUploads
  }, [tempUploads])

  const stepLabels = useMemo(() => ([
    strings.STEP_BASIC,
    strings.STEP_MEDIA,
    strings.STEP_SEO,
    strings.STEP_UNITS,
    strings.STEP_REVIEW,
  ]), [])

  const activeStepKey = STEPS[activeStep]

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value as movininTypes.DevelopmentStatus)
  }

  const handleBulkPropertyTypeChange = (event: SelectChangeEvent<string>) => {
    setBulkPropertyType(event.target.value as movininTypes.PropertyType)
  }

  const handleBulkRentalTermChange = (event: SelectChangeEvent<string>) => {
    setBulkRentalTerm(event.target.value as movininTypes.RentalTerm)
  }

  const handleLocationChange = (locations: movininTypes.Option[]) => {
    setLocation(locations[0])
  }

  const handleMapPick = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6))
    setLongitude(lng.toFixed(6))
  }

  const normalizeImageName = (value?: string) => {
    if (!value) {
      return ''
    }
    const trimmed = value.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      return ''
    }
    return trimmed
  }

  const isImageAsset = (value?: string) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(value || '')

  const resolveImageSource = (value?: string) => {
    const imageName = normalizeImageName(value)
    if (!imageName) {
      return { src: '', fallbackSrc: '' }
    }
    if (imageName.startsWith('http')) {
      return { src: imageName, fallbackSrc: '' }
    }
    return {
      src: movininHelper.joinURL(env.CDN_PROPERTIES, imageName),
      fallbackSrc: movininHelper.joinURL(env.CDN_TEMP_PROPERTIES, imageName),
    }
  }

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const fallbackSrc = event.currentTarget.dataset.fallback
    if (fallbackSrc) {
      event.currentTarget.src = fallbackSrc
      event.currentTarget.removeAttribute('data-fallback')
      return
    }
    event.currentTarget.style.opacity = '0'
  }

  const trackTempUpload = (filename: string) => {
    setTempUploads((prev) => (prev.includes(filename) ? prev : [...prev, filename]))
  }

  const untrackTempUpload = (filename: string) => {
    setTempUploads((prev) => prev.filter((f) => f !== filename))
  }

  const handleUploadMainImage = async (file?: File | null) => {
    if (!file) {
      return
    }
    try {
      setLoading(true)
      if (mainImage && tempUploads.includes(mainImage)) {
        await PropertyService.deleteTempImage(mainImage)
        untrackTempUpload(mainImage)
      }
      const filename = await PropertyService.uploadImage(file)
      setMainImage(filename)
      trackTempUpload(filename)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = ''
      }
    }
  }

  const handleUploadGalleryImages = async (files?: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    const remaining = Math.max(0, MAX_GALLERY_IMAGES - galleryImages.length)
    if (remaining === 0) {
      return
    }
    const selected = Array.from(files).slice(0, remaining)
    try {
      setLoading(true)
      const uploaded = await Promise.all(selected.map((file) => PropertyService.uploadImage(file)))
      setGalleryImages((prev) => [...prev, ...uploaded])
      uploaded.forEach(trackTempUpload)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (galleryImagesInputRef.current) {
        galleryImagesInputRef.current.value = ''
      }
    }
  }

  const removeGalleryImage = async (filename: string) => {
    try {
      setLoading(true)
      if (tempUploads.includes(filename)) {
        await PropertyService.deleteTempImage(filename)
        untrackTempUpload(filename)
      }
      setGalleryImages((prev) => prev.filter((img) => img !== filename))
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadMasterPlan = async (file?: File | null) => {
    if (!file) {
      return
    }
    try {
      setLoading(true)
      if (masterPlan && tempUploads.includes(masterPlan)) {
        await PropertyService.deleteTempImage(masterPlan)
        untrackTempUpload(masterPlan)
      }
      const filename = await PropertyService.uploadImage(file)
      setMasterPlan(filename)
      trackTempUpload(filename)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (masterPlanInputRef.current) {
        masterPlanInputRef.current.value = ''
      }
    }
  }

  const removeMasterPlan = async () => {
    if (!masterPlan) {
      return
    }
    try {
      setLoading(true)
      if (tempUploads.includes(masterPlan)) {
        await PropertyService.deleteTempImage(masterPlan)
        untrackTempUpload(masterPlan)
      }
      setMasterPlan('')
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFloorPlans = async (files?: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    const remainingSlots = Math.max(0, MAX_FLOOR_PLANS - floorPlans.length)
    if (remainingSlots === 0) {
      return
    }
    const selected = Array.from(files).slice(0, remainingSlots)
    try {
      setLoading(true)
      const uploaded = await Promise.all(selected.map((file) => PropertyService.uploadImage(file)))
      setFloorPlans((prev) => [...prev, ...uploaded])
      uploaded.forEach(trackTempUpload)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (floorPlansInputRef.current) {
        floorPlansInputRef.current.value = ''
      }
    }
  }

  const removeFloorPlan = async (filename: string) => {
    try {
      setLoading(true)
      if (tempUploads.includes(filename)) {
        await PropertyService.deleteTempImage(filename)
        untrackTempUpload(filename)
      }
      setFloorPlans((prev) => prev.filter((f) => f !== filename))
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validateBaseProjectFields = () => {
    if (!user?._id || !name) {
      setFormErrorMessage(commonStrings.FIX_ERRORS)
      return false
    }
    if (!location?._id) {
      setFormErrorMessage(commonStrings.LOCATION)
      return false
    }
    if (!description) {
      setFormErrorMessage(strings.DESCRIPTION_REQUIRED)
      return false
    }
    if (!completionDate) {
      setFormErrorMessage(strings.COMPLETION_DATE_REQUIRED)
      return false
    }
    if (!mainImage) {
      setFormErrorMessage(strings.MAIN_IMAGE_REQUIRED)
      return false
    }
    if (galleryImages.length === 0) {
      setFormErrorMessage(strings.GALLERY_IMAGES_REQUIRED)
      return false
    }
    if (!masterPlan) {
      setFormErrorMessage(strings.MASTER_PLAN_REQUIRED)
      return false
    }
    if (floorPlans.length === 0) {
      setFormErrorMessage(strings.FLOOR_PLANS_REQUIRED)
      return false
    }
    if (!latitude || !longitude) {
      setFormErrorMessage(strings.MAP_REQUIRED)
      return false
    }
    if (!seoTitle || !seoDescription) {
      setSeoError(true)
      setFormErrorMessage(strings.SEO_REQUIRED)
      return false
    }
    return true
  }

  const validateBulkUnits = () => {
    if (!bulkUnitsEnabled) {
      return true
    }

    const count = Number.parseInt(bulkUnitsCount, 10)
    if (!Number.isFinite(count) || count <= 0) {
      setFormErrorMessage(strings.BULK_VALIDATION)
      return false
    }

    const includesRent = helper.selectionIncludesRent(bulkListingType)
    const includesSale = helper.selectionIncludesSale(bulkListingType)

    if (includesRent && !bulkRentPrice) {
      setFormErrorMessage(strings.BULK_VALIDATION)
      return false
    }
    if (includesSale && !bulkSalePrice) {
      setFormErrorMessage(strings.BULK_VALIDATION)
      return false
    }

    return true
  }

  const createBulkUnits = async (developmentId: string) => {
    if (!bulkUnitsEnabled || !location?._id) {
      return { success: 0, failed: 0 }
    }

    const count = Number.parseInt(bulkUnitsCount, 10)
    if (!Number.isFinite(count) || count <= 0) {
      return { success: 0, failed: 0 }
    }

    const includesRent = helper.selectionIncludesRent(bulkListingType)
    const includesSale = helper.selectionIncludesSale(bulkListingType)
    const rentPrice = includesRent
      ? Number(bulkRentPrice || '0')
      : Number(bulkSalePrice || '0')
    const salePrice = includesSale ? Number(bulkSalePrice || '0') : null

    let success = 0
    let failed = 0
    for (let index = 1; index <= count; index += 1) {
      const payload: movininTypes.CreatePropertyPayload = {
        name: `${name} - Unit ${index}`,
        agency: user?._id as string,
        broker: user?.type === movininTypes.UserType.Broker ? user._id as string : undefined,
        developer: user?.type === movininTypes.UserType.Developer ? user._id as string : undefined,
        developmentId,
        type: bulkPropertyType,
        description,
        aiDescription: aiDescription || undefined,
        useAiDescription,
        image: undefined,
        images: [],
        available: true,
        bedrooms: Number.parseInt(bulkBedrooms || '0', 10),
        bathrooms: Number.parseInt(bulkBathrooms || '0', 10),
        kitchens: Number.parseInt(bulkKitchens || '0', 10),
        parkingSpaces: Number.parseInt(bulkParkingSpaces || '0', 10),
        size: bulkSize ? Number(bulkSize) : undefined,
        petsAllowed: false,
        furnished: false,
        aircon: false,
        minimumAge: env.MINIMUM_AGE,
        location: location._id,
        address: '',
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
        price: rentPrice,
        salePrice,
        hidden: false,
        cancellation: 0,
        rentalTerm: bulkRentalTerm,
        listingType: bulkListingType,
        listingStatus: movininTypes.ListingStatus.Draft,
        blockOnPay: true,
      }

      try {
        await PropertyService.create(payload)
        success += 1
      } catch {
        failed += 1
      }
    }

    return { success, failed }
  }

  const handleGenerateSeo = async () => {
    try {
      setLoading(true)
      setSeoError(false)
      const result = await SeoService.generate({
        contextType: 'project',
        name,
        type: 'Project',
        description,
        location: location?.name,
        unitsCount: unitsCount ? Number.parseInt(unitsCount, 10) : undefined,
        developmentStatus: status,
        completionDate: completionDate ? new Date(`${completionDate}T00:00:00`).toISOString() : undefined,
      })
      setSeoTitle(result.seoTitle)
      setSeoDescription(result.seoDescription)
      setSeoKeywords(result.seoKeywords || [])
      setAiDescription(result.aiDescription || '')
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const goToStep = (step: number) => {
    const bounded = Math.max(0, Math.min(step, STEPS.length - 1))
    setActiveStep(bounded)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(false)
    setSeoError(false)
    setFormErrorMessage('')

    if (!validateBaseProjectFields() || !validateBulkUnits()) {
      setFormError(true)
      goToStep(0)
      return
    }

    try {
      setLoading(true)
      const payload: movininTypes.CreateDevelopmentPayload = {
        name,
        description,
        aiDescription: aiDescription || undefined,
        useAiDescription,
        seoTitle,
        seoDescription,
        seoKeywords,
        seoGeneratedAt: new Date(),
        location: location?._id,
        developer: user?._id as string,
        developerOrg: typeof user?.primaryOrg === 'string' ? user.primaryOrg : user?.primaryOrg?._id,
        unitsCount: unitsCount ? Number.parseInt(unitsCount, 10) : undefined,
        completionDate: completionDate ? new Date(`${completionDate}T00:00:00`) : undefined,
        status,
        approved,
        images: [mainImage, ...galleryImages],
        masterPlan: masterPlan || undefined,
        floorPlans,
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
      }

      const development = editingId
        ? await DevelopmentService.update({ ...payload, _id: editingId })
        : await DevelopmentService.create(payload)

      const developmentId = (development?._id || editingId || '') as string
      const bulkResult = await createBulkUnits(developmentId)

      if (bulkResult.success > 0 && bulkResult.failed === 0) {
        helper.info(strings.DRAFT_UNITS_CREATED.replace('{count}', String(bulkResult.success)))
      } else if (bulkResult.success > 0 && bulkResult.failed > 0) {
        helper.info(strings.DRAFT_UNITS_PARTIAL
          .replace('{ok}', String(bulkResult.success))
          .replace('{failed}', String(bulkResult.failed)))
      } else if (bulkResult.failed > 0) {
        helper.error(undefined, strings.DRAFT_UNITS_PARTIAL
          .replace('{ok}', String(bulkResult.success))
          .replace('{failed}', String(bulkResult.failed)))
      }

      cleanupOnUnmountRef.current = false
      setTempUploads([])

      if (bulkResult.success > 0 || bulkResult.failed > 0) {
        navigate(`/dashboard/listings?developmentId=${encodeURIComponent(developmentId)}&status=${movininTypes.ListingStatus.Draft}`)
        return
      }

      if (user?.type === movininTypes.UserType.Broker) {
        navigate('/dashboard/broker')
      } else {
        navigate('/dashboard/developer')
      }
    } catch (err) {
      helper.error(err)
      setFormError(true)
      setFormErrorMessage(commonStrings.FORM_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const mainImageSource = resolveImageSource(mainImage)
  const masterPlanSource = resolveImageSource(masterPlan)

  return (
    <Layout onLoad={onLoad} strict>
      <div className="listing-form development-form">
        <form onSubmit={onSubmit} className="listing-form-card development-form-card">
          <h1>{strings.TITLE}</h1>

          <div className="development-stepper">
            {stepLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === activeStep ? 'is-active' : ''}
                onClick={() => goToStep(index)}
              >
                <span>{index + 1}</span>
                {label}
              </button>
            ))}
          </div>

          {activeStepKey === 'basic' && (
            <section className="listing-section">
              <h2 className="listing-section-title">{strings.BASIC_DETAILS}</h2>
              <div className="listing-grid">
                <FormControl fullWidth margin="dense">
                  <InputLabel className="required">{strings.NAME}</InputLabel>
                  <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <InputLabel>{commonStrings.LOCATION}</InputLabel>
                  <LocationSelectList value={location as movininTypes.Location} onChange={handleLocationChange} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.UNITS}</InputLabel>
                  <Input type="number" value={unitsCount} onChange={(e) => setUnitsCount(e.target.value)} autoComplete="off" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    type="date"
                    label={strings.COMPLETION_DATE}
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.STATUS}</InputLabel>
                  <Select
                    value={status}
                    onChange={handleStatusChange}
                    variant="standard"
                    fullWidth
                  >
                    {(Object.values(movininTypes.DevelopmentStatus) as movininTypes.DevelopmentStatus[]).map((value) => (
                      <MenuItem key={value} value={value}>
                        {helper.getDevelopmentStatus(value)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <TextField
                    label={strings.DESCRIPTION}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    minRows={4}
                  />
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <FormLabel>{strings.LOCATION_ON_MAP}</FormLabel>
                  <div className="listing-map-picker">
                    <MapPicker
                      latitude={latitude ? Number(latitude) : undefined}
                      longitude={longitude ? Number(longitude) : undefined}
                      onChange={handleMapPick}
                    />
                  </div>
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.LATITUDE}</InputLabel>
                  <Input type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} autoComplete="off" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <InputLabel>{strings.LONGITUDE}</InputLabel>
                  <Input type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} autoComplete="off" />
                </FormControl>
              </div>
            </section>
          )}

          {activeStepKey === 'media' && (
            <section className="listing-section">
              <h2 className="listing-section-title">{strings.MEDIA_DETAILS}</h2>
              <div className="listing-grid">
                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <div className="file-upload">
                    <FormLabel>{strings.MAIN_IMAGE}</FormLabel>
                    <input
                      ref={mainImageInputRef}
                      className="file-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadMainImage(e.target.files?.[0])}
                    />
                    <div className="file-upload-actions">
                      <Button variant="outlined" onClick={() => mainImageInputRef.current?.click()}>
                        {strings.UPLOAD_MAIN_IMAGE}
                      </Button>
                    </div>
                    {mainImage && (
                      <div className="file-upload-preview file-upload-preview-main">
                        <img
                          src={mainImageSource.src}
                          data-fallback={mainImageSource.fallbackSrc || undefined}
                          onError={onImageError}
                          alt={strings.MAIN_IMAGE}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <div className="file-upload">
                    <FormLabel>{strings.GALLERY_IMAGES}</FormLabel>
                    <input
                      ref={galleryImagesInputRef}
                      className="file-upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleUploadGalleryImages(e.target.files)}
                    />
                    <div className="file-upload-actions">
                      <Button
                        variant="outlined"
                        onClick={() => galleryImagesInputRef.current?.click()}
                        disabled={galleryImages.length >= MAX_GALLERY_IMAGES}
                      >
                        {strings.UPLOAD_GALLERY_IMAGES}
                      </Button>
                      <span className="file-upload-meta">
                        {strings.GALLERY_LIMIT.replace('{count}', String(MAX_GALLERY_IMAGES))}
                      </span>
                    </div>
                    {galleryImages.length > 0 && (
                      <div className="development-upload-grid">
                        {galleryImages.map((img, index) => {
                          const source = resolveImageSource(img)
                          return (
                            <div key={img} className="development-upload-card">
                              <img
                                src={source.src}
                                data-fallback={source.fallbackSrc || undefined}
                                onError={onImageError}
                                alt={`${strings.GALLERY_IMAGES} ${index + 1}`}
                              />
                              <Button size="small" onClick={() => removeGalleryImage(img)}>
                                {strings.REMOVE}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <div className="file-upload">
                    <FormLabel>{strings.MASTER_PLAN_UPLOAD}</FormLabel>
                    <input
                      ref={masterPlanInputRef}
                      className="file-upload-input"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleUploadMasterPlan(e.target.files?.[0])}
                    />
                    <div className="file-upload-actions">
                      <Button variant="outlined" onClick={() => masterPlanInputRef.current?.click()}>
                        {strings.UPLOAD_MASTER_PLAN}
                      </Button>
                      {masterPlan && (
                        <Button size="small" onClick={removeMasterPlan}>
                          {strings.REMOVE}
                        </Button>
                      )}
                    </div>
                    {masterPlan && (
                      <div className="development-doc-card">
                        {isImageAsset(masterPlan) ? (
                          <img
                            src={masterPlanSource.src}
                            data-fallback={masterPlanSource.fallbackSrc || undefined}
                            onError={onImageError}
                            alt={strings.MASTER_PLAN}
                          />
                        ) : (
                          <div className="development-doc-badge">{strings.FILE_READY}</div>
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <div className="file-upload">
                    <FormLabel>{strings.FLOOR_PLANS_UPLOAD}</FormLabel>
                    <input
                      ref={floorPlansInputRef}
                      className="file-upload-input"
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={(e) => handleUploadFloorPlans(e.target.files)}
                    />
                    <div className="file-upload-actions">
                      <Button
                        variant="outlined"
                        onClick={() => floorPlansInputRef.current?.click()}
                        disabled={floorPlans.length >= MAX_FLOOR_PLANS}
                      >
                        {strings.UPLOAD_FLOOR_PLANS}
                      </Button>
                      <span className="file-upload-meta">
                        {strings.FLOOR_PLAN_LIMIT.replace('{count}', String(MAX_FLOOR_PLANS))}
                      </span>
                    </div>
                    {floorPlans.length > 0 && (
                      <>
                        <div className="development-upload-grid">
                          {floorPlans.map((plan, index) => {
                            const source = resolveImageSource(plan)
                            return (
                              <div key={plan} className="development-upload-card">
                                {isImageAsset(plan) ? (
                                  <img
                                    src={source.src}
                                    data-fallback={source.fallbackSrc || undefined}
                                    onError={onImageError}
                                    alt={`${strings.FLOOR_PLANS} ${index + 1}`}
                                  />
                                ) : (
                                  <div className="development-doc-badge">{strings.FILE_READY}</div>
                                )}
                                <div className="development-file-index">{`${strings.FLOOR_PLANS} ${index + 1}`}</div>
                                <Button size="small" onClick={() => removeFloorPlan(plan)}>
                                  {strings.REMOVE}
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                        <FormHelperText>{strings.TOTAL_FILES.replace('{count}', String(floorPlans.length))}</FormHelperText>
                      </>
                    )}
                  </div>
                </FormControl>
              </div>
            </section>
          )}

          {activeStepKey === 'seo' && (
            <section className="listing-section">
              <h2 className="listing-section-title">{strings.SEO_DETAILS}</h2>
              <div className="listing-grid">
                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={useAiDescription}
                        onChange={(e) => setUseAiDescription(e.target.checked)}
                      />
                    )}
                    label={strings.USE_AI_DESCRIPTION}
                  />
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <TextField
                    label={strings.SECTION_AI_DESCRIPTION}
                    multiline
                    minRows={5}
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                  />
                  <FormHelperText>{strings.AI_DESCRIPTION_HINT}</FormHelperText>
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <InputLabel className="required">{strings.SEO_TITLE}</InputLabel>
                  <Input type="text" value={seoTitle} disabled />
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <InputLabel className="required">{strings.SEO_DESCRIPTION}</InputLabel>
                  <Input type="text" value={seoDescription} disabled />
                </FormControl>

                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <InputLabel>{strings.SEO_KEYWORDS}</InputLabel>
                  <Input type="text" value={seoKeywords.join(', ')} disabled />
                </FormControl>

                <div className="listing-actions listing-grid-full">
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={handleGenerateSeo}
                  >
                    {strings.GENERATE_SEO}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {activeStepKey === 'units' && (
            <section className="listing-section">
              <h2 className="listing-section-title">{strings.UNIT_BULK_DETAILS}</h2>
              <div className="listing-grid">
                <FormControl fullWidth margin="dense" className="listing-grid-full">
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={bulkUnitsEnabled}
                        onChange={(e) => setBulkUnitsEnabled(e.target.checked)}
                      />
                    )}
                    label={strings.BULK_UNITS_ENABLE}
                  />
                </FormControl>

                {bulkUnitsEnabled && (
                  <>
                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_UNITS_COUNT}</InputLabel>
                      <Input type="number" value={bulkUnitsCount} onChange={(e) => setBulkUnitsCount(e.target.value)} autoComplete="off" />
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <ListingTypeSelect
                        label={strings.BULK_LISTING_TYPE}
                        required
                        value={bulkListingType}
                        onChange={(value) => setBulkListingType(value)}
                      />
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_PROPERTY_TYPE}</InputLabel>
                      <Select
                        value={bulkPropertyType}
                        onChange={handleBulkPropertyTypeChange}
                        variant="standard"
                        fullWidth
                      >
                        {movininHelper.getAllPropertyTypes().map((type) => (
                          <MenuItem key={type} value={type}>
                            {helper.getPropertyType(type)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_RENTAL_TERM}</InputLabel>
                      <Select
                        value={bulkRentalTerm}
                        onChange={handleBulkRentalTermChange}
                        variant="standard"
                        fullWidth
                      >
                        {(Object.values(movininTypes.RentalTerm) as movininTypes.RentalTerm[]).map((term) => (
                          <MenuItem key={term} value={term}>
                            {term}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_BEDROOMS}</InputLabel>
                      <Input type="number" value={bulkBedrooms} onChange={(e) => setBulkBedrooms(e.target.value)} autoComplete="off" />
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_BATHROOMS}</InputLabel>
                      <Input type="number" value={bulkBathrooms} onChange={(e) => setBulkBathrooms(e.target.value)} autoComplete="off" />
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_KITCHENS}</InputLabel>
                      <Input type="number" value={bulkKitchens} onChange={(e) => setBulkKitchens(e.target.value)} autoComplete="off" />
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{strings.BULK_PARKING}</InputLabel>
                      <Input type="number" value={bulkParkingSpaces} onChange={(e) => setBulkParkingSpaces(e.target.value)} autoComplete="off" />
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                      <InputLabel>{`${strings.BULK_SIZE} (${env.SIZE_UNIT})`}</InputLabel>
                      <Input type="number" value={bulkSize} onChange={(e) => setBulkSize(e.target.value)} autoComplete="off" />
                    </FormControl>

                    {helper.selectionIncludesRent(bulkListingType) && (
                      <FormControl fullWidth margin="dense">
                        <InputLabel>{strings.BULK_RENT_PRICE}</InputLabel>
                        <Input type="number" value={bulkRentPrice} onChange={(e) => setBulkRentPrice(e.target.value)} autoComplete="off" />
                      </FormControl>
                    )}

                    {helper.selectionIncludesSale(bulkListingType) && (
                      <FormControl fullWidth margin="dense">
                        <InputLabel>{strings.BULK_SALE_PRICE}</InputLabel>
                        <Input type="number" value={bulkSalePrice} onChange={(e) => setBulkSalePrice(e.target.value)} autoComplete="off" />
                      </FormControl>
                    )}

                    {bulkUnitsCount && (
                      <div className="development-bulk-summary listing-grid-full">
                        {strings.BULK_UNIT_SUMMARY.replace('{count}', bulkUnitsCount)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {activeStepKey === 'review' && (
            <section className="listing-section">
              <h2 className="listing-section-title">{strings.REVIEW_DETAILS}</h2>
              <div className="development-review-grid">
                <div>
                  <label>{strings.NAME}</label>
                  <strong>{name || '-'}</strong>
                </div>
                <div>
                  <label>{commonStrings.LOCATION}</label>
                  <strong>{location?.name || '-'}</strong>
                </div>
                <div>
                  <label>{strings.STATUS}</label>
                  <strong>{helper.getDevelopmentStatus(status) || '-'}</strong>
                </div>
                <div>
                  <label>{strings.UNITS}</label>
                  <strong>{unitsCount || '-'}</strong>
                </div>
                <div>
                  <label>{strings.COMPLETION_DATE}</label>
                  <strong>{completionDate || '-'}</strong>
                </div>
                <div>
                  <label>{strings.GALLERY_IMAGES}</label>
                  <strong>{galleryImages.length}</strong>
                </div>
                <div>
                  <label>{strings.FLOOR_PLANS}</label>
                  <strong>{floorPlans.length}</strong>
                </div>
                <div>
                  <label>{strings.SEO_TITLE}</label>
                  <strong>{seoTitle || '-'}</strong>
                </div>
              </div>
            </section>
          )}

          <div className="listing-actions development-step-actions">
            <Button type="button" variant="outlined" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 0}>
              {strings.BACK}
            </Button>
            {activeStep < STEPS.length - 1 ? (
              <Button type="button" variant="contained" className="btn-primary" onClick={() => goToStep(activeStep + 1)}>
                {strings.NEXT}
              </Button>
            ) : (
              <Button type="submit" variant="contained" className="btn-primary">
                {bulkUnitsEnabled ? strings.SAVE_AND_CREATE_UNITS : strings.SAVE_PROJECT}
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate(user?.type === movininTypes.UserType.Broker ? '/dashboard/broker' : '/dashboard/developer')}>
              {commonStrings.CANCEL}
            </Button>
          </div>

          {(seoError || formError) && (
            <div className="listing-form-error">
              {seoError && <span>{strings.SEO_REQUIRED}</span>}
            </div>
          )}
          {formError && <Error message={formErrorMessage || commonStrings.FORM_ERROR} />}
        </form>
      </div>
      {loading && <SimpleBackdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateDevelopment
