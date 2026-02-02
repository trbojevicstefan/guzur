import React, { useEffect, useState } from 'react'
import {
  Paper,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import LocationSelectList from '@/components/LocationSelectList'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/rfq'
import * as helper from '@/utils/helper'
import * as RfqService from '@/services/RfqService'

import '@/assets/css/rfq.css'

const Rfq = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Option | undefined>(undefined)
  const [listingType, setListingType] = useState<movininTypes.ListingType>(movininTypes.ListingType.Sale)
  const [propertyType, setPropertyType] = useState<movininTypes.PropertyType>(movininTypes.PropertyType.Apartment)
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [budget, setBudget] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim()) {
      helper.error(null, commonStrings.FORM_ERROR)
      return
    }

    setLoading(true)
    try {
      const payload: movininTypes.CreateRfqPayload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || selectedLocation?.name || selectedLocation?._id || undefined,
        listingType,
        propertyType,
        bedrooms: bedrooms ? Number.parseInt(bedrooms, 10) : undefined,
        bathrooms: bathrooms ? Number.parseInt(bathrooms, 10) : undefined,
        budget: budget ? Number.parseInt(budget, 10) : undefined,
        message: message.trim() || undefined,
      }

      await RfqService.createRfq(payload)

      setName('')
      setEmail('')
      setPhone('')
      setLocation('')
      setSelectedLocation(undefined)
      setBedrooms('')
      setBathrooms('')
      setBudget('')
      setMessage('')
      helper.info(strings.SUCCESS)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout strict={false}>
      <div className="rfq">
        <Paper className="rfq-card" elevation={8}>
          <div className="rfq-title">{strings.HEADING}</div>
          <div className="rfq-subtitle">{strings.SUBHEADING}</div>

          <form onSubmit={handleSubmit}>
            <div className="rfq-grid">
              <FormControl fullWidth margin="dense" className="rfq-full">
                <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                <OutlinedInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  label={commonStrings.FULL_NAME}
                  required
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{commonStrings.EMAIL}</InputLabel>
                <OutlinedInput
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  label={commonStrings.EMAIL}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{commonStrings.PHONE}</InputLabel>
                <OutlinedInput
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  label={commonStrings.PHONE}
                />
              </FormControl>

              <FormControl fullWidth margin="dense" className="rfq-full">
                <InputLabel>{commonStrings.LOCATION}</InputLabel>
                <LocationSelectList
                  label={commonStrings.LOCATION}
                  variant="outlined"
                  value={selectedLocation as movininTypes.Location}
                  onChange={(values) => {
                    const selected = values[0]
                    setSelectedLocation(selected)
                    setLocation(selected?.name || selected?._id || '')
                  }}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.LISTING_TYPE}</InputLabel>
                <Select
                  value={listingType}
                  label={strings.LISTING_TYPE}
                  onChange={(event) => setListingType(event.target.value as movininTypes.ListingType)}
                >
                  {movininHelper.getAllListingTypes().map((type) => (
                    <MenuItem key={type} value={type}>
                      {helper.getListingType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.PROPERTY_TYPE}</InputLabel>
                <Select
                  value={propertyType}
                  label={strings.PROPERTY_TYPE}
                  onChange={(event) => setPropertyType(event.target.value as movininTypes.PropertyType)}
                >
                  {movininHelper.getAllPropertyTypes().map((type) => (
                    <MenuItem key={type} value={type}>
                      {helper.getPropertyType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.BEDROOMS}</InputLabel>
                <OutlinedInput
                  type="number"
                  value={bedrooms}
                  onChange={(event) => setBedrooms(event.target.value)}
                  label={strings.BEDROOMS}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.BATHROOMS}</InputLabel>
                <OutlinedInput
                  type="number"
                  value={bathrooms}
                  onChange={(event) => setBathrooms(event.target.value)}
                  label={strings.BATHROOMS}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.BUDGET}</InputLabel>
                <OutlinedInput
                  type="number"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  label={strings.BUDGET}
                />
              </FormControl>

              <FormControl fullWidth margin="dense" className="rfq-full">
                <InputLabel>{strings.MESSAGE}</InputLabel>
                <OutlinedInput
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  label={strings.MESSAGE}
                  multiline
                  minRows={4}
                />
              </FormControl>
            </div>

            <div className="rfq-actions">
              <Button type="submit" variant="contained" className="btn-primary" disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : strings.SUBMIT}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setName('')
                  setEmail('')
                  setPhone('')
                  setLocation('')
                  setSelectedLocation(undefined)
                  setBedrooms('')
                  setBathrooms('')
                  setBudget('')
                  setMessage('')
                }}
              >
                {commonStrings.CANCEL}
              </Button>
            </div>
          </form>
        </Paper>
      </div>
      <Footer />
    </Layout>
  )
}

export default Rfq
