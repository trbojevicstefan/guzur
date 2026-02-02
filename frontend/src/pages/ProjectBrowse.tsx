import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  FormControl,
  Input,
  InputLabel,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import Progress from '@/components/Progress'
import { strings as browseStrings } from '@/lang/project-browse'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/utils/helper'

import '@/assets/css/project-browse.css'

const ProjectBrowse = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<movininTypes.Location[]>([])
  const [path, setPath] = useState<movininTypes.Location[]>([])
  const [keyword, setKeyword] = useState('')

  const parent = path.length ? path[path.length - 1] : undefined

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        const data = await LocationService.getFrontendLocations(parent?._id, keyword)
        setLocations(data)
      } catch (err) {
        helper.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [parent?._id, keyword])

  const handleSelect = async (location: movininTypes.Location) => {
    try {
      setLoading(true)
      const children = await LocationService.getFrontendLocations(location._id)
      if (children.length > 0) {
        setPath((prev) => [...prev, location])
        setKeyword('')
        setLocations(children)
      } else {
        const locationParam = location.name || location._id
        navigate(`/projects?location=${encodeURIComponent(locationParam)}`)
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout strict={false}>
      <div className="project-browse">
        <div className="project-browse-header">
          <h1>{browseStrings.HEADING}</h1>
          {path.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => {
                setPath((prev) => prev.slice(0, -1))
                setKeyword('')
              }}
            >
              {browseStrings.BACK}
            </Button>
          )}
        </div>
        <div className="project-browse-path">
          <Button
            variant="text"
            onClick={() => {
              setPath([])
              setKeyword('')
            }}
          >
            {browseStrings.ALL_LOCATIONS}
          </Button>
          {path.map((location, index) => (
            <Button
              key={location._id}
              variant="text"
              onClick={() => {
                setPath(path.slice(0, index + 1))
                setKeyword('')
              }}
            >
              {location.name || browseStrings.SELECT_LOCATION}
            </Button>
          ))}
        </div>

        <FormControl fullWidth className="project-browse-search">
          <InputLabel>{browseStrings.SEARCH}</InputLabel>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </FormControl>

        <div className="project-browse-grid">
          {locations.length === 0 && !loading && (
            <div className="project-browse-empty">{browseStrings.NO_LOCATIONS}</div>
          )}
          {locations.map((location) => (
            <div key={location._id} className="project-browse-card">
              <div className="project-browse-card-title">{location.name || browseStrings.SELECT_LOCATION}</div>
              <div className="project-browse-actions">
                <Button
                  variant="contained"
                  onClick={() => handleSelect(location)}
                >
                  {parent ? browseStrings.VIEW_PROJECTS : browseStrings.SELECT_DISTRICT}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {loading && <Progress />}
      <Footer />
    </Layout>
  )
}

export default ProjectBrowse
