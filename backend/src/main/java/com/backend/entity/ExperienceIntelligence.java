package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Entity
@Table(name = "experience_intelligence")
public class ExperienceIntelligence {

    @Id
    @Column(name = "experience_id")
    private Long experienceId;

    @Column(name = "intelligence_data", columnDefinition = "TEXT")
    private String intelligenceDataJson;

    @Column(name = "popularity_score", precision = 5, scale = 2)
    private BigDecimal popularityScore;

    @Column(name = "sentiment_score", precision = 4, scale = 3)
    private BigDecimal sentimentScore;

    @Column(name = "recommendation_weight", precision = 5, scale = 2)
    private BigDecimal recommendationWeight;

    @Column(name = "content_completeness_score")
    private Integer contentCompletenessScore;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Transient
    private Map<String, Object> intelligenceData;

    @Transient
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Constructors
    public ExperienceIntelligence() {
    }

    public ExperienceIntelligence(Long experienceId, String intelligenceDataJson,
                                  BigDecimal popularityScore, BigDecimal sentimentScore,
                                  BigDecimal recommendationWeight, Integer contentCompletenessScore,
                                  LocalDateTime lastUpdated) {
        this.experienceId = experienceId;
        this.intelligenceDataJson = intelligenceDataJson;
        this.popularityScore = popularityScore;
        this.sentimentScore = sentimentScore;
        this.recommendationWeight = recommendationWeight;
        this.contentCompletenessScore = contentCompletenessScore;
        this.lastUpdated = lastUpdated;
    }

    // Getters and Setters
    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public String getIntelligenceDataJson() {
        return intelligenceDataJson;
    }

    public void setIntelligenceDataJson(String intelligenceDataJson) {
        this.intelligenceDataJson = intelligenceDataJson;
        this.intelligenceData = null; // Clear cache
    }

    public BigDecimal getPopularityScore() {
        return popularityScore != null ? popularityScore : BigDecimal.ZERO;
    }

    public void setPopularityScore(BigDecimal popularityScore) {
        this.popularityScore = popularityScore;
    }

    public BigDecimal getSentimentScore() {
        return sentimentScore != null ? sentimentScore : BigDecimal.ZERO;
    }

    public void setSentimentScore(BigDecimal sentimentScore) {
        this.sentimentScore = sentimentScore;
    }

    public BigDecimal getRecommendationWeight() {
        return recommendationWeight != null ? recommendationWeight : BigDecimal.ZERO;
    }

    public void setRecommendationWeight(BigDecimal recommendationWeight) {
        this.recommendationWeight = recommendationWeight;
    }

    public Integer getContentCompletenessScore() {
        return contentCompletenessScore != null ? contentCompletenessScore : 0;
    }

    public void setContentCompletenessScore(Integer contentCompletenessScore) {
        this.contentCompletenessScore = contentCompletenessScore;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    // Parse JSON data lazily
    public Map<String, Object> getIntelligenceData() {
        if (intelligenceData == null && intelligenceDataJson != null && !intelligenceDataJson.isEmpty()) {
            try {
                intelligenceData = objectMapper.readValue(intelligenceDataJson,
                    new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                intelligenceData = new HashMap<>();
            }
        }
        return intelligenceData != null ? intelligenceData : new HashMap<>();
    }

    // Helper methods to extract intelligence data
    @SuppressWarnings("unchecked")
    public Map<String, Object> getContentFeatures() {
        Map<String, Object> data = getIntelligenceData();
        if (data != null && data.containsKey("content_features")) {
            Object value = data.get("content_features");
            if (value instanceof Map) {
                return (Map<String, Object>) value;
            }
        }
        return new HashMap<>();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getActivityKeywords() {
        Map<String, Object> features = getContentFeatures();
        if (features != null && features.containsKey("activity_keywords")) {
            Object value = features.get("activity_keywords");
            if (value instanceof Map) {
                return (Map<String, Object>) value;
            }
        }
        return new HashMap<>();
    }

    public String getPriceCategory() {
        Map<String, Object> features = getContentFeatures();
        if (features != null && features.containsKey("price_category")) {
            Object value = features.get("price_category");
            if (value != null) {
                return value.toString();
            }
        }
        return "moderate";
    }

    public Integer getBudgetScore() {
        Map<String, Object> features = getContentFeatures();
        if (features != null && features.containsKey("budget_score")) {
            Object value = features.get("budget_score");
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
        }
        return 2; // Default moderate
    }

    public String getDifficultyIndicators() {
        Map<String, Object> features = getContentFeatures();
        if (features != null && features.containsKey("difficulty_indicators")) {
            Object value = features.get("difficulty_indicators");
            if (value != null) {
                return value.toString();
            }
        }
        return "unknown";
    }

    public String getDurationCategory() {
        Map<String, Object> features = getContentFeatures();
        if (features != null && features.containsKey("duration_category")) {
            Object value = features.get("duration_category");
            if (value != null) {
                return value.toString();
            }
        }
        return "unknown";
    }

    public Double getReviewQualityScore() {
        Map<String, Object> data = getIntelligenceData();
        if (data != null && data.containsKey("review_quality_score")) {
            Object value = data.get("review_quality_score");
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
        }
        return 0.0;
    }
}
