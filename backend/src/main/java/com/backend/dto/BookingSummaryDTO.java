package com.backend.dto;

import com.backend.entity.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for booking summary information
 * Used for listing bookings and quick overview
 */
public class BookingSummaryDTO {
    
    // Basic Booking Info
    private Long bookingId;
    private String confirmationCode;
    private BookingStatus status;
    private PaymentTransactionDTO paymentTransaction;
    
    // Experience Info
    private Long experienceId;
    private String experienceTitle;
    private String experienceCoverPhotoUrl;
    private String experienceLocation;
    private String experienceCountry;
    
    // Schedule Info
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    
    // Guide Info
    private String guideName;
    private BigDecimal guideRating;
    
    // Booking Details
    private Integer numberOfParticipants;
    private BigDecimal totalAmount;
    private LocalDateTime bookingDate;
    
    // Contact Info
    private String contactFirstName;
    private String contactLastName;
    private String contactEmail;
    
    
    // Timestamps
    private LocalDateTime createdAt;
    
    // Default constructor
    public BookingSummaryDTO() {}
    
    // Constructor for essential info
    public BookingSummaryDTO(Long bookingId, String confirmationCode, BookingStatus status,
                           PaymentTransactionDTO paymentTransaction, String experienceTitle,
                           LocalDateTime startDateTime, Integer numberOfParticipants,
                           BigDecimal totalAmount, String guideName) {
        this.bookingId = bookingId;
        this.confirmationCode = confirmationCode;
        this.status = status;
        this.paymentTransaction = paymentTransaction;
        this.experienceTitle = experienceTitle;
        this.startDateTime = startDateTime;
        this.numberOfParticipants = numberOfParticipants;
        this.totalAmount = totalAmount;
        this.guideName = guideName;
    }
    
    // Getters and Setters
    public Long getBookingId() { return bookingId; } 
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    
    public String getConfirmationCode() { return confirmationCode; }
    public void setConfirmationCode(String confirmationCode) { this.confirmationCode = confirmationCode; }
    
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    
    public PaymentTransactionDTO getPaymentTransaction() { return paymentTransaction; }
    public void setPaymentTransaction(PaymentTransactionDTO paymentTransaction) { this.paymentTransaction = paymentTransaction; }
    
    public Long getExperienceId() { return experienceId; }
    public void setExperienceId(Long experienceId) { this.experienceId = experienceId; }
    
    public String getExperienceTitle() { return experienceTitle; }
    public void setExperienceTitle(String experienceTitle) { this.experienceTitle = experienceTitle; }
    
    public String getExperienceCoverPhotoUrl() { return experienceCoverPhotoUrl; }
    public void setExperienceCoverPhotoUrl(String experienceCoverPhotoUrl) { this.experienceCoverPhotoUrl = experienceCoverPhotoUrl; }
    
    public String getExperienceLocation() { return experienceLocation; }
    public void setExperienceLocation(String experienceLocation) { this.experienceLocation = experienceLocation; }

    public String getExperienceCountry() { return experienceCountry; }
    public void setExperienceCountry(String experienceCountry) { this.experienceCountry = experienceCountry; }
    
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    
    public String getGuideName() { return guideName; }
    public void setGuideName(String guideName) { this.guideName = guideName; }
    
    public BigDecimal getGuideRating() { return guideRating; }
    public void setGuideRating(BigDecimal guideRating) { this.guideRating = guideRating; }
    
    public Integer getNumberOfParticipants() { return numberOfParticipants; }
    public void setNumberOfParticipants(Integer numberOfParticipants) { this.numberOfParticipants = numberOfParticipants; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDateTime bookingDate) { this.bookingDate = bookingDate; }
    
    public String getContactFirstName() { return contactFirstName; }
    public void setContactFirstName(String contactFirstName) { this.contactFirstName = contactFirstName; }
    
    public String getContactLastName() { return contactLastName; }
    public void setContactLastName(String contactLastName) { this.contactLastName = contactLastName; }
    
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    @Override
    public String toString() {
        return "BookingSummaryDTO{" +
                "bookingId=" + bookingId +
                ", confirmationCode='" + confirmationCode + '\'' +
                ", experienceTitle='" + experienceTitle + '\'' +
                ", startDateTime=" + startDateTime +
                ", numberOfParticipants=" + numberOfParticipants +
                ", totalAmount=" + totalAmount +
                ", status=" + status +
                '}';
    }
}