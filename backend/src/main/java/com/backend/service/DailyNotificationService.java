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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
     * Scheduled method that runs every hour at Singapore time
     * Creates reminder notifications for users with bookings within the next 24
     * hours
     * Includes duplicate prevention to avoid sending multiple reminders to the same
     * user
     */
    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Singapore")
    @Transactional
    public void sendHourlyBookingReminders() {
        logger.info("=== HOURLY REMINDER TASK TRIGGERED ===");
        logger.info("Starting hourly booking reminder task at Singapore time: {}",
                LocalDateTime.now(SINGAPORE_ZONE));
        logger.info("Current UTC time: {}", LocalDateTime.now());

        try {
            // Calculate the next 24 hours in Singapore timezone
            LocalDateTime now = LocalDateTime.now(SINGAPORE_ZONE);
            LocalDateTime next24Hours = now.plusHours(24);

            logger.info("Looking for experience schedules between {} and {}", now, next24Hours);

            // Find all experience schedules that start within the next 24 hours
            List<ExperienceSchedule> upcomingSchedules = findSchedulesForDate(now, next24Hours);

            logger.info("Found {} experience schedules within the next 24 hours", upcomingSchedules.size());

            int notificationsCreated = 0;

            // For each schedule, find all bookings and create notifications
            for (ExperienceSchedule schedule : upcomingSchedules) {
                logger.info("Processing schedule ID: {} for experience: {}",
                        schedule.getScheduleId(), schedule.getExperience().getTitle());

                List<Booking> bookings = bookingRepository
                        .findByExperienceSchedule_ScheduleId(schedule.getScheduleId());
                logger.info("Found {} bookings for schedule ID: {}", bookings.size(), schedule.getScheduleId());

                for (Booking booking : bookings) {
                    logger.info("Processing booking ID: {} with status: {} for user: {}",
                            booking.getBookingId(), booking.getStatus(), booking.getTraveler().getId());

                    // Only send reminders for confirmed bookings
                    if ("CONFIRMED".equals(booking.getStatus().toString())) {
                        // Check if reminder notification already exists for this user and experience
                        if (!hasExistingReminderNotification(booking.getTraveler().getId(),
                                schedule.getExperience().getExperienceId(), schedule.getStartDateTime())) {
                            logger.info("Creating notification for CONFIRMED booking ID: {}", booking.getBookingId());
                            createBookingReminderNotification(booking, schedule);
                            notificationsCreated++;
                        } else {
                            logger.info(
                                    "Skipping booking ID: {} - reminder notification already exists for user: {} and experience: {}",
                                    booking.getBookingId(), booking.getTraveler().getId(),
                                    schedule.getExperience().getExperienceId());
                        }
                    } else {
                        logger.info("Skipping booking ID: {} - status is: {}", booking.getBookingId(),
                                booking.getStatus());
                    }
                }
            }

            logger.info("Hourly booking reminder task completed. Created {} notifications", notificationsCreated);

        } catch (Exception e) {
            logger.error("Error occurred during hourly booking reminder task", e);
        }
    }

    /**
     * Check if a reminder notification already exists for a user and experience
     * within the last 24 hours
     */
    private boolean hasExistingReminderNotification(Long userId, Long experienceId,
            LocalDateTime experienceStartDateTime) {
        try {
            // Look for existing REMINDER notifications for this user within the last 24
            // hours
            // Check if there's already a notification with the experience title in the
            // message
            List<Notification> existingNotifications = notificationRepository
                    .findByUserIdAndTypeAndCreatedAtGreaterThan(
                            userId,
                            NotificationType.REMINDER,
                            experienceStartDateTime.minusHours(24) // Check notifications from 24 hours before the
                                                                   // experience
                    );

            // Check if any existing notification mentions this experience (simple text
            // matching)
            // For more robust checking, you could add experience_id field to notification
            // table
            return existingNotifications.stream()
                    .anyMatch(notification -> notification.getTitle().contains("Experience Reminder") &&
                            notification.getCreatedAt().toLocalDate().equals(LocalDate.now(SINGAPORE_ZONE)));
        } catch (Exception e) {
            logger.error("Error checking existing notifications for user {} and experience {}", userId, experienceId,
                    e);
            return false; // If error, assume no existing notification and proceed
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
            logger.info("Creating notification for booking ID: {} for user ID: {}",
                    booking.getBookingId(), booking.getTraveler().getId());

            Notification notification = new Notification();
            notification.setUser(booking.getTraveler());
            notification.setType(NotificationType.REMINDER);
            notification.setTitle("Experience Reminder - Coming Up Soon!");

            String message = String.format(
                    "Don't forget! Your experience \"%s\" is scheduled at %s %s. " +
                            "Please arrive 15 minutes early. Have a great time!",
                    schedule.getExperience().getTitle(),
                    schedule.getStartDateTime().toLocalDate().toString(),
                    schedule.getStartDateTime().toLocalTime().toString());

            notification.setMessage(message);
            notification.setIsRead(false);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setSentAt(LocalDateTime.now());

            logger.info("About to save notification to database...");
            Notification savedNotification = notificationRepository.save(notification);
            logger.info("Successfully saved notification with ID: {} for user {} for experience \"{}\"",
                    savedNotification.getNotificationId(),
                    booking.getTraveler().getId(),
                    schedule.getExperience().getTitle());

        } catch (Exception e) {
            logger.error("Error creating notification for booking ID: {}", booking.getBookingId(), e);
            e.printStackTrace(); // Add stack trace for debugging
        }
    }

    /**
     * Manual trigger method for testing purposes
     * This can be called via a REST endpoint for testing
     */
    public void triggerManualReminder() {
        logger.info("Manual booking reminder trigger initiated");
        sendHourlyBookingReminders();
    }
}