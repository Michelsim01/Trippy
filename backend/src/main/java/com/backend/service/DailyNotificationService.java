package com.backend.service;

import com.backend.entity.Booking;
import com.backend.entity.ExperienceSchedule;
import com.backend.entity.Notification;
import com.backend.entity.NotificationType;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class DailyNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(DailyNotificationService.class);
    private static final ZoneId SINGAPORE_ZONE = ZoneId.of("Asia/Singapore");

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Scheduled method that runs every day at midnight Singapore time (16:00 UTC)
     * Creates reminder notifications for users with bookings the next day
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Singapore")
    public void sendDailyBookingReminders() {
        logger.info("Starting daily booking reminder task at Singapore time: {}", 
                   LocalDateTime.now(SINGAPORE_ZONE));

        try {
            // Calculate tomorrow's date in Singapore timezone
            LocalDate tomorrow = LocalDate.now(SINGAPORE_ZONE).plusDays(1);
            LocalDateTime tomorrowStart = tomorrow.atStartOfDay();
            LocalDateTime tomorrowEnd = tomorrow.atTime(LocalTime.MAX);

            logger.info("Looking for experience schedules between {} and {}", tomorrowStart, tomorrowEnd);

            // Find all experience schedules that start tomorrow
            List<ExperienceSchedule> tomorrowSchedules = findSchedulesForDate(tomorrowStart, tomorrowEnd);
            
            logger.info("Found {} experience schedules for tomorrow", tomorrowSchedules.size());

            int notificationsCreated = 0;

            // For each schedule, find all bookings and create notifications
            for (ExperienceSchedule schedule : tomorrowSchedules) {
                List<Booking> bookings = bookingRepository.findByExperienceSchedule_ScheduleId(schedule.getScheduleId());
                
                for (Booking booking : bookings) {
                    // Only send reminders for confirmed bookings
                    if ("CONFIRMED".equals(booking.getStatus().toString())) {
                        createBookingReminderNotification(booking, schedule);
                        notificationsCreated++;
                    }
                }
            }

            logger.info("Daily booking reminder task completed. Created {} notifications", notificationsCreated);

        } catch (Exception e) {
            logger.error("Error occurred during daily booking reminder task", e);
        }
    }

    /**
     * Find experience schedules that start within the given date range
     */
    private List<ExperienceSchedule> findSchedulesForDate(LocalDateTime startDate, LocalDateTime endDate) {
        return experienceScheduleRepository.findByStartDateTimeBetween(startDate, endDate);
    }

    /**
     * Create a booking reminder notification for a specific booking
     */
    private void createBookingReminderNotification(Booking booking, ExperienceSchedule schedule) {
        try {
            Notification notification = new Notification();
            notification.setUser(booking.getTraveler());
            notification.setType(NotificationType.REMINDER);
            notification.setTitle("Experience Reminder - Tomorrow!");
            
            String message = String.format(
                "Don't forget! Your experience \"%s\" is scheduled for tomorrow at %s. " +
                "Please arrive 15 minutes early. Have a great time!",
                schedule.getExperience().getTitle(),
                schedule.getStartDateTime().toLocalTime().toString()
            );
            
            notification.setMessage(message);
            notification.setIsRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setSentAt(LocalDateTime.now());

            notificationRepository.save(notification);
            
            logger.info("Created reminder notification for user {} for experience \"{}\"", 
                       booking.getTraveler().getId(), 
                       schedule.getExperience().getTitle());

        } catch (Exception e) {
            logger.error("Error creating notification for booking ID: {}", booking.getBookingId(), e);
        }
    }

    /**
     * Manual trigger method for testing purposes
     * This can be called via a REST endpoint for testing
     */
    public void triggerManualReminder() {
        logger.info("Manual booking reminder trigger initiated");
        sendDailyBookingReminders();
    }
}