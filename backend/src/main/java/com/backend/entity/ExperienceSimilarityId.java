package com.backend.entity;

import java.io.Serializable;
import java.util.Objects;

public class ExperienceSimilarityId implements Serializable {

    private Long experienceId;
    private Long similarExperienceId;

    // Constructors
    public ExperienceSimilarityId() {
    }

    public ExperienceSimilarityId(Long experienceId, Long similarExperienceId) {
        this.experienceId = experienceId;
        this.similarExperienceId = similarExperienceId;
    }

    // Getters and Setters
    public Long getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(Long experienceId) {
        this.experienceId = experienceId;
    }

    public Long getSimilarExperienceId() {
        return similarExperienceId;
    }

    public void setSimilarExperienceId(Long similarExperienceId) {
        this.similarExperienceId = similarExperienceId;
    }

    // equals and hashCode (required for composite key)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExperienceSimilarityId that = (ExperienceSimilarityId) o;
        return Objects.equals(experienceId, that.experienceId) &&
               Objects.equals(similarExperienceId, that.similarExperienceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(experienceId, similarExperienceId);
    }
}
