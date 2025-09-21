package com.backend.controller;

import com.backend.entity.TripCohort;
import com.backend.repository.TripCohortRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-cohorts")
public class TripCohortController {
    @Autowired
    private TripCohortRepository tripCohortRepository;

    @GetMapping
    public ResponseEntity<List<TripCohort>> getAllTripCohorts() {
        try {
            List<TripCohort> tripCohorts = tripCohortRepository.findAll();
            return ResponseEntity.ok(tripCohorts);
        } catch (Exception e) {
            System.err.println("Error retrieving all trip cohorts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripCohort> getTripCohortById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<TripCohort> tripCohort = tripCohortRepository.findById(id);
            if (tripCohort.isPresent()) {
                return ResponseEntity.ok(tripCohort.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving trip cohort with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<TripCohort> createTripCohort(@RequestBody TripCohort tripCohort) {
        try {
            if (tripCohort == null) {
                return ResponseEntity.badRequest().build();
            }
            
            TripCohort savedTripCohort = tripCohortRepository.save(tripCohort);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTripCohort);
        } catch (Exception e) {
            System.err.println("Error creating trip cohort: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripCohort> updateTripCohort(@PathVariable Long id, @RequestBody TripCohort tripCohort) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (tripCohort == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!tripCohortRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            tripCohort.setCohortId(id);
            TripCohort savedTripCohort = tripCohortRepository.save(tripCohort);
            return ResponseEntity.ok(savedTripCohort);
        } catch (Exception e) {
            System.err.println("Error updating trip cohort with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTripCohort(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!tripCohortRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            tripCohortRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting trip cohort with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
