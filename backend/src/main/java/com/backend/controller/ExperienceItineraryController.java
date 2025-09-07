package com.backend.controller;

import com.backend.entity.ExperienceItinerary;
import com.backend.repository.ExperienceItineraryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/experience-itineraries")
public class ExperienceItineraryController {
    @Autowired
    private ExperienceItineraryRepository experienceItineraryRepository;

    @GetMapping
    public List<ExperienceItinerary> getAllExperienceItineraries() {
        return experienceItineraryRepository.findAll();
    }

    @GetMapping("/{id}")
    public ExperienceItinerary getExperienceItineraryById(@PathVariable Long id) {
        return experienceItineraryRepository.findById(id).orElse(null);
    }

    @PostMapping
    public ExperienceItinerary createExperienceItinerary(@RequestBody ExperienceItinerary experienceItinerary) {
        return experienceItineraryRepository.save(experienceItinerary);
    }

    @PutMapping("/{id}")
    public ExperienceItinerary updateExperienceItinerary(@PathVariable Long id, @RequestBody ExperienceItinerary experienceItinerary) {
        experienceItinerary.setItineraryId(id);
        return experienceItineraryRepository.save(experienceItinerary);
    }

    @DeleteMapping("/{id}")
    public void deleteExperienceItinerary(@PathVariable Long id) {
        experienceItineraryRepository.deleteById(id);
    }
}
