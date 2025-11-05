package com.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_schedule_id", nullable = false)
    private ExperienceSchedule experienceSchedule;

    @Column(nullable = false)
    private Integer numberOfParticipants;

    @Column(name = "price_at_time_of_add", nullable = false)
    private BigDecimal priceAtTimeOfAdd;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Constructors
    public CartItem() {}

    public CartItem(User user, ExperienceSchedule experienceSchedule, Integer numberOfParticipants, BigDecimal priceAtTimeOfAdd) {
        this.user = user;
        this.experienceSchedule = experienceSchedule;
        this.numberOfParticipants = numberOfParticipants;
        this.priceAtTimeOfAdd = priceAtTimeOfAdd;
    }

    // Getters and Setters
    public Long getCartItemId() {
        return cartItemId;
    }

    public void setCartItemId(Long cartItemId) {
        this.cartItemId = cartItemId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ExperienceSchedule getExperienceSchedule() {
        return experienceSchedule;
    }

    public void setExperienceSchedule(ExperienceSchedule experienceSchedule) {
        this.experienceSchedule = experienceSchedule;
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
    }

    public BigDecimal getPriceAtTimeOfAdd() {
        return priceAtTimeOfAdd;
    }

    public void setPriceAtTimeOfAdd(BigDecimal priceAtTimeOfAdd) {
        this.priceAtTimeOfAdd = priceAtTimeOfAdd;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "CartItem{" +
                "cartItemId=" + cartItemId +
                ", numberOfParticipants=" + numberOfParticipants +
                ", priceAtTimeOfAdd=" + priceAtTimeOfAdd +
                ", createdAt=" + createdAt +
                '}';
    }
}
