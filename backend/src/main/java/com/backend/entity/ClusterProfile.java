package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Entity
@Table(name = "cluster_profiles")
public class ClusterProfile {

    @Id
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
    public ClusterProfile() {
    }

    public ClusterProfile(Integer clusterId, String profileDataJson, LocalDateTime lastUpdated) {
        this.clusterId = clusterId;
        this.profileDataJson = profileDataJson;
        this.lastUpdated = lastUpdated;
    }

    // Getters and Setters
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

    // Helper methods to extract cluster characteristics
    @SuppressWarnings("unchecked")
    public Map<String, Double> getInterestPreferences() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("interest_preferences")) {
            Object value = data.get("interest_preferences");
            if (value instanceof Map) {
                Map<String, Double> interests = new HashMap<>();
                ((Map<String, Object>) value).forEach((key, val) -> {
                    if (val instanceof Number) {
                        interests.put(key, ((Number) val).doubleValue());
                    }
                });
                return interests;
            }
        }
        return new HashMap<>();
    }

    public Double getAvgBudgetScore() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("avg_budget_score")) {
            Object value = data.get("avg_budget_score");
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
        }
        return 2.0; // Default moderate
    }

    public Double getAvgBookingAmount() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("avg_booking_amount")) {
            Object value = data.get("avg_booking_amount");
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
        }
        return 100.0; // Default amount
    }

    public String getDominantTravelStyle() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("dominant_travel_style")) {
            Object value = data.get("dominant_travel_style");
            if (value != null) {
                return value.toString();
            }
        }
        return "unknown";
    }

    public Integer getUserCount() {
        Map<String, Object> data = getProfileData();
        if (data != null && data.containsKey("user_count")) {
            Object value = data.get("user_count");
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
        }
        return 0;
    }
}
