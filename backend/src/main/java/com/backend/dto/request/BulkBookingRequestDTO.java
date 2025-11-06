package com.backend.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for creating multiple bookings from cart items in a single checkout flow
 * Contains shared contact information and cart item IDs
 * Booking details (schedule, participants, pricing) are extracted from cart items on backend
 */
public class BulkBookingRequestDTO {

    // Cart Items to Checkout
    @NotEmpty(message = "Cart item IDs are required")
    private List<Long> cartItemIds;

    // Contact Information (from checkout contact page, shared across all bookings)
    @NotBlank(message = "Contact first name is required")
    @Size(max = 50, message = "Contact first name must not exceed 50 characters")
    private String contactFirstName;

    @NotBlank(message = "Contact last name is required")
    @Size(max = 50, message = "Contact last name must not exceed 50 characters")
    private String contactLastName;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Contact email must be valid")
    @Size(max = 100, message = "Contact email must not exceed 100 characters")
    private String contactEmail;

    @NotBlank(message = "Contact phone is required")
    @Size(max = 20, message = "Contact phone must not exceed 20 characters")
    private String contactPhone;

    // Trippoints Redemption (optional, distributed proportionally across bookings)
    @DecimalMin(value = "0.0", message = "Trippoints discount must be non-negative")
    private BigDecimal trippointsDiscount;

    // Default constructor
    public BulkBookingRequestDTO() {
    }

    // Constructor with required fields
    public BulkBookingRequestDTO(List<Long> cartItemIds,
            String contactFirstName, String contactLastName,
            String contactEmail, String contactPhone,
            BigDecimal trippointsDiscount) {
        this.cartItemIds = cartItemIds;
        this.contactFirstName = contactFirstName;
        this.contactLastName = contactLastName;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.trippointsDiscount = trippointsDiscount;
    }

    // Getters and Setters
    public List<Long> getCartItemIds() {
        return cartItemIds;
    }

    public void setCartItemIds(List<Long> cartItemIds) {
        this.cartItemIds = cartItemIds;
    }

    public String getContactFirstName() {
        return contactFirstName;
    }

    public void setContactFirstName(String contactFirstName) {
        this.contactFirstName = contactFirstName;
    }

    public String getContactLastName() {
        return contactLastName;
    }

    public void setContactLastName(String contactLastName) {
        this.contactLastName = contactLastName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public BigDecimal getTrippointsDiscount() {
        return trippointsDiscount;
    }

    public void setTrippointsDiscount(BigDecimal trippointsDiscount) {
        this.trippointsDiscount = trippointsDiscount;
    }

    @Override
    public String toString() {
        return "BulkBookingRequestDTO{" +
                "cartItemIds=" + cartItemIds +
                ", contactFirstName='" + contactFirstName + '\'' +
                ", contactLastName='" + contactLastName + '\'' +
                ", contactEmail='" + contactEmail + '\'' +
                ", contactPhone='" + contactPhone + '\'' +
                ", trippointsDiscount=" + trippointsDiscount +
                '}';
    }
}
