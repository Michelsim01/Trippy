package com.backend.controller;

import com.backend.entity.WishlistItem;
import com.backend.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/wishlist-items")
public class WishlistItemController {
    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getByUser(@PathVariable Long userId) {
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
            m.put("experience", exp);
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public List<WishlistItem> getAllWishlistItems() {
        return wishlistItemRepository.findAll();
    }

    @GetMapping("/{id}")
    public WishlistItem getWishlistItemById(@PathVariable Long id) {
        return wishlistItemRepository.findById(id).orElse(null);
    }

    @PostMapping
    public WishlistItem createWishlistItem(@RequestBody WishlistItem wishlistItem) {
        return wishlistItemRepository.save(wishlistItem);
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
