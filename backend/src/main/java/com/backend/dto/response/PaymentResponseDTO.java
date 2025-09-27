package com.backend.dto.response;

import com.backend.dto.PaymentTransactionDTO;

/**
 * Response DTO for payment processing operations
 * Provides a comprehensive response including transaction details and status
 * messages
 */
public class PaymentResponseDTO {

    private boolean success;
    private String message;
    private PaymentTransactionDTO transaction;
    private String errorCode;

    // Default constructor
    public PaymentResponseDTO() {
    }

    // Constructor for successful payments
    public PaymentResponseDTO(boolean success, String message, PaymentTransactionDTO transaction) {
        this.success = success;
        this.message = message;
        this.transaction = transaction;
    }

    // Constructor for failed payments
    public PaymentResponseDTO(boolean success, String message, String errorCode) {
        this.success = success;
        this.message = message;
        this.errorCode = errorCode;
    }

    // Static factory methods for common responses
    public static PaymentResponseDTO success(PaymentTransactionDTO transaction) {
        return new PaymentResponseDTO(true, "Payment processed successfully", transaction);
    }

    public static PaymentResponseDTO failure(String message) {
        return new PaymentResponseDTO(false, message, (PaymentTransactionDTO) null);
    }

    public static PaymentResponseDTO failure(String message, String errorCode) {
        return new PaymentResponseDTO(false, message, errorCode);
    }

    public static PaymentResponseDTO refundSuccess(PaymentTransactionDTO refundTransaction) {
        return new PaymentResponseDTO(true, "Refund processed successfully", refundTransaction);
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public PaymentTransactionDTO getTransaction() {
        return transaction;
    }

    public void setTransaction(PaymentTransactionDTO transaction) {
        this.transaction = transaction;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    @Override
    public String toString() {
        return "PaymentResponseDTO{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", transaction=" + transaction +
                ", errorCode='" + errorCode + '\'' +
                '}';
    }
}