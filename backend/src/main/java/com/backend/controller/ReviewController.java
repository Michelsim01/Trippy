package com.backend.controller;

import com.backend.entity.Review;
import com.backend.entity.Booking;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.entity.TripPoints;
import com.backend.repository.ReviewRepository;
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
