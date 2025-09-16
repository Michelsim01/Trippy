package com.backend.entity;

/**
 * Enum representing the capabilities a user can have in the Trippy platform.
 * Users can have multiple capabilities simultaneously.
 */
public enum UserCapability { 
    /**
     * Can book and participate in experiences.
     * This capability is available to ALL users by default.
     */
    TRAVELER,
    
    /**
     * Can create and manage experiences.
     * This capability requires KYC approval.
     */
    GUIDE,
    
    /**
     * Platform administrator with full access.
     * This capability is granted manually by existing admins.
     */
    ADMIN
}
