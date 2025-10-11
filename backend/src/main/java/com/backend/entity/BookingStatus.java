// com/backend/entity/BookingStatus.java
package com.backend.entity;

public enum BookingStatus {
    PENDING,                // created, awaiting payment (or 3DS action, or after payment failure)
    CONFIRMED,              // paid
    CANCELLED,              // cancelled (refund optional) - legacy status
    CANCELLED_BY_TOURIST,   // cancelled by tourist (auto-approved based on policy)
    CANCELLED_BY_GUIDE,     // cancelled by guide (affects multiple bookings)
    COMPLETED               // experience finished
}