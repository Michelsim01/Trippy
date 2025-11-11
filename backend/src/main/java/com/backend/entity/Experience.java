package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "experiences")
public class Experience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long experienceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = true) // Made nullable temporarily for testing
    @JsonIgnore
    private User guide;

    @Column(nullable = false)
    private String title;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "full_description", columnDefinition = "TEXT")
    private String fullDescription;

    @Column(columnDefinition = "TEXT")
    private String highlights;

    @Enumerated(EnumType.STRING)
    private ExperienceCategory category;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> tags;

    @Column(name = "cover_photo_url", columnDefinition = "TEXT")
    private String coverPhotoUrl;

    @Column(name = "what_included", columnDefinition = "TEXT")
    private String whatIncluded;

    @Column(name = "important_info", columnDefinition = "TEXT")
    private String importantInfo;

    @Column(name = "cancellation_policy", columnDefinition = "TEXT")
    private String cancellationPolicy;

    private BigDecimal price;

    @Column(name = "participants_allowed")
    private Integer participantsAllowed;

    private BigDecimal duration;

    private String location;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    private String country;

    @Enumerated(EnumType.STRING)
    private ExperienceStatus status;

    @Column(name = "total_stars", columnDefinition = "NUMERIC DEFAULT 0")
    private BigDecimal totalStars = BigDecimal.ZERO;

    @Column(name = "total_reviews", columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalReviews = 0;

    @Column(name = "average_rating", columnDefinition = "NUMERIC DEFAULT 0")
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "view_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer viewCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ExperienceMedia> mediaList;

    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ExperienceItinerary> itineraries;

    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ExperienceSchedule> schedules;

    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Review> reviews;

    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WishlistItem> wishlistItems;

    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PersonalChat> personalChats;

    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public User getGuide() {
        return guide;
    }

    public void setGuide(User guide) {
        this.guide = guide;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getFullDescription() {
        return fullDescription;
    }

    public void setFullDescription(String fullDescription) {
        this.fullDescription = fullDescription;
    }

    public String getHighlights() {
        return highlights;
    }

    public void setHighlights(String highlights) {
        this.highlights = highlights;
    }

    public ExperienceCategory getCategory() {
        return category;
    }

    public void setCategory(ExperienceCategory category) {
        this.category = category;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCoverPhotoUrl() {
        return coverPhotoUrl;
    }

    public void setCoverPhotoUrl(String coverPhotoUrl) {
        this.coverPhotoUrl = coverPhotoUrl;
    }

    public String getWhatIncluded() {
        return whatIncluded;
    }

    public void setWhatIncluded(String whatIncluded) {
        this.whatIncluded = whatIncluded;
    }

    public String getImportantInfo() {
        return importantInfo;
    }

    public void setImportantInfo(String importantInfo) {
        this.importantInfo = importantInfo;
    }

    public String getCancellationPolicy() {
        return cancellationPolicy;
    }

    public void setCancellationPolicy(String cancellationPolicy) {
        this.cancellationPolicy = cancellationPolicy;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getParticipantsAllowed() {
        return participantsAllowed;
    }

    public void setParticipantsAllowed(Integer participantsAllowed) {
        this.participantsAllowed = participantsAllowed;
    }

    public BigDecimal getDuration() {
        return duration;
    }

    public void setDuration(BigDecimal duration) {
        this.duration = duration;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public ExperienceStatus getStatus() {
        return status;
    }

    public void setStatus(ExperienceStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalStars() {
        return totalStars;
    }

    public void setTotalStars(BigDecimal totalStars) {
        this.totalStars = totalStars;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
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

    public List<ExperienceMedia> getMediaList() {
        return mediaList;
    }

    public void setMediaList(List<ExperienceMedia> mediaList) {
        this.mediaList = mediaList;
    }

    public List<ExperienceItinerary> getItineraries() {
        return itineraries;
    }

    public void setItineraries(List<ExperienceItinerary> itineraries) {
        this.itineraries = itineraries;
    }

    public List<ExperienceSchedule> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<ExperienceSchedule> schedules) {
        this.schedules = schedules;
    }

    public List<Review> getReviews() {
        return reviews;
    }

    public void setReviews(List<Review> reviews) {
        this.reviews = reviews;
    }

    public List<WishlistItem> getWishlistItems() {
        return wishlistItems;
    }

    public void setWishlistItems(List<WishlistItem> wishlistItems) {
        this.wishlistItems = wishlistItems;
    }

    public List<PersonalChat> getPersonalChats() {
        return personalChats;
    }

    public void setPersonalChats(List<PersonalChat> personalChats) {
        this.personalChats = personalChats;
    }
}
