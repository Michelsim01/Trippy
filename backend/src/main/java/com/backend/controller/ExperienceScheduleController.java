package com.backend.controller;

import com.backend.entity.ExperienceSchedule;
import com.backend.entity.BookingStatus;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.BookingRepository;
import com.backend.service.ExperienceScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/experience-schedules")
public class ExperienceScheduleController {

    @Autowired
    private ExperienceScheduleService experienceScheduleService;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    /**
     * Get schedule details by ID with real-time availability
     * Essential for checkout process to verify schedule still available
     * 
     * @param scheduleId the ID of the schedule
     * @return Schedule details with current availability information
     */
    @GetMapping("/{scheduleId}")
    public ResponseEntity<Map<String, Object>> getScheduleById(@PathVariable Long scheduleId) {
        try {
            if (scheduleId == null || scheduleId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<ExperienceSchedule> scheduleOpt = experienceScheduleRepository.findById(scheduleId);
            if (!scheduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ExperienceSchedule schedule = scheduleOpt.get();
            Map<String, Object> response = createScheduleResponseWithAvailability(schedule);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error retrieving schedule with ID " + scheduleId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all schedules for an experience with real-time availability
     * Used in experience detail pages and schedule selection
     * 
     * @param experienceId the ID of the experience
     * @return List of schedules with current availability information
     */
    @GetMapping("/experience/{experienceId}")
    public ResponseEntity<List<Map<String, Object>>> getSchedulesByExperienceId(@PathVariable Long experienceId) {
        try {
            if (experienceId == null || experienceId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<ExperienceSchedule> schedules = experienceScheduleRepository
                    .findByExperience_ExperienceId(experienceId);

            List<Map<String, Object>> scheduleResponses = schedules.stream()
                    .map(this::createScheduleResponseWithAvailability)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(scheduleResponses);

        } catch (Exception e) {
            System.err.println("Error retrieving schedules for experience " + experienceId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Check real-time availability for a specific schedule and participant count
     * Critical for checkout process validation
     * 
     * @param scheduleId   the ID of the schedule
     * @param participants the number of participants requested
     * @return Availability status and remaining spots
     */
    @GetMapping("/{scheduleId}/availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @PathVariable Long scheduleId,
            @RequestParam Integer participants) {
        try {
            if (scheduleId == null || scheduleId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            if (participants == null || participants <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<ExperienceSchedule> scheduleOpt = experienceScheduleRepository.findById(scheduleId);
            if (!scheduleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ExperienceSchedule schedule = scheduleOpt.get();

            // Use stored availableSpots directly (already decremented when bookings
            // confirmed)
            int confirmedBookings = bookingRepository.countParticipantsByScheduleIdAndStatus(scheduleId,
                    BookingStatus.CONFIRMED);
            int availableSpots = schedule.getAvailableSpots();
            boolean isAvailable = availableSpots >= participants && schedule.getIsAvailable()
                    && schedule.getStartDateTime().isAfter(LocalDateTime.now());

            Map<String, Object> response = new HashMap<>();
            response.put("scheduleId", scheduleId);
            response.put("requestedParticipants", participants);
            response.put("availableSpots", availableSpots);
            response.put("totalSpots", schedule.getExperience().getParticipantsAllowed());
            response.put("confirmedBookings", confirmedBookings);
            response.put("isAvailable", isAvailable);
            response.put("startDateTime", schedule.getStartDateTime());
            response.put("endDateTime", schedule.getEndDateTime());

            if (!isAvailable) {
                if (availableSpots < participants) {
                    response.put("reason", "Not enough spots available");
                } else if (!schedule.getIsAvailable()) {
                    response.put("reason", "Schedule is not available");
                } else if (schedule.getStartDateTime().isBefore(LocalDateTime.now())) {
                    response.put("reason", "Schedule has already started");
                }
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error checking availability for schedule " + scheduleId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get available schedules only for an experience
     * Useful for checkout schedule selection - only shows bookable schedules
     * 
     * @param experienceId the ID of the experience
     * @return List of available schedules only
     */
    @GetMapping("/experience/{experienceId}/available")
    public ResponseEntity<List<Map<String, Object>>> getAvailableSchedulesByExperienceId(
            @PathVariable Long experienceId) {
        try {
            if (experienceId == null || experienceId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<ExperienceSchedule> allSchedules = experienceScheduleRepository
                    .findByExperience_ExperienceId(experienceId);
            LocalDateTime now = LocalDateTime.now();

            List<Map<String, Object>> availableSchedules = allSchedules.stream()
                    .filter(schedule -> schedule.getIsAvailable() && schedule.getStartDateTime().isAfter(now))
                    .map(this::createScheduleResponseWithAvailability)
                    .filter(scheduleMap -> (Boolean) scheduleMap.get("hasAvailableSpots"))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(availableSchedules);

        } catch (Exception e) {
            System.err.println(
                    "Error retrieving available schedules for experience " + experienceId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Admin endpoints (keep for schedule management)
    @PostMapping
    public ResponseEntity<ExperienceSchedule> createExperienceSchedule(
            @RequestBody ExperienceSchedule experienceSchedule) {
        try {
            ExperienceSchedule savedSchedule = experienceScheduleService.createExperienceSchedule(experienceSchedule);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedSchedule);
        } catch (Exception e) {
            System.err.println("Error creating schedule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExperienceSchedule> updateExperienceSchedule(@PathVariable Long id,
            @RequestBody ExperienceSchedule experienceSchedule) {
        try {
            ExperienceSchedule updatedSchedule = experienceScheduleService.updateExperienceSchedule(id,
                    experienceSchedule);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            System.err.println("Error updating schedule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExperienceSchedule(@PathVariable Long id) {
        try {
            experienceScheduleService.deleteExperienceSchedule(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting schedule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Helper method to create schedule response with real-time availability
     * information
     * Used by multiple endpoints to ensure consistent availability data
     */
    private Map<String, Object> createScheduleResponseWithAvailability(ExperienceSchedule schedule) {
        // Use stored availableSpots directly (already decremented when bookings
        // confirmed)
        int availableSpots = schedule.getAvailableSpots();
        int confirmedBookings = bookingRepository.countParticipantsByScheduleIdAndStatus(
                schedule.getScheduleId(), BookingStatus.CONFIRMED);
        boolean hasAvailableSpots = availableSpots > 0;
        boolean isBookable = hasAvailableSpots && schedule.getIsAvailable()
                && schedule.getStartDateTime().isAfter(LocalDateTime.now());

        Map<String, Object> scheduleMap = new HashMap<>();
        scheduleMap.put("scheduleId", schedule.getScheduleId());
        scheduleMap.put("startDateTime", schedule.getStartDateTime());
        scheduleMap.put("endDateTime", schedule.getEndDateTime());
        scheduleMap.put("totalSpots", schedule.getExperience().getParticipantsAllowed());
        scheduleMap.put("availableSpots", availableSpots);
        scheduleMap.put("confirmedBookings", confirmedBookings);
        scheduleMap.put("isAvailable", schedule.getIsAvailable());
        scheduleMap.put("hasAvailableSpots", hasAvailableSpots);
        scheduleMap.put("isBookable", isBookable);
        scheduleMap.put("createdAt", schedule.getCreatedAt());

        return scheduleMap;
    }
}
