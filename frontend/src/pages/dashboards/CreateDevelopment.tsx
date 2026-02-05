import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  FormLabel,
  Button,
  TextField,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import LocationSelectList from '@/components/LocationSelectList'
import MapPicker from '@/components/MapPicker'
import SimpleBackdrop from '@/components/SimpleBackdrop'
import Error from '@/components/Error'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/create-development'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as PropertyService from '@/services/PropertyService'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/utils/helper'

import '@/assets/css/listing-form.css'

const CreateDevelopment = () => {
  const MAX_FLOOR_PLANS = 10
  const MAX_GALLERY_IMAGES = 10
  const navigate = useNavigate()
  const locationState = useLocation()
  const [user, setUser] = useState<movininTypes.User>()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<movininTypes.Option>()
  const [unitsCount, setUnitsCount] = useState('')
  const [status, setStatus] = useState<movininTypes.DevelopmentStatus>(movininTypes.DevelopmentStatus.Planning)
  const [mainImage, setMainImage] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [masterPlan, setMasterPlan] = useState('')
  const [floorPlans, setFloorPlans] = useState<string[]>([])
  const [tempUploads, setTempUploads] = useState<string[]>([])
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [editingId, setEditingId] = useState<string | undefined>()
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const galleryImagesInputRef = useRef<HTMLInputElement>(null)
  const masterPlanInputRef = useRef<HTMLInputElement>(null)
  const floorPlansInputRef = useRef<HTMLInputElement>(null)

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
    if (currentUser.type !== movininTypes.UserType.Developer) {
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
        if (development.location) {
          try {
            const loc = await LocationService.getLocation(development.location)
            setLocation(loc)
          } catch {
            setLocation({ _id: development.location, name: development.location })
          }
        }
        setUnitsCount(development.unitsCount ? String(development.unitsCount) : '')
        setStatus(development.status || movininTypes.DevelopmentStatus.Planning)
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

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value as movininTypes.DevelopmentStatus)
  }

  const handleLocationChange = (locations: movininTypes.Option[]) => {
    setLocation(locations[0])
  }

  useEffect(() => () => {
    if (tempUploads.length > 0) {
      Promise.allSettled(tempUploads.map((file) => PropertyService.deleteTempImage(file))).catch(() => undefined)
    }
  }, [tempUploads])

  const handleMapPick = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6))
    setLongitude(lng.toFixed(6))
  }

  const handleUploadMasterPlan = async (file?: File | null) => {
    if (!file) {
      return
    }
    try {
      setLoading(true)
      if (masterPlan) {
        await PropertyService.deleteTempImage(masterPlan)
        setTempUploads((prev) => prev.filter((f) => f !== masterPlan))
      }
      const filename = await PropertyService.uploadImage(file)
      setMasterPlan(filename)
      setTempUploads((prev) => [...prev, filename])
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      if (masterPlanInputRef.current) {
        masterPlanInputRef.current.value = ''
      }
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
      setTempUploads((prev) => [...prev, ...uploaded])
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
        setTempUploads((prev) => prev.filter((f) => f !== filename))
      }
      setFloorPlans((prev) => prev.filter((f) => f !== filename))
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      setFormError(false)
      setFormErrorMessage('')

      if (!user?._id || !name) {
        setFormError(true)
        setFormErrorMessage(commonStrings.FIX_ERRORS)
        return
      }
      if (!location?._id) {
        setFormError(true)
        setFormErrorMessage(commonStrings.LOCATION)
        return
      }
      if (!description) {
        setFormError(true)
        setFormErrorMessage(strings.DESCRIPTION_REQUIRED)
        return
      }
      if (!mainImage) {
        setFormError(true)
        setFormErrorMessage(strings.MAIN_IMAGE_REQUIRED)
        return
      }
      if (galleryImages.length === 0) {
        setFormError(true)
        setFormErrorMessage(strings.GALLERY_IMAGES_REQUIRED)
        return
      }
      if (!masterPlan) {
        setFormError(true)
        setFormErrorMessage(strings.MASTER_PLAN_REQUIRED)
        return
      }
      if (floorPlans.length === 0) {
        setFormError(true)
        setFormErrorMessage(strings.FLOOR_PLANS_REQUIRED)
        return
      }
      if (!latitude || !longitude) {
        setFormError(true)
        setFormErrorMessage(strings.MAP_REQUIRED)
        return
      }

      setLoading(true)

      const payload: movininTypes.CreateDevelopmentPayload = {
        name,
        description,
        location: location?._id,
        developer: user._id as string,
        developerOrg: typeof user.primaryOrg === 'string' ? user.primaryOrg : user.primaryOrg?._id,
        unitsCount: unitsCount ? Number.parseInt(unitsCount, 10) : undefined,
        status,
        approved: false,
        images: [mainImage, ...galleryImages],
        masterPlan: masterPlan || undefined,
        floorPlans,
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
      }

      if (editingId) {
        const updatePayload: movininTypes.UpdateDevelopmentPayload = {
          ...payload,
          _id: editingId,
        }
        await DevelopmentService.update(updatePayload)
      } else {
        await DevelopmentService.create(payload)
      }
      setTempUploads([])
      navigate('/dashboard/developer')
    } catch (err) {
      helper.error(err)
      setFormError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="listing-form">
        <form onSubmit={handleSubmit} className="listing-form-card">
          <h1>{strings.TITLE}</h1>
          <FormControl fullWidth margin="dense">
            <InputLabel className="required">{strings.NAME}</InputLabel>
            <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.LOCATION}</InputLabel>
            <LocationSelectList onChange={handleLocationChange} />
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>{strings.UNITS}</InputLabel>
            <Input type="number" value={unitsCount} onChange={(e) => setUnitsCount(e.target.value)} autoComplete="off" />
          </FormControl>
          <FormControl fullWidth margin="dense">
            <div className="file-upload">
              <FormLabel>{strings.MAIN_IMAGE}</FormLabel>
              <input
                ref={mainImageInputRef}
                className="file-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) {
                    return
                  }
                  setLoading(true)
                  PropertyService.uploadImage(file)
                    .then((filename) => {
                      if (mainImage) {
                        PropertyService.deleteTempImage(mainImage).catch(() => undefined)
                        setTempUploads((prev) => prev.filter((f) => f !== mainImage))
                      }
                      setMainImage(filename)
                      setTempUploads((prev) => [...prev, filename])
                    })
                    .catch(helper.error)
                    .finally(() => {
                      setLoading(false)
                      if (mainImageInputRef.current) {
                        mainImageInputRef.current.value = ''
                      }
                    })
                }}
              />
              <div className="file-upload-actions">
                <Button variant="outlined" onClick={() => mainImageInputRef.current?.click()}>
                  {strings.UPLOAD_MAIN_IMAGE}
                </Button>
                {mainImage && (
                  <span className="file-upload-name" title={mainImage}>{mainImage}</span>
                )}
              </div>
            </div>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <div className="file-upload">
              <FormLabel>{strings.GALLERY_IMAGES}</FormLabel>
              <input
                ref={galleryImagesInputRef}
                className="file-upload-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (!files || files.length === 0) {
                    return
                  }
                  const remaining = Math.max(0, MAX_GALLERY_IMAGES - galleryImages.length)
                  if (remaining === 0) {
                    return
                  }
                  const selected = Array.from(files).slice(0, remaining)
                  setLoading(true)
                  Promise.all(selected.map((file) => PropertyService.uploadImage(file)))
                    .then((uploaded) => {
                      setGalleryImages((prev) => [...prev, ...uploaded])
                      setTempUploads((prev) => [...prev, ...uploaded])
                    })
                    .catch(helper.error)
                    .finally(() => {
                      setLoading(false)
                      if (galleryImagesInputRef.current) {
                        galleryImagesInputRef.current.value = ''
                      }
                    })
                }}
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
                <div className="file-upload-list">
                  {galleryImages.map((img) => (
                    <div key={img} className="file-upload-item">
                      <span className="file-upload-name" title={img}>{img}</span>
                      <Button
                        size="small"
                        onClick={async () => {
                          setLoading(true)
                          if (tempUploads.includes(img)) {
                            await PropertyService.deleteTempImage(img)
                            setTempUploads((prev) => prev.filter((f) => f !== img))
                          }
                          setGalleryImages((prev) => prev.filter((f) => f !== img))
                          setLoading(false)
                        }}
                      >
                        {strings.REMOVE}
                      </Button>
                    </div>
                  ))}
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
                  <span className="file-upload-name" title={masterPlan}>{masterPlan}</span>
                )}
              </div>
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
                <div className="file-upload-list">
                  {floorPlans.map((plan) => (
                    <div key={plan} className="file-upload-item">
                      <span className="file-upload-name" title={plan}>{plan}</span>
                      <Button size="small" onClick={() => removeFloorPlan(plan)}>
                        {strings.REMOVE}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <FormHelperText>{strings.FLOOR_PLANS_HINT}</FormHelperText>
            </div>
          </FormControl>
          <FormControl fullWidth margin="dense">
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
          <FormControl fullWidth margin="dense">
            <InputLabel>{strings.STATUS}</InputLabel>
            <Select
              value={status}
              onChange={handleStatusChange}
              variant="standard"
              fullWidth
            >
              {Object.values(movininTypes.DevelopmentStatus).map((value) => (
                <MenuItem key={value} value={value}>
                  {helper.getDevelopmentStatus(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <TextField
              label={strings.DESCRIPTION}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
            />
          </FormControl>
          <div className="listing-actions">
            <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom">
              {commonStrings.SUBMIT_FOR_REVIEW}
            </Button>
            <Button variant="outlined" className="btn-margin-bottom" onClick={() => navigate('/dashboard/developer')}>
              {commonStrings.CANCEL}
            </Button>
          </div>
          {formError && <Error message={formErrorMessage || commonStrings.FORM_ERROR} />}
        </form>
      </div>
      {loading && <SimpleBackdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateDevelopment
