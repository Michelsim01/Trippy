package com.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_points")
public class TripPoints {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "points_id")
    private Long pointsId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TripPointsTransaction transactionType;

    @Column(name = "points_change", nullable = false)
    private Integer pointsChange; // Can be positive (earned) or negative (redeemed)

    @Column(name = "points_balance_after", nullable = false)
    private Integer pointsBalanceAfter; // Balance after this transaction

    @Column(name = "reference_id")
    private Long referenceId; // Optional reference to booking, review, etc.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public TripPoints() {}

    public TripPoints(User user, TripPointsTransaction transactionType, Integer pointsChange, Integer pointsBalanceAfter) {
        this.user = user;
        this.transactionType = transactionType;
        this.pointsChange = pointsChange;
        this.pointsBalanceAfter = pointsBalanceAfter;
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
    
    public TripPointsTransaction getTransactionType() {
        return transactionType;
    }
    
    public void setTransactionType(TripPointsTransaction transactionType) {
        this.transactionType = transactionType;
    }
    
    public Integer getPointsChange() {
        return pointsChange;
    }
    
    public void setPointsChange(Integer pointsChange) {
        this.pointsChange = pointsChange;
    }
    
    public Integer getPointsBalanceAfter() {
        return pointsBalanceAfter;
    }
    
    public void setPointsBalanceAfter(Integer pointsBalanceAfter) {
        this.pointsBalanceAfter = pointsBalanceAfter;
    }
    
    public Long getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }
    
    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
}
