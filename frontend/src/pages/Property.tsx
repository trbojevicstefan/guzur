import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  Button,
  FormControl,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/properties'
import * as helper from '@/utils/helper'
import * as PropertyService from '@/services/PropertyService'
import * as UserService from '@/services/UserService'
import PropertyInfo from '@/components/PropertyInfo'
import Map from '@/components/Map'
import LeadForm from '@/components/LeadForm'
import NoMatch from './NoMatch'
import ImageViewer from '@/components/ImageViewer'
import AgencyBadge from '@/components/AgencyBadge'
import DatePicker from '@/components/DatePicker'
import Footer from '@/components/Footer'
import Progress from '@/components/Progress'
import { strings as messagesStrings } from '@/lang/messages'

import '@/assets/css/property.css'

const Property = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const _minDate = new Date()
  _minDate.setDate(_minDate.getDate() + 1)

  const [loading, setLoading] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [property, setProperty] = useState<movininTypes.Property>()
  const [image, setImage] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [openImageDialog, setOpenImageDialog] = useState(false)
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [minDate, setMinDate] = useState<Date>()
  const [maxDate, setMaxDate] = useState<Date>()
  const [hideAction, setHideAction] = useState(true)
  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [priceLabel, setPriceLabel] = useState('')
  const currentUser = UserService.getCurrentUser()
  const [hasUnread, setHasUnread] = useState(false)
  const developmentValue = property?.developmentId as unknown as movininTypes.Development | string | undefined
  const development = typeof developmentValue === 'object' ? developmentValue : undefined
  const developmentId = typeof developmentValue === 'string'
    ? developmentValue
    : developmentValue?._id
  const developer = property && typeof property.developer === 'object' ? property.developer : undefined
  const developerOrg = property && typeof property.developerOrg === 'object' ? property.developerOrg : undefined
  const brokerageOrg = property && typeof property.brokerageOrg === 'object' ? property.brokerageOrg : undefined
  const brokerUser = property && typeof property.broker === 'object' ? property.broker : undefined
  const ownerUser = property && typeof property.owner === 'object' ? property.owner : undefined
  const developerId = property
    ? (typeof property.developer === 'string'
      ? property.developer
      : property.developer?._id)
    : undefined
  const sellerName = developerOrg?.name
    || brokerageOrg?.name
    || developer?.fullName
    || brokerUser?.fullName
    || ownerUser?.fullName
  const sellerLogo = developerOrg?.logo
    || brokerageOrg?.logo
    || developer?.avatar
    || brokerUser?.avatar
    || ownerUser?.avatar
  const sellerType = developerOrg
    ? strings.SELLER_DEVELOPER
    : brokerageOrg
      ? strings.SELLER_BROKERAGE
      : ownerUser
        ? strings.SELLER_OWNER
        : developer
          ? strings.SELLER_DEVELOPER
          : brokerUser
            ? strings.SELLER_BROKERAGE
            : ''
  const sellerLink = developerOrg?.slug
    ? `/developers/org/${developerOrg.slug}`
    : brokerageOrg?.slug
      ? `/brokers/${brokerageOrg.slug}`
      : developerId
        ? `/developers/${developerId}`
        : undefined
  const descriptionHtml = property?.useAiDescription && property.aiDescription
    ? property.aiDescription
    : property?.description
  const compoundName = development?.name || ''
  const saleTypeLabel = property?.listingType === movininTypes.ListingType.Sale
    ? (developerOrg || developer ? strings.DEVELOPER_SALE : strings.BROKER_SALE)
    : property?.listingType === movininTypes.ListingType.Both
      ? (developerOrg || developer ? strings.DEVELOPER_SALE : strings.BROKER_SALE)
      : ''
  const finishingLabel = property?.furnished ? strings.FINISHED : strings.UNFINISHED
  const deliveryYear = (development as any)?.deliveryYear || (property as any)?.deliveryYear || ''
  const isRentListing = property?.listingType === movininTypes.ListingType.Rent
    || property?.listingType === movininTypes.ListingType.Both
  const isSaleListing = property?.listingType === movininTypes.ListingType.Sale
    || property?.listingType === movininTypes.ListingType.Both
  const locationName = property
    ? (typeof property.location === 'object' ? property.location?.name : property.location)
    : ''
  const sizeLabel = property?.size
    ? `${movininHelper.formatNumber(property.size, language)} ${env.SIZE_UNIT}`
    : '-'
  const galleryIndex = images.length > 1 ? 1 : 0
  const galleryImage = images[galleryIndex] || image
  const contactLabel = developerOrg || developer
    ? strings.CONTACT_DEVELOPER
    : brokerageOrg || brokerUser
      ? strings.CONTACT_BROKER
      : ownerUser
        ? strings.CONTACT_OWNER
        : strings.CONTACT_SELLER
  const fallbackPrice = property
    ? (property.listingType === movininTypes.ListingType.Sale
      ? (property.salePrice ?? property.price)
      : property.listingType === movininTypes.ListingType.Both && property.salePrice
        ? property.salePrice
        : property.price)
    : undefined
  const displayPrice = priceLabel
    || (typeof fallbackPrice === 'number'
      ? `${movininHelper.formatPrice(fallbackPrice, commonStrings.CURRENCY, language)}${isRentListing ? `/${helper.rentalTermUnit(property?.rentalTerm as movininTypes.RentalTerm)}` : ''}`
      : '')

  useEffect(() => {
    const src = (_image: string) => movininHelper.joinURL(env.CDN_PROPERTIES, _image)

    if (property) {
      const _image = src(property.image)
      setImage(_image)
      const _images = property.images ? property.images.map(src) : []
      const __images = [_image, ..._images]
      setImages(__images)
    }
  }, [property])

  useEffect(() => {
    if (openImageDialog) {
      document.body.classList.add('stop-scrolling')
    } else {
      document.body.classList.remove('stop-scrolling')
    }
  }, [openImageDialog])

  const onLoad = async () => {
    const { state } = location
    const propertyId = id || state?.propertyId
    const _from = state?.from as Date | undefined
    const _to = state?.to as Date | undefined

    if (!propertyId) {
      setNoMatch(true)
      return
    }

    setLoading(true)
    const _language = UserService.getLanguage()
    setLanguage(_language)
    setFrom(_from || undefined)
    setTo(_to || undefined)
    setMinDate(_from || undefined)
    if (_to) {
      const _maxDate = new Date(_to)
      _maxDate.setDate(_maxDate.getDate() - 1)
      setMaxDate(_maxDate)
    }

    try {
      const _property = await PropertyService.getProperty(propertyId)

      if (_property) {
        setProperty(_property)
        const rentListing = _property.listingType === movininTypes.ListingType.Rent
          || _property.listingType === movininTypes.ListingType.Both
        const saleListing = _property.listingType === movininTypes.ListingType.Sale
          || _property.listingType === movininTypes.ListingType.Both

        let nextPriceLabel = ''
        if (saleListing) {
          nextPriceLabel = await helper.salePriceLabel(_property, _language)
        }
        if (!nextPriceLabel && rentListing) {
          nextPriceLabel = await helper.priceLabel(_property, _language)
        }
        setPriceLabel(nextPriceLabel)

        setHideAction(!rentListing)
      } else {
        setNoMatch(true)
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUser?._id || !property?._id) {
      setHasUnread(false)
      return
    }
    const readKey = `mi-message-read-${currentUser._id}`
    const readMap = JSON.parse(localStorage.getItem(readKey) || '{}') as Record<string, string>
    setHasUnread(!readMap[property._id])
  }, [currentUser?._id, property?._id])

  const handleContactSeller = () => {
    if (!property) {
      return
    }
    const subject = strings.CONTACT_SUBJECT.replace('{name}', property.name || commonStrings.PROPERTY)
    const message = strings.CONTACT_MESSAGE
      .replace('{name}', property.name || commonStrings.PROPERTY)
      .replace('{location}', locationName || property.address || commonStrings.LOCATION)
      .replace('{price}', displayPrice || '')
    navigate('/contact', { state: { subject, message } })
  }

  return (
    <Layout onLoad={onLoad}>
      {
        !loading && property && image
        && (
          <>
            <div className="property-showcase">
              <div className="property-showcase-bar">
                <button
                  type="button"
                  className="property-back"
                  onClick={() => navigate(-1)}
                >
                  {strings.BACK_TO_LISTINGS}
                </button>
              </div>

              <div className="property-showcase-grid">
                <section className="property-showcase-main">
                  <div className="property-hero">
                    <button
                      type="button"
                      className="property-hero-main"
                      onClick={() => {
                        setCurrentIndex(0)
                        setOpenImageDialog(true)
                      }}
                    >
                      <img src={image} alt={property.name} />
                      <span className="property-hero-overlay" />
                      <div className="property-hero-title">
                        {saleTypeLabel && <span className="property-hero-tag">{saleTypeLabel}</span>}
                        <h1>{property.name}</h1>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="property-hero-gallery"
                      onClick={() => {
                        setCurrentIndex(galleryIndex)
                        setOpenImageDialog(true)
                      }}
                    >
                      <span className="property-hero-gallery-label">{strings.GALLERY}</span>
                      <img src={galleryImage} alt={property.name} />
                      <span className="property-hero-gallery-overlay">
                        <span className="property-hero-plus">+</span>
                        <span>{strings.VIEW_ALL_PHOTOS.replace('{count}', String(images.length))}</span>
                      </span>
                    </button>
                  </div>

                  <div className="property-stats">
                    <div className="property-stat highlight">
                      <span>{strings.PRICE}</span>
                      <strong>{displayPrice || '-'}</strong>
                    </div>
                    <div className="property-stat">
                      <span>{strings.BEDROOMS_LABEL}</span>
                      <strong>{property.bedrooms ?? '-'}</strong>
                    </div>
                    <div className="property-stat">
                      <span>{strings.BATHROOMS_LABEL}</span>
                      <strong>{property.bathrooms ?? '-'}</strong>
                    </div>
                    <div className="property-stat">
                      <span>{strings.SIZE}</span>
                      <strong>{sizeLabel}</strong>
                    </div>
                  </div>

                  <div className="property-section property-overview">
                    <h2>{strings.OVERVIEW}</h2>
                    <div className="property-description" dangerouslySetInnerHTML={{ __html: descriptionHtml || '' }} />
                  </div>

                  <div className="property-info-grid">
                    <div className="property-info-card">
                      <span>{strings.PROPERTY_TYPE}</span>
                      <strong>{helper.getPropertyType(property.type)}</strong>
                    </div>
                    <div className="property-info-card">
                      <span>{strings.DELIVERY_STATUS}</span>
                      <strong>{finishingLabel || '-'}</strong>
                    </div>
                    <div className="property-info-card">
                      <span>{commonStrings.LOCATION}</span>
                      <strong>{locationName || property.address || '-'}</strong>
                    </div>
                    <div className="property-info-card">
                      <span>{strings.COMPOUND}</span>
                      <strong>{compoundName || '-'}</strong>
                    </div>
                  </div>

                  <div className="property-amenities">
                    <PropertyInfo
                      property={property}
                      language={language}
                      className="showcase"
                    />
                  </div>

                  {(developmentId || developerId || currentUser) && (
                    <div className="property-links">
                      {developmentId && (
                        <button
                          type="button"
                          className="property-link"
                          onClick={() => navigate(`/projects/${developmentId}`)}
                        >
                          {strings.VIEW_PROJECT}{development?.name ? `: ${development.name}` : ''}
                        </button>
                      )}
                      {developerId && (
                        <button
                          type="button"
                          className="property-link"
                          onClick={() => navigate(developerOrg?.slug ? `/developers/org/${developerOrg.slug}` : `/developers/${developerId}`)}
                        >
                          {strings.VIEW_DEVELOPER}{(developerOrg?.name || developer?.fullName) ? `: ${developerOrg?.name || developer?.fullName}` : ''}
                        </button>
                      )}
                      {currentUser && (
                        <button
                          type="button"
                          className="property-link"
                          onClick={() => navigate(`/messages?propertyId=${property._id}`)}
                        >
                          {commonStrings.SEND_MESSAGE}{hasUnread ? ` (${messagesStrings.UNREAD})` : ''}
                        </button>
                      )}
                    </div>
                  )}

                  {property.latitude && property.longitude && (
                    <div className="property-section">
                      <h2>{commonStrings.LOCATION}</h2>
                      <div className="property-map-card">
                        <Map
                          position={[property.latitude, property.longitude]}
                          initialZoom={13}
                          showTileToggle
                          className="property-map"
                          properties={[property]}
                          onSelectProperty={() => property._id && navigate(`/property/${property._id}`)}
                        />
                      </div>
                    </div>
                  )}
                </section>

                <aside className="property-showcase-side">
                  {sellerName && (
                    <div className="property-seller-card">
                      <div className="property-seller-header">
                        <span className="property-seller-label">{strings.SELLER}</span>
                        <div className="property-seller-row">
                          {sellerLogo && (
                            <span className="property-seller-avatar">
                              <img
                                src={sellerLogo.startsWith('http') ? sellerLogo : movininHelper.joinURL(env.CDN_USERS, sellerLogo)}
                                alt={sellerName}
                              />
                            </span>
                          )}
                          <div>
                            <div className="property-seller-name">{sellerName}</div>
                            {sellerType && <div className="property-seller-type">{sellerType}</div>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="property-contact"
                        onClick={handleContactSeller}
                      >
                        {contactLabel}
                      </button>
                      {sellerLink && (
                        <button
                          type="button"
                          className="property-profile"
                          onClick={() => navigate(sellerLink)}
                        >
                          {strings.VIEW_SELLER}
                        </button>
                      )}
                      {currentUser && (
                        <button
                          type="button"
                          className="property-profile muted"
                          onClick={() => navigate(`/messages?propertyId=${property._id}`)}
                        >
                          {commonStrings.SEND_MESSAGE}{hasUnread ? ` (${messagesStrings.UNREAD})` : ''}
                        </button>
                      )}
                    </div>
                  )}

                  {!hideAction && (
                    <div className="property-booking-card">
                      <h3>{strings.AVAILABILITY}</h3>
                      <form
                        className="property-booking-form"
                        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                          e.preventDefault()

                          navigate('/checkout', {
                            state: {
                              propertyId: property._id,
                              locationId: property.location._id,
                              from,
                              to
                            }
                          })
                        }}
                      >
                        <FormControl className="property-booking-field">
                          <DatePicker
                            label={commonStrings.FROM}
                            value={from}
                            minDate={new Date()}
                            maxDate={maxDate}
                            variant="outlined"
                            required
                            onChange={(date) => {
                              if (date) {
                                if (to && to.getTime() <= date.getTime()) {
                                  setTo(undefined)
                                }

                                const __minDate = new Date(date)
                                __minDate.setDate(date.getDate() + 1)
                                setMinDate(__minDate)
                              } else {
                                setMinDate(_minDate)
                              }

                              setFrom(date || undefined)
                            }}
                            language={UserService.getLanguage()}
                          />
                        </FormControl>
                        <FormControl className="property-booking-field">
                          <DatePicker
                            label={commonStrings.TO}
                            value={to}
                            minDate={minDate}
                            variant="outlined"
                            required
                            onChange={(date) => {
                              if (date) {
                                setTo(date)
                                const _maxDate = new Date(date)
                                _maxDate.setDate(_maxDate.getDate() - 1)
                                setMaxDate(_maxDate)
                              } else {
                                setTo(undefined)
                                setMaxDate(undefined)
                              }
                            }}
                            language={UserService.getLanguage()}
                          />
                        </FormControl>
                        <Button
                          type="submit"
                          variant="contained"
                          className="property-booking-submit"
                        >
                          {strings.BOOK}
                        </Button>
                      </form>
                      {env.HIDE_AGENCIES ? null : (
                        <div className="property-agency-card">
                          <AgencyBadge agency={property.agency} />
                        </div>
                      )}
                    </div>
                  )}

                  {property.listingType !== movininTypes.ListingType.Rent && (
                    <div className="property-lead-card">
                      <LeadForm
                        propertyId={property._id}
                        listingType={property.listingType === movininTypes.ListingType.Both
                          ? movininTypes.ListingType.Sale
                          : (property.listingType ?? movininTypes.ListingType.Sale)}
                      />
                    </div>
                  )}
                </aside>
              </div>

              {
                openImageDialog
                && (
                  <ImageViewer
                    src={images}
                    currentIndex={currentIndex}
                    closeOnClickOutside
                    title={property.name}
                    onClose={() => {
                      setOpenImageDialog(false)
                    }}
                  />
                )
              }
            </div>

            <Footer />
          </>
        )
      }

      {loading && <Progress />}
      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default Property
