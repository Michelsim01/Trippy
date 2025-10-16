package com.backend.dto.response;

import java.math.BigDecimal;

/**
 * DTO for returning guide cancellation response details
 */
public class GuideCancellationResponseDTO {

    private Long scheduleId;
    private int affectedBookings;
    private BigDecimal totalFee;
    private String cancellationReason;
    private boolean success = true;
    private String message;
    private String errorMessage;
    private String errorCode;

    // Default constructor
    public GuideCancellationResponseDTO() {
    }

    // Constructor for successful cancellation
    public GuideCancellationResponseDTO(Long scheduleId, int affectedBookings, BigDecimal totalFee, String cancellationReason) {
        this.scheduleId = scheduleId;
        this.affectedBookings = affectedBookings;
        this.totalFee = totalFee;
        this.cancellationReason = cancellationReason;
        this.success = true;
        this.message = "Schedule cancelled successfully";
    }

    // Static factory methods for error responses
    public static GuideCancellationResponseDTO failure(String errorMessage, String errorCode) {
        GuideCancellationResponseDTO response = new GuideCancellationResponseDTO();
        response.setSuccess(false);
        response.setErrorMessage(errorMessage);
        response.setErrorCode(errorCode);
        return response;
    }

    public static GuideCancellationResponseDTO failure(String errorMessage) {
        return failure(errorMessage, null);
    }

    // Getters and Setters
    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public int getAffectedBookings() {
        return affectedBookings;
    }

    public void setAffectedBookings(int affectedBookings) {
        this.affectedBookings = affectedBookings;
    }

    public BigDecimal getTotalFee() {
        return totalFee;
    }

    public void setTotalFee(BigDecimal totalFee) {
        this.totalFee = totalFee;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

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

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
}