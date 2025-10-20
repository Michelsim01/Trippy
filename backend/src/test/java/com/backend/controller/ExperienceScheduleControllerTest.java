package com.backend.controller;

import com.backend.entity.ExperienceSchedule;
import com.backend.entity.Experience;
import com.backend.entity.BookingStatus;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.BookingRepository;
import com.backend.service.ExperienceScheduleService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * Unit test class for ExperienceScheduleController.
 * Tests schedule management operations including CRUD operations and availability checks.
 */
@ExtendWith(MockitoExtension.class)
class ExperienceScheduleControllerTest {

    @Mock
    private ExperienceScheduleService experienceScheduleService;

    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private ExperienceScheduleController experienceScheduleController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(experienceScheduleController).build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // For LocalDateTime serialization
    }

    @Test
    void testGetScheduleById_Success() throws Exception {
        // Arrange
        ExperienceSchedule schedule = createTestSchedule(1L);
        when(experienceScheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        when(bookingRepository.countParticipantsByScheduleIdAndStatus(1L, BookingStatus.CONFIRMED)).thenReturn(5);

        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduleId").value(1L))
                .andExpect(jsonPath("$.availableSpots").exists())
                .andExpect(jsonPath("$.isAvailable").exists());

        verify(experienceScheduleRepository).findById(1L);
        verify(bookingRepository).countParticipantsByScheduleIdAndStatus(1L, BookingStatus.CONFIRMED);
    }

    @Test
    void testGetScheduleById_NotFound() throws Exception {
        // Arrange
        when(experienceScheduleRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/999"))
                .andExpect(status().isNotFound());

        verify(experienceScheduleRepository).findById(999L);
    }

    @Test
    void testGetScheduleById_InvalidId() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/0"))
                .andExpect(status().isBadRequest());

        verify(experienceScheduleRepository, never()).findById(anyLong());
    }

    @Test
    void testGetSchedulesByExperienceId_Success() throws Exception {
        // Arrange
        List<ExperienceSchedule> schedules = Arrays.asList(
                createTestSchedule(1L),
                createTestSchedule(2L)
        );
        when(experienceScheduleRepository.findByExperience_ExperienceId(1L)).thenReturn(schedules);
        when(bookingRepository.countParticipantsByScheduleIdAndStatus(anyLong(), eq(BookingStatus.CONFIRMED))).thenReturn(3);

        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/experience/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(experienceScheduleRepository).findByExperience_ExperienceId(1L);
    }

    @Test
    void testCheckAvailability_Success() throws Exception {
        // Arrange
        ExperienceSchedule schedule = createTestSchedule(1L);
        when(experienceScheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));
        when(bookingRepository.countParticipantsByScheduleIdAndStatus(1L, BookingStatus.CONFIRMED)).thenReturn(5);

        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/1/availability")
                .param("participants", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduleId").value(1L))
                .andExpect(jsonPath("$.requestedParticipants").value(2))
                .andExpect(jsonPath("$.availableSpots").exists())
                .andExpect(jsonPath("$.isAvailable").exists());

        verify(experienceScheduleRepository).findById(1L);
        verify(bookingRepository).countParticipantsByScheduleIdAndStatus(1L, BookingStatus.CONFIRMED);
    }

    @Test
    void testCheckAvailability_InvalidParticipants() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/1/availability")
                .param("participants", "0"))
                .andExpect(status().isBadRequest());

        verify(experienceScheduleRepository, never()).findById(anyLong());
    }

    @Test
    void testGetAvailableSchedulesByExperienceId_Success() throws Exception {
        // Arrange
        ExperienceSchedule futureSchedule = createTestSchedule(1L);
        futureSchedule.setStartDateTime(LocalDateTime.now().plusDays(1));
        futureSchedule.setIsAvailable(true);
        futureSchedule.setAvailableSpots(5);

        List<ExperienceSchedule> schedules = Arrays.asList(futureSchedule);
        when(experienceScheduleRepository.findByExperience_ExperienceId(1L)).thenReturn(schedules);
        when(bookingRepository.countParticipantsByScheduleIdAndStatus(1L, BookingStatus.CONFIRMED)).thenReturn(3);

        // Act & Assert
        mockMvc.perform(get("/api/experience-schedules/experience/1/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(experienceScheduleRepository).findByExperience_ExperienceId(1L);
    }

    @Test
    void testCreateExperienceSchedule_Success() throws Exception {
        // Arrange
        ExperienceSchedule schedule = createTestSchedule(null);
        ExperienceSchedule savedSchedule = createTestSchedule(1L);
        when(experienceScheduleService.createExperienceSchedule(any(ExperienceSchedule.class))).thenReturn(savedSchedule);

        // Act & Assert
        mockMvc.perform(post("/api/experience-schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(schedule)))
                .andExpect(status().isCreated());

        verify(experienceScheduleService).createExperienceSchedule(any(ExperienceSchedule.class));
    }

    @Test
    void testUpdateExperienceSchedule_Success() throws Exception {
        // Arrange
        ExperienceSchedule schedule = createTestSchedule(1L);
        when(experienceScheduleService.updateExperienceSchedule(eq(1L), any(ExperienceSchedule.class))).thenReturn(schedule);

        // Act & Assert
        mockMvc.perform(put("/api/experience-schedules/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(schedule)))
                .andExpect(status().isOk());

        verify(experienceScheduleService).updateExperienceSchedule(eq(1L), any(ExperienceSchedule.class));
    }

    @Test
    void testDeleteExperienceSchedule_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/experience-schedules/1"))
                .andExpect(status().isNoContent());

        verify(experienceScheduleService).deleteExperienceSchedule(1L);
    }

    // Helper methods for creating test objects
    private ExperienceSchedule createTestSchedule(Long id) {
        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(id);
        schedule.setStartDateTime(LocalDateTime.now().plusDays(1));
        schedule.setEndDateTime(LocalDateTime.now().plusDays(1).plusHours(3));
        schedule.setIsAvailable(true);
        schedule.setAvailableSpots(10);
        schedule.setCreatedAt(LocalDateTime.now());
        
        // Create a mock experience
        Experience experience = new Experience();
        experience.setExperienceId(1L);
        experience.setParticipantsAllowed(10);
        schedule.setExperience(experience);
        
        return schedule;
    }
}