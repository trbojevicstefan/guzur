import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  FormControlLabel,
  FormGroup,
  FormLabel,
  TextField,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  RadioGroup,
  Radio,
  Switch,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import Layout from '@/components/Layout'
import ListingTypeSelect from '@/components/ListingTypeSelect'
import LocationSelectList from '@/components/LocationSelectList'
import MapPicker from '@/components/MapPicker'
import SimpleBackdrop from '@/components/SimpleBackdrop'
import { strings as listingStrings } from '@/lang/listing-form'
import { strings as dashboardStrings } from '@/lang/dashboard'
import { strings as commonStrings } from '@/lang/common'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import * as PropertyService from '@/services/PropertyService'
import * as SeoService from '@/services/SeoService'
import * as DevelopmentService from '@/services/DevelopmentService'

import '@/assets/css/listing-form.css'

const CreateListing = () => {
  const MAX_SECONDARY_IMAGES = 10
  const navigate = useNavigate()
  const [user, setUser] = useState<movininTypes.User>()
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState('')
  const [secondaryImages, setSecondaryImages] = useState<string[]>([])
  const [imageError, setImageError] = useState(false)
  const [description, setDescription] = useState('')
  const [descriptionError, setDescriptionError] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [useAiDescription, setUseAiDescription] = useState(false)
  const [aiDescriptionError, setAiDescriptionError] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoKeywords, setSeoKeywords] = useState<string[]>([])
  const [seoError, setSeoError] = useState(false)
  const [formError, setFormError] = useState(false)
  const [developmentError, setDevelopmentError] = useState(false)
  const [name, setName] = useState('')
  const [listingType, setListingType] = useState(movininTypes.ListingType.Both)
  const [propertyType, setPropertyType] = useState<movininTypes.PropertyType>(movininTypes.PropertyType.Apartment)
  const [developments, setDevelopments] = useState<movininTypes.Development[]>([])
  const [developmentId, setDevelopmentId] = useState('')
  const [location, setLocation] = useState<movininTypes.Option>()
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [kitchens, setKitchens] = useState('1')
  const [parkingSpaces, setParkingSpaces] = useState('0')
  const [petsAllowed, setPetsAllowed] = useState(false)
  const [furnished, setFurnished] = useState(false)
  const [aircon, setAircon] = useState(false)
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [rentalTerm, setRentalTerm] = useState(movininTypes.RentalTerm.Monthly)
  const [priceError, setPriceError] = useState(false)
  const [salePriceError, setSalePriceError] = useState(false)
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const secondaryImageInputRef = useRef<HTMLInputElement>(null)
  const reverseGeocodeTimerRef = useRef<number | null>(null)
  const cleanupOnUnmountRef = useRef(true)
  const tempMainImageRef = useRef('')
  const tempSecondaryImagesRef = useRef<string[]>([])

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
    if (![movininTypes.UserType.Broker, movininTypes.UserType.Owner, movininTypes.UserType.Developer].includes(currentUser.type as movininTypes.UserType)) {
      navigate('/dashboard')
      return
    }
    setUser(currentUser)
  }

  useEffect(() => {
    const fetchDevelopments = async () => {
      if (!user?._id || user.type !== movininTypes.UserType.Developer) {
        return
      }
      try {
        const orgId = typeof user.primaryOrg === 'string'
          ? user.primaryOrg
          : user.primaryOrg?._id
        const payload: movininTypes.GetDevelopmentsPayload = {
          developer: orgId ? undefined : (user._id as string),
          developerOrgs: orgId ? [orgId] : undefined,
        }
        const data = await DevelopmentService.getDevelopments(payload, 1, env.PAGE_SIZE)
        const rows = data?.[0]?.resultData ?? []
        setDevelopments(rows)
        setDevelopmentId((prev) => prev || (rows[0]?._id as string) || '')
      } catch (err) {
        helper.error(err)
      }
    }

    fetchDevelopments()
  }, [user])

  useEffect(() => () => {
    if (cleanupOnUnmountRef.current) {
      const tempImages = [tempMainImageRef.current, ...tempSecondaryImagesRef.current].filter(Boolean)
      if (tempImages.length > 0) {
        Promise.allSettled(tempImages.map((file) => PropertyService.deleteTempImage(file))).catch(() => undefined)
      }
    }
    if (reverseGeocodeTimerRef.current) {
      window.clearTimeout(reverseGeocodeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    tempMainImageRef.current = image
  }, [image])

  useEffect(() => {
    tempSecondaryImagesRef.current = secondaryImages
  }, [secondaryImages])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        return
      }
      const data = await response.json() as { display_name?: string }
      if (data.display_name) {
        setAddress(data.display_name)
      }
    } catch {
      // Swallow geocoding errors to keep the form responsive.
    }
  }

  const scheduleReverseGeocode = (lat: number, lng: number) => {
    if (reverseGeocodeTimerRef.current) {
      window.clearTimeout(reverseGeocodeTimerRef.current)
    }
    reverseGeocodeTimerRef.current = window.setTimeout(() => {
      reverseGeocode(lat, lng).catch(() => undefined)
    }, 350)
  }

  const handleUploadMain = async (file?: File | null) => {
    if (!file) {
      return
    }
    try {
      setLoading(true)
      if (image) {
        await PropertyService.deleteTempImage(image)
      }
      const filename = await PropertyService.uploadImage(file)
      setImage(filename)
      setImageError(false)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = ''
      }
    }
  }

  const handleUploadSecondary = async (files?: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    const remainingSlots = Math.max(0, MAX_SECONDARY_IMAGES - secondaryImages.length)
    if (remainingSlots === 0) {
      return
    }
    const selected = Array.from(files).slice(0, remainingSlots)
    try {
      setLoading(true)
      const uploaded = await Promise.all(selected.map((file) => PropertyService.uploadImage(file)))
      setSecondaryImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (secondaryImageInputRef.current) {
        secondaryImageInputRef.current.value = ''
      }
    }
  }

  const removeSecondaryImage = async (filename: string) => {
    try {
      setLoading(true)
      await PropertyService.deleteTempImage(filename)
      setSecondaryImages((prev) => prev.filter((img) => img !== filename))
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePropertyTypeChange = (event: SelectChangeEvent<string>) => {
    setPropertyType(event.target.value as movininTypes.PropertyType)
  }

  const handleRentalTermChange = (event: SelectChangeEvent<string>) => {
    setRentalTerm(event.target.value as movininTypes.RentalTerm)
  }

  const handleLocationChange = (locations: movininTypes.Option[]) => {
    setLocation(locations[0])
  }

  const handleMapPick = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6))
    setLongitude(lng.toFixed(6))
    scheduleReverseGeocode(lat, lng)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      const isRentListing = helper.selectionIncludesRent(listingType)
      const isSaleListing = helper.selectionIncludesSale(listingType)

      setFormError(false)
      setDevelopmentError(false)
      setPriceError(false)
      setSalePriceError(false)

      if (!image) {
        setImageError(true)
        return
      }

      if (!description) {
        setDescriptionError(true)
        return
      }

      if (useAiDescription && !aiDescription) {
        setAiDescriptionError(true)
        return
      }

      if (!seoTitle || !seoDescription) {
        setSeoError(true)
        return
      }

      if (isRentListing && !price) {
        setPriceError(true)
        return
      }

      if (isSaleListing && !salePrice) {
        setSalePriceError(true)
        return
      }

      if (!location || !location._id) {
        setFormError(true)
        return
      }

      if (!user?._id) {
        return
      }

      if (user.type === movininTypes.UserType.Developer && !developmentId) {
        setDevelopmentError(true)
        return
      }

      setLoading(true)

      const rentPrice = isRentListing ? Number(price) : Number(salePrice)
      const sale = isSaleListing ? Number(salePrice) : null

      const payload: movininTypes.CreatePropertyPayload = {
        name,
        agency: user._id as string,
        broker: user.type === movininTypes.UserType.Broker ? user._id as string : undefined,
        developer: user.type === movininTypes.UserType.Developer ? user._id as string : undefined,
        developmentId: user.type === movininTypes.UserType.Developer ? developmentId : undefined,
        owner: user.type === movininTypes.UserType.Owner ? user._id as string : undefined,
        type: propertyType,
        description,
        aiDescription: aiDescription || undefined,
        useAiDescription,
        image,
        images: secondaryImages,
        available: true,
        bedrooms: Number.parseInt(bedrooms, 10),
        bathrooms: Number.parseInt(bathrooms, 10),
        kitchens: Number.parseInt(kitchens || '0', 10),
        parkingSpaces: Number.parseInt(parkingSpaces || '0', 10),
        size: size ? Number(size) : undefined,
        petsAllowed,
        furnished,
        aircon,
        minimumAge: env.MINIMUM_AGE,
        location: location._id,
        address,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        price: rentPrice,
        salePrice: sale,
        hidden: false,
        cancellation: 0,
        rentalTerm,
        listingType,
        listingStatus: user.approved ? movininTypes.ListingStatus.Published : movininTypes.ListingStatus.PendingReview,
        seoTitle,
        seoDescription,
        seoKeywords,
        seoGeneratedAt: new Date(),
        blockOnPay: true,
      }

      const property = await PropertyService.create(payload)
      if (property && property._id) {
        cleanupOnUnmountRef.current = false
        if (user.type === movininTypes.UserType.Developer) {
          navigate('/dashboard')
        } else {
          navigate('/dashboard/listings')
        }
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout strict onLoad={onLoad}>
      <div className="listing-form">
        <form onSubmit={handleSubmit} className="listing-form-card">
          <h1>{listingStrings.HEADING}</h1>
          {user && !user.approved && (
            <div className="listing-form-note">
              {listingStrings.PENDING_REVIEW_NOTICE}
            </div>
          )}

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_BASIC}</h2>
            <div className="listing-grid">
          <FormControl fullWidth margin="dense">
            <InputLabel className="required">{listingStrings.NAME}</InputLabel>
            <Input
              type="text"
              required
              value={name}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <ListingTypeSelect
              label={listingStrings.LISTING_TYPE}
              required
              value={listingType}
              onChange={(value) => setListingType(value)}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel className="required">{listingStrings.PROPERTY_TYPE}</InputLabel>
            <Select
              value={propertyType}
              onChange={handlePropertyTypeChange}
              variant="standard"
              required
              fullWidth
            >
              {movininHelper.getAllPropertyTypes().map((type) => (
                <MenuItem key={type} value={type}>
                  {helper.getPropertyType(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {user?.type === movininTypes.UserType.Developer && (
            <FormControl fullWidth margin="dense">
              <InputLabel className="required">{listingStrings.DEVELOPMENT}</InputLabel>
              <Select
                value={developmentId}
                onChange={(event) => {
                  setDevelopmentId(event.target.value as string)
                  setDevelopmentError(false)
                }}
                variant="standard"
                required
                fullWidth
              >
                {developments.map((development) => (
                  <MenuItem key={development._id as string} value={development._id as string}>
                    {development.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error={developmentError}>
                {developmentError ? listingStrings.DEVELOPMENT_REQUIRED : ''}
              </FormHelperText>
              {developments.length === 0 && (
                <div className="dashboard-note">
                  {dashboardStrings.EMPTY_DEVELOPMENTS}{' '}
                  <Button
                    variant="outlined"
                    className="btn-margin-bottom"
                    onClick={() => navigate('/dashboard/developments/new')}
                  >
                    {dashboardStrings.CREATE_DEVELOPMENT}
                  </Button>
                </div>
              )}
            </FormControl>
          )}

          <FormControl fullWidth margin="dense">
            <LocationSelectList
              label={listingStrings.LOCATION}
              required
              variant="standard"
              onChange={handleLocationChange}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{listingStrings.ADDRESS}</InputLabel>
            <Input
              type="text"
              value={address}
              autoComplete="off"
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormControl>
            </div>
          </section>

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_MAP}</h2>
            <div className="listing-grid">
          <FormControl fullWidth margin="dense" className="listing-grid-full">
            <FormLabel>{listingStrings.LOCATION_ON_MAP}</FormLabel>
            <div className="listing-map-picker">
              <MapPicker
                latitude={latitude ? Number(latitude) : undefined}
                longitude={longitude ? Number(longitude) : undefined}
                onChange={handleMapPick}
                streetLabel={listingStrings.MAP_STYLE_STREET}
                satelliteLabel={listingStrings.MAP_STYLE_SATELLITE}
              />
            </div>
            <div className="listing-map-hint">{listingStrings.LOCATION_ON_MAP_HINT}</div>
          </FormControl>

          <div className="listing-coordinates listing-grid-full">
            <FormControl fullWidth margin="dense">
              <InputLabel>{listingStrings.LATITUDE}</InputLabel>
              <Input
                type="text"
                value={latitude}
                autoComplete="off"
                onChange={(e) => setLatitude(e.target.value)}
                inputProps={{ inputMode: 'decimal', pattern: '^-?\\d+(\\.\\d+)?$' }}
              />
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>{listingStrings.LONGITUDE}</InputLabel>
              <Input
                type="text"
                value={longitude}
                autoComplete="off"
                onChange={(e) => setLongitude(e.target.value)}
                inputProps={{ inputMode: 'decimal', pattern: '^-?\\d+(\\.\\d+)?$' }}
              />
            </FormControl>
          </div>
            </div>
          </section>

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_SPECS}</h2>
            <div className="listing-grid">
          <FormControl fullWidth margin="dense">
            <InputLabel className="required">{listingStrings.BEDROOMS}</InputLabel>
            <Input
              type="text"
              required
              value={bedrooms}
              autoComplete="off"
              onChange={(e) => setBedrooms(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d{1,2}$' }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel className="required">{listingStrings.BATHROOMS}</InputLabel>
            <Input
              type="text"
              required
              value={bathrooms}
              autoComplete="off"
              onChange={(e) => setBathrooms(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d{1,2}$' }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{`${listingStrings.SIZE} (${env.SIZE_UNIT})`}</InputLabel>
            <Input
              type="text"
              value={size}
              autoComplete="off"
              onChange={(e) => setSize(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d+(\\.\\d+)?$' }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{listingStrings.KITCHENS}</InputLabel>
            <Input
              type="text"
              value={kitchens}
              autoComplete="off"
              onChange={(e) => setKitchens(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d{1,2}$' }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{listingStrings.PARKING_SPACES}</InputLabel>
            <Input
              type="text"
              value={parkingSpaces}
              autoComplete="off"
              onChange={(e) => setParkingSpaces(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d{1,2}$' }}
            />
          </FormControl>

          <FormControl component="fieldset" margin="dense" className="listing-grid-full">
            <FormLabel>{listingStrings.AMENITIES}</FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={<Switch checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />}
                label={listingStrings.FURNISHED}
              />
              <FormControlLabel
                control={<Switch checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} />}
                label={listingStrings.PETS_ALLOWED}
              />
              <FormControlLabel
                control={<Switch checked={aircon} onChange={(e) => setAircon(e.target.checked)} />}
                label={listingStrings.AIRCON}
              />
            </FormGroup>
          </FormControl>
            </div>
          </section>

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_PRICING}</h2>
            <div className="listing-grid">
          <FormControl fullWidth margin="dense">
            <InputLabel className={helper.selectionIncludesRent(listingType) ? 'required' : ''}>
              {listingStrings.RENT_PRICE}
            </InputLabel>
            <Input
              type="text"
              disabled={!helper.selectionIncludesRent(listingType)}
              value={price}
              autoComplete="off"
              onChange={(e) => {
                setPrice(e.target.value)
                setPriceError(false)
              }}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d+(\\.\\d+)?$' }}
            />
            <FormHelperText error={priceError}>
              {priceError ? commonStrings.FIX_ERRORS : ''}
            </FormHelperText>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel className={helper.selectionIncludesSale(listingType) ? 'required' : ''}>
              {listingStrings.SALE_PRICE}
            </InputLabel>
            <Input
              type="text"
              disabled={!helper.selectionIncludesSale(listingType)}
              value={salePrice}
              autoComplete="off"
              onChange={(e) => {
                setSalePrice(e.target.value)
                setSalePriceError(false)
              }}
              inputProps={{ inputMode: 'numeric', pattern: '^\\d+(\\.\\d+)?$' }}
            />
            <FormHelperText error={salePriceError}>
              {salePriceError ? commonStrings.FIX_ERRORS : ''}
            </FormHelperText>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel className={helper.selectionIncludesRent(listingType) ? 'required' : ''}>
              {listingStrings.RENTAL_TERM}
            </InputLabel>
            <Select
              value={rentalTerm}
              onChange={handleRentalTermChange}
              variant="standard"
              required={helper.selectionIncludesRent(listingType)}
              disabled={!helper.selectionIncludesRent(listingType)}
              fullWidth
            >
              {movininHelper.getAllRentalTerms().map((term) => (
                <MenuItem key={term} value={term}>
                  {helper.rentalTerm(term)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
            </div>
          </section>

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_DESCRIPTION}</h2>
            <div className="listing-grid">
          <FormControl fullWidth margin="dense" className="listing-grid-full">
            <TextField
              label={listingStrings.DESCRIPTION}
              required
              multiline
              minRows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setDescriptionError(false)
              }}
              variant="standard"
            />
            <FormHelperText error={descriptionError}>
              {descriptionError ? listingStrings.DESCRIPTION_REQUIRED : ''}
            </FormHelperText>
          </FormControl>

          <FormControl fullWidth margin="dense" className="listing-grid-full">
            <TextField
              label={listingStrings.AI_DESCRIPTION}
              multiline
              minRows={4}
              value={aiDescription}
              variant="standard"
              disabled
            />
            <FormHelperText>
              {listingStrings.AI_DESCRIPTION_HINT}
            </FormHelperText>
          </FormControl>

          <FormControl component="fieldset" margin="dense">
            <FormLabel>{listingStrings.DESCRIPTION_SOURCE}</FormLabel>
            <RadioGroup
              row
              value={useAiDescription ? 'ai' : 'publisher'}
              onChange={(e) => {
                setUseAiDescription(e.target.value === 'ai')
                setAiDescriptionError(false)
              }}
            >
              <FormControlLabel value="publisher" control={<Radio />} label={listingStrings.PUBLISHER_DESCRIPTION} />
              <FormControlLabel value="ai" control={<Radio />} label={listingStrings.AI_DESCRIPTION_OPTION} />
            </RadioGroup>
            <FormHelperText error={aiDescriptionError}>
              {aiDescriptionError ? listingStrings.AI_DESCRIPTION_REQUIRED : ''}
            </FormHelperText>
          </FormControl>
            </div>
          </section>

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_MEDIA}</h2>
            <div className="listing-grid">
              <FormControl fullWidth margin="dense" className="listing-grid-full">
                <div className="file-upload">
                  <FormLabel className="required">{listingStrings.UPLOAD_MAIN_IMAGE}</FormLabel>
                  <input
                    ref={mainImageInputRef}
                    className="file-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadMain(e.target.files?.[0])}
                  />
                  <div className="file-upload-actions">
                    <Button variant="contained" className="btn-primary" onClick={() => mainImageInputRef.current?.click()}>
                      {listingStrings.CHOOSE_MAIN_IMAGE}
                    </Button>
                    {image && (
                      <span className="file-upload-name" title={image}>
                        {image}
                      </span>
                    )}
                  </div>
                  <div className="file-upload-meta">{listingStrings.MAIN_IMAGE_HINT}</div>
                  <FormHelperText error={imageError}>
                    {imageError ? listingStrings.IMAGE_REQUIRED : ''}
                  </FormHelperText>
                </div>
              </FormControl>

              <FormControl fullWidth margin="dense" className="listing-grid-full">
                <div className="file-upload">
                  <FormLabel>{listingStrings.UPLOAD_SECONDARY_IMAGES}</FormLabel>
                  <input
                    ref={secondaryImageInputRef}
                    className="file-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleUploadSecondary(e.target.files)}
                  />
                  <div className="file-upload-actions">
                    <Button
                      variant="outlined"
                      onClick={() => secondaryImageInputRef.current?.click()}
                      disabled={secondaryImages.length >= MAX_SECONDARY_IMAGES}
                    >
                      {listingStrings.ADD_SECONDARY_IMAGES}
                    </Button>
                    <span className="file-upload-meta">
                      {listingStrings.SECONDARY_IMAGE_LIMIT.replace('{count}', String(MAX_SECONDARY_IMAGES))}
                    </span>
                  </div>
                  {secondaryImages.length > 0 && (
                    <div className="file-upload-list">
                      {secondaryImages.map((img) => (
                        <div key={img} className="file-upload-item">
                          <span className="file-upload-name" title={img}>{img}</span>
                          <Button size="small" onClick={() => removeSecondaryImage(img)}>
                            {listingStrings.REMOVE_IMAGE}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
            </div>
          </section>

          <section className="listing-section">
            <h2 className="listing-section-title">{listingStrings.SECTION_SEO}</h2>
            <div className="listing-grid">
              <FormControl fullWidth margin="dense" className="listing-grid-full">
                <InputLabel className="required">{listingStrings.SEO_TITLE}</InputLabel>
                <Input type="text" value={seoTitle} disabled />
              </FormControl>

              <FormControl fullWidth margin="dense" className="listing-grid-full">
                <InputLabel className="required">{listingStrings.SEO_DESCRIPTION}</InputLabel>
                <Input type="text" value={seoDescription} disabled />
              </FormControl>

              <FormControl fullWidth margin="dense" className="listing-grid-full">
                <InputLabel>{listingStrings.SEO_KEYWORDS}</InputLabel>
                <Input type="text" value={seoKeywords.join(', ')} disabled />
              </FormControl>
            </div>

          <div className="listing-actions">
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={async () => {
                try {
                  setLoading(true)
                  setSeoError(false)
                  setAiDescriptionError(false)
                  const result = await SeoService.generate({
                    name,
                    type: propertyType,
                    description,
                    location: location?.name,
                    bedrooms: Number.parseInt(bedrooms, 10),
                    bathrooms: Number.parseInt(bathrooms, 10),
                    size: size ? Number(size) : undefined,
                    listingType,
                    price: price ? Number(price) : undefined,
                    salePrice: salePrice ? Number(salePrice) : null,
                    rentalTerm,
                    kitchens: Number.parseInt(kitchens || '0', 10),
                    parkingSpaces: Number.parseInt(parkingSpaces || '0', 10),
                    petsAllowed,
                    furnished,
                    aircon,
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
              }}
            >
              {listingStrings.GENERATE_SEO}
            </Button>
          </div>
          </section>

          <div className="listing-actions">
            <Button type="submit" variant="contained" className="btn-primary" size="small">
              {commonStrings.CREATE}
            </Button>
            <Button
              variant="contained"
              className="btn-secondary"
              size="small"
              onClick={async () => {
                try {
                  const tempImages = [image, ...secondaryImages].filter(Boolean)
                  if (tempImages.length > 0) {
                    await Promise.allSettled(tempImages.map((file) => PropertyService.deleteTempImage(file)))
                  }
                  cleanupOnUnmountRef.current = false
                } catch (err) {
                  helper.error(err)
                }
                navigate('/dashboard/listings')
              }}
            >
              {commonStrings.CANCEL}
            </Button>
          </div>

          <div className="listing-form-error">
            {seoError && <span>{listingStrings.SEO_REQUIRED}</span>}
            {formError && <span>{commonStrings.FIX_ERRORS}</span>}
          </div>
        </form>
      </div>
      {loading && <SimpleBackdrop text={commonStrings.LOADING} />}
    </Layout>
  )
}

export default CreateListing
