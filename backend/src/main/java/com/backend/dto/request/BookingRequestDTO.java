package com.backend.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO for creating a new booking
 * Contains contact information from checkout form and booking details
 */
public class BookingRequestDTO {

    // Booking Details
    @NotNull(message = "Experience schedule ID is required")
    private Long experienceScheduleId;

    @NotNull(message = "Number of participants is required")
    @Min(value = 1, message = "Number of participants must be at least 1")
    private Integer numberOfParticipants;

    // Contact Information (from checkout contact page)
    @NotBlank(message = "Contact first name is required")
    @Size(max = 50, message = "Contact first name must not exceed 50 characters")
    private String contactFirstName;

    @NotBlank(message = "Contact last name is required")
    @Size(max = 50, message = "Contact last name must not exceed 50 characters")
    private String contactLastName;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Contact email must be valid")
    @Size(max = 100, message = "Contact email must not exceed 100 characters")
    private String contactEmail;

    @NotBlank(message = "Contact phone is required")
    @Size(max = 20, message = "Contact phone must not exceed 20 characters") 
    private String contactPhone;

    // Payment Breakdown (calculated on frontend, verified on backend)
    @NotNull(message = "Base amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base amount must be positive")
    private BigDecimal baseAmount;

    @NotNull(message = "Service fee is required")
    @DecimalMin(value = "0.0", message = "Service fee must be non-negative")
    private BigDecimal serviceFee;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Total amount must be positive")
    private BigDecimal totalAmount;

    // Default constructor
    public BookingRequestDTO() {
    }

    // Constructor with required fields
    public BookingRequestDTO(Long experienceScheduleId, Integer numberOfParticipants,
            String contactFirstName, String contactLastName,
            String contactEmail, String contactPhone,
            BigDecimal baseAmount, BigDecimal serviceFee, BigDecimal totalAmount) {
        this.experienceScheduleId = experienceScheduleId;
        this.numberOfParticipants = numberOfParticipants;
        this.contactFirstName = contactFirstName;
        this.contactLastName = contactLastName;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.baseAmount = baseAmount;
        this.serviceFee = serviceFee;
        this.totalAmount = totalAmount;
    }

    // Getters and Setters
    public Long getExperienceScheduleId() {
        return experienceScheduleId;
    }

    public void setExperienceScheduleId(Long experienceScheduleId) {
        this.experienceScheduleId = experienceScheduleId;
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
    }

    public String getContactFirstName() {
        return contactFirstName;
    }

    public void setContactFirstName(String contactFirstName) {
        this.contactFirstName = contactFirstName;
    }

    public String getContactLastName() {
        return contactLastName;
    }

    public void setContactLastName(String contactLastName) {
        this.contactLastName = contactLastName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public BigDecimal getBaseAmount() {
        return baseAmount;
    }

    public void setBaseAmount(BigDecimal baseAmount) {
        this.baseAmount = baseAmount;
    }

    public BigDecimal getServiceFee() {
        return serviceFee;
    }

    public void setServiceFee(BigDecimal serviceFee) {
        this.serviceFee = serviceFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    @Override
    public String toString() {
        return "BookingRequestDTO{" +
                "experienceScheduleId=" + experienceScheduleId +
                ", numberOfParticipants=" + numberOfParticipants +
                ", contactFirstName='" + contactFirstName + '\'' +
                ", contactLastName='" + contactLastName + '\'' +
                ", contactEmail='" + contactEmail + '\'' +
                ", contactPhone='" + contactPhone + '\'' +
                ", totalAmount=" + totalAmount +
                '}';
    }
}