package com.backend.service;

import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceSchedule;
import com.backend.entity.Notification;
import com.backend.entity.User;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.NotificationRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyNotificationServiceTest {

    @Mock
    private ExperienceScheduleRepository experienceScheduleRepository;
    
    @Mock
    private BookingRepository bookingRepository;
    
    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private DailyNotificationService dailyNotificationService;

    @Test
    void testSendHourlyBookingReminders_WithConfirmedBookings_CreatesNotifications() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = now.plusHours(12);
        
        User traveler = createTestUser(1L, "traveler@example.com");
        Experience experience = createTestExperience(1L, "City Tour");
        ExperienceSchedule schedule = createTestSchedule(1L, experience, startTime);
        Booking confirmedBooking = createTestBooking(1L, traveler, schedule, BookingStatus.CONFIRMED);
        
        when(experienceScheduleRepository.findByStartDateTimeBetween(any(), any()))
            .thenReturn(Arrays.asList(schedule));
        when(bookingRepository.findByExperienceSchedule_ScheduleId(1L))
            .thenReturn(Arrays.asList(confirmedBooking));
        when(notificationRepository.findByUserIdAndTypeAndCreatedAtGreaterThan(anyLong(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(notificationRepository.save(any(Notification.class)))
            .thenReturn(new Notification());

        // Act
        dailyNotificationService.sendHourlyBookingReminders();

        // Assert
        verify(experienceScheduleRepository).findByStartDateTimeBetween(any(), any());
        verify(bookingRepository).findByExperienceSchedule_ScheduleId(1L);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testSendHourlyBookingReminders_WithPendingBookings_DoesNotCreateNotifications() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = now.plusHours(12);
        
        User traveler = createTestUser(1L, "traveler@example.com");
        Experience experience = createTestExperience(1L, "City Tour");
        ExperienceSchedule schedule = createTestSchedule(1L, experience, startTime);
        Booking pendingBooking = createTestBooking(1L, traveler, schedule, BookingStatus.PENDING);
        
        when(experienceScheduleRepository.findByStartDateTimeBetween(any(), any()))
            .thenReturn(Arrays.asList(schedule));
        when(bookingRepository.findByExperienceSchedule_ScheduleId(1L))
            .thenReturn(Arrays.asList(pendingBooking));

        // Act
        dailyNotificationService.sendHourlyBookingReminders();

        // Assert
        verify(experienceScheduleRepository).findByStartDateTimeBetween(any(), any());
        verify(bookingRepository).findByExperienceSchedule_ScheduleId(1L);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testSendHourlyBookingReminders_WithExistingNotification_DoesNotCreateDuplicate() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = now.plusHours(12);
        
        User traveler = createTestUser(1L, "traveler@example.com");
        Experience experience = createTestExperience(1L, "City Tour");
        ExperienceSchedule schedule = createTestSchedule(1L, experience, startTime);
        Booking confirmedBooking = createTestBooking(1L, traveler, schedule, BookingStatus.CONFIRMED);
        
        Notification existingNotification = new Notification();
        existingNotification.setTitle("Experience Reminder - Coming Up Soon!");
        existingNotification.setCreatedAt(now);
        
        when(experienceScheduleRepository.findByStartDateTimeBetween(any(), any()))
            .thenReturn(Arrays.asList(schedule));
        when(bookingRepository.findByExperienceSchedule_ScheduleId(1L))
            .thenReturn(Arrays.asList(confirmedBooking));
        when(notificationRepository.findByUserIdAndTypeAndCreatedAtGreaterThan(anyLong(), any(), any()))
            .thenReturn(Arrays.asList(existingNotification));

        // Act
        dailyNotificationService.sendHourlyBookingReminders();

        // Assert
        verify(experienceScheduleRepository).findByStartDateTimeBetween(any(), any());
        verify(bookingRepository).findByExperienceSchedule_ScheduleId(1L);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testSendHourlyBookingReminders_NoUpcomingSchedules_DoesNotCreateNotifications() {
        // Arrange
        when(experienceScheduleRepository.findByStartDateTimeBetween(any(), any()))
            .thenReturn(Collections.emptyList());

        // Act
        dailyNotificationService.sendHourlyBookingReminders();

        // Assert
        verify(experienceScheduleRepository).findByStartDateTimeBetween(any(), any());
        verify(bookingRepository, never()).findByExperienceSchedule_ScheduleId(anyLong());
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testTriggerManualReminder_CallsHourlyReminderMethod() {
        // Arrange
        when(experienceScheduleRepository.findByStartDateTimeBetween(any(), any()))
            .thenReturn(Collections.emptyList());

        // Act
        dailyNotificationService.triggerManualReminder();

        // Assert
        verify(experienceScheduleRepository).findByStartDateTimeBetween(any(), any());
    }

    // Helper methods to create test entities
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }

    private Experience createTestExperience(Long id, String title) {
        Experience experience = new Experience();
        experience.setExperienceId(id);
        experience.setTitle(title);
        return experience;
    }

    private ExperienceSchedule createTestSchedule(Long id, Experience experience, LocalDateTime startTime) {
        ExperienceSchedule schedule = new ExperienceSchedule();
        schedule.setScheduleId(id);
        schedule.setExperience(experience);
        schedule.setStartDateTime(startTime);
        schedule.setEndDateTime(startTime.plusHours(3));
        return schedule;
    }

    private Booking createTestBooking(Long id, User traveler, ExperienceSchedule schedule, BookingStatus status) {
        Booking booking = new Booking();
        booking.setBookingId(id);
        booking.setTraveler(traveler);
        booking.setExperienceSchedule(schedule);
        booking.setStatus(status);
        booking.setNumberOfParticipants(2);
        return booking;
    }
}