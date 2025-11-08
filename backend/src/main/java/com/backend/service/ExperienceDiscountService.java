package com.backend.service;

import com.backend.dto.PriceUpdateValidationDTO;
import com.backend.entity.Experience;
import com.backend.entity.Notification;
import com.backend.entity.NotificationType;
import com.backend.entity.WishlistItem;
import com.backend.repository.NotificationRepository;
import com.backend.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service for handling experience discount logic
 * Includes price validation, discount calculation, and wishlist notifications
 */
@Service
public class ExperienceDiscountService {

    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Validate price update and return warnings
     * 
     * @param experience Current experience
     * @param newPrice New price being set
     * @return PriceUpdateValidationDTO with warnings
     */
    public PriceUpdateValidationDTO validatePriceUpdate(Experience experience, BigDecimal newPrice) {
        PriceUpdateValidationDTO validation = new PriceUpdateValidationDTO();

        // Warning 1: Price changed in last 7 days
        if (experience.getLastPriceUpdate() != null) {
            long daysSinceLastUpdate = ChronoUnit.DAYS.between(
                experience.getLastPriceUpdate(),
                LocalDateTime.now()
            );
            
            if (daysSinceLastUpdate < 7) {
                validation.addWarning(
                    "⚠️ You recently updated the price " + daysSinceLastUpdate + " day(s) ago. " +
                    "Frequent price changes may affect customer trust."
                );
            }
        }

        // Warning 2: Discount >= 50%
        if (experience.getOriginalPrice() != null && newPrice.compareTo(experience.getOriginalPrice()) < 0) {
            BigDecimal discountPercent = calculateDiscountPercentage(experience.getOriginalPrice(), newPrice);
            
            if (discountPercent.compareTo(new BigDecimal("50")) >= 0) {
                validation.addWarning(
                    "⚠️ This is a large discount of " + discountPercent.setScale(0, RoundingMode.HALF_UP) + "%. " +
                    "Please ensure this pricing is sustainable."
                );
            }
        }

        // Warning 3: Price < $10
        if (newPrice.compareTo(new BigDecimal("10")) < 0) {
            validation.addWarning(
                "⚠️ The new price ($" + newPrice + ") is very low. " +
                "This may undervalue your experience."
            );
        }

        return validation;
    }

    /**
     * Calculate discount percentage from original to new price
     * 
     * @param originalPrice Original price
     * @param newPrice New price
     * @return Discount percentage (0-100), or 0 if price increased/equal
     */
    public BigDecimal calculateDiscountPercentage(BigDecimal originalPrice, BigDecimal newPrice) {
        if (originalPrice == null || originalPrice.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        // If new price >= original price, no discount
        if (newPrice.compareTo(originalPrice) >= 0) {
            return BigDecimal.ZERO;
        }

        // Calculate discount: (originalPrice - newPrice) / originalPrice * 100
        BigDecimal discount = originalPrice.subtract(newPrice);
        return discount.divide(originalPrice, 4, RoundingMode.HALF_UP)
                      .multiply(new BigDecimal("100"))
                      .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Update experience discount fields based on price change
     * 
     * @param experience Experience to update
     * @param newPrice New price
     */
    public void updateDiscountFields(Experience experience, BigDecimal newPrice) {
        // Set original price if not already set (first time setting price)
        if (experience.getOriginalPrice() == null) {
            experience.setOriginalPrice(newPrice);
            experience.setDiscountPercentage(BigDecimal.ZERO);
        } else {
            // Calculate discount percentage based on original price
            // Original price NEVER changes after being set
            BigDecimal discountPercent = calculateDiscountPercentage(experience.getOriginalPrice(), newPrice);
            experience.setDiscountPercentage(discountPercent);
        }

        // Update current price and timestamp
        experience.setPrice(newPrice);
        experience.setLastPriceUpdate(LocalDateTime.now());
    }

    /**
     * Send notifications to wishlist users if discount >= 10%
     * 
     * @param experience Experience with updated discount
     */
    @Transactional
    public void notifyWishlistUsers(Experience experience) {
        // Only notify if discount is >= 10%
        if (experience.getDiscountPercentage() == null || 
            experience.getDiscountPercentage().compareTo(new BigDecimal("10")) < 0) {
            return;
        }

        // Find all users who wishlisted this experience
        List<WishlistItem> wishlistItems = wishlistItemRepository
            .findByExperience_ExperienceId(experience.getExperienceId());

        if (wishlistItems.isEmpty()) {
            return;
        }

        // Create notifications for all wishlist users
        LocalDateTime now = LocalDateTime.now();
        int discountInt = experience.getDiscountPercentage().setScale(0, RoundingMode.HALF_UP).intValue();

        for (WishlistItem item : wishlistItems) {
            Notification notification = new Notification();
            notification.setUser(item.getUser());
            notification.setType(NotificationType.DISCOUNT);
            notification.setTitle("Price Drop Alert! 🎉");
            notification.setMessage(
                experience.getTitle() + " is now " + discountInt + "% off! " +
                "Don't miss this special offer."
            );
            notification.setIsRead(false);
            notification.setCreatedAt(now);
            notification.setSentAt(now);

            notificationRepository.save(notification);
        }
    }

    /**
     * Check if discount is significant enough to show badge (>= 10%)
     * 
     * @param discountPercentage Discount percentage
     * @return true if should show discount badge
     */
    public boolean shouldShowDiscount(BigDecimal discountPercentage) {
        return discountPercentage != null && 
               discountPercentage.compareTo(new BigDecimal("10")) >= 0;
    }
}
