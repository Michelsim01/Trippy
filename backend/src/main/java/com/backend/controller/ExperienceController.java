package com.backend.controller;

import com.backend.entity.Experience;
import com.backend.repository.ExperienceRepository;
import com.backend.dto.SearchSuggestionDTO;
import com.backend.dto.ExperienceResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {
    @Autowired
    private ExperienceRepository experienceRepository;

    @GetMapping
    public List<ExperienceResponseDTO> getAllExperiences() {
        List<Experience> experiences = experienceRepository.findAll();
        return experiences.stream()
                .map(ExperienceResponseDTO::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Experience getExperienceById(@PathVariable Long id) {
        return experienceRepository.findById(id).orElse(null);
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
    
    @GetMapping("/search/suggestions")
    public List<SearchSuggestionDTO> getSearchSuggestions(@RequestParam String q) {
        List<SearchSuggestionDTO> suggestions = new ArrayList<>();
        
        // Return empty list if query is too short
        if (q == null || q.trim().length() < 2) {
            return suggestions;
        }
        
        String query = q.trim();
        
        // Get location suggestions (limit to 3)
        List<String> locations = experienceRepository.findLocationSuggestions(query);
        suggestions.addAll(locations.stream()
                .limit(3)
                .map(SearchSuggestionDTO::location)
                .collect(Collectors.toList()));
        
        // Get experience suggestions (limit to 2)
        List<Experience> experiences = experienceRepository.findExperienceSuggestions(query);
        suggestions.addAll(experiences.stream()
                .limit(2)
                .map(exp -> SearchSuggestionDTO.experience(exp.getTitle(), exp.getLocation(), exp.getExperienceId()))
                .collect(Collectors.toList()));
        
        // Limit total suggestions to 5
        return suggestions.stream().limit(5).collect(Collectors.toList());
    }
}
