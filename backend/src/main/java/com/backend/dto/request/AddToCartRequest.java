package com.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for adding an item to the shopping cart
 */
public class AddToCartRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Schedule ID is required")
    private Long scheduleId;

    @NotNull(message = "Number of participants is required")
    @Min(value = 1, message = "Number of participants must be at least 1")
    private Integer numberOfParticipants;

    // Default constructor
    public AddToCartRequest() {
    }

    // Constructor with fields
    public AddToCartRequest(Long userId, Long scheduleId, Integer numberOfParticipants) {
        this.userId = userId;
        this.scheduleId = scheduleId;
        this.numberOfParticipants = numberOfParticipants;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
    }

    @Override
    public String toString() {
        return "AddToCartRequest{" +
                "userId=" + userId +
                ", scheduleId=" + scheduleId +
                ", numberOfParticipants=" + numberOfParticipants +
                '}';
    }
}
