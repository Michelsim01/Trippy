package com.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

import com.backend.service.DataSeedingService;

/**
 * Standalone runner to seed the database with sample data.
 * Run this class to populate your database with test data.
 */
public class SeedDatabaseRunner {

    public static void main(String[] args) {
        System.out.println("Starting database seeding...");
        
        // Run the main BackendApplication but with seeding configuration
        System.setProperty("spring.profiles.active", "seeding");
        ConfigurableApplicationContext context = SpringApplication.run(BackendApplication.class, args);
        
        // Get the seeding service and run it
        DataSeedingService dataSeedingService = context.getBean(DataSeedingService.class);
        try {
            dataSeedingService.seedDatabase();
        } catch (Exception e) {
            System.err.println("Database seeding failed: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Close the application context after seeding
        context.close();
        
        System.out.println("Database seeding completed. Application terminated.");
    }
}