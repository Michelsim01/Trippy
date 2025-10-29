import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox access token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const MapboxMap = ({ 
  latitude, 
  longitude, 
  locationName = 'Meeting Point',
  zoom = 14,
  className = '',
  height = '400px'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

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

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
    el.style.width = '32px';
    el.style.height = '40px';
    el.style.backgroundSize = '100%';
    el.style.cursor = 'pointer';

    // Add marker
    marker.current = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3 style="margin: 0; font-weight: 600; font-size: 14px;">${locationName}</h3>`)
      )
      .addTo(map.current);

    // Show popup on load
    marker.current.getPopup().addTo(map.current);

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, locationName, zoom]);

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
    <div 
      ref={mapContainer} 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  );
};

export default MapboxMap;
