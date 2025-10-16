package com.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public class UserSurveyDTO {
    private Long surveyId;
    private Long userId;
    private String introduction;
    private List<String> interests;
    private String travelStyle;
    private String experienceBudget;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime completedAt;

    // Default constructor
    public UserSurveyDTO() {}

    // Constructor with all fields
    public UserSurveyDTO(Long surveyId, Long userId, String introduction, List<String> interests, 
                        String travelStyle, String experienceBudget, LocalDateTime completedAt) {
        this.surveyId = surveyId;
        this.userId = userId;
        this.introduction = introduction;
        this.interests = interests;
        this.travelStyle = travelStyle;
        this.experienceBudget = experienceBudget;
        this.completedAt = completedAt;
    }

    // Getters and setters
    public Long getSurveyId() { return surveyId; }
    public void setSurveyId(Long surveyId) { this.surveyId = surveyId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }

    public List<String> getInterests() { return interests; }
    public void setInterests(List<String> interests) { this.interests = interests; }

    public String getTravelStyle() { return travelStyle; }
    public void setTravelStyle(String travelStyle) { this.travelStyle = travelStyle; }

    public String getExperienceBudget() { return experienceBudget; }
    public void setExperienceBudget(String experienceBudget) { this.experienceBudget = experienceBudget; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    @Override
    public String toString() {
        return "UserSurveyDTO{" +
                "surveyId=" + surveyId +
                ", userId=" + userId +
                ", introduction='" + introduction + '\'' +
                ", interests=" + interests +
                ", travelStyle='" + travelStyle + '\'' +
                ", experienceBudget='" + experienceBudget + '\'' +
                ", completedAt=" + completedAt +
                '}';
    }
}