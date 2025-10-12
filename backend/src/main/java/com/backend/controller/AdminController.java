package com.backend.controller;

import com.backend.repository.BookingRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.repository.ReviewRepository;
import com.backend.repository.ExperienceScheduleRepository;
import com.backend.repository.TransactionRepository;
import com.backend.repository.KycDocumentRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import com.backend.entity.ExperienceStatus;
import com.backend.entity.ExperienceCategory;
import com.backend.entity.BookingStatus;
import com.backend.entity.TransactionStatus;
import com.backend.entity.KycStatus;
import com.backend.entity.StatusType;
import com.backend.entity.User;
import com.backend.entity.Experience;
import com.backend.entity.Booking;
import com.backend.entity.Transaction;
import com.backend.entity.KycDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AdminController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private KycDocumentRepository kycDocumentRepository;

    /**
     * Helper method to get the currently authenticated admin user ID
     * 
     * @return Admin user ID if authenticated, null otherwise
     */
    private Long getCurrentAdminUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("=== DEBUG: getCurrentAdminUserId ===");
            System.out.println("Authentication: " + authentication);
            System.out.println("Is authenticated: " + (authentication != null && authentication.isAuthenticated()));
            
            if (authentication != null && authentication.isAuthenticated()) {
                System.out.println("Principal type: " + authentication.getPrincipal().getClass().getName());
                System.out.println("Principal: " + authentication.getPrincipal());
                
                if (authentication.getPrincipal() instanceof UserDetails) {
                    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                    String email = userDetails.getUsername();
                    System.out.println("Email from UserDetails: " + email);

                    Optional<User> userOpt = userRepository.findByEmailAndIsActive(email, true);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        System.out.println("Found user: " + user.getEmail() + ", isAdmin: " + user.getIsAdmin() + ", ID: " + user.getId());
                        if (user.getIsAdmin()) {
                            System.out.println("Returning admin user ID: " + user.getId());
                            return user.getId();
                        } else {
                            System.out.println("User is not an admin!");
                        }
                    } else {
                        System.out.println("No user found for email: " + email);
                        // Let's also try without the isActive filter
                        Optional<User> userOpt2 = userRepository.findByEmail(email);
                        if (userOpt2.isPresent()) {
                            User user2 = userOpt2.get();
                            System.out.println("Found user (inactive): " + user2.getEmail() + ", isAdmin: " + user2.getIsAdmin() + ", isActive: " + user2.getIsActive());
                        }
                    }
                }
            }
            System.out.println("=== END DEBUG ===");
        } catch (Exception e) {
            System.err.println("Error getting authenticated admin user: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Debug endpoint to check admin user status
     */
    @GetMapping("/debug/admin-status")
    public ResponseEntity<Map<String, Object>> getAdminStatus() {
        try {
            Long adminUserId = getCurrentAdminUserId();
            Map<String, Object> response = new HashMap<>();
            response.put("adminUserId", adminUserId);
            
            // Also check the user directly
            Optional<User> userOpt = userRepository.findByEmail("totallyregi@gmail.com");
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                response.put("userFound", true);
                response.put("userEmail", user.getEmail());
                response.put("userIsAdmin", user.getIsAdmin());
                response.put("userIsActive", user.getIsActive());
                response.put("userId", user.getId());
            } else {
                response.put("userFound", false);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get dashboard metrics for admin panel
     */
    @GetMapping("/dashboard/metrics")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        try {
            LocalDate today = LocalDate.now();
            
            // Calculate date ranges
            LocalDate thisMonthStart = today.minusMonths(1); // 1 month ago from today
            LocalDate lastMonthStart = today.minusMonths(2); // 2 months ago from today
            LocalDate lastMonthEnd = today.minusMonths(1); // 1 month ago from today

            // Convert to LocalDateTime for database queries
            LocalDateTime thisMonthStartDateTime = thisMonthStart.atStartOfDay();
            LocalDateTime thisMonthEndDateTime = today.atTime(23, 59, 59);
            LocalDateTime lastMonthStartDateTime = lastMonthStart.atStartOfDay();
            LocalDateTime lastMonthEndDateTime = lastMonthEnd.atTime(23, 59, 59);

            // Calculate monthly revenue
            BigDecimal thisMonthRevenue = bookingRepository.calculateRevenueByDateRange(
                thisMonthStartDateTime, thisMonthEndDateTime);
            BigDecimal lastMonthRevenue = bookingRepository.calculateRevenueByDateRange(
                lastMonthStartDateTime, lastMonthEndDateTime);

            // Calculate percentage change
            double revenueChangePercent = 0.0;
            if (lastMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal difference = thisMonthRevenue.subtract(lastMonthRevenue);
                revenueChangePercent = difference.divide(lastMonthRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
            } else if (thisMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
                revenueChangePercent = 100.0; // 100% increase if last month was 0
            }

            // Get other metrics
            Long totalUsers = userRepository.countByIsAdmin(false); // Exclude admins
            Long totalBookings = bookingRepository.count();
            Long activeExperiences = experienceRepository.countByStatus(ExperienceStatus.ACTIVE);

            // Calculate month-over-month changes for other metrics (excluding admins)
            Long thisMonthUsers = userRepository.countByCreatedAtBetweenAndIsAdmin(thisMonthStartDateTime, thisMonthEndDateTime, false);
            Long lastMonthUsers = userRepository.countByCreatedAtBetweenAndIsAdmin(lastMonthStartDateTime, lastMonthEndDateTime, false);
            double userChangePercent = calculatePercentageChange(lastMonthUsers, thisMonthUsers);

            Long thisMonthBookings = bookingRepository.countByCreatedAtBetween(thisMonthStartDateTime, thisMonthEndDateTime);
            Long lastMonthBookings = bookingRepository.countByCreatedAtBetween(lastMonthStartDateTime, lastMonthEndDateTime);
            double bookingChangePercent = calculatePercentageChange(lastMonthBookings, thisMonthBookings);

            // Build response
            Map<String, Object> response = new HashMap<>();
            
            // Revenue metrics
            Map<String, Object> revenueMetrics = new HashMap<>();
            revenueMetrics.put("current", thisMonthRevenue.doubleValue());
            revenueMetrics.put("changePercent", Math.round(revenueChangePercent * 10.0) / 10.0);
            revenueMetrics.put("period", "last month");
            response.put("monthlyRevenue", revenueMetrics);

            // User metrics
            Map<String, Object> userMetrics = new HashMap<>();
            userMetrics.put("current", totalUsers);
            userMetrics.put("changePercent", Math.round(userChangePercent * 10.0) / 10.0);
            userMetrics.put("period", "last month");
            response.put("totalUsers", userMetrics);

            // Booking metrics
            Map<String, Object> bookingMetrics = new HashMap<>();
            bookingMetrics.put("current", totalBookings);
            bookingMetrics.put("changePercent", Math.round(bookingChangePercent * 10.0) / 10.0);
            bookingMetrics.put("period", "last month");
            response.put("totalBookings", bookingMetrics);

            // Experience metrics
            Map<String, Object> experienceMetrics = new HashMap<>();
            experienceMetrics.put("current", activeExperiences);
            experienceMetrics.put("changePercent", 2.1); // Placeholder for now
            experienceMetrics.put("period", "last month");
            response.put("activeExperiences", experienceMetrics);

            // Add date range info for debugging
            response.put("dateRanges", Map.of(
                "thisMonth", Map.of("start", thisMonthStart.toString(), "end", today.toString()),
                "lastMonth", Map.of("start", lastMonthStart.toString(), "end", lastMonthEnd.toString())
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error calculating dashboard metrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to calculate dashboard metrics: " + e.getMessage()));
        }
    }

    /**
     * Get user management metrics for admin panel
     */
    @GetMapping("/users/metrics")
    public ResponseEntity<Map<String, Object>> getUserManagementMetrics() {
        try {
            // Total Users: All users excluding admins
            Long totalUsers = userRepository.countByIsAdmin(false);
            
            // Active Users: Non-admins with is_active = true
            Long activeUsers = userRepository.countByIsAdminAndIsActive(false, true);
            
            // Tour Guides: Users with can_create_experiences = true
            Long tourGuides = userRepository.countByCanCreateExperiences(true);
            
            // Suspended Users: Users with is_active = false
            Long suspendedUsers = userRepository.countByIsActive(false);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalUsers", totalUsers);
            response.put("activeUsers", activeUsers);
            response.put("tourGuides", tourGuides);
            response.put("suspendedUsers", suspendedUsers);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error calculating user management metrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to calculate user management metrics: " + e.getMessage()));
        }
    }

    /**
     * Get all users with booking counts for admin panel
     */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsersWithBookingCounts() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> usersWithCounts = new ArrayList<>();
            
            for (User user : users) {
                // Skip admin users
                if (user.getIsAdmin()) {
                    continue;
                }
                
                // Count bookings for this user
                Long bookingCount = bookingRepository.countByTraveler_Id(user.getId());
                
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", user.getId());
                userData.put("firstName", user.getFirstName());
                userData.put("lastName", user.getLastName());
                userData.put("email", user.getEmail());
                userData.put("isActive", user.getIsActive());
                userData.put("canCreateExperiences", user.getCanCreateExperiences());
                userData.put("createdAt", user.getCreatedAt());
                userData.put("bookingCount", bookingCount);
                
                usersWithCounts.add(userData);
            }
            
            return ResponseEntity.ok(usersWithCounts);
            
        } catch (Exception e) {
            System.err.println("Error fetching users with booking counts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Update user details
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userData) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // Update user fields
            if (userData.containsKey("firstName")) {
                user.setFirstName((String) userData.get("firstName"));
            }
            if (userData.containsKey("lastName")) {
                user.setLastName((String) userData.get("lastName"));
            }
            if (userData.containsKey("email")) {
                user.setEmail((String) userData.get("email"));
            }
            if (userData.containsKey("canCreateExperiences")) {
                user.setCanCreateExperiences((Boolean) userData.get("canCreateExperiences"));
            }
            if (userData.containsKey("isActive")) {
                user.setIsActive((Boolean) userData.get("isActive"));
            }
            
            User savedUser = userRepository.save(user);
            
            // Return updated user data with booking count
            Long bookingCount = bookingRepository.countByTraveler_Id(savedUser.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("firstName", savedUser.getFirstName());
            response.put("lastName", savedUser.getLastName());
            response.put("email", savedUser.getEmail());
            response.put("isActive", savedUser.getIsActive());
            response.put("canCreateExperiences", savedUser.getCanCreateExperiences());
            response.put("createdAt", savedUser.getCreatedAt());
            response.put("bookingCount", bookingCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error updating user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }

    /**
     * Suspend user (set isActive to false)
     */
    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<Map<String, Object>> suspendUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            user.setIsActive(false);
            User savedUser = userRepository.save(user);
            
            // Return updated user data with booking count
            Long bookingCount = bookingRepository.countByTraveler_Id(savedUser.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("firstName", savedUser.getFirstName());
            response.put("lastName", savedUser.getLastName());
            response.put("email", savedUser.getEmail());
            response.put("isActive", savedUser.getIsActive());
            response.put("canCreateExperiences", savedUser.getCanCreateExperiences());
            response.put("createdAt", savedUser.getCreatedAt());
            response.put("bookingCount", bookingCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error suspending user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to suspend user: " + e.getMessage()));
        }
    }

    /**
     * Activate user (set isActive to true)
     */
    @PutMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, Object>> activateUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            user.setIsActive(true);
            User savedUser = userRepository.save(user);
            
            // Return updated user data with booking count
            Long bookingCount = bookingRepository.countByTraveler_Id(savedUser.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("firstName", savedUser.getFirstName());
            response.put("lastName", savedUser.getLastName());
            response.put("email", savedUser.getEmail());
            response.put("isActive", savedUser.getIsActive());
            response.put("canCreateExperiences", savedUser.getCanCreateExperiences());
            response.put("createdAt", savedUser.getCreatedAt());
            response.put("bookingCount", bookingCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error activating user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to activate user: " + e.getMessage()));
        }
    }

    /**
     * Delete user account
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            userRepository.deleteById(id);
            
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
            
        } catch (Exception e) {
            System.err.println("Error deleting user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    /**
     * Get revenue chart data for the last 6 months
     */
    @GetMapping("/charts/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueChartData() {
        try {
            LocalDate today = LocalDate.now();
            List<Map<String, Object>> chartData = new ArrayList<>();
            
            // Get revenue data for the last 6 months
            for (int i = 5; i >= 0; i--) {
                LocalDate monthStart = today.minusMonths(i).withDayOfMonth(1);
                LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
                
                LocalDateTime startDateTime = monthStart.atStartOfDay();
                LocalDateTime endDateTime = monthEnd.atTime(23, 59, 59);
                
                BigDecimal revenue = bookingRepository.calculateRevenueByDateRange(startDateTime, endDateTime);
                
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("month", monthStart.getMonth().name());
                monthData.put("year", monthStart.getYear());
                monthData.put("revenue", revenue.doubleValue());
                monthData.put("label", monthStart.getMonth().name().substring(0, 3) + " " + monthStart.getYear());
                
                chartData.add(monthData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", chartData);
            response.put("totalRevenue", chartData.stream()
                .mapToDouble(data -> (Double) data.get("revenue"))
                .sum());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error fetching revenue chart data: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch revenue chart data: " + e.getMessage()));
        }
    }

    /**
     * Get tour categories chart data
     */
    @GetMapping("/charts/categories")
    public ResponseEntity<Map<String, Object>> getCategoriesChartData() {
        try {
            // Get experience categories with counts
            List<Object[]> rawData = experienceRepository.findCategoryCounts();
            List<Map<String, Object>> categoryData = new ArrayList<>();
            
            for (Object[] row : rawData) {
                Map<String, Object> categoryInfo = new HashMap<>();
                categoryInfo.put("category", row[0]);
                categoryInfo.put("count", row[1]);
                categoryData.add(categoryInfo);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", categoryData);
            response.put("totalCategories", categoryData.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error fetching categories chart data: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch categories chart data: " + e.getMessage()));
        }
    }

    /**
     * Get top performing experiences
     */
    @GetMapping("/dashboard/top-experiences")
    public ResponseEntity<List<Map<String, Object>>> getTopPerformingExperiences() {
        try {
            List<Object[]> rawData = experienceRepository.findTopPerformingExperiences();
            List<Map<String, Object>> experiences = new ArrayList<>();
            
            for (Object[] row : rawData) {
                Map<String, Object> experience = new HashMap<>();
                experience.put("id", row[0]);
                experience.put("title", row[1]);
                experience.put("category", row[2]);
                experience.put("bookingCount", row[3]);
                experience.put("totalRevenue", row[4]);
                experience.put("averageRating", row[5]);
                experiences.add(experience);
            }
            
            return ResponseEntity.ok(experiences);
            
        } catch (Exception e) {
            System.err.println("Error fetching top performing experiences: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get pending experiences awaiting approval
     */
    @GetMapping("/dashboard/pending-experiences")
    public ResponseEntity<List<Map<String, Object>>> getPendingExperiences() {
        try {
            List<Object[]> rawData = experienceRepository.findPendingExperiences();
            List<Map<String, Object>> experiences = new ArrayList<>();
            
            for (Object[] row : rawData) {
                Map<String, Object> experience = new HashMap<>();
                experience.put("id", row[0]);
                experience.put("title", row[1]);
                experience.put("category", row[2]);
                experience.put("location", row[3]);
                experience.put("guideName", row[4]);
                experience.put("submittedAt", row[5]);
                experiences.add(experience);
            }
            
            return ResponseEntity.ok(experiences);
            
        } catch (Exception e) {
            System.err.println("Error fetching pending experiences: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get experience management metrics
     */
    @GetMapping("/experiences/metrics")
    public ResponseEntity<Map<String, Object>> getExperienceManagementMetrics() {
        try {
            // Get total experiences count
            Long totalExperiences = experienceRepository.count();
            
            // Get active experiences count
            Long activeExperiences = experienceRepository.countByStatus(ExperienceStatus.ACTIVE);
            if (activeExperiences == null) activeExperiences = 0L;
            
            // Get inactive experiences count
            Long inactiveExperiences = experienceRepository.countByStatus(ExperienceStatus.INACTIVE);
            if (inactiveExperiences == null) inactiveExperiences = 0L;
            
            // Get suspended experiences count
            Long suspendedExperiences = experienceRepository.countByStatus(ExperienceStatus.SUSPENDED);
            if (suspendedExperiences == null) suspendedExperiences = 0L;
            
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalExperiences", totalExperiences);
            metrics.put("activeExperiences", activeExperiences);
            metrics.put("inactiveExperiences", inactiveExperiences);
            metrics.put("suspendedExperiences", suspendedExperiences);
            
            return ResponseEntity.ok(metrics);
            
        } catch (Exception e) {
            System.err.println("Error fetching experience management metrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch experience management metrics: " + e.getMessage()));
        }
    }

    /**
     * Get all experiences with review and booking counts for admin panel
     */
    @GetMapping("/experiences")
    public ResponseEntity<List<Map<String, Object>>> getAllExperiencesWithCounts() {
        try {
            List<Experience> experiences = experienceRepository.findAll();
            List<Map<String, Object>> experiencesWithCounts = new ArrayList<>();
            
            for (Experience experience : experiences) {
                try {
                    // Count reviews for this experience
                    Long reviewCount = reviewRepository.countByExperienceId(experience.getExperienceId());
                    if (reviewCount == null) reviewCount = 0L;
                    
                    // Count bookings for this experience through schedules
                    Long bookingCount = bookingRepository.countByExperienceId(experience.getExperienceId());
                    if (bookingCount == null) bookingCount = 0L;
                    
                    Map<String, Object> experienceData = new HashMap<>();
                    experienceData.put("id", experience.getExperienceId());
                    experienceData.put("title", experience.getTitle() != null ? experience.getTitle() : "");
                    experienceData.put("location", experience.getLocation() != null ? experience.getLocation() : "");
                    experienceData.put("country", experience.getCountry() != null ? experience.getCountry() : "");
                    experienceData.put("duration", experience.getDuration() != null ? experience.getDuration() : BigDecimal.ZERO);
                    experienceData.put("participantsAllowed", experience.getParticipantsAllowed() != null ? experience.getParticipantsAllowed() : 0);
                    // Handle guide data safely
                    if (experience.getGuide() != null) {
                        Map<String, Object> guideData = new HashMap<>();
                        guideData.put("id", experience.getGuide().getId());
                        guideData.put("firstName", experience.getGuide().getFirstName());
                        guideData.put("lastName", experience.getGuide().getLastName());
                        guideData.put("email", experience.getGuide().getEmail());
                        experienceData.put("guide", guideData);
                    } else {
                        experienceData.put("guide", null);
                    }
                    experienceData.put("category", experience.getCategory() != null ? experience.getCategory().toString() : "");
                    experienceData.put("price", experience.getPrice() != null ? experience.getPrice() : BigDecimal.ZERO);
                    experienceData.put("averageRating", experience.getAverageRating() != null ? experience.getAverageRating() : BigDecimal.ZERO);
                    experienceData.put("reviewCount", reviewCount);
                    experienceData.put("bookingCount", bookingCount);
                    experienceData.put("status", experience.getStatus() != null ? experience.getStatus().toString() : "");
                    experienceData.put("createdAt", experience.getCreatedAt());
                    
                    experiencesWithCounts.add(experienceData);
                } catch (Exception ex) {
                    System.err.println("Error processing experience " + experience.getExperienceId() + ": " + ex.getMessage());
                    ex.printStackTrace();
                    // Continue with next experience instead of failing completely
                }
            }
            
            return ResponseEntity.ok(experiencesWithCounts);
            
        } catch (Exception e) {
            System.err.println("Error fetching experiences with counts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Update experience details
     */
    @PutMapping("/experiences/{experienceId}")
    public ResponseEntity<Map<String, Object>> updateExperience(@PathVariable Long experienceId, @RequestBody Map<String, Object> experienceData) {
        try {
            Experience experience = experienceRepository.findById(experienceId).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }

            // Update experience fields
            if (experienceData.containsKey("title")) {
                experience.setTitle((String) experienceData.get("title"));
            }
            if (experienceData.containsKey("location")) {
                experience.setLocation((String) experienceData.get("location"));
            }
            if (experienceData.containsKey("country")) {
                experience.setCountry((String) experienceData.get("country"));
            }
            if (experienceData.containsKey("duration")) {
                Object durationObj = experienceData.get("duration");
                if (durationObj instanceof Number) {
                    experience.setDuration(new BigDecimal(durationObj.toString()));
                } else if (durationObj instanceof String) {
                    try {
                        experience.setDuration(new BigDecimal((String) durationObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid duration format: " + durationObj));
                    }
                }
            }
            if (experienceData.containsKey("participantsAllowed")) {
                Object participantsObj = experienceData.get("participantsAllowed");
                if (participantsObj instanceof Number) {
                    experience.setParticipantsAllowed(((Number) participantsObj).intValue());
                } else if (participantsObj instanceof String) {
                    try {
                        experience.setParticipantsAllowed(Integer.parseInt((String) participantsObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid participants format: " + participantsObj));
                    }
                }
            }
            if (experienceData.containsKey("category")) {
                String categoryStr = (String) experienceData.get("category");
                if (categoryStr != null && !categoryStr.isEmpty()) {
                    try {
                        experience.setCategory(ExperienceCategory.valueOf(categoryStr));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid category: " + categoryStr));
                    }
                }
            }
            if (experienceData.containsKey("price")) {
                Object priceObj = experienceData.get("price");
                if (priceObj instanceof Number) {
                    experience.setPrice(new BigDecimal(priceObj.toString()));
                } else if (priceObj instanceof String) {
                    try {
                        experience.setPrice(new BigDecimal((String) priceObj));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid price format: " + priceObj));
                    }
                }
            }

            Experience updatedExperience = experienceRepository.save(experience);

            // Return updated experience with counts
            Long reviewCount = reviewRepository.countByExperienceId(updatedExperience.getExperienceId());
            if (reviewCount == null) reviewCount = 0L;
            Long bookingCount = bookingRepository.countByExperienceId(updatedExperience.getExperienceId());
            if (bookingCount == null) bookingCount = 0L;

            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedExperience.getExperienceId());
            response.put("title", updatedExperience.getTitle());
            response.put("location", updatedExperience.getLocation());
            response.put("country", updatedExperience.getCountry());
            response.put("duration", updatedExperience.getDuration());
            response.put("participantsAllowed", updatedExperience.getParticipantsAllowed());
            response.put("category", updatedExperience.getCategory().toString());
            response.put("price", updatedExperience.getPrice());
            response.put("averageRating", updatedExperience.getAverageRating());
            response.put("reviewCount", reviewCount);
            response.put("bookingCount", bookingCount);
            response.put("status", updatedExperience.getStatus().toString());
            response.put("createdAt", updatedExperience.getCreatedAt());

            if (updatedExperience.getGuide() != null) {
                Map<String, Object> guideData = new HashMap<>();
                guideData.put("id", updatedExperience.getGuide().getId());
                guideData.put("firstName", updatedExperience.getGuide().getFirstName());
                guideData.put("lastName", updatedExperience.getGuide().getLastName());
                guideData.put("email", updatedExperience.getGuide().getEmail());
                response.put("guide", guideData);
            } else {
                response.put("guide", null);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error updating experience: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update experience: " + e.getMessage()));
        }
    }

    /**
     * Update experience status
     */
    @PatchMapping("/experiences/{experienceId}/status")
    public ResponseEntity<Map<String, Object>> updateExperienceStatus(@PathVariable Long experienceId, @RequestBody Map<String, String> request) {
        try {
            Experience experience = experienceRepository.findById(experienceId).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }

            String statusStr = request.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }

            try {
                ExperienceStatus newStatus = ExperienceStatus.valueOf(statusStr);
                experience.setStatus(newStatus);
                Experience updatedExperience = experienceRepository.save(experience);

                // Return updated experience with counts
                Long reviewCount = reviewRepository.countByExperienceId(updatedExperience.getExperienceId());
                if (reviewCount == null) reviewCount = 0L;
                Long bookingCount = bookingRepository.countByExperienceId(updatedExperience.getExperienceId());
                if (bookingCount == null) bookingCount = 0L;

                Map<String, Object> response = new HashMap<>();
                response.put("id", updatedExperience.getExperienceId());
                response.put("title", updatedExperience.getTitle());
                response.put("location", updatedExperience.getLocation());
                response.put("country", updatedExperience.getCountry());
                response.put("duration", updatedExperience.getDuration());
                response.put("participantsAllowed", updatedExperience.getParticipantsAllowed());
                response.put("category", updatedExperience.getCategory().toString());
                response.put("price", updatedExperience.getPrice());
                response.put("averageRating", updatedExperience.getAverageRating());
                response.put("reviewCount", reviewCount);
                response.put("bookingCount", bookingCount);
                response.put("status", updatedExperience.getStatus().toString());

                if (updatedExperience.getGuide() != null) {
                    Map<String, Object> guideData = new HashMap<>();
                    guideData.put("id", updatedExperience.getGuide().getId());
                    guideData.put("firstName", updatedExperience.getGuide().getFirstName());
                    guideData.put("lastName", updatedExperience.getGuide().getLastName());
                    guideData.put("email", updatedExperience.getGuide().getEmail());
                    response.put("guide", guideData);
                } else {
                    response.put("guide", null);
                }

                return ResponseEntity.ok(response);

            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
            }

        } catch (Exception e) {
            System.err.println("Error updating experience status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update experience status: " + e.getMessage()));
        }
    }

    /**
     * Suspend experience
     */
    @PatchMapping("/experiences/{experienceId}/suspend")
    public ResponseEntity<Map<String, Object>> suspendExperience(@PathVariable Long experienceId) {
        try {
            Experience experience = experienceRepository.findById(experienceId).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }

            experience.setStatus(ExperienceStatus.SUSPENDED);
            Experience updatedExperience = experienceRepository.save(experience);

            // Return updated experience with counts
            Long reviewCount = reviewRepository.countByExperienceId(updatedExperience.getExperienceId());
            if (reviewCount == null) reviewCount = 0L;
            Long bookingCount = bookingRepository.countByExperienceId(updatedExperience.getExperienceId());
            if (bookingCount == null) bookingCount = 0L;

            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedExperience.getExperienceId());
            response.put("title", updatedExperience.getTitle());
            response.put("location", updatedExperience.getLocation());
            response.put("country", updatedExperience.getCountry());
            response.put("duration", updatedExperience.getDuration());
            response.put("participantsAllowed", updatedExperience.getParticipantsAllowed());
            response.put("category", updatedExperience.getCategory().toString());
            response.put("price", updatedExperience.getPrice());
            response.put("averageRating", updatedExperience.getAverageRating());
            response.put("reviewCount", reviewCount);
            response.put("bookingCount", bookingCount);
            response.put("status", updatedExperience.getStatus().toString());
            response.put("createdAt", updatedExperience.getCreatedAt());

            if (updatedExperience.getGuide() != null) {
                Map<String, Object> guideData = new HashMap<>();
                guideData.put("id", updatedExperience.getGuide().getId());
                guideData.put("firstName", updatedExperience.getGuide().getFirstName());
                guideData.put("lastName", updatedExperience.getGuide().getLastName());
                guideData.put("email", updatedExperience.getGuide().getEmail());
                response.put("guide", guideData);
            } else {
                response.put("guide", null);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error suspending experience: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to suspend experience: " + e.getMessage()));
        }
    }

    /**
     * Delete experience
     */
    @DeleteMapping("/experiences/{experienceId}")
    public ResponseEntity<Map<String, Object>> deleteExperience(@PathVariable Long experienceId) {
        try {
            Experience experience = experienceRepository.findById(experienceId).orElse(null);
            if (experience == null) {
                return ResponseEntity.notFound().build();
            }

            // Check if experience has bookings
            Long bookingCount = bookingRepository.countByExperienceId(experienceId);
            if (bookingCount != null && bookingCount > 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete experience with existing bookings"));
            }

            // Delete experience schedules first to avoid foreign key constraint issues
            // This will also cascade delete any bookings associated with those schedules
            experienceScheduleRepository.deleteByExperienceExperienceId(experienceId);
            
            // Now delete the experience (this will cascade delete reviews, wishlist items, etc.)
            experienceRepository.delete(experience);
            
            return ResponseEntity.ok(Map.of("message", "Experience deleted successfully"));

        } catch (Exception e) {
            System.err.println("Error deleting experience: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete experience: " + e.getMessage()));
        }
    }

    /**
     * Get booking management metrics
     */
    @GetMapping("/bookings/metrics")
    public ResponseEntity<Map<String, Object>> getBookingManagementMetrics() {
        try {
            long totalBookings = bookingRepository.count();
            long paidBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED) + bookingRepository.countByStatus(BookingStatus.COMPLETED);
            long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
            long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalBookings", totalBookings);
            metrics.put("paidBookings", paidBookings);
            metrics.put("pendingBookings", pendingBookings);
            metrics.put("cancelledBookings", cancelledBookings);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            System.err.println("Error fetching booking metrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch booking metrics: " + e.getMessage()));
        }
    }

    /**
     * Get all bookings with traveler and experience details for admin panel
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<Map<String, Object>>> getAllBookingsWithDetails() {
        try {
            // Use native query to avoid lazy loading issues
            List<Object[]> results = bookingRepository.findAllBookingDetailsForAdmin();

            List<Map<String, Object>> response = results.stream().map(result -> {
                Map<String, Object> bookingData = new HashMap<>();
                
                // Extract booking data from Object[] result
                bookingData.put("id", result[0]); // booking_id
                bookingData.put("numberOfParticipants", result[1]); // number_of_participants
                bookingData.put("totalAmount", result[2]); // total_amount
                bookingData.put("status", result[3] != null ? result[3].toString() : null); // status
                bookingData.put("createdAt", result[4]); // created_at

                // Traveler details
                Map<String, Object> travelerData = new HashMap<>();
                travelerData.put("id", result[5]); // user id
                travelerData.put("firstName", result[6]); // first_name
                travelerData.put("lastName", result[7]); // last_name
                travelerData.put("email", result[8]); // email
                bookingData.put("traveler", travelerData);

                // Experience details
                Map<String, Object> experienceData = new HashMap<>();
                experienceData.put("id", result[9]); // experience_id
                experienceData.put("title", result[10]); // title
                bookingData.put("experience", experienceData);

                // Schedule details
                bookingData.put("startDateTime", result[11]); // start_date_time
                bookingData.put("endDateTime", result[12]); // end_date_time

                return bookingData;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error fetching all bookings with details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch bookings: " + e.getMessage())));
        }
    }

    /**
     * Update booking details
     * @param bookingId The booking ID
     * @param request The booking update request
     * @return Updated booking
     */
    @PutMapping("/bookings/{bookingId}")
    public ResponseEntity<?> updateBooking(@PathVariable Long bookingId, @RequestBody Map<String, Object> request) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (!bookingOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
            }

            Booking booking = bookingOpt.get();

            // Update number of participants
            if (request.containsKey("numberOfParticipants")) {
                Object participantsObj = request.get("numberOfParticipants");
                int numberOfParticipants;
                if (participantsObj instanceof Number) {
                    numberOfParticipants = ((Number) participantsObj).intValue();
                } else if (participantsObj instanceof String) {
                    try {
                        numberOfParticipants = Integer.parseInt((String) participantsObj);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.status(400).body(Map.of("error", "Invalid number of participants format"));
                    }
                } else {
                    return ResponseEntity.status(400).body(Map.of("error", "Invalid number of participants"));
                }
                
                if (numberOfParticipants <= 0) {
                    return ResponseEntity.status(400).body(Map.of("error", "Number of participants must be greater than 0"));
                }
                booking.setNumberOfParticipants(numberOfParticipants);
            }

            // Update total amount
            if (request.containsKey("totalAmount")) {
                Object amountObj = request.get("totalAmount");
                double totalAmount;
                if (amountObj instanceof Number) {
                    totalAmount = ((Number) amountObj).doubleValue();
                } else if (amountObj instanceof String) {
                    try {
                        totalAmount = Double.parseDouble((String) amountObj);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.status(400).body(Map.of("error", "Invalid total amount format"));
                    }
                } else {
                    return ResponseEntity.status(400).body(Map.of("error", "Invalid total amount"));
                }
                
                if (totalAmount < 0) {
                    return ResponseEntity.status(400).body(Map.of("error", "Total amount cannot be negative"));
                }
                booking.setTotalAmount(BigDecimal.valueOf(totalAmount));
            }

            // Update status
            if (request.containsKey("status")) {
                String statusStr = (String) request.get("status");
                if (statusStr != null && !statusStr.trim().isEmpty()) {
                    try {
                        BookingStatus status = BookingStatus.valueOf(statusStr.toUpperCase());
                        booking.setStatus(status);
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(400).body(Map.of("error", "Invalid booking status: " + statusStr));
                    }
                }
            }

            Booking updatedBooking = bookingRepository.save(booking);

            // Return updated booking with details
            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedBooking.getBookingId());
            response.put("numberOfParticipants", updatedBooking.getNumberOfParticipants());
            response.put("totalAmount", updatedBooking.getTotalAmount());
            response.put("status", updatedBooking.getStatus().toString());
            response.put("createdAt", updatedBooking.getCreatedAt());

            // Add traveler details
            Map<String, Object> travelerData = new HashMap<>();
            travelerData.put("id", updatedBooking.getTraveler().getId());
            travelerData.put("firstName", updatedBooking.getTraveler().getFirstName());
            travelerData.put("lastName", updatedBooking.getTraveler().getLastName());
            travelerData.put("email", updatedBooking.getTraveler().getEmail());
            response.put("traveler", travelerData);

            // Add experience details
            Map<String, Object> experienceData = new HashMap<>();
            experienceData.put("id", updatedBooking.getExperienceSchedule().getExperience().getExperienceId());
            experienceData.put("title", updatedBooking.getExperienceSchedule().getExperience().getTitle());
            response.put("experience", experienceData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error updating booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update booking: " + e.getMessage()));
        }
    }

    /**
     * Delete booking
     * @param bookingId The booking ID
     * @return Success message
     */
    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long bookingId) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (!bookingOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
            }

            Booking booking = bookingOpt.get();
            
            // Check if booking has any transactions or other dependencies
            // For now, we'll allow deletion but this could be enhanced with business logic
            
            bookingRepository.delete(booking);
            
            return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
        } catch (Exception e) {
            System.err.println("Error deleting booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete booking: " + e.getMessage()));
        }
    }

    private double calculatePercentageChange(Long oldValue, Long newValue) {
        if (oldValue == null || oldValue == 0) {
            return newValue != null && newValue > 0 ? 100.0 : 0.0;
        }
        if (newValue == null) {
            return -100.0;
        }
        return ((double) (newValue - oldValue) / oldValue) * 100.0;
    }

    // Transaction Management Endpoints
    @GetMapping("/transactions/metrics")
    public ResponseEntity<Map<String, Object>> getTransactionManagementMetrics() {
        try {
            // Total Revenue - sum of all transaction amounts
            BigDecimal totalRevenue = transactionRepository.findAll().stream()
                .map(Transaction::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Total Profit - sum of service_fee from booking table
            BigDecimal totalProfit = bookingRepository.findAll().stream()
                .map(Booking::getServiceFee)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Total Transactions - count of all transactions
            long totalTransactions = transactionRepository.count();

            // Failed Transactions - count of transactions with FAILED status
            long failedTransactions = transactionRepository.findAll().stream()
                .filter(t -> t.getStatus() == TransactionStatus.FAILED)
                .count();

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalRevenue", totalRevenue.doubleValue());
            metrics.put("totalProfit", totalProfit.doubleValue());
            metrics.put("totalTransactions", totalTransactions);
            metrics.put("failedTransactions", failedTransactions);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            System.err.println("Error fetching transaction metrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch transaction metrics: " + e.getMessage()));
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getAllTransactions() {
        try {
            List<Transaction> transactions = transactionRepository.findAll();
            List<Map<String, Object>> transactionData = new ArrayList<>();

            for (Transaction transaction : transactions) {
                Map<String, Object> data = new HashMap<>();
                
                // Transaction ID
                data.put("id", transaction.getTransactionId());
                
                // Transaction Type
                data.put("type", transaction.getType() != null ? transaction.getType().toString() : "UNKNOWN");
                
                // Booking ID
                data.put("bookingId", transaction.getBooking() != null ? transaction.getBooking().getBookingId() : null);
                
                // Experience - get through booking -> experienceSchedule -> experience
                String experienceTitle = "Unknown Experience";
                if (transaction.getBooking() != null && 
                    transaction.getBooking().getExperienceSchedule() != null && 
                    transaction.getBooking().getExperienceSchedule().getExperience() != null) {
                    experienceTitle = transaction.getBooking().getExperienceSchedule().getExperience().getTitle();
                }
                data.put("experience", experienceTitle);
                
                // User - get from transaction user or booking traveler
                String userName = "Unknown User";
                String userEmail = "unknown@example.com";
                if (transaction.getUser() != null) {
                    userName = transaction.getUser().getFirstName() + " " + transaction.getUser().getLastName();
                    userEmail = transaction.getUser().getEmail();
                } else if (transaction.getBooking() != null && transaction.getBooking().getTraveler() != null) {
                    userName = transaction.getBooking().getTraveler().getFirstName() + " " + transaction.getBooking().getTraveler().getLastName();
                    userEmail = transaction.getBooking().getTraveler().getEmail();
                }
                data.put("user", userName);
                data.put("userEmail", userEmail);
                
                // Platform Fee - get service_fee from booking
                BigDecimal platformFee = BigDecimal.ZERO;
                if (transaction.getBooking() != null && transaction.getBooking().getServiceFee() != null) {
                    platformFee = transaction.getBooking().getServiceFee();
                }
                data.put("platformFee", platformFee.doubleValue());
                
                // Amount
                data.put("amount", transaction.getAmount() != null ? transaction.getAmount().doubleValue() : 0.0);
                
                // Date
                data.put("date", transaction.getCreatedAt() != null ? transaction.getCreatedAt().toString() : "");
                
                // Status
                data.put("status", transaction.getStatus() != null ? transaction.getStatus().toString() : "UNKNOWN");
                
                transactionData.add(data);
            }

            return ResponseEntity.ok(transactionData);
        } catch (Exception e) {
            System.err.println("Error fetching transactions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch transactions: " + e.getMessage())));
        }
    }

    @PutMapping("/transactions/{transactionId}")
    public ResponseEntity<?> updateTransaction(@PathVariable Long transactionId, @RequestBody Map<String, Object> request) {
        try {
            Optional<Transaction> transactionOpt = transactionRepository.findById(transactionId);
            if (!transactionOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Transaction not found"));
            }

            Transaction transaction = transactionOpt.get();

            // Update amount
            if (request.containsKey("amount")) {
                Object amountObj = request.get("amount");
                BigDecimal amount;
                if (amountObj instanceof Number) {
                    amount = BigDecimal.valueOf(((Number) amountObj).doubleValue());
                } else if (amountObj instanceof String) {
                    try {
                        amount = new BigDecimal((String) amountObj);
                    } catch (NumberFormatException e) {
                        return ResponseEntity.status(400).body(Map.of("error", "Invalid amount format"));
                    }
                } else {
                    return ResponseEntity.status(400).body(Map.of("error", "Invalid amount"));
                }
                
                if (amount.compareTo(BigDecimal.ZERO) < 0) {
                    return ResponseEntity.status(400).body(Map.of("error", "Amount cannot be negative"));
                }
                transaction.setAmount(amount);
            }

            // Update status
            if (request.containsKey("status")) {
                String statusStr = (String) request.get("status");
                if (statusStr != null && !statusStr.trim().isEmpty()) {
                    try {
                        TransactionStatus status = TransactionStatus.valueOf(statusStr.toUpperCase());
                        transaction.setStatus(status);
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(400).body(Map.of("error", "Invalid transaction status: " + statusStr));
                    }
                }
            }

            Transaction updatedTransaction = transactionRepository.save(transaction);

            // Return updated transaction with details
            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedTransaction.getTransactionId());
            response.put("amount", updatedTransaction.getAmount().doubleValue());
            response.put("status", updatedTransaction.getStatus().toString());
            response.put("type", updatedTransaction.getType().toString());
            response.put("createdAt", updatedTransaction.getCreatedAt());

            // Add booking details
            if (updatedTransaction.getBooking() != null) {
                Map<String, Object> bookingData = new HashMap<>();
                bookingData.put("id", updatedTransaction.getBooking().getBookingId());
                bookingData.put("platformFee", updatedTransaction.getBooking().getServiceFee() != null ? 
                    updatedTransaction.getBooking().getServiceFee().doubleValue() : 0.0);
                response.put("booking", bookingData);
            }

            // Add user details
            if (updatedTransaction.getUser() != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", updatedTransaction.getUser().getId());
                userData.put("firstName", updatedTransaction.getUser().getFirstName());
                userData.put("lastName", updatedTransaction.getUser().getLastName());
                userData.put("email", updatedTransaction.getUser().getEmail());
                response.put("user", userData);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error updating transaction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update transaction: " + e.getMessage()));
        }
    }

    @DeleteMapping("/transactions/{transactionId}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long transactionId) {
        try {
            Optional<Transaction> transactionOpt = transactionRepository.findById(transactionId);
            if (!transactionOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Transaction not found"));
            }

            Transaction transaction = transactionOpt.get();
            
            // Check if transaction has any dependencies
            // For now, we'll allow deletion but this could be enhanced with business logic
            
            transactionRepository.delete(transaction);
            
            return ResponseEntity.ok(Map.of("message", "Transaction deleted successfully"));
        } catch (Exception e) {
            System.err.println("Error deleting transaction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete transaction: " + e.getMessage()));
        }
    }

    // ==================== KYC MANAGEMENT ====================

    /**
     * Get KYC metrics for admin panel
     */
    @GetMapping("/kyc/metrics")
    public ResponseEntity<Map<String, Object>> getKYCMetrics() {
        try {
            // Get total submissions from kyc_document table
            long totalSubmissions = kycDocumentRepository.count();
            
            // Get pending submissions
            long pendingSubmissions = kycDocumentRepository.countByStatus(StatusType.PENDING);
            
            // Get approved submissions
            long approvedSubmissions = kycDocumentRepository.countByStatus(StatusType.APPROVED);
            
            // Get declined submissions
            long declinedSubmissions = kycDocumentRepository.countByStatus(StatusType.REJECTED);

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalSubmissions", totalSubmissions);
            metrics.put("pendingSubmissions", pendingSubmissions);
            metrics.put("approvedSubmissions", approvedSubmissions);
            metrics.put("declinedSubmissions", declinedSubmissions);

            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            System.err.println("Error fetching KYC metrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch KYC metrics: " + e.getMessage()));
        }
    }

    /**
     * Get all KYC submissions for admin review
     */
    @GetMapping("/kyc/submissions")
    public ResponseEntity<List<Map<String, Object>>> getAllKYCSubmissions() {
        try {
            // Get all KYC documents from the database
            List<KycDocument> kycDocuments = kycDocumentRepository.findAll();
            
            List<Map<String, Object>> submissions = new ArrayList<>();
            
            for (KycDocument doc : kycDocuments) {
                Map<String, Object> submission = new HashMap<>();
                submission.put("id", doc.getKycDocumentId());
                submission.put("kycId", doc.getKycDocumentId());
                submission.put("docType", doc.getDocType());
                submission.put("status", doc.getStatus() != null ? doc.getStatus().toString() : "PENDING");
                submission.put("submittedAt", doc.getSubmittedAt());
                submission.put("userId", doc.getUser().getId());
                submission.put("userName", doc.getUser().getFirstName() + " " + doc.getUser().getLastName());
                submission.put("userEmail", doc.getUser().getEmail());
                submission.put("fileUrl", doc.getFileUrl());
                submission.put("notes", doc.getNotes());
                submission.put("rejectionReason", doc.getRejectionReason());
                submission.put("docSide", doc.getDocSide());
                submission.put("reviewedAt", doc.getReviewedAt());
                submission.put("reviewedBy", doc.getReviewedBy());
                
                submissions.add(submission);
            }
            
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            System.err.println("Error fetching KYC submissions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of(Map.of("error", "Failed to fetch KYC submissions: " + e.getMessage())));
        }
    }

    /**
     * Get specific KYC submission details
     */
    @GetMapping("/kyc/submissions/{submissionId}")
    public ResponseEntity<Map<String, Object>> getKYCSubmission(@PathVariable Long submissionId) {
        try {
            Optional<KycDocument> docOpt = kycDocumentRepository.findById(submissionId);
            if (docOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            KycDocument doc = docOpt.get();
            
            Map<String, Object> submission = new HashMap<>();
            submission.put("id", doc.getKycDocumentId());
            submission.put("kycId", doc.getKycDocumentId());
            submission.put("docType", doc.getDocType());
            submission.put("status", doc.getStatus() != null ? doc.getStatus().toString() : "PENDING");
            submission.put("submittedAt", doc.getSubmittedAt());
            submission.put("userId", doc.getUser().getId());
            submission.put("userName", doc.getUser().getFirstName() + " " + doc.getUser().getLastName());
            submission.put("userEmail", doc.getUser().getEmail());
            submission.put("fileUrl", doc.getFileUrl());
            submission.put("notes", doc.getNotes());
            submission.put("rejectionReason", doc.getRejectionReason());
            submission.put("docSide", doc.getDocSide());
            submission.put("reviewedAt", doc.getReviewedAt());
            submission.put("reviewedBy", doc.getReviewedBy());
            
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            System.err.println("Error fetching KYC submission: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch KYC submission: " + e.getMessage()));
        }
    }

    /**
     * Approve KYC submission
     */
    @PutMapping("/kyc/submissions/{submissionId}/approve")
    public ResponseEntity<Map<String, Object>> approveKYC(@PathVariable Long submissionId) {
        try {
            Optional<KycDocument> docOpt = kycDocumentRepository.findById(submissionId);
            if (docOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            KycDocument doc = docOpt.get();
            
            // Store previous status
            doc.setPreviousStatus(doc.getStatus());
            
            // Update status to APPROVED
            doc.setStatus(StatusType.APPROVED);
            
            // Set reviewed information
            doc.setReviewedAt(LocalDateTime.now());
            Long adminUserId = getCurrentAdminUserId();
            System.out.println("Admin user ID for approval: " + adminUserId);
            doc.setReviewedBy(adminUserId != null ? adminUserId : 1L); // Fallback to 1L if no admin found
            
            // Update timestamp
            doc.setUpdatedAt(LocalDateTime.now());
            
            // Save the document
            kycDocumentRepository.save(doc);
            
            // Also update user's KYC status and enable experience creation
            User user = doc.getUser();
            user.setKycStatus(KycStatus.APPROVED);
            user.setKycApprovedAt(LocalDateTime.now());
            user.setCanCreateExperiences(true); // Enable experience creation for approved guides
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("message", "KYC submission approved successfully"));
        } catch (Exception e) {
            System.err.println("Error approving KYC: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to approve KYC: " + e.getMessage()));
        }
    }

    /**
     * Reject KYC submission
     */
    @PutMapping("/kyc/submissions/{submissionId}/decline")
    public ResponseEntity<Map<String, Object>> rejectKYC(@PathVariable Long submissionId, @RequestBody Map<String, String> request) {
        try {
            Optional<KycDocument> docOpt = kycDocumentRepository.findById(submissionId);
            if (docOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            KycDocument doc = docOpt.get();
            
            // Store previous status
            doc.setPreviousStatus(doc.getStatus());
            
            // Update status to REJECTED
            doc.setStatus(StatusType.REJECTED);
            
            // Set rejection reason
            doc.setRejectionReason(request.get("declineMessage"));
            
            // Set reviewed information
            doc.setReviewedAt(LocalDateTime.now());
            Long adminUserId = getCurrentAdminUserId();
            System.out.println("Admin user ID for rejection: " + adminUserId);
            doc.setReviewedBy(adminUserId != null ? adminUserId : 1L); // Fallback to 1L if no admin found
            
            // Update timestamp
            doc.setUpdatedAt(LocalDateTime.now());
            
            // Save the document
            kycDocumentRepository.save(doc);
            
            // Also update user's KYC status
            User user = doc.getUser();
            user.setKycStatus(KycStatus.REJECTED);
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("message", "KYC submission rejected successfully"));
        } catch (Exception e) {
            System.err.println("Error rejecting KYC: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to reject KYC: " + e.getMessage()));
        }
    }
}
