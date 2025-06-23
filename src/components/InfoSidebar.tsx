import { Paper, Typography, IconButton, Box, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  if (!feature) return null;

  // Format the feature name for display
  const featureName = feature.name || feature.tags?.name || feature.tags?.['addr:street'] || 
                     (feature.type === 'node' ? 'Point' : 
                      feature.type === 'way' ? 'Area/Road' : 
                      feature.type === 'relation' ? 'Relation' : 'Unknown');

  // Get a readable feature type with icon emoji
  const getFeatureType = () => {
    const tags = feature.tags;
    
    // Amenities
    if (tags?.amenity) {
      const amenity = tags.amenity.replace(/_/g, ' ');
      switch (tags.amenity) {
        case 'restaurant': return '🍽️ Restaurant';
        case 'cafe': return '☕ Cafe';
        case 'bar': return '🍸 Bar';
        case 'fast_food': return '🍔 Fast Food';
        case 'bank': return '🏦 Bank';
        case 'atm': return '💳 ATM';
        case 'pharmacy': return '💊 Pharmacy';
        case 'hospital': return '🏥 Hospital';
        case 'school': return '🏫 School';
        case 'university': return '🎓 University';
        case 'library': return '📚 Library';
        case 'place_of_worship': return '🙏 Place of Worship';
        case 'fuel': return '⛽ Gas Station';
        case 'parking': return '🅿️ Parking';
        default: return `🏢 ${amenity.charAt(0).toUpperCase() + amenity.slice(1)}`;
      }
    }
    
    // Shops
    if (tags?.shop) {
      const shop = tags.shop.replace(/_/g, ' ');
      switch (tags.shop) {
        case 'supermarket': return '🛒 Supermarket';
        case 'convenience': return '🏪 Convenience Store';
        case 'clothes': return '👕 Clothing Store';
        case 'bakery': return '🥖 Bakery';
        case 'butcher': return '🥩 Butcher';
        case 'hardware': return '🔨 Hardware Store';
        case 'electronics': return '📱 Electronics Store';
        default: return `🛍️ ${shop.charAt(0).toUpperCase() + shop.slice(1)}`;
      }
    }
    
    // Tourism
    if (tags?.tourism) {
      const tourism = tags.tourism.replace(/_/g, ' ');
      switch (tags.tourism) {
        case 'hotel': return '🏨 Hotel';
        case 'attraction': return '🎭 Attraction';
        case 'museum': return '🏛️ Museum';
        case 'viewpoint': return '🌄 Viewpoint';
        default: return `🧳 ${tourism.charAt(0).toUpperCase() + tourism.slice(1)}`;
      }
    }
    
    // Roads and highways
    if (tags?.highway) {
      const highway = tags.highway.replace(/_/g, ' ');
      switch (tags.highway) {
        case 'motorway': return '🛣️ Motorway';
        case 'trunk': return '🛣️ Trunk Road';
        case 'primary': return '🛣️ Primary Road';
        case 'secondary': return '🛣️ Secondary Road';
        case 'residential': return '🏘️ Residential Street';
        case 'footway': return '👣 Footpath';
        case 'cycleway': return '🚲 Cycle Path';
        default: return `🛣️ ${highway.charAt(0).toUpperCase() + highway.slice(1)}`;
      }
    }
    
    // Buildings
    if (tags?.building) {
      if (tags.building === 'yes') {
        if (tags?.amenity || tags?.shop || tags?.tourism) {
          return '🏢 Building';
        }
        return tags?.name ? '🏢 Building' : '🏢 Unnamed Building';
      }
      return `🏢 ${tags.building.replace(/_/g, ' ').charAt(0).toUpperCase() + tags.building.replace(/_/g, ' ').slice(1)}`;
    }
    
    // Natural features
    if (tags?.natural) {
      const natural = tags.natural.replace(/_/g, ' ');
      switch (tags.natural) {
        case 'water': return '💧 Water';
        case 'wood': return '🌳 Forest';
        case 'tree': return '🌲 Tree';
        case 'peak': return '🏔️ Mountain Peak';
        default: return `🌿 ${natural.charAt(0).toUpperCase() + natural.slice(1)}`;
      }
    }
    
    // Leisure
    if (tags?.leisure) {
      const leisure = tags.leisure.replace(/_/g, ' ');
      switch (tags.leisure) {
        case 'park': return '🏞️ Park';
        case 'playground': return '🛝 Playground';
        case 'sports_centre': return '🏊 Sports Center';
        case 'stadium': return '🏟️ Stadium';
        default: return `🎾 ${leisure.charAt(0).toUpperCase() + leisure.slice(1)}`;
      }
    }
    
    // Historic
    if (tags?.historic) {
      const historic = tags.historic.replace(/_/g, ' ');
      return `🏛️ Historic ${historic.charAt(0).toUpperCase() + historic.slice(1)}`;
    }
    
    // Fallback to element type
    return feature.type === 'node' ? '📍 Point' :
           feature.type === 'way' ? '➖ Way' :
           feature.type === 'relation' ? '🔄 Relation' : 'Unknown';
  };

  // Filter out some common tags that aren't useful to display
  const excludedTags = [
    'name', 'source', 'created_by', 'id', 'type',
    'source:date', 'source:name', 'attribution', 'created_by',
    'note', 'fixme', 'FIXME', 'description'
  ];
  const filteredTags = Object.entries(feature.tags || {}).filter(
    ([key]) => !excludedTags.includes(key)
  );

  return (
    <Paper className="info-sidebar" elevation={3}>
      <Box className="sidebar-header">
        <Typography variant="h6" component="h2">
          {feature.displayName || featureName}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <Box className="sidebar-content">
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {getFeatureType()}
          </Typography>
          
          {feature.tags?.website && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <a
                href={feature.tags.website.startsWith('http') ? feature.tags.website : `https://${feature.tags.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
            </Typography>
          )}
          
          {feature.tags?.phone && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              📞 {feature.tags.phone}
            </Typography>
          )}
          
          {feature.tags?.opening_hours && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              ⏰ {feature.tags.opening_hours}
            </Typography>
          )}
          
          {(feature.tags?.address || feature.tags?.['addr:street']) && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              📍 {feature.tags.address ||
                  (feature.tags?.['addr:housenumber'] && feature.tags?.['addr:street'] ?
                    `${feature.tags['addr:housenumber']} ${feature.tags['addr:street']}` :
                    feature.tags?.['addr:street'] || '')}
              {feature.tags?.['addr:city'] ? `, ${feature.tags['addr:city']}` : ''}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            OSM ID: {feature.id} ({feature.type})
          </Typography>
        </Box>

        {filteredTags.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Properties</Typography>
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
          </>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
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
    </Paper>
  );
};

export default InfoSidebar;
