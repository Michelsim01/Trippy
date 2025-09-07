package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_member")
public class ChatMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_chat_id")
    private TripChat tripChat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_chat_id")
    private PersonalChat personalChat;

    @Enumerated(EnumType.STRING)
    private ChatRoleEnum role;

    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TripChat getTripChat() { return tripChat; }
    public void setTripChat(TripChat tripChat) { this.tripChat = tripChat; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public ChatRoleEnum getRole() { return role; }
    public void setRole(ChatRoleEnum role) { this.role = role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
