package com.backend.service;

import com.backend.entity.TripPoints;
import com.backend.entity.User;
import com.backend.repository.TripPointsRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for handling TripPoints operations.
 * Manages points earning, redemption, and balance tracking.
 */
@Service
@Transactional
public class TripPointsService {

    @Autowired
    private TripPointsRepository tripPointsRepository;

    @Autowired
    private UserRepository userRepository;

    // Points policy constants
    private static final int POINTS_PER_REVIEW = 50;
    private static final int POINTS_PER_EXPERIENCE_COMPLETION = 25;

    /**
     * Get or create TripPoints for a user
     */
    public TripPoints getOrCreateTripPoints(Long userId) {
        Optional<TripPoints> existingPoints = tripPointsRepository.findByUserId(userId);
        
        if (existingPoints.isPresent()) {
            return existingPoints.get();
        }
        
        // Create new TripPoints record for user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        TripPoints newTripPoints = new TripPoints(user);
        return tripPointsRepository.save(newTripPoints);
    }

    /**
     * Get TripPoints by user ID
     */
    public Optional<TripPoints> getTripPointsByUserId(Long userId) {
        return tripPointsRepository.findByUserId(userId);
    }

    /**
     * Award points for leaving a review
     */
    public TripPoints awardPointsForReview(Long userId, Integer pointsEarned) {
        TripPoints tripPoints = getOrCreateTripPoints(userId);
        
        if (pointsEarned != null && pointsEarned > 0) {
            tripPoints.addPoints(pointsEarned);
            return tripPointsRepository.save(tripPoints);
        }
        
        return tripPoints;
    }

    /**
     * Award points for completing an experience
     */
    public TripPoints awardPointsForExperienceCompletion(Long userId) {
        TripPoints tripPoints = getOrCreateTripPoints(userId);
        tripPoints.addPoints(POINTS_PER_EXPERIENCE_COMPLETION);
        return tripPointsRepository.save(tripPoints);
    }

    /**
     * Redeem points
     */
    public boolean redeemPoints(Long userId, Integer pointsToRedeem) {
        TripPoints tripPoints = getOrCreateTripPoints(userId);
        
        if (tripPoints.redeemPoints(pointsToRedeem)) {
            tripPointsRepository.save(tripPoints);
            return true;
        }
        
        return false;
    }

    /**
     * Get current points balance for user
     */
    public Integer getPointsBalance(Long userId) {
        TripPoints tripPoints = getOrCreateTripPoints(userId);
        return tripPoints.getPointsBalance();
    }

    /**
     * Get total points earned by user
     */
    public Integer getTotalEarned(Long userId) {
        TripPoints tripPoints = getOrCreateTripPoints(userId);
        return tripPoints.getTotalEarned();
    }

    /**
     * Get total points redeemed by user
     */
    public Integer getTotalRedeemed(Long userId) {
        TripPoints tripPoints = getOrCreateTripPoints(userId);
        return tripPoints.getTotalRedeemed();
    }

    /**
     * Get all TripPoints records
     */
    public List<TripPoints> getAllTripPoints() {
        return tripPointsRepository.findAll();
    }

    /**
     * Get TripPoints leaderboard (top earners)
     */
    public List<TripPoints> getLeaderboard() {
        return tripPointsRepository.findAllOrderByTotalEarnedDesc();
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

    /**
     * Get points policy information
     */
    public String getPointsPolicy() {
        return String.format(
            "Points Policy: %d points per review, %d points per experience completion",
            POINTS_PER_REVIEW, POINTS_PER_EXPERIENCE_COMPLETION
        );
    }
}
