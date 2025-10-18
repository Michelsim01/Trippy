package com.backend.controller;

import com.backend.entity.ExperienceItinerary;
import com.backend.repository.ExperienceItineraryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for ExperienceItineraryController.
 * Tests itinerary management operations including CRUD operations.
 */
@ExtendWith(MockitoExtension.class)
class ExperienceItineraryControllerTest {

    @Mock
    private ExperienceItineraryRepository experienceItineraryRepository;

    @InjectMocks
    private ExperienceItineraryController experienceItineraryController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(experienceItineraryController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testGetAllExperienceItineraries_Success() throws Exception {
        // Arrange
        List<ExperienceItinerary> itineraries = Arrays.asList(
                createTestItinerary(1L, "Morning Activity"),
                createTestItinerary(2L, "Afternoon Tour")
        );
        when(experienceItineraryRepository.findAll()).thenReturn(itineraries);

        // Act & Assert
        mockMvc.perform(get("/api/experience-itineraries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(experienceItineraryRepository).findAll();
    }

    @Test
    void testGetAllExperienceItineraries_Exception() throws Exception {
        // Arrange
        when(experienceItineraryRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        mockMvc.perform(get("/api/experience-itineraries"))
                .andExpect(status().isInternalServerError());

        verify(experienceItineraryRepository).findAll();
    }

    @Test
    void testGetExperienceItineraryById_Success() throws Exception {
        // Arrange
        ExperienceItinerary itinerary = createTestItinerary(1L, "Morning Activity");
        when(experienceItineraryRepository.findById(1L)).thenReturn(Optional.of(itinerary));

        // Act & Assert
        mockMvc.perform(get("/api/experience-itineraries/1"))
                .andExpect(status().isOk());

        verify(experienceItineraryRepository).findById(1L);
    }

    @Test
    void testGetExperienceItineraryById_NotFound() throws Exception {
        // Arrange
        when(experienceItineraryRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/experience-itineraries/999"))
                .andExpect(status().isNotFound());

        verify(experienceItineraryRepository).findById(999L);
    }

    @Test
    void testGetExperienceItineraryById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/experience-itineraries/0"))
                .andExpect(status().isBadRequest());

        verify(experienceItineraryRepository, never()).findById(anyLong());
    }

    @Test
    void testCreateExperienceItinerary_Success() throws Exception {
        // Arrange
        ExperienceItinerary itinerary = createTestItinerary(null, "New Activity");
        ExperienceItinerary savedItinerary = createTestItinerary(1L, "New Activity");
        when(experienceItineraryRepository.save(any(ExperienceItinerary.class))).thenReturn(savedItinerary);

        // Act & Assert
        mockMvc.perform(post("/api/experience-itineraries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(itinerary)))
                .andExpect(status().isCreated());

        verify(experienceItineraryRepository).save(any(ExperienceItinerary.class));
    }

    @Test
    void testCreateExperienceItinerary_NullBody() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/experience-itineraries")
                .contentType(MediaType.APPLICATION_JSON)
                .content("null"))
                .andExpect(status().isBadRequest());

        verify(experienceItineraryRepository, never()).save(any(ExperienceItinerary.class));
    }

    @Test
    void testUpdateExperienceItinerary_Success() throws Exception {
        // Arrange
        ExperienceItinerary itinerary = createTestItinerary(1L, "Updated Activity");
        when(experienceItineraryRepository.existsById(1L)).thenReturn(true);
        when(experienceItineraryRepository.save(any(ExperienceItinerary.class))).thenReturn(itinerary);

        // Act & Assert
        mockMvc.perform(put("/api/experience-itineraries/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(itinerary)))
                .andExpect(status().isOk());

        verify(experienceItineraryRepository).existsById(1L);
        verify(experienceItineraryRepository).save(any(ExperienceItinerary.class));
    }

    @Test
    void testUpdateExperienceItinerary_NotFound() throws Exception {
        // Arrange
        ExperienceItinerary itinerary = createTestItinerary(999L, "Updated Activity");
        when(experienceItineraryRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(put("/api/experience-itineraries/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(itinerary)))
                .andExpect(status().isNotFound());

        verify(experienceItineraryRepository).existsById(999L);
        verify(experienceItineraryRepository, never()).save(any(ExperienceItinerary.class));
    }

    @Test
    void testDeleteExperienceItinerary_Success() throws Exception {
        // Arrange
        when(experienceItineraryRepository.existsById(1L)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/experience-itineraries/1"))
                .andExpect(status().isNoContent());

        verify(experienceItineraryRepository).existsById(1L);
        verify(experienceItineraryRepository).deleteById(1L);
    }

    @Test
    void testDeleteExperienceItinerary_NotFound() throws Exception {
        // Arrange
        when(experienceItineraryRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/experience-itineraries/999"))
                .andExpect(status().isNotFound());

        verify(experienceItineraryRepository).existsById(999L);
        verify(experienceItineraryRepository, never()).deleteById(anyLong());
    }

    // Helper methods for creating test objects
    private ExperienceItinerary createTestItinerary(Long id, String activity) {
        ExperienceItinerary itinerary = new ExperienceItinerary();
        itinerary.setItineraryId(id);
        itinerary.setCreatedAt(LocalDateTime.now());
        return itinerary;
    }
}