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
        const isRentListing = _property.listingType === movininTypes.ListingType.Rent
          || _property.listingType === movininTypes.ListingType.Both
        const isSaleListing = _property.listingType === movininTypes.ListingType.Sale
          || _property.listingType === movininTypes.ListingType.Both

        if (isRentListing && _from && _to) {
          const _priceLabel = await helper.priceLabel(_property, _language)
          setPriceLabel(_priceLabel)
        } else if (isSaleListing) {
          const _salePriceLabel = await helper.salePriceLabel(_property, _language)
          setPriceLabel(_salePriceLabel)
        } else {
          setPriceLabel('')
        }

        setHideAction(!isRentListing)
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

  return (
    <Layout onLoad={onLoad}>
      {
        !loading && property && image
        && (
          <>
            <div className="main-page">
              <div className="property-card">
                <div className="property">
                  <div className="images-container">
                    {/* Main image */}
                    <div className="main-image">
                      <img
                        className="main-image"
                        alt=""
                        src={image}
                        onClick={() => setOpenImageDialog(true)}
                      />
                    </div>

                    {/* Additional images */}
                    <div className="images">
                      {
                        images.map((_image, index) => (
                          <div
                            key={_image}
                            className={`image${currentIndex === index ? ' selected' : ''}`}
                            onClick={() => {
                              setCurrentIndex(index)
                              setImage(_image)
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label="image"
                          >
                            <img alt="" className="image" src={_image} />
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Property info */}
                  <div className="right-panel">
                    <div className="right-panel-header">
                      <div className="name"><h2>{property.name}</h2></div>
                      {priceLabel && <div className="price">{priceLabel}</div>}
                    </div>
                    {sellerName && (
                      <div className="seller-card">
                        <div className="seller-meta">
                          <div className="seller-label">{strings.SELLER}</div>
                          <div className="seller-row">
                            {sellerLogo && (
                              <span className="seller-avatar">
                                <img
                                  src={sellerLogo.startsWith('http') ? sellerLogo : movininHelper.joinURL(env.CDN_USERS, sellerLogo)}
                                  alt={sellerName}
                                />
                              </span>
                            )}
                            <div>
                              <div className="seller-name">{sellerName}</div>
                              {sellerType && <div className="seller-type">{sellerType}</div>}
                            </div>
                          </div>
                        </div>
                        {sellerLink && (
                          <Button
                            size="small"
                            variant="outlined"
                            className="seller-action"
                            onClick={() => navigate(sellerLink)}
                          >
                            {strings.VIEW_SELLER}
                          </Button>
                        )}
                      </div>
                    )}
                    <PropertyInfo
                      property={property}
                      language={language}
                    />
                    <div className="property-details">
                      <h3>{strings.DETAILS}</h3>
                      <div className="property-details-grid">
                        <div className="property-detail-row">
                          <span>{strings.BEDROOMS_LABEL}</span>
                          <strong>{property.bedrooms ?? '-'}</strong>
                        </div>
                        <div className="property-detail-row">
                          <span>{strings.BATHROOMS_LABEL}</span>
                          <strong>{property.bathrooms ?? '-'}</strong>
                        </div>
                        <div className="property-detail-row">
                          <span>{strings.DELIVERY_IN}</span>
                          <strong>{deliveryYear || '-'}</strong>
                        </div>
                        <div className="property-detail-row">
                          <span>{strings.COMPOUND}</span>
                          <strong>{compoundName || '-'}</strong>
                        </div>
                        <div className="property-detail-row">
                          <span>{strings.SALE_TYPE}</span>
                          <strong>{saleTypeLabel || '-'}</strong>
                        </div>
                        <div className="property-detail-row">
                          <span>{strings.FINISHING}</span>
                          <strong>{finishingLabel || '-'}</strong>
                        </div>
                      </div>
                    </div>
                    {(developmentId || developerId) && (
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
                  </div>
                </div>

                {/* Property description */}
                <div className="description">
                  <div dangerouslySetInnerHTML={{ __html: descriptionHtml || '' }} />
                </div>

                {property.latitude && property.longitude && (
                  <div className="property-map">
                    <Map
                      position={[property.latitude, property.longitude]}
                      initialZoom={13}
                      showTileToggle
                      className="map"
                    />
                  </div>
                )}

                <div className="property-footer">
                  {env.HIDE_AGENCIES ? <div /> : <AgencyBadge agency={property.agency} />}

                  {
                    !hideAction
                    && (
                      <form
                        className="action"
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
                        <FormControl className="from">
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
                        <FormControl className="to">
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
                          className="btn-action btn-book"
                        >
                          {strings.BOOK}
                        </Button>
                      </form>
                    )
                  }

                </div>

                {property.listingType !== movininTypes.ListingType.Rent && (
                  <div className="property-lead">
                    <LeadForm
                      propertyId={property._id}
                      listingType={property.listingType === movininTypes.ListingType.Both
                        ? movininTypes.ListingType.Sale
                        : (property.listingType ?? movininTypes.ListingType.Sale)}
                    />
                  </div>
                )}

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
