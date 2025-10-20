package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Entity
@Table(name = "user_analytics_profile")
public class UserAnalyticsProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "cluster_id")
    private Integer clusterId;

    @Column(name = "profile_data", columnDefinition = "TEXT")
    private String profileDataJson;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Transient
    private Map<String, Object> profileData;

    @Transient
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Constructors
    public UserAnalyticsProfile() {
    }

    public UserAnalyticsProfile(Long userId, Integer clusterId, String profileDataJson, LocalDateTime lastUpdated) {
        this.userId = userId;
        this.clusterId = clusterId;
        this.profileDataJson = profileDataJson;
        this.lastUpdated = lastUpdated;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getClusterId() {
        return clusterId;
    }

    public void setClusterId(Integer clusterId) {
        this.clusterId = clusterId;
    }

    public String getProfileDataJson() {
        return profileDataJson;
    }

    public void setProfileDataJson(String profileDataJson) {
        this.profileDataJson = profileDataJson;
        this.profileData = null; // Clear cache
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    // Parse JSON data lazily
    public Map<String, Object> getProfileData() {
        if (profileData == null && profileDataJson != null && !profileDataJson.isEmpty()) {
            try {
                profileData = objectMapper.readValue(profileDataJson,
                    new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                profileData = new HashMap<>();
            }
        }
        return profileData != null ? profileData : new HashMap<>();
    }

    // Helper methods to extract data from JSON
    public Integer getBudgetScore() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("budget_score")) {
            Object value = data.get("budget_score");
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
        }
        return 2; // Default moderate
    }

    public Integer getTotalBookings() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("total_bookings")) {
            Object value = data.get("total_bookings");
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
        }
        return 0;
    }

    public Double getAvgBookingAmount() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("avg_booking_amount")) {
            Object value = data.get("avg_booking_amount");
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
        }
        return 0.0;
    }
}
