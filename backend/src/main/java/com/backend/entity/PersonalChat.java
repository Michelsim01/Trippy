package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "personal_chat")
public class PersonalChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long personalChatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "guide", "mediaList", "itineraries", "schedules", "reviews", "wishlistItems", "personalChats"})
    private Experience experience;

    private String name;
    private LocalDateTime createdAt;

    @OneToMany(
        mappedBy = "personalChat",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "personalChat", "tripChat"})
    private List<ChatMember> chatMembers;

    @OneToMany(
        mappedBy = "personalChat",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "personalChat", "tripChat", "sender"})
    private List<Message> messages;

    // Transient field for last message content
    @Transient
    private String lastMessage;

    // Transient field for last message timestamp
    @Transient
    private LocalDateTime lastMessageTime;

    // Transient field for unread count (for current user)
    @Transient
    private Integer unreadCount;

    public Long getPersonalChatId() { return personalChatId; }
    public void setPersonalChatId(Long personalChatId) { this.personalChatId = personalChatId; }
    public Experience getExperience() { return experience; }
    public void setExperience(Experience experience) { this.experience = experience; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.util.List<ChatMember> getChatMembers() { return chatMembers; }
    public void setChatMembers(java.util.List<ChatMember> chatMembers) { this.chatMembers = chatMembers; }
    public java.util.List<Message> getMessages() { return messages; }
    public void setMessages(java.util.List<Message> messages) { this.messages = messages; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(LocalDateTime lastMessageTime) { this.lastMessageTime = lastMessageTime; }
    public Integer getUnreadCount() { return unreadCount; }
    public void setUnreadCount(Integer unreadCount) { this.unreadCount = unreadCount; }
}
