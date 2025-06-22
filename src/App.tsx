import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

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

function App() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Default map center (0,0) until we get a location
  useEffect(() => {
    setMapReady(true)
  }, [])

  const handleLocationToggle = () => {
    if (locationEnabled) {
      // Disable location tracking
      setLocationEnabled(false)
      return
    }

    // Enable location tracking
    setLocationEnabled(true)
    setLoading(true)
    setError(null)

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          setPosition(newPosition)
          setLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Unable to get your location. Please enable location services.')
          setLoading(false)
          setLocationEnabled(false)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      setLocationEnabled(false)
    }
  }

  return (
    <div className="app-container">
      {/* Overlay for title and status messages */}
      <div className="overlay">
        <h1>OSM Viewer</h1>
        {loading && <p>Loading your location...</p>}
        {error && <p className="error">{error}</p>}
      </div>
      
      {/* Location toggle button */}
      <button 
        className={`location-toggle ${locationEnabled ? 'active' : ''}`}
        onClick={handleLocationToggle}
        disabled={loading}
        title={locationEnabled ? "Disable location" : "Enable location"}
      >
        {loading ? '⏳' : '📍'}
      </button>
      
      {/* Map container */}
      <div className="map-container">
        {mapReady && (
          <MapContainer 
            center={[0, 0]} 
            zoom={2} 
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
          </MapContainer>
        )}
      </div>
    </div>
  )
}

export default App
