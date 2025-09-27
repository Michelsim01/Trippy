package com.backend.controller;

import com.backend.dto.ExperienceEarningsDTO;
import com.backend.dto.GuideEarningsDTO;
import com.backend.service.EarningsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/earnings")
public class EarningsController {

    @Autowired
    private EarningsService earningsService;

    @GetMapping("/guide/{guideId}")
    public ResponseEntity<GuideEarningsDTO> getGuideEarnings(@PathVariable Long guideId) {
        try {
            System.out.println("DEBUG: EarningsController - Received request for guide: " + guideId);
            GuideEarningsDTO earnings = earningsService.getGuideEarnings(guideId);
            System.out.println("DEBUG: EarningsController - Successfully fetched earnings");
            return ResponseEntity.ok(earnings);
        } catch (Exception e) {
            System.err.println("ERROR in EarningsController: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/experience/{experienceId}/guide/{guideId}")
    public ResponseEntity<ExperienceEarningsDTO> getExperienceEarnings(
            @PathVariable Long experienceId,
            @PathVariable Long guideId) {
        try {
            ExperienceEarningsDTO earnings = earningsService.getExperienceEarnings(experienceId, guideId);
            return ResponseEntity.ok(earnings);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}