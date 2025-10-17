package com.backend.dto;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceIntelligence;

import java.util.HashMap;
import java.util.Map;

public class ScoredExperience {
    private Experience experience;
    private ExperienceIntelligence intelligence;
    private Double finalScore;
    private Map<String, Double> scoreBreakdown;
    private String recommendationReason;

    // Constructors
    public ScoredExperience() {
        this.scoreBreakdown = new HashMap<>();
    }

    public ScoredExperience(Experience experience, ExperienceIntelligence intelligence, Double finalScore) {
        this.experience = experience;
        this.intelligence = intelligence;
        this.finalScore = finalScore;
        this.scoreBreakdown = new HashMap<>();
    }

    // Getters and Setters
    public Experience getExperience() {
        return experience;
    }

    public void setExperience(Experience experience) {
        this.experience = experience;
    }

    public ExperienceIntelligence getIntelligence() {
        return intelligence;
    }

    public void setIntelligence(ExperienceIntelligence intelligence) {
        this.intelligence = intelligence;
    }

    public Double getFinalScore() {
        return finalScore;
    }

    public void setFinalScore(Double finalScore) {
        this.finalScore = finalScore;
    }

    public Map<String, Double> getScoreBreakdown() {
        return scoreBreakdown;
    }

    public void setScoreBreakdown(Map<String, Double> scoreBreakdown) {
        this.scoreBreakdown = scoreBreakdown;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    // Helper methods to add individual scores
    public void addScore(String component, Double score) {
        this.scoreBreakdown.put(component, score);
    }
}
