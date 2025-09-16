package com.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

import com.backend.service.DataSeedingService;

/**
 * Standalone runner to seed the database with sample data.
 * Run this class to populate your database with test data.
 */
@SpringBootApplication
public class SeedDatabaseRunner implements CommandLineRunner {

    private final DataSeedingService dataSeedingService;

    public SeedDatabaseRunner(DataSeedingService dataSeedingService) {
        this.dataSeedingService = dataSeedingService;
    }

    public static void main(String[] args) {
        System.out.println("Starting database seeding...");
        
        ConfigurableApplicationContext context = SpringApplication.run(SeedDatabaseRunner.class, args);
        
        // Close the application context after seeding
        context.close();
        
        System.out.println("Database seeding completed. Application terminated.");
    }

    @Override
    public void run(String... args) throws Exception {
        dataSeedingService.seedDatabase();
    }
}