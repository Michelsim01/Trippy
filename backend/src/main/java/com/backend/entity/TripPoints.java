package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_points")
public class TripPoints {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pointsId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer pointsBalance;
    private Integer totalEarned;
    private Integer totalRedeemed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getPointsId() { return pointsId; }
    public void setPointsId(Long pointsId) { this.pointsId = pointsId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getPointsBalance() { return pointsBalance; }
    public void setPointsBalance(Integer pointsBalance) { this.pointsBalance = pointsBalance; }
    public Integer getTotalEarned() { return totalEarned; }
    public void setTotalEarned(Integer totalEarned) { this.totalEarned = totalEarned; }
    public Integer getTotalRedeemed() { return totalRedeemed; }
    public void setTotalRedeemed(Integer totalRedeemed) { this.totalRedeemed = totalRedeemed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
