package com.backend.controller;

import com.backend.dto.CartItemDTO;
import com.backend.dto.request.AddToCartRequest;
import com.backend.dto.request.UpdateCartItemRequest;
import com.backend.entity.CartItem;
import com.backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    /**
     * Add an item to the cart or update if it already exists
     *
     * @param request AddToCartRequest with userId, scheduleId, and numberOfParticipants
     * @return CartItemDTO of the created/updated cart item
     */
    @PostMapping("/items")
    public ResponseEntity<?> addToCart(@Valid @RequestBody AddToCartRequest request) {
        try {
            CartItem cartItem = cartService.addToCart(
                    request.getUserId(),
                    request.getScheduleId(),
                    request.getNumberOfParticipants()
            );

            CartItemDTO dto = new CartItemDTO(cartItem);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item added to cart successfully");
            response.put("cartItem", dto);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all cart items for a user
     *
     * @param userId ID of the user
     * @return List of CartItemDTO
     */
    @GetMapping("/items/user/{userId}")
    public ResponseEntity<?> getUserCart(@PathVariable Long userId) {
        try {
            List<CartItem> cartItems = cartService.getUserCart(userId);

            // Convert to DTOs
            List<CartItemDTO> cartItemDTOs = cartItems.stream()
                    .map(CartItemDTO::new)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("cartItems", cartItemDTOs);
            response.put("count", cartItemDTOs.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update a cart item's participant count
     *
     * @param cartItemId ID of the cart item
     * @param request UpdateCartItemRequest with userId and numberOfParticipants
     * @return Updated CartItemDTO
     */
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<?> updateCartItem(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        try {
            CartItem cartItem = cartService.updateCartItem(
                    cartItemId,
                    request.getNumberOfParticipants(),
                    request.getUserId()
            );

            CartItemDTO dto = new CartItemDTO(cartItem);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cart item updated successfully");
            response.put("cartItem", dto);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Remove a cart item
     *
     * @param cartItemId ID of the cart item to remove
     * @param userId ID of the user (from request param for authorization)
     * @return Success message
     */
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<?> removeCartItem(
            @PathVariable Long cartItemId,
            @RequestParam Long userId) {
        try {
            cartService.removeCartItem(cartItemId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cart item removed successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Remove multiple cart items (bulk deletion for checkout)
     *
     * @param userId ID of the user (for authorization)
     * @param cartItemIds List of cart item IDs to remove
     * @return Success message
     */
    @DeleteMapping("/items/bulk")
    public ResponseEntity<?> removeMultipleCartItems(
            @RequestParam Long userId,
            @RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> cartItemIds = request.get("cartItemIds");

            if (cartItemIds == null || cartItemIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cart item IDs are required"));
            }

            cartService.removeMultipleCartItems(userId, cartItemIds);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cart items removed successfully");
            response.put("count", cartItemIds.size());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Clear all items from a user's cart
     *
     * @param userId ID of the user
     * @return Success message
     */
    @DeleteMapping("/items/user/{userId}/clear")
    public ResponseEntity<?> clearCart(@PathVariable Long userId) {
        try {
            cartService.clearUserCart(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cart cleared successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get the count of items in a user's cart
     *
     * @param userId ID of the user
     * @return Cart count
     */
    @GetMapping("/items/user/{userId}/count")
    public ResponseEntity<?> getCartCount(@PathVariable Long userId) {
        try {
            long count = cartService.getCartCount(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("count", count);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
