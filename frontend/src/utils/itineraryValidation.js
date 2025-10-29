/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Parse duration string to minutes
 * @param {string} durationStr - Duration string like "30 minutes", "1.5 hours", "Full day"
 * @returns {number} Duration in minutes
 */
export function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;
  
  const str = durationStr.toLowerCase().trim();
  
  // Handle "Full day"
  if (str.includes('full day')) {
    return 8 * 60; // Assume 8 hours for a full day
  }
  
  // Extract number
  const numberMatch = str.match(/[\d.]+/);
  if (!numberMatch) return 0;
  
  const value = parseFloat(numberMatch[0]);
  
  // Check if it's hours or minutes
  if (str.includes('hour')) {
    return value * 60;
  } else if (str.includes('minute')) {
    return value;
  }
  
  return 0;
}

/**
 * Calculate total duration of all stops in the itinerary
 * @param {Array} itinerary - Array of itinerary items
 * @returns {number} Total duration in minutes
 */
export function calculateTotalItineraryDuration(itinerary) {
  return itinerary.reduce((total, item) => {
    // Only count stops (start and end points don't have duration)
    if (item.type === 'stop' && item.time) {
      return total + parseDurationToMinutes(item.time);
    }
    return total;
  }, 0);
}

/**
 * Calculate total experience duration from start and end datetime
 * @param {string} startDateTime - ISO datetime string
 * @param {string} endDateTime - ISO datetime string
 * @returns {number} Total duration in minutes
 */
export function calculateExperienceDuration(startDateTime, endDateTime) {
  if (!startDateTime || !endDateTime) return 0;
  
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return diffMinutes;
}

/**
 * Validate that itinerary total duration is less than experience duration
 * @param {Array} itinerary - Array of itinerary items
 * @param {string} startDateTime - ISO datetime string
 * @param {string} endDateTime - ISO datetime string
 * @returns {Object} { valid: boolean, message: string, itineraryMinutes: number, experienceMinutes: number }
 */
export function validateItineraryDuration(itinerary, startDateTime, endDateTime) {
  const itineraryMinutes = calculateTotalItineraryDuration(itinerary);
  const experienceMinutes = calculateExperienceDuration(startDateTime, endDateTime);
  
  if (experienceMinutes === 0) {
    return {
      valid: true,
      message: '',
      itineraryMinutes,
      experienceMinutes
    };
  }
  
  if (itineraryMinutes > experienceMinutes) {
    const itineraryHours = (itineraryMinutes / 60).toFixed(1);
    const experienceHours = (experienceMinutes / 60).toFixed(1);
    
    return {
      valid: false,
      message: `The total duration of all stops (${itineraryHours} hours) exceeds the experience duration (${experienceHours} hours). Please adjust the stop durations or extend the experience end time.`,
      itineraryMinutes,
      experienceMinutes
    };
  }
  
  return {
    valid: true,
    message: '',
    itineraryMinutes,
    experienceMinutes
  };
}

/**
 * Check for unrealistic distances between adjacent stops
 * @param {Array} itinerary - Array of itinerary items with latitude/longitude
 * @returns {Array} Array of warnings for stops that are too far apart
 */
export function checkAdjacentStopsDistance(itinerary) {
  const warnings = [];
  const DISTANCE_THRESHOLD_KM = 500; // Warn if adjacent stops are more than 500km apart
  
  for (let i = 0; i < itinerary.length - 1; i++) {
    const current = itinerary[i];
    const next = itinerary[i + 1];
    
    // Check if both items have coordinates
    if (current.latitude && current.longitude && next.latitude && next.longitude) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        next.latitude,
        next.longitude
      );
      
      if (distance > DISTANCE_THRESHOLD_KM) {
        warnings.push({
          fromIndex: i,
          toIndex: i + 1,
          fromLocation: current.location,
          toLocation: next.location,
          distance: Math.round(distance),
          fromType: current.type,
          toType: next.type
        });
      }
    }
  }
  
  return warnings;
}
