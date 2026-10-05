import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { latLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoCoordinates } from '../lib/geo'
import { UIU_CAMPUS } from '../lib/geo'

export type MapListingMarker = GeoCoordinates & {
  id: string | number
  label: string
  description?: string
  onClick?: () => void
}

type CampusMapProps = {
  location?: GeoCoordinates | null
  label?: string
  markers?: MapListingMarker[]
  onMarkerClick?: (id: string | number) => void
  height?: number | string
  zoom?: number
}

function MapClickHandler({ onPin }: { onPin: (location: GeoCoordinates) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPin({ latitude: event.latlng.lat, longitude: event.latlng.lng })
    },
  })
  return null
}

function FitMapBounds({ points }: { points: GeoCoordinates[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    const bounds = latLngBounds(points.map(point => [point.latitude, point.longitude]))
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 })
  }, [map, points])

  return null
}

export function CampusMap({
  location,
  label = 'Property location',
  markers = [],
  onMarkerClick,
  height = 240,
  zoom = 16,
}: CampusMapProps) {
  const hasLocation = Boolean(location)

  return (
    <div className="relative isolate w-full overflow-hidden rounded-xl border border-gray-200" style={{ height, minHeight: 160 }}>
      <MapContainer
        center={[UIU_CAMPUS.latitude, UIU_CAMPUS.longitude]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[UIU_CAMPUS.latitude, UIU_CAMPUS.longitude]}
          radius={8}
          pathOptions={{ color: '#111827', fillColor: '#111827', fillOpacity: 1 }}
        >
          <Popup>United International University</Popup>
        </CircleMarker>
        <FitMapBounds points={[
          UIU_CAMPUS,
          ...(location ? [location] : []),
          ...markers.map(({ latitude, longitude }) => ({ latitude, longitude })),
        ]} />
        {location && (
          <CircleMarker
            center={[location.latitude, location.longitude]}
            radius={9}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#c87941', fillOpacity: 1 }}
          >
            <Popup>{label}</Popup>
          </CircleMarker>
        )}
        {markers.map(marker => (
          <CircleMarker
            key={marker.id}
            center={[marker.latitude, marker.longitude]}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#c87941', fillOpacity: 1 }}
            eventHandlers={marker.onClick || onMarkerClick ? {
              click: () => {
                if (marker.onClick) marker.onClick()
                else onMarkerClick?.(marker.id)
              },
            } : undefined}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{marker.label}</div>
                {marker.description && <div>{marker.description}</div>}
                {onMarkerClick && <button type="button" onClick={() => onMarkerClick(marker.id)} className="text-blue-700 underline">View listing</button>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md bg-white/95 px-2 py-1 text-[10px] text-gray-600 shadow">
        {hasLocation ? 'Property pin' : 'UIU campus'}
      </div>
    </div>
  )
}

export function InteractiveMap({
  onPin,
  pin,
}: {
  onPin: (location: GeoCoordinates) => void
  pin: GeoCoordinates | null
}) {
  return (
    <div className="relative isolate w-full overflow-hidden rounded-xl border border-gray-200" style={{ height: 350 }}>
      <MapContainer
        center={pin ? [pin.latitude, pin.longitude] : [UIU_CAMPUS.latitude, UIU_CAMPUS.longitude]}
        zoom={16}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[UIU_CAMPUS.latitude, UIU_CAMPUS.longitude]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#111827', fillOpacity: 1 }}
        >
          <Popup>United International University</Popup>
        </CircleMarker>
        {pin && (
          <CircleMarker
            center={[pin.latitude, pin.longitude]}
            radius={9}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#c87941', fillOpacity: 1 }}
          >
            <Popup>Selected property location</Popup>
          </CircleMarker>
        )}
        <MapClickHandler onPin={onPin} />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md bg-white/95 px-2 py-1 text-[10px] text-gray-600 shadow">
        Click the map to place the property pin
      </div>
    </div>
  )
}
