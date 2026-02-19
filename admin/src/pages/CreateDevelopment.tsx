import React, { useState } from 'react'
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
import { useNavigate } from 'react-router-dom'
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

const CreateDevelopment = () => {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(false)
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

  const onLoad = () => {
    setVisible(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      if (!name || !developer?._id || !completionDate) {
        setFormError(true)
        return
      }
      setLoading(true)
      const payload: movininTypes.CreateDevelopmentPayload = {
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
      await DevelopmentService.create(payload)
      navigate('/developments')
    } catch (err) {
      helper.error(err)
      setFormError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && (
        <div className="create-development">
          <Paper className="development-form" elevation={10}>
            <h1 className="development-form-title">{strings.NEW_DEVELOPMENT}</h1>
            <form onSubmit={handleSubmit}>
              <ImageEditor
                title={strings.DEVELOPMENTS}
                maxImages={10}
                images={images.map((filename) => ({ filename }))}
                onAdd={(img) => {
                  setImages((prev) => (prev.includes(img.filename) ? prev : [...prev, img.filename]))
                }}
                onDelete={(img) => {
                  setImages((prev) => prev.filter((filename) => filename !== img.filename))
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
                  setFloorPlans((prev) => (prev.includes(img.filename) ? prev : [...prev, img.filename]))
                }}
                onDelete={(img) => {
                  setFloorPlans((prev) => prev.filter((filename) => filename !== img.filename))
                }}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{strings.NAME}</InputLabel>
                <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.DEVELOPER}</InputLabel>
                <DeveloperSelectList onChange={(values) => setDeveloper(values[0])} />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{commonStrings.LOCATION}</InputLabel>
                <LocationSelectList onChange={(values) => setLocation(values[0])} />
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
                <DevelopmentStatusList label={strings.STATUS} onChange={setStatus} />
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
                  {commonStrings.CREATE}
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

export default CreateDevelopment
