package com.backend.repository;

import com.backend.entity.ExperienceMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ExperienceMediaRepository extends JpaRepository<ExperienceMedia, Long> {

    @Modifying
    @Transactional
    @Query("DELETE FROM ExperienceMedia em WHERE em.experience.experienceId = :experienceId")
    void deleteByExperienceId(@Param("experienceId") Long experienceId);
}
