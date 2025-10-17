package com.backend.controller;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceStatus;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.ExperienceMediaRepository;
import com.backend.repository.ExperienceItineraryRepository;
import com.backend.repository.BookingRepository;
import com.backend.repository.PersonalChatRepository;
import com.backend.service.ExperienceService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for ExperienceController.
 * Tests experience-related operations including CRUD operations, search, and schedule management.
 */
@ExtendWith(MockitoExtension.class)
class ExperienceControllerTest {

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Mock
    private ExperienceMediaRepository experienceMediaRepository;

    @Mock
    private ExperienceItineraryRepository experienceItineraryRepository;

    @Mock
    private ExperienceService experienceService;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PersonalChatRepository personalChatRepository;

    @InjectMocks
    private ExperienceController experienceController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(experienceController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void testGetAllExperiences_Success() throws Exception {
        // Arrange
        List<Experience> experiences = Arrays.asList(
                createTestExperience(1L, "City Tour", "Singapore"),
                createTestExperience(2L, "Beach Walk", "Bali")
        );
        when(experienceRepository.findAll()).thenReturn(experiences);

        // Act & Assert
        mockMvc.perform(get("/api/experiences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("City Tour"))
                .andExpect(jsonPath("$[1].title").value("Beach Walk"));

        verify(experienceRepository).findAll();
    }

    @Test
    void testGetExperienceById_Success() throws Exception {
        // Arrange
        Experience experience = createTestExperience(1L, "City Tour", "Singapore");
        when(experienceRepository.findById(1L)).thenReturn(Optional.of(experience));

        // Act & Assert
        mockMvc.perform(get("/api/experiences/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.experienceId").value(1L))
                .andExpect(jsonPath("$.title").value("City Tour"))
                .andExpect(jsonPath("$.location").value("Singapore"));

        verify(experienceRepository).findById(1L);
    }

    @Test
    void testGetExperienceById_NotFound() throws Exception {
        // Arrange
        when(experienceRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/experiences/999"))
                .andExpect(status().isNotFound());

        verify(experienceRepository).findById(999L);
    }

    @Test
    void testCreateExperience_Success() throws Exception {
        // Arrange
        Experience createdExperience = createTestExperience(1L, "New Tour", "Tokyo");
        Map<String, Object> payload = createExperiencePayload();
        
        when(experienceService.createCompleteExperience(anyMap())).thenReturn(createdExperience);

        // Act & Assert
        mockMvc.perform(post("/api/experiences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.experienceId").value(1L))
                .andExpect(jsonPath("$.message").value("Experience created successfully"));

        verify(experienceService).createCompleteExperience(anyMap());
    }

    @Test
    void testCreateExperience_ServiceException() throws Exception {
        // Arrange
        Map<String, Object> payload = createExperiencePayload();
        when(experienceService.createCompleteExperience(anyMap()))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        mockMvc.perform(post("/api/experiences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").exists());

        verify(experienceService).createCompleteExperience(anyMap());
    }

    @Test
    void testUpdateExperience_Success() throws Exception {
        // Arrange
        Experience experience = createTestExperience(1L, "Updated Tour", "Singapore");
        when(experienceRepository.save(any(Experience.class))).thenReturn(experience);

        // Act & Assert
        mockMvc.perform(put("/api/experiences/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(experience)))
                .andExpect(status().isOk());

        verify(experienceRepository).save(any(Experience.class));
    }

    @Test
    void testUpdateCompleteExperience_Success() throws Exception {
        // Arrange
        Experience updatedExperience = createTestExperience(1L, "Updated Complete Tour", "Singapore");
        Map<String, Object> payload = createExperiencePayload();
        
        when(experienceService.updateCompleteExperience(eq(1L), anyMap())).thenReturn(updatedExperience);

        // Act & Assert
        mockMvc.perform(put("/api/experiences/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.experienceId").value(1L));

        verify(experienceService).updateCompleteExperience(eq(1L), anyMap());
    }

    @Test
    void testGetSearchSuggestions_Success() throws Exception {
        // Arrange
        List<String> countries = Arrays.asList("Singapore", "Malaysia");
        List<Experience> experiences = Arrays.asList(createTestExperience(1L, "City Tour", "Singapore"));
        
        when(experienceRepository.findLocationSuggestions("sing")).thenReturn(countries);
        when(experienceRepository.findExperienceSuggestions("sing")).thenReturn(experiences);

        // Act & Assert
        mockMvc.perform(get("/api/experiences/search/suggestions")
                .param("q", "sing"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(experienceRepository).findLocationSuggestions("sing");
        verify(experienceRepository).findExperienceSuggestions("sing");
    }

    @Test
    void testGetSearchSuggestions_ShortQuery() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/experiences/search/suggestions")
                .param("q", "s"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(experienceRepository, never()).findLocationSuggestions(anyString());
        verify(experienceRepository, never()).findExperienceSuggestions(anyString());
    }

    // Helper methods for creating test objects
    private Experience createTestExperience(Long id, String title, String location) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle(title);
        experience.setLocation(location);
        experience.setCountry("Singapore");
        experience.setPrice(BigDecimal.valueOf(100.0));
        experience.setDuration(BigDecimal.valueOf(3.0));
        experience.setStatus(ExperienceStatus.ACTIVE);
        experience.setShortDescription("A great tour");
        experience.setFullDescription("Experience the best of the city");
        experience.setParticipantsAllowed(10);
        experience.setCoverPhotoUrl("http://example.com/photo.jpg");
        experience.setCreatedAt(LocalDateTime.now());
        experience.setUpdatedAt(LocalDateTime.now());
        return experience;
    }

    private Map<String, Object> createExperiencePayload() {
        Map<String, Object> payload = new HashMap<>();
        Map<String, Object> experience = new HashMap<>();
        experience.put("title", "New Tour");
        experience.put("location", "Tokyo");
        experience.put("country", "Japan");
        experience.put("price", 150.0);
        experience.put("duration", 4.0);
        experience.put("category", "ADVENTURE");
        experience.put("status", "ACTIVE");
        experience.put("shortDescription", "Amazing tour");
        experience.put("participantsAllowed", 8);
        
        payload.put("experience", experience);
        payload.put("schedules", new ArrayList<>());
        payload.put("itineraries", new ArrayList<>());
        payload.put("media", new ArrayList<>());
        
        return payload;
    }
}