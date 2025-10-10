package com.backend.controller;

import com.backend.dto.LocationSuggestionDTO;
import com.backend.service.GeocodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(originPatterns = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class LocationController {

    @Autowired
    private GeocodingService geocodingService;

    @GetMapping("/search")
    public ResponseEntity<List<LocationSuggestionDTO>> searchLocations( 
            @RequestParam String query) {
        
        // Validate input
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Minimum query length to avoid too many API calls
        if (query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        
        try {
            List<LocationSuggestionDTO> suggestions = geocodingService.searchLocations(query.trim());
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            // Log error and return empty list to avoid breaking frontend
            System.err.println("Error in location search: " + e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }
}