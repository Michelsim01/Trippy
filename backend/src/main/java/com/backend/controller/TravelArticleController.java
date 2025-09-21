package com.backend.controller;

import com.backend.entity.TravelArticle;
import com.backend.repository.TravelArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/travel-articles")
public class TravelArticleController {
    @Autowired
    private TravelArticleRepository travelArticleRepository;

    @GetMapping
    public ResponseEntity<List<TravelArticle>> getAllTravelArticles() {
        try {
            List<TravelArticle> articles = travelArticleRepository.findAll();
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            System.err.println("Error retrieving all travel articles: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelArticle> getTravelArticleById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<TravelArticle> article = travelArticleRepository.findById(id);
            if (article.isPresent()) {
                return ResponseEntity.ok(article.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving travel article with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<TravelArticle> createTravelArticle(@RequestBody TravelArticle travelArticle) {
        try {
            if (travelArticle == null) {
                return ResponseEntity.badRequest().build();
            }
            
            TravelArticle savedArticle = travelArticleRepository.save(travelArticle);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedArticle);
        } catch (Exception e) {
            System.err.println("Error creating travel article: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TravelArticle> updateTravelArticle(@PathVariable Long id, @RequestBody TravelArticle travelArticle) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (travelArticle == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!travelArticleRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            travelArticle.setArticleId(id);
            TravelArticle savedArticle = travelArticleRepository.save(travelArticle);
            return ResponseEntity.ok(savedArticle);
        } catch (Exception e) {
            System.err.println("Error updating travel article with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTravelArticle(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!travelArticleRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            travelArticleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting travel article with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
