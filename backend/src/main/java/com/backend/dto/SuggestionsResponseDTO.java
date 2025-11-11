package com.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public class SuggestionsResponseDTO {
    
    @JsonProperty("experience_id") 
    private Long experienceId;
    
    @JsonProperty("experience_title")
    private String experienceTitle;
    
    @JsonProperty("suggestions")
    private List<SmartSuggestionDTO> suggestions;
    
    @JsonProperty("total_suggestions")
    private Integer totalSuggestions;
    
    @JsonProperty("analysis_base")
    private String analysisBase;
    
    @JsonProperty("generated_at")
    private LocalDateTime generatedAt;
    
    @JsonProperty("has_similar_experiences")
    private Boolean hasSimilarExperiences;
    
    @JsonProperty("similar_experiences_count")
    private Integer similarExperiencesCount;
    
    // Default constructor
    public SuggestionsResponseDTO() {
        this.generatedAt = LocalDateTime.now();
    }
    
    // Constructor with essential fields
    public SuggestionsResponseDTO(Long experienceId, String experienceTitle, List<SmartSuggestionDTO> suggestions, 
                                 Integer similarExperiencesCount) {
        this();
        this.experienceId = experienceId;
        this.experienceTitle = experienceTitle;
        this.suggestions = suggestions;
        this.totalSuggestions = suggestions != null ? suggestions.size() : 0;
        this.similarExperiencesCount = similarExperiencesCount;
        this.hasSimilarExperiences = similarExperiencesCount != null && similarExperiencesCount > 0;
        this.analysisBase = String.format("Based on analysis of similar experiences", 
                                        similarExperiencesCount != null ? similarExperiencesCount : 0);
    }
    
    // Builder pattern
    public static SuggestionsResponseDTOBuilder builder() {
        return new SuggestionsResponseDTOBuilder();
    }
    
    // Getters and Setters
    public Long getExperienceId() {
        return experienceId;
    }
    
    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }
    
    public String getExperienceTitle() {
        return experienceTitle;
    }
    
    public void setExperienceTitle(String experienceTitle) {
        this.experienceTitle = experienceTitle;
    }
    
    public List<SmartSuggestionDTO> getSuggestions() {
        return suggestions;
    }
    
    public void setSuggestions(List<SmartSuggestionDTO> suggestions) {
        this.suggestions = suggestions;
        this.totalSuggestions = suggestions != null ? suggestions.size() : 0;
    }
    
    public Integer getTotalSuggestions() {
        return totalSuggestions;
    }
    
    public void setTotalSuggestions(Integer totalSuggestions) {
        this.totalSuggestions = totalSuggestions;
    }
    
    public String getAnalysisBase() {
        return analysisBase;
    }
    
    public void setAnalysisBase(String analysisBase) {
        this.analysisBase = analysisBase;
    }
    
    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
    
    public Boolean getHasSimilarExperiences() {
        return hasSimilarExperiences;
    }
    
    public void setHasSimilarExperiences(Boolean hasSimilarExperiences) {
        this.hasSimilarExperiences = hasSimilarExperiences;
    }
    
    public Integer getSimilarExperiencesCount() {
        return similarExperiencesCount;
    }
    
    public void setSimilarExperiencesCount(Integer similarExperiencesCount) {
        this.similarExperiencesCount = similarExperiencesCount;
        this.hasSimilarExperiences = similarExperiencesCount != null && similarExperiencesCount > 0;
    }
    
    // Builder class
    public static class SuggestionsResponseDTOBuilder {
        private SuggestionsResponseDTO response = new SuggestionsResponseDTO();
        
        public SuggestionsResponseDTOBuilder experienceId(Long experienceId) {
            response.setExperienceId(experienceId);
            return this;
        }
        
        public SuggestionsResponseDTOBuilder experienceTitle(String experienceTitle) {
            response.setExperienceTitle(experienceTitle);
            return this;
        }
        
        public SuggestionsResponseDTOBuilder suggestions(List<SmartSuggestionDTO> suggestions) {
            response.setSuggestions(suggestions);
            return this;
        }
        
        public SuggestionsResponseDTOBuilder similarExperiencesCount(Integer count) {
            response.setSimilarExperiencesCount(count);
            response.setAnalysisBase(String.format("Based on analysis of similar experiences", 
                                                 count != null ? count : 0));
            return this;
        }
        
        public SuggestionsResponseDTOBuilder analysisBase(String analysisBase) {
            response.setAnalysisBase(analysisBase);
            return this;
        }
        
        public SuggestionsResponseDTO build() {
            return response;
        }
    }
}