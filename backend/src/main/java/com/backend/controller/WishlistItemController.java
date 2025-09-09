package com.backend.controller;

import com.backend.entity.WishlistItem;
import com.backend.repository.WishlistItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/wishlist-items")
public class WishlistItemController {
    @Autowired
    private WishlistItemRepository wishlistItemRepository;

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
}
