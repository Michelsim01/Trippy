package com.backend.controller;

import com.backend.entity.TravelArticle;
import com.backend.entity.User;
import com.backend.entity.ArticleStatusEnum;
import com.backend.entity.ArticleCategoryEnum;
import com.backend.entity.ArticleLike;
import com.backend.entity.ArticleComment;
import com.backend.repository.TravelArticleRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ArticleLikeRepository;
import com.backend.service.ArticleCommentService;

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

    @Autowired
    private ArticleLikeRepository articleLikeRepository;

    @Autowired
    private ArticleCommentService articleCommentService;

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

    @GetMapping("/published")
    public ResponseEntity<List<TravelArticle>> getPublishedArticles(@RequestParam(required = false) String category) {
        try {
            List<TravelArticle> articles;
            if (category != null && !category.isEmpty()) {
                ArticleCategoryEnum categoryEnum = ArticleCategoryEnum.valueOf(category.toUpperCase());
                articles = travelArticleRepository.findByStatusAndCategory(ArticleStatusEnum.PUBLISHED, categoryEnum);
            } else {
                articles = travelArticleRepository.findByStatusOrderByCreatedAtDesc(ArticleStatusEnum.PUBLISHED);
            }
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            System.err.println("Error retrieving published articles: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<TravelArticle>> getDraftsByAuthor(@RequestParam Long authorId) {
        try {
            if (authorId == null || authorId <= 0) {
                return ResponseEntity.badRequest().build();
            }
            List<TravelArticle> drafts = travelArticleRepository.findByAuthorIdAndStatusOrderByCreatedAtDesc(authorId, ArticleStatusEnum.DRAFT);
            return ResponseEntity.ok(drafts);
        } catch (Exception e) {
            System.err.println("Error retrieving drafts for author " + authorId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<TravelArticle>> getArticlesByAuthor(@PathVariable Long authorId, @RequestParam(required = false) String status) {
        try {
            if (authorId == null || authorId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<TravelArticle> articles;
            if (status != null && !status.isEmpty()) {
                ArticleStatusEnum statusEnum = ArticleStatusEnum.valueOf(status.toUpperCase());
                articles = travelArticleRepository.findByAuthorIdAndStatusOrderByCreatedAtDesc(authorId, statusEnum);
            } else {
                articles = travelArticleRepository.findByAuthorId(authorId);
            }
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            System.err.println("Error retrieving articles for author " + authorId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelArticle> getTravelArticleById(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<TravelArticle> articleOpt = travelArticleRepository.findById(id);
            if (articleOpt.isPresent()) {
                TravelArticle article = articleOpt.get();

                // If article is a draft, only allow access if the user is the author
                if (article.getStatus() == ArticleStatusEnum.DRAFT) {
                    if (userId == null || !article.getAuthor().getId().equals(userId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                }

                return ResponseEntity.ok(article);
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
    public ResponseEntity<?> updateTravelArticle(@PathVariable Long id,
            @RequestBody TravelArticle travelArticle, @RequestParam(required = false) Long userId) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }

            if (travelArticle == null) {
                return ResponseEntity.badRequest().build();
            }

            Optional<TravelArticle> existingArticleOpt = travelArticleRepository.findById(id);
            if (!existingArticleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            TravelArticle existingArticle = existingArticleOpt.get();

            // Check if user is the author
            if (userId == null || !existingArticle.getAuthor().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the author can update this article");
            }

            // Preserve the author and created date
            travelArticle.setArticleId(id);
            travelArticle.setAuthor(existingArticle.getAuthor());
            travelArticle.setCreatedAt(existingArticle.getCreatedAt());

            TravelArticle savedArticle = travelArticleRepository.save(travelArticle);
            return ResponseEntity.ok(savedArticle);
        } catch (Exception e) {
            System.err.println("Error updating travel article with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating article");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTravelArticle(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<TravelArticle> articleOpt = travelArticleRepository.findById(id);
            if (!articleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            TravelArticle article = articleOpt.get();

            // Check if user is the author
            if (userId == null || !article.getAuthor().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the author can delete this article");
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

    // ====================
    // VIEW COUNT ENDPOINTS
    // ====================

    @PostMapping("/{id}/view")
    public ResponseEntity<Map<String, Object>> incrementViewCount(@PathVariable Long id) {
        try {
            Optional<TravelArticle> articleOpt = travelArticleRepository.findById(id);
            if (articleOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Article not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            TravelArticle article = articleOpt.get();
            Integer currentViews = article.getViewsCount();
            if (currentViews == null) {
                currentViews = 0;
            }
            article.setViewsCount(currentViews + 1);
            travelArticleRepository.save(article);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("viewsCount", article.getViewsCount());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to increment view count");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ====================
    // LIKE/UNLIKE ENDPOINTS
    // ====================

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long id, @RequestParam Long userId) {
        try {
            Optional<TravelArticle> articleOpt = travelArticleRepository.findById(id);
            if (articleOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Article not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            TravelArticle article = articleOpt.get();
            User user = userOpt.get();

            // Check if user already liked this article
            Optional<ArticleLike> existingLike = articleLikeRepository.findByTravelArticleAndUser(article, user);

            boolean isLiked;
            if (existingLike.isPresent()) {
                // Unlike: remove the like
                articleLikeRepository.delete(existingLike.get());
                isLiked = false;
            } else {
                // Like: create new like
                ArticleLike like = new ArticleLike();
                like.setTravelArticle(article);
                like.setUser(user);
                articleLikeRepository.save(like);
                isLiked = true;
            }

            // Update article likes count
            long likesCount = articleLikeRepository.countByTravelArticle(article);
            article.setLikesCount((int) likesCount);
            travelArticleRepository.save(article);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isLiked", isLiked);
            response.put("likesCount", article.getLikesCount());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to toggle like");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}/like-status")
    public ResponseEntity<Map<String, Object>> getLikeStatus(@PathVariable Long id, @RequestParam Long userId) {
        try {
            boolean isLiked = articleLikeRepository.existsByArticleIdAndUserId(id, userId);
            long likesCount = articleLikeRepository.countByArticleId(id);

            Map<String, Object> response = new HashMap<>();
            response.put("isLiked", isLiked);
            response.put("likesCount", likesCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get like status");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ====================
    // COMMENT ENDPOINTS
    // ====================

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ArticleComment>> getComments(@PathVariable Long id) {
        try {
            List<ArticleComment> comments = articleCommentService.getCommentsByArticleId(id);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ArticleComment> createComment(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String content) {
        try {
            ArticleComment comment = articleCommentService.createComment(id, userId, content);
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ArticleComment> updateComment(
            @PathVariable Long commentId,
            @RequestParam Long userId,
            @RequestParam String content) {
        try {
            ArticleComment comment = articleCommentService.updateComment(commentId, userId, content);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable Long commentId,
            @RequestParam Long userId) {
        try {
            articleCommentService.deleteComment(commentId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Comment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to delete comment");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @PathVariable Long commentId,
            @RequestParam Long userId) {
        try {
            ArticleComment comment = articleCommentService.toggleCommentLike(commentId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("likesCount", comment.getLikesCount());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to toggle comment like");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
