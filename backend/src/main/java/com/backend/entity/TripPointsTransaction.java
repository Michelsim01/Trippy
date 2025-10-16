package com.backend.entity;

public enum TripPointsTransaction {
    REVIEW("Review", "Left a review"),
    REDEMPTION("Redemption", "Redeemed points"),
    BONUS("Bonus", "Bonus points"),
    REFUND("Refund", "Points refunded");

    private final String displayName;
    private final String description;

    TripPointsTransaction(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Get a user-friendly description for display purposes
     */
    public String getDisplayDescription() {
        return description;
    }

    /**
     * Get a formatted description with emoji for better UX
     */
    public String getFormattedDescription() {
        switch (this) {
            case REVIEW:
                return "⭐ " + description;
            case REDEMPTION:
                return "🎁 " + description;
            case BONUS:
                return "🎉 " + description;
            case REFUND:
                return "↩️ " + description;
            default:
                return description;
        }
    }
}
