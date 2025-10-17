package com.backend.repository;

import com.backend.entity.ExperienceSimilarity;
import com.backend.entity.ExperienceSimilarityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperienceSimilarityRepository extends JpaRepository<ExperienceSimilarity, ExperienceSimilarityId> {

    /**
     * Find all similar experiences for a given experience, ordered by similarity score descending
     * @param experienceId The experience ID
     * @return List of similar experiences ordered by similarity score
     */
    List<ExperienceSimilarity> findByExperienceIdOrderBySimilarityScoreDesc(Long experienceId);

    /**
     * Find similarity between two specific experiences
     * @param expId The first experience ID
     * @param candidateId The second experience ID (similar experience)
     * @return Optional containing the similarity record if found
     */
    @Query("SELECT es FROM ExperienceSimilarity es WHERE es.experienceId = :expId AND es.similarExperienceId = :candidateId")
    Optional<ExperienceSimilarity> findSimilarityBetween(@Param("expId") Long expId, @Param("candidateId") Long candidateId);

    /**
     * Find top N similar experiences for a given experience
     * @param experienceId The experience ID
     * @param limit Maximum number of similar experiences to return
     * @return List of top similar experiences
     */
    @Query(value = "SELECT * FROM experience_similarities WHERE experience_id = :experienceId ORDER BY similarity_score DESC LIMIT :limit", nativeQuery = true)
    List<ExperienceSimilarity> findTopSimilarExperiences(@Param("experienceId") Long experienceId, @Param("limit") int limit);
}
