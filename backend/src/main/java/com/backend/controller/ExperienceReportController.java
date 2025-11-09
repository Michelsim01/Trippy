package com.backend.controller;

import com.backend.entity.ExperienceReport;
import com.backend.entity.ExperienceReportReason;
import com.backend.service.ExperienceReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/experience-reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ExperienceReportController {

    private static final Logger logger = LoggerFactory.getLogger(ExperienceReportController.class);

    @Autowired
    private ExperienceReportService experienceReportService;

    @PostMapping
    public ResponseEntity<?> createReport(
            @RequestHeader(value = "User-ID", required = false) Long reporterUserId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            // Extract fields from request body
            Object experienceIdObj = body.get("experienceId");
            Object reasonObj = body.get("reason");
            Object descriptionObj = body.get("description");

            // Validate required fields
            if (reporterUserId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User-ID header is required"));
            }

            if (experienceIdObj == null || reasonObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "experienceId and reason are required"));
            }

            Long experienceId;
            try {
                experienceId = Long.valueOf(experienceIdObj.toString());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid experienceId"));
            }

            String reasonStr = reasonObj.toString();
            String description = descriptionObj != null ? descriptionObj.toString() : null;

            ExperienceReportReason reason;
            try {
                reason = ExperienceReportReason.valueOf(reasonStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid reason: " + reasonStr));
            }

            logger.info("Creating experience report: reporter={}, experience={}, reason={}", reporterUserId, experienceId, reason);

            // Create and save report
            ExperienceReport report = experienceReportService.createReport(reporterUserId, experienceId, reason, description);
            
            logger.info("Report saved with ID: {}", report.getReportId());
            return ResponseEntity.ok(Map.of("message", "Report created successfully", "reportId", report.getReportId(), "success", true));
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid report request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating experience report: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create report: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<ExperienceReport>> myReports(@RequestHeader("User-ID") Long userId) {
        return ResponseEntity.ok(experienceReportService.getReportsByReporter(userId));
    }

    @GetMapping("/experience/{experienceId}")
    public ResponseEntity<List<ExperienceReport>> reportsForExperience(@PathVariable("experienceId") Long experienceId) {
        return ResponseEntity.ok(experienceReportService.getReportsByExperience(experienceId));
    }
}

