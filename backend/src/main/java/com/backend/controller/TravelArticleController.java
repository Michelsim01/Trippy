package com.backend.controller;

import com.backend.entity.TravelArticle;
import com.backend.entity.User;
import com.backend.entity.ArticleStatusEnum;
import com.backend.entity.ArticleCategoryEnum;
import com.backend.entity.ArticleLike;
import com.backend.entity.ArticleComment;
import com.backend.entity.Experience;
import com.backend.entity.ExperienceCategory;
import com.backend.entity.ExperienceStatus;
import com.backend.repository.TravelArticleRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ArticleLikeRepository;
import com.backend.repository.ExperienceRepository;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Autowired
    private ExperienceRepository experienceRepository;

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
    public ResponseEntity<List<TravelArticle>> getPublishedArticles(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        try {
            List<TravelArticle> articles;

            // If search term is provided
            if (search != null && !search.trim().isEmpty()) {
                String searchTerm = search.trim();
                String searchLower = searchTerm.toLowerCase();

                // Search with category filter if category is also provided
                if (category != null && !category.isEmpty()) {
                    ArticleCategoryEnum categoryEnum = ArticleCategoryEnum.valueOf(category.toUpperCase());
                    articles = travelArticleRepository.searchPublishedArticlesByCategory(
                        ArticleStatusEnum.PUBLISHED, categoryEnum, searchTerm);
                } else {
                    articles = travelArticleRepository.searchPublishedArticles(
                        ArticleStatusEnum.PUBLISHED, searchTerm);
                }

                // Sort results by relevance: title matches first, then author matches, then content matches
                articles.sort((a, b) -> {
                    boolean aTitleMatch = a.getTitle() != null && a.getTitle().toLowerCase().contains(searchLower);
                    boolean bTitleMatch = b.getTitle() != null && b.getTitle().toLowerCase().contains(searchLower);

                    boolean aAuthorMatch = false;
                    boolean bAuthorMatch = false;

                    if (a.getAuthor() != null) {
                        String aFullName = (a.getAuthor().getFirstName() + " " + a.getAuthor().getLastName()).toLowerCase();
                        aAuthorMatch = aFullName.contains(searchLower) ||
                                     (a.getAuthor().getFirstName() != null && a.getAuthor().getFirstName().toLowerCase().contains(searchLower)) ||
                                     (a.getAuthor().getLastName() != null && a.getAuthor().getLastName().toLowerCase().contains(searchLower));
                    }

                    if (b.getAuthor() != null) {
                        String bFullName = (b.getAuthor().getFirstName() + " " + b.getAuthor().getLastName()).toLowerCase();
                        bAuthorMatch = bFullName.contains(searchLower) ||
                                     (b.getAuthor().getFirstName() != null && b.getAuthor().getFirstName().toLowerCase().contains(searchLower)) ||
                                     (b.getAuthor().getLastName() != null && b.getAuthor().getLastName().toLowerCase().contains(searchLower));
                    }

                    // Priority: title match > author match > content match
                    if (aTitleMatch && !bTitleMatch) return -1;
                    if (!aTitleMatch && bTitleMatch) return 1;
                    if (aAuthorMatch && !bAuthorMatch) return -1;
                    if (!aAuthorMatch && bAuthorMatch) return 1;

                    // If same priority, sort by date (newest first)
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                });
            }
            // No search term, just filter by category or get all
            else if (category != null && !category.isEmpty()) {
                ArticleCategoryEnum categoryEnum = ArticleCategoryEnum.valueOf(category.toUpperCase());
                articles = travelArticleRepository.findByStatusAndCategory(ArticleStatusEnum.PUBLISHED, categoryEnum);
            } else {
                articles = travelArticleRepository.findByStatusOrderByCreatedAtDesc(ArticleStatusEnum.PUBLISHED);
            }

            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            System.err.println("Error retrieving published articles: " + e.getMessage());
            e.printStackTrace();
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

    // ====================
    // RECOMMENDATION ENDPOINTS
    // ====================

    @GetMapping("/{id}/recommended-experiences")
    public ResponseEntity<List<Experience>> getRecommendedExperiences(@PathVariable Long id) {
        try {
            // Get the blog article
            Optional<TravelArticle> articleOpt = travelArticleRepository.findById(id);
            if (articleOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            TravelArticle article = articleOpt.get();
            List<Experience> recommendations = new ArrayList<>();

            // Category-based matching
            List<Experience> categoryMatches = getCategoryBasedRecommendations(article);
            recommendations.addAll(categoryMatches);

            // Location-based matching
            List<Experience> locationMatches = getLocationBasedRecommendations(article);
            for (Experience exp : locationMatches) {
                if (!recommendations.contains(exp) && recommendations.size() < 6) {
                    recommendations.add(exp);
                }
            }

            // Fallback to popular experiences if not enough recommendations
            if (recommendations.size() < 4) {
                try {
                    List<Experience> popularExperiences = experienceRepository.findTop4ByStatusOrderByCreatedAtDesc(ExperienceStatus.ACTIVE);
                    for (Experience exp : popularExperiences) {
                        if (!recommendations.contains(exp) && recommendations.size() < 6) {
                            recommendations.add(exp);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error fetching popular experiences: " + e.getMessage());
                }
            }

            return ResponseEntity.ok(recommendations.stream().limit(6).collect(Collectors.toList()));

        } catch (Exception e) {
            System.err.println("Error getting recommended experiences: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }

    private List<Experience> getCategoryBasedRecommendations(TravelArticle article) {
        try {
            if (article == null || article.getCategory() == null) {
                System.err.println("Article or article category is null");
                return new ArrayList<>();
            }

            ExperienceCategory targetCategory = mapBlogCategoryToExperienceCategory(article.getCategory());

            if (targetCategory != null) {
                List<Experience> experiences = experienceRepository.findTop3ByCategoryAndStatusOrderByCreatedAtDesc(targetCategory, ExperienceStatus.ACTIVE);
                return experiences != null ? experiences : new ArrayList<>();
            }

            return new ArrayList<>();
        } catch (Exception e) {
            System.err.println("Error in category-based recommendations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private List<Experience> getLocationBasedRecommendations(TravelArticle article) {
        try {
            if (article == null) {
                System.err.println("Article is null in location-based recommendations");
                return new ArrayList<>();
            }

            // Common Indonesian destinations
            String[] locations = {"bali", "jakarta", "yogyakarta", "bandung", "lombok", "borobudur", "ubud", "canggu", "seminyak"};

            String title = article.getTitle() != null ? article.getTitle() : "";
            String content = article.getContent() != null ? article.getContent() : "";
            String combinedContent = (title + " " + content).toLowerCase();

            List<Experience> locationMatches = new ArrayList<>();

            for (String location : locations) {
                if (combinedContent.contains(location)) {
                    List<Experience> matches = experienceRepository.findByLocationAndStatus(location, ExperienceStatus.ACTIVE);
                    if (matches != null) {
                        locationMatches.addAll(matches);
                    }
                    if (locationMatches.size() >= 3) break;
                }
            }

            return locationMatches.stream().limit(3).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in location-based recommendations: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private ExperienceCategory mapBlogCategoryToExperienceCategory(ArticleCategoryEnum blogCategory) {
        if (blogCategory == null) {
            return ExperienceCategory.OTHERS;
        }

        switch (blogCategory) {
            case TRAVEL:
                return ExperienceCategory.GUIDED_TOUR;
            case EXPLORING:
                return ExperienceCategory.ADVENTURE;
            case TIPSANDTRICKS:
                return ExperienceCategory.WORKSHOP;
            case HOWTO:
                return ExperienceCategory.WORKSHOP;
            case OFFTOPIC:
                return ExperienceCategory.OTHERS;
            case OTHERS:
                return ExperienceCategory.OTHERS;
            default:
                return ExperienceCategory.OTHERS;
        }
    }
}
