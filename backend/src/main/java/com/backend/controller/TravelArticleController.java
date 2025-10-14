package com.backend.controller;

import com.backend.entity.TravelArticle;
import com.backend.entity.User;
import com.backend.repository.TravelArticleRepository;
import com.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/travel-articles")
@CrossOrigin(origins = "http://localhost:5173")
public class TravelArticleController {
    @Autowired
    private TravelArticleRepository travelArticleRepository;

    @Autowired
    private UserRepository userRepository;

    private final String UPLOAD_DIR = "uploads/blog-images/";

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
    public ResponseEntity<?> createTravelArticle(@RequestBody TravelArticle article) {
        try {
            // Attach the existing user entity
            if (article.getAuthor() != null && article.getAuthor().getId() != null) {
                User author = userRepository.findById(article.getAuthor().getId())
                        .orElseThrow(() -> new RuntimeException("Author not found"));
                article.setAuthor(author);
            } else {
                return ResponseEntity.badRequest().body("Author is required");
            }

            TravelArticle saved = travelArticleRepository.save(article);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace(); // prints root cause to console
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating article: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TravelArticle> updateTravelArticle(@PathVariable Long id,
            @RequestBody TravelArticle travelArticle) {
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

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No file selected");
                return ResponseEntity.badRequest().body(error);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Only image files are allowed");
                return ResponseEntity.badRequest().body(error);
            }

            if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
                Map<String, Object> error = new HashMap<>();
                error.put("error", "File size too large. Maximum 10MB allowed");
                return ResponseEntity.badRequest().body(error);
            }

            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = "blog_" + UUID.randomUUID().toString() + fileExtension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/api/travel-articles/images/" + fileName;

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Image uploaded successfully");
            response.put("url", imageUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to upload file");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getBlogImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
