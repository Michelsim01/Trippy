package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "experience_schedule")
public class ExperienceSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false)
    @JsonIgnoreProperties({"mediaList", "itineraries", "schedules", "reviews", "bookings", "wishlistItems"})
    private Experience experience;

    @Column(name = "start_date_time")
    private LocalDateTime startDateTime;
    
    @Column(name = "end_date_time")
    private LocalDateTime endDateTime;
    
    private Integer availableSpots;
    private Boolean isAvailable;
    private LocalDateTime createdAt;

    @OneToMany(
        mappedBy = "experienceSchedule",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties("experienceSchedule")
    private List<Booking> bookings;

    @OneToMany(
        mappedBy = "experienceSchedule",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties("experienceSchedule")
    private List<PersonalChat> personalChats;

    @OneToOne(
        mappedBy = "experienceSchedule",
        cascade = CascadeType.ALL,
        fetch = FetchType.LAZY,
        orphanRemoval = true
    )
    @JsonIgnoreProperties("experienceSchedule")
    private TripCohort tripCohort;

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public Experience getExperience() { return experience; }
    public void setExperience(Experience experience) { this.experience = experience; }
    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }
    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }
    public Integer getAvailableSpots() { return availableSpots; }
    public void setAvailableSpots(Integer availableSpots) { this.availableSpots = availableSpots; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.util.List<Booking> getBookings() { return bookings; }
    public void setBookings(java.util.List<Booking> bookings) { this.bookings = bookings; }
    public TripCohort getTripCohort() { return tripCohort; }
    public void setTripCohort(TripCohort tripCohort) { this.tripCohort = tripCohort; }
}
