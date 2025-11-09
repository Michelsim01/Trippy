package com.backend.repository;

import com.backend.entity.ExperienceReport;
import com.backend.entity.ExperienceReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperienceReportRepository extends JpaRepository<ExperienceReport, Long> {
    List<ExperienceReport> findByUserId(Long userId);
    List<ExperienceReport> findByExperienceId(Long experienceId);
    List<ExperienceReport> findByStatus(ExperienceReportStatus status);
    Optional<ExperienceReport> findByUserIdAndExperienceId(Long userId, Long experienceId);
}

