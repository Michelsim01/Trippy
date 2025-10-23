package com.backend.controller;

import com.backend.dto.GuideDashboardMetricsDTO;
import com.backend.dto.ProfitChartDataDTO;
import com.backend.dto.TopExperienceDTO;
import com.backend.service.GuideAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guide-analytics")
public class GuideAnalyticsController {

    @Autowired
    private GuideAnalyticsService guideAnalyticsService;

    /**
     * Get dashboard metrics for a guide
     * Includes: monthly bookings, cancellation rate, total experiences
     */
    @GetMapping("/{guideId}/dashboard-metrics")
    public ResponseEntity<GuideDashboardMetricsDTO> getDashboardMetrics(@PathVariable Long guideId) {
        try {
            GuideDashboardMetricsDTO metrics = guideAnalyticsService.getDashboardMetrics(guideId);
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            System.err.println("ERROR in GuideAnalyticsController.getDashboardMetrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get profit chart data for the last 6 months
     */
    @GetMapping("/{guideId}/profit-chart")
    public ResponseEntity<List<ProfitChartDataDTO>> getProfitChartData(@PathVariable Long guideId) {
        try {
            List<ProfitChartDataDTO> chartData = guideAnalyticsService.getProfitChartData(guideId);
            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            System.err.println("ERROR in GuideAnalyticsController.getProfitChartData: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get top performing experiences by booking volume
     */
    @GetMapping("/{guideId}/top-experiences")
    public ResponseEntity<List<TopExperienceDTO>> getTopExperiences(@PathVariable Long guideId) {
        try {
            List<TopExperienceDTO> topExperiences = guideAnalyticsService.getTopExperiences(guideId);
            return ResponseEntity.ok(topExperiences);
        } catch (Exception e) {
            System.err.println("ERROR in GuideAnalyticsController.getTopExperiences: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
