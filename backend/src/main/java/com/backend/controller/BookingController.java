package com.backend.controller;

import com.backend.dto.*;
import com.backend.dto.request.*;
import com.backend.dto.response.*;
import com.backend.entity.Booking;
import com.backend.entity.BookingStatus;
import com.backend.entity.ExperienceSchedule;
import com.backend.entity.Transaction;
import com.backend.entity.Notification;
import com.backend.entity.NotificationType;
import com.backend.entity.User;
import com.backend.repository.BookingRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.TransactionRepository;
import com.backend.repository.NotificationRepository;
import com.backend.repository.UserRepository;
import com.backend.service.BookingService;
import com.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // ================================
    // BOOKING MANAGEMENT METHODS
    // ================================

    /**
     * Validate a booking request before creation
     * 
     * @param bookingRequest the booking request to validate
     * @return BookingValidationDTO with validation results
     */
    @PostMapping("/validate")
    public ResponseEntity<BookingValidationDTO> validateBooking(@Valid @RequestBody BookingRequestDTO bookingRequest) {
        try {
            if (bookingRequest == null) {
                return ResponseEntity.badRequest().build();
            }

            BookingValidationDTO validation = bookingService.validateBooking(bookingRequest);
            return ResponseEntity.ok(validation);

        } catch (Exception e) {
            System.err.println("Error validating booking: " + e.getMessage());
            BookingValidationDTO errorValidation = new BookingValidationDTO();
            errorValidation.setValid(false);
            errorValidation.setMessage("Validation error occurred");
            errorValidation.addValidationError("System error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorValidation);
        }
    }

    /**
     * Create a new booking in PENDING status
     * 
     * @param bookingRequest the booking request containing all booking details
     * @return BookingResponseDTO with created booking information
     */
    @PostMapping("/create")
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingRequestDTO bookingRequest) {
        try {
            if (bookingRequest == null) {
                return ResponseEntity.badRequest().build();
            }

            BookingResponseDTO booking = bookingService.createBooking(bookingRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(booking);

        } catch (IllegalArgumentException e) {
            System.err.println("Booking validation error: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            System.err.println("Booking creation error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("Unexpected booking error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get booking details by booking ID
     * 
     * @param bookingId the ID of the booking to retrieve
     * @return BookingResponseDTO with complete booking information
     */
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long bookingId) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            BookingResponseDTO booking = bookingService.getBookingById(bookingId);
            return ResponseEntity.ok(booking);

        } catch (IllegalArgumentException e) {
            System.err.println("Booking not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error retrieving booking with ID " + bookingId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * <<<<<<< Updated upstream
     * Get booking details by confirmation code
     * 
     * @param confirmationCode the confirmation code of the booking
     * @return BookingResponseDTO with complete booking information
     */
    @GetMapping("/confirmation/{confirmationCode}")
    public ResponseEntity<BookingResponseDTO> getBookingByConfirmationCode(@PathVariable String confirmationCode) {
        try {
            // Enhanced validation for confirmation code format
            if (!isValidConfirmationCodeFormat(confirmationCode)) {
                System.err.println("Invalid confirmation code format: " + confirmationCode);
                return ResponseEntity.badRequest().build();
            }

            BookingResponseDTO booking = bookingService.getBookingByConfirmationCode(confirmationCode);
            return ResponseEntity.ok(booking);

        } catch (IllegalArgumentException e) {
            System.err.println("Booking not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println(
                    "Error retrieving booking with confirmation code " + confirmationCode + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * =======
     * >>>>>>> Stashed changes
     * Get all bookings for a user by email
     * 
     * @param email the email address of the user
     * @return List of BookingSummaryDTO containing user's bookings
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<List<BookingSummaryDTO>> getUserBookings(@PathVariable String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            List<BookingSummaryDTO> bookings = bookingService.getUserBookings(email);
            return ResponseEntity.ok(bookings);

        } catch (Exception e) {
            System.err.println("Error retrieving bookings for user " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Calculate pricing for a booking - internal method for frontend to calculate
     * pricing
     * 
     * @param experienceScheduleId the ID of the experience schedule
     * @param numberOfParticipants the number of participants
     * @return BookingPricingDTO with calculated pricing breakdown
     */
    @GetMapping("/calculate-pricing")
    public ResponseEntity<BookingPricingDTO> calculatePricing(
            @RequestParam Long experienceScheduleId,
            @RequestParam Integer numberOfParticipants) {
        try {
            if (experienceScheduleId == null || experienceScheduleId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            if (numberOfParticipants == null || numberOfParticipants <= 0) {
                return ResponseEntity.badRequest().build();
            }

            BookingPricingDTO pricing = bookingService.calculatePricing(experienceScheduleId, numberOfParticipants);
            return ResponseEntity.ok(pricing);

        } catch (IllegalArgumentException e) {
            System.err.println("Pricing calculation error: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error calculating pricing: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancel an existing booking
     * 
     * @param bookingId the ID of the booking to cancel
     * @param reason    the reason for cancellation
     * @return BookingResponseDTO with updated booking information
     */
    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam String reason) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            BookingResponseDTO booking = bookingService.cancelBooking(bookingId, reason);
            return ResponseEntity.ok(booking);

        } catch (IllegalArgumentException e) {
            System.err.println("Booking not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            System.err.println("Cancellation state error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            System.err.println("Error cancelling booking " + bookingId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================================
    // PAYMENT PROCESSING METHODS
    // ================================

    /**
     * Process payment for an existing booking
     * 
     * @param bookingId    the ID of the booking to process payment for
     * @param paymentToken the Stripe payment token from the client
     * @return BookingResponseDTO with updated booking information
     */
    @PostMapping("/{bookingId}/process-payment")
    public ResponseEntity<BookingResponseDTO> processPayment(
            @PathVariable Long bookingId,
            @RequestParam String paymentToken) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest()
                        .body(BookingResponseDTO.failure("Invalid booking ID", "INVALID_BOOKING_ID"));
            }
            if (paymentToken == null || paymentToken.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(BookingResponseDTO.failure("Payment token is required", "INVALID_PAYMENT_TOKEN"));
            }

            BookingResponseDTO booking = bookingService.processPaymentAndConfirmBooking(bookingId, paymentToken);
            return ResponseEntity.ok(booking);

        } catch (IllegalArgumentException e) {
            System.err.println("Payment validation error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(BookingResponseDTO.failure(e.getMessage(), "VALIDATION_ERROR"));
        } catch (IllegalStateException e) {
            System.err.println("Payment state error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(BookingResponseDTO.failure(e.getMessage(), "PAYMENT_STATE_ERROR"));
        } catch (RuntimeException e) {
            System.err.println("Payment processing error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(BookingResponseDTO.failure(e.getMessage(), "PAYMENT_FAILED"));
        } catch (Exception e) {
            System.err.println("Unexpected payment error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(BookingResponseDTO.failure("Internal server error", "INTERNAL_ERROR"));
        }
    }

    /**
     * Process a refund for a booking transaction
     * 
     * @param bookingId     the booking ID containing the transaction to refund
     * @param transactionId the original transaction ID to refund
     * @param refundAmount  the amount to refund (optional, defaults to full amount)
     * @param reason        the reason for refund (optional)
     * @return PaymentResponseDTO for the refund transaction
     */
    @PostMapping("/{bookingId}/refund/{transactionId}")
    public ResponseEntity<PaymentResponseDTO> processRefund(
            @PathVariable Long bookingId,
            @PathVariable Long transactionId,
            @RequestParam(required = false) BigDecimal refundAmount,
            @RequestParam(required = false) String reason) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest()
                        .body(PaymentResponseDTO.failure("Invalid booking ID", "INVALID_BOOKING_ID"));
            }
            if (transactionId == null || transactionId <= 0) {
                return ResponseEntity.badRequest()
                        .body(PaymentResponseDTO.failure("Invalid transaction ID", "INVALID_TRANSACTION_ID"));
            }

            Optional<Transaction> originalTransaction = transactionRepository.findById(transactionId);
            if (!originalTransaction.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(PaymentResponseDTO.failure("Transaction not found", "TRANSACTION_NOT_FOUND"));
            }

            // Verify transaction belongs to the booking
            if (!originalTransaction.get().getBooking().getBookingId().equals(bookingId)) {
                return ResponseEntity.badRequest()
                        .body(PaymentResponseDTO.failure("Transaction does not belong to this booking",
                                "TRANSACTION_BOOKING_MISMATCH"));
            }

            // If no refund amount specified, refund the full amount
            BigDecimal amountToRefund = refundAmount != null ? refundAmount : originalTransaction.get().getAmount();

            Transaction refundTransaction = paymentService.processRefund(
                    originalTransaction.get(),
                    amountToRefund,
                    reason);

            PaymentTransactionDTO dto = convertToPaymentTransactionDTO(refundTransaction);
            return ResponseEntity.ok(PaymentResponseDTO.refundSuccess(dto));

        } catch (IllegalArgumentException e) {
            System.err.println("Refund validation error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(PaymentResponseDTO.failure(e.getMessage(), "VALIDATION_ERROR"));
        } catch (IllegalStateException e) {
            System.err.println("Refund state error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(PaymentResponseDTO.failure(e.getMessage(), "INVALID_TRANSACTION_STATE"));
        } catch (RuntimeException e) {
            System.err.println("Refund processing error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(PaymentResponseDTO.failure(e.getMessage(), "REFUND_FAILED"));
        } catch (Exception e) {
            System.err.println("Unexpected refund error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PaymentResponseDTO.failure("Internal server error", "INTERNAL_ERROR"));
        }
    }

    /**
     * Calculate service fee for a given base amount
     * 
     * @param baseAmount the base booking amount
     * @return calculated service fee
     */
    @GetMapping("/calculate-fee")
    public ResponseEntity<BigDecimal> calculateServiceFee(@RequestParam BigDecimal baseAmount) {
        try {
            if (baseAmount == null || baseAmount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().build();
            }

            BigDecimal serviceFee = paymentService.calculateServiceFee(baseAmount);
            return ResponseEntity.ok(serviceFee);
        } catch (Exception e) {
            System.err.println("Error calculating service fee: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Calculate total amount including service fee
     * 
     * @param baseAmount the base booking amount
     * @return total amount including service fee
     */
    @GetMapping("/calculate-total")
    public ResponseEntity<BigDecimal> calculateTotalAmount(@RequestParam BigDecimal baseAmount) {
        try {
            if (baseAmount == null || baseAmount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().build();
            }

            BigDecimal serviceFee = paymentService.calculateServiceFee(baseAmount);
            BigDecimal totalAmount = paymentService.calculateTotalAmount(baseAmount, serviceFee);
            return ResponseEntity.ok(totalAmount);
        } catch (Exception e) {
            System.err.println("Error calculating total amount: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================================
    // TRANSACTION MANAGEMENT METHODS
    // ================================

    /**
     * Get all transactions for a specific booking
     * 
     * @param bookingId the booking ID
     * @return List of transactions for the booking
     */
    @GetMapping("/{bookingId}/transactions")
    public ResponseEntity<List<PaymentTransactionDTO>> getTransactionsByBooking(@PathVariable Long bookingId) {
        try {
            if (bookingId == null || bookingId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Transaction> transactions = transactionRepository
                    .findByBookingBookingIdOrderByCreatedAtDesc(bookingId);
            List<PaymentTransactionDTO> transactionDTOs = transactions.stream()
                    .map(this::convertToPaymentTransactionDTO)
                    .toList();

            return ResponseEntity.ok(transactionDTOs);
        } catch (Exception e) {
            System.err.println("Error retrieving transactions for booking " + bookingId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================================
    // HELPER METHODS
    // ================================

    /**
     * Validate confirmation code format
     * 
     * Ensures the confirmation code matches the expected format:
     * - Starts with "TRP-"
     * - Followed by 8-12 alphanumeric characters (uppercase)
     * - Total length between 12-16 characters
     * 
     * @param confirmationCode the confirmation code to validate
     * @return true if format is valid, false otherwise
     */
    private boolean isValidConfirmationCodeFormat(String confirmationCode) {
        if (confirmationCode == null) {
            return false;
        }

        // Remove any whitespace
        confirmationCode = confirmationCode.trim().toUpperCase();

        // Check basic format: TRP- followed by 8-12 alphanumeric characters
        // This accommodates both normal (8 chars) and extended (12 chars) codes from
        // uniqueness fallback
        return confirmationCode.matches("^TRP-[A-Z0-9]{8,12}$") &&
                confirmationCode.length() >= 12 &&
                confirmationCode.length() <= 16;
    }

    /**
     * Helper method to convert Transaction entity to PaymentTransactionDTO
     */
    private PaymentTransactionDTO convertToPaymentTransactionDTO(Transaction transaction) {
        return new PaymentTransactionDTO(
                transaction.getTransactionId(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getPaymentMethod(),
                transaction.getLastFourDigits(),
                transaction.getCardBrand(),
                transaction.getCreatedAt());
    }

    // Complete timeslot endpoint - marks all CONFIRMED bookings for a schedule as
    // COMPLETED
    @PutMapping("/complete-timeslot/{scheduleId}")
    public ResponseEntity<Map<String, Object>> completeTimeslot(@PathVariable Long scheduleId) {
        try {
            if (scheduleId == null || scheduleId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            // Verify schedule exists
            Optional<ExperienceSchedule> scheduleOpt = experienceScheduleRepository.findById(scheduleId);
            if (scheduleOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ExperienceSchedule schedule = scheduleOpt.get();

            // Find all CONFIRMED bookings for this schedule
            List<Booking> confirmedBookings = bookingRepository.findAll().stream()
                    .filter(booking -> booking.getExperienceSchedule() != null &&
                            booking.getExperienceSchedule().getScheduleId().equals(scheduleId) &&
                            booking.getStatus() == BookingStatus.CONFIRMED)
                    .collect(Collectors.toList());

            // Update all confirmed bookings to COMPLETED
            int updatedCount = 0;
            for (Booking booking : confirmedBookings) {
                booking.setStatus(BookingStatus.COMPLETED);
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
                updatedCount++;

                // Send review request notification to each participant
                try {
                    User traveler = booking.getTraveler();
                    if (traveler != null) {
                        Notification notification = new Notification();
                        notification.setTitle("Review Request");
                        notification.setMessage(String.format(
                                "Your tour '%s' has been completed! Please go to my bookings page to leave a review. You will earn trippoints for your feedback.",
                                schedule.getExperience().getTitle()));
                        notification.setUser(traveler);
                        notification.setType(NotificationType.REVIEW_REQUEST);
                        notification.setCreatedAt(LocalDateTime.now());
                        notification.setIsRead(false);

                        notificationRepository.save(notification);
                        System.out.println("Sent review request notification to user ID: " + traveler.getId());
                    }
                } catch (Exception notificationError) {
                    System.err.println("Error sending notification for booking " + booking.getBookingId() + ": "
                            + notificationError.getMessage());
                    // Continue processing other bookings even if notification fails
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Timeslot completed successfully");
            response.put("updatedBookingsCount", updatedCount);
            response.put("scheduleId", scheduleId);
            response.put("notificationsSent", updatedCount); // Number of notifications sent

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error completing timeslot " + scheduleId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all participants (user IDs) for a specific schedule
     * 
     * @param scheduleId the ID of the experience schedule
     * @return List of user IDs who have bookings for this schedule
     */
    @GetMapping("/schedule/{scheduleId}/participants")
    public ResponseEntity<Map<String, Object>> getScheduleParticipants(@PathVariable Long scheduleId) {
        try {
            if (scheduleId == null || scheduleId <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid schedule ID"));
            }

            // Find all bookings for this schedule (both CONFIRMED and COMPLETED)
            List<BookingStatus> activeStatuses = List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);
            List<Booking> bookings = bookingRepository.findByScheduleIdAndStatusIn(scheduleId, activeStatuses);

            // Extract unique user IDs
            List<Long> participantIds = bookings.stream()
                    .map(booking -> booking.getTraveler().getId())
                    .distinct()
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("scheduleId", scheduleId);
            response.put("participantIds", participantIds);
            response.put("totalParticipants", participantIds.size());
            response.put("totalBookings", bookings.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error retrieving participants for schedule " + scheduleId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve participants", "success", false));
        }
    }

    // ================================
    // GUIDE CANCELLATION METHODS
    // ================================

    /**
     * Cancel an experience schedule by guide
     *
     * @param scheduleId the ID of the schedule to cancel
     * @param reason     the reason for cancellation
     * @return GuideCancellationResponseDTO with cancellation results
     */
    @PostMapping("/experiences/schedules/{scheduleId}/cancel")
    public ResponseEntity<GuideCancellationResponseDTO> cancelScheduleByGuide(
            @PathVariable Long scheduleId,
            @RequestParam String reason) {
        try {
            if (scheduleId == null || scheduleId <= 0) {
                return ResponseEntity.badRequest()
                        .body(GuideCancellationResponseDTO.failure("Invalid schedule ID", "INVALID_SCHEDULE_ID"));
            }

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(GuideCancellationResponseDTO.failure("Cancellation reason is required",
                                "MISSING_REASON"));
            }

            // Get current authenticated user
            Long guideId = getCurrentAuthenticatedUserId();

            if (guideId == null) {
                System.err.println("ERROR: Authentication failed for guide cancellation");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(GuideCancellationResponseDTO.failure("Authentication required", "UNAUTHORIZED"));
            }

            GuideCancellationResponseDTO result = bookingService.cancelScheduleByGuide(scheduleId, reason, guideId);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            System.err.println("Guide cancellation validation error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(GuideCancellationResponseDTO.failure(e.getMessage(), "VALIDATION_ERROR"));
        } catch (IllegalStateException e) {
            System.err.println("Guide cancellation state error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(GuideCancellationResponseDTO.failure(e.getMessage(), "INVALID_STATE"));
        } catch (RuntimeException e) {
            System.err.println("Guide cancellation processing error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(GuideCancellationResponseDTO.failure(e.getMessage(), "PROCESSING_ERROR"));
        } catch (Exception e) {
            System.err.println("Unexpected guide cancellation error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(GuideCancellationResponseDTO.failure("Internal server error", "INTERNAL_ERROR"));
        }
    }

    /**
     * Helper method to get the current authenticated user ID
     */
    private Long getCurrentAuthenticatedUserId() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                System.err.println("ERROR: No authenticated user found");
                return null;
            }

            String userEmail = authentication.getName();
            System.out.println("DEBUG: Looking up user with email: " + userEmail);

            // Find user by email
            Optional<User> user = userRepository.findByEmailAndIsActive(userEmail, true);

            if (user.isPresent()) {
                System.out.println("DEBUG: Found user with ID: " + user.get().getId());
                return user.get().getId();
            } else {
                System.err.println("ERROR: User not found with email: " + userEmail);
                return null;
            }
        } catch (Exception e) {
            System.err.println("ERROR: Exception getting authenticated user ID: " + e.getMessage());
            e.printStackTrace();
            return null;
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

                System.out
                        .println("DEBUG: Found " + participantBookings.size() + " participant bookings for date range");
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
            event.put("country",
                    schedule.getExperience().getCountry() != null ? schedule.getExperience().getCountry() : "Unknown");
            event.put("startDateTime", schedule.getStartDateTime());
            event.put("endDateTime", schedule.getEndDateTime());
            event.put("status", booking.getStatus().toString());
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

            // For guide events, we use the schedule ID as the main ID since there might not
            // be bookings yet
            event.put("id", schedule.getScheduleId());
            event.put("scheduleId", schedule.getScheduleId());
            event.put("experienceId", schedule.getExperience().getExperienceId());
            event.put("title", schedule.getExperience().getTitle());
            event.put("description", schedule.getExperience().getShortDescription());
            event.put("location", schedule.getExperience().getLocation());
            event.put("country",
                    schedule.getExperience().getCountry() != null ? schedule.getExperience().getCountry() : "Unknown");
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
}