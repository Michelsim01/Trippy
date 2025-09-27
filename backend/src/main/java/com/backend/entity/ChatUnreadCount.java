package com.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "chat_unread_count")
public class ChatUnreadCount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private PersonalChat personalChat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "unread_count", nullable = false)
    private Integer unreadCount = 0;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    // Constructors
    public ChatUnreadCount() {}

    public ChatUnreadCount(PersonalChat personalChat, User user) {
        this.personalChat = personalChat;
        this.user = user;
        this.unreadCount = 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PersonalChat getPersonalChat() { return personalChat; }
    public void setPersonalChat(PersonalChat personalChat) { this.personalChat = personalChat; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getUnreadCount() { return unreadCount; }
    public void setUnreadCount(Integer unreadCount) { this.unreadCount = unreadCount; }

    public Long getLastReadMessageId() { return lastReadMessageId; }
    public void setLastReadMessageId(Long lastReadMessageId) { this.lastReadMessageId = lastReadMessageId; }
}