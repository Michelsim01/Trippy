package com.backend.controller;

import com.backend.entity.ExperienceSchedule;
import com.backend.repository.ExperienceScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
