package com.backend.controller;

import com.backend.entity.WishlistItem;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.repository.WishlistItemRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/wishlist-items")
public class WishlistItemController {
    @Autowired
    private WishlistItemRepository wishlistItemRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ExperienceRepository experienceRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUser(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not found");
                return ResponseEntity.badRequest().body(error);
            }
            List<WishlistItem> items = wishlistItemRepository.findByUser_Id(userId);
            List<Map<String, Object>> result = items.stream().map(item -> {
                Map<String, Object> m = new HashMap<>();
                m.put("wishlistItemId", item.getWishlistItemId());
                m.put("userId", item.getUser().getId());
                m.put("addedAt", item.getAddedAt());
                Map<String, Object> exp = new HashMap<>();
                exp.put("experienceId", item.getExperience().getExperienceId());
                exp.put("title", item.getExperience().getTitle());
                exp.put("shortDescription", item.getExperience().getShortDescription());
                exp.put("coverPhotoUrl", item.getExperience().getCoverPhotoUrl());
                exp.put("price", item.getExperience().getPrice());
                exp.put("duration", item.getExperience().getDuration());
                exp.put("location", item.getExperience().getLocation());
                exp.put("category", item.getExperience().getCategory());
                exp.put("status", item.getExperience().getStatus());
                exp.put("averageRating", item.getExperience().getAverageRating());
                exp.put("totalReviews", item.getExperience().getTotalReviews());
                exp.put("participantsAllowed", item.getExperience().getParticipantsAllowed());
                m.put("experience", exp);
                return m;
            }).toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error fetching wishlist items: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping
    public List<WishlistItem> getAllWishlistItems() {
        return wishlistItemRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWishlistItemById(@PathVariable Long id) {
        try {
            Optional<WishlistItem> wishlistItemOpt = wishlistItemRepository.findById(id);
            if (wishlistItemOpt.isPresent()) {
                return ResponseEntity.ok(wishlistItemOpt.get());
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Wishlist item not found");
                return ResponseEntity.status(404).body(error);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Error fetching wishlist item: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping
    public WishlistItem createWishlistItem(@RequestBody WishlistItem wishlistItem) {
        return wishlistItemRepository.save(wishlistItem);
    }

    @PostMapping("/user/{userId}/experience/{experienceId}")
    public ResponseEntity<Map<String, Object>> addToWishlist(@PathVariable Long userId, @PathVariable Long experienceId) {
        try {
            // Check if item already exists
            var existingItem = wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(userId, experienceId);
            if (existingItem.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Item already in wishlist");
                response.put("wishlistItemId", existingItem.get().getWishlistItemId());
                return ResponseEntity.ok(response);
            }

            // Fetch user and experience
            Optional<User> user = userRepository.findById(userId);
            Optional<Experience> experience = experienceRepository.findById(experienceId);
            
            if (user.isEmpty() || experience.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User or Experience not found");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Create new wishlist item
            WishlistItem newItem = new WishlistItem();
            newItem.setUser(user.get());
            newItem.setExperience(experience.get());
            newItem.setAddedAt(java.time.LocalDateTime.now());
            
            WishlistItem savedItem = wishlistItemRepository.save(newItem);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item added to wishlist successfully");
            response.put("wishlistItemId", savedItem.getWishlistItemId());
            response.put("userId", userId);
            response.put("experienceId", experienceId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error adding to wishlist: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public WishlistItem updateWishlistItem(@PathVariable Long id, @RequestBody WishlistItem wishlistItem) {
        wishlistItem.setWishlistItemId(id);
        return wishlistItemRepository.save(wishlistItem);
    }

    @DeleteMapping("/{id}")
    public void deleteWishlistItem(@PathVariable Long id) {
        wishlistItemRepository.deleteById(id);
    }

    @DeleteMapping("/user/{userId}/experience/{experienceId}")
    public ResponseEntity<String> deleteByUserAndExperience(@PathVariable Long userId, @PathVariable Long experienceId) {
        try {
            var wishlistItem = wishlistItemRepository.findByUser_IdAndExperience_ExperienceId(userId, experienceId);
            if (wishlistItem.isPresent()) {
                wishlistItemRepository.delete(wishlistItem.get());
                return ResponseEntity.ok("Wishlist item removed successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error removing wishlist item: " + e.getMessage());
        }
    }
}
