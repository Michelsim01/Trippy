package com.backend.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * DTO for booking pricing calculation
 * Used for price breakdown and validation
 */
public class BookingPricingDTO {

    private BigDecimal experiencePrice;
    private Integer numberOfParticipants;
    private BigDecimal baseAmount; // experiencePrice * numberOfParticipants
    private BigDecimal serviceFeeRate; // Service fee percentage (e.g., 0.05 for 5%)
    private BigDecimal serviceFee; // Calculated service fee
    private BigDecimal totalAmount; // baseAmount + serviceFee

    // Default constructor
    public BookingPricingDTO() {
    }

    // Constructor with basic info
    public BookingPricingDTO(BigDecimal experiencePrice, Integer numberOfParticipants) {
        this.experiencePrice = experiencePrice;
        this.numberOfParticipants = numberOfParticipants;
        this.calculatePricing();
    }

    // Constructor with custom rates
    public BookingPricingDTO(BigDecimal experiencePrice, Integer numberOfParticipants,
            BigDecimal serviceFeeRate) {
        this.experiencePrice = experiencePrice;
        this.numberOfParticipants = numberOfParticipants;
        this.serviceFeeRate = serviceFeeRate;
        this.calculatePricing();
    }

    // Calculate pricing with default rates
    public void calculatePricing() {
        calculatePricing(
                this.serviceFeeRate != null ? this.serviceFeeRate : new BigDecimal("0.04") // 4% default service fee
        );
    }

    // Calculate pricing with specified rates
    public void calculatePricing(BigDecimal serviceFeeRate) {
        if (experiencePrice == null || numberOfParticipants == null) {
            return;
        }

        // Calculate base amount
        this.baseAmount = experiencePrice.multiply(new BigDecimal(numberOfParticipants));

        // Calculate service fee
        this.serviceFeeRate = serviceFeeRate;
        this.serviceFee = baseAmount.multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);

        // Calculate total
        this.totalAmount = baseAmount.add(serviceFee);
    }

    // Validation method
    public boolean validatePricing(BigDecimal submittedBaseAmount, BigDecimal submittedServiceFee,
            BigDecimal submittedTotalAmount) {
        if (baseAmount == null || serviceFee == null || totalAmount == null) {
            calculatePricing();
        }

        return baseAmount.compareTo(submittedBaseAmount) == 0 &&
                serviceFee.compareTo(submittedServiceFee) == 0 &&
                totalAmount.compareTo(submittedTotalAmount) == 0;
    }

    // Getters and Setters
    public BigDecimal getExperiencePrice() {
        return experiencePrice;
    }

    public void setExperiencePrice(BigDecimal experiencePrice) {
        this.experiencePrice = experiencePrice;
        calculatePricing();
    }

    public Integer getNumberOfParticipants() {
        return numberOfParticipants;
    }

    public void setNumberOfParticipants(Integer numberOfParticipants) {
        this.numberOfParticipants = numberOfParticipants;
        calculatePricing();
    }

    public BigDecimal getBaseAmount() {
        return baseAmount;
    }

    public void setBaseAmount(BigDecimal baseAmount) {
        this.baseAmount = baseAmount;
    }

    public BigDecimal getServiceFeeRate() {
        return serviceFeeRate;
    }

    public void setServiceFeeRate(BigDecimal serviceFeeRate) {
        this.serviceFeeRate = serviceFeeRate;
        calculatePricing();
    }

    public BigDecimal getServiceFee() {
        return serviceFee;
    }

    public void setServiceFee(BigDecimal serviceFee) {
        this.serviceFee = serviceFee;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    @Override
    public String toString() {
        return "BookingPricingDTO{" +
                "experiencePrice=" + experiencePrice +
                ", numberOfParticipants=" + numberOfParticipants +
                ", baseAmount=" + baseAmount +
                ", serviceFee=" + serviceFee +
                ", totalAmount=" + totalAmount +
                '}';
    }
}