package com.backend.controller;

import com.backend.service.DataSeedingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Profile("!test")
public class DataSeedingController {

    @Autowired
    private DataSeedingService dataSeedingService;

    @PostMapping("/seed-database")
    public ResponseEntity<Map<String, String>> seedDatabase() {
        try {
            dataSeedingService.seedDatabase();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Database seeding completed successfully!");
            response.put("status", "success");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Database seeding failed: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}