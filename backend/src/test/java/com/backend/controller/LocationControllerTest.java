package com.backend.controller;

import com.backend.dto.LocationSuggestionDTO;
import com.backend.service.GeocodingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for LocationController.
 * Tests location search functionality using geocoding service.
 */
@ExtendWith(MockitoExtension.class)
class LocationControllerTest {

    @Mock
    private GeocodingService geocodingService;

    @InjectMocks
    private LocationController locationController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(locationController).build();
    }

    @Test
    @DisplayName("Search locations should return suggestions for valid query")
    void testSearchLocations_Success() throws Exception {
        // Arrange
        String query = "Singapore";
        List<LocationSuggestionDTO> suggestions = Arrays.asList(
                createLocationSuggestion("Singapore", "Singapore", 1.3521, 103.8198),
                createLocationSuggestion("Singapore Zoo", "Singapore", 1.4043, 103.7930)
        );
        
        when(geocodingService.searchLocations(query)).thenReturn(suggestions);

        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].placeName").value("Singapore"))
                .andExpect(jsonPath("$[0].country").value("Singapore"))
                .andExpect(jsonPath("$[1].placeName").value("Singapore Zoo"));

        verify(geocodingService).searchLocations(query);
    }

    @Test
    @DisplayName("Search locations with empty query should return bad request")
    void testSearchLocations_EmptyQuery() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", ""))
                .andExpect(status().isBadRequest());

        verify(geocodingService, never()).searchLocations(any());
    }

    @Test
    @DisplayName("Search locations with null query should return bad request")
    void testSearchLocations_NullQuery() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/locations/search"))
                .andExpect(status().isBadRequest());

        verify(geocodingService, never()).searchLocations(any());
    }

    @Test
    @DisplayName("Search locations with whitespace only query should return bad request")
    void testSearchLocations_WhitespaceQuery() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", "   "))
                .andExpect(status().isBadRequest());

        verify(geocodingService, never()).searchLocations(any());
    }

    @Test
    @DisplayName("Search locations with short query should return empty list")
    void testSearchLocations_ShortQuery() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", "S"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(geocodingService, never()).searchLocations(any());
    }

    @Test
    @DisplayName("Search locations with valid query should trim whitespace")
    void testSearchLocations_TrimmedQuery() throws Exception {
        // Arrange
        String query = "  Singapore  ";
        String trimmedQuery = "Singapore";
        List<LocationSuggestionDTO> suggestions = Arrays.asList(
                createLocationSuggestion("Singapore", "Singapore", 1.3521, 103.8198)
        );
        
        when(geocodingService.searchLocations(trimmedQuery)).thenReturn(suggestions);

        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));

        verify(geocodingService).searchLocations(trimmedQuery);
    }

    @Test
    @DisplayName("Search locations should handle service exceptions gracefully")
    void testSearchLocations_ServiceException() throws Exception {
        // Arrange
        String query = "Singapore";
        when(geocodingService.searchLocations(query))
                .thenThrow(new RuntimeException("Geocoding service error"));

        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(geocodingService).searchLocations(query);
    }

    @Test
    @DisplayName("Search locations should return empty list when no suggestions found")
    void testSearchLocations_NoSuggestions() throws Exception {
        // Arrange
        String query = "NonExistentPlace";
        when(geocodingService.searchLocations(query)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(geocodingService).searchLocations(query);
    }

    @Test
    @DisplayName("Search locations should handle multiple word queries")
    void testSearchLocations_MultipleWords() throws Exception {
        // Arrange
        String query = "Marina Bay Singapore";
        List<LocationSuggestionDTO> suggestions = Arrays.asList(
                createLocationSuggestion("Marina Bay Sands", "Singapore", 1.2834, 103.8607)
        );
        
        when(geocodingService.searchLocations(query)).thenReturn(suggestions);

        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].placeName").value("Marina Bay Sands"));

        verify(geocodingService).searchLocations(query);
    }

    @Test
    @DisplayName("Search locations should handle special characters in query")
    void testSearchLocations_SpecialCharacters() throws Exception {
        // Arrange
        String query = "São Paulo";
        List<LocationSuggestionDTO> suggestions = Arrays.asList(
                createLocationSuggestion("São Paulo", "Brazil", -23.5505, -46.6333)
        );
        
        when(geocodingService.searchLocations(query)).thenReturn(suggestions);

        // Act & Assert
        mockMvc.perform(get("/api/locations/search")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].placeName").value("São Paulo"));

        verify(geocodingService).searchLocations(query);
    }

    /**
     * Helper method to create LocationSuggestionDTO objects for testing
     */
    private LocationSuggestionDTO createLocationSuggestion(String name, String country, 
                                                          double latitude, double longitude) {
        LocationSuggestionDTO suggestion = new LocationSuggestionDTO();
        suggestion.setPlaceName(name);
        suggestion.setCountry(country);
        suggestion.setLatitude(BigDecimal.valueOf(latitude));
        suggestion.setLongitude(BigDecimal.valueOf(longitude));
        return suggestion;
    }
}