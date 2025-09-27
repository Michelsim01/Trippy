package com.backend.integration.stripe;

/**
 * Internal result class for Stripe payment processing
 * Used only within PaymentService for handling Stripe API responses
 */
public class StripePaymentResult {
    private boolean successful;
    private String chargeId;
    private String lastFourDigits;
    private String cardBrand;

    public StripePaymentResult() {
    }

    public StripePaymentResult(boolean successful) {
        this.successful = successful;
    }

    // Getters and Setters
    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }

    public String getChargeId() {
        return chargeId;
    }

    public void setChargeId(String chargeId) {
        this.chargeId = chargeId;
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

}