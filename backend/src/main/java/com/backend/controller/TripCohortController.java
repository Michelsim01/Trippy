package com.backend.controller;

import com.backend.entity.TripCohort;
import com.backend.repository.TripCohortRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trip-cohorts")
public class TripCohortController {
    @Autowired
    private TripCohortRepository tripCohortRepository;

    @GetMapping
    public List<TripCohort> getAllTripCohorts() {
        return tripCohortRepository.findAll();
    }

    @GetMapping("/{id}")
    public TripCohort getTripCohortById(@PathVariable Long id) {
        return tripCohortRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TripCohort createTripCohort(@RequestBody TripCohort tripCohort) {
        return tripCohortRepository.save(tripCohort);
    }

    @PutMapping("/{id}")
    public TripCohort updateTripCohort(@PathVariable Long id, @RequestBody TripCohort tripCohort) {
        tripCohort.setCohortId(id);
        return tripCohortRepository.save(tripCohort);
    }

    @DeleteMapping("/{id}")
    public void deleteTripCohort(@PathVariable Long id) {
        tripCohortRepository.deleteById(id);
    }
}
