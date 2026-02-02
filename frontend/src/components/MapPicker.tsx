import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import env from '@/config/env.config'

import 'leaflet/dist/leaflet.css'
import '@/assets/css/map-picker.css'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

L.Marker.prototype.options.icon = markerIcon

interface MapPickerProps {
  latitude?: number
  longitude?: number
  onChange?: (latitude: number, longitude: number) => void
  className?: string
  showTileToggle?: boolean
  streetLabel?: string
  satelliteLabel?: string
}

const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTRIBUTION = 'Tiles (c) Esri'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const MapUpdater = ({ position }: { position: L.LatLngExpression }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(position)
  }, [map, position])
  return null
}

const MapPickerEvents = ({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

const MapPicker = ({
  latitude,
  longitude,
  onChange,
  className,
  showTileToggle = true,
  streetLabel = 'Street',
  satelliteLabel = 'Satellite',
}: MapPickerProps) => {
  const safeLat = typeof latitude === 'number' && !Number.isNaN(latitude)
    ? clamp(latitude, -90, 90)
    : env.MAP_LATITUDE
  const safeLng = typeof longitude === 'number' && !Number.isNaN(longitude)
    ? clamp(longitude, -180, 180)
    : env.MAP_LONGITUDE

  const [position, setPosition] = useState<L.LatLngExpression>([safeLat, safeLng])
  const [tileMode, setTileMode] = useState<'street' | 'satellite'>('street')

  useEffect(() => {
    setPosition([safeLat, safeLng])
  }, [safeLat, safeLng])

  const tileConfig = useMemo(() => {
    if (tileMode === 'satellite') {
      return {
        url: SATELLITE_TILE_URL,
        attribution: SATELLITE_ATTRIBUTION,
      }
    }
    return {
      url: env.MAP_TILE_URL,
      attribution: env.MAP_TILE_ATTRIBUTION,
    }
  }, [tileMode])

  const handlePick = (lat: number, lng: number) => {
    const nextLat = clamp(lat, -90, 90)
    const nextLng = clamp(lng, -180, 180)
    setPosition([nextLat, nextLng])
    if (onChange) {
      onChange(nextLat, nextLng)
    }
  }

  return (
    <div className={`map-picker ${className ? `${className} ` : ''}`}>
      {showTileToggle && (
        <div className="map-picker-toggle">
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
      <MapContainer
        center={position}
        zoom={env.MAP_ZOOM}
        className="map-picker-canvas"
      >
        <MapUpdater position={position} />
        <MapPickerEvents onPick={handlePick} />
        <TileLayer
          url={tileConfig.url}
          attribution={tileConfig.attribution}
        />
        <Marker
          draggable
          position={position}
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker
              const latlng = marker.getLatLng()
              handlePick(latlng.lat, latlng.lng)
            },
          }}
        />
      </MapContainer>
    </div>
  )
}

export default MapPicker
