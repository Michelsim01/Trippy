package com.backend.controller;

import com.backend.repository.BookingRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.ExperienceRepository;
import com.backend.entity.ExperienceStatus;
import com.backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    private double calculatePercentageChange(Long oldValue, Long newValue) {
        if (oldValue == null || oldValue == 0) {
            return newValue != null && newValue > 0 ? 100.0 : 0.0;
        }
        if (newValue == null) {
            return -100.0;
        }
        return ((double) (newValue - oldValue) / oldValue) * 100.0;
    }
}
