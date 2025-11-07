package com.backend.service;

import com.backend.entity.UserReport;
import com.backend.entity.UserReportReason;
import com.backend.entity.UserReportStatus;
import com.backend.repository.UserReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserReportService {

    private static final Logger logger = LoggerFactory.getLogger(UserReportService.class);

    @Autowired
    private UserReportRepository userReportRepository;

    public UserReport createReport(Long reporterUserId, Long reportedUserId, UserReportReason reason, String description) {
        // Validate: User cannot report themselves
        if (reporterUserId.equals(reportedUserId)) {
            throw new IllegalArgumentException("You cannot report yourself");
        }
        
        // Create report (similar to SupportTicket - simple create and save)
        UserReport report = new UserReport();
        report.setUserId(reporterUserId);
        report.setReportedUserId(reportedUserId);
        report.setReason(reason);
        report.setDescription(description);
        report.setStatus(UserReportStatus.OPEN);
        
        UserReport saved = userReportRepository.save(report);
        logger.info("Created user report {} from {} against {}", saved.getReportId(), reporterUserId, reportedUserId);
        return saved;
    }

    public List<UserReport> getReportsByReporter(Long userId) {
        return userReportRepository.findByUserId(userId);
    }

    public List<UserReport> getReportsAgainstUser(Long reportedUserId) {
        return userReportRepository.findByReportedUserId(reportedUserId);
    }

    public List<UserReport> getReportsByStatus(UserReportStatus status) {
        return userReportRepository.findByStatus(status);
    }
}


