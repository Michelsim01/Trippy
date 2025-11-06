package com.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "itinerary_distance_matrix")
public class ItineraryDistanceMatrix {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "origin_experience_id", nullable = false)
    private Long originExperienceId;

    @Column(name = "destination_experience_id", nullable = false)
    private Long destinationExperienceId;

    @Column(name = "straight_line_km", precision = 10, scale = 2)
    private BigDecimal straightLineKm;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "driving_distance_km", precision = 10, scale = 2)
    private BigDecimal drivingDistanceKm;

    @Column(name = "driving_time_minutes")
    private Integer drivingTimeMinutes;

    @Column(name = "transit_distance_km", precision = 10, scale = 2)
    private BigDecimal transitDistanceKm;

    @Column(name = "transit_time_minutes")
    private Integer transitTimeMinutes;

    @Column(name = "transit_available")
    private Boolean transitAvailable = false;

    @Column(name = "walking_distance_km", precision = 10, scale = 2)
    private BigDecimal walkingDistanceKm;

    @Column(name = "walking_time_minutes")
    private Integer walkingTimeMinutes;

    @Column(name = "walking_feasible")
    private Boolean walkingFeasible = false;

    @Column(name = "recommended_mode", length = 20)
    private String recommendedMode;

    @Column(name = "route_fetched_at")
    private LocalDateTime routeFetchedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public ItineraryDistanceMatrix() {
    }

    public ItineraryDistanceMatrix(Long originExperienceId, Long destinationExperienceId, BigDecimal straightLineKm, String country) {
        this.originExperienceId = originExperienceId;
        this.destinationExperienceId = destinationExperienceId;
        this.straightLineKm = straightLineKm;
        this.country = country;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOriginExperienceId() {
        return originExperienceId;
    }

    public void setOriginExperienceId(Long originExperienceId) {
        this.originExperienceId = originExperienceId;
    }

    public Long getDestinationExperienceId() {
        return destinationExperienceId;
    }

    public void setDestinationExperienceId(Long destinationExperienceId) {
        this.destinationExperienceId = destinationExperienceId;
    }

    public BigDecimal getStraightLineKm() {
        return straightLineKm;
    }

    public void setStraightLineKm(BigDecimal straightLineKm) {
        this.straightLineKm = straightLineKm;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public BigDecimal getDrivingDistanceKm() {
        return drivingDistanceKm;
    }

    public void setDrivingDistanceKm(BigDecimal drivingDistanceKm) {
        this.drivingDistanceKm = drivingDistanceKm;
    }

    public Integer getDrivingTimeMinutes() {
        return drivingTimeMinutes;
    }

    public void setDrivingTimeMinutes(Integer drivingTimeMinutes) {
        this.drivingTimeMinutes = drivingTimeMinutes;
    }

    public BigDecimal getTransitDistanceKm() {
        return transitDistanceKm;
    }

    public void setTransitDistanceKm(BigDecimal transitDistanceKm) {
        this.transitDistanceKm = transitDistanceKm;
    }

    public Integer getTransitTimeMinutes() {
        return transitTimeMinutes;
    }

    public void setTransitTimeMinutes(Integer transitTimeMinutes) {
        this.transitTimeMinutes = transitTimeMinutes;
    }

    public Boolean getTransitAvailable() {
        return transitAvailable;
    }

    public void setTransitAvailable(Boolean transitAvailable) {
        this.transitAvailable = transitAvailable;
    }

    public BigDecimal getWalkingDistanceKm() {
        return walkingDistanceKm;
    }

    public void setWalkingDistanceKm(BigDecimal walkingDistanceKm) {
        this.walkingDistanceKm = walkingDistanceKm;
    }

    public Integer getWalkingTimeMinutes() {
        return walkingTimeMinutes;
    }

    public void setWalkingTimeMinutes(Integer walkingTimeMinutes) {
        this.walkingTimeMinutes = walkingTimeMinutes;
    }

    public Boolean getWalkingFeasible() {
        return walkingFeasible;
    }

    public void setWalkingFeasible(Boolean walkingFeasible) {
        this.walkingFeasible = walkingFeasible;
    }

    public String getRecommendedMode() {
        return recommendedMode;
    }

    public void setRecommendedMode(String recommendedMode) {
        this.recommendedMode = recommendedMode;
    }

    public LocalDateTime getRouteFetchedAt() {
        return routeFetchedAt;
    }

    public void setRouteFetchedAt(LocalDateTime routeFetchedAt) {
        this.routeFetchedAt = routeFetchedAt;
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
}
