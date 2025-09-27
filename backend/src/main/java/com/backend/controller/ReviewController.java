package com.backend.controller;

import com.backend.entity.Review;
import com.backend.entity.Booking;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.repository.ReviewRepository;
import com.backend.repository.BookingRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

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

            // Create new review
            Review review = new Review();
            review.setBooking(booking);
            review.setReviewer(reviewer);
            review.setExperience(experience);
            review.setRating(rating);
            review.setTitle(title);
            review.setComment(comment);
            review.setTripPointsEarned(10); // Standard points for review
            review.setCreatedAt(LocalDateTime.now());
            review.setUpdatedAt(LocalDateTime.now());

            Review savedReview = reviewRepository.save(review);

            System.out.println("DEBUG: Successfully created review with ID: " + savedReview.getReviewId());

            // Return safe response
            Map<String, Object> response = new HashMap<>();
            response.put("reviewId", savedReview.getReviewId());
            response.put("rating", savedReview.getRating());
            response.put("title", savedReview.getTitle());
            response.put("comment", savedReview.getComment());
            response.put("tripPointsEarned", savedReview.getTripPointsEarned());
            response.put("createdAt", savedReview.getCreatedAt());
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
}
