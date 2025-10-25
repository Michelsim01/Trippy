package com.backend.controller;

import com.backend.dto.ExperienceViewsDTO;
import com.backend.dto.GuideDashboardMetricsDTO;
import com.backend.dto.ProfitChartDataDTO;
import com.backend.dto.TopExperienceDTO;
import com.backend.service.ExperienceAnalyticsService;
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

    @Autowired
    private ExperienceAnalyticsService experienceAnalyticsService;

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

    /**
     * Get view analytics for a specific experience
     * Used by ExperienceViewsModal
     */
    @GetMapping("/experience/{experienceId}/views")
    public ResponseEntity<ExperienceViewsDTO> getExperienceViews(
            @PathVariable Long experienceId,
            @RequestParam Long guideId) {
        try {
            ExperienceViewsDTO viewsData = experienceAnalyticsService.getExperienceViews(experienceId, guideId);
            return ResponseEntity.ok(viewsData);
        } catch (RuntimeException e) {
            System.err.println("ERROR in GuideAnalyticsController.getExperienceViews: " + e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            System.err.println("ERROR in GuideAnalyticsController.getExperienceViews: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
