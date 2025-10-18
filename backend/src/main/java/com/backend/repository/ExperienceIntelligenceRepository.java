package com.backend.repository;

import com.backend.entity.ExperienceIntelligence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExperienceIntelligenceRepository extends JpaRepository<ExperienceIntelligence, Long> {

    /**
     * Find experiences with popularity score greater than or equal to the minimum
     * @param minScore Minimum popularity score
     * @return List of experience intelligence records
     */
    List<ExperienceIntelligence> findByPopularityScoreGreaterThanEqual(BigDecimal minScore);

    /**
     * Find experiences with sentiment score greater than or equal to the minimum
     * @param minSentiment Minimum sentiment score
     * @return List of experience intelligence records
     */
    List<ExperienceIntelligence> findBySentimentScoreGreaterThanEqual(BigDecimal minSentiment);

    /**
     * Find top experiences by recommendation weight
     * @param limit Number of experiences to return
     * @return List of top-ranked experience intelligence records
     */
    @Query("SELECT ei FROM ExperienceIntelligence ei ORDER BY ei.recommendationWeight DESC")
    List<ExperienceIntelligence> findTopByRecommendationWeight(@Param("limit") int limit);
}
