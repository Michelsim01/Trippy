package com.backend.service;

import com.backend.dto.*;
import com.backend.entity.*;
import com.backend.repository.*;
import com.backend.integration.stripe.*;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Refund;
import com.stripe.param.ChargeCreateParams;
import com.stripe.param.RefundCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Value("${stripe.api.secret-key}")
    private String stripeSecretKey;

    @Value("${app.service.fee.rate:0.04}")
    private BigDecimal serviceFeeRate;

    private static final String DEFAULT_PAYMENT_METHOD = "CREDIT_CARD";

    // Initialize Stripe API key when service is created
    @PostConstruct
    public void initStripe() {
        Stripe.apiKey = stripeSecretKey;
    }

    // ================================
    // PAYMENT PROCESSING METHODS
    // ================================

    /**
     * Process a payment for a given booking using a Stripe payment token.
     *
     * @param booking      the booking being paid for (must not be null)
     * @param paymentToken the client-side generated Stripe token (must not be
     *                     null/empty)
     * @return a DTO representing the processed transaction
     * @throws IllegalArgumentException if booking or token are invalid
     * @throws RuntimeException         if the Stripe payment fails
     */
    @Transactional
    public PaymentTransactionDTO processPayment(Booking booking, String paymentToken) {
        if (booking == null) {
            throw new IllegalArgumentException("Booking cannot be null");
        }
        if (paymentToken == null || paymentToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment token cannot be null or empty");
        }

        try {
            // Validate payment amount
            validatePaymentAmount(booking);

            // Create transaction record
            Transaction transaction = createTransaction(booking, TransactionType.PAYMENT);

            // Save initial transaction
            transaction = transactionRepository.save(transaction);

            // Process payment with Stripe
            StripePaymentResult paymentResult = processStripePayment(
                    booking.getTotalAmount(),
                    paymentToken);

            // Update transaction with Stripe response
            transaction.setStripeChargeId(paymentResult.getChargeId());

            if (paymentResult.isSuccessful()) {
                transaction.setStatus(TransactionStatus.COMPLETED);
                transaction.setProcessedAt(LocalDateTime.now());

                // Update card details from Stripe response
                if (paymentResult.getLastFourDigits() != null) {
                    transaction.setLastFourDigits(paymentResult.getLastFourDigits());
                }
                if (paymentResult.getCardBrand() != null) {
                    transaction.setCardBrand(paymentResult.getCardBrand());
                }
            } else {
                transaction.setStatus(TransactionStatus.FAILED);
            }

            transaction.setUpdatedAt(LocalDateTime.now());
            transaction = transactionRepository.save(transaction);

            if (!paymentResult.isSuccessful()) {
                throw new RuntimeException("Payment failed");
            }

            return convertToPaymentTransactionDTO(transaction);

        } catch (Exception e) {
            throw new RuntimeException("Payment processing failed: " + e.getMessage(), e);
        }
    }




    /**
     * Process a payment with Stripe using the provided amount and payment token.
     *
     * @param amount       the amount to charge
     * @param paymentToken the Stripe payment token
     * @return a StripePaymentResult containing the result of the payment
     */
    private StripePaymentResult processStripePayment(BigDecimal amount, String paymentToken) {
        try {
            // Convert amount to cents (Stripe requires integer cents)
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            // Create charge parameters
            ChargeCreateParams.Builder paramsBuilder = ChargeCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("sgd")
                    .setSource(paymentToken)
                    .setDescription("Trippy Experience Booking");

            ChargeCreateParams params = paramsBuilder.build();

            // Create charge with Stripe
            Charge charge = Charge.create(params);

            // Build result from Stripe response
            StripePaymentResult result = new StripePaymentResult();
            result.setSuccessful("succeeded".equals(charge.getStatus()));
            result.setChargeId(charge.getId());

            // Extract card details from charge
            if (charge.getPaymentMethodDetails() != null &&
                    charge.getPaymentMethodDetails().getCard() != null) {
                result.setLastFourDigits(charge.getPaymentMethodDetails().getCard().getLast4());
                result.setCardBrand(charge.getPaymentMethodDetails().getCard().getBrand());
            }

            if (!result.isSuccessful()) {
                System.err.println("Stripe payment failed for charge: " + result.getChargeId() + ". Status: "
                        + charge.getStatus());
                throw new RuntimeException("Payment failed - transaction rolled back");
            }

            return result;

        } catch (StripeException e) {
            System.err.println("Stripe API error during payment processing: " + e.getMessage());
            throw new RuntimeException("Payment processing failed - transaction rolled back: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error during payment processing: " + e.getMessage());
            throw new RuntimeException("Payment processing failed - transaction rolled back: " + e.getMessage());
        }
    }


    // ================================
    // REFUND PROCESSING METHODS
    // ================================

    /**
     * Process a refund for a given transaction using a Stripe refund.
     *
     * This method is designed for controller endpoints that receive a Transaction
     * entity
     * and a refund amount. It validates the request fields (transaction, amount,
     * reason)
     * and delegates to the DTO-driven refund flow.
     */
    @Transactional
    public Transaction processRefund(Transaction originalTransaction, BigDecimal refundAmount, String reason) {
        if (originalTransaction == null) {
            throw new IllegalArgumentException("Original transaction cannot be null");
        }
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be positive");
        }
        if (originalTransaction.getStatus() != TransactionStatus.COMPLETED) {
            throw new IllegalStateException("Cannot refund a transaction that is not completed");
        }

        if (refundAmount.compareTo(originalTransaction.getAmount()) > 0) {
            throw new IllegalArgumentException("Refund amount cannot exceed original transaction amount");
        }

        try {
            // Process refund with Stripe
            StripeRefundResult refundResult = processStripeRefund(
                    originalTransaction.getStripeChargeId(),
                    refundAmount,
                    reason);

            // Create refund transaction record
            Transaction refundTransaction = new Transaction();
            refundTransaction.setBooking(originalTransaction.getBooking());
            refundTransaction.setUser(originalTransaction.getUser());
            refundTransaction.setAmount(refundAmount.negate()); // Negative amount for refund
            refundTransaction.setType(TransactionType.REFUND);
            refundTransaction
                    .setStatus(refundResult.isSuccessful() ? TransactionStatus.COMPLETED : TransactionStatus.FAILED);
            refundTransaction.setPaymentMethod(DEFAULT_PAYMENT_METHOD);
            refundTransaction.setExternalTransactionId(generateTransactionId());
            refundTransaction.setCreatedAt(LocalDateTime.now());
            refundTransaction.setUpdatedAt(LocalDateTime.now());

            if (refundResult.isSuccessful()) {
                refundTransaction.setProcessedAt(LocalDateTime.now());
            }

            refundTransaction = transactionRepository.save(refundTransaction);

            if (!refundResult.isSuccessful()) {
                throw new RuntimeException("Refund failed");
            }

            return refundTransaction;

        } catch (Exception e) {
            throw new RuntimeException("Refund processing failed: " + e.getMessage(), e);
        }
    }

    /**
     * Process a refund with Stripe using the provided charge ID, amount, and
     * reason.
     *
     * @param chargeId the ID of the charge to refund
     * @param amount   the amount to refund
     * @param reason   the reason for the refund
     * @return a StripeRefundResult containing the result of the refund
     */
    private StripeRefundResult processStripeRefund(String chargeId, BigDecimal amount, String reason) {
        try {
            // Convert amount to cents (Stripe requires integer cents)
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            // Create refund parameters
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                    .setCharge(chargeId)
                    .setAmount(amountInCents);

            if (reason != null && !reason.trim().isEmpty()) {
                paramsBuilder.setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER);
                paramsBuilder.putMetadata("reason", reason);
            }

            RefundCreateParams params = paramsBuilder.build();

            // Create refund with Stripe
            Refund refund = Refund.create(params);

            // Build result from Stripe response
            StripeRefundResult result = new StripeRefundResult();
            result.setSuccessful("succeeded".equals(refund.getStatus()));
            result.setRefundId(refund.getId());

            if (!result.isSuccessful()) {
                System.err.println(
                        "Stripe refund failed for refund: " + result.getRefundId() + ". Status: " + refund.getStatus());
                throw new RuntimeException("Refund failed - transaction rolled back");
            }

            return result;

        } catch (StripeException e) {
            System.err.println("Stripe API error during refund processing: " + e.getMessage());
            throw new RuntimeException("Refund processing failed - transaction rolled back: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error during refund processing: " + e.getMessage());
            throw new RuntimeException("Refund processing failed - transaction rolled back: " + e.getMessage());
        }
    }

    // ================================
    // HELPER METHODS
    // ================================

    /**
     * Calculate service fee based on base amount.
     *
     * @param baseAmount the base amount to calculate fee for
     * @return the calculated service fee
     */
    public BigDecimal calculateServiceFee(BigDecimal baseAmount) {
        return baseAmount.multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate total amount by adding base amount and service fee.
     *
     * @param baseAmount the base amount
     * @param serviceFee the service fee
     * @return the total amount
     */
    public BigDecimal calculateTotalAmount(BigDecimal baseAmount, BigDecimal serviceFee) {
        return baseAmount.add(serviceFee);
    }

    /**
     * Create a refund transaction for a cancelled booking.
     *
     * This method creates a completed refund transaction record that will appear
     * in the admin portal for tracking purposes.
     *
     * @param booking the booking being refunded
     * @param refundAmount the amount being refunded
     * @return the created and saved refund transaction
     */
    @Transactional
    public Transaction createRefundTransaction(Booking booking, BigDecimal refundAmount) {
        if (booking == null) {
            throw new IllegalArgumentException("Booking cannot be null");
        }
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Refund amount must be non-negative");
        }

        Transaction refundTransaction = new Transaction();
        refundTransaction.setBooking(booking);
        refundTransaction.setUser(booking.getTraveler());
        refundTransaction.setAmount(refundAmount);
        refundTransaction.setType(TransactionType.REFUND);
        refundTransaction.setStatus(TransactionStatus.COMPLETED);
        refundTransaction.setPaymentMethod(DEFAULT_PAYMENT_METHOD);
        refundTransaction.setExternalTransactionId(generateTransactionId());
        refundTransaction.setCreatedAt(LocalDateTime.now());
        refundTransaction.setUpdatedAt(LocalDateTime.now());
        refundTransaction.setProcessedAt(LocalDateTime.now());

        return transactionRepository.save(refundTransaction);
    }

    /**
     * Validate the payment amount for a given booking.
     *
     * This method uses the BookingPricingDTO to validate the payment amount.
     *
     * @param booking the booking to validate
     * @return true if the payment amount is valid, false otherwise
     */
    public boolean validatePaymentAmount(Booking booking) {
        // Use BookingPricingDTO for validation
        BookingPricingDTO pricing = new BookingPricingDTO(
                booking.getExperienceSchedule().getExperience().getPrice(),
                booking.getNumberOfParticipants(),
                serviceFeeRate);

        // Account for trippoints discount in total validation
        BigDecimal expectedTotal = pricing.getTotalAmount();
        BigDecimal trippointsDiscount = booking.getTrippointsDiscount();
        if (trippointsDiscount != null && trippointsDiscount.compareTo(BigDecimal.ZERO) > 0) {
            expectedTotal = expectedTotal.subtract(trippointsDiscount);
        }

        // Validate individual components and adjusted total
        boolean isValid = pricing.getBaseAmount().compareTo(booking.getBaseAmount()) == 0 &&
                pricing.getServiceFee().compareTo(booking.getServiceFee()) == 0 &&
                expectedTotal.compareTo(booking.getTotalAmount()) == 0;

        if (!isValid) {
            throw new IllegalArgumentException("Payment amount validation failed. Expected total: "
                    + expectedTotal + ", Submitted total: " + booking.getTotalAmount());
        }

        return true;
    }

    /**
     * Generate a unique transaction ID.
     *
     * @return a unique transaction ID in format "TXN-XXXXXXXXXXXX"
     */
    private String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }


    /**
     * Create a transaction from a booking.
     *
     * @param booking the booking to create the transaction for
     * @param type    the type of transaction
     * @return a Transaction entity
     */
    private Transaction createTransaction(Booking booking, TransactionType type) {
        Transaction transaction = new Transaction();
        transaction.setBooking(booking);
        transaction.setUser(booking.getTraveler());
        transaction.setAmount(booking.getTotalAmount());
        transaction.setType(type);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setPaymentMethod(DEFAULT_PAYMENT_METHOD);
        transaction.setExternalTransactionId(generateTransactionId());
        transaction.setCreatedAt(LocalDateTime.now());

        return transaction;
    }

    /**
     * Convert a Transaction entity to a PaymentTransactionDTO.
     *
     * @param transaction the Transaction entity to convert
     * @return a PaymentTransactionDTO
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