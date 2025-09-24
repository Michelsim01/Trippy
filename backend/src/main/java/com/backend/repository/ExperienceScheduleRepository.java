package com.backend.repository;

import com.backend.entity.ExperienceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExperienceScheduleRepository extends JpaRepository<ExperienceSchedule, Long> {
    void deleteByExperienceExperienceId(Long experienceId);
    List<ExperienceSchedule> findByExperience_ExperienceIdOrderByStartDateTimeAsc(Long experienceId);
    
    // Find all schedules for experiences guided by a specific user
    @Query("SELECT es FROM ExperienceSchedule es WHERE es.experience.guide.id = :guideId ORDER BY es.startDateTime ASC")
    List<ExperienceSchedule> findByGuideIdOrderByStartDateTimeAsc(@Param("guideId") Long guideId);
    
    // Find schedules for experiences guided by a specific user within date range
    @Query("SELECT es FROM ExperienceSchedule es WHERE es.experience.guide.id = :guideId AND es.startDateTime BETWEEN :startDate AND :endDate ORDER BY es.startDateTime ASC")
    List<ExperienceSchedule> findByGuideIdAndDateRangeOrderByStartDateTimeAsc(
        @Param("guideId") Long guideId, 
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
}
