package com.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CancellationPolicyServiceTest {

    @InjectMocks
    private CancellationPolicyService cancellationPolicyService;

    @Test
    void testGetStandardizedPolicy_ReturnsCompletePolicy() {
        // Act
        String policy = cancellationPolicyService.getStandardizedPolicy();

        // Assert
        assertNotNull(policy);
        assertTrue(policy.contains("Free Cancellation Window"));
        assertTrue(policy.contains("24 hours of purchase"));
        assertTrue(policy.contains("7+ days before"));
        assertTrue(policy.contains("3-6 days before"));
        assertTrue(policy.contains("Less than 48 hours"));
        assertTrue(policy.contains("Non-refundable"));
    }

    @Test
    void testGetSimplifiedPolicy_ReturnsSimplifiedText() {
        // Act
        String policy = cancellationPolicyService.getSimplifiedPolicy();

        // Assert
        assertNotNull(policy);
        assertTrue(policy.contains("Free Cancellation: 24 hours"));
        assertTrue(policy.contains("7+ days before: Full refund"));
        assertTrue(policy.contains("3-6 days before: 50% refund"));
        assertTrue(policy.contains("Less than 48 hours: Non-refundable"));
        // Should be a single line format
        assertFalse(policy.contains("\n"));
    }

    @Test
    void testIsFreeCancellationWindow_WithinWindow_ReturnsTrue() {
        // Arrange
        LocalDateTime bookingDate = LocalDateTime.now().minusHours(12); // 12 hours ago
        LocalDateTime experienceStartTime = LocalDateTime.now().plusDays(2); // 2 days from now

        // Act
        boolean result = cancellationPolicyService.isFreeCancellationWindow(bookingDate, experienceStartTime);

        // Assert
        assertTrue(result);
    }

    @Test
    void testIsFreeCancellationWindow_OutsideWindow_ReturnsFalse() {
        // Arrange
        LocalDateTime bookingDate = LocalDateTime.now().minusHours(30); // 30 hours ago (beyond 24 hours)
        LocalDateTime experienceStartTime = LocalDateTime.now().plusDays(2); // 2 days from now

        // Act
        boolean result = cancellationPolicyService.isFreeCancellationWindow(bookingDate, experienceStartTime);

        // Assert
        assertFalse(result);
    }

    @Test
    void testGetCancellationCategory_SevenDaysOrMore_ReturnsFullRefund() {
        // Arrange
        LocalDateTime experienceStartTime = LocalDateTime.now().plusDays(10); // 10 days from now

        // Act
        String category = cancellationPolicyService.getCancellationCategory(experienceStartTime);

        // Assert
        assertEquals("FULL_REFUND", category);
    }

    @Test
    void testGetCancellationCategory_ThreeToSixDays_ReturnsFiftyPercentRefund() {
        // Arrange
        LocalDateTime experienceStartTime = LocalDateTime.now().plusDays(4); // 4 days from now

        // Act
        String category = cancellationPolicyService.getCancellationCategory(experienceStartTime);

        // Assert
        assertEquals("FIFTY_PERCENT_REFUND", category);
    }

    @Test
    void testGetCancellationCategory_LessThanFortyEightHours_ReturnsNonRefundable() {
        // Arrange
        LocalDateTime experienceStartTime = LocalDateTime.now().plusHours(24); // 24 hours from now

        // Act
        String category = cancellationPolicyService.getCancellationCategory(experienceStartTime);

        // Assert
        assertEquals("NON_REFUNDABLE", category);
    }
}