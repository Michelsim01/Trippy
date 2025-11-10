package com.backend.dto;

public class TopExperienceDTO {
    private Long experienceId;
    private String name;
    private Integer bookings;
    private Double rating;
    private String category;
    private Double conversionRate;

    public TopExperienceDTO() {}

    public TopExperienceDTO(Long experienceId, String name, Integer bookings, Double rating, String category, Double conversionRate) {
        this.experienceId = experienceId;
        this.name = name;
        this.bookings = bookings;
        this.rating = rating;
        this.category = category;
        this.conversionRate = conversionRate;
    }

    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getBookings() {
        return bookings;
    }

    public void setBookings(Integer bookings) {
        this.bookings = bookings;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(Double conversionRate) {
        this.conversionRate = conversionRate;
    }
}
