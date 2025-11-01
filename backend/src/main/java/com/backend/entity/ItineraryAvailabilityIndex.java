package com.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "itinerary_availability_index")
public class ItineraryAvailabilityIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "experience_id", nullable = false)
    private Long experienceId;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Column(name = "available_schedules_count", nullable = false)
    private Integer availableSchedulesCount;

    @Column(name = "total_spots", nullable = false)
    private Integer totalSpots;

    @Column(name = "booking_pressure", precision = 5, scale = 2)
    private BigDecimal bookingPressure;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public ItineraryAvailabilityIndex() {
    }

    public ItineraryAvailabilityIndex(Long experienceId, LocalDate scheduleDate, Integer availableSchedulesCount, Integer totalSpots) {
        this.experienceId = experienceId;
        this.scheduleDate = scheduleDate;
        this.availableSchedulesCount = availableSchedulesCount;
        this.totalSpots = totalSpots;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public LocalDate getScheduleDate() {
        return scheduleDate;
    }

    public void setScheduleDate(LocalDate scheduleDate) {
        this.scheduleDate = scheduleDate;
    }

    public Integer getAvailableSchedulesCount() {
        return availableSchedulesCount;
    }

    public void setAvailableSchedulesCount(Integer availableSchedulesCount) {
        this.availableSchedulesCount = availableSchedulesCount;
    }

    public Integer getTotalSpots() {
        return totalSpots;
    }

    public void setTotalSpots(Integer totalSpots) {
        this.totalSpots = totalSpots;
    }

    public BigDecimal getBookingPressure() {
        return bookingPressure;
    }

    public void setBookingPressure(BigDecimal bookingPressure) {
        this.bookingPressure = bookingPressure;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
