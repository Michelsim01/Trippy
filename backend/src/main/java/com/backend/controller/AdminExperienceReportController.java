package com.backend.controller;

import com.backend.entity.ExperienceReport;
import com.backend.entity.ExperienceReportStatus;
import com.backend.entity.Experience;
import com.backend.entity.User;
import com.backend.repository.ExperienceReportRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/experience-reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AdminExperienceReportController {

    @Autowired
    private ExperienceReportRepository experienceReportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    /**
     * Helper method to populate user and experience information for reports
     */
    private void populateReportInfo(List<ExperienceReport> reports) {
        for (ExperienceReport report : reports) {
            // Populate reporter info
            if (report.getUserId() != null) {
                Optional<User> reporterUser = userRepository.findById(report.getUserId());
                if (reporterUser.isPresent()) {
                    User reporter = reporterUser.get();
                    report.setReporterName(reporter.getFirstName() + " " + reporter.getLastName());
                    report.setReporterEmail(reporter.getEmail());
                }
            }
            
            // Populate experience info
            if (report.getExperienceId() != null) {
                Optional<Experience> experience = experienceRepository.findById(report.getExperienceId());
                if (experience.isPresent()) {
                    Experience exp = experience.get();
                    report.setExperienceTitle(exp.getTitle());
                }
            }
        }
    }

    /**
     * Helper method to get the currently authenticated admin user ID
     */
    private Long getCurrentAdminUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                    org.springframework.security.core.userdetails.UserDetails userDetails = 
                        (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
                    String email = userDetails.getUsername();
                    Optional<User> userOpt = userRepository.findByEmailAndIsActive(email, true);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        if (user.getIsAdmin()) {
                            return user.getId();
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error getting authenticated admin user: " + e.getMessage());
        }
        return null;
    }

    /**
     * Get experience report management metrics for admin dashboard
     */
    @GetMapping("/metrics")
    public ResponseEntity<?> getReportMetrics() {
        try {
            long totalReports = experienceReportRepository.count();
            long openReports = experienceReportRepository.findByStatus(ExperienceReportStatus.OPEN).size();
            long inProgressReports = experienceReportRepository.findByStatus(ExperienceReportStatus.IN_PROGRESS).size();
            long resolvedReports = experienceReportRepository.findByStatus(ExperienceReportStatus.RESOLVED).size();
            long dismissedReports = experienceReportRepository.findByStatus(ExperienceReportStatus.DISMISSED).size();

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalReports", totalReports);
            metrics.put("openReports", openReports);
            metrics.put("inProgressReports", inProgressReports);
            metrics.put("resolvedReports", resolvedReports);
            metrics.put("dismissedReports", dismissedReports);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all experience reports for admin management
     */
    @GetMapping
    public ResponseEntity<?> getAllReports() {
        try {
            List<ExperienceReport> reports = experienceReportRepository.findAll();
            reports.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            
            // Populate user and experience information for reports
            populateReportInfo(reports);
            
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            System.err.println("Error in getAllReports: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update report status
     */
    @PutMapping("/{reportId}/status")
    public ResponseEntity<?> updateReportStatus(@PathVariable Long reportId, @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }

            ExperienceReportStatus status;
            try {
                status = ExperienceReportStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
            }

            Optional<ExperienceReport> reportOpt = experienceReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ExperienceReport report = reportOpt.get();
            report.setStatus(status);
            ExperienceReport updatedReport = experienceReportRepository.save(report);

            return ResponseEntity.ok(updatedReport);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete an experience report
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<?> deleteReport(@PathVariable Long reportId) {
        try {
            Optional<ExperienceReport> reportOpt = experienceReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            experienceReportRepository.deleteById(reportId);
            return ResponseEntity.ok(Map.of("message", "Report deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

