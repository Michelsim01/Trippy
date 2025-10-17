package com.backend.controller;

import com.backend.entity.TripCohort;
import com.backend.repository.TripCohortRepository;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TripCohortControllerTest {

    @Mock
    private TripCohortRepository tripCohortRepository;

    @InjectMocks
    private TripCohortController tripCohortController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tripCohortController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getAllTripCohorts_Success() throws Exception {
        // Arrange
        TripCohort cohort1 = createTestTripCohort(1L);
        TripCohort cohort2 = createTestTripCohort(2L);
        List<TripCohort> cohorts = Arrays.asList(cohort1, cohort2);

        when(tripCohortRepository.findAll()).thenReturn(cohorts);

        // Act & Assert
        mockMvc.perform(get("/api/trip-cohorts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));

        verify(tripCohortRepository).findAll();
    }

    @Test
    void getTripCohortById_Success() throws Exception {
        // Arrange
        Long cohortId = 1L;
        TripCohort cohort = createTestTripCohort(cohortId);
        when(tripCohortRepository.findById(cohortId)).thenReturn(Optional.of(cohort));

        // Act & Assert
        mockMvc.perform(get("/api/trip-cohorts/{id}", cohortId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cohortId").value(cohortId))
                .andExpect(jsonPath("$.name").value("Test Cohort"));

        verify(tripCohortRepository).findById(cohortId);
    }

    @Test
    void getTripCohortById_NotFound() throws Exception {
        // Arrange
        Long cohortId = 999L;
        when(tripCohortRepository.findById(cohortId)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/trip-cohorts/{id}", cohortId))
                .andExpect(status().isNotFound());

        verify(tripCohortRepository).findById(cohortId);
    }

    @Test
    void createTripCohort_Success() throws Exception {
        // Arrange
        TripCohort cohort = createTestTripCohort(null);
        TripCohort savedCohort = createTestTripCohort(1L);

        when(tripCohortRepository.save(any(TripCohort.class))).thenReturn(savedCohort);

        // Act & Assert
        mockMvc.perform(post("/api/trip-cohorts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cohort)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cohortId").value(1L))
                .andExpect(jsonPath("$.name").value("Test Cohort"));

        verify(tripCohortRepository).save(any(TripCohort.class));
    }

    @Test
    void updateTripCohort_Success() throws Exception {
        // Arrange
        Long cohortId = 1L;
        TripCohort cohort = createTestTripCohort(cohortId);

        when(tripCohortRepository.existsById(cohortId)).thenReturn(true);
        when(tripCohortRepository.save(any(TripCohort.class))).thenReturn(cohort);

        // Act & Assert
        mockMvc.perform(put("/api/trip-cohorts/{id}", cohortId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cohort)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cohortId").value(cohortId));

        verify(tripCohortRepository).existsById(cohortId);
        verify(tripCohortRepository).save(any(TripCohort.class));
    }

    @Test
    void deleteTripCohort_Success() throws Exception {
        // Arrange
        Long cohortId = 1L;
        when(tripCohortRepository.existsById(cohortId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/trip-cohorts/{id}", cohortId))
                .andExpect(status().isNoContent());

        verify(tripCohortRepository).existsById(cohortId);
        verify(tripCohortRepository).deleteById(cohortId);
    }

    // Helper methods
    private TripCohort createTestTripCohort(Long id) {
        TripCohort cohort = new TripCohort();
        cohort.setCohortId(id);
        cohort.setName("Test Cohort");
        cohort.setDescription("Test description");
        cohort.setIsActive(true);
        cohort.setCreatedAt(LocalDateTime.now());
        cohort.setUpdatedAt(LocalDateTime.now());
        return cohort;
    }
}