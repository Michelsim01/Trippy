package com.backend.controller;

import com.backend.entity.Experience;
import com.backend.entity.ExperienceSchedule;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.ExperienceScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {
    @Autowired
    private ExperienceRepository experienceRepository;
    
    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @GetMapping
    public List<Map<String, Object>> getAllExperiences() {
        List<Experience> experiences = experienceRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Experience exp : experiences) {
            Map<String, Object> expMap = new HashMap<>();
            expMap.put("experienceId", exp.getExperienceId());
            expMap.put("title", exp.getTitle());
            expMap.put("location", exp.getLocation());
            expMap.put("price", exp.getPrice());
            expMap.put("averageRating", exp.getAverageRating());
            expMap.put("coverPhotoUrl", exp.getCoverPhotoUrl());
            expMap.put("shortDescription", exp.getShortDescription());
            expMap.put("duration", exp.getDuration());
            expMap.put("category", exp.getCategory());
            expMap.put("status", exp.getStatus());
            expMap.put("totalReviews", exp.getTotalReviews());
            expMap.put("createdAt", exp.getCreatedAt());
            expMap.put("updatedAt", exp.getUpdatedAt());
            
            // Add guide info without lazy loading issues
            if (exp.getGuide() != null) {
                Map<String, Object> guideMap = new HashMap<>();
                guideMap.put("userId", exp.getGuide().getId());
                guideMap.put("firstName", exp.getGuide().getFirstName());
                guideMap.put("lastName", exp.getGuide().getLastName());
                guideMap.put("email", exp.getGuide().getEmail());
                guideMap.put("profileImageUrl", exp.getGuide().getProfileImageUrl());
                expMap.put("guide", guideMap);
            }
            
            result.add(expMap);
        }
        
        return result;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getExperienceById(@PathVariable Long id) {
        Experience exp = experienceRepository.findById(id).orElse(null);
        if (exp == null) {
            return null;
        }
        
        Map<String, Object> expMap = new HashMap<>();
        expMap.put("experienceId", exp.getExperienceId());
        expMap.put("title", exp.getTitle());
        expMap.put("location", exp.getLocation());
        expMap.put("price", exp.getPrice());
        expMap.put("averageRating", exp.getAverageRating());
        expMap.put("coverPhotoUrl", exp.getCoverPhotoUrl());
        expMap.put("shortDescription", exp.getShortDescription());
        expMap.put("fullDescription", exp.getFullDescription());
        expMap.put("duration", exp.getDuration());
        expMap.put("category", exp.getCategory());
        expMap.put("status", exp.getStatus());
        expMap.put("totalReviews", exp.getTotalReviews());
        expMap.put("highlights", exp.getHighlights());
        expMap.put("whatIncluded", exp.getWhatIncluded());
        expMap.put("importantInfo", exp.getImportantInfo());
        expMap.put("cancellationPolicy", exp.getCancellationPolicy());
        expMap.put("participantsAllowed", exp.getParticipantsAllowed());
        expMap.put("createdAt", exp.getCreatedAt());
        expMap.put("updatedAt", exp.getUpdatedAt());
        
        // Add guide info without lazy loading issues
        if (exp.getGuide() != null) {
            Map<String, Object> guideMap = new HashMap<>();
            guideMap.put("userId", exp.getGuide().getId());
            guideMap.put("firstName", exp.getGuide().getFirstName());
            guideMap.put("lastName", exp.getGuide().getLastName());
            guideMap.put("email", exp.getGuide().getEmail());
            guideMap.put("profileImageUrl", exp.getGuide().getProfileImageUrl());
            expMap.put("guide", guideMap);
        }
        
        return expMap;
    }

    @PostMapping
    public Experience createExperience(@RequestBody Experience experience) {
        return experienceRepository.save(experience);
    }

    @PutMapping("/{id}")
    public Experience updateExperience(@PathVariable Long id, @RequestBody Experience experience) {
        experience.setExperienceId(id);
        return experienceRepository.save(experience);
    }

    @DeleteMapping("/{id}")
    public void deleteExperience(@PathVariable Long id) {
        experienceRepository.deleteById(id);
    }

    @GetMapping("/{id}/schedules")
    public List<Map<String, Object>> getSchedulesByExperienceId(@PathVariable Long id) {
        List<ExperienceSchedule> schedules = experienceScheduleRepository.findByExperience_ExperienceId(id);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (ExperienceSchedule schedule : schedules) {
            Map<String, Object> scheduleMap = new HashMap<>();
            scheduleMap.put("scheduleId", schedule.getScheduleId());
            scheduleMap.put("date", schedule.getDate());
            scheduleMap.put("startTime", schedule.getStartTime());
            scheduleMap.put("endTime", schedule.getEndTime());
            scheduleMap.put("availableSpots", schedule.getAvailableSpots());
            scheduleMap.put("isAvailable", schedule.getIsAvailable());
            scheduleMap.put("createdAt", schedule.getCreatedAt());
            result.add(scheduleMap);
        }
        
        return result;
    }
}
