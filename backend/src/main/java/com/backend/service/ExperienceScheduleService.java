package com.backend.service;

import com.backend.entity.ExperienceSchedule;
import com.backend.repository.ExperienceScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExperienceScheduleService {
    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    public List<ExperienceSchedule> getAllExperienceSchedules() {
        return experienceScheduleRepository.findAll();
    }

    public Optional<ExperienceSchedule> getExperienceScheduleById(Long id) {
        return experienceScheduleRepository.findById(id);
    }

    public ExperienceSchedule createExperienceSchedule(ExperienceSchedule experienceSchedule) {
        return experienceScheduleRepository.save(experienceSchedule);
    }

    public ExperienceSchedule updateExperienceSchedule(Long id, ExperienceSchedule experienceSchedule) {
        experienceSchedule.setScheduleId(id);
        return experienceScheduleRepository.save(experienceSchedule);
    }

    public void deleteExperienceSchedule(Long id) {
        experienceScheduleRepository.deleteById(id);
    }
}
