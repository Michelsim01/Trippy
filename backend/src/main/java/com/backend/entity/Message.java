package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "message")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    private PersonalChat personalChat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_chat_id")
    private TripChat tripChat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    private String content;

    @Enumerated(EnumType.STRING)
    private MessageTypeEnum messageType;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }
    public PersonalChat getPersonalChat() { return personalChat; }
    public void setPersonalChat(PersonalChat personalChat) { this.personalChat = personalChat; }
    public TripChat getTripChat() { return tripChat; }
    public void setTripChat(TripChat tripChat) { this.tripChat = tripChat; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public MessageTypeEnum getMessageType() { return messageType; }
    public void setMessageType(MessageTypeEnum messageType) { this.messageType = messageType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
