package com.backend.controller;

import com.backend.entity.Experience;
import com.backend.repository.ExperienceRepository;
import com.backend.service.ExperienceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {
    @Autowired
    private ExperienceRepository experienceRepository;
    
    @Autowired
    private ExperienceService experienceService;

    @GetMapping
    public List<Experience> getAllExperiences() {
        return experienceRepository.findAll();
    }

    @GetMapping("/{id}")
    public Experience getExperienceById(@PathVariable Long id) {
        return experienceRepository.findById(id).orElse(null);
    }

    @PostMapping
    public ResponseEntity<?> createExperience(@RequestBody Map<String, Object> payload) {
        try {
            Experience createdExperience = experienceService.createCompleteExperience(payload);
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "experienceId", createdExperience.getExperienceId(),
                "message", "Experience created successfully",
                "experience", createdExperience
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to create experience: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public Experience updateExperience(@PathVariable Long id, @RequestBody Experience experience) {
        experience.setExperienceId(id);
        return experienceRepository.save(experience);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> updateCompleteExperience(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Experience updatedExperience = experienceService.updateCompleteExperience(id, payload);
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "experienceId", updatedExperience.getExperienceId(),
                "message", "Experience updated successfully",
                "experience", updatedExperience
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to update experience: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public void deleteExperience(@PathVariable Long id) {
        experienceRepository.deleteById(id);
    }

    // Separate endpoints for related data
    @GetMapping("/{id}/media")
    public ResponseEntity<?> getExperienceMedia(@PathVariable Long id) {
        try {
            Experience experience = experienceRepository.findById(id).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(experience.getMediaList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to fetch media: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/itineraries")
    public ResponseEntity<?> getExperienceItineraries(@PathVariable Long id) {
        try {
            Experience experience = experienceRepository.findById(id).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(experience.getItineraries());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to fetch itineraries: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/schedules")
    public ResponseEntity<?> getExperienceSchedules(@PathVariable Long id) {
        try {
            Experience experience = experienceRepository.findById(id).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(experience.getSchedules());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Failed to fetch schedules: " + e.getMessage()
            ));
        }
    }
}
