package com.backend.integration.stripe;

/**
 * Internal result class for Stripe refund processing
 * Used only within PaymentService for handling Stripe refund API responses
 */
public class StripeRefundResult {
    private boolean successful;
    private String refundId;

    public StripeRefundResult() {
    }

    public StripeRefundResult(boolean successful) {
        this.successful = successful;
    }

    // Getters and Setters
    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }

    public String getRefundId() {
        return refundId;
    }

    public void setRefundId(String refundId) {
        this.refundId = refundId;
    }

}