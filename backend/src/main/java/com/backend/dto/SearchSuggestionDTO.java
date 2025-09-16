package com.backend.dto;

public class SearchSuggestionDTO {
    private String type; // "location" or "experience"
    private String text;
    private String subtitle;
    private Long experienceId; // only for experience type
    
    public SearchSuggestionDTO() {}
    
    public SearchSuggestionDTO(String type, String text, String subtitle, Long experienceId) {
        this.type = type;
        this.text = text;
        this.subtitle = subtitle;
        this.experienceId = experienceId;
    }
    
    // Static factory methods for easier creation
    public static SearchSuggestionDTO location(String locationName) {
        return new SearchSuggestionDTO("location", locationName, "Country", null);
    }
    
    public static SearchSuggestionDTO experience(String title, String country, Long experienceId) {
        return new SearchSuggestionDTO("experience", title, "Experience in " + country, experienceId);
    }
    
    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    
    public Long getExperienceId() { return experienceId; }
    public void setExperienceId(Long experienceId) { this.experienceId = experienceId; }
}