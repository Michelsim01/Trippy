package com.backend.entity;

/**
 * Enum representing the KYC (Know Your Customer) status of a user.
 * KYC is required for users who want to create experiences as guides.
 */
public enum KycStatus {
    /**
     * User has not started the KYC process
     */
    NOT_STARTED,
    
    /**
     * User has submitted KYC documents and is waiting for admin review
     */
    PENDING,
    
    /**
     * KYC has been approved by admin, user can now create experiences
     */
    APPROVED,
    
    /**
     * KYC has been rejected by admin, user cannot create experiences
     */
    REJECTED
}
