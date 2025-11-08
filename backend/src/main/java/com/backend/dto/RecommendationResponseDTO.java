package com.backend.dto;

import java.math.BigDecimal;
import java.util.Map;

public class RecommendationResponseDTO {
    private Long experienceId;
    private String title;
    private String location;
    private String country;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal discountPercentage;
    private String category;
    private Double averageRating;
    private Integer totalReviews;
    private String coverPhotoUrl;
    private String shortDescription;
    private BigDecimal duration;
    private Integer participantsAllowed;

    // Recommendation metadata
    private Double recommendationScore;
    private String recommendationReason;
    private Map<String, Double> scoreBreakdown;

    // Constructors
    public RecommendationResponseDTO() {
    }

    // Getters and Setters
    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public BigDecimal getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public String getCoverPhotoUrl() {
        return coverPhotoUrl;
    }

    public void setCoverPhotoUrl(String coverPhotoUrl) {
        this.coverPhotoUrl = coverPhotoUrl;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public BigDecimal getDuration() {
        return duration;
    }

    public void setDuration(BigDecimal duration) {
        this.duration = duration;
    }

    public Integer getParticipantsAllowed() {
        return participantsAllowed;
    }

    public void setParticipantsAllowed(Integer participantsAllowed) {
        this.participantsAllowed = participantsAllowed;
    }

    public Double getRecommendationScore() {
        return recommendationScore;
    }

    public void setRecommendationScore(Double recommendationScore) {
        this.recommendationScore = recommendationScore;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    public Map<String, Double> getScoreBreakdown() {
        return scoreBreakdown;
    }

    public void setScoreBreakdown(Map<String, Double> scoreBreakdown) {
        this.scoreBreakdown = scoreBreakdown;
    }
}
