import { useState, useEffect } from 'react'
import './App.css'
import Map from './components/Map'
import InfoSidebar from './components/InfoSidebar'
import type { OSMFeature } from './components/InfoSidebar'

// Material UI imports
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Paper, Typography, CircularProgress, Alert, Fab, Tooltip } from '@mui/material'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285f4',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<OSMFeature | null>(null)

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

  const handleFeatureClick = (feature: OSMFeature | null) => {
    setSelectedFeature(feature);
  }

  const handleSidebarClose = () => {
    setSelectedFeature(null);
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="app-container">
        {/* Overlay for title and status messages */}
        <Paper elevation={3} className="overlay">
          <Typography variant="h5" component="h1">OSM Viewer</Typography>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading your location...</Typography>
            </div>
          )}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Paper>
        
        {/* Location toggle button */}
        <Tooltip title={locationEnabled ? "Disable location" : "Enable location"}>
          <span style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000 }}>
            <Fab
              color={locationEnabled ? "primary" : "default"}
              size="medium"
              onClick={handleLocationToggle}
              disabled={loading}
              aria-label="location"
            >
              {loading ? <CircularProgress size={24} /> : <MyLocationIcon />}
            </Fab>
          </span>
        </Tooltip>
        
        {/* Map component */}
        {mapReady && (
          <Map
            position={position}
            locationEnabled={locationEnabled}
            onFeatureClick={handleFeatureClick}
            selectedFeature={selectedFeature}
          />
        )}

        {/* Info sidebar */}
        <InfoSidebar
          feature={selectedFeature}
          onClose={handleSidebarClose}
        />
      </div>
    </ThemeProvider>
  )
}

export default App
