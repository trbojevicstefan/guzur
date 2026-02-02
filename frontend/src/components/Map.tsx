import React, { Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import * as movininTypes from ':movinin-types'
// import * as UserService from '@/services/UserService'
import { strings } from '@/lang/map'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/utils/helper'
import env from '@/config/env.config'

import 'leaflet-boundary-canvas'
import 'leaflet/dist/leaflet.css'
import '@/assets/css/map.css'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
})

L.Marker.prototype.options.icon = DefaultIcon

interface Marker {
  name: string,
  position: L.LatLng
}

const markers: Marker[] = [
  // { name: 'Athens (ATH)', position: new L.LatLng(37.983810, 23.727539) },
]
const zoomMarkers: Marker[] = [
  // { name: 'Athens Airport (ATH)', position: new L.LatLng(37.937225, 23.945238) },
  // { name: 'Athens Port Piraeus (ATH)', position: new L.LatLng(37.9495811, 23.6121006) },
]

interface ZoomTrackerProps {
  setZoom: Dispatch<SetStateAction<number>>
}

const ZoomTracker = ({ setZoom }: ZoomTrackerProps) => {
  const mapEvents = useMapEvents({
    zoom() {
      setZoom(mapEvents.getZoom())
    }
  })

  return null
}

interface ZoomControlledLayerProps {
  zoom: number
  minZoom: number
  children: ReactNode
}

const ZoomControlledLayer = ({ zoom, minZoom, children }: ZoomControlledLayerProps) => {
  if (zoom >= minZoom) {
    return (
      <>
        {children}
      </>
    )
  }
  return null
}

interface MapProps {
  title?: string
  position?: LatLngExpression
  initialZoom?: number,
  locations?: movininTypes.Location[]
  properties?: movininTypes.Property[]
  className?: string,
  children?: ReactNode
  onSelelectLocation?: (locationId: string) => void
  onSelectProperty?: (propertyId: string) => void
  showTileToggle?: boolean
  streetLabel?: string
  satelliteLabel?: string
}

const Map = ({
  title,
  position = new L.LatLng(env.MAP_LATITUDE, env.MAP_LONGITUDE),
  initialZoom,
  locations,
  properties,
  className,
  children,
  onSelelectLocation,
  onSelectProperty,
  showTileToggle = false,
  streetLabel = 'Street',
  satelliteLabel = 'Satellite',
}: MapProps) => {
  const _initialZoom = initialZoom || 5.5
  const [zoom, setZoom] = useState(_initialZoom)
  const [map, setMap] = useState<L.Map | null>(null)

  if (map) {
    map.attributionControl.setPrefix('')
  }

  //
  // Tile server
  //

  const [tileMode, setTileMode] = useState<'street' | 'satellite'>('street')
  const tileConfig = useMemo(() => {
    if (tileMode === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles (c) Esri',
      }
    }
    return {
      url: env.MAP_TILE_URL,
      attribution: env.MAP_TILE_ATTRIBUTION,
    }
  }, [tileMode])
  // const language = UserService.getLanguage()
  // let tileURL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  // if (language === 'fr') {
  //   tileURL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
  // }

  const getLocationMarkers = (): Marker[] => (
    (locations
      && locations
        .filter((l) => l.latitude && l.longitude)
        .map((l) => ({ name: l.name!, position: new L.LatLng(l.latitude!, l.longitude!) }))
    ) || []
  )

  const hasCoords = (latitude?: number, longitude?: number) =>
    typeof latitude === 'number' && !Number.isNaN(latitude)
    && typeof longitude === 'number' && !Number.isNaN(longitude)

  const getPropertyMarkers = () => (
    (properties || [])
      .filter((property) => hasCoords(property.latitude, property.longitude))
      .map((property) => ({
        id: property._id,
        name: property.name,
        listingType: property.listingType,
        locationName: typeof property.location === 'object' ? property.location?.name : undefined,
        position: new L.LatLng(property.latitude as number, property.longitude as number),
      }))
  )

  const renderPropertyMarkers = () =>
    getPropertyMarkers().map((marker) => (
      <Marker key={marker.id} position={marker.position}>
        <Popup className="marker">
          <div className="name">{marker.name}</div>
          {marker.locationName && <div className="meta">{marker.locationName}</div>}
          {marker.listingType && <div className="meta">{helper.getListingType(marker.listingType)}</div>}
          <div className="action">
            {!!onSelectProperty && (
              <button
                type="button"
                className="action-btn"
                onClick={() => onSelectProperty(marker.id)}
              >
                {strings.VIEW_PROPERTY}
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    ))

  const getMarkers = (__markers: Marker[]) =>
    __markers.map((marker) => (
      <Marker key={marker.name} position={marker.position}>
        <Popup className="marker">
          <div className="name">{marker.name}</div>
          <div className="action">
            {!!onSelelectLocation && (
              <button
                type="button"
                className="action-btn"
                onClick={async () => {
                  try {
                    if (onSelelectLocation) {
                      const { status, data } = await LocationService.getLocationId(marker.name, 'en')

                      if (status === 200) {
                        onSelelectLocation(data)
                      } else {
                        helper.error()
                      }
                    }
                  } catch (err) {
                    helper.error(err)
                  }
                }}
              >
                {strings.SELECT_LOCATION}
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    ))

  return (
    <>
      {title && <h1 className="map-title">{title}</h1>}
      <MapContainer
        center={position}
        zoom={_initialZoom}
        className={`${className ? `${className} ` : ''}map`}
        ref={setMap}
      >
        {showTileToggle && (
          <div className="map-toggle">
            <button
              type="button"
              className={`map-toggle-btn ${tileMode === 'street' ? 'active' : ''}`}
              onClick={() => setTileMode('street')}
            >
              {streetLabel}
            </button>
            <button
              type="button"
              className={`map-toggle-btn ${tileMode === 'satellite' ? 'active' : ''}`}
              onClick={() => setTileMode('satellite')}
            >
              {satelliteLabel}
            </button>
          </div>
        )}
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
        <ZoomTracker setZoom={setZoom} />
        <ZoomControlledLayer zoom={zoom} minZoom={7.5}>
          {
            getMarkers(zoomMarkers)
          }
        </ZoomControlledLayer>
        <ZoomControlledLayer zoom={zoom} minZoom={5.5}>
          {
            getMarkers(markers)
          }
        </ZoomControlledLayer>
        <ZoomControlledLayer zoom={zoom} minZoom={_initialZoom}>
          {
            getMarkers(getLocationMarkers())
          }
        </ZoomControlledLayer>
        <ZoomControlledLayer zoom={zoom} minZoom={_initialZoom}>
          {renderPropertyMarkers()}
        </ZoomControlledLayer>
        {children}
      </MapContainer>
    </>
  )
}

export default Map
