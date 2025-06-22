import { useState, useEffect } from 'react'
import './App.css'
import Map from './components/Map'

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
      
      {/* Map component */}
      {mapReady && (
        <Map
          position={position}
          locationEnabled={locationEnabled}
        />
      )}
    </div>
  )
}

export default App
