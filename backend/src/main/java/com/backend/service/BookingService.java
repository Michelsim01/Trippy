package com.backend.service;

import com.backend.dto.*;
import com.backend.dto.request.*;
import com.backend.dto.response.*;
import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripPointsService tripPointsService;

    /**
     * Validate a booking request before creating the actual booking.
     * 
     * Performs comprehensive validation including:
     * - Experience schedule existence and availability
     * - Experience status (must be ACTIVE)
     * - Schedule timing (must be in future)
     * - Participant count vs available spots
     * - Pricing calculations and validation
     * - Contact information completeness
     * 
     * @param bookingRequest the booking request to validate
     * @return BookingValidationDTO containing validation results and any errors
     */
    public BookingValidationDTO validateBooking(BookingRequestDTO bookingRequest) {
        BookingValidationDTO validation = new BookingValidationDTO();

        try {
            // Get experience schedule
            Optional<ExperienceSchedule> scheduleOpt = experienceScheduleRepository
                    .findById(bookingRequest.getExperienceScheduleId());

            if (!scheduleOpt.isPresent()) {
                validation.addValidationError("Experience schedule not found");
                return validation;
            }

            ExperienceSchedule schedule = scheduleOpt.get();
            Experience experience = schedule.getExperience();

            // Validate experience is active
            if (experience.getStatus() != ExperienceStatus.ACTIVE) {
                validation.addValidationError("Experience is not active");
            }

            // Validate schedule is in future
            if (schedule.getStartDateTime().isBefore(LocalDateTime.now())) {
                validation.addValidationError("Cannot book past experiences");
            }

            // Check availability - use stored availableSpots directly (already decremented
            // when bookings confirmed)
            int availableSpots = schedule.getAvailableSpots();

            validation.setAvailable(availableSpots >= bookingRequest.getNumberOfParticipants());
            validation.setAvailableSpots(availableSpots);
            validation.setRequestedParticipants(bookingRequest.getNumberOfParticipants());

            if (availableSpots < bookingRequest.getNumberOfParticipants()) {
                validation.addValidationError("Not enough spots available. Available: " + availableSpots
                        + ", Requested: " + bookingRequest.getNumberOfParticipants());
            }

            // Validate pricing
            BookingPricingDTO pricing = new BookingPricingDTO(
                    experience.getPrice(),
                    bookingRequest.getNumberOfParticipants());

            // Account for trippoints discount in total validation
            BigDecimal expectedTotal = pricing.getTotalAmount();
            BigDecimal trippointsDiscount = bookingRequest.getTrippointsDiscount();
            if (trippointsDiscount != null && trippointsDiscount.compareTo(BigDecimal.ZERO) > 0) {
                expectedTotal = expectedTotal.subtract(trippointsDiscount);
            }

            boolean priceValid = pricing.getBaseAmount().compareTo(bookingRequest.getBaseAmount()) == 0 &&
                    pricing.getServiceFee().compareTo(bookingRequest.getServiceFee()) == 0 &&
                    expectedTotal.compareTo(bookingRequest.getTotalAmount()) == 0;

            validation.setPriceValid(priceValid);
            validation.setExperiencePrice(experience.getPrice());
            validation.setCalculatedBaseAmount(pricing.getBaseAmount());
            validation.setCalculatedServiceFee(pricing.getServiceFee());
            validation.setCalculatedTotalAmount(pricing.getTotalAmount());
            validation.setSubmittedBaseAmount(bookingRequest.getBaseAmount());
            validation.setSubmittedServiceFee(bookingRequest.getServiceFee());
            validation.setSubmittedTotalAmount(bookingRequest.getTotalAmount());

            if (!priceValid) {
                validation.addValidationError("Price validation failed. Please refresh and try again.");
            }

            // Set experience and schedule information
            validation.setExperienceId(experience.getExperienceId());
            validation.setExperienceTitle(experience.getTitle());
            validation.setExperienceStatus(experience.getStatus().toString());
            validation.setExperienceActive(experience.getStatus() == ExperienceStatus.ACTIVE);
            validation.setScheduleId(schedule.getScheduleId());
            validation.setScheduleStartTime(schedule.getStartDateTime());
            validation.setScheduleEndTime(schedule.getEndDateTime());

            // Validate contact information (basic checks)
            validation.setContactValid(isValidContact(bookingRequest));
            validation.setUserEligible(true);

            // Set overall validation status
            validation.setValid(!validation.hasErrors());

            if (validation.isValid()) {
                validation.setMessage("Booking validation successful");
            } else {
                validation.setMessage("Booking validation failed. Please check the errors and try again.");
            }

        } catch (Exception e) {
            validation.addValidationError("An error occurred during validation: " + e.getMessage());
            validation.setMessage("Validation error occurred");
        }

        return validation;
    }

    /**
     * Create a new booking in PENDING status.
     * 
     * Validates the booking request first, then creates a new Booking entity
     * with contact information, pricing details, and a generated confirmation code.
     * The booking is saved in PENDING status awaiting payment.
     * 
     * @param bookingRequest the booking request containing all booking details
     * @return BookingResponseDTO containing the created booking information
     * @throws IllegalArgumentException if booking validation fails
     * @throws RuntimeException         if booking creation fails
     */
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO bookingRequest) {
        // Validate booking first
        BookingValidationDTO validation = validateBooking(bookingRequest);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("Booking validation failed: " +
                    String.join(", ", validation.getValidationErrors()));
        }

        try {
            // Get schedule
            ExperienceSchedule schedule = experienceScheduleRepository
                    .findById(bookingRequest.getExperienceScheduleId())
                    .orElseThrow(() -> new IllegalArgumentException("Experience schedule not found"));

            // Get current authenticated user
            User currentUser = getCurrentAuthenticatedUser();
            if (currentUser == null) {
                throw new IllegalStateException("No authenticated user found for booking creation");
            }

            // Create booking entity
            Booking booking = new Booking();
            booking.setTraveler(currentUser);
            booking.setExperienceSchedule(schedule);
            booking.setNumberOfParticipants(bookingRequest.getNumberOfParticipants());
            booking.setStatus(BookingStatus.PENDING);

            // Set contact information
            booking.setContactFirstName(bookingRequest.getContactFirstName());
            booking.setContactLastName(bookingRequest.getContactLastName());
            booking.setContactEmail(bookingRequest.getContactEmail());
            booking.setContactPhone(bookingRequest.getContactPhone());

            // Set pricing information
            booking.setBaseAmount(bookingRequest.getBaseAmount());
            booking.setServiceFee(bookingRequest.getServiceFee());
            booking.setTotalAmount(bookingRequest.getTotalAmount());
            booking.setTrippointsDiscount(bookingRequest.getTrippointsDiscount());

            // Generate confirmation code
            booking.setConfirmationCode(generateConfirmationCode());

            // Set timestamps
            booking.setBookingDate(LocalDateTime.now());
            booking.setCreatedAt(LocalDateTime.now());
            booking.setUpdatedAt(LocalDateTime.now());

            // Save booking
            booking = bookingRepository.save(booking);

            // Create response DTO
            return createBookingResponseDTO(booking);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create booking: " + e.getMessage(), e);
        }
    }

    /**
     * Process payment for an existing booking and confirm it upon successful
     * payment.
     * 
     * Validates booking status, prevents duplicate payments, processes payment via
     * PaymentService, and updates booking status based on payment outcome:
     * - COMPLETED payment -> CONFIRMED booking
     * - FAILED or PENDING payment -> remains PENDING (transaction status tracks
     * payment failure)
     * 
     * @param bookingId    the ID of the booking to process payment for
     * @param paymentToken the Stripe payment token from the client
     * @return BookingResponseDTO containing updated booking information
     * @throws IllegalArgumentException if booking is not found
     * @throws IllegalStateException    if booking is not in a payable state
     * @throws RuntimeException         if payment processing fails
     */
    @Transactional
    public BookingResponseDTO processPaymentAndConfirmBooking(Long bookingId, String paymentToken) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        // Disallow paying bookings that are not payable
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Cannot pay a cancelled booking");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Cannot pay a completed booking");
        }
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed");
        }

        // Disallow duplicate concurrent attempts if there is an in-flight payment
        Transaction latestTxn = getBookingPaymentTransaction(booking);
        if (latestTxn != null && latestTxn.getStatus() == TransactionStatus.PENDING) {
            throw new IllegalStateException("A payment attempt is already in progress");
        }

        try {
            // Charge via PaymentService (it should persist a new Transaction record)
            PaymentTransactionDTO paymentResult = paymentService.processPayment(booking, paymentToken);

            // Update booking status based on transaction outcome
            if (paymentResult.getStatus() == TransactionStatus.COMPLETED) {
                booking.setStatus(BookingStatus.CONFIRMED);

                // Process trippoints redemption if applicable
                if (booking.getTrippointsDiscount() != null &&
                    booking.getTrippointsDiscount().compareTo(java.math.BigDecimal.ZERO) > 0) {

                    int pointsToRedeem = booking.getTrippointsDiscount()
                        .multiply(new java.math.BigDecimal("100")).intValue();

                    tripPointsService.redeemPoints(booking.getTraveler().getId(), pointsToRedeem);
                }

                ExperienceSchedule schedule = booking.getExperienceSchedule();
                int availableSpots = schedule.getAvailableSpots() - booking.getNumberOfParticipants();
                schedule.setAvailableSpots(availableSpots);

                // Update the isAvailable flag if there are no more spots available
                if (availableSpots <= 0) {
                    schedule.setIsAvailable(false);
                }
                experienceScheduleRepository.save(schedule); // Single save with both updates
            } else {
                // if payment fails, keep the booking status as PENDING
                booking.setStatus(BookingStatus.PENDING);
            }

            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);

            return createBookingResponseDTO(booking);

        } catch (Exception e) {
            // Keep booking intact but refresh timestamp for auditability
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
            throw new RuntimeException("Payment processing failed: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieve a booking by its ID.
     * 
     * @param bookingId the ID of the booking to retrieve
     * @return BookingResponseDTO containing complete booking information
     * @throws IllegalArgumentException if booking is not found
     */
    public BookingResponseDTO getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        return createBookingResponseDTO(booking);
    }

    /**
     * Retrieve a booking by its confirmation code.
     * 
     * Useful for booking lookups when users only have their confirmation code.
     * Includes input validation and normalization.
     * 
     * @param confirmationCode the confirmation code of the booking to retrieve
     * @return BookingResponseDTO containing complete booking information
     * @throws IllegalArgumentException if booking is not found or code format is
     *                                  invalid
     */
    public BookingResponseDTO getBookingByConfirmationCode(String confirmationCode) {
        if (confirmationCode == null || confirmationCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Confirmation code cannot be null or empty");
        }

        // Normalize the confirmation code (trim and uppercase)
        String normalizedCode = confirmationCode.trim().toUpperCase();

        Booking booking = bookingRepository.findByConfirmationCode(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Booking not found with confirmation code: " + normalizedCode));

        return createBookingResponseDTO(booking);
    }

    /**
     * Retrieve all bookings for a user by their email address.
     * 
     * Returns bookings ordered by booking date (most recent first) as summary DTOs
     * containing essential information for listing views.
     * 
     * @param userEmail the email address of the user
     * @return List of BookingSummaryDTO containing user's bookings
     */
    public List<BookingSummaryDTO> getUserBookings(String userEmail) {
        List<Booking> bookings = bookingRepository.findByContactEmailOrderByBookingDateDesc(userEmail);
        return bookings.stream()
                .map(this::createBookingSummaryDTO)
                .collect(Collectors.toList());
    }

    /**
     * Calculate pricing for a booking based on experience schedule and participant
     * count.
     * 
     * Used by frontend to show pricing breakdown before booking creation.
     * 
     * @param experienceScheduleId the ID of the experience schedule
     * @param numberOfParticipants the number of participants for the booking
     * @return BookingPricingDTO containing calculated pricing breakdown
     * @throws IllegalArgumentException if experience schedule is not found
     */
    public BookingPricingDTO calculatePricing(Long experienceScheduleId, Integer numberOfParticipants) {
        ExperienceSchedule schedule = experienceScheduleRepository.findById(experienceScheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Experience schedule not found"));

        return new BookingPricingDTO(schedule.getExperience().getPrice(), numberOfParticipants);
    }

    /**
     * Cancel an existing booking.
     * 
     * Updates booking status to CANCELLED and records cancellation details.
     * Note: Refund processing should be implemented based on business requirements.
     * 
     * @param bookingId          the ID of the booking to cancel
     * @param cancellationReason the reason for cancellation
     * @return BookingResponseDTO containing updated booking information
     * @throws IllegalArgumentException if booking is not found
     * @throws IllegalStateException    if booking is already cancelled
     */
    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, String cancellationReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }

        // Update booking status
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(cancellationReason);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        // Note: Refund logic should be implemented based on business requirements

        booking = bookingRepository.save(booking);

        return createBookingResponseDTO(booking);
    }

    // Helper methods

    /**
     * Convert a Transaction entity to a PaymentTransactionDTO.
     * 
     * @param transaction the Transaction entity to convert (can be null)
     * @return PaymentTransactionDTO or null if transaction is null
     */
    private PaymentTransactionDTO createPaymentTransactionDTO(Transaction transaction) {
        if (transaction == null) {
            return null;
        }

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

    /**
     * Retrieve the latest payment transaction for a booking.
     * 
     * @param booking the booking to get payment transaction for
     * @return Transaction entity or null if no payment transaction found
     */
    private Transaction getBookingPaymentTransaction(Booking booking) {
        return transactionRepository.findLatestByBookingIdAndType(
                booking.getBookingId(),
                TransactionType.PAYMENT.name()).orElse(null);
    }

    /**
     * Get the current number of confirmed participants for a schedule.
     * 
     * @param scheduleId the ID of the experience schedule
     * @return number of confirmed participants
     */
    private int getCurrentBookingCount(Long scheduleId) {
        return bookingRepository.countParticipantsByScheduleIdAndStatus(scheduleId, BookingStatus.CONFIRMED);
    }

    /**
     * Validate that all required contact information is provided.
     * 
     * @param request the booking request to validate
     * @return true if all contact fields are present and non-empty
     */
    private boolean isValidContact(BookingRequestDTO request) {
        return request.getContactEmail() != null && !request.getContactEmail().trim().isEmpty() &&
                request.getContactFirstName() != null && !request.getContactFirstName().trim().isEmpty() &&
                request.getContactLastName() != null && !request.getContactLastName().trim().isEmpty() &&
                request.getContactPhone() != null && !request.getContactPhone().trim().isEmpty();
    }

    /**
     * Generate a unique confirmation code for a booking.
     * 
     * Ensures uniqueness by checking against existing bookings and retrying if
     * needed.
     * Uses retry logic to prevent the rare case of UUID collision.
     * 
     * @return a unique confirmation code in format "TRP-XXXXXXXX"
     */
    private String generateConfirmationCode() {
        String code;
        int attempts = 0;
        int maxAttempts = 10; // Prevent infinite loop in extreme cases

        do {
            code = "TRP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            attempts++;

            if (attempts >= maxAttempts) {
                // Fallback to longer code if too many collisions
                code = "TRP-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
                break;
            }
        } while (bookingRepository.findByConfirmationCode(code).isPresent());

        return code;
    }

    /**
     * Map experience details to a BookingResponseDTO.
     * 
     * @param experience the Experience entity to map from
     * @param response   the BookingResponseDTO to map to
     */
    private void mapExperienceDetails(Experience experience, BookingResponseDTO response) {
        response.setExperienceId(experience.getExperienceId());
        response.setExperienceTitle(experience.getTitle());
        response.setExperienceDescription(experience.getShortDescription());
        response.setExperienceCoverPhotoUrl(experience.getCoverPhotoUrl());
        response.setExperienceLocation(experience.getLocation());
        response.setExperienceCountry(experience.getCountry());
        response.setExperienceImportantInfo(experience.getImportantInfo());
        response.setExperiencePrice(experience.getPrice());
        response.setGuideRating(experience.getAverageRating());
    }

    /**
     * Map experience details to a BookingSummaryDTO.
     * 
     * @param experience the Experience entity to map from
     * @param summary    the BookingSummaryDTO to map to
     */
    private void mapExperienceDetails(Experience experience, BookingSummaryDTO summary) {
        summary.setExperienceId(experience.getExperienceId());
        summary.setExperienceTitle(experience.getTitle());
        summary.setExperienceCoverPhotoUrl(experience.getCoverPhotoUrl());
        summary.setExperienceLocation(experience.getLocation());
        summary.setExperienceCountry(experience.getCountry());
        summary.setGuideRating(experience.getAverageRating());
    }

    /**
     * Map schedule details to a BookingResponseDTO.
     * 
     * @param schedule the ExperienceSchedule entity to map from
     * @param response the BookingResponseDTO to map to
     */
    private void mapScheduleDetails(ExperienceSchedule schedule, BookingResponseDTO response) {
        response.setScheduleId(schedule.getScheduleId());
        response.setStartDateTime(schedule.getStartDateTime());
        response.setEndDateTime(schedule.getEndDateTime());
    }

    /**
     * Map schedule details to a BookingSummaryDTO.
     * 
     * @param schedule the ExperienceSchedule entity to map from
     * @param summary  the BookingSummaryDTO to map to
     */
    private void mapScheduleDetails(ExperienceSchedule schedule, BookingSummaryDTO summary) {
        summary.setStartDateTime(schedule.getStartDateTime());
        summary.setEndDateTime(schedule.getEndDateTime());
    }

    /**
     * Map guide information to a BookingResponseDTO.
     * 
     * @param guide    the User entity representing the guide (can be null)
     * @param response the BookingResponseDTO to map to
     */
    private void mapGuideInfo(User guide, BookingResponseDTO response) {
        if (guide != null) {
            response.setGuideId(guide.getId());
            response.setGuideName(guide.getFirstName() + " " + guide.getLastName());
            response.setGuideProfileImageUrl(guide.getProfileImageUrl());
        }
    }

    /**
     * Map guide information to a BookingSummaryDTO.
     * 
     * @param guide   the User entity representing the guide (can be null)
     * @param summary the BookingSummaryDTO to map to
     */
    private void mapGuideInfo(User guide, BookingSummaryDTO summary) {
        if (guide != null) {
            summary.setGuideName(guide.getFirstName() + " " + guide.getLastName());
        }
    }

    /**
     * Create a complete BookingResponseDTO from a Booking entity.
     * 
     * Maps all booking details, experience information, schedule details,
     * guide information, contact details, and payment information.
     * 
     * @param booking the Booking entity to convert
     * @return BookingResponseDTO containing complete booking information
     */
    private BookingResponseDTO createBookingResponseDTO(Booking booking) {
        BookingResponseDTO response = new BookingResponseDTO();

        // Basic booking info
        response.setBookingId(booking.getBookingId());
        response.setConfirmationCode(booking.getConfirmationCode());
        response.setStatus(booking.getStatus());
        Transaction paymentTransaction = getBookingPaymentTransaction(booking);
        PaymentTransactionDTO paymentTransactionDTO = createPaymentTransactionDTO(paymentTransaction);
        response.setPaymentTransaction(paymentTransactionDTO);
        response.setPaymentStatus(
                paymentTransaction != null ? paymentTransaction.getStatus() : TransactionStatus.PENDING);
        response.setNumberOfParticipants(booking.getNumberOfParticipants());
        response.setBookingDate(booking.getBookingDate());

        // Experience details
        Experience experience = booking.getExperienceSchedule().getExperience();
        mapExperienceDetails(experience, response);

        // Schedule details
        ExperienceSchedule schedule = booking.getExperienceSchedule();
        mapScheduleDetails(schedule, response);

        // Guide information
        User guide = experience.getGuide();
        mapGuideInfo(guide, response);

        // Contact information
        response.setContactFirstName(booking.getContactFirstName());
        response.setContactLastName(booking.getContactLastName());
        response.setContactEmail(booking.getContactEmail());
        response.setContactPhone(booking.getContactPhone());

        // Payment breakdown
        response.setBaseAmount(booking.getBaseAmount());
        response.setServiceFee(booking.getServiceFee());
        response.setTotalAmount(booking.getTotalAmount());

        // Payment information is already set via PaymentTransactionDTO

        // Timestamps
        response.setCreatedAt(booking.getCreatedAt());
        response.setUpdatedAt(booking.getUpdatedAt());

        return response;
    }

    /**
     * Create a BookingSummaryDTO from a Booking entity.
     * 
     * Maps essential booking information for list views, excluding some
     * detailed information present in the full BookingResponseDTO.
     * 
     * @param booking the Booking entity to convert
     * @return BookingSummaryDTO containing essential booking information
     */
    private BookingSummaryDTO createBookingSummaryDTO(Booking booking) {
        BookingSummaryDTO summary = new BookingSummaryDTO();

        // Basic booking info
        summary.setBookingId(booking.getBookingId());
        summary.setConfirmationCode(booking.getConfirmationCode());
        summary.setStatus(booking.getStatus());
        summary.setNumberOfParticipants(booking.getNumberOfParticipants());
        summary.setTotalAmount(booking.getTotalAmount());
        summary.setBookingDate(booking.getBookingDate());

        // Experience details
        Experience experience = booking.getExperienceSchedule().getExperience();
        mapExperienceDetails(experience, summary);

        // Schedule details
        ExperienceSchedule schedule = booking.getExperienceSchedule();
        mapScheduleDetails(schedule, summary);

        // Guide information
        User guide = experience.getGuide();
        mapGuideInfo(guide, summary);

        // Contact information
        summary.setContactFirstName(booking.getContactFirstName());
        summary.setContactLastName(booking.getContactLastName());
        summary.setContactEmail(booking.getContactEmail());

        // Payment information
        Transaction paymentTransaction = getBookingPaymentTransaction(booking);
        PaymentTransactionDTO paymentTransactionDTO = createPaymentTransactionDTO(paymentTransaction);
        summary.setPaymentTransaction(paymentTransactionDTO);

        // Timestamps
        summary.setCreatedAt(booking.getCreatedAt());

        return summary;
    }

    /**
     * Helper method to get the currently authenticated user
     * 
     * @return User entity if authenticated, null otherwise
     */
    private User getCurrentAuthenticatedUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    authentication.getPrincipal() instanceof UserDetails) {

                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String email = userDetails.getUsername();

                return userRepository.findByEmailAndIsActive(email, true).orElse(null);
            }
        } catch (Exception e) {
            System.err.println("Error getting authenticated user: " + e.getMessage());
        }
        return null;
    }
}