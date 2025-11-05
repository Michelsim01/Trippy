package com.backend.dto;

import com.backend.entity.CartItem;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceSchedule;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for cart item with flattened experience and schedule data
 * Makes it easier for frontend to consume
 */
public class CartItemDTO {
    private Long cartItemId;
    private Integer numberOfParticipants;
    private BigDecimal priceAtTimeOfAdd;
    private LocalDateTime createdAt;

    // Experience data
    private Long experienceId;
    private String experienceTitle;
    private String shortDescription;
    private String coverPhotoUrl;
    private BigDecimal currentPrice;
    private String category;
    private String location;

    // Schedule data
    private Long scheduleId;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Integer availableSpots;
    private Boolean isAvailable;
    private Boolean isCancelled;

    // Calculated field
    private BigDecimal totalPrice;

    // Default constructor
    public CartItemDTO() {
    }

    // Constructor that converts from CartItem entity
    public CartItemDTO(CartItem cartItem) {
        this.cartItemId = cartItem.getCartItemId();
        this.numberOfParticipants = cartItem.getNumberOfParticipants();
        this.priceAtTimeOfAdd = cartItem.getPriceAtTimeOfAdd();
        this.createdAt = cartItem.getCreatedAt();

        // Extract schedule data
        ExperienceSchedule schedule = cartItem.getExperienceSchedule();
        if (schedule != null) {
            this.scheduleId = schedule.getScheduleId();
            this.startDateTime = schedule.getStartDateTime();
            this.endDateTime = schedule.getEndDateTime();
            this.availableSpots = schedule.getAvailableSpots();
            this.isAvailable = schedule.getIsAvailable();
            this.isCancelled = schedule.getCancelled();

            // Extract experience data
            Experience experience = schedule.getExperience();
            if (experience != null) {
                this.experienceId = experience.getExperienceId();
                this.experienceTitle = experience.getTitle();
                this.shortDescription = experience.getShortDescription();
                this.coverPhotoUrl = experience.getCoverPhotoUrl();
                this.currentPrice = experience.getPrice();
                this.category = experience.getCategory() != null ? experience.getCategory().toString() : null;
                this.location = experience.getLocation();
            }
        }

        // Calculate total price
        this.totalPrice = this.priceAtTimeOfAdd.multiply(new BigDecimal(this.numberOfParticipants));
    }

    // Getters and Setters
    public Long getCartItemId() {
        return cartItemId;
    }

    public void setCartItemId(Long cartItemId) {
        this.cartItemId = cartItemId;
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
        // Recalculate total price when participants change
        if (this.priceAtTimeOfAdd != null) {
            this.totalPrice = this.priceAtTimeOfAdd.multiply(new BigDecimal(numberOfParticipants));
        }
    }

    public BigDecimal getPriceAtTimeOfAdd() {
        return priceAtTimeOfAdd;
    }

    public void setPriceAtTimeOfAdd(BigDecimal priceAtTimeOfAdd) {
        this.priceAtTimeOfAdd = priceAtTimeOfAdd;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getCoverPhotoUrl() {
        return coverPhotoUrl;
    }

    public void setCoverPhotoUrl(String coverPhotoUrl) {
        this.coverPhotoUrl = coverPhotoUrl;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public Integer getAvailableSpots() {
        return availableSpots;
    }

    public void setAvailableSpots(Integer availableSpots) {
        this.availableSpots = availableSpots;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public Boolean getIsCancelled() {
        return isCancelled;
    }

    public void setIsCancelled(Boolean isCancelled) {
        this.isCancelled = isCancelled;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    @Override
    public String toString() {
        return "CartItemDTO{" +
                "cartItemId=" + cartItemId +
                ", experienceTitle='" + experienceTitle + '\'' +
                ", numberOfParticipants=" + numberOfParticipants +
                ", totalPrice=" + totalPrice +
                ", scheduleId=" + scheduleId +
                ", startDateTime=" + startDateTime +
                '}';
    }
}
