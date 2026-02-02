import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Paper,
  Button,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/developments'
import * as helper from '@/utils/helper'
import * as DevelopmentService from '@/services/DevelopmentService'
import ImageViewer from '@/components/ImageViewer'
import env from '@/config/env.config'
import * as movininHelper from ':movinin-helper'

import '@/assets/css/development.css'

const Development = () => {
  const navigate = useNavigate()
  const reactLocation = useLocation()
  const [development, setDevelopment] = useState<movininTypes.Development>()
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [openImageDialog, setOpenImageDialog] = useState(false)

  const onLoad = async () => {
    const { state } = reactLocation
    if (!state || !state.developmentId) {
      navigate('/developments')
      return
    }
    try {
      const dev = await DevelopmentService.getDevelopment(state.developmentId)
      if (!dev) {
        navigate('/developments')
        return
      }
      setDevelopment(dev)
      const _images = (dev.images || []).map((img) => movininHelper.joinURL(env.CDN_PROPERTIES, img))
      setImages(_images)
    } catch (err) {
      helper.error(err)
      navigate('/developments')
    }
  }

  useEffect(() => {
    onLoad()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout strict>
      {development && (
        <div className="development-page">
          <Paper className="development-card" elevation={10}>
            <div className="development-header">
              <h1>{development.name}</h1>
              <Button variant="outlined" onClick={() => navigate('/update-development', { state: { developmentId: development._id } })}>
                {commonStrings.UPDATE}
              </Button>
            </div>
            <div className="development-info">
              <div><strong>{strings.DEVELOPER}:</strong> {typeof development.developer === 'object' ? development.developer.fullName : development.developer}</div>
              <div><strong>{strings.STATUS}:</strong> {helper.getDevelopmentStatus(development.status)}</div>
              <div><strong>{strings.UNITS}:</strong> {development.unitsCount ?? '-'}</div>
              <div><strong>{commonStrings.LOCATION}:</strong> {development.location || '-'}</div>
              <div><strong>{commonStrings.INFO}:</strong> {development.description || '-'}</div>
            </div>
            <div className="development-images">
              {images.map((image, index) => (
                <div
                  key={image}
                  className={`development-image${currentIndex === index ? ' selected' : ''}`}
                  onClick={() => {
                    setCurrentIndex(index)
                    setOpenImageDialog(true)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="image"
                >
                  <img alt="" src={image} />
                </div>
              ))}
            </div>
          </Paper>

          {openImageDialog && (
            <ImageViewer
              src={images}
              currentIndex={currentIndex}
              closeOnClickOutside
              title={development.name}
              onClose={() => {
                setOpenImageDialog(false)
                setCurrentIndex(0)
              }}
            />
          )}
        </div>
      )}
    </Layout>
  )
}

export default Development
