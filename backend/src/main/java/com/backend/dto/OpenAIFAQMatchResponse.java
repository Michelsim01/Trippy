package com.backend.dto;

import java.util.List;

/**
 * DTO for OpenAI FAQ matching response
 */
public class OpenAIFAQMatchResponse {
    
    public enum MatchType {
        EXACT,   // User query exactly matches an FAQ
        CLOSE,   // User query closely matches an FAQ
        UNCLEAR  // User query is unclear, needs clarification
    }
    
    private MatchType matchType;
    private Integer matchedFAQIndex;  // Index in the provided FAQ list (0-based)
    private Double confidence;        // Confidence score 0.0-1.0
    private List<Integer> suggestedFAQIndices;  // Top 3-5 FAQs if unclear
    private String reasoning;         // Optional reasoning for debugging
    
    public OpenAIFAQMatchResponse() {}
    
    public OpenAIFAQMatchResponse(MatchType matchType, Integer matchedFAQIndex, Double confidence, 
                                  List<Integer> suggestedFAQIndices, String reasoning) {
        this.matchType = matchType;
        this.matchedFAQIndex = matchedFAQIndex;
        this.confidence = confidence;
        this.suggestedFAQIndices = suggestedFAQIndices;
        this.reasoning = reasoning;
    }
    
    // Getters and Setters
    public MatchType getMatchType() {
        return matchType;
    }
    
    public void setMatchType(MatchType matchType) {
        this.matchType = matchType;
    }
    
    public Integer getMatchedFAQIndex() {
        return matchedFAQIndex;
    }
    
    public void setMatchedFAQIndex(Integer matchedFAQIndex) {
        this.matchedFAQIndex = matchedFAQIndex;
    }
    
    public Double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
    
    public List<Integer> getSuggestedFAQIndices() {
        return suggestedFAQIndices;
    }
    
    public void setSuggestedFAQIndices(List<Integer> suggestedFAQIndices) {
        this.suggestedFAQIndices = suggestedFAQIndices;
    }
    
    public String getReasoning() {
        return reasoning;
    }
    
    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
}

