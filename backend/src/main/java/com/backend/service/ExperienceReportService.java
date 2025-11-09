package com.backend.service;

import com.backend.entity.ExperienceReport;
import com.backend.entity.ExperienceReportReason;
import com.backend.entity.ExperienceReportStatus;
import com.backend.repository.ExperienceReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExperienceReportService {

    private static final Logger logger = LoggerFactory.getLogger(ExperienceReportService.class);

    @Autowired
    private ExperienceReportRepository experienceReportRepository;

    public ExperienceReport createReport(Long reporterUserId, Long experienceId, ExperienceReportReason reason, String description) {
        // Check for duplicate report
        Optional<ExperienceReport> existingReport = experienceReportRepository.findByUserIdAndExperienceId(reporterUserId, experienceId);
        if (existingReport.isPresent()) {
            throw new IllegalArgumentException("You have already submitted a report for this experience");
        }
        
        // Create report
        ExperienceReport report = new ExperienceReport();
        report.setUserId(reporterUserId);
        report.setExperienceId(experienceId);
        report.setReason(reason);
        report.setDescription(description);
        report.setStatus(ExperienceReportStatus.OPEN);
        
        ExperienceReport saved = experienceReportRepository.save(report);
        logger.info("Created experience report {} from {} against experience {}", saved.getReportId(), reporterUserId, experienceId);
        return saved;
    }

    public List<ExperienceReport> getReportsByReporter(Long userId) {
        return experienceReportRepository.findByUserId(userId);
    }

    public List<ExperienceReport> getReportsByExperience(Long experienceId) {
        return experienceReportRepository.findByExperienceId(experienceId);
    }

    public List<ExperienceReport> getReportsByStatus(ExperienceReportStatus status) {
        return experienceReportRepository.findByStatus(status);
    }
}

