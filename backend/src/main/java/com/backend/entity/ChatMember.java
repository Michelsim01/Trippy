package com.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "passwordResetToken", "emailVerificationToken", "chatMembers", "experiences", "bookings", "reviews", "sentMessages", "notifications", "wishlistItems", "tripPointsTransactions", "userSurvey", "transactions", "articleComments", "travelArticles"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_chat_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "chatMembers", "messages"})
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
    public PersonalChat getPersonalChat() { return personalChat; }
    public void setPersonalChat(PersonalChat personalChat) { this.personalChat = personalChat; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
