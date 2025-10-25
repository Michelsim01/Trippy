package com.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing an admin referral invitation.
 * This stores referral data temporarily until the referred admin signs up.
 */
@Entity
@Table(name = "admin_referrals")
public class AdminReferral {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String referredEmail;
    
    @Column(name = "referral_token", nullable = false, unique = true)
    private String referralToken;
    
    @Column(name = "referrer_id", nullable = false)
    private Long referrerId;
    
    @Column(name = "referrer_email", nullable = false)
    private String referrerEmail;
    
    @Column(name = "referrer_name", nullable = false)
    private String referrerName;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;
    
    @Column(name = "used_at")
    private LocalDateTime usedAt;
    
    // Constructors
    public AdminReferral() {
    }
    
    public AdminReferral(String referredEmail, String referralToken, Long referrerId, 
                         String referrerEmail, String referrerName) {
        this.referredEmail = referredEmail;
        this.referralToken = referralToken;
        this.referrerId = referrerId;
        this.referrerEmail = referrerEmail;
        this.referrerName = referrerName;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(7); // Expire after 7 days
        this.isUsed = false;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getReferredEmail() {
        return referredEmail;
    }
    
    public void setReferredEmail(String referredEmail) {
        this.referredEmail = referredEmail;
    }
    
    public String getReferralToken() {
        return referralToken;
    }
    
    public void setReferralToken(String referralToken) {
        this.referralToken = referralToken;
    }
    
    public Long getReferrerId() {
        return referrerId;
    }
    
    public void setReferrerId(Long referrerId) {
        this.referrerId = referrerId;
    }
    
    public String getReferrerEmail() {
        return referrerEmail;
    }
    
    public void setReferrerEmail(String referrerEmail) {
        this.referrerEmail = referrerEmail;
    }
    
    public String getReferrerName() {
        return referrerName;
    }
    
    public void setReferrerName(String referrerName) {
        this.referrerName = referrerName;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Boolean getIsUsed() {
        return isUsed;
    }
    
    public void setIsUsed(Boolean isUsed) {
        this.isUsed = isUsed;
    }
    
    public LocalDateTime getUsedAt() {
        return usedAt;
    }
    
    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }
    
    // Helper methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }
    
    public boolean isValid() {
        return !this.isUsed && !this.isExpired();
    }
}
