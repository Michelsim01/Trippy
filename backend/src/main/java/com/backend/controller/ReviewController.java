package com.backend.controller;

import com.backend.entity.Review;
import com.backend.entity.Booking;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.entity.TripPoints;
import com.backend.repository.ReviewRepository;
import com.backend.entity.ReviewLike;
import com.backend.entity.Booking;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.entity.TripPoints;
import com.backend.repository.BookingRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.service.TripPointsService;
import com.backend.repository.ReviewLikeRepository;
import com.backend.repository.BookingRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.service.TripPointsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {
    @Autowired
    private ReviewRepository reviewRepository;
    
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

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Map<String, Object> reviewData) {
        try {
            System.out.println("DEBUG: Received review data: " + reviewData);

            // Validate required fields
            if (reviewData == null ||
                !reviewData.containsKey("bookingId") ||
                !reviewData.containsKey("reviewerId") ||
                !reviewData.containsKey("rating")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required fields: bookingId, reviewerId, rating"));
            }

            // Extract data
            Long bookingId = Long.valueOf(reviewData.get("bookingId").toString());
            Long reviewerId = Long.valueOf(reviewData.get("reviewerId").toString());
            Integer rating = Integer.valueOf(reviewData.get("rating").toString());
            String title = (String) reviewData.get("title");
            String comment = (String) reviewData.get("comment");

            // Validate rating range
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Rating must be between 1 and 5"));
            }

            // Fetch required entities
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (!bookingOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Booking not found"));
            }

            Optional<User> reviewerOpt = userRepository.findById(reviewerId);
            if (!reviewerOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Reviewer not found"));
            }

            Booking booking = bookingOpt.get();
            User reviewer = reviewerOpt.get();

            // Get experience from booking
            Experience experience = booking.getExperienceSchedule().getExperience();
            if (experience == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Experience not found for this booking"));
            }

            // Verify booking is completed
            if (!"COMPLETED".equals(booking.getStatus().toString())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Can only review completed bookings"));
            }

            // Check if review already exists for this booking
            if (reviewRepository.existsByBooking_BookingId(bookingId)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Review already exists for this booking"));
            }

            // Calculate TripPoints based on booking total amount (rounded down to whole number)
            Integer pointsToAward = booking.getTotalAmount().intValue(); // This automatically rounds down
            
            // Create new review
            Review review = new Review();
            review.setBooking(booking);
            review.setReviewer(reviewer);
            review.setExperience(experience);
            review.setRating(rating);
            review.setTitle(title);
            review.setComment(comment);
            review.setTripPointsEarned(pointsToAward); // Points based on booking amount
            review.setCreatedAt(LocalDateTime.now());
            review.setUpdatedAt(LocalDateTime.now());

            Review savedReview = reviewRepository.save(review);

            System.out.println("DEBUG: Successfully created review with ID: " + savedReview.getReviewId());
            System.out.println("DEBUG: Booking total amount: $" + booking.getTotalAmount() + ", Points to award: " + pointsToAward);

            // Update experience rating statistics
            try {
                updateExperienceRatings(experience, rating);

                // Update guide's average rating after updating experience rating
                if (experience.getGuide() != null) {
                    updateGuideAverageRating(experience.getGuide());
                }
            } catch (Exception e) {
                System.err.println("WARNING: Failed to update experience ratings: " + e.getMessage());
                // Don't fail the review creation if rating update fails
            }

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
            response.put("createdAt", savedReview.getCreatedAt().toString());
            response.put("success", true);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            System.err.println("Error creating review: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create review: " + e.getMessage()));
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

    /**
     * Helper method to update experience rating statistics after a review is created
     * Increments totalStars, totalReviews, and recalculates averageRating
     */
    private void updateExperienceRatings(Experience experience, Integer newRating) {
        // Get current values or initialize to 0
        java.math.BigDecimal currentTotalStars = experience.getTotalStars() != null
            ? experience.getTotalStars()
            : java.math.BigDecimal.ZERO;

        Integer currentTotalReviews = experience.getTotalReviews() != null
            ? experience.getTotalReviews()
            : 0;

        // Add the new rating to total stars
        java.math.BigDecimal newTotalStars = currentTotalStars.add(java.math.BigDecimal.valueOf(newRating));

        // Increment total reviews
        Integer newTotalReviews = currentTotalReviews + 1;

        // Calculate new average rating
        java.math.BigDecimal newAverageRating = newTotalStars.divide(
            java.math.BigDecimal.valueOf(newTotalReviews),
            2,
            java.math.RoundingMode.HALF_UP
        );

        // Update experience
        experience.setTotalStars(newTotalStars);
        experience.setTotalReviews(newTotalReviews);
        experience.setAverageRating(newAverageRating);
        experience.setUpdatedAt(LocalDateTime.now());

        experienceRepository.save(experience);

        System.out.println("DEBUG: Updated experience " + experience.getExperienceId() + " ratings - " +
            "Total Stars: " + newTotalStars + ", " +
            "Total Reviews: " + newTotalReviews + ", " +
            "Average Rating: " + newAverageRating);
    }

    /**
     * Helper method to update guide's average rating based on all their experiences
     * Calculates the average of all experience ratings for this guide
     * Only includes experiences with ratings > 0 (experiences with 0 are unrated)
     */
    private void updateGuideAverageRating(User guide) {
        // Get all experiences for this guide
        List<Experience> guideExperiences = experienceRepository.findByGuide_Id(guide.getId());

        // Filter to only include experiences that have ratings (averageRating > 0)
        // An experience with 0 rating is unrated (since users must give at least 1 star)
        List<Experience> ratedExperiences = guideExperiences.stream()
            .filter(exp -> exp.getAverageRating() != null &&
                          exp.getAverageRating().compareTo(java.math.BigDecimal.ZERO) > 0)
            .collect(java.util.stream.Collectors.toList());

        if (ratedExperiences.isEmpty()) {
            guide.setAverageRating(java.math.BigDecimal.ZERO);
        } else {
            // Calculate sum of all rated experience average ratings
            java.math.BigDecimal sumOfAverageRatings = ratedExperiences.stream()
                .map(Experience::getAverageRating)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            // Calculate average (sum of experience ratings / number of rated experiences)
            java.math.BigDecimal guideAverageRating = sumOfAverageRatings.divide(
                java.math.BigDecimal.valueOf(ratedExperiences.size()),
                2,
                java.math.RoundingMode.HALF_UP
            );

            guide.setAverageRating(guideAverageRating);
        }

        guide.setUpdatedAt(LocalDateTime.now());
        userRepository.save(guide);

        System.out.println("DEBUG: Updated guide " + guide.getId() + " average rating to " +
            guide.getAverageRating() + " (based on " + ratedExperiences.size() +
            " rated experiences out of " + guideExperiences.size() + " total)");
    }
}