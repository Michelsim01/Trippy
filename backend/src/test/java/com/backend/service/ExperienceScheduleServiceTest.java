package com.backend.service;

import com.backend.entity.ExperienceSchedule;
import com.backend.repository.ExperienceScheduleRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExperienceScheduleServiceTest {

    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;

    @InjectMocks
    private ExperienceScheduleService experienceScheduleService;

    @Test
    void testGetAllExperienceSchedules_ReturnsAllSchedules() {
        // Arrange
        ExperienceSchedule schedule1 = createTestSchedule(1L, LocalDateTime.now().plusDays(1));
        ExperienceSchedule schedule2 = createTestSchedule(2L, LocalDateTime.now().plusDays(2));
        List<ExperienceSchedule> schedules = Arrays.asList(schedule1, schedule2);

        when(experienceScheduleRepository.findAll()).thenReturn(schedules);

        // Act
        List<ExperienceSchedule> result = experienceScheduleService.getAllExperienceSchedules();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getScheduleId());
        assertEquals(2L, result.get(1).getScheduleId());

        verify(experienceScheduleRepository).findAll();
    }

    @Test
    void testGetAllExperienceSchedules_EmptyList_ReturnsEmptyList() {
        // Arrange
        when(experienceScheduleRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        List<ExperienceSchedule> result = experienceScheduleService.getAllExperienceSchedules();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(experienceScheduleRepository).findAll();
    }

    @Test
    void testGetExperienceScheduleById_ExistingSchedule_ReturnsSchedule() {
        // Arrange
        Long scheduleId = 1L;
        ExperienceSchedule schedule = createTestSchedule(scheduleId, LocalDateTime.now().plusDays(1));

        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.of(schedule));

        // Act
        Optional<ExperienceSchedule> result = experienceScheduleService.getExperienceScheduleById(scheduleId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(scheduleId, result.get().getScheduleId());

        verify(experienceScheduleRepository).findById(scheduleId);
    }

    @Test
    void testGetExperienceScheduleById_NonExistingSchedule_ReturnsEmpty() {
        // Arrange
        Long scheduleId = 999L;

        when(experienceScheduleRepository.findById(scheduleId)).thenReturn(Optional.empty());

        // Act
        Optional<ExperienceSchedule> result = experienceScheduleService.getExperienceScheduleById(scheduleId);

        // Assert
        assertFalse(result.isPresent());

        verify(experienceScheduleRepository).findById(scheduleId);
    }

    @Test
    void testCreateExperienceSchedule_ValidSchedule_ReturnsSavedSchedule() {
        // Arrange
        ExperienceSchedule newSchedule = createTestSchedule(null, LocalDateTime.now().plusDays(1));
        ExperienceSchedule savedSchedule = createTestSchedule(1L, LocalDateTime.now().plusDays(1));

        when(experienceScheduleRepository.save(newSchedule)).thenReturn(savedSchedule);

        // Act
        ExperienceSchedule result = experienceScheduleService.createExperienceSchedule(newSchedule);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getScheduleId());

        verify(experienceScheduleRepository).save(newSchedule);
    }

    @Test
    void testUpdateExperienceSchedule_ValidSchedule_ReturnsUpdatedSchedule() {
        // Arrange
        Long scheduleId = 1L;
        ExperienceSchedule updateSchedule = createTestSchedule(null, LocalDateTime.now().plusDays(2));
        ExperienceSchedule savedSchedule = createTestSchedule(scheduleId, LocalDateTime.now().plusDays(2));

        when(experienceScheduleRepository.save(any(ExperienceSchedule.class))).thenReturn(savedSchedule);

        // Act
        ExperienceSchedule result = experienceScheduleService.updateExperienceSchedule(scheduleId, updateSchedule);

        // Assert
        assertNotNull(result);
        assertEquals(scheduleId, result.getScheduleId());

        verify(experienceScheduleRepository).save(updateSchedule);
        // Verify that the ID was set on the update schedule
        assertEquals(scheduleId, updateSchedule.getScheduleId());
    }

    @Test
    void testDeleteExperienceSchedule_ValidId_CallsRepositoryDelete() {
        // Arrange
        Long scheduleId = 1L;

        // Act
        experienceScheduleService.deleteExperienceSchedule(scheduleId);

        // Assert
        verify(experienceScheduleRepository).deleteById(scheduleId);
    }

    // Helper method to create test schedules
    private ExperienceSchedule createTestSchedule(Long id, LocalDateTime startDateTime) {
        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(id);
        schedule.setStartDateTime(startDateTime);
        schedule.setEndDateTime(startDateTime.plusHours(3));
        schedule.setAvailableSpots(10);
        schedule.setIsAvailable(true);
        return schedule;
    }
}