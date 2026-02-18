import React, { useEffect, useRef, useState } from 'react'
import { MenuItem, Select, CircularProgress } from '@mui/material'
import {
  Add,
  Remove,
  ArrowForward,
  Close,
  EmailOutlined,
  PhoneOutlined,
  PlaceOutlined,
  PersonOutline,
  ExpandMore,
  KingBed,
  Bathtub,
  AccountBalanceWalletOutlined,
  Security,
  Bolt,
  Star,
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import LocationSelectList from '@/components/LocationSelectList'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/rfq'
import * as helper from '@/utils/helper'
import * as RfqService from '@/services/RfqService'
import { useLocation, useNavigate } from 'react-router-dom'

import '@/assets/css/rfq.css'

interface RfqPrefillState {
  propertyId?: string
  propertyName?: string
  location?: string
  listingType?: movininTypes.ListingType
  propertyType?: movininTypes.PropertyType
  bedrooms?: number
  bathrooms?: number
  budget?: number
  message?: string
}

const Rfq = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Option | undefined>(undefined)
  const [listingType, setListingType] = useState<movininTypes.ListingType>(movininTypes.ListingType.Sale)
  const [propertyType, setPropertyType] = useState<movininTypes.PropertyType>(movininTypes.PropertyType.Apartment)
  const [bedrooms, setBedrooms] = useState(0)
  const [bathrooms, setBathrooms] = useState(0)
  const [budget, setBudget] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const reactLocation = useLocation()
  const prefillDone = useRef(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (prefillDone.current) {
      return
    }

    const rawState = reactLocation.state as unknown
    let prefill: RfqPrefillState | undefined
    if (rawState && typeof rawState === 'object' && 'prefill' in rawState) {
      prefill = (rawState as { prefill?: RfqPrefillState }).prefill
    } else {
      prefill = rawState as RfqPrefillState | undefined
    }

    if (!prefill || typeof prefill !== 'object') {
      return
    }

    const locationValue = (prefill.location || '').trim()
    if (locationValue) {
      setLocation(locationValue)
      setSelectedLocation({
        _id: prefill.propertyId || locationValue,
        name: locationValue,
      })
    }

    if (prefill.listingType === movininTypes.ListingType.Sale || prefill.listingType === movininTypes.ListingType.Rent) {
      setListingType(prefill.listingType)
    }

    if (prefill.propertyType && movininHelper.getAllPropertyTypes().includes(prefill.propertyType)) {
      setPropertyType(prefill.propertyType)
    }

    if (typeof prefill.bedrooms === 'number' && Number.isFinite(prefill.bedrooms) && prefill.bedrooms >= 0) {
      setBedrooms(prefill.bedrooms)
    }

    if (typeof prefill.bathrooms === 'number' && Number.isFinite(prefill.bathrooms) && prefill.bathrooms >= 0) {
      setBathrooms(prefill.bathrooms)
    }

    if (typeof prefill.budget === 'number' && Number.isFinite(prefill.budget) && prefill.budget > 0) {
      setBudget(String(Math.round(prefill.budget)))
    }

    if (prefill.message && prefill.message.trim()) {
      setMessage(prefill.message.trim())
    } else if (prefill.propertyName && prefill.propertyName.trim()) {
      setMessage(`Interested in ${prefill.propertyName.trim()}.`)
    }

    prefillDone.current = true
  }, [reactLocation.state])

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
        bedrooms: bedrooms || undefined,
        bathrooms: bathrooms || undefined,
        budget: budget ? Number.parseInt(budget, 10) : undefined,
        message: message.trim() || undefined,
      }

      await RfqService.createRfq(payload)

      setName('')
      setEmail('')
      setPhone('')
      setLocation('')
      setSelectedLocation(undefined)
      setBedrooms(0)
      setBathrooms(0)
      setBudget('')
      setMessage('')
      helper.info(strings.SUCCESS)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const InputWrapper = ({
    icon: Icon,
    label,
    required,
    children,
  }: {
    icon?: React.ElementType
    label: string
    required?: boolean
    children: React.ReactNode
  }) => (
    <div className="rfq-field">
      <label className={`rfq-label ${required ? 'required' : ''}`}>{label}</label>
      <div className="rfq-input">
        {Icon && (
          <span className="rfq-icon">
            <Icon fontSize="small" />
          </span>
        )}
        {children}
      </div>
    </div>
  )

  const StepperInput = ({
    icon: Icon,
    label,
    value,
    onIncrement,
    onDecrement,
  }: {
    icon: React.ElementType
    label: string
    value: number
    onIncrement: () => void
    onDecrement: () => void
  }) => (
    <div className="rfq-stepper">
      <label className="rfq-label">{label}</label>
      <div className="rfq-stepper-inner">
        <span className="rfq-stepper-icon">
          <Icon fontSize="small" />
        </span>
        <button type="button" onClick={onDecrement} aria-label={`${label} -`}>
          <Remove fontSize="small" />
        </button>
        <span className="rfq-stepper-value">{value}</span>
        <button type="button" onClick={onIncrement} aria-label={`${label} +`}>
          <Add fontSize="small" />
        </button>
      </div>
    </div>
  )

  return (
    <Layout strict={false}>
      <div className="rfq">
        <div className="rfq-shell">
          <section className="rfq-aside">
            <div className="rfq-aside-bg" />
            <div className="rfq-aside-content">
              <div className="rfq-brand">
                <img src="/guzurlogo.png" alt="Guzur" />
              </div>
              <div className="rfq-aside-body">
                <h1>{strings.HERO_TITLE}</h1>
                <p>{strings.HERO_SUBTITLE}</p>
                <div className="rfq-aside-list">
                  <div className="rfq-aside-item">
                    <Security fontSize="small" />
                    <span>{strings.HERO_FEATURE_ONE}</span>
                  </div>
                  <div className="rfq-aside-item">
                    <Bolt fontSize="small" />
                    <span>{strings.HERO_FEATURE_TWO}</span>
                  </div>
                  <div className="rfq-aside-item">
                    <Star fontSize="small" />
                    <span>{strings.HERO_FEATURE_THREE}</span>
                  </div>
                </div>
              </div>
              <div className="rfq-aside-footer">
                <span>{strings.HERO_FOOTER}</span>
                <span>{strings.HERO_FOOTER_DETAIL}</span>
              </div>
            </div>
          </section>

          <section className="rfq-form">
            <div className="rfq-form-inner">
              <div className="rfq-form-header">
                <div>
                  <h2>{strings.HEADING}</h2>
                  <span className="rfq-accent" />
                  <p>{strings.SUBHEADING}</p>
                </div>
                <button type="button" className="rfq-close" onClick={() => navigate(-1)}>
                  <Close />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="rfq-form-body">
                <InputWrapper icon={PersonOutline} label={commonStrings.FULL_NAME} required>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={strings.NAME_PLACEHOLDER}
                    required
                  />
                </InputWrapper>

                <div className="rfq-row">
                  <InputWrapper icon={EmailOutlined} label={commonStrings.EMAIL}>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={strings.EMAIL_PLACEHOLDER}
                    />
                  </InputWrapper>
                  <InputWrapper icon={PhoneOutlined} label={commonStrings.PHONE}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder={strings.PHONE_PLACEHOLDER}
                    />
                  </InputWrapper>
                </div>

                <div className="rfq-section">
                  <InputWrapper icon={PlaceOutlined} label={commonStrings.LOCATION}>
                    <div className="rfq-location">
                      <LocationSelectList
                        label={commonStrings.LOCATION}
                        variant="outlined"
                        hidePopupIcon
                        value={selectedLocation as movininTypes.Location}
                        onChange={(values) => {
                          const selected = values[0]
                          setSelectedLocation(selected)
                          setLocation(selected?.name || selected?._id || '')
                        }}
                      />
                      <ExpandMore className="rfq-chevron" />
                    </div>
                  </InputWrapper>

                  <div className="rfq-row">
                    <InputWrapper label={strings.LISTING_TYPE}>
                      <div className="rfq-toggle">
                        {[movininTypes.ListingType.Sale, movininTypes.ListingType.Rent].map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={listingType === option ? 'is-active' : ''}
                            onClick={() => setListingType(option)}
                          >
                            {option === movininTypes.ListingType.Sale ? strings.BUY : strings.RENT}
                          </button>
                        ))}
                      </div>
                    </InputWrapper>
                    <InputWrapper label={strings.PROPERTY_TYPE}>
                      <div className="rfq-select">
                        <Select
                          value={propertyType}
                          onChange={(event) => setPropertyType(event.target.value as movininTypes.PropertyType)}
                          variant="standard"
                          disableUnderline
                        >
                          {movininHelper.getAllPropertyTypes().map((type) => (
                            <MenuItem key={type} value={type}>
                              {helper.getPropertyType(type)}
                            </MenuItem>
                          ))}
                        </Select>
                        <ExpandMore className="rfq-chevron" />
                      </div>
                    </InputWrapper>
                  </div>

                  <div className="rfq-row rfq-row-3">
                    <StepperInput
                      icon={KingBed}
                      label={strings.BEDROOMS}
                      value={bedrooms}
                      onIncrement={() => setBedrooms((prev) => prev + 1)}
                      onDecrement={() => setBedrooms((prev) => Math.max(0, prev - 1))}
                    />
                    <StepperInput
                      icon={Bathtub}
                      label={strings.BATHROOMS}
                      value={bathrooms}
                      onIncrement={() => setBathrooms((prev) => prev + 1)}
                      onDecrement={() => setBathrooms((prev) => Math.max(0, prev - 1))}
                    />
                    <InputWrapper icon={AccountBalanceWalletOutlined} label={strings.BUDGET}>
                      <input
                        type="text"
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        placeholder={strings.BUDGET_PLACEHOLDER}
                      />
                    </InputWrapper>
                  </div>

                  <InputWrapper label={strings.MESSAGE}>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={strings.MESSAGE_PLACEHOLDER}
                      rows={4}
                    />
                  </InputWrapper>
                </div>

                <div className="rfq-actions">
                  <button type="submit" disabled={loading} className="rfq-submit">
                    {loading ? <CircularProgress size={18} color="inherit" /> : strings.SUBMIT}
                    <ArrowForward fontSize="small" />
                  </button>
                  <button
                    type="button"
                    className="rfq-cancel"
                    onClick={() => {
                      setName('')
                      setEmail('')
                      setPhone('')
                      setLocation('')
                      setSelectedLocation(undefined)
                      setBedrooms(0)
                      setBathrooms(0)
                      setBudget('')
                      setMessage('')
                    }}
                  >
                    {commonStrings.CANCEL}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default Rfq
