package com.backend.dto;

import com.backend.entity.Experience;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SimilarExperienceDTO extends ExperienceResponseDTO {
    private BigDecimal similarityScore;
    private LocalDateTime nextAvailableDate;

    public SimilarExperienceDTO() {
        super();
    }

    // Constructor to create from Experience entity
    public SimilarExperienceDTO(Experience experience) {
        super(experience);
        // Parent class already sets originalPrice from experience.getOriginalPrice()
    }

    // Getters and setters
    public BigDecimal getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(BigDecimal similarityScore) {
        this.similarityScore = similarityScore;
    }

    public LocalDateTime getNextAvailableDate() {
        return nextAvailableDate;
    }

    public void setNextAvailableDate(LocalDateTime nextAvailableDate) {
        this.nextAvailableDate = nextAvailableDate;
    }
}
