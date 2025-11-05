package com.backend.controller;

import com.backend.entity.UserReport;
import com.backend.entity.UserReportStatus;
import com.backend.entity.User;
import com.backend.repository.UserReportRepository;
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
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AdminReportController {

    @Autowired
    private UserReportRepository userReportRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Helper method to populate user information for reports
     */
    private void populateUserInfo(List<UserReport> reports) {
        for (UserReport report : reports) {
            // Populate reporter info
            if (report.getUserId() != null) {
                Optional<User> reporterUser = userRepository.findById(report.getUserId());
                if (reporterUser.isPresent()) {
                    User reporter = reporterUser.get();
                    report.setReporterName(reporter.getFirstName() + " " + reporter.getLastName());
                    report.setReporterEmail(reporter.getEmail());
                }
            }
            
            // Populate reported user info
            if (report.getReportedUserId() != null) {
                Optional<User> reportedUser = userRepository.findById(report.getReportedUserId());
                if (reportedUser.isPresent()) {
                    User reported = reportedUser.get();
                    report.setReportedUserName(reported.getFirstName() + " " + reported.getLastName());
                    report.setReportedUserEmail(reported.getEmail());
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
     * Get report management metrics for admin dashboard
     */
    @GetMapping("/metrics")
    public ResponseEntity<?> getReportMetrics() {
        try {
            long totalReports = userReportRepository.count();
            long openReports = userReportRepository.findByStatus(UserReportStatus.OPEN).size();
            long inProgressReports = userReportRepository.findByStatus(UserReportStatus.IN_PROGRESS).size();
            long resolvedReports = userReportRepository.findByStatus(UserReportStatus.RESOLVED).size();
            long dismissedReports = userReportRepository.findByStatus(UserReportStatus.DISMISSED).size();

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
     * Get all user reports for admin management
     */
    @GetMapping
    public ResponseEntity<?> getAllReports() {
        try {
            List<UserReport> reports = userReportRepository.findAll();
            reports.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            
            // Populate user information for reports
            populateUserInfo(reports);
            
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

            UserReportStatus status;
            try {
                status = UserReportStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
            }

            Optional<UserReport> reportOpt = userReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserReport report = reportOpt.get();
            report.setStatus(status);
            UserReport updatedReport = userReportRepository.save(report);

            return ResponseEntity.ok(updatedReport);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a user report
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<?> deleteReport(@PathVariable Long reportId) {
        try {
            Optional<UserReport> reportOpt = userReportRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            userReportRepository.deleteById(reportId);
            return ResponseEntity.ok(Map.of("message", "Report deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

