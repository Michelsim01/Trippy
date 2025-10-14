package com.backend.controller;

import com.backend.service.DailyNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class NotificationScheduleController {

    @Autowired
    private DailyNotificationService dailyNotificationService;

    /**
     * Manual trigger for daily booking reminders - for testing purposes
     * Only accessible by admin users
     */
    @PostMapping("/trigger-daily-reminders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> triggerDailyReminders() {
        try {
            dailyNotificationService.triggerManualReminder();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Daily reminder notifications triggered successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to trigger daily reminders: " + e.getMessage()
            ));
        }
    }

    /**
     * Get information about the scheduled task
     */
    @GetMapping("/schedule-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getScheduleInfo() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "scheduleInfo", Map.of(
                "cronExpression", "0 0 0 * * * (Daily at midnight Singapore time)",
                "timezone", "Asia/Singapore",
                "description", "Sends booking reminder notifications to users with experiences the next day"
            )
        ));
    }
}