package com.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "chatbot_messages")
public class ChatbotMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @JsonBackReference
    private ChatbotSession chatbotSession;
    
    @NotNull
    @Column(name = "user_message", length = 5000)
    @Size(max = 5000)
    private String userMessage;
    
    @Column(name = "bot_response", length = 10000)
    @Size(max = 10000)
    private String botResponse;
    
    @Column(name = "sources", columnDefinition = "TEXT")
    private String sources; // JSON string of source documents
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public ChatbotMessage() {}
    
    public ChatbotMessage(ChatbotSession chatbotSession, String userMessage) {
        this.chatbotSession = chatbotSession;
        this.userMessage = userMessage;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public ChatbotSession getChatbotSession() {
        return chatbotSession;
    }
    
    public void setChatbotSession(ChatbotSession chatbotSession) {
        this.chatbotSession = chatbotSession;
    }
    
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
    
    public String getSources() {
        return sources;
    }
    
    public void setSources(String sources) {
        this.sources = sources;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}