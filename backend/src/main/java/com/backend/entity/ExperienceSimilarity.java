package com.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "experience_similarities")
@IdClass(ExperienceSimilarityId.class)
public class ExperienceSimilarity {

    @Id
    @Column(name = "experience_id")
    private Long experienceId;

    @Id
    @Column(name = "similar_experience_id")
    private Long similarExperienceId;

    @Column(name = "similarity_score", precision = 4, scale = 3)
    private BigDecimal similarityScore;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    // Constructors
    public ExperienceSimilarity() {
    }

    public ExperienceSimilarity(Long experienceId, Long similarExperienceId,
                               BigDecimal similarityScore, LocalDateTime lastUpdated) {
        this.experienceId = experienceId;
        this.similarExperienceId = similarExperienceId;
        this.similarityScore = similarityScore;
        this.lastUpdated = lastUpdated;
    }

    // Getters and Setters
    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public Long getSimilarExperienceId() {
        return similarExperienceId;
    }

    public void setSimilarExperienceId(Long similarExperienceId) {
        this.similarExperienceId = similarExperienceId;
    }

    public BigDecimal getSimilarityScore() {
        return similarityScore != null ? similarityScore : BigDecimal.ZERO;
    }

    public void setSimilarityScore(BigDecimal similarityScore) {
        this.similarityScore = similarityScore;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
