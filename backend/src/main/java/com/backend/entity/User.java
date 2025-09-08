package com.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", 
       uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;
    
    @NotBlank
    @Size(max = 50)
    @Email
    @Column(name = "email", unique = true, nullable = false, length = 50)
    private String email;
    
    @NotBlank
    @Size(max = 100)
    @Column(name = "password", nullable = false, length = 100)
    private String password;
    
    @NotBlank
    @Size(max = 50)
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;
    
    @NotBlank
    @Size(max = 50)
    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;
    
    @Size(max = 20)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @Column(name = "profile_image_url")
    private String profileImageUrl;
    
    @Column(name = "is_email_verified", nullable = false)
    private Boolean isEmailVerified = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // Capability fields
    @Column(name = "can_create_experiences", nullable = false)
    private Boolean canCreateExperiences = false;
    
    @Column(name = "is_admin", nullable = false)
    private Boolean isAdmin = false;
    
    // KYC fields
    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false)
    private KycStatus kycStatus = KycStatus.NOT_STARTED;
    
    @Column(name = "kyc_submitted_at")
    private LocalDateTime kycSubmittedAt;
    
    @Column(name = "kyc_approved_at")
    private LocalDateTime kycApprovedAt;
    
    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    // Constructors
    public User() {}
    
    public User(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public String getPhoneNumber() {
        return phoneNumber;
    }
    
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
    
    public Boolean getIsEmailVerified() {
        return isEmailVerified;
    }
    
    public void setIsEmailVerified(Boolean isEmailVerified) {
        this.isEmailVerified = isEmailVerified;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Boolean getCanCreateExperiences() {
        return canCreateExperiences;
    }
    
    public void setCanCreateExperiences(Boolean canCreateExperiences) {
        this.canCreateExperiences = canCreateExperiences;
    }
    
    public Boolean getIsAdmin() {
        return isAdmin;
    }
    
    public void setIsAdmin(Boolean isAdmin) {
        this.isAdmin = isAdmin;
    }
    
    public KycStatus getKycStatus() {
        return kycStatus;
    }
    
    public void setKycStatus(KycStatus kycStatus) {
        this.kycStatus = kycStatus;
    }
    
    public LocalDateTime getKycSubmittedAt() {
        return kycSubmittedAt;
    }
    
    public void setKycSubmittedAt(LocalDateTime kycSubmittedAt) {
        this.kycSubmittedAt = kycSubmittedAt;
    }
    
    public LocalDateTime getKycApprovedAt() {
        return kycApprovedAt;
    }
    
    public void setKycApprovedAt(LocalDateTime kycApprovedAt) {
        this.kycApprovedAt = kycApprovedAt;
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
    
    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }
    
    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
    
    // Helper methods
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    public boolean isTraveler() {
        return true; // Every user is a traveler
    }
    
    public boolean isGuide() {
        return canCreateExperiences && kycStatus == KycStatus.APPROVED;
    }
    
    public boolean isAdmin() {
        return isAdmin;
    }
    
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", canCreateExperiences=" + canCreateExperiences +
                ", kycStatus=" + kycStatus +
                ", isActive=" + isActive +
                '}';
    }
}

