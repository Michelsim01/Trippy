package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "trip_chat")
public class TripChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tripChatId;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "trip_cohort_id")
    private TripCohort tripCohort;

    private String name;
    private LocalDateTime createdAt;

    @OneToMany(
        mappedBy = "tripChat",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<ChatMember> chatMembers;

    @OneToMany(
        mappedBy = "tripChat",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<Message> messages;

    public Long getTripChatId() { return tripChatId; }
    public void setTripChatId(Long tripChatId) { this.tripChatId = tripChatId; }
    public TripCohort getTripCohort() { return tripCohort; }
    public void setTripCohort(TripCohort tripCohort) { this.tripCohort = tripCohort; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.util.List<ChatMember> getChatMembers() { return chatMembers; }
    public void setChatMembers(java.util.List<ChatMember> chatMembers) { this.chatMembers = chatMembers; }
    public java.util.List<Message> getMessages() { return messages; }
    public void setMessages(java.util.List<Message> messages) { this.messages = messages; }
}
