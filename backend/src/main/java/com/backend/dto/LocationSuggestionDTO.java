package com.backend.dto;

import java.math.BigDecimal;

public class LocationSuggestionDTO {
    private String placeName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String country;

    public LocationSuggestionDTO() {}

    public LocationSuggestionDTO(String placeName, BigDecimal latitude, BigDecimal longitude, String country) {
        this.placeName = placeName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.country = country;
    }

    public String getPlaceName() {
        return placeName;
    }

    public void setPlaceName(String placeName) {
        this.placeName = placeName;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }
}