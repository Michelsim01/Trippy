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
            String url = UriComponentsBuilder
                .fromHttpUrl("https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json")
                .queryParam("access_token", mapboxAccessToken)
                .queryParam("limit", "5")
                .queryParam("types", "place,locality,neighborhood,address")
                .buildAndExpand(query)
                .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode features = root.get("features");
                
                if (features != null && features.isArray()) {
                    for (JsonNode feature : features) {
                        LocationSuggestionDTO suggestion = parseFeature(feature);
                        if (suggestion != null) {
                            suggestions.add(suggestion);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't throw exception to avoid breaking the flow
            System.err.println("Error calling MapBox API: " + e.getMessage());
        }
        
        return suggestions;
    }

    private LocationSuggestionDTO parseFeature(JsonNode feature) {
        try {
            String placeName = feature.get("place_name").asText();
            JsonNode geometry = feature.get("geometry");
            JsonNode coordinates = geometry.get("coordinates");
            
            // MapBox returns [longitude, latitude]
            BigDecimal longitude = new BigDecimal(coordinates.get(0).asText());
            BigDecimal latitude = new BigDecimal(coordinates.get(1).asText());
            
            // Extract country from context
            String country = extractCountry(feature);
            
            return new LocationSuggestionDTO(placeName, latitude, longitude, country);
        } catch (Exception e) {
            System.err.println("Error parsing MapBox feature: " + e.getMessage());
            return null;
        }
    }

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
            
            // Fallback: try to extract from place_name, but clean it up
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