import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox access token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const MapboxMap = ({ 
  latitude, 
  longitude, 
  locationName = 'Meeting Point',
  itineraries = [], // Array of itinerary checkpoints
  zoom = 14,
  className = '',
  height = '400px'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine if this is a multi-stop experience
  const isMultiStop = itineraries && itineraries.length > 0;

  useEffect(() => {
    // Don't initialize if coordinates are missing
    if (!latitude || !longitude) {
      return;
    }

    // Initialize map only once
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding markers/routes
    map.current.on('load', () => {
      if (isMultiStop) {
        addMultiStopRoute();
      } else {
        addSingleMarker();
      }
    });

    // Cleanup
    return () => {
      // Remove all markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, locationName, zoom, isMultiStop]);

  // Update route when itineraries change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && isMultiStop) {
      // Clear existing markers and routes
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
      
      addMultiStopRoute();
    }
  }, [itineraries]);

  const addSingleMarker = () => {
    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
    el.style.width = '32px';
    el.style.height = '40px';
    el.style.backgroundSize = '100%';
    el.style.cursor = 'pointer';

    // Add marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3 style="margin: 0; font-weight: 600; font-size: 14px;">${locationName}</h3>`)
      )
      .addTo(map.current);

    // Show popup on load
    marker.getPopup().addTo(map.current);
    markers.current.push(marker);
  };

  const createNumberedMarker = (number, stopType, locationName) => {
    const el = document.createElement('div');
    el.className = 'numbered-marker';
    
    // Different colors based on stop type
    let bgColor = '#3b82f6'; // blue for regular stops
    let label = number;
    
    if (stopType === 'start') {
      bgColor = '#10b981'; // green
      label = 'START';
    } else if (stopType === 'end') {
      bgColor = '#ef4444'; // red
      label = 'END';
    }
    
    el.style.cssText = `
      background-color: ${bgColor};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${stopType === 'start' || stopType === 'end' ? '8px' : '14px'};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
    `;
    el.textContent = label;
    
    return el;
  };

  const addMultiStopRoute = async () => {
    if (!itineraries || itineraries.length === 0) return;

    setLoading(true);
    setError(null);

    console.log('🗺️ MapboxMap - Raw itineraries data:', itineraries);

    try {
      // Extract coordinates from itineraries
      // Note: itineraries should have latitude and longitude fields
      const checkpoints = itineraries
        .filter(item => {
          const hasCoords = item.latitude && item.longitude;
          if (!hasCoords) {
            console.warn('⚠️ Missing coordinates for checkpoint:', item);
          }
          return hasCoords;
        })
        .sort((a, b) => a.stopOrder - b.stopOrder);

      console.log('🗺️ MapboxMap - Filtered checkpoints with coordinates:', checkpoints);

      if (checkpoints.length === 0) {
        console.warn('⚠️ No checkpoints with valid coordinates found, falling back to single marker');
        // No coordinates in itineraries, fall back to single marker
        addSingleMarker();
        setLoading(false);
        return;
      }

      // Add numbered markers for each checkpoint
      checkpoints.forEach((checkpoint, index) => {
        console.log(`📍 Adding marker ${index + 1}:`, {
          name: checkpoint.locationName,
          type: checkpoint.stopType,
          lat: checkpoint.latitude,
          lng: checkpoint.longitude
        });

        const el = createNumberedMarker(
          index + 1,
          checkpoint.stopType,
          checkpoint.locationName
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat([checkpoint.longitude, checkpoint.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="font-family: 'Poppins', sans-serif;">
                  <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">
                    ${checkpoint.locationName}
                  </h3>
                  ${checkpoint.duration && checkpoint.stopType !== 'start' && checkpoint.stopType !== 'end' 
                    ? `<p style="margin: 0; font-size: 12px; color: #666;">${checkpoint.duration}</p>` 
                    : ''}
                </div>
              `)
          )
          .addTo(map.current);

        markers.current.push(marker);
        console.log(`✅ Marker ${index + 1} added successfully`);
      });

      // Fetch and draw route if there are at least 2 checkpoints
      if (checkpoints.length >= 2) {
        await fetchAndDrawRoute(checkpoints);
      }

      // Fit map to show all markers
      const bounds = new mapboxgl.LngLatBounds();
      checkpoints.forEach(checkpoint => {
        bounds.extend([checkpoint.longitude, checkpoint.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15
      });

    } catch (err) {
      console.error('Error adding multi-stop route:', err);
      setError('Failed to load route information');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndDrawRoute = async (checkpoints) => {
    try {
      // Build coordinates string for Mapbox Directions API
      const coordinates = checkpoints
        .map(cp => `${cp.longitude},${cp.latitude}`)
        .join(';');

      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;

        // Add route source and layer
        if (map.current.getSource('route')) {
          map.current.getSource('route').setData({
            type: 'Feature',
            properties: {},
            geometry: route
          });
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.75
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      // Don't throw - just log the error and continue without route line
    }
  };

  // If no coordinates, show placeholder
  if (!latitude || !longitude) {
    return (
      <div 
        className={`flex items-center justify-center bg-neutrals-6 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-neutrals-4">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Location coordinates not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className={`rounded-lg overflow-hidden ${className}`}
        style={{ height }}
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-2 right-2 bg-white px-3 py-2 rounded-md shadow-md flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-1 border-t-transparent"></div>
          <span className="text-xs text-neutrals-3">Loading route...</span>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="absolute top-2 right-2 bg-red-50 px-3 py-2 rounded-md shadow-md">
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
      
      {/* Route info badge for multi-stop */}
      {isMultiStop && itineraries.length > 0 && !loading && (
        <div className="absolute bottom-2 left-2 bg-white px-3 py-2 rounded-md shadow-md">
          <span className="text-xs font-medium text-neutrals-2">
            {itineraries.length} stops • Walking route
          </span>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
