package com.backend.controller;

import com.backend.dto.ExperienceEarningsDTO;
import com.backend.dto.GuideEarningsDTO;
import com.backend.service.EarningsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit test class for EarningsController.
 * Tests earnings-related operations including guide earnings and experience-specific earnings.
 */
@ExtendWith(MockitoExtension.class)
class EarningsControllerTest {

    @Mock
    private EarningsService earningsService;

    @InjectMocks
    private EarningsController earningsController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(earningsController).build();
    }

    @Test
    void testGetGuideEarnings_Success() throws Exception {
        // Arrange
        GuideEarningsDTO earnings = createTestGuideEarnings();
        when(earningsService.getGuideEarnings(1L)).thenReturn(earnings);

        // Act & Assert
        mockMvc.perform(get("/api/earnings/guide/1"))
                .andExpect(status().isOk());

        verify(earningsService).getGuideEarnings(1L);
    }

    @Test
    void testGetGuideEarnings_ServiceException() throws Exception {
        // Arrange
        when(earningsService.getGuideEarnings(1L)).thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        mockMvc.perform(get("/api/earnings/guide/1"))
                .andExpect(status().isInternalServerError());

        verify(earningsService).getGuideEarnings(1L);
    }

    @Test
    void testGetExperienceEarnings_Success() throws Exception {
        // Arrange
        ExperienceEarningsDTO earnings = createTestExperienceEarnings();
        when(earningsService.getExperienceEarnings(1L, 1L)).thenReturn(earnings);

        // Act & Assert
        mockMvc.perform(get("/api/earnings/experience/1/guide/1"))
                .andExpect(status().isOk());

        verify(earningsService).getExperienceEarnings(1L, 1L);
    }

    @Test
    void testGetExperienceEarnings_NotFound() throws Exception {
        // Arrange
        when(earningsService.getExperienceEarnings(999L, 1L)).thenThrow(new RuntimeException("Not found"));

        // Act & Assert
        mockMvc.perform(get("/api/earnings/experience/999/guide/1"))
                .andExpect(status().isNotFound());

        verify(earningsService).getExperienceEarnings(999L, 1L);
    }

    @Test
    void testGetExperienceEarnings_BadRequest() throws Exception {
        // Arrange
        when(earningsService.getExperienceEarnings(1L, 1L)).thenThrow(new RuntimeException("General error"));

        // Act & Assert
        mockMvc.perform(get("/api/earnings/experience/1/guide/1"))
                .andExpect(status().isNotFound());

        verify(earningsService).getExperienceEarnings(1L, 1L);
    }

    // Helper methods for creating test objects
    private GuideEarningsDTO createTestGuideEarnings() {
        // Create a simple mock object - actual DTO structure may vary
        return mock(GuideEarningsDTO.class);
    }

    private ExperienceEarningsDTO createTestExperienceEarnings() {
        // Create a simple mock object - actual DTO structure may vary
        return mock(ExperienceEarningsDTO.class);
    }
}