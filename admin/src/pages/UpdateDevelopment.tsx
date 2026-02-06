import React, { useEffect, useState } from 'react'
import {
  Input,
  InputLabel,
  FormControl,
  Button,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/developments'
import * as DevelopmentService from '@/services/DevelopmentService'
import * as helper from '@/utils/helper'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import LocationSelectList from '@/components/LocationSelectList'
import DeveloperSelectList from '@/components/DeveloperSelectList'
import DevelopmentStatusList from '@/components/DevelopmentStatusList'
import ImageEditor from '@/components/ImageEditor'

import '@/assets/css/create-development.css'

const UpdateDevelopment = () => {
  const navigate = useNavigate()
  const reactLocation = useLocation()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(false)
  const [developmentId, setDevelopmentId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<movininTypes.Option>()
  const [developer, setDeveloper] = useState<movininTypes.Option>()
  const [unitsCount, setUnitsCount] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [status, setStatus] = useState<movininTypes.DevelopmentStatus>()
  const [images, setImages] = useState<string[]>([])
  const [masterPlan, setMasterPlan] = useState('')
  const [floorPlans, setFloorPlans] = useState<string[]>([])
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [approved, setApproved] = useState(false)

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

  const onLoad = async () => {
    const { state } = reactLocation
    if (!state || !state.developmentId) {
      navigate('/developments')
      return
    }
    setDevelopmentId(state.developmentId)
    try {
      const dev = await DevelopmentService.getDevelopment(state.developmentId)
      if (!dev) {
        navigate('/developments')
        return
      }
      setName(dev.name || '')
      setDescription(dev.description || '')
      if (dev.location && typeof dev.location === 'object') {
        setLocation(dev.location as movininTypes.Option)
      }
      if (dev.developer && typeof dev.developer === 'object') {
        const _dev = dev.developer as movininTypes.User
        setDeveloper({ _id: _dev._id as string, name: _dev.fullName, image: _dev.avatar })
      } else if (dev.developer && typeof dev.developer === 'string') {
        setDeveloper({ _id: dev.developer })
      }
      setUnitsCount(dev.unitsCount ? String(dev.unitsCount) : '')
      setCompletionDate(toDateInputValue(dev.completionDate))
      setStatus(dev.status)
      setApproved(Boolean(dev.approved))
      setImages(dev.images || [])
      setMasterPlan(dev.masterPlan || '')
      setFloorPlans(dev.floorPlans || [])
      setLatitude(dev.latitude !== undefined ? String(dev.latitude) : '')
      setLongitude(dev.longitude !== undefined ? String(dev.longitude) : '')
      setVisible(true)
    } catch (err) {
      helper.error(err)
      navigate('/developments')
    }
  }

  useEffect(() => {
    onLoad()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      if (!developmentId || !name || !developer?._id || !completionDate) {
        setFormError(true)
        return
      }
      setLoading(true)
      const payload: movininTypes.UpdateDevelopmentPayload = {
        _id: developmentId,
        name,
        description,
        location: location?._id,
        developer: developer._id,
        unitsCount: unitsCount ? Number.parseInt(unitsCount, 10) : undefined,
        completionDate: completionDate ? new Date(`${completionDate}T00:00:00`) : undefined,
        status,
        approved,
        images,
        masterPlan: masterPlan || undefined,
        floorPlans,
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
      }
      const statusCode = await DevelopmentService.update(payload)
      if (statusCode === 200) {
        navigate('/developments')
      } else {
        setFormError(true)
      }
    } catch (err) {
      helper.error(err)
      setFormError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout strict>
      {visible && (
        <div className="create-development">
          <Paper className="development-form" elevation={10}>
            <h1 className="development-form-title">{commonStrings.UPDATE}</h1>
            <form onSubmit={handleSubmit}>
              <ImageEditor
                title={strings.DEVELOPMENTS}
                maxImages={10}
                images={images.map((filename) => ({ filename }))}
                onAdd={(img) => {
                  images.push(img.filename)
                  setImages(images)
                }}
                onDelete={(img) => {
                  images.splice(images.indexOf(img.filename), 1)
                  setImages(images)
                }}
                onImageViewerOpen={() => {
                  document.body.classList.add('stop-scrolling')
                }}
                onImageViewerClose={() => {
                  document.body.classList.remove('stop-scrolling')
                }}
              />
              <ImageEditor
                title={strings.MASTER_PLAN}
                image={masterPlan ? { filename: masterPlan } : undefined}
                onMainImageUpsert={(img) => {
                  setMasterPlan(img.filename)
                }}
              />
              <ImageEditor
                title={strings.FLOOR_PLANS}
                maxImages={10}
                images={floorPlans.map((filename) => ({ filename }))}
                onAdd={(img) => {
                  floorPlans.push(img.filename)
                  setFloorPlans(floorPlans)
                }}
                onDelete={(img) => {
                  floorPlans.splice(floorPlans.indexOf(img.filename), 1)
                  setFloorPlans(floorPlans)
                }}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{strings.NAME}</InputLabel>
                <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.DEVELOPER}</InputLabel>
                <DeveloperSelectList value={developer} onChange={(values) => setDeveloper(values[0])} />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{commonStrings.LOCATION}</InputLabel>
                <LocationSelectList value={location as movininTypes.Location} onChange={(values) => setLocation(values[0])} />
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
                <InputLabel>{strings.LATITUDE}</InputLabel>
                <Input type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} autoComplete="off" />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.LONGITUDE}</InputLabel>
                <Input type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} autoComplete="off" />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <DevelopmentStatusList label={strings.STATUS} value={status} onChange={setStatus} />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <TextField
                  label={commonStrings.INFO}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  minRows={3}
                />
              </FormControl>
              <FormControl fullWidth margin="dense" className="checkbox-fc">
                <FormControlLabel
                  control={(
                    <Switch
                      checked={approved}
                      onChange={(e) => setApproved(e.target.checked)}
                      color="primary"
                    />
                  )}
                  label={commonStrings.APPROVED}
                  className="checkbox-fcl"
                />
              </FormControl>
              <div className="buttons">
                <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom">
                  {commonStrings.UPDATE}
                </Button>
                <Button variant="outlined" className="btn-margin-bottom" onClick={() => navigate('/developments')}>
                  {commonStrings.CANCEL}
                </Button>
              </div>
              {formError && <Error message={commonStrings.FORM_ERROR} />}
            </form>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default UpdateDevelopment
