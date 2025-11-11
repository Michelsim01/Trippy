package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.CartItemRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Add an item to the user's cart with validation.
     * If the schedule is already in cart, update the participants count instead.
     *
     * @param userId ID of the user
     * @param scheduleId ID of the experience schedule
     * @param numberOfParticipants Number of participants
     * @return CartItem that was created or updated
     * @throws IllegalArgumentException if validation fails
     */
    @Transactional
    public CartItem addToCart(Long userId, Long scheduleId, Integer numberOfParticipants) {
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate experience schedule exists
        ExperienceSchedule schedule = experienceScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Experience schedule not found"));

        Experience experience = schedule.getExperience();

        // Validation 1: Experience must be ACTIVE
        if (experience.getStatus() != ExperienceStatus.ACTIVE) {
            throw new IllegalArgumentException("This experience is not currently available");
        }

        // Validation 2: Schedule must be in the future
        if (schedule.getStartDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot add past experiences to cart");
        }

        // Validation 3: Schedule must not be cancelled
        if (schedule.getCancelled() != null && schedule.getCancelled()) {
            throw new IllegalArgumentException("This schedule has been cancelled");
        }

        // Validation 4: User cannot add their own experience to cart
        if (experience.getGuide() != null && experience.getGuide().getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot add your own experience to cart");
        }

        // Validation 5: Check available spots
        if (schedule.getAvailableSpots() < numberOfParticipants) {
            throw new IllegalArgumentException(
                    "Not enough spots available. Available: " + schedule.getAvailableSpots()
                    + ", Requested: " + numberOfParticipants);
        }

        // Validation 6: Number of participants must be positive
        if (numberOfParticipants <= 0) {
            throw new IllegalArgumentException("Number of participants must be at least 1");
        }

        // Check if schedule already in cart - if yes, update participants
        Optional<CartItem> existingCartItem = cartItemRepository
                .findByUser_IdAndExperienceSchedule_ScheduleId(userId, scheduleId);

        if (existingCartItem.isPresent()) {
            CartItem cartItem = existingCartItem.get();

            // Re-validate spots with updated participant count
            if (schedule.getAvailableSpots() < numberOfParticipants) {
                throw new IllegalArgumentException(
                        "Not enough spots available. Available: " + schedule.getAvailableSpots()
                        + ", Requested: " + numberOfParticipants);
            }

            cartItem.setNumberOfParticipants(numberOfParticipants);
            // Update price snapshot to current price
            cartItem.setPriceAtTimeOfAdd(experience.getPrice());
            return cartItemRepository.save(cartItem);
        }

        // Create new cart item
        CartItem cartItem = new CartItem();
        cartItem.setUser(user);
        cartItem.setExperienceSchedule(schedule);
        cartItem.setNumberOfParticipants(numberOfParticipants);
        cartItem.setPriceAtTimeOfAdd(experience.getPrice()); // Snapshot current price

        return cartItemRepository.save(cartItem);
    }

    /**
     * Get all cart items for a user.
     *
     * @param userId ID of the user
     * @return List of cart items ordered by most recent first
     */
    public List<CartItem> getUserCart(Long userId) {
        return cartItemRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    /**
     * Update the number of participants for a cart item.
     *
     * @param cartItemId ID of the cart item
     * @param numberOfParticipants New number of participants
     * @param userId ID of the user (for authorization)
     * @return Updated cart item
     * @throws IllegalArgumentException if validation fails
     */
    @Transactional
    public CartItem updateCartItem(Long cartItemId, Integer numberOfParticipants, Long userId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        // Verify user owns this cart item
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized: You don't own this cart item");
        }

        // Validation: Number of participants must be positive
        if (numberOfParticipants <= 0) {
            throw new IllegalArgumentException("Number of participants must be at least 1");
        }

        // Validation: Check available spots
        ExperienceSchedule schedule = cartItem.getExperienceSchedule();
        if (schedule.getAvailableSpots() < numberOfParticipants) {
            throw new IllegalArgumentException(
                    "Not enough spots available. Available: " + schedule.getAvailableSpots()
                    + ", Requested: " + numberOfParticipants);
        }

        cartItem.setNumberOfParticipants(numberOfParticipants);
        return cartItemRepository.save(cartItem);
    }

    /**
     * Remove a cart item.
     *
     * @param cartItemId ID of the cart item to remove
     * @param userId ID of the user (for authorization)
     * @throws IllegalArgumentException if cart item not found or unauthorized
     */
    @Transactional
    public void removeCartItem(Long cartItemId, Long userId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        // Verify user owns this cart item
        if (!cartItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized: You don't own this cart item");
        }

        cartItemRepository.delete(cartItem);
    }

    /**
     * Clear all items from user's cart.
     *
     * @param userId ID of the user
     */
    @Transactional
    public void clearUserCart(Long userId) {
        cartItemRepository.deleteByUser_Id(userId);
    }

    /**
     * Get the count of items in user's cart.
     *
     * @param userId ID of the user
     * @return Number of items in cart
     */
    public long getCartCount(Long userId) {
        return cartItemRepository.countByUser_Id(userId);
    }

    /**
     * Remove multiple cart items by IDs (for bulk checkout cleanup).
     * Validates that all cart items belong to the specified user before deletion.
     *
     * @param userId ID of the user
     * @param cartItemIds List of cart item IDs to remove
     * @throws IllegalArgumentException if any cart item doesn't belong to the user
     */
    @Transactional
    public void removeMultipleCartItems(Long userId, List<Long> cartItemIds) {
        if (cartItemIds == null || cartItemIds.isEmpty()) {
            return;
        }

        // Fetch all cart items
        List<CartItem> cartItems = cartItemRepository.findAllById(cartItemIds);

        // Validate all cart items belong to the user
        for (CartItem cartItem : cartItems) {
            if (!cartItem.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException("Cart item " + cartItem.getCartItemId() +
                        " does not belong to user " + userId);
            }
        }

        // Delete all validated cart items
        cartItemRepository.deleteAll(cartItems);
    }
}
