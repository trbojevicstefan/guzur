import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'
import * as PaymentService from '@/services/PaymentService'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/properties'
import { strings as messagesStrings } from '@/lang/messages'
import * as helper from '@/utils/helper'
import PropertyInfo from '@/components/PropertyInfo'
import AgencyBadge from '@/components/AgencyBadge'

import '@/assets/css/property-component.css'

interface PropertyProps {
  property: movininTypes.Property
  location?: string
  from?: Date
  to?: Date
  sizeAuto?: boolean
  hideAgency?: boolean
  hidePrice?: boolean
  hideActions?: boolean
}

const Property = ({
  property,
  location,
  from,
  to,
  sizeAuto,
  hideAgency,
  hidePrice,
  hideActions,
}: PropertyProps) => {
  const navigate = useNavigate()

  const [language, setLanguage] = useState('')
  const [days, setDays] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [salePrice, setSalePrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const developmentValue = property.developmentId as unknown as movininTypes.Development | string | undefined
  const developmentId = typeof developmentValue === 'string'
    ? developmentValue
    : developmentValue?._id
  const currentUser = UserService.getCurrentUser()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (!currentUser?._id || !property?._id) {
      setHasUnread(false)
      return
    }
    const readKey = `mi-message-read-${currentUser._id}`
    const readMap = JSON.parse(localStorage.getItem(readKey) || '{}') as Record<string, string>
    setHasUnread(!readMap[property._id])
  }, [currentUser?._id, property?._id])
  const developerId = typeof property.developer === 'string'
    ? property.developer
    : property.developer?._id

  useEffect(() => {
    setLanguage(UserService.getLanguage())
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      const isRentListing = property.listingType === movininTypes.ListingType.Rent
        || property.listingType === movininTypes.ListingType.Both
      const isSaleListing = property.listingType === movininTypes.ListingType.Sale
        || property.listingType === movininTypes.ListingType.Both

      if (isRentListing && from && to) {
        const _totalPrice = await PaymentService.convertPrice(movininHelper.calculateTotalPrice(property, from as Date, to as Date))
        setTotalPrice(_totalPrice)
        setDays(movininHelper.days(from, to))
      } else {
        setTotalPrice(0)
        setDays(0)
      }

      if (isSaleListing && property.salePrice) {
        const _salePrice = await PaymentService.convertPrice(property.salePrice)
        setSalePrice(_salePrice)
      } else {
        setSalePrice(0)
      }
      setLoading(false)
    }

    fetchPrice()
  }, [from, to, property])

  const isRentListing = property.listingType === movininTypes.ListingType.Rent
    || property.listingType === movininTypes.ListingType.Both
  const isSaleListing = property.listingType === movininTypes.ListingType.Sale
    || property.listingType === movininTypes.ListingType.Both

  const showRentalPricing = !hidePrice && isRentListing && from && to
  const showSalePricing = !hidePrice && isSaleListing && (!from || !to)
  const resolveImageName = (value?: string) => {
    if (!value) {
      return ''
    }
    const trimmed = value.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      return ''
    }
    return trimmed
  }
  const fallbackImageName = (property.images || [])
    .map(resolveImageName)
    .find((img) => img)
  const propertyImageName = resolveImageName(property.image) || fallbackImageName
  const propertyImageUrl = propertyImageName
    ? (propertyImageName.startsWith('http')
      ? propertyImageName
      : movininHelper.joinURL(env.CDN_PROPERTIES, propertyImageName))
    : ''
  const openPropertyDetails = () => {
    if (!property._id) {
      return
    }
    navigate(`/property/${property._id}`, {
      state: {
        propertyId: property._id,
        from,
        to
      }
    })
  }

  if (loading || !language || (showRentalPricing && (!days || !totalPrice)) || (showSalePricing && !salePrice)) {
    return null
  }

  return (
    <article key={property._id} className="property glass-card group">

      <div className="left-panel">
        <button
          type="button"
          className="property-media-btn"
          aria-label={`${strings.VIEW} ${property.name || commonStrings.PROPERTY}`}
          onClick={openPropertyDetails}
        >
          {propertyImageUrl ? (
            <img
              src={propertyImageUrl}
              alt={property.name}
              className="property-img image-zoom"
            />
          ) : (
            <div className="property-img-placeholder">{property.name?.charAt(0) || 'P'}</div>
          )}
        </button>
        {!hideAgency && <AgencyBadge agency={property.agency} style={sizeAuto ? { bottom: 10 } : {}} />}
      </div>

      <div className="middle-panel">
        <div className="name">
          <button
            type="button"
            className="property-name-btn"
            onClick={openPropertyDetails}
          >
            <h2>{property.name}</h2>
          </button>
        </div>
        {(developmentId || developerId) && (
          <div className="property-links">
            {developmentId && (
              <button
                type="button"
                className="property-link"
                onClick={() => navigate(`/projects/${developmentId}`)}
              >
                {strings.VIEW_PROJECT}
              </button>
            )}
            {developerId && (
              <button
                type="button"
                className="property-link"
                onClick={() => navigate(`/developers/${developerId}`)}
              >
                {strings.VIEW_DEVELOPER}
              </button>
            )}
          </div>
        )}

        <PropertyInfo
          property={property}
          className="property-info"
          language={language}
          // description
        />
      </div>

      <div className="right-panel">
        {showRentalPricing && (
          <div className="price">
            <span className="price-days">{helper.getDays(days)}</span>
            <span className="price-main">{movininHelper.formatPrice(totalPrice, commonStrings.CURRENCY, language)}</span>
            <span className="price-day">{`${strings.PRICE_PER_DAY} ${movininHelper.formatPrice(totalPrice / days, commonStrings.CURRENCY, language)}`}</span>
          </div>
        )}
        {showSalePricing && (
          <div className="price sale-price">
            <span className="price-days">{strings.SALE_PRICE}</span>
            <span className="price-main">{movininHelper.formatPrice(salePrice, commonStrings.CURRENCY, language)}</span>
          </div>
        )}
        {hidePrice && !hideActions && <span />}
        {
          !hideActions
          && (
            <div className="action">
              <Button
                variant="outlined"
                className="btn-margin-bottom btn-view"
                onClick={openPropertyDetails}
              >
                {strings.VIEW}
              </Button>
              {currentUser && (
                <Button
                  variant="outlined"
                  className="btn-margin-bottom btn-message"
                  onClick={() => {
                    navigate(`/messages?propertyId=${property._id}`)
                  }}
                >
                  {commonStrings.SEND_MESSAGE}{hasUnread ? ` (${messagesStrings.UNREAD})` : ''}
                </Button>
              )}
              {
                showRentalPricing && (
                  <Button
                    variant="contained"
                    className="btn-margin-bottom btn-book"
                    onClick={() => {
                      navigate('/checkout', {
                        state: {
                          propertyId: property._id,
                          locationId: location,
                          from,
                          to
                        }
                      })
                    }}
                  >
                    {strings.BOOK}
                  </Button>
                )
              }
            </div>
          )
        }

      </div>

    </article>
  )
}

export default Property
