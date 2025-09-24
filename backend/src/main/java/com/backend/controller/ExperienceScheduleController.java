package com.backend.controller;

import com.backend.entity.ExperienceSchedule;
import com.backend.repository.ExperienceScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/experience-schedules")
public class ExperienceScheduleController {
    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @GetMapping
    public List<ExperienceSchedule> getAllExperienceSchedules() {
        return experienceScheduleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ExperienceSchedule getExperienceScheduleById(@PathVariable Long id) {
        return experienceScheduleRepository.findById(id).orElse(null);
    }

    @GetMapping("/experience/{experienceId}")
    public List<Map<String, Object>> getSchedulesByExperienceId(@PathVariable Long experienceId) {
        List<ExperienceSchedule> schedules = experienceScheduleRepository.findByExperience_ExperienceIdOrderByStartDateTimeAsc(experienceId);
        
        return schedules.stream().map(schedule -> {
            Map<String, Object> scheduleMap = new HashMap<>();
            scheduleMap.put("scheduleId", schedule.getScheduleId());
            scheduleMap.put("startDateTime", schedule.getStartDateTime());
            scheduleMap.put("endDateTime", schedule.getEndDateTime());
            scheduleMap.put("availableSpots", schedule.getAvailableSpots());
            scheduleMap.put("isAvailable", schedule.getIsAvailable());
            scheduleMap.put("createdAt", schedule.getCreatedAt());
            return scheduleMap;
        }).collect(Collectors.toList());
    }

    @PostMapping
    public ExperienceSchedule createExperienceSchedule(@RequestBody ExperienceSchedule experienceSchedule) {
        return experienceScheduleRepository.save(experienceSchedule);
    }

    @PutMapping("/{id}")
    public ExperienceSchedule updateExperienceSchedule(@PathVariable Long id, @RequestBody ExperienceSchedule experienceSchedule) {
        experienceSchedule.setScheduleId(id);
        return experienceScheduleRepository.save(experienceSchedule);
    }

    @DeleteMapping("/{id}")
    public void deleteExperienceSchedule(@PathVariable Long id) {
        experienceScheduleRepository.deleteById(id);
    }
}
