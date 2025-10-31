package com.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public class ChatMessageResponse {
    
    private String response;
    
    @JsonProperty("sessionId")
    private String sessionId;
    
    private List<SourceDocument> sources;
    
    private LocalDateTime timestamp;
    
    // Constructors
    public ChatMessageResponse() {}
    
    public ChatMessageResponse(String response, String sessionId) {
        this.response = response;
        this.sessionId = sessionId;
        this.timestamp = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getResponse() {
        return response;
    }
    
    public void setResponse(String response) {
        this.response = response;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public List<SourceDocument> getSources() {
        return sources;
    }
    
    public void setSources(List<SourceDocument> sources) {
        this.sources = sources;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    // Inner class for source documents
    public static class SourceDocument {
        private String documentId;
        private String title;
        private String documentType;
        private Double relevanceScore;
        
        public SourceDocument() {}
        
        public SourceDocument(String documentId, String title, String documentType, Double relevanceScore) {
            this.documentId = documentId;
            this.title = title;
            this.documentType = documentType;
            this.relevanceScore = relevanceScore;
        }
        
        // Getters and Setters
        public String getDocumentId() {
            return documentId;
        }
        
        public void setDocumentId(String documentId) {
            this.documentId = documentId;
        }
        
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public String getDocumentType() {
            return documentType;
        }
        
        public void setDocumentType(String documentType) {
            this.documentType = documentType;
        }
        
        public Double getRelevanceScore() {
            return relevanceScore;
        }
        
        public void setRelevanceScore(Double relevanceScore) {
            this.relevanceScore = relevanceScore;
        }
    }
}