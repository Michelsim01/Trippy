package com.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_points")
public class TripPoints {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "points_id")
    private Long pointsId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "points_balance")
    private Integer pointsBalance = 0;

    @Column(name = "total_earned")
    private Integer totalEarned = 0;

    @Column(name = "total_redeemed")
    private Integer totalRedeemed = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Constructors
    public TripPoints() {}

    public TripPoints(User user) {
        this.user = user;
        this.pointsBalance = 0;
        this.totalEarned = 0;
        this.totalRedeemed = 0;
    }

    // Getters and Setters
    public Long getPointsId() { 
        return pointsId; 
    }
    
    public void setPointsId(Long pointsId) { 
        this.pointsId = pointsId; 
    }
    
    public User getUser() { 
        return user; 
    }
    
    public void setUser(User user) { 
        this.user = user; 
    }
    
    public Integer getPointsBalance() { 
        return pointsBalance; 
    }
    
    public void setPointsBalance(Integer pointsBalance) { 
        this.pointsBalance = pointsBalance; 
    }
    
    public Integer getTotalEarned() { 
        return totalEarned; 
    }
    
    public void setTotalEarned(Integer totalEarned) { 
        this.totalEarned = totalEarned; 
    }
    
    public Integer getTotalRedeemed() { 
        return totalRedeemed; 
    }
    
    public void setTotalRedeemed(Integer totalRedeemed) { 
        this.totalRedeemed = totalRedeemed; 
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

    // Business logic methods
    public void addPoints(Integer points) {
        if (points != null && points > 0) {
            this.pointsBalance = (this.pointsBalance != null ? this.pointsBalance : 0) + points;
            this.totalEarned = (this.totalEarned != null ? this.totalEarned : 0) + points;
        }
    }

    public boolean redeemPoints(Integer points) {
        if (points != null && points > 0 && this.pointsBalance != null && this.pointsBalance >= points) {
            this.pointsBalance -= points;
            this.totalRedeemed = (this.totalRedeemed != null ? this.totalRedeemed : 0) + points;
            return true;
        }
        return false;
    }
}
