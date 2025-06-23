import { Paper, Typography, IconButton, Box, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import TabbedView from './TabbedView';
import './InfoSidebar.css';

export interface OSMFeature {
  id: number;
  type: string;
  tags: Record<string, string>;
  name?: string;
  displayName?: string;
}

interface InfoSidebarProps {
  feature: OSMFeature | null;
  onClose: () => void;
}

const InfoSidebar = ({ feature, onClose }: InfoSidebarProps) => {
  const [isClosing, setIsClosing] = useState(false);
  
  if (!feature) return null;

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Format the feature name for display
  const featureName = feature.name || feature.tags?.name || feature.tags?.['addr:street'] || 
                     (feature.type === 'node' ? 'Point' : 
                      feature.type === 'way' ? 'Area/Road' : 
                      feature.type === 'relation' ? 'Relation' : 'Unknown');

  // Get a readable feature type without emojis
  const getFeatureType = () => {
    const tags = feature.tags;
    
    // Amenities
    if (tags?.amenity) {
      const amenity = tags.amenity.replace(/_/g, ' ');
      switch (tags.amenity) {
        case 'restaurant': return 'Restaurant';
        case 'cafe': return 'Cafe';
        case 'bar': return 'Bar';
        case 'fast_food': return 'Fast Food';
        case 'bank': return 'Bank';
        case 'atm': return 'ATM';
        case 'pharmacy': return 'Pharmacy';
        case 'hospital': return 'Hospital';
        case 'school': return 'School';
        case 'university': return 'University';
        case 'library': return 'Library';
        case 'place_of_worship': return 'Place of Worship';
        case 'fuel': return 'Gas Station';
        case 'parking': return 'Parking';
        default: return amenity.charAt(0).toUpperCase() + amenity.slice(1);
      }
    }
    
    // Shops
    if (tags?.shop) {
      const shop = tags.shop.replace(/_/g, ' ');
      switch (tags.shop) {
        case 'supermarket': return 'Supermarket';
        case 'convenience': return 'Convenience Store';
        case 'clothes': return 'Clothing Store';
        case 'bakery': return 'Bakery';
        case 'butcher': return 'Butcher';
        case 'hardware': return 'Hardware Store';
        case 'electronics': return 'Electronics Store';
        case 'car': return 'Car Dealership';
        default: return shop.charAt(0).toUpperCase() + shop.slice(1);
      }
    }
    
    // Offices
    if (tags?.office) {
      const office = tags.office.replace(/_/g, ' ');
      switch (tags.office) {
        case 'company': return 'Company Office';
        case 'government': return 'Government Office';
        case 'lawyer': return 'Law Office';
        case 'estate_agent': return 'Real Estate Office';
        case 'insurance': return 'Insurance Office';
        case 'it': return 'IT Office';
        case 'financial': return 'Financial Office';
        case 'accountant': return 'Accounting Office';
        case 'architect': return 'Architecture Office';
        case 'consulting': return 'Consulting Office';
        case 'employment_agency': return 'Employment Agency';
        case 'travel_agent': return 'Travel Agency';
        case 'telecommunication': return 'Telecommunications Office';
        default: return `${office.charAt(0).toUpperCase() + office.slice(1)} Office`;
      }
    }
    
    // Tourism
    if (tags?.tourism) {
      const tourism = tags.tourism.replace(/_/g, ' ');
      switch (tags.tourism) {
        case 'hotel': return 'Hotel';
        case 'attraction': return 'Attraction';
        case 'museum': return 'Museum';
        case 'viewpoint': return 'Viewpoint';
        case 'apartment': return 'Apartment';
        default: return tourism.charAt(0).toUpperCase() + tourism.slice(1);
      }
    }
    
    // Power infrastructure
    if (tags?.power) {
      const power = tags.power.replace(/_/g, ' ');
      switch (tags.power) {
        case 'substation': return 'Power Substation';
        case 'line': return 'Power Line';
        case 'tower': return 'Power Tower';
        default: return `Power ${power.charAt(0).toUpperCase() + power.slice(1)}`;
      }
    }
    
    // Roads and highways
    if (tags?.highway) {
      const highway = tags.highway.replace(/_/g, ' ');
      switch (tags.highway) {
        case 'motorway': return 'Motorway';
        case 'trunk': return 'Trunk Road';
        case 'primary': return 'Primary Road';
        case 'secondary': return 'Secondary Road';
        case 'residential': return 'Residential Street';
        case 'footway': return 'Footpath';
        case 'cycleway': return 'Cycle Path';
        default: return highway.charAt(0).toUpperCase() + highway.slice(1);
      }
    }
    
    // Buildings
    if (tags?.building) {
      if (tags.building === 'yes') {
        if (tags?.amenity || tags?.shop || tags?.tourism) {
          return 'Building';
        }
        return tags?.name ? 'Building' : 'Unnamed Building';
      }
      return tags.building.replace(/_/g, ' ').charAt(0).toUpperCase() + tags.building.replace(/_/g, ' ').slice(1);
    }
    
    // Natural features
    if (tags?.natural) {
      const natural = tags.natural.replace(/_/g, ' ');
      switch (tags.natural) {
        case 'water': return 'Water';
        case 'wood': return 'Forest';
        case 'tree': return 'Tree';
        case 'peak': return 'Mountain Peak';
        default: return natural.charAt(0).toUpperCase() + natural.slice(1);
      }
    }
    
    // Leisure
    if (tags?.leisure) {
      const leisure = tags.leisure.replace(/_/g, ' ');
      switch (tags.leisure) {
        case 'park': return 'Park';
        case 'playground': return 'Playground';
        case 'sports_centre': return 'Sports Center';
        case 'stadium': return 'Stadium';
        default: return leisure.charAt(0).toUpperCase() + leisure.slice(1);
      }
    }
    
    // Historic
    if (tags?.historic) {
      const historic = tags.historic.replace(/_/g, ' ');
      return `Historic ${historic.charAt(0).toUpperCase() + historic.slice(1)}`;
    }
    
    // Fallback to element type
    return feature.type === 'node' ? 'Point' :
           feature.type === 'way' ? 'Way' :
           feature.type === 'relation' ? 'Relation' : 'Unknown';
  };

  // Get detailed address information
  const getAddressInfo = () => {
    const tags = feature.tags;
    const addressParts = [];
    
    if (tags?.['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
    if (tags?.['addr:street']) addressParts.push(tags['addr:street']);
    if (tags?.['addr:place']) addressParts.push(tags['addr:place']);
    if (tags?.['addr:subdistrict']) addressParts.push(tags['addr:subdistrict']);
    if (tags?.['addr:district']) addressParts.push(tags['addr:district']);
    if (tags?.['addr:province']) addressParts.push(tags['addr:province']);
    if (tags?.['addr:postcode']) addressParts.push(tags['addr:postcode']);
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  // Get operator information
  const getOperatorInfo = () => {
    const tags = feature.tags;
    if (tags?.operator) {
      return {
        name: tags.operator,
        nameEn: tags['operator:en'],
        nameTh: tags['operator:th'],
        short: tags['operator:short']
      };
    }
    return null;
  };

  // Filter out tags that are shown in overview or are not useful to display
  const excludedTags = [
    'name', 'source', 'created_by', 'id', 'type',
    'source:date', 'source:name', 'attribution', 'created_by',
    'note', 'fixme', 'FIXME', 'description',
    // Address tags (shown in overview)
    'addr:housenumber', 'addr:street', 'addr:place', 'addr:subdistrict',
    'addr:district', 'addr:province', 'addr:postcode', 'address',
    // Contact info (shown in overview)
    'website', 'phone', 'opening_hours',
    // Operator info (shown in overview)
    'operator', 'operator:en', 'operator:th', 'operator:short',
    // Brand info (shown in overview)
    'brand',
    // Technical tags not useful for general users
    'layer'
  ];
  const filteredTags = Object.entries(feature.tags || {}).filter(
    ([key]) => !excludedTags.includes(key)
  );

  const renderOverviewTab = () => {
    const addressInfo = getAddressInfo();
    const operatorInfo = getOperatorInfo();
    
    return (
      <Box className="tab-content">
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            {getFeatureType()}
          </Typography>
          
          {/* Brand Information */}
          {feature.tags?.brand && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                Brand
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {feature.tags.brand}
              </Typography>
            </Box>
          )}
          
          {/* Operator Information */}
          {operatorInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                Operator
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {operatorInfo.name}
              </Typography>
              {operatorInfo.nameEn && operatorInfo.nameEn !== operatorInfo.name && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                  {operatorInfo.nameEn}
                </Typography>
              )}
              {operatorInfo.short && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  ({operatorInfo.short})
                </Typography>
              )}
            </Box>
          )}
          
          {/* Contact Information */}
          {(feature.tags?.website || feature.tags?.phone) && (
            <Box sx={{ mb: 2 }}>
              {feature.tags?.website && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Website:</strong>{' '}
                  <a
                    href={feature.tags.website.startsWith('http') ? feature.tags.website : `https://${feature.tags.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {feature.tags.website}
                  </a>
                </Typography>
              )}
              
              {feature.tags?.phone && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Phone:</strong> {feature.tags.phone}
                </Typography>
              )}
            </Box>
          )}
          
          {/* Hours */}
          {feature.tags?.opening_hours && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Hours:</strong> {feature.tags.opening_hours}
              </Typography>
            </Box>
          )}
          
          {/* Address Information */}
          {addressInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                Address
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                {addressInfo}
              </Typography>
            </Box>
          )}
          
          {/* Technical specifications for power infrastructure */}
          {feature.tags?.power && (
            <Box sx={{ mb: 2 }}>
              {feature.tags?.substation && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Substation Type:</strong> {feature.tags.substation.replace(/_/g, ' ')}
                </Typography>
              )}
              {feature.tags?.voltage && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Voltage:</strong> {feature.tags.voltage} V
                </Typography>
              )}
            </Box>
          )}
          
          {/* Internet access */}
          {feature.tags?.internet_access && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Internet Access:</strong> {feature.tags.internet_access === 'wlan' ? 'WiFi' : feature.tags.internet_access}
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            OSM ID: {feature.id} ({feature.type})
          </Typography>
        </Box>
        
        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <a
              href={`https://www.openstreetmap.org/${feature.type}/${feature.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              View on OpenStreetMap
            </a>
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderPropertiesTab = () => (
    <Box className="tab-content">
      {filteredTags.length > 0 ? (
        <List dense>
          {filteredTags.map(([key, value]) => (
            <ListItem key={key} disablePadding sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Chip
                      label={key.replace(/:/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, minWidth: '80px' }}
                    />
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', flex: 1 }}>
                      {value}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          No additional properties available
        </Typography>
      )}
    </Box>
  );

  return (
    <Paper className={`info-sidebar ${isClosing ? 'closing' : ''}`} elevation={3}>
      <Box className="sidebar-header">
        <Typography variant="h6" component="h2" sx={{ flex: 1, pr: 1 }}>
          {feature.displayName || featureName}
        </Typography>
        <IconButton aria-label="close" onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <TabbedView
        tabs={[
          {
            label: "Overview",
            content: renderOverviewTab()
          },
          {
            label: "Properties",
            content: renderPropertiesTab()
          }
        ]}
        tabsClassName="sidebar-tabs"
        contentClassName="sidebar-content"
      />
    </Paper>
  );
};

export default InfoSidebar;
