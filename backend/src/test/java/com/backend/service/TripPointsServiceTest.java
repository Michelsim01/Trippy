package com.backend.service;

import com.backend.entity.TripPoints;
import com.backend.entity.TripPointsTransaction;
import com.backend.entity.User;
import com.backend.repository.TripPointsRepository;
import com.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripPointsServiceTest {

    @Mock(lenient = true)
    private TripPointsRepository tripPointsRepository;

    @Mock(lenient = true)
    private UserRepository userRepository;

    @InjectMocks
    private TripPointsService tripPointsService;

    private User testUser;
    private TripPoints testTripPoints;

    @BeforeEach
    void setUp() {
        testUser = createTestUser(1L, "test@example.com");
        testTripPoints = createTestTripPoints(1L, testUser, 100, 100);
    }

    @Test
    void testGetPointsBalance_ExistingUser_ReturnsCurrentBalance() {
        // Arrange
        Long userId = 1L;
        Integer expectedBalance = 150;
        testUser.setTripPoints(expectedBalance);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act
        Integer result = tripPointsService.getPointsBalance(userId);

        // Assert
        assertEquals(expectedBalance, result);
        verify(userRepository).findById(userId);
    }

    @Test
    void testGetPointsBalance_NoBalance_ReturnsZero() {
        // Arrange
        Long userId = 1L;
        testUser.setTripPoints(null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act
        Integer result = tripPointsService.getPointsBalance(userId);

        // Assert
        assertEquals(0, result);
        verify(userRepository).findById(userId);
    }

    @Test
    void testGetTotalEarned_ExistingUser_ReturnsTotalEarned() {
        // Arrange
        Long userId = 1L;
        Integer expectedEarned = 500;
        when(tripPointsRepository.getTotalEarnedByUserId(userId)).thenReturn(expectedEarned);

        // Act
        Integer result = tripPointsService.getTotalEarned(userId);

        // Assert
        assertEquals(expectedEarned, result);
        verify(tripPointsRepository).getTotalEarnedByUserId(userId);
    }

    @Test
    void testAwardPointsForReview_ValidInput_CreatesPointsTransaction() {
        // Arrange
        Long userId = 1L;
        Long referenceId = 10L;
        Integer pointsToAward = 50;
        Integer currentBalance = 100;
        
        testUser.setTripPoints(currentBalance);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(tripPointsRepository.save(any(TripPoints.class))).thenReturn(testTripPoints);

        // Act
        TripPoints result = tripPointsService.awardPointsForReview(userId, referenceId, pointsToAward);

        // Assert
        assertNotNull(result);
        verify(userRepository).findById(userId);
        verify(tripPointsRepository).save(any(TripPoints.class));
    }

    @Test
    void testRedeemPoints_ValidRedemption_CreatesRedemptionTransaction() {
        // Arrange
        Long userId = 1L;
        Integer pointsToRedeem = 50;
        Integer currentBalance = 100;
        
        testUser.setTripPoints(currentBalance);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(tripPointsRepository.getCurrentBalanceByUserId(userId)).thenReturn(currentBalance);
        when(tripPointsRepository.save(any(TripPoints.class))).thenReturn(testTripPoints);

        // Act
        TripPoints result = tripPointsService.redeemPoints(userId, pointsToRedeem);

        // Assert
        assertNotNull(result);
        verify(userRepository, times(2)).findById(userId); // Called in redeemPoints and createTransaction
        verify(tripPointsRepository).save(any(TripPoints.class));
    }

    @Test
    void testRedeemPoints_InsufficientBalance_ThrowsException() {
        // Arrange
        Long userId = 1L;
        Integer pointsToRedeem = 150;
        Integer currentBalance = 100; // Less than points to redeem
        
        testUser.setTripPoints(currentBalance);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> tripPointsService.redeemPoints(userId, pointsToRedeem));
        assertEquals("Insufficient points balance", exception.getMessage());
        verify(userRepository).findById(userId);
        verify(tripPointsRepository, never()).save(any());
    }

    @Test
    void testRedeemPoints_NegativePoints_ThrowsException() {
        // Arrange
        Long userId = 1L;
        Integer pointsToRedeem = -10;

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> tripPointsService.redeemPoints(userId, pointsToRedeem));
        assertEquals("Points to redeem must be positive", exception.getMessage());
        verify(tripPointsRepository, never()).save(any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void testGetTripPointsHistory_ValidUser_ReturnsHistory() {
        // Arrange
        Long userId = 1L;
        List<TripPoints> expectedHistory = Arrays.asList(testTripPoints);
        when(tripPointsRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(expectedHistory);

        // Act
        List<TripPoints> result = tripPointsService.getTripPointsHistory(userId);

        // Assert
        assertEquals(expectedHistory, result);
        verify(tripPointsRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void testHasEnoughPoints_SufficientPoints_ReturnsTrue() {
        // Arrange
        Long userId = 1L;
        Integer pointsRequired = 50;
        Integer currentBalance = 100;
        
        testUser.setTripPoints(currentBalance);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = tripPointsService.hasEnoughPoints(userId, pointsRequired);

        // Assert
        assertTrue(result);
        verify(userRepository).findById(userId);
    }

    @Test
    void testHasEnoughPoints_InsufficientPoints_ReturnsFalse() {
        // Arrange
        Long userId = 1L;
        Integer pointsRequired = 150;
        Integer currentBalance = 100;
        
        testUser.setTripPoints(currentBalance);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = tripPointsService.hasEnoughPoints(userId, pointsRequired);

        // Assert
        assertFalse(result);
        verify(userRepository).findById(userId);
    }

    // Helper methods
    private User createTestUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        return user;
    }

    private TripPoints createTestTripPoints(Long id, User user, Integer pointsChange, Integer newBalance) {
        TripPoints tripPoints = new TripPoints();
        tripPoints.setPointsId(id);
        tripPoints.setUser(user);
        tripPoints.setTransactionType(TripPointsTransaction.REVIEW);
        tripPoints.setPointsChange(pointsChange);
        tripPoints.setPointsBalanceAfter(newBalance);
        return tripPoints;
    }
}