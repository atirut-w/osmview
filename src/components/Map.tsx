import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'

// Fix for default marker icons in react-leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import type { OSMFeature } from './InfoSidebar'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Component to save map position and handle map clicks
function MapEventHandler({ onFeatureClick, selectedFeature }: {
  onFeatureClick: (feature: OSMFeature | null) => void,
  selectedFeature: OSMFeature | null
}) {
  // State to track the current marker and highlight layer
  const [currentMarker, setCurrentMarker] = useState<L.CircleMarker | null>(null);
  const [currentHighlight, setCurrentHighlight] = useState<L.Layer | null>(null);
  
  const map = useMapEvents({
    moveend: (e) => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      console.log(`Map position set to (${center.lat}, ${center.lng}, ${zoom})`);
      localStorage.setItem('mapPosition', JSON.stringify({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom
      }))
    },
    click: async (e) => {
      const { lat, lng } = e.latlng
      console.log(`Map clicked at (${lat}, ${lng})`)
      
      try {
        // Show loading indicator on the map
        const loadingIcon = L.divIcon({
          html: '<div class="loading-icon"></div>',
          className: 'loading-marker',
          iconSize: [20, 20]
        });
        
        const loadingMarker = L.marker([lat, lng], { icon: loadingIcon }).addTo(map);
        
        // Query OpenStreetMap data using Overpass API
        const radius = 20; // Search radius in meters (increased for better usability)
        
        // Create a simplified query that gets both nearby and enclosing features
        const overpassQuery = `
          [out:json];
          // First get nearby features
          (
            // POIs (nodes with tags)
            node(around:${radius},${lat},${lng})[~"^(amenity|shop|tourism|leisure|historic|building)$"~"."];
            
            // Buildings and areas
            way(around:${radius},${lat},${lng})[building];
            way(around:${radius},${lat},${lng})[amenity];
            way(around:${radius},${lat},${lng})[shop];
            way(around:${radius},${lat},${lng})[tourism];
            way(around:${radius},${lat},${lng})[leisure];
            
            // Named ways (streets, etc.)
            way(around:${radius},${lat},${lng})[name];
          );
          out body;
          
          // Then get enclosing features (separate query)
          is_in(${lat},${lng});
          out body;
          
          // Get all nodes for ways
          >;
          out body qt;
        `;
        
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        
        const response = await fetch(overpassUrl);
        const data = await response.json();
        
        // Remove loading indicator
        map.removeLayer(loadingMarker);
        
        // Log the number of elements found
        console.log(`Found ${data.elements?.length || 0} elements near click`);
        
        if (data.elements && data.elements.length > 0) {
          // Filter and score elements based on relevance
          const scoredElements = data.elements
            .filter((element: any) => {
              // Keep only elements with meaningful tags
              if (!element.tags || Object.keys(element.tags).length === 0) {
                return false;
              }
              
              // For ways, ensure they have nodes
              if (element.type === 'way' && (!element.nodes || element.nodes.length < 3)) {
                return false;
              }
              
              return true;
            })
            .map((element: any) => {
              let score = 0;
              
              // Score based on element type
              if (element.type === 'node') score += 5;
              else if (element.type === 'way') score += 3;
              else score += 1;
              
              // Score based on tags
              const tags = element.tags || {};
              
              // Highest priority: named POIs and buildings
              if (tags.name) score += 20;
              
              // Enclosing features get a big boost
              if (element._enclosing) score += 30;
              
              // Building types
              if (tags.building) score += 15;
              if (tags.amenity) score += 18;
              if (tags.shop) score += 18;
              if (tags.tourism) score += 17;
              if (tags.leisure) score += 16;
              if (tags.historic) score += 16;
              
              // Medium priority: infrastructure
              if (tags.highway && tags.highway !== 'service') score += 10;
              if (tags.railway) score += 10;
              if (tags.public_transport) score += 12;
              
              // Lower priority: other features
              if (tags.natural) score += 8;
              if (tags.landuse) score += 5;
              if (tags.water) score += 7;
              
              return { ...element, score };
            })
            .sort((a: any, b: any) => b.score - a.score);
          
          // Calculate distance for each element to the click point
          const elementsWithDistance = scoredElements.map((element: any) => {
            let distance = Infinity;
            
            if (element.type === 'node') {
              // For nodes, calculate direct distance
              distance = Math.sqrt(Math.pow(element.lat - lat, 2) + Math.pow(element.lon - lng, 2)) * 111000; // Convert to meters
            } else if (element.type === 'way' && element.nodes) {
              // For ways, find the closest node
              const nodes = data.elements.filter((e: any) =>
                e.type === 'node' && element.nodes.includes(e.id)
              );
              
              if (nodes.length > 0) {
                const nodeDistances = nodes.map((node: any) =>
                  Math.sqrt(Math.pow(node.lat - lat, 2) + Math.pow(node.lon - lng, 2)) * 111000
                );
                distance = Math.min(...nodeDistances);
              }
            }
            
            return { ...element, distance };
          });
          
          // Separate elements into nearby and enclosing features
          const nearbyFeatures: any[] = [];
          const enclosingFeatures: any[] = [];
          
          // Process elements to identify nearby vs enclosing features
          elementsWithDistance.forEach((element: any) => {
            // Check if this is an enclosing feature from the is_in query
            // We can identify this by checking for specific tags that would come from the is_in query
            const isEnclosing = element.tags && (
              // Check for administrative boundaries and exclude them
              !(element.tags.boundary === 'administrative' || element.tags.admin_level) &&
              // Check for building or amenity tags which are more likely to be what the user wants
              (element.tags.building || element.tags.amenity || element.tags.shop ||
               element.tags.tourism || element.tags.leisure)
            );
            
            // Filter out country and administrative boundaries
            const isAdministrativeBoundary = element.tags &&
              (element.tags.boundary === 'administrative' ||
               element.tags.admin_level !== undefined);
            
            // Also check if it's a very large feature (likely a country or large administrative area)
            const isVeryLarge = element.distance > 1000; // More than 1km away
            
            if (isEnclosing && !isVeryLarge && !isAdministrativeBoundary) {
              enclosingFeatures.push({ ...element, _enclosing: true });
            } else if (element.distance <= radius * 2 && !isAdministrativeBoundary) { // Only include truly nearby features
              nearbyFeatures.push(element);
            }
          });
          
          // Sort nearby features by distance first, then score
          nearbyFeatures.sort((a: any, b: any) => {
            // First prioritize by distance
            if (a.distance !== b.distance) {
              return a.distance - b.distance; // Closer features first
            }
            // Then by score
            return b.score - a.score;
          });
          
          // Sort enclosing features by size (smaller is better) and score
          enclosingFeatures.sort((a: any, b: any) => {
            // First prioritize by distance (proxy for size)
            if (a.distance !== b.distance) {
              return a.distance - b.distance; // Smaller features first
            }
            // Then by score
            return b.score - a.score;
          });
          
          // Log what we found
          console.log(`Found ${nearbyFeatures.length} nearby features and ${enclosingFeatures.length} enclosing features`);
          if (nearbyFeatures.length > 0) {
            console.log('Top nearby feature:', nearbyFeatures[0].tags?.name || nearbyFeatures[0].id);
          }
          if (enclosingFeatures.length > 0) {
            console.log('Top enclosing feature:', enclosingFeatures[0].tags?.name || enclosingFeatures[0].id);
          }
          
          // Select the best element based on the new logic:
          // 1. If a feature is both nearby and enclosing, prioritize it
          // 2. If there are no nearby features, pick the closest enclosing feature
          // 3. Otherwise, pick the closest nearby feature
          
          let bestElement = null;
          
          // Check if any feature is both nearby and enclosing
          // This would be a feature that's in the enclosing list but also has nodes near the click
          const bothNearbyAndEnclosing = enclosingFeatures.find((enclosing: any) =>
            nearbyFeatures.some((nearby: any) => nearby.id === enclosing.id)
          );
          
          if (bothNearbyAndEnclosing) {
            // Highest priority: feature that is both nearby and enclosing
            bestElement = bothNearbyAndEnclosing;
            console.log('Selected feature that is both nearby and enclosing');
          } else if (nearbyFeatures.length === 0 && enclosingFeatures.length > 0) {
            // No nearby features, pick the best enclosing feature
            bestElement = enclosingFeatures[0];
            console.log('Selected enclosing feature (no nearby features)');
          } else if (nearbyFeatures.length > 0) {
            // Pick the best nearby feature
            bestElement = nearbyFeatures[0];
            console.log('Selected nearby feature');
          } else if (enclosingFeatures.length > 0) {
            // Fallback to enclosing if that's all we have
            bestElement = enclosingFeatures[0];
            console.log('Selected enclosing feature (fallback)');
          }
          
          if (bestElement) {
            // Create a feature object
            const feature: OSMFeature = {
              id: bestElement.id,
              type: bestElement.type,
              tags: bestElement.tags || {},
              name: bestElement.tags?.name || null,
              displayName: bestElement.tags?.name || (bestElement.tags?.['addr:street'] ? 
                `${bestElement.tags?.['addr:housenumber'] || ''} ${bestElement.tags?.['addr:street']}` : null)
            };
          
            // Clean up previous markers and highlights
            if (currentMarker) {
              map.removeLayer(currentMarker);
            }
            if (currentHighlight) {
              map.removeLayer(currentHighlight);
            }
            
            // Create a marker at the click location
            const clickMarker = L.circleMarker([lat, lng], {
              radius: 5,
              color: '#ff4081',
              fillColor: '#ff4081',
              fillOpacity: 1,
              weight: 2
            }).addTo(map);
            
            // Save the new marker reference
            setCurrentMarker(clickMarker);
            
            // Highlight the feature on the map
            if (bestElement.type === 'way' && bestElement.nodes) {
              // Find the nodes for this way
              const wayNodes = data.elements.filter((e: any) =>
                e.type === 'node' && bestElement.nodes.includes(e.id)
              );
              
              if (wayNodes.length > 0) {
                // Filter out any nodes with missing lat or lng values
                const validNodes = wayNodes.filter((node: any) =>
                  typeof node.lat === 'number' && typeof node.lng === 'number'
                );
                
                if (validNodes.length > 2) { // Need at least 3 points for a polygon
                  const latlngs = validNodes.map((node: any) => [node.lat, node.lng]);
                
                  try {
                    // Use different styles based on the feature type
                    let highlightLayer: L.Layer;
                    
                    // Building or area
                    if (bestElement.tags.building ||
                        bestElement.tags.amenity ||
                        bestElement.tags.leisure ||
                        bestElement._enclosing) {
                      const polygonStyle = {
                        color: '#4285f4',
                        weight: 3,
                        fill: true,
                        fillColor: '#4285f4',
                        fillOpacity: 0.2,
                        dashArray: bestElement._enclosing ? '5, 5' : undefined // Dashed line for enclosing features
                      };
                      highlightLayer = L.polygon(latlngs, polygonStyle).addTo(map);
                    }
                    // Way (road, path, etc.)
                    else {
                      const lineStyle = {
                        color: '#4285f4',
                        weight: 5
                      };
                      highlightLayer = L.polyline(latlngs, lineStyle).addTo(map);
                    }
                    
                    // Save the highlight layer reference
                    setCurrentHighlight(highlightLayer);
                  } catch (error) {
                    console.error('Error highlighting feature:', error);
                    // No need to remove the marker automatically
                  }
                } else {
                  // Not enough valid nodes, but we'll keep the marker
                }
              } else {
                // No nodes found, but we'll keep the marker
              }
            }
            // For nodes (points)
            else if (bestElement.type === 'node') {
              // Make the click marker a bit larger for nodes
              map.removeLayer(clickMarker);
              const nodeMarker = L.circleMarker([bestElement.lat, bestElement.lon], {
                radius: 8,
                color: '#4285f4',
                fillColor: '#4285f4',
                fillOpacity: 0.6,
                weight: 2
              }).addTo(map);
              
              // Save the node marker reference
              setCurrentMarker(nodeMarker);
            }
            // For other types or if no geometry
            else {
              // Keep the click marker
            }
            
            onFeatureClick(feature);
          } else {
            // If no feature was selected but we have elements, try to use the first one with tags
            const fallbackElement = data.elements.find((e: any) => e.tags && Object.keys(e.tags).length > 0);
            
            if (fallbackElement) {
              const fallbackFeature: OSMFeature = {
                id: fallbackElement.id,
                type: fallbackElement.type,
                tags: fallbackElement.tags || {},
                name: fallbackElement.tags?.name || null,
                displayName: fallbackElement.tags?.name || `${fallbackElement.type} ${fallbackElement.id}`
              };
              
              console.log('Using fallback feature:', fallbackFeature);
              onFeatureClick(fallbackFeature);
            } else {
              console.log('No relevant features found at this location');
              onFeatureClick(null);
            }
          }
        } else {
          console.log('No features found at this location');
          onFeatureClick(null);
        }
      } catch (error) {
        console.error('Error fetching OSM data:', error);
        onFeatureClick(null);
      }
    }
  });
  
  // Effect to clean up markers when selectedFeature becomes null (sidebar closed)
  useEffect(() => {
    if (selectedFeature === null && (currentMarker || currentHighlight)) {
      if (currentMarker) {
        map.removeLayer(currentMarker);
        setCurrentMarker(null);
      }
      if (currentHighlight) {
        map.removeLayer(currentHighlight);
        setCurrentHighlight(null);
      }
    }
  }, [selectedFeature, map, currentMarker, currentHighlight]);
  
  return null;
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
  onFeatureClick: (feature: OSMFeature | null) => void;
  selectedFeature: OSMFeature | null;
}

function Map({ position, locationEnabled, onFeatureClick, selectedFeature }: MapProps) {
  // Get initial position from localStorage or use defaults
  let center: [number, number] = [0, 0]
  let zoom = 2
  
  try {
    const savedPosition = localStorage.getItem('mapPosition')
    if (savedPosition) {
      const parsed = JSON.parse(savedPosition)
      console.log(`Loaded saved position (${parsed.lat}, ${parsed.lng}, ${parsed.zoom})`)
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
        
        {/* This component will save map position and handle clicks */}
        <MapEventHandler onFeatureClick={onFeatureClick} selectedFeature={selectedFeature} />
      </MapContainer>
    </div>
  )
}

export default Map
