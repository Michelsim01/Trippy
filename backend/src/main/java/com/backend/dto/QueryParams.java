package com.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO to hold parsed query parameters from user messages
 */
public class QueryParams {
    private String destination;
    private String departureCity;
    private Integer tripDuration;
    private BigDecimal maxBudget;
    private LocalDate startDate;

    public QueryParams() {}

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDepartureCity() {
        return departureCity;
    }

    public void setDepartureCity(String departureCity) {
        this.departureCity = departureCity;
    }

    public Integer getTripDuration() {
        return tripDuration;
    }

    public void setTripDuration(Integer tripDuration) {
        this.tripDuration = tripDuration;
    }

    public BigDecimal getMaxBudget() {
        return maxBudget;
    }

    public void setMaxBudget(BigDecimal maxBudget) {
        this.maxBudget = maxBudget;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    @Override
    public String toString() {
        return "QueryParams{" +
                "destination='" + destination + '\'' +
                ", departureCity='" + departureCity + '\'' +
                ", tripDuration=" + tripDuration +
                ", maxBudget=" + maxBudget +
                ", startDate=" + startDate +
                '}';
    }
}
