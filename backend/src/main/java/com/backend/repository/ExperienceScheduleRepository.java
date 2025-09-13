package com.backend.repository;

import com.backend.entity.ExperienceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExperienceScheduleRepository extends JpaRepository<ExperienceSchedule, Long> {
    List<ExperienceSchedule> findByExperience_ExperienceId(Long experienceId);
}
