// com/backend/entity/BookingStatus.java
package com.backend.entity;

public enum BookingStatus {
    PENDING,        // created, awaiting payment (or 3DS action, or after payment failure)
    CONFIRMED,      // paid
    CANCELLED,      // cancelled (refund optional)
    COMPLETED       // experience finished
}