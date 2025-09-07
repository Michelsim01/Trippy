package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "personal_chat")
public class PersonalChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long personalChatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_schedule_id", nullable = false)
    private ExperienceSchedule experienceSchedule;

    private String name;
    private LocalDateTime createdAt;

    @OneToMany(
        mappedBy = "personalChat",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<ChatMember> chatMembers;

    @OneToMany(
        mappedBy = "personalChat",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    private List<Message> messages;

    public Long getPersonalChatId() { return personalChatId; }
    public void setPersonalChatId(Long personalChatId) { this.personalChatId = personalChatId; }
    public ExperienceSchedule getExperienceSchedule() { return experienceSchedule; }
    public void setExperienceSchedule(ExperienceSchedule experienceSchedule) { this.experienceSchedule = experienceSchedule; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.util.List<ChatMember> getChatMembers() { return chatMembers; }
    public void setChatMembers(java.util.List<ChatMember> chatMembers) { this.chatMembers = chatMembers; }
    public java.util.List<Message> getMessages() { return messages; }
    public void setMessages(java.util.List<Message> messages) { this.messages = messages; }
}
