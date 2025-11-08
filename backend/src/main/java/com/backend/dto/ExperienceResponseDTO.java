package com.backend.dto;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ExperienceResponseDTO {
    private Long experienceId;
    private String title;
    private String shortDescription;
    private String location;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal discountPercentage;
    private BigDecimal totalStars;
    private Integer totalReviews;
    private BigDecimal averageRating;
    private BigDecimal duration;
    private String coverPhotoUrl;
    private LocalDateTime createdAt;
    private String guideName; // Instead of full User object
    private ExperienceStatus status;
    
    public ExperienceResponseDTO() {}
    
    // Constructor to create from Experience entity
    public ExperienceResponseDTO(Experience experience) {
        this.experienceId = experience.getExperienceId();
        this.title = experience.getTitle();
        this.shortDescription = experience.getShortDescription();
        this.location = experience.getLocation();
        this.price = experience.getPrice();
        this.originalPrice = experience.getOriginalPrice();
        this.discountPercentage = experience.getDiscountPercentage();
        this.totalStars = experience.getTotalStars();
        this.totalReviews = experience.getTotalReviews();
        this.averageRating = experience.getAverageRating();
        this.duration = experience.getDuration();
        this.coverPhotoUrl = experience.getCoverPhotoUrl();
        this.createdAt = experience.getCreatedAt();
        this.status = experience.getStatus();
        // Safely get guide name without triggering lazy loading issues
        this.guideName = experience.getGuide() != null ?
            experience.getGuide().getFirstName() + " " + experience.getGuide().getLastName() :
            "Unknown Guide";
    }
    
    // Getters and setters
    public Long getExperienceId() { return experienceId; }
    public void setExperienceId(Long experienceId) { this.experienceId = experienceId; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }
    
    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountPercentage = discountPercentage; }
    
    public BigDecimal getTotalStars() { return totalStars; }
    public void setTotalStars(BigDecimal totalStars) { this.totalStars = totalStars; }

    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }

    public BigDecimal getAverageRating() { return averageRating; }
    public void setAverageRating(BigDecimal averageRating) { this.averageRating = averageRating; }
    
    public BigDecimal getDuration() { return duration; }
    public void setDuration(BigDecimal duration) { this.duration = duration; }
    
    public String getCoverPhotoUrl() { return coverPhotoUrl; }
    public void setCoverPhotoUrl(String coverPhotoUrl) { this.coverPhotoUrl = coverPhotoUrl; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public String getGuideName() { return guideName; }
    public void setGuideName(String guideName) { this.guideName = guideName; }

    public ExperienceStatus getStatus() { return status; }
    public void setStatus(ExperienceStatus status) { this.status = status; }
}