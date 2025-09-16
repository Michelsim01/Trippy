package com.backend.repository;

import com.backend.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    
    @Query("SELECT DISTINCT e.country FROM Experience e WHERE LOWER(e.country) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findLocationSuggestions(@Param("query") String query);
    
    @Query("SELECT e FROM Experience e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.location) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.country) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY " +
           "CASE WHEN LOWER(e.title) LIKE LOWER(CONCAT(:query, '%')) THEN 1 " +
           "     WHEN LOWER(e.country) LIKE LOWER(CONCAT(:query, '%')) THEN 2 " +
           "     WHEN LOWER(e.location) LIKE LOWER(CONCAT(:query, '%')) THEN 3 " +
           "     ELSE 4 END")
    List<Experience> findExperienceSuggestions(@Param("query") String query);
}
