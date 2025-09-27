package com.backend.dto;

import com.backend.entity.TransactionStatus;
import com.backend.entity.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for payment transaction information
 * Used in booking responses to provide payment details without entity coupling
 */
public class PaymentTransactionDTO {

    private Long transactionId;
    private TransactionType type;
    private TransactionStatus status;
    private BigDecimal amount;
    private String paymentMethod;
    private String lastFourDigits;
    private String cardBrand;
    private LocalDateTime createdAt;

    // Default constructor
    public PaymentTransactionDTO() {
    }

    // Constructor with essential fields
    public PaymentTransactionDTO(Long transactionId, TransactionType type, TransactionStatus status,
            BigDecimal amount, String paymentMethod, String lastFourDigits,
            String cardBrand, LocalDateTime createdAt) {
        this.transactionId = transactionId;
        this.type = type;
        this.status = status;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.lastFourDigits = lastFourDigits;
        this.cardBrand = cardBrand;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "PaymentTransactionDTO{" +
                "transactionId=" + transactionId +
                ", type=" + type +
                ", status=" + status +
                ", amount=" + amount +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", lastFourDigits='" + lastFourDigits + '\'' +
                ", cardBrand='" + cardBrand + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}