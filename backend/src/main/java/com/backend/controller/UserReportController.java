package com.backend.controller;

import com.backend.entity.UserReport;
import com.backend.entity.UserReportReason;
import com.backend.entity.UserReportStatus;
import com.backend.service.UserReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class UserReportController {

    private static final Logger logger = LoggerFactory.getLogger(UserReportController.class);

    @Autowired
    private UserReportService userReportService;

    @PostMapping
    public ResponseEntity<?> createReport(
            @RequestHeader(value = "User-ID", required = false) Long reporterUserId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            // Extract fields from request body (similar to SupportTicket)
            Object reportedUserIdObj = body.get("reportedUserId");
            Object reasonObj = body.get("reason");
            Object descriptionObj = body.get("description");

            // Debug logging
            System.out.println("=== DEBUG: createReport called ===");
            System.out.println("Reporter User ID: " + reporterUserId);
            System.out.println("Reported User ID: " + reportedUserIdObj);
            System.out.println("Reason: " + reasonObj);
            System.out.println("Description: " + descriptionObj);

            // Validate required fields
            if (reporterUserId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User-ID header is required"));
            }

            if (reportedUserIdObj == null || reasonObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "reportedUserId and reason are required"));
            }

            Long reportedUserId;
            try {
                reportedUserId = Long.valueOf(reportedUserIdObj.toString());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid reportedUserId"));
            }

            // Validate: User cannot report themselves
            if (reporterUserId.equals(reportedUserId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "You cannot report yourself"));
            }

            String reasonStr = reasonObj.toString();
            String description = descriptionObj != null ? descriptionObj.toString() : null;

            UserReportReason reason;
            try {
                reason = UserReportReason.valueOf(reasonStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid reason: " + reasonStr));
            }

            System.out.println("Creating user report: reporter=" + reporterUserId + ", reported=" + reportedUserId + ", reason=" + reason);

            // Create and save report (similar to SupportTicket)
            UserReport report = userReportService.createReport(reporterUserId, reportedUserId, reason, description);
            
            System.out.println("Report saved with ID: " + report.getReportId());
            return ResponseEntity.ok(Map.of("message", "Report created successfully", "reportId", report.getReportId(), "success", true));
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid report request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating user report: {}", e.getMessage(), e);
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create report: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<UserReport>> myReports(@RequestHeader("User-ID") Long userId) {
        return ResponseEntity.ok(userReportService.getReportsByReporter(userId));
    }

    @GetMapping("/against/{userId}")
    public ResponseEntity<List<UserReport>> reportsAgainst(@PathVariable("userId") Long reportedUserId) {
        return ResponseEntity.ok(userReportService.getReportsAgainstUser(reportedUserId));
    }

    @GetMapping
    public ResponseEntity<List<UserReport>> byStatus(@RequestParam(value = "status", required = false) UserReportStatus status) {
        if (status == null) {
            return ResponseEntity.ok(userReportService.getReportsByStatus(UserReportStatus.OPEN));
        }
        return ResponseEntity.ok(userReportService.getReportsByStatus(status));
    }
}


