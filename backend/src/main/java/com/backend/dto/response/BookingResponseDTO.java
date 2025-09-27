package com.backend.dto.response;

import com.backend.entity.BookingStatus;
import com.backend.entity.TransactionStatus;
import com.backend.dto.PaymentTransactionDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for returning booking confirmation details
 * Used in checkout complete page and booking history
 */
public class BookingResponseDTO {

    // Booking Identification
    private Long bookingId;
    private String confirmationCode;
    private BookingStatus status;
    private PaymentTransactionDTO paymentTransaction;
    private TransactionStatus paymentStatus;

    // Experience Details
    private Long experienceId;
    private String experienceTitle;
    private String experienceDescription;
    private String experienceCoverPhotoUrl;
    private String experienceLocation;
    private BigDecimal experiencePrice;

    // Schedule Details
    private Long scheduleId;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    // Guide Information
    private Long guideId;
    private String guideName;
    private String guideProfileImageUrl;
    private BigDecimal guideRating;

    // Booking Details
    private Integer numberOfParticipants;
    private LocalDateTime bookingDate;

    // Contact Information
    private String contactFirstName;
    private String contactLastName;
    private String contactEmail;
    private String contactPhone;

    // Payment Breakdown
    private BigDecimal baseAmount;
    private BigDecimal serviceFee;
    private BigDecimal totalAmount;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Error Handling Fields
    private boolean success = true;
    private String errorMessage;
    private String errorCode;

    // Default constructor
    public BookingResponseDTO() {
    }

    // Constructor for basic booking info
    public BookingResponseDTO(Long bookingId, String confirmationCode, BookingStatus status,
            PaymentTransactionDTO paymentTransaction, TransactionStatus paymentStatus, String experienceTitle,
            LocalDateTime startDateTime, LocalDateTime endDateTime,
            Integer numberOfParticipants, BigDecimal totalAmount) {
        this.bookingId = bookingId;
        this.confirmationCode = confirmationCode;
        this.status = status;
        this.paymentTransaction = paymentTransaction;
        this.paymentStatus = paymentStatus;
        this.experienceTitle = experienceTitle;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.numberOfParticipants = numberOfParticipants;
        this.totalAmount = totalAmount;
    }

    // Static factory methods for error responses
    public static BookingResponseDTO failure(String errorMessage, String errorCode) {
        BookingResponseDTO response = new BookingResponseDTO();
        response.setSuccess(false);
        response.setErrorMessage(errorMessage);
        response.setErrorCode(errorCode);
        return response;
    }

    public static BookingResponseDTO failure(String errorMessage) {
        return failure(errorMessage, null);
    }

    // Getters and Setters
    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getConfirmationCode() {
        return confirmationCode;
    }

    public void setConfirmationCode(String confirmationCode) {
        this.confirmationCode = confirmationCode;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public PaymentTransactionDTO getPaymentTransaction() {
        return paymentTransaction;
    }

    public void setPaymentTransaction(PaymentTransactionDTO paymentTransaction) {
        this.paymentTransaction = paymentTransaction;
    }

    public TransactionStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(TransactionStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public String getExperienceTitle() {
        return experienceTitle;
    }

    public void setExperienceTitle(String experienceTitle) {
        this.experienceTitle = experienceTitle;
    }

    public String getExperienceDescription() {
        return experienceDescription;
    }

    public void setExperienceDescription(String experienceDescription) {
        this.experienceDescription = experienceDescription;
    }

    public String getExperienceCoverPhotoUrl() {
        return experienceCoverPhotoUrl;
    }

    public void setExperienceCoverPhotoUrl(String experienceCoverPhotoUrl) {
        this.experienceCoverPhotoUrl = experienceCoverPhotoUrl;
    }

    public String getExperienceLocation() {
        return experienceLocation;
    }

    public void setExperienceLocation(String experienceLocation) {
        this.experienceLocation = experienceLocation;
    }

    public BigDecimal getExperiencePrice() {
        return experiencePrice;
    }

    public void setExperiencePrice(BigDecimal experiencePrice) {
        this.experiencePrice = experiencePrice;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
    }

    public Long getGuideId() {
        return guideId;
    }

    public void setGuideId(Long guideId) {
        this.guideId = guideId;
    }

    public String getGuideName() {
        return guideName;
    }

    public void setGuideName(String guideName) {
        this.guideName = guideName;
    }

    public String getGuideProfileImageUrl() {
        return guideProfileImageUrl;
    }

    public void setGuideProfileImageUrl(String guideProfileImageUrl) {
        this.guideProfileImageUrl = guideProfileImageUrl;
    }

    public BigDecimal getGuideRating() {
        return guideRating;
    }

    public void setGuideRating(BigDecimal guideRating) {
        this.guideRating = guideRating;
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
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

    @Override
    public String toString() {
        return "BookingResponseDTO{" +
                "bookingId=" + bookingId +
                ", confirmationCode='" + confirmationCode + '\'' +
                ", status=" + status +
                ", paymentStatus=" + paymentStatus +
                ", experienceTitle='" + experienceTitle + '\'' +
                ", startDateTime=" + startDateTime +
                ", numberOfParticipants=" + numberOfParticipants +
                ", totalAmount=" + totalAmount +
                ", success=" + success +
                ", errorMessage='" + errorMessage + '\'' +
                ", errorCode='" + errorCode + '\'' +
                '}';
    }
}