package com.backend.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.Duration;
import java.math.BigDecimal;

@Service
public class CancellationPolicyService {

    /**
     * Returns the standardized cancellation policy text for display purposes
     * 
     * @return String containing the full cancellation policy
     */
    public String getStandardizedPolicy() {
        return "Free Cancellation Window: Travelers may cancel a booking within 24 hours of purchase for a full refund, provided the experience has not yet started. "
                +
                "\n\nStandard Cancellation: " +
                "\n• 7+ days before experience start: Full refund (minus service fee)" +
                "\n• 3-6 days before experience start: 50% refund" +
                "\n• Less than 48 hours before experience start: Non-refundable" +
                "\n• No-Shows: If a traveler does not attend, the booking is non-refundable";
    }

    /**
     * Returns a simplified version of the policy for UI display
     * 
     * @return String containing simplified policy text
     */
    public String getSimplifiedPolicy() {
        return "Free Cancellation: 24 hours after purchase | 7+ days before: Full refund | 3-6 days before: 50% refund | Less than 48 hours: Non-refundable";
    }

    /**
     * Calculates the refund amount based on the standardized cancellation policy
     * TODO: Implement in future refunds/cancellation sprint
     * 
     * @param bookingDate         When the booking was made
     * @param experienceStartTime When the experience is scheduled to start
     * @param totalAmount         Total amount paid for the booking
     * @param serviceFee          Service fee amount (to be subtracted from refunds)
     * @return BigDecimal representing the refund amount
     */
    public BigDecimal calculateRefundAmount(LocalDateTime bookingDate, LocalDateTime experienceStartTime,
            BigDecimal totalAmount, BigDecimal serviceFee) {
        // Placeholder for future implementation
        // This will contain the logic to calculate refunds based on the standardized
        // policy
        throw new UnsupportedOperationException("Refund calculation will be implemented in future sprint");
    }

    /**
     * Checks if the booking is within the free cancellation window (24 hours after
     * purchase)
     * TODO: Implement in future refunds/cancellation sprint
     * 
     * @param bookingDate         When the booking was made
     * @param experienceStartTime When the experience is scheduled to start
     * @return boolean indicating if free cancellation applies
     */
    public boolean isFreeCancellationWindow(LocalDateTime bookingDate, LocalDateTime experienceStartTime) {
        // Placeholder for future implementation
        LocalDateTime now = LocalDateTime.now();
        Duration timeSincePurchase = Duration.between(bookingDate, now);

        // Free cancellation within 24 hours of purchase, provided experience hasn't
        // started
        return timeSincePurchase.toHours() <= 24 && now.isBefore(experienceStartTime);
    }

    /**
     * Gets the cancellation policy category based on timing
     * TODO: Implement in future refunds/cancellation sprint
     * 
     * @param experienceStartTime When the experience is scheduled to start
     * @return String indicating the policy category
     */
    public String getCancellationCategory(LocalDateTime experienceStartTime) {
        // Placeholder for future implementation
        LocalDateTime now = LocalDateTime.now();
        Duration timeUntilExperience = Duration.between(now, experienceStartTime);
        long hoursUntil = timeUntilExperience.toHours();

        if (hoursUntil >= 168) { // 7+ days
            return "FULL_REFUND";
        } else if (hoursUntil >= 72) { // 3-6 days
            return "FIFTY_PERCENT_REFUND";
        } else if (hoursUntil >= 48) { // Less than 3 days but more than 48 hours
            return "FIFTY_PERCENT_REFUND";
        } else { // Less than 48 hours
            return "NON_REFUNDABLE";
        }
    }
}