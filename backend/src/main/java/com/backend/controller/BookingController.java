package com.backend.controller;

import com.backend.entity.Booking;
import com.backend.entity.ExperienceSchedule;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            System.err.println("Error retrieving all bookings: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<Booking> booking = bookingRepository.findById(id);
            if (booking.isPresent()) {
                return ResponseEntity.ok(booking.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving booking with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        try {
            if (booking == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Booking savedBooking = bookingRepository.save(booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
        } catch (Exception e) {
            System.err.println("Error creating booking: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable Long id, @RequestBody Booking booking) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (booking == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!bookingRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            booking.setBookingId(id);
            Booking savedBooking = bookingRepository.save(booking);
            return ResponseEntity.ok(savedBooking);
        } catch (Exception e) {
            System.err.println("Error updating booking with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!bookingRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            bookingRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting booking with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Calendar endpoints
    @GetMapping("/user/{userId}/calendar")
    public ResponseEntity<Map<String, Object>> getUserCalendarBookings(@PathVariable Long userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            System.out.println("DEBUG: Calendar endpoint called for userId: " + userId);
            System.out.println("DEBUG: Date range: " + startDate + " to " + endDate);
            
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user ID"));
            }

            List<Booking> participantBookings;
            List<ExperienceSchedule> guideSchedules; // Changed from guideBookings to guideSchedules

            if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDateTime.parse(startDate, DateTimeFormatter.ISO_DATE_TIME);
                LocalDateTime end = LocalDateTime.parse(endDate, DateTimeFormatter.ISO_DATE_TIME);
                
                participantBookings = bookingRepository
                        .findByTravelerIdAndDateRangeOrderByScheduleStartDateTimeAsc(userId, start, end);
                guideSchedules = experienceScheduleRepository
                        .findByGuideIdAndDateRangeOrderByStartDateTimeAsc(userId, start, end);
                        
                System.out.println("DEBUG: Found " + participantBookings.size() + " participant bookings for date range");
                System.out.println("DEBUG: Found " + guideSchedules.size() + " guide schedules for date range");
            } else {
                participantBookings = bookingRepository
                        .findByTraveler_IdOrderByExperienceSchedule_StartDateTimeAsc(userId);
                guideSchedules = experienceScheduleRepository.findByGuideIdOrderByStartDateTimeAsc(userId);
                
                System.out.println("DEBUG: Found " + participantBookings.size() + " participant bookings (all time)");
                System.out.println("DEBUG: Found " + guideSchedules.size() + " guide schedules (all time)");
            }
            
            // Debug: Print some details about guide schedules
            for (ExperienceSchedule schedule : guideSchedules) {
                System.out.println("DEBUG: Guide schedule - ID: " + schedule.getScheduleId() + 
                    ", Experience: " + schedule.getExperience().getTitle() +
                    ", Guide ID: " + schedule.getExperience().getGuide().getId() +
                    ", Start: " + schedule.getStartDateTime());
            }

            // Transform bookings and schedules to calendar events
            List<Map<String, Object>> participantEvents = transformBookingsToEvents(participantBookings, "participant");
            List<Map<String, Object>> guideEvents = transformSchedulesToEvents(guideSchedules, "guide");

            Map<String, Object> response = new HashMap<>();
            response.put("participantEvents", participantEvents);
            response.put("guideEvents", guideEvents);
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error retrieving calendar bookings for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve calendar data", "success", false));
        }
    }

    private List<Map<String, Object>> transformBookingsToEvents(List<Booking> bookings, String userRole) {
        List<Map<String, Object>> events = new ArrayList<>();
        
        for (Booking booking : bookings) {
            ExperienceSchedule schedule = booking.getExperienceSchedule();
            Map<String, Object> event = new HashMap<>();
            
            event.put("id", booking.getBookingId());
            event.put("bookingId", booking.getBookingId());
            event.put("experienceId", schedule.getExperience().getExperienceId());
            event.put("title", schedule.getExperience().getTitle());
            event.put("description", schedule.getExperience().getShortDescription());
            event.put("location", schedule.getExperience().getLocation());
            event.put("country", schedule.getExperience().getCountry() != null ? schedule.getExperience().getCountry() : "Unknown");
            event.put("startDateTime", schedule.getStartDateTime());
            event.put("endDateTime", schedule.getEndDateTime());
            event.put("status", booking.getStatus().toString());
            event.put("paymentStatus", booking.getPaymentStatus().toString());
            event.put("totalAmount", booking.getTotalAmount());
            event.put("numberOfParticipants", booking.getNumberOfParticipants());
            event.put("confirmationCode", booking.getConfirmationCode());
            event.put("userRole", userRole); // "participant" or "guide"
            event.put("coverPhotoUrl", schedule.getExperience().getCoverPhotoUrl());
            event.put("price", schedule.getExperience().getPrice());
            event.put("duration", schedule.getExperience().getDuration());
            event.put("category", schedule.getExperience().getCategory().toString());
            
            // Determine if this is a past or future event
            LocalDateTime now = LocalDateTime.now();
            event.put("isPast", schedule.getEndDateTime().isBefore(now));
            
            events.add(event);
        }
        
        return events;
    }
    
    private List<Map<String, Object>> transformSchedulesToEvents(List<ExperienceSchedule> schedules, String userRole) {
        List<Map<String, Object>> events = new ArrayList<>();
        
        for (ExperienceSchedule schedule : schedules) {
            Map<String, Object> event = new HashMap<>();
            
            // For guide events, we use the schedule ID as the main ID since there might not be bookings yet
            event.put("id", schedule.getScheduleId());
            event.put("scheduleId", schedule.getScheduleId());
            event.put("experienceId", schedule.getExperience().getExperienceId());
            event.put("title", schedule.getExperience().getTitle());
            event.put("description", schedule.getExperience().getShortDescription());
            event.put("location", schedule.getExperience().getLocation());
            event.put("country", schedule.getExperience().getCountry() != null ? schedule.getExperience().getCountry() : "Unknown");
            event.put("startDateTime", schedule.getStartDateTime());
            event.put("endDateTime", schedule.getEndDateTime());
            
            // For guide events from schedules, we don't have booking-specific info
            event.put("status", "SCHEDULED"); // Default status for scheduled events
            event.put("paymentStatus", "N/A"); // Not applicable for guide view
            event.put("totalAmount", 0); // Not applicable for guide view
            event.put("numberOfParticipants", schedule.getBookings() != null ? schedule.getBookings().size() : 0);
            event.put("confirmationCode", "N/A"); // Not applicable for guide view
            event.put("userRole", userRole); // "guide"
            event.put("coverPhotoUrl", schedule.getExperience().getCoverPhotoUrl());
            event.put("price", schedule.getExperience().getPrice());
            event.put("duration", schedule.getExperience().getDuration());
            event.put("category", schedule.getExperience().getCategory().toString());
            event.put("availableSpots", schedule.getAvailableSpots());
            event.put("isAvailable", schedule.getIsAvailable());
            
            // Determine if this is a past or future event
            LocalDateTime now = LocalDateTime.now();
            event.put("isPast", schedule.getEndDateTime().isBefore(now));
            
            events.add(event);
        }
        
        return events;
    }
    
    // Debug endpoint to check guide data
    @GetMapping("/debug/user/{userId}")
    public ResponseEntity<Map<String, Object>> debugUserData(@PathVariable Long userId) {
        try {
            Map<String, Object> debug = new HashMap<>();
            
            // Check all bookings where user is participant
            List<Booking> participantBookings = bookingRepository.findByTraveler_IdOrderByExperienceSchedule_StartDateTimeAsc(userId);
            debug.put("participantBookingsCount", participantBookings.size());
            
            // Check all schedules where user is guide (NEW - this is the correct source)
            List<ExperienceSchedule> guideSchedules = experienceScheduleRepository.findByGuideIdOrderByStartDateTimeAsc(userId);
            debug.put("guideSchedulesCount", guideSchedules.size());
            
            // Check all bookings where user is guide (OLD - for comparison)
            List<Booking> guideBookings = bookingRepository.findByGuideIdOrderByScheduleStartDateTimeAsc(userId);
            debug.put("guideBookingsCount", guideBookings.size());
            
            // Get some sample data
            List<Map<String, Object>> participantDetails = new ArrayList<>();
            for (int i = 0; i < Math.min(3, participantBookings.size()); i++) {
                Booking b = participantBookings.get(i);
                Map<String, Object> detail = new HashMap<>();
                detail.put("bookingId", b.getBookingId());
                detail.put("title", b.getExperienceSchedule().getExperience().getTitle());
                detail.put("startDateTime", b.getExperienceSchedule().getStartDateTime());
                participantDetails.add(detail);
            }
            debug.put("participantSample", participantDetails);
            
            // Guide schedules sample (NEW)
            List<Map<String, Object>> guideScheduleDetails = new ArrayList<>();
            for (int i = 0; i < Math.min(3, guideSchedules.size()); i++) {
                ExperienceSchedule s = guideSchedules.get(i);
                Map<String, Object> detail = new HashMap<>();
                detail.put("scheduleId", s.getScheduleId());
                detail.put("title", s.getExperience().getTitle());
                detail.put("guideId", s.getExperience().getGuide().getId());
                detail.put("startDateTime", s.getStartDateTime());
                detail.put("availableSpots", s.getAvailableSpots());
                guideScheduleDetails.add(detail);
            }
            debug.put("guideScheduleSample", guideScheduleDetails);
            
            // Guide bookings sample (OLD - for comparison)
            List<Map<String, Object>> guideDetails = new ArrayList<>();
            for (int i = 0; i < Math.min(3, guideBookings.size()); i++) {
                Booking b = guideBookings.get(i);
                Map<String, Object> detail = new HashMap<>();
                detail.put("bookingId", b.getBookingId());
                detail.put("title", b.getExperienceSchedule().getExperience().getTitle());
                detail.put("guideId", b.getExperienceSchedule().getExperience().getGuide().getId());
                detail.put("startDateTime", b.getExperienceSchedule().getStartDateTime());
                guideDetails.add(detail);
            }
            debug.put("guideSample", guideDetails);
            
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
