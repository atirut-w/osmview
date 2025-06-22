import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'

// Fix for default marker icons in react-leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Component to save map position when it changes
function SaveMapPosition() {
  useMapEvents({
    moveend: (e) => {
      const map = e.target
      const center = map.getCenter()
      const zoom = map.getZoom()
      localStorage.setItem('mapPosition', JSON.stringify({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom
      }))
    }
  })
  return null
}

// Component to handle map center updates when position changes
function MapCenterUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13) // Zoom level 13 for better view of the area
    }
  }, [position, map])
  
  return null
}

interface MapProps {
  position: [number, number] | null;
  locationEnabled: boolean;
}

function Map({ position, locationEnabled }: MapProps) {
  // Get initial position from localStorage or use defaults
  let center: [number, number] = [0, 0]
  let zoom = 2
  
  try {
    const savedPosition = localStorage.getItem('mapPosition')
    if (savedPosition) {
      const parsed = JSON.parse(savedPosition)
      center = [parsed.lat, parsed.lng]
      zoom = parsed.zoom
    }
  } catch (e) {
    console.error('Error loading saved position:', e)
  }

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Move zoom control to right side
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && locationEnabled && (
          <Marker position={position}>
            <Popup>
              Your location<br />
              Latitude: {position[0].toFixed(4)}<br />
              Longitude: {position[1].toFixed(4)}
            </Popup>
          </Marker>
        )}
        {/* This component will update the map center when position changes */}
        {position && locationEnabled && <MapCenterUpdater position={position} />}
        
        {/* This component will save map position to localStorage */}
        <SaveMapPosition />
      </MapContainer>
    </div>
  )
}

export default Map
