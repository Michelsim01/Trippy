package com.backend.service;

import com.backend.dto.LocationSuggestionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeocodingServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GeocodingService geocodingService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        ReflectionTestUtils.setField(geocodingService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(geocodingService, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(geocodingService, "mapboxAccessToken", "test-token");
    }

    @Test
    void testSearchLocations_ValidQuery_ReturnsLocationSuggestions() {
        // Arrange
        String query = "Singapore";
        String mockResponse = """
            {
                "features": [
                    {
                        "place_name": "Singapore, Singapore",
                        "geometry": {
                            "coordinates": [103.8198, 1.3521]
                        },
                        "context": [
                            {
                                "id": "country.123",
                                "text": "Singapore"
                            }
                        ]
                    }
                ]
            }
            """;

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

        // Act
        List<LocationSuggestionDTO> result = geocodingService.searchLocations(query);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        
        LocationSuggestionDTO suggestion = result.get(0);
        assertEquals("Singapore, Singapore", suggestion.getPlaceName());
        assertEquals(new BigDecimal("1.3521"), suggestion.getLatitude());
        assertEquals(new BigDecimal("103.8198"), suggestion.getLongitude());
        assertEquals("Singapore", suggestion.getCountry());

        verify(restTemplate).getForObject(anyString(), eq(String.class));
    }

    @Test
    void testSearchLocations_EmptyResponse_ReturnsEmptyList() {
        // Arrange
        String query = "NonExistentPlace";
        String mockResponse = """
            {
                "features": []
            }
            """;

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

        // Act
        List<LocationSuggestionDTO> result = geocodingService.searchLocations(query);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(restTemplate).getForObject(anyString(), eq(String.class));
    }

    @Test
    void testSearchLocations_NullResponse_ReturnsEmptyList() {
        // Arrange
        String query = "TestQuery";

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(null);

        // Act
        List<LocationSuggestionDTO> result = geocodingService.searchLocations(query);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(restTemplate).getForObject(anyString(), eq(String.class));
    }

    @Test
    void testSearchLocations_ApiException_ReturnsEmptyList() {
        // Arrange
        String query = "TestQuery";

        when(restTemplate.getForObject(anyString(), eq(String.class)))
            .thenThrow(new RuntimeException("API Error"));

        // Act
        List<LocationSuggestionDTO> result = geocodingService.searchLocations(query);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(restTemplate).getForObject(anyString(), eq(String.class));
    }

    @Test
    void testSearchLocations_MultipleResults_ReturnsAllSuggestions() {
        // Arrange
        String query = "New York";
        String mockResponse = """
            {
                "features": [
                    {
                        "place_name": "New York, New York, United States",
                        "geometry": {
                            "coordinates": [-74.0060, 40.7128]
                        },
                        "context": [
                            {
                                "id": "country.456",
                                "text": "United States"
                            }
                        ]
                    },
                    {
                        "place_name": "New York, United Kingdom",
                        "geometry": {
                            "coordinates": [-0.1276, 51.5074]
                        },
                        "context": [
                            {
                                "id": "country.789",
                                "text": "United Kingdom"
                            }
                        ]
                    }
                ]
            }
            """;

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

        // Act
        List<LocationSuggestionDTO> result = geocodingService.searchLocations(query);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        
        LocationSuggestionDTO firstSuggestion = result.get(0);
        assertEquals("New York, New York, United States", firstSuggestion.getPlaceName());
        assertEquals("United States", firstSuggestion.getCountry());
        
        LocationSuggestionDTO secondSuggestion = result.get(1);
        assertEquals("New York, United Kingdom", secondSuggestion.getPlaceName());
        assertEquals("United Kingdom", secondSuggestion.getCountry());

        verify(restTemplate).getForObject(anyString(), eq(String.class));
    }
}