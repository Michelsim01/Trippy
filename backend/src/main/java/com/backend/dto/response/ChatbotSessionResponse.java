package com.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public class ChatbotSessionResponse {
    
    @JsonProperty("sessionId")
    private String sessionId;
    
    private List<MessageHistory> messages;
    
    private LocalDateTime createdAt;
    
    // Constructors
    public ChatbotSessionResponse() {}
    
    public ChatbotSessionResponse(String sessionId, List<MessageHistory> messages, LocalDateTime createdAt) {
        this.sessionId = sessionId;
        this.messages = messages;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public List<MessageHistory> getMessages() {
        return messages;
    }
    
    public void setMessages(List<MessageHistory> messages) {
        this.messages = messages;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    // Inner class for message history
    public static class MessageHistory {
        private String userMessage;
        private String botResponse;
        private LocalDateTime timestamp;
        
        public MessageHistory() {}
        
        public MessageHistory(String userMessage, String botResponse, LocalDateTime timestamp) {
            this.userMessage = userMessage;
            this.botResponse = botResponse;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public String getUserMessage() {
            return userMessage;
        }
        
        public void setUserMessage(String userMessage) {
            this.userMessage = userMessage;
        }
        
        public String getBotResponse() {
            return botResponse;
        }
        
        public void setBotResponse(String botResponse) {
            this.botResponse = botResponse;
        }
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
}