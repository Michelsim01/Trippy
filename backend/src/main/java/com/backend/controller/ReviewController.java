package com.backend.controller;

import com.backend.entity.Review;
<<<<<<< Updated upstream
import com.backend.repository.ReviewRepository;
=======
import com.backend.entity.ReviewLike;
import com.backend.entity.Booking;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.entity.TripPoints;
import com.backend.repository.ReviewRepository;
import com.backend.repository.ReviewLikeRepository;
import com.backend.repository.BookingRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.service.TripPointsService;
>>>>>>> Stashed changes
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewRepository reviewRepository;

<<<<<<< Updated upstream
=======
    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private TripPointsService tripPointsService;

    @Autowired
    private ReviewLikeRepository reviewLikeRepository;

>>>>>>> Stashed changes
    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        try {
            List<Review> reviews = reviewRepository.findAll();
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            System.err.println("Error retrieving all reviews: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<Review> review = reviewRepository.findById(id);
            if (review.isPresent()) {
                return ResponseEntity.ok(review.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error retrieving review with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

<<<<<<< Updated upstream
=======
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Review> reviews = reviewRepository.findByReviewer_Id(userId);

            // Create safe response objects to avoid lazy loading issues
            List<Map<String, Object>> safeReviews = reviews.stream().map(review -> {
                Map<String, Object> reviewMap = new HashMap<>();
                reviewMap.put("reviewId", review.getReviewId());
                reviewMap.put("rating", review.getRating());
                reviewMap.put("title", review.getTitle());
                reviewMap.put("comment", review.getComment());
                reviewMap.put("tripPointsEarned", review.getTripPointsEarned());
                reviewMap.put("createdAt", review.getCreatedAt());
                reviewMap.put("updatedAt", review.getUpdatedAt());
                reviewMap.put("likeCount", review.getLikeCount() != null ? review.getLikeCount() : 0);

                // Add experience info safely
                if (review.getExperience() != null) {
                    Map<String, Object> experienceMap = new HashMap<>();
                    experienceMap.put("experienceId", review.getExperience().getExperienceId());
                    experienceMap.put("title", review.getExperience().getTitle());
                    experienceMap.put("location", review.getExperience().getLocation());
                    experienceMap.put("country", review.getExperience().getCountry());
                    experienceMap.put("coverPhotoUrl", review.getExperience().getCoverPhotoUrl());
                    reviewMap.put("experience", experienceMap);
                }

                // Add booking info safely
                if (review.getBooking() != null) {
                    Map<String, Object> bookingMap = new HashMap<>();
                    bookingMap.put("bookingId", review.getBooking().getBookingId());
                    bookingMap.put("confirmationCode", review.getBooking().getConfirmationCode());
                    reviewMap.put("booking", bookingMap);
                }

                return reviewMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(safeReviews);
        } catch (Exception e) {
            System.err.println("Error retrieving reviews for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch user reviews: " + e.getMessage()));
        }
    }

    @GetMapping("/experience/{experienceId}")
    public ResponseEntity<?> getReviewsByExperience(@PathVariable Long experienceId) {
        try {
            if (experienceId == null || experienceId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Review> reviews = reviewRepository.findByExperience_ExperienceId(experienceId);

            // Create safe response objects to avoid lazy loading issues
            List<Map<String, Object>> safeReviews = reviews.stream().map(review -> {
                Map<String, Object> reviewMap = new HashMap<>();
                reviewMap.put("reviewId", review.getReviewId());
                reviewMap.put("rating", review.getRating());
                reviewMap.put("title", review.getTitle());
                reviewMap.put("comment", review.getComment());
                reviewMap.put("tripPointsEarned", review.getTripPointsEarned());
                reviewMap.put("createdAt", review.getCreatedAt());
                reviewMap.put("updatedAt", review.getUpdatedAt());
                reviewMap.put("likeCount", review.getLikeCount() != null ? review.getLikeCount() : 0);

                // Add reviewer info safely
                if (review.getReviewer() != null) {
                    Map<String, Object> reviewerMap = new HashMap<>();
                    reviewerMap.put("userId", review.getReviewer().getId());
                    reviewerMap.put("firstName", review.getReviewer().getFirstName());
                    reviewerMap.put("lastName", review.getReviewer().getLastName());
                    reviewerMap.put("profileImageUrl", review.getReviewer().getProfileImageUrl());
                    reviewMap.put("reviewer", reviewerMap);
                }

                return reviewMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(safeReviews);
        } catch (Exception e) {
            System.err.println("Error retrieving reviews for experience " + experienceId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch experience reviews: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/pending")
    public ResponseEntity<?> getPendingReviews(@PathVariable Long userId) {
        try {
            if (userId == null || userId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            // Find completed bookings for this user that don't have reviews
            List<Booking> completedBookings = bookingRepository.findByTraveler_Id(userId)
                .stream()
                .filter(booking -> "COMPLETED".equals(booking.getStatus().toString()))
                .filter(booking -> !reviewRepository.existsByBooking_BookingId(booking.getBookingId()))
                .collect(Collectors.toList());

            // Create safe response objects
            List<Map<String, Object>> pendingReviews = completedBookings.stream().map(booking -> {
                Map<String, Object> bookingMap = new HashMap<>();
                bookingMap.put("bookingId", booking.getBookingId());
                bookingMap.put("confirmationCode", booking.getConfirmationCode());
                bookingMap.put("numberOfParticipants", booking.getNumberOfParticipants());
                bookingMap.put("totalAmount", booking.getTotalAmount());
                bookingMap.put("bookingDate", booking.getBookingDate());

                // Add experience info safely
                if (booking.getExperienceSchedule() != null && booking.getExperienceSchedule().getExperience() != null) {
                    Map<String, Object> experienceMap = new HashMap<>();
                    experienceMap.put("experienceId", booking.getExperienceSchedule().getExperience().getExperienceId());
                    experienceMap.put("title", booking.getExperienceSchedule().getExperience().getTitle());
                    experienceMap.put("location", booking.getExperienceSchedule().getExperience().getLocation());
                    experienceMap.put("country", booking.getExperienceSchedule().getExperience().getCountry());
                    experienceMap.put("coverPhotoUrl", booking.getExperienceSchedule().getExperience().getCoverPhotoUrl());
                    bookingMap.put("experience", experienceMap);
                }

                // Add schedule info safely
                if (booking.getExperienceSchedule() != null) {
                    Map<String, Object> scheduleMap = new HashMap<>();
                    scheduleMap.put("startDateTime", booking.getExperienceSchedule().getStartDateTime());
                    scheduleMap.put("endDateTime", booking.getExperienceSchedule().getEndDateTime());
                    bookingMap.put("experienceSchedule", scheduleMap);
                }

                return bookingMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(pendingReviews);
        } catch (Exception e) {
            System.err.println("Error retrieving pending reviews for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch pending reviews: " + e.getMessage()));
        }
    }

    @GetMapping("/experience/{experienceId}/stats")
    public ResponseEntity<?> getReviewStats(@PathVariable Long experienceId) {
        try {
            if (experienceId == null || experienceId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<Review> reviews = reviewRepository.findByExperience_ExperienceId(experienceId);
            
            if (reviews.isEmpty()) {
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalReviews", 0);
                stats.put("averageRating", 0.0);
                stats.put("ratingDistribution", Map.of(
                    "5", 0, "4", 0, "3", 0, "2", 0, "1", 0
                ));
                return ResponseEntity.ok(stats);
            }

            // Calculate statistics
            int totalReviews = reviews.size();
            double averageRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

            // Calculate rating distribution
            Map<Integer, Long> ratingCounts = reviews.stream()
                .collect(Collectors.groupingBy(Review::getRating, Collectors.counting()));

            Map<String, Object> ratingDistribution = new HashMap<>();
            for (int i = 1; i <= 5; i++) {
                ratingDistribution.put(String.valueOf(i), ratingCounts.getOrDefault(i, 0L));
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalReviews", totalReviews);
            stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0); // Round to 1 decimal
            stats.put("ratingDistribution", ratingDistribution);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error retrieving review stats for experience " + experienceId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch review statistics: " + e.getMessage()));
        }
    }

>>>>>>> Stashed changes
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        try {
            if (review == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Review savedReview = reviewRepository.save(review);
<<<<<<< Updated upstream
            return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
=======

            System.out.println("DEBUG: Successfully created review with ID: " + savedReview.getReviewId());
            System.out.println("DEBUG: Booking total amount: $" + booking.getTotalAmount() + ", Points to award: " + pointsToAward);
            
            // Award TripPoints for the review
            try {
                TripPoints tripPointsTransaction = tripPointsService.awardPointsForReview(
                    reviewerId, 
                    savedReview.getReviewId(),
                    pointsToAward
                );
                System.out.println("DEBUG: Awarded " + tripPointsTransaction.getPointsChange() + 
                    " TripPoints to user " + reviewerId + " for review " + savedReview.getReviewId());
            } catch (Exception e) {
                System.err.println("WARNING: Failed to award TripPoints for review " + savedReview.getReviewId() + ": " + e.getMessage());
                // Don't fail the review creation if TripPoints awarding fails
            }

            // Return safe response
            Map<String, Object> response = new HashMap<>();
            response.put("reviewId", savedReview.getReviewId());
            response.put("rating", savedReview.getRating());
            response.put("title", savedReview.getTitle());
            response.put("comment", savedReview.getComment());
            response.put("tripPointsEarned", savedReview.getTripPointsEarned());
            response.put("createdAt", savedReview.getCreatedAt());
            response.put("likeCount", savedReview.getLikeCount() != null ? savedReview.getLikeCount() : 0);
            response.put("success", true);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

>>>>>>> Stashed changes
        } catch (Exception e) {
            System.err.println("Error creating review: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(@PathVariable Long id, @RequestBody Review review) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (review == null) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!reviewRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            review.setReviewId(id);
            Review savedReview = reviewRepository.save(review);
            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            System.err.println("Error updating review with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest().build();
            }
            
            if (!reviewRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            reviewRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting review with ID " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{reviewId}/like")
    public ResponseEntity<?> likeReview(@PathVariable Long reviewId, @RequestParam Long userId) {
        try {
            if (reviewId == null || reviewId <= 0 || userId == null || userId <= 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid review ID or user ID"));
            }

            // Check if review exists
            Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
            if (!reviewOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Check if user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            // Check if user already liked this review
            Optional<ReviewLike> existingLike = reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId);
            if (existingLike.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User has already liked this review"));
            }

            // Create new like
            ReviewLike reviewLike = new ReviewLike();
            reviewLike.setReview(reviewOpt.get());
            reviewLike.setUser(userOpt.get());
            reviewLikeRepository.save(reviewLike);

            // Update like count on review
            Review review = reviewOpt.get();
            Integer currentLikeCount = review.getLikeCount();
            if (currentLikeCount == null) {
                currentLikeCount = 0;
            }
            review.setLikeCount(currentLikeCount + 1);
            reviewRepository.save(review);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("likeCount", review.getLikeCount());
            response.put("message", "Review liked successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error liking review " + reviewId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to like review: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{reviewId}/like")
    public ResponseEntity<?> unlikeReview(@PathVariable Long reviewId, @RequestParam Long userId) {
        try {
            if (reviewId == null || reviewId <= 0 || userId == null || userId <= 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid review ID or user ID"));
            }

            // Check if review exists
            Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
            if (!reviewOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Check if like exists
            Optional<ReviewLike> existingLike = reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId);
            if (!existingLike.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User has not liked this review"));
            }

            // Remove like
            reviewLikeRepository.delete(existingLike.get());

            // Update like count on review
            Review review = reviewOpt.get();
            Integer currentLikeCount = review.getLikeCount();
            if (currentLikeCount == null) {
                currentLikeCount = 0;
            }
            review.setLikeCount(Math.max(0, currentLikeCount - 1));
            reviewRepository.save(review);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("likeCount", review.getLikeCount());
            response.put("message", "Review unliked successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error unliking review " + reviewId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to unlike review: " + e.getMessage()));
        }
    }

    @GetMapping("/{reviewId}/like-status")
    public ResponseEntity<?> getLikeStatus(@PathVariable Long reviewId, @RequestParam Long userId) {
        try {
            if (reviewId == null || reviewId <= 0 || userId == null || userId <= 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid review ID or user ID"));
            }

            // Check if user has liked this review
            boolean hasLiked = reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId).isPresent();

            // Get current like count
            Long likeCount = reviewLikeRepository.countByReviewId(reviewId);

            Map<String, Object> response = new HashMap<>();
            response.put("hasLiked", hasLiked);
            response.put("likeCount", likeCount);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting like status for review " + reviewId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get like status: " + e.getMessage()));
        }
    }
}
