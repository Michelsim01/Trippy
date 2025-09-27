package com.backend.controller;

import com.backend.dto.*;
import com.backend.dto.request.*;
import com.backend.dto.response.*;
import com.backend.entity.Transaction;
import com.backend.repository.TransactionRepository;
import com.backend.service.BookingService;
import com.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private TransactionRepository transactionRepository;

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
}