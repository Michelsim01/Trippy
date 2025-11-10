package com.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class SmartSuggestionDTO { 
    
    @NotNull
    @JsonProperty("type")
    private SuggestionType type;
    
    @NotBlank
    @JsonProperty("title")
    private String title;
    
    @NotBlank
    @JsonProperty("description")
    private String description;
    
    @NotNull
    @JsonProperty("priority")
    private SuggestionPriority priority;
    
    @JsonProperty("impact_estimate")
    private BigDecimal impactEstimate;
    
    @JsonProperty("action_type")
    private String actionType;
    
    // Default constructor
    public SmartSuggestionDTO() {}
    
    // Constructor with all fields
    public SmartSuggestionDTO(SuggestionType type, String title, String description, 
                             SuggestionPriority priority, BigDecimal impactEstimate, String actionType) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.impactEstimate = impactEstimate;
        this.actionType = actionType;
    }
    
    // Builder pattern
    public static SmartSuggestionDTOBuilder builder() {
        return new SmartSuggestionDTOBuilder();
    }
    
    // Getters and Setters
    public SuggestionType getType() {
        return type;
    }
    
    public void setType(SuggestionType type) {
        this.type = type;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public SuggestionPriority getPriority() {
        return priority;
    }
    
    public void setPriority(SuggestionPriority priority) {
        this.priority = priority;
    }
    
    public BigDecimal getImpactEstimate() {
        return impactEstimate;
    }
    
    public void setImpactEstimate(BigDecimal impactEstimate) {
        this.impactEstimate = impactEstimate;
    }
    
    public String getActionType() {
        return actionType;
    }
    
    public void setActionType(String actionType) {
        this.actionType = actionType;
    }
    
    // Enums
    public enum SuggestionType {
        PRICING,
        CONVERSION, 
        CONTENT,
        DURATION,
        PERFORMANCE
    }
    
    public enum SuggestionPriority {
        HIGH,
        MEDIUM,
        LOW
    }
    
    // Builder class
    public static class SmartSuggestionDTOBuilder {
        private SmartSuggestionDTO dto = new SmartSuggestionDTO();
        
        public SmartSuggestionDTOBuilder type(SuggestionType type) {
            dto.setType(type);
            return this;
        }
        
        public SmartSuggestionDTOBuilder title(String title) {
            dto.setTitle(title);
            return this;
        }
        
        public SmartSuggestionDTOBuilder description(String description) {
            dto.setDescription(description);
            return this;
        }
        
        public SmartSuggestionDTOBuilder priority(SuggestionPriority priority) {
            dto.setPriority(priority);
            return this;
        }
        
        public SmartSuggestionDTOBuilder impactEstimate(BigDecimal impactEstimate) {
            dto.setImpactEstimate(impactEstimate);
            return this;
        }
        
        public SmartSuggestionDTOBuilder actionType(String actionType) {
            dto.setActionType(actionType);
            return this;
        }
        
        public SmartSuggestionDTO build() {
            return dto;
        }
    }
}