/**
 * Geo utilities for location-based operations
 */

// Bataan municipalities and their approximate coordinates
const BATAAN_MUNICIPALITIES = {
  'Abucay': { lat: 14.7278, lng: 120.5333 },
  'Bagac': { lat: 14.6000, lng: 120.4000 },
  'Balanga': { lat: 14.6757, lng: 120.536 }, // Capital city
  'Dinalupihan': { lat: 14.8667, lng: 120.4667 },
  'Hermosa': { lat: 14.8333, lng: 120.5000 },
  'Limay': { lat: 14.5667, lng: 120.6000 },
  'Mariveles': { lat: 14.4333, lng: 120.4833 },
  'Morong': { lat: 14.5333, lng: 120.2333 },
  'Orani': { lat: 14.8000, lng: 120.5333 },
  'Orion': { lat: 14.6167, lng: 120.5833 },
  'Pilar': { lat: 14.6667, lng: 120.5667 },
  'Samal': { lat: 14.7667, lng: 120.5333 }
};

// Popular barangays in Bataan with approximate coordinates
const BATAAN_BARANGAYS = {
  // Balanga City (most common)
  'Central': { lat: 14.6757, lng: 120.5360, municipality: 'Balanga' },
  'Poblacion': { lat: 14.6800, lng: 120.5400, municipality: 'Balanga' },
  'Bagong Nayon': { lat: 14.6650, lng: 120.5250, municipality: 'Balanga' },
  'Sibacan': { lat: 14.6900, lng: 120.5500, municipality: 'Balanga' },
  'Tuyo': { lat: 14.6600, lng: 120.5200, municipality: 'Balanga' },
  
  // Mariveles
  'Townsite': { lat: 14.4400, lng: 120.4900, municipality: 'Mariveles' },
  'San Carlos': { lat: 14.4200, lng: 120.4700, municipality: 'Mariveles' },
  
  // Limay
  'Reformista': { lat: 14.5700, lng: 120.6100, municipality: 'Limay' },
  'Kitang 2': { lat: 14.5600, lng: 120.5900, municipality: 'Limay' },
  
  // Orani
  'Sibul': { lat: 14.8100, lng: 120.5400, municipality: 'Orani' },
  'Wawa': { lat: 14.7900, lng: 120.5200, municipality: 'Orani' },
  
  // Add more as needed
};

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get coordinates for a barangay in Bataan
 * @param {string} barangay - Barangay name
 * @param {string} municipality - Municipality name (optional)
 * @returns {Object|null} Coordinates object {lat, lng} or null if not found
 */
export const getBarangayCoordinates = (barangay, municipality = null) => {
  // First try exact barangay match
  if (BATAAN_BARANGAYS[barangay]) {
    const coords = BATAAN_BARANGAYS[barangay];
    if (!municipality || coords.municipality === municipality) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }
  
  // If not found and municipality provided, return municipality center
  if (municipality && BATAAN_MUNICIPALITIES[municipality]) {
    return BATAAN_MUNICIPALITIES[municipality];
  }
  
  // Default to Balanga center if nothing found
  return BATAAN_MUNICIPALITIES['Balanga'];
};

/**
 * Get all municipalities in Bataan
 * @returns {Array} Array of municipality names
 */
export const getBataanMunicipalities = () => {
  return Object.keys(BATAAN_MUNICIPALITIES);
};

/**
 * Get barangays for a specific municipality
 * @param {string} municipality - Municipality name
 * @returns {Array} Array of barangay names
 */
export const getBarangaysByMunicipality = (municipality) => {
  return Object.keys(BATAAN_BARANGAYS).filter(
    barangay => BATAAN_BARANGAYS[barangay].municipality === municipality
  );
};

/**
 * Validate if coordinates are within Bataan bounds
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if within Bataan bounds
 */
export const isWithinBataan = (lat, lng) => {
  // Rough bounds of Bataan province
  const BATAAN_BOUNDS = {
    north: 14.9,
    south: 14.3,
    east: 120.7,
    west: 120.1
  };
  
  return lat >= BATAAN_BOUNDS.south && 
         lat <= BATAAN_BOUNDS.north && 
         lng >= BATAAN_BOUNDS.west && 
         lng <= BATAAN_BOUNDS.east;
};

/**
 * Find nearest providers within radius
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {Array} providers - Array of provider objects with location.coordinates
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array} Array of providers with distance info
 */
export const findNearbyProviders = (centerLat, centerLng, providers, radiusKm = 15) => {
  return providers
    .map(provider => {
      if (!provider.location?.coordinates?.latitude || !provider.location?.coordinates?.longitude) {
        return null;
      }
      
      const distance = calculateDistance(
        centerLat, 
        centerLng,
        provider.location.coordinates.latitude,
        provider.location.coordinates.longitude
      );
      
      return {
        ...provider,
        distance,
        distanceText: formatDistance(distance)
      };
    })
    .filter(provider => provider && provider.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km away`;
  } else {
    return `${Math.round(distance)}km away`;
  }
};

/**
 * Generate map bounds for a set of coordinates
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @returns {Object} Bounds object with northeast and southwest
 */
export const generateMapBounds = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    // Default to Bataan bounds
    return {
      northeast: { lat: 14.9, lng: 120.7 },
      southwest: { lat: 14.3, lng: 120.1 }
    };
  }
  
  const lats = coordinates.map(coord => coord.lat);
  const lngs = coordinates.map(coord => coord.lng);
  
  const bounds = {
    northeast: {
      lat: Math.max(...lats),
      lng: Math.max(...lngs)
    },
    southwest: {
      lat: Math.min(...lats),
      lng: Math.min(...lngs)
    }
  };
  
  // Add padding (about 2km)
  const padding = 0.02;
  bounds.northeast.lat += padding;
  bounds.northeast.lng += padding;
  bounds.southwest.lat -= padding;
  bounds.southwest.lng -= padding;
  
  return bounds;
};

/**
 * Geocode address string to coordinates (mock function)
 * In production, this would call Google Geocoding API
 * @param {string} address - Address string
 * @returns {Promise<Object>} Coordinates object {lat, lng}
 */
export const geocodeAddress = async (address) => {
  try {
    // Mock implementation - in real app, use Google Geocoding API
    const lowerAddress = address.toLowerCase();
    
    // Try to find municipality in address
    for (const [municipality, coords] of Object.entries(BATAAN_MUNICIPALITIES)) {
      if (lowerAddress.includes(municipality.toLowerCase())) {
        return coords;
      }
    }
    
    // Try to find barangay in address
    for (const [barangay, coords] of Object.entries(BATAAN_BARANGAYS)) {
      if (lowerAddress.includes(barangay.toLowerCase())) {
        return { lat: coords.lat, lng: coords.lng };
      }
    }
    
    // Default to Balanga if nothing found
    return BATAAN_MUNICIPALITIES['Balanga'];
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return BATAAN_MUNICIPALITIES['Balanga'];
  }
};

/**
 * Create GeoJSON point for MongoDB
 * @param {number} longitude 
 * @param {number} latitude 
 * @returns {Object} GeoJSON Point object
 */
export const createGeoJSONPoint = (longitude, latitude) => {
  return {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
};

/**
 * Get travel time estimate (mock)
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {string} Estimated travel time
 */
export const estimateTravelTime = (origin, destination) => {
  const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  
  // Simple estimation: assume 30km/h average speed in Bataan
  const hours = distance / 30;
  const minutes = Math.round(hours * 60);
  
  if (minutes < 60) {
    return `${minutes} min drive`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m drive`;
  }
};

export default {
  calculateDistance,
  getBarangayCoordinates,
  getBataanMunicipalities,
  getBarangaysByMunicipality,
  isWithinBataan,
  findNearbyProviders,
  formatDistance,
  generateMapBounds,
  geocodeAddress,
  createGeoJSONPoint,
  estimateTravelTime
}; 