package com.backend.controller;

import com.backend.entity.ExperienceMedia;
import com.backend.repository.ExperienceMediaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/experience-media")
public class ExperienceMediaController {
    @Autowired
    private ExperienceMediaRepository experienceMediaRepository;

    @GetMapping
    public List<ExperienceMedia> getAllExperienceMedia() {
        return experienceMediaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ExperienceMedia getExperienceMediaById(@PathVariable Long id) {
        return experienceMediaRepository.findById(id).orElse(null);
    }

    @PostMapping
    public ExperienceMedia createExperienceMedia(@RequestBody ExperienceMedia experienceMedia) {
        return experienceMediaRepository.save(experienceMedia);
    }

    @PutMapping("/{id}")
    public ExperienceMedia updateExperienceMedia(@PathVariable Long id, @RequestBody ExperienceMedia experienceMedia) {
        experienceMedia.setMediaId(id);
        return experienceMediaRepository.save(experienceMedia);
    }

    @DeleteMapping("/{id}")
    public void deleteExperienceMedia(@PathVariable Long id) {
        experienceMediaRepository.deleteById(id);
    }
}
