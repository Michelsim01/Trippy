package com.backend.controller;

import com.backend.entity.TripPoints;
import com.backend.repository.TripPointsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-points")
public class TripPointsController {
    @Autowired
    private TripPointsRepository tripPointsRepository;

    @GetMapping
    public ResponseEntity<List<TripPoints>> getAllTripPoints() {
        try {
            List<TripPoints> tripPoints = tripPointsRepository.findAll();
            return ResponseEntity.ok(tripPoints);
        } catch (Exception e) {
            System.err.println("Error retrieving all trip points: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripPoints> getTripPointsById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<TripPoints> tripPoints = tripPointsRepository.findById(id);
            if (tripPoints.isPresent()) {
                return ResponseEntity.ok(tripPoints.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving trip points with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<TripPoints> createTripPoints(@RequestBody TripPoints tripPoints) {
        try {
            if (tripPoints == null) {
                return ResponseEntity.badRequest().build();
            }
            
            TripPoints savedTripPoints = tripPointsRepository.save(tripPoints);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTripPoints);
        } catch (Exception e) {
            System.err.println("Error creating trip points: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripPoints> updateTripPoints(@PathVariable Long id, @RequestBody TripPoints tripPoints) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (tripPoints == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!tripPointsRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            tripPoints.setPointsId(id);
            TripPoints savedTripPoints = tripPointsRepository.save(tripPoints);
            return ResponseEntity.ok(savedTripPoints);
        } catch (Exception e) {
            System.err.println("Error updating trip points with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTripPoints(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!tripPointsRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            tripPointsRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting trip points with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
