package com.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatbotMessageRequest {
    
    @NotBlank(message = "Message cannot be empty")
    @Size(max = 5000, message = "Message cannot exceed 5000 characters")
    private String message;
    
    private String sessionId;
    
    private String context; // Optional context for the conversation
    
    private String chatbotType = "experienceRecommendation"; // Default to travel chatbot
    
    // Constructors
    public ChatbotMessageRequest() {}
    
    public ChatbotMessageRequest(String message, String sessionId) {
        this.message = message;
        this.sessionId = sessionId;
    }
    
    // Getters and Setters
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getContext() {
        return context;
    }
    
    public void setContext(String context) {
        this.context = context;
    }
    
    public String getChatbotType() {
        return chatbotType;
    }
    
    public void setChatbotType(String chatbotType) {
        this.chatbotType = chatbotType;
    }
}