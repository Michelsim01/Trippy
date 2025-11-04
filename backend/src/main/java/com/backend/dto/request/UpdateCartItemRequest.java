package com.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for updating a cart item's participant count
 */
public class UpdateCartItemRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Number of participants is required")
    @Min(value = 1, message = "Number of participants must be at least 1")
    private Integer numberOfParticipants;

    // Default constructor
    public UpdateCartItemRequest() {
    }

    // Constructor with fields
    public UpdateCartItemRequest(Long userId, Integer numberOfParticipants) {
        this.userId = userId;
        this.numberOfParticipants = numberOfParticipants;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
    }

    @Override
    public String toString() {
        return "UpdateCartItemRequest{" +
                "userId=" + userId +
                ", numberOfParticipants=" + numberOfParticipants +
                '}';
    }
}
