package com.backend.controller;

import com.backend.entity.CohortMember;
import com.backend.repository.CohortMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cohort-members")
public class CohortMemberController {
    @Autowired
    private CohortMemberRepository cohortMemberRepository;

    @GetMapping
    public ResponseEntity<List<CohortMember>> getAllCohortMembers() {
        try {
            List<CohortMember> cohortMembers = cohortMemberRepository.findAll();
            return ResponseEntity.ok(cohortMembers);
        } catch (Exception e) {
            System.err.println("Error retrieving all cohort members: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CohortMember> getCohortMemberById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<CohortMember> cohortMember = cohortMemberRepository.findById(id);
            if (cohortMember.isPresent()) {
                return ResponseEntity.ok(cohortMember.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving cohort member with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<CohortMember> createCohortMember(@RequestBody CohortMember cohortMember) {
        try {
            if (cohortMember == null) {
                return ResponseEntity.badRequest().build();
            }
            
            CohortMember savedCohortMember = cohortMemberRepository.save(cohortMember);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCohortMember);
        } catch (Exception e) {
            System.err.println("Error creating cohort member: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CohortMember> updateCohortMember(@PathVariable Long id, @RequestBody CohortMember cohortMember) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (cohortMember == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!cohortMemberRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            cohortMember.setId(id);
            CohortMember savedCohortMember = cohortMemberRepository.save(cohortMember);
            return ResponseEntity.ok(savedCohortMember);
        } catch (Exception e) {
            System.err.println("Error updating cohort member with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCohortMember(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!cohortMemberRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            cohortMemberRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting cohort member with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
