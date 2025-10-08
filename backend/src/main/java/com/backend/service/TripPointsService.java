package com.backend.service;

import com.backend.entity.TripPoints;
import com.backend.entity.User;
import com.backend.entity.TripPointsTransaction;
import com.backend.repository.TripPointsRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for handling TripPoints operations.
 * Manages points earning, redemption, and balance tracking using transaction-based approach.
 */
@Service
@Transactional
public class TripPointsService {

    @Autowired
    private TripPointsRepository tripPointsRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get current balance for a user
     */
    public Integer getPointsBalance(Long userId) {
        Integer balance = tripPointsRepository.getCurrentBalanceByUserId(userId);
        return balance != null ? balance : 0;
    }

    /**
     * Get total points earned by user
     */
    public Integer getTotalEarned(Long userId) {
        Integer earned = tripPointsRepository.getTotalEarnedByUserId(userId);
        return earned != null ? earned : 0;
    }

    /**
     * Get total points redeemed by user
     */
    public Integer getTotalRedeemed(Long userId) {
        Integer redeemed = tripPointsRepository.getTotalRedeemedByUserId(userId);
        return redeemed != null ? redeemed : 0;
    }

    /**
     * Get all TripPoints transactions for a user (for history)
     */
    public List<TripPoints> getTripPointsHistory(Long userId) {
        return tripPointsRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get latest TripPoints transaction for a user
     */
    public Optional<TripPoints> getLatestTripPoints(Long userId) {
        return tripPointsRepository.findLatestByUserId(userId);
    }

    /**
     * Award points for leaving a review
     */
    public TripPoints awardPointsForReview(Long userId, Long referenceId, Integer pointsToAward) {
        return createTransaction(userId, TripPointsTransaction.REVIEW, pointsToAward, referenceId);
    }

    /**
     * Redeem points
     */
    public TripPoints redeemPoints(Long userId, Integer pointsToRedeem) {
        if (pointsToRedeem <= 0) {
            throw new IllegalArgumentException("Points to redeem must be positive");
        }
        
        Integer currentBalance = getPointsBalance(userId);
        if (currentBalance < pointsToRedeem) {
            throw new IllegalArgumentException("Insufficient points balance");
        }
        
        return createTransaction(userId, TripPointsTransaction.REDEMPTION, -pointsToRedeem, null);
    }

    /**
     * Create a new TripPoints transaction
     */
    private TripPoints createTransaction(Long userId, TripPointsTransaction transactionType, Integer pointsChange, Long referenceId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Integer currentBalance = getPointsBalance(userId);
        Integer newBalance = currentBalance + pointsChange;
        
        TripPoints transaction = new TripPoints(user, transactionType, pointsChange, newBalance);
        transaction.setReferenceId(referenceId);
        
        return tripPointsRepository.save(transaction);
    }

    /**
     * Get all TripPoints records
     */
    public List<TripPoints> getAllTripPoints() {
        return tripPointsRepository.findAll();
    }

    /**
     * Get TripPoints by ID
     */
    public Optional<TripPoints> getTripPointsById(Long pointsId) {
        return tripPointsRepository.findById(pointsId);
    }

    /**
     * Update TripPoints
     */
    public TripPoints updateTripPoints(TripPoints tripPoints) {
        return tripPointsRepository.save(tripPoints);
    }

    /**
     * Delete TripPoints
     */
    public void deleteTripPoints(Long pointsId) {
        tripPointsRepository.deleteById(pointsId);
    }

    /**
     * Check if user has enough points for redemption
     */
    public boolean hasEnoughPoints(Long userId, Integer pointsRequired) {
        Integer currentBalance = getPointsBalance(userId);
        return currentBalance >= pointsRequired;
    }
}
