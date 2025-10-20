package com.backend.service;

import com.backend.dto.ExperienceEarningsDTO;
import com.backend.dto.GuideEarningsDTO;
import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceSchedule;
import com.backend.entity.User;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EarningsServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    
    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;

    @InjectMocks
    private EarningsService earningsService;

    @Test
    void testGetGuideEarnings_WithConfirmedAndCompletedBookings_ReturnsCorrectEarnings() {
        // Arrange
        Long guideId = 1L;
        
        Booking confirmedBooking = createTestBooking(1L, BookingStatus.CONFIRMED, new BigDecimal("100.00"));
        Booking completedBooking = createTestBooking(2L, BookingStatus.COMPLETED, new BigDecimal("150.00"));
        
        when(bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId))
            .thenReturn(Arrays.asList(confirmedBooking, completedBooking));
        when(bookingRepository.calculatePendingCancellationFees(guideId))
            .thenReturn(new BigDecimal("10.00"));

        // Act
        GuideEarningsDTO result = earningsService.getGuideEarnings(guideId);

        // Assert
        assertNotNull(result);
        assertEquals(new BigDecimal("250.00"), result.getTotalEarnings());
        assertEquals(new BigDecimal("100.00"), result.getPendingEarnings());
        assertEquals(new BigDecimal("150.00"), result.getPaidOutEarnings());
        assertEquals(new BigDecimal("10.00"), result.getPendingDeductions());
        assertEquals(Integer.valueOf(2), result.getTotalBookings());
        assertEquals(Integer.valueOf(1), result.getPendingBookings());
        assertEquals(Integer.valueOf(1), result.getCompletedBookings());

        verify(bookingRepository).findByGuideIdOrderByScheduleStartDateTimeAsc(guideId);
        verify(bookingRepository).calculatePendingCancellationFees(guideId);
    }

    @Test
    void testGetGuideEarnings_WithNullBaseAmounts_HandlesGracefully() {
        // Arrange
        Long guideId = 1L;
        
        Booking bookingWithNullAmount = createTestBooking(1L, BookingStatus.CONFIRMED, null);
        
        when(bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId))
            .thenReturn(Arrays.asList(bookingWithNullAmount));
        when(bookingRepository.calculatePendingCancellationFees(guideId))
            .thenReturn(BigDecimal.ZERO);

        // Act
        GuideEarningsDTO result = earningsService.getGuideEarnings(guideId);

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalEarnings());
        assertEquals(BigDecimal.ZERO, result.getPendingEarnings());
        assertEquals(BigDecimal.ZERO, result.getPaidOutEarnings());
    }

    @Test
    void testGetGuideEarnings_NoBookings_ReturnsZeroEarnings() {
        // Arrange
        Long guideId = 1L;
        
        when(bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(guideId))
            .thenReturn(Collections.emptyList());
        when(bookingRepository.calculatePendingCancellationFees(guideId))
            .thenReturn(BigDecimal.ZERO);

        // Act
        GuideEarningsDTO result = earningsService.getGuideEarnings(guideId);

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalEarnings());
        assertEquals(BigDecimal.ZERO, result.getPendingEarnings());
        assertEquals(BigDecimal.ZERO, result.getPaidOutEarnings());
        assertEquals(Integer.valueOf(0), result.getTotalBookings());
    }

    @Test
    void testGetExperienceEarnings_ValidExperience_ReturnsEarningsData() {
        // Arrange
        Long experienceId = 1L;
        Long guideId = 1L;
        
        User guide = createTestUser(guideId, "guide@example.com");
        Experience experience = createTestExperience(experienceId, "City Tour", guide);
        ExperienceSchedule schedule = createTestSchedule(1L, experience);
        
        Booking confirmedBooking = createTestBooking(1L, BookingStatus.CONFIRMED, new BigDecimal("100.00"), schedule);
        schedule.setBookings(Arrays.asList(confirmedBooking));
        
        when(experienceScheduleRepository.findByExperience_ExperienceIdOrderByStartDateTimeAsc(experienceId))
            .thenReturn(Arrays.asList(schedule));

        // Act
        ExperienceEarningsDTO result = earningsService.getExperienceEarnings(experienceId, guideId);

        // Assert
        assertNotNull(result);
        assertEquals(experienceId, result.getExperienceId());
        assertEquals("City Tour", result.getExperienceTitle());
        assertEquals(new BigDecimal("100.00"), result.getTotalEarnings());
        assertEquals(new BigDecimal("100.00"), result.getPendingEarnings());
        assertEquals(BigDecimal.ZERO, result.getPaidOutEarnings());
        assertNotNull(result.getSchedules());

        verify(experienceScheduleRepository).findByExperience_ExperienceIdOrderByStartDateTimeAsc(experienceId);
    }

    @Test
    void testGetExperienceEarnings_WrongGuide_ThrowsException() {
        // Arrange
        Long experienceId = 1L;
        Long guideId = 1L;
        Long wrongGuideId = 2L;
        
        User wrongGuide = createTestUser(wrongGuideId, "wrong@example.com");
        Experience experience = createTestExperience(experienceId, "City Tour", wrongGuide);
        ExperienceSchedule schedule = createTestSchedule(1L, experience);
        
        when(experienceScheduleRepository.findByExperience_ExperienceIdOrderByStartDateTimeAsc(experienceId))
            .thenReturn(Arrays.asList(schedule));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> earningsService.getExperienceEarnings(experienceId, guideId));
        assertEquals("Experience not found or access denied", exception.getMessage());
    }

    // Helper methods to create test entities
    private Booking createTestBooking(Long id, BookingStatus status, BigDecimal baseAmount) {
        return createTestBooking(id, status, baseAmount, null);
    }
    
    private Booking createTestBooking(Long id, BookingStatus status, BigDecimal baseAmount, ExperienceSchedule schedule) {
        Booking booking = new Booking();
        booking.setBookingId(id);
        booking.setStatus(status);
        booking.setBaseAmount(baseAmount);
        booking.setNumberOfParticipants(2);
        if (schedule != null) {
            booking.setExperienceSchedule(schedule);
        }
        return booking;
    }

    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }

    private Experience createTestExperience(Long id, String title, User guide) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle(title);
        experience.setGuide(guide);
        return experience;
    }

    private ExperienceSchedule createTestSchedule(Long id, Experience experience) {
        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(id);
        schedule.setExperience(experience);
        schedule.setStartDateTime(LocalDateTime.now().plusDays(1));
        schedule.setEndDateTime(LocalDateTime.now().plusDays(1).plusHours(3));
        return schedule;
    }
}