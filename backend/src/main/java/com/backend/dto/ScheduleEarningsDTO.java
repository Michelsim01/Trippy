package com.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ScheduleEarningsDTO {
    private Long scheduleId;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Integer bookingCount;
    private Integer totalGuests;
    private BigDecimal potentialEarnings;
    private String status; // Derived from booking statuses

    public ScheduleEarningsDTO() {}

    public ScheduleEarningsDTO(Long scheduleId, LocalDateTime startDateTime, LocalDateTime endDateTime,
                              Integer bookingCount, Integer totalGuests, BigDecimal potentialEarnings, String status) {
        this.scheduleId = scheduleId;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.bookingCount = bookingCount;
        this.totalGuests = totalGuests;
        this.potentialEarnings = potentialEarnings;
        this.status = status;
    }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }

    public LocalDateTime getEndDateTime() { return endDateTime; }
    public void setEndDateTime(LocalDateTime endDateTime) { this.endDateTime = endDateTime; }

    public Integer getBookingCount() { return bookingCount; }
    public void setBookingCount(Integer bookingCount) { this.bookingCount = bookingCount; }

    public Integer getTotalGuests() { return totalGuests; }
    public void setTotalGuests(Integer totalGuests) { this.totalGuests = totalGuests; }

    public BigDecimal getPotentialEarnings() { return potentialEarnings; }
    public void setPotentialEarnings(BigDecimal potentialEarnings) { this.potentialEarnings = potentialEarnings; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}