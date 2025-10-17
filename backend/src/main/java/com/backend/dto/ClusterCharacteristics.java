package com.backend.dto;

import java.util.List;

public class ClusterCharacteristics {
    private List<String> dominantInterests;
    private List<String> relevantCategories;
    private Integer avgBudgetScore;
    private Double avgBookingAmount;

    // Constructors
    public ClusterCharacteristics() {
    }

    public ClusterCharacteristics(List<String> dominantInterests, List<String> relevantCategories,
                                 Integer avgBudgetScore, Double avgBookingAmount) {
        this.dominantInterests = dominantInterests;
        this.relevantCategories = relevantCategories;
        this.avgBudgetScore = avgBudgetScore;
        this.avgBookingAmount = avgBookingAmount;
    }

    // Getters and Setters
    public List<String> getDominantInterests() {
        return dominantInterests;
    }

    public void setDominantInterests(List<String> dominantInterests) {
        this.dominantInterests = dominantInterests;
    }

    public List<String> getRelevantCategories() {
        return relevantCategories;
    }

    public void setRelevantCategories(List<String> relevantCategories) {
        this.relevantCategories = relevantCategories;
    }

    public Integer getAvgBudgetScore() {
        return avgBudgetScore;
    }

    public void setAvgBudgetScore(Integer avgBudgetScore) {
        this.avgBudgetScore = avgBudgetScore;
    }

    public Double getAvgBookingAmount() {
        return avgBookingAmount;
    }

    public void setAvgBookingAmount(Double avgBookingAmount) {
        this.avgBookingAmount = avgBookingAmount;
    }
}
