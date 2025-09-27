package com.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * DTO for booking validation responses
 * Used to validate availability, pricing, and booking constraints
 */
public class BookingValidationDTO {
     
    // Validation Status
    private boolean isValid;
    private List<String> validationErrors; 
    private List<String> warnings;
    
    // Availability Information
    private boolean isAvailable;
    private Integer availableSpots;
    private Integer requestedParticipants;
    private LocalDateTime scheduleStartTime;
    private LocalDateTime scheduleEndTime;
    
    // Pricing Information
    private BigDecimal experiencePrice;
    private BigDecimal calculatedBaseAmount;
    private BigDecimal calculatedServiceFee;
    private BigDecimal calculatedTotalAmount;
    
    // Price Validation
    private boolean isPriceValid;
    private BigDecimal submittedBaseAmount;
    private BigDecimal submittedServiceFee;
    private BigDecimal submittedTotalAmount;
    
    // Experience Information
    private Long experienceId;
    private String experienceTitle;
    private String experienceStatus;
    private boolean isExperienceActive;
    
    // Schedule Information
    private Long scheduleId;
    
    // User/Contact Validation
    private boolean isContactValid;
    private boolean isUserEligible;
    
    // Additional Information
    private String message;
    private LocalDateTime validatedAt;
    
    // Default constructor
    public BookingValidationDTO() {
        this.validationErrors = new ArrayList<>();
        this.warnings = new ArrayList<>();
        this.validatedAt = LocalDateTime.now();
    }
    
    // Constructor for successful validation
    public BookingValidationDTO(boolean isValid, boolean isAvailable, Integer availableSpots,
                              BigDecimal calculatedTotalAmount, String message) {
        this();
        this.isValid = isValid;
        this.isAvailable = isAvailable;
        this.availableSpots = availableSpots;
        this.calculatedTotalAmount = calculatedTotalAmount;
        this.message = message;
    }
    
    // Constructor for failed validation
    public BookingValidationDTO(boolean isValid, List<String> validationErrors, String message) {
        this();
        this.isValid = isValid;
        this.validationErrors = validationErrors != null ? validationErrors : new ArrayList<>();
        this.message = message;
    }
    
    // Helper methods
    public void addValidationError(String error) {
        if (this.validationErrors == null) {
            this.validationErrors = new ArrayList<>();
        }
        this.validationErrors.add(error);
        this.isValid = false;
    }
    
    public void addWarning(String warning) {
        if (this.warnings == null) {
            this.warnings = new ArrayList<>();
        }
        this.warnings.add(warning);
    }
    
    public boolean hasErrors() {
        return validationErrors != null && !validationErrors.isEmpty();
    }
    
    public boolean hasWarnings() {
        return warnings != null && !warnings.isEmpty();
    }
    
    // Getters and Setters
    public boolean isValid() { return isValid; }
    public void setValid(boolean valid) { isValid = valid; }
    
    public List<String> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(List<String> validationErrors) { this.validationErrors = validationErrors; }
    
    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }
    
    public Integer getAvailableSpots() { return availableSpots; }
    public void setAvailableSpots(Integer availableSpots) { this.availableSpots = availableSpots; }
    
    public Integer getRequestedParticipants() { return requestedParticipants; }
    public void setRequestedParticipants(Integer requestedParticipants) { this.requestedParticipants = requestedParticipants; }
    
    public LocalDateTime getScheduleStartTime() { return scheduleStartTime; }
    public void setScheduleStartTime(LocalDateTime scheduleStartTime) { this.scheduleStartTime = scheduleStartTime; }
    
    public LocalDateTime getScheduleEndTime() { return scheduleEndTime; }
    public void setScheduleEndTime(LocalDateTime scheduleEndTime) { this.scheduleEndTime = scheduleEndTime; }
    
    public BigDecimal getExperiencePrice() { return experiencePrice; }
    public void setExperiencePrice(BigDecimal experiencePrice) { this.experiencePrice = experiencePrice; }
    
    public BigDecimal getCalculatedBaseAmount() { return calculatedBaseAmount; }
    public void setCalculatedBaseAmount(BigDecimal calculatedBaseAmount) { this.calculatedBaseAmount = calculatedBaseAmount; }
    
    public BigDecimal getCalculatedServiceFee() { return calculatedServiceFee; }
    public void setCalculatedServiceFee(BigDecimal calculatedServiceFee) { this.calculatedServiceFee = calculatedServiceFee; }
    
    public BigDecimal getCalculatedTotalAmount() { return calculatedTotalAmount; }
    public void setCalculatedTotalAmount(BigDecimal calculatedTotalAmount) { this.calculatedTotalAmount = calculatedTotalAmount; }
    
    public boolean isPriceValid() { return isPriceValid; }
    public void setPriceValid(boolean priceValid) { isPriceValid = priceValid; }
    
    public BigDecimal getSubmittedBaseAmount() { return submittedBaseAmount; }
    public void setSubmittedBaseAmount(BigDecimal submittedBaseAmount) { this.submittedBaseAmount = submittedBaseAmount; }
    
    public BigDecimal getSubmittedServiceFee() { return submittedServiceFee; }
    public void setSubmittedServiceFee(BigDecimal submittedServiceFee) { this.submittedServiceFee = submittedServiceFee; }
    
    public BigDecimal getSubmittedTotalAmount() { return submittedTotalAmount; }
    public void setSubmittedTotalAmount(BigDecimal submittedTotalAmount) { this.submittedTotalAmount = submittedTotalAmount; }
    
    public Long getExperienceId() { return experienceId; }
    public void setExperienceId(Long experienceId) { this.experienceId = experienceId; }
    
    public String getExperienceTitle() { return experienceTitle; }
    public void setExperienceTitle(String experienceTitle) { this.experienceTitle = experienceTitle; }
    
    public String getExperienceStatus() { return experienceStatus; }
    public void setExperienceStatus(String experienceStatus) { this.experienceStatus = experienceStatus; }
    
    public boolean isExperienceActive() { return isExperienceActive; }
    public void setExperienceActive(boolean experienceActive) { isExperienceActive = experienceActive; }
    
    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    
    
    
    public boolean isContactValid() { return isContactValid; }
    public void setContactValid(boolean contactValid) { isContactValid = contactValid; }
    
    public boolean isUserEligible() { return isUserEligible; }
    public void setUserEligible(boolean userEligible) { isUserEligible = userEligible; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }
    
    @Override
    public String toString() {
        return "BookingValidationDTO{" +
                "isValid=" + isValid +
                ", isAvailable=" + isAvailable +
                ", availableSpots=" + availableSpots +
                ", calculatedTotalAmount=" + calculatedTotalAmount +
                ", isPriceValid=" + isPriceValid +
                ", validationErrors=" + validationErrors +
                ", message='" + message + '\'' +
                '}';
    }
}