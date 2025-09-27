package com.backend.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO for processing payment information
 * Contains credit card details and payment processing info
 */
public class PaymentRequestDTO {

    // Booking Reference
    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    // Payment Amount (should match booking total)
    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Payment amount must be positive")
    private BigDecimal amount;

    // Credit Card Information (will be tokenized by Stripe on frontend)
    @NotBlank(message = "Stripe token is required")
    private String stripeToken;

    // Card Details for Record Keeping (safe info only)
    @Size(max = 4, min = 4, message = "Last four digits must be exactly 4 characters")
    private String lastFourDigits;

    @NotBlank(message = "Card brand is required")
    @Pattern(regexp = "visa|mastercard|amex|discover|jcb|diners|unknown", flags = Pattern.Flag.CASE_INSENSITIVE, message = "Card brand must be one of: visa, mastercard, amex, discover, jcb, diners, unknown")
    private String cardBrand;

    @NotBlank(message = "Cardholder name is required")
    @Size(max = 100, message = "Cardholder name must not exceed 100 characters")
    private String cardholderName;


    // Payment Options
    private boolean saveCard = false;

    // Payment Method (default to credit card)
    private String paymentMethod = "CREDIT_CARD";

    // Additional payment metadata
    @Size(max = 200, message = "Payment description must not exceed 200 characters")
    private String paymentDescription;

    // Default constructor
    public PaymentRequestDTO() {
    }

    // Constructor with required fields
    public PaymentRequestDTO(Long bookingId, BigDecimal amount, String stripeToken,
            String lastFourDigits, String cardBrand, String cardholderName) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.stripeToken = stripeToken;
        this.lastFourDigits = lastFourDigits;
        this.cardBrand = cardBrand;
        this.cardholderName = cardholderName;
    }

    // Getters and Setters
    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStripeToken() {
        return stripeToken;
    }

    public void setStripeToken(String stripeToken) {
        this.stripeToken = stripeToken;
    }

    public String getLastFourDigits() {
        return lastFourDigits;
    }

    public void setLastFourDigits(String lastFourDigits) {
        this.lastFourDigits = lastFourDigits;
    }

    public String getCardBrand() {
        return cardBrand;
    }

    public void setCardBrand(String cardBrand) {
        this.cardBrand = cardBrand;
    }

    public String getCardholderName() {
        return cardholderName;
    }

    public void setCardholderName(String cardholderName) {
        this.cardholderName = cardholderName;
    }


    public boolean isSaveCard() {
        return saveCard;
    }

    public void setSaveCard(boolean saveCard) {
        this.saveCard = saveCard;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentDescription() {
        return paymentDescription;
    }

    public void setPaymentDescription(String paymentDescription) {
        this.paymentDescription = paymentDescription;
    }

    @Override
    public String toString() {
        return "PaymentRequestDTO{" +
                "bookingId=" + bookingId +
                ", amount=" + amount +
                ", cardBrand='" + cardBrand + '\'' +
                ", cardholderName='" + cardholderName + '\'' +
                ", lastFourDigits='****" + lastFourDigits + '\'' +
                ", paymentMethod='" + paymentMethod + '\'' +
                '}';
    }
}