package com.backend.repository;

import com.backend.entity.ExperienceItinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface ExperienceItineraryRepository extends JpaRepository<ExperienceItinerary, Long> {

    @Query("SELECT ei FROM ExperienceItinerary ei WHERE ei.experience.experienceId = :experienceId ORDER BY ei.stopOrder")
    List<ExperienceItinerary> findByExperienceId(@Param("experienceId") Long experienceId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ExperienceItinerary ei WHERE ei.experience.experienceId = :experienceId")
    void deleteByExperienceId(@Param("experienceId") Long experienceId);
}
