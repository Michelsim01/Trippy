package com.backend.controller;

import com.backend.entity.TripPoints;
import com.backend.repository.TripPointsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trip-points")
public class TripPointsController {
    @Autowired
    private TripPointsRepository tripPointsRepository;

    @GetMapping
    public List<TripPoints> getAllTripPoints() {
        return tripPointsRepository.findAll();
    }

    @GetMapping("/{id}")
    public TripPoints getTripPointsById(@PathVariable Long id) {
        return tripPointsRepository.findById(id).orElse(null);
    }

    @PostMapping
    public TripPoints createTripPoints(@RequestBody TripPoints tripPoints) {
        return tripPointsRepository.save(tripPoints);
    }

    @PutMapping("/{id}")
    public TripPoints updateTripPoints(@PathVariable Long id, @RequestBody TripPoints tripPoints) {
        tripPoints.setPointsId(id);
        return tripPointsRepository.save(tripPoints);
    }

    @DeleteMapping("/{id}")
    public void deleteTripPoints(@PathVariable Long id) {
        tripPointsRepository.deleteById(id);
    }
}
