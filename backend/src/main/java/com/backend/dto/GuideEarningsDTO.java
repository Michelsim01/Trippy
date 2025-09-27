package com.backend.dto;

import java.math.BigDecimal;

public class GuideEarningsDTO {
    private BigDecimal totalEarnings;
    private BigDecimal pendingEarnings;
    private BigDecimal paidOutEarnings;
    private Integer totalBookings;
    private Integer pendingBookings;
    private Integer completedBookings;

    public GuideEarningsDTO() {}

    public GuideEarningsDTO(BigDecimal totalEarnings, BigDecimal pendingEarnings, BigDecimal paidOutEarnings,
                           Integer totalBookings, Integer pendingBookings, Integer completedBookings) {
        this.totalEarnings = totalEarnings;
        this.pendingEarnings = pendingEarnings;
        this.paidOutEarnings = paidOutEarnings;
        this.totalBookings = totalBookings;
        this.pendingBookings = pendingBookings;
        this.completedBookings = completedBookings;
    }

    public BigDecimal getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(BigDecimal totalEarnings) { this.totalEarnings = totalEarnings; }

    public BigDecimal getPendingEarnings() { return pendingEarnings; }
    public void setPendingEarnings(BigDecimal pendingEarnings) { this.pendingEarnings = pendingEarnings; }

    public BigDecimal getPaidOutEarnings() { return paidOutEarnings; }
    public void setPaidOutEarnings(BigDecimal paidOutEarnings) { this.paidOutEarnings = paidOutEarnings; }

    public Integer getTotalBookings() { return totalBookings; }
    public void setTotalBookings(Integer totalBookings) { this.totalBookings = totalBookings; }

    public Integer getPendingBookings() { return pendingBookings; }
    public void setPendingBookings(Integer pendingBookings) { this.pendingBookings = pendingBookings; }

    public Integer getCompletedBookings() { return completedBookings; }
    public void setCompletedBookings(Integer completedBookings) { this.completedBookings = completedBookings; }
}