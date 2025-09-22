package com.backend.controller;

import com.backend.entity.Booking;
import com.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    @Autowired
    private BookingRepository bookingRepository;

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
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<Booking> bookingOpt = bookingRepository.findById(id);
            if (bookingOpt.isPresent()) {
                Booking booking = bookingOpt.get();

                // Create safe response object to avoid lazy loading issues
                Map<String, Object> bookingMap = new HashMap<>();
                bookingMap.put("bookingId", booking.getBookingId());
                bookingMap.put("confirmationCode", booking.getConfirmationCode());
                bookingMap.put("status", booking.getStatus());
                bookingMap.put("numberOfParticipants", booking.getNumberOfParticipants());
                bookingMap.put("totalAmount", booking.getTotalAmount());
                bookingMap.put("bookingDate", booking.getBookingDate());
                bookingMap.put("cancellationReason", booking.getCancellationReason());
                bookingMap.put("cancelledAt", booking.getCancelledAt());

                // Handle experienceSchedule safely
                if (booking.getExperienceSchedule() != null) {
                    Map<String, Object> scheduleMap = new HashMap<>();
                    scheduleMap.put("startDateTime", booking.getExperienceSchedule().getStartDateTime());
                    scheduleMap.put("endDateTime", booking.getExperienceSchedule().getEndDateTime());

                    // Handle experience within schedule safely
                    if (booking.getExperienceSchedule().getExperience() != null) {
                        Map<String, Object> experienceMap = new HashMap<>();
                        experienceMap.put("experienceId",
                                booking.getExperienceSchedule().getExperience().getExperienceId());
                        experienceMap.put("title", booking.getExperienceSchedule().getExperience().getTitle());
                        experienceMap.put("shortDescription",
                                booking.getExperienceSchedule().getExperience().getShortDescription());
                        experienceMap.put("fullDescription",
                                booking.getExperienceSchedule().getExperience().getFullDescription());
                        experienceMap.put("location", booking.getExperienceSchedule().getExperience().getLocation());
                        experienceMap.put("country", booking.getExperienceSchedule().getExperience().getCountry());
                        experienceMap.put("price", booking.getExperienceSchedule().getExperience().getPrice());
                        experienceMap.put("coverPhotoUrl", booking.getExperienceSchedule().getExperience().getCoverPhotoUrl());
                        experienceMap.put("importantInfo", booking.getExperienceSchedule().getExperience().getImportantInfo());
                        scheduleMap.put("experience", experienceMap);
                    }

                    bookingMap.put("experienceSchedule", scheduleMap);
                }

                return ResponseEntity.ok(bookingMap);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving booking with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to fetch booking: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBookings(@PathVariable Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Booking> bookings = bookingRepository.findByTraveler_Id(userId);

            // Create safe response objects to avoid lazy loading issues
            List<Map<String, Object>> safeBookings = bookings.stream().map(booking -> {
                Map<String, Object> bookingMap = new HashMap<>();
                bookingMap.put("bookingId", booking.getBookingId());
                bookingMap.put("confirmationCode", booking.getConfirmationCode());
                bookingMap.put("status", booking.getStatus());
                bookingMap.put("numberOfParticipants", booking.getNumberOfParticipants());
                bookingMap.put("totalAmount", booking.getTotalAmount());
                bookingMap.put("bookingDate", booking.getBookingDate());
                bookingMap.put("cancellationReason", booking.getCancellationReason());
                bookingMap.put("cancelledAt", booking.getCancelledAt());

                // Handle experienceSchedule safely
                if (booking.getExperienceSchedule() != null) {
                    Map<String, Object> scheduleMap = new HashMap<>();
                    scheduleMap.put("startDateTime", booking.getExperienceSchedule().getStartDateTime());
                    scheduleMap.put("endDateTime", booking.getExperienceSchedule().getEndDateTime());

                    // Handle experience within schedule safely
                    if (booking.getExperienceSchedule().getExperience() != null) {
                        Map<String, Object> experienceMap = new HashMap<>();
                        experienceMap.put("experienceId",
                                booking.getExperienceSchedule().getExperience().getExperienceId());
                        experienceMap.put("title", booking.getExperienceSchedule().getExperience().getTitle());
                        experienceMap.put("shortDescription",
                                booking.getExperienceSchedule().getExperience().getShortDescription());
                        experienceMap.put("location", booking.getExperienceSchedule().getExperience().getLocation());
                        experienceMap.put("country", booking.getExperienceSchedule().getExperience().getCountry());
                        experienceMap.put("price", booking.getExperienceSchedule().getExperience().getPrice());
                        experienceMap.put("coverPhotoUrl", booking.getExperienceSchedule().getExperience().getCoverPhotoUrl());
                        scheduleMap.put("experience", experienceMap);
                    }

                    bookingMap.put("experienceSchedule", scheduleMap);
                }

                return bookingMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(safeBookings);
        } catch (Exception e) {
            System.err.println("Error retrieving bookings for user ID " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to fetch bookings: " + e.getMessage()));
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
}
