package com.backend.controller;

import com.backend.entity.ExperienceItinerary;
import com.backend.repository.ExperienceItineraryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/experience-itineraries")
public class ExperienceItineraryController {
    @Autowired
    private ExperienceItineraryRepository experienceItineraryRepository;

    @GetMapping
    public ResponseEntity<List<ExperienceItinerary>> getAllExperienceItineraries() {
        try {
            List<ExperienceItinerary> itineraries = experienceItineraryRepository.findAll();
            return ResponseEntity.ok(itineraries);
        } catch (Exception e) {
            System.err.println("Error retrieving all experience itineraries: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExperienceItinerary> getExperienceItineraryById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<ExperienceItinerary> itinerary = experienceItineraryRepository.findById(id);
            if (itinerary.isPresent()) {
                return ResponseEntity.ok(itinerary.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving experience itinerary with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<ExperienceItinerary> createExperienceItinerary(@RequestBody ExperienceItinerary experienceItinerary) {
        try {
            if (experienceItinerary == null) {
                return ResponseEntity.badRequest().build();
            }
            
            ExperienceItinerary savedItinerary = experienceItineraryRepository.save(experienceItinerary);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedItinerary);
        } catch (Exception e) {
            System.err.println("Error creating experience itinerary: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExperienceItinerary> updateExperienceItinerary(@PathVariable Long id, @RequestBody ExperienceItinerary experienceItinerary) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (experienceItinerary == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!experienceItineraryRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            experienceItinerary.setItineraryId(id);
            ExperienceItinerary savedItinerary = experienceItineraryRepository.save(experienceItinerary);
            return ResponseEntity.ok(savedItinerary);
        } catch (Exception e) {
            System.err.println("Error updating experience itinerary with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExperienceItinerary(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!experienceItineraryRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            experienceItineraryRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting experience itinerary with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
