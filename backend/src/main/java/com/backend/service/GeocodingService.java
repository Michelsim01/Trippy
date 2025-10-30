package com.backend.service;

import com.backend.dto.LocationSuggestionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for location search using Mapbox Search Box API.
 * 
 * This service uses Mapbox Search Box API (Permanent Endpoint)
 * to provide comprehensive location suggestions with coordinates.
 * Search Box API has more comprehensive and up-to-date location data.
 * 
 * API Documentation: https://docs.mapbox.com/api/search/search-box/
 */
@Service
public class GeocodingService {

    @Value("${mapbox.api.access-token}")
    private String mapboxAccessToken;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeocodingService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public List<LocationSuggestionDTO> searchLocations(String query) {
        List<LocationSuggestionDTO> suggestions = new ArrayList<>();
        
        try {
            // Using Mapbox Search Box API (Permanent Endpoint)
            // This endpoint provides comprehensive location data with coordinates in one call
            String url = UriComponentsBuilder
                .fromUriString("https://api.mapbox.com/search/searchbox/v1/forward")
                .queryParam("q", query)
                .queryParam("access_token", mapboxAccessToken)
                .queryParam("limit", "5")
                .queryParam("language", "en")
                .queryParam("types", "place,locality,neighborhood,address,poi,street")
                .build()
                .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode features = root.get("features");
                
                if (features != null && features.isArray()) {
                    for (JsonNode feature : features) {
                        LocationSuggestionDTO suggestionDTO = parseSearchBoxFeature(feature);
                        if (suggestionDTO != null) {
                            suggestions.add(suggestionDTO);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't throw exception to avoid breaking the flow
            System.err.println("Error calling MapBox Search Box API: " + e.getMessage());
            e.printStackTrace();
        }
        
        return suggestions;
    }

    private LocationSuggestionDTO parseSearchBoxFeature(JsonNode feature) {
        try {
            // Get the properties object which contains name and full_address
            JsonNode properties = feature.get("properties");
            if (properties == null) {
                System.err.println("No properties found in feature");
                return null;
            }
            
            String name = properties.has("name") ? properties.get("name").asText() : "";
            String fullAddress = properties.has("full_address") ? properties.get("full_address").asText() : name;
            
            // Use full_address for display (more complete), fallback to name
            String displayName = !fullAddress.isEmpty() ? fullAddress : name;
            
            // Get coordinates from the feature geometry
            JsonNode geometry = feature.get("geometry");
            if (geometry == null) {
                System.err.println("No geometry found in feature");
                return null;
            }
            
            JsonNode coordinates = geometry.get("coordinates");
            if (coordinates == null || !coordinates.isArray() || coordinates.size() < 2) {
                System.err.println("Invalid coordinates in feature");
                return null;
            }
            
            // MapBox returns [longitude, latitude]
            BigDecimal longitude = BigDecimal.valueOf(coordinates.get(0).asDouble());
            BigDecimal latitude = BigDecimal.valueOf(coordinates.get(1).asDouble());
            
            // Extract country from context
            String country = extractCountryFromSearchBox(feature, properties);
            
            return new LocationSuggestionDTO(displayName, latitude, longitude, country);
        } catch (Exception e) {
            System.err.println("Error parsing MapBox Search Box feature: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private String extractCountryFromSearchBox(JsonNode feature, JsonNode properties) {
        try {
            // Try to get country from context object (Search Box API structure)
            JsonNode context = properties.get("context");
            if (context != null) {
                JsonNode country = context.get("country");
                if (country != null && country.has("name")) {
                    return country.get("name").asText();
                }
            }
            
            // Fallback: try to extract from full_address
            if (properties.has("full_address")) {
                String fullAddress = properties.get("full_address").asText();
                String[] parts = fullAddress.split(", ");
                if (parts.length > 0) {
                    String lastPart = parts[parts.length - 1].trim();
                    
                    // Remove postal codes (digits and spaces) from the country name
                    String cleanCountry = lastPart.replaceAll("^\\d+\\s*", "").replaceAll("\\s+\\d+$", "").trim();
                    
                    // If the cleaned version is not empty, use it
                    if (!cleanCountry.isEmpty()) {
                        return cleanCountry;
                    }
                    
                    // Otherwise, try second to last part if available
                    if (parts.length > 1) {
                        return parts[parts.length - 2].trim();
                    }
                    
                    return lastPart;
                }
            }
            
            // Last fallback: try place_type or mapbox_id
            if (properties.has("place_formatted")) {
                String placeFormatted = properties.get("place_formatted").asText();
                String[] parts = placeFormatted.split(", ");
                if (parts.length > 0) {
                    return parts[parts.length - 1].trim();
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting country from Search Box: " + e.getMessage());
        }
        
        return "Unknown";
    }

    // Legacy method kept for reference - not used anymore
    @Deprecated
    private LocationSuggestionDTO parseFeature(JsonNode feature) {
        try {
            String placeName = feature.get("place_name").asText();
            
            // Get coordinates from the feature geometry
            JsonNode geometry = feature.get("geometry");
            if (geometry == null) {
                System.err.println("No geometry found in feature");
                return null;
            }
            
            JsonNode coordinates = geometry.get("coordinates");
            if (coordinates == null || !coordinates.isArray() || coordinates.size() < 2) {
                System.err.println("Invalid coordinates in feature");
                return null;
            }
            
            // MapBox returns [longitude, latitude]
            BigDecimal longitude = BigDecimal.valueOf(coordinates.get(0).asDouble());
            BigDecimal latitude = BigDecimal.valueOf(coordinates.get(1).asDouble());
            
            // Extract country from context
            String country = extractCountry(feature);
            
            return new LocationSuggestionDTO(placeName, latitude, longitude, country);
        } catch (Exception e) {
            System.err.println("Error parsing MapBox feature: " + e.getMessage());
            return null;
        }
    }

    // Legacy method kept for reference - not used anymore
    @Deprecated
    private String extractCountry(JsonNode feature) {
        try {
            JsonNode context = feature.get("context");
            if (context != null && context.isArray()) {
                for (JsonNode contextItem : context) {
                    String id = contextItem.get("id").asText();
                    if (id.startsWith("country.")) {
                        return contextItem.get("text").asText();
                    }
                }
            }
            
            // Fallback: try to extract from place_name
            String placeName = feature.get("place_name").asText();
            String[] parts = placeName.split(", ");
            if (parts.length > 0) {
                String lastPart = parts[parts.length - 1].trim();
                
                // Remove postal codes (digits and spaces) from the country name
                String cleanCountry = lastPart.replaceAll("^\\d+\\s*", "").replaceAll("\\s+\\d+$", "").trim();
                
                // If the cleaned version is not empty, use it
                if (!cleanCountry.isEmpty()) {
                    return cleanCountry;
                }
                
                // Otherwise, try second to last part if available
                if (parts.length > 1) {
                    return parts[parts.length - 2].trim();
                }
                
                return lastPart; // Fallback to original
            }
        } catch (Exception e) {
            System.err.println("Error extracting country: " + e.getMessage());
        }
        
        return "Unknown";
    }
}
