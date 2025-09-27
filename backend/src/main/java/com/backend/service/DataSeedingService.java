package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class DataSeedingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private ExperienceScheduleRepository experienceScheduleRepository;

    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private final Random random = new Random();

    @Transactional
    public void seedDatabase() {
        // Temporarily disabled to force re-seeding
        // if (userRepository.count() > 0) {
        // System.out.println("Database already contains data. Skipping seeding.");
        // return;
        // }

        System.out.println("Force seeding enabled - proceeding with data creation...");

        System.out.println("Starting database seeding...");

        // Create users (guides and travelers)
        List<User> users = createUsers();

        // Create experiences with guides
        List<Experience> experiences = createExperiences(users);

        // Create schedules for experiences
        List<ExperienceSchedule> schedules = createExperienceSchedules(experiences);

        // Create bookings
        List<Booking> bookings = createBookings(users, schedules);

        // Create transactions for bookings
        createTransactions(bookings);

        // Create wishlist items
        createWishlistItems(users, experiences);

        // Create reviews
        createReviews(bookings, users);

        System.out.println("Database seeding completed successfully!");
        System.out.println("Created " + users.size() + " users");
        System.out.println("Created " + experiences.size() + " experiences");
        System.out.println("Created " + schedules.size() + " schedules");
        System.out.println("Created " + bookings.size() + " bookings");

        // Print booking status distribution for testing reference
        long completedCount = bookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        long confirmedCount = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count();
        long pendingCount = bookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING).count();
        long cancelledCount = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();

        System.out.println("Booking Status Distribution:");
        System.out.println("  - COMPLETED: " + completedCount + " (for reviews and history)");
        System.out.println("  - CONFIRMED: " + confirmedCount + " (paid future bookings)");
        System.out.println("  - PENDING: " + pendingCount + " (for payment testing)");
        System.out.println("  - CANCELLED: " + cancelledCount + " (with refunds)");
    }

    private List<User> createUsers() {
        List<User> users = new ArrayList<>();

        // Create guide users (KYC approved, can create experiences)
        String[] guideNames = {
                "John Smith", "Maria Garcia", "David Chen", "Sarah Johnson", "Ahmed Hassan",
                "Emma Thompson", "Carlos Rodriguez", "Yuki Tanaka", "Lisa Brown", "Marco Rossi"
        };

        for (String fullName : guideNames) {
            String[] parts = fullName.split(" ");
            String firstName = parts[0];
            String lastName = parts[1];

            User guide = new User();
            guide.setFirstName(firstName);
            guide.setLastName(lastName);
            guide.setEmail(firstName.toLowerCase() + "." + lastName.toLowerCase() + "@trippy.guide");
            guide.setPassword("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqfVvwM1b7z9Wg3Oiq8c9Ni"); // "Password123"
            guide.setPhoneNumber("+1" + (2000000000L + random.nextInt(899999999)));
            guide.setIsEmailVerified(true);
            guide.setIsActive(true);
            guide.setCanCreateExperiences(true);
            guide.setKycStatus(KycStatus.APPROVED);
            guide.setKycApprovedAt(LocalDateTime.now().minusDays(random.nextInt(180)));
            guide.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(365)));
            guide.setUpdatedAt(LocalDateTime.now());

            users.add(userRepository.save(guide));
        }

        // Create regular traveler users
        String[] travelerNames = {
                "Alice Cooper", "Bob Wilson", "Catherine Lee", "Daniel Park", "Elena Volkov",
                "Frank Miller", "Grace Kim", "Henry Davis", "Isabella Cruz", "Jack Taylor",
                "Kate Anderson", "Liam O'Brien", "Mia Zhang", "Noah Williams", "Olivia Martinez"
        };

        for (String fullName : travelerNames) {
            String[] parts = fullName.split(" ");
            String firstName = parts[0];
            String lastName = parts[1];

            User traveler = new User();
            traveler.setFirstName(firstName);
            traveler.setLastName(lastName);
            traveler.setEmail(firstName.toLowerCase() + "." + lastName.toLowerCase() + "@trippy.traveler");
            traveler.setPassword("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqfVvwM1b7z9Wg3Oiq8c9Ni"); // "Password123"
            traveler.setPhoneNumber("+1" + (2000000000L + random.nextInt(899999999)));
            traveler.setIsEmailVerified(true);
            traveler.setIsActive(true);
            traveler.setCanCreateExperiences(false);
            traveler.setKycStatus(KycStatus.NOT_STARTED);
            traveler.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(365)));
            traveler.setUpdatedAt(LocalDateTime.now());

            users.add(userRepository.save(traveler));
        }

        return users;
    }

    private List<Experience> createExperiences(List<User> users) {
        List<Experience> experiences = new ArrayList<>();

        // Get only guide users for creating experiences
        List<User> guides = users.stream()
                .filter(user -> user.getCanCreateExperiences() && user.getKycStatus() == KycStatus.APPROVED)
                .toList();

        // Experience data: title, location, country, description, category, duration,
        // price, participants, coverPhotoUrl
        Object[][] experienceData = {
                { "Sunrise Hike in the Swiss Alps", "Zermatt", "Switzerland",
                        "Watch the sunrise from the Matterhorn base with professional mountain guide",
                        ExperienceCategory.GUIDED_TOUR, 4.5, 150.00, 8,
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
                { "Tokyo Street Food Adventure", "Tokyo", "Japan",
                        "Explore hidden local food spots in Shibuya and taste authentic Japanese cuisine",
                        ExperienceCategory.DAYTRIP, 3.0, 85.00, 12,
                        "https://images.unsplash.com/photo-1545892204-e37749721199" },
                { "Bali Volcano Trekking", "Mount Batur", "Indonesia",
                        "Challenging trek to active volcano summit with sunrise breakfast",
                        ExperienceCategory.ADVENTURE, 6.0, 120.00, 8,
                        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2" },
                { "Venetian Mask Making Workshop", "Venice", "Italy",
                        "Learn traditional Venetian mask making from local artisan", ExperienceCategory.WORKSHOP, 2.5,
                        75.00, 6, "https://images.unsplash.com/photo-1505142468610-359e7d316be0" },
                { "Maldives Coral Snorkeling", "Malé", "Maldives",
                        "Discover vibrant coral reefs and tropical fish in crystal clear waters",
                        ExperienceCategory.WATER_ACTIVITY, 4.0, 95.00, 10,
                        "https://images.unsplash.com/photo-1573843981267-be1999ff37cd" },
                { "Barcelona Gothic Quarter Walking Tour", "Barcelona", "Spain",
                        "Explore medieval streets and hidden gems of the Gothic Quarter",
                        ExperienceCategory.GUIDED_TOUR, 2.5, 35.00, 15,
                        "https://images.unsplash.com/photo-1503377992-e1123f72969b" },
                { "Tuscany Wine Tasting Day Trip", "Chianti", "Italy",
                        "Visit family-owned vineyards and taste premium Italian wines", ExperienceCategory.DAYTRIP, 8.0,
                        180.00, 8, "https://images.unsplash.com/photo-1506377295352-e3154d43ea9e" },
                { "Rock Climbing in Joshua Tree", "California", "United States",
                        "Experience world-class rock climbing with certified instructor", ExperienceCategory.ADVENTURE,
                        6.0, 200.00, 4, "https://images.unsplash.com/photo-1544745630-6175b529b36e" },
                { "Thai Cooking Class Experience", "Bangkok", "Thailand",
                        "Learn to cook authentic Thai dishes in traditional cooking school",
                        ExperienceCategory.WORKSHOP, 4.0, 60.00, 10,
                        "https://images.unsplash.com/photo-1559181567-c3190ca9959b" },
                { "Norwegian Fjord Kayaking", "Geiranger", "Norway",
                        "Paddle through stunning fjords with dramatic waterfalls", ExperienceCategory.WATER_ACTIVITY,
                        5.0, 140.00, 6, "https://images.unsplash.com/photo-1469474968028-56623f02e42e" },
                { "Marrakech Medina Cultural Tour", "Marrakech", "Morocco",
                        "Navigate the bustling souks and discover Berber culture", ExperienceCategory.GUIDED_TOUR, 3.0,
                        45.00, 12, "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e" },
                { "Patagonia Hiking Expedition", "Torres del Paine", "Chile",
                        "Multi-day trek through pristine Patagonian wilderness", ExperienceCategory.ADVENTURE, 10.0,
                        350.00, 6, "https://images.unsplash.com/photo-1520637836862-4d197d17c23a" },
                { "Pottery Making in Kyoto", "Kyoto", "Japan",
                        "Create traditional Japanese ceramics in historic pottery district",
                        ExperienceCategory.WORKSHOP, 3.0, 90.00, 8,
                        "https://images.unsplash.com/photo-1556911220-bff31c812dba" },
                { "Great Barrier Reef Diving", "Cairns", "Australia",
                        "Certified scuba diving experience in the world's largest reef system",
                        ExperienceCategory.WATER_ACTIVITY, 6.0, 250.00, 8,
                        "https://images.unsplash.com/photo-1544551763-46a013bb70d5" },
                { "Santorini Sunset Wine Tour", "Santorini", "Greece",
                        "Watch the famous sunset while tasting local Assyrtiko wines", ExperienceCategory.GUIDED_TOUR,
                        4.0, 110.00, 10, "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff" },
                { "Amazon Rainforest Expedition", "Iquitos", "Peru", "3-day jungle adventure with indigenous guide",
                        ExperienceCategory.ADVENTURE, 72.0, 400.00, 8,
                        "https://images.unsplash.com/photo-1556075798-4825dfaaf498" },
                { "Iceland Northern Lights Tour", "Reykjavik", "Iceland",
                        "Chase the Aurora Borealis with professional photographer guide", ExperienceCategory.OTHERS,
                        6.0, 160.00, 12, "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
                { "Cooking with Nonna in Rome", "Rome", "Italy",
                        "Learn family recipes from Roman grandmother in her home", ExperienceCategory.WORKSHOP, 3.5,
                        85.00, 6, "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f" },
                { "Surfing Lessons in Costa Rica", "Tamarindo", "Costa Rica",
                        "Learn to surf on perfect beginner waves with certified instructor",
                        ExperienceCategory.WATER_ACTIVITY, 3.0, 70.00, 8,
                        "https://images.unsplash.com/photo-1502680390469-be75c86b636f" },
                { "Sahara Desert Camel Trek", "Merzouga", "Morocco",
                        "Overnight camel expedition with Berber camp experience", ExperienceCategory.ADVENTURE, 18.0,
                        220.00, 6, "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9" }
        };

        for (int i = 0; i < experienceData.length; i++) {
            Object[] data = experienceData[i];
            User guide = guides.get(i % guides.size()); // Rotate through guides

            Experience experience = new Experience();
            experience.setGuide(guide);
            experience.setTitle((String) data[0]);
            experience.setLocation((String) data[1]);
            experience.setCountry((String) data[2]);
            experience.setShortDescription((String) data[3]);
            experience.setFullDescription(generateFullDescription((String) data[3]));
            experience.setCategory((ExperienceCategory) data[4]);
            experience.setDuration(BigDecimal.valueOf((Double) data[5]));
            experience.setPrice(BigDecimal.valueOf((Double) data[6]));
            experience.setParticipantsAllowed((Integer) data[7]);
            experience.setCoverPhotoUrl((String) data[8]);
            experience.setStatus(ExperienceStatus.ACTIVE);
            experience.setAverageRating(BigDecimal.valueOf(4.0 + random.nextDouble() * 1.0)); // 4.0-5.0
            experience.setTotalReviews(random.nextInt(50) + 10); // 10-59 reviews
            experience.setHighlights(generateHighlights((String) data[0]));
            experience.setWhatIncluded(generateWhatIncluded());
            experience.setImportantInfo(generateImportantInfo());
            experience.setCancellationPolicy(generateCancellationPolicy());
            experience.setTags(generateTags((ExperienceCategory) data[4]));
            experience.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(90)));
            experience.setUpdatedAt(LocalDateTime.now());

            experiences.add(experienceRepository.save(experience));
        }

        return experiences;
    }

    private List<ExperienceSchedule> createExperienceSchedules(List<Experience> experiences) {
        List<ExperienceSchedule> allSchedules = new ArrayList<>();

        for (Experience experience : experiences) {
            // Create 3-5 schedules per experience starting from November 2025
            int scheduleCount = 3 + random.nextInt(3);

            for (int i = 0; i < scheduleCount; i++) {
                ExperienceSchedule schedule = new ExperienceSchedule();
                schedule.setExperience(experience);

                // All schedules start from November 2025 onwards
                LocalDateTime startTime = LocalDateTime.of(2025, 11, 1, 0, 0)
                        .plusDays(random.nextInt(120)) // spread across November 2025 to February 2026
                        .withHour(8 + random.nextInt(12)) // 8 AM to 8 PM
                        .withMinute(random.nextInt(4) * 15) // 0, 15, 30, 45 minutes
                        .withSecond(0)
                        .withNano(0);

                // End time based on experience duration
                LocalDateTime endTime = startTime.plusHours(experience.getDuration().longValue());

                schedule.setStartDateTime(startTime);
                schedule.setEndDateTime(endTime);
                schedule.setAvailableSpots(experience.getParticipantsAllowed()); // Start with full capacity
                schedule.setIsAvailable(true);
                schedule.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));

                allSchedules.add(experienceScheduleRepository.save(schedule));
            }
        }
        return allSchedules;
    }

    private List<Booking> createBookings(List<User> users, List<ExperienceSchedule> schedules) {
        List<Booking> bookings = new ArrayList<>();
        List<User> travelers = users.stream()
                .filter(user -> !user.getCanCreateExperiences())
                .toList();

        // Create some past schedules for demo purposes (completed experiences with reviews)
        List<ExperienceSchedule> pastSchedules = new ArrayList<>();
        for (int i = 0; i < Math.min(10, schedules.size()); i++) {
            ExperienceSchedule pastSchedule = new ExperienceSchedule();
            pastSchedule.setExperience(schedules.get(i).getExperience());
            LocalDateTime pastStartTime = LocalDateTime.now()
                    .minusDays(7 + random.nextInt(30)) // 7-37 days ago
                    .withHour(8 + random.nextInt(12)) // 8 AM to 8 PM
                    .withMinute(random.nextInt(4) * 15) // 0, 15, 30, 45 minutes
                    .withSecond(0)
                    .withNano(0);
            pastSchedule.setStartDateTime(pastStartTime);
            pastSchedule.setEndDateTime(pastStartTime.plusHours(schedules.get(i).getExperience().getDuration().longValue()));
            pastSchedule.setAvailableSpots(schedules.get(i).getExperience().getParticipantsAllowed());
            pastSchedule.setIsAvailable(false); // Past schedules are not available
            pastSchedule.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
            pastSchedules.add(experienceScheduleRepository.save(pastSchedule));
        }

        // Create bookings for past schedules (completed experiences)
        for (ExperienceSchedule schedule : pastSchedules) {
            int bookingCount = 1 + random.nextInt(3);
            List<User> shuffledTravelers = new ArrayList<>(travelers);
            java.util.Collections.shuffle(shuffledTravelers);

            for (int i = 0; i < bookingCount && i < shuffledTravelers.size() && i < schedule.getAvailableSpots(); i++) {
                User traveler = shuffledTravelers.get(i);
                Booking booking = createBookingWithDetails(traveler, schedule, BookingStatus.COMPLETED);
                booking.setBookingDate(schedule.getStartDateTime().minusDays(random.nextInt(30) + 1));
                booking.setCreatedAt(booking.getBookingDate());
                bookings.add(bookingRepository.save(booking));
            }
        }

        // Create bookings for future schedules (November 2025+)
        for (ExperienceSchedule schedule : schedules) {
            int bookingCount = random.nextInt(3); // 0-2 bookings per future schedule
            List<User> shuffledTravelers = new ArrayList<>(travelers);
            java.util.Collections.shuffle(shuffledTravelers);

            for (int i = 0; i < bookingCount && i < shuffledTravelers.size() && i < schedule.getAvailableSpots(); i++) {
                User traveler = shuffledTravelers.get(i);

                // Distribute booking statuses: 60% CONFIRMED, 30% PENDING, 10% CANCELLED
                BookingStatus status;
                double statusRand = random.nextDouble();
                if (statusRand < 0.6) {
                    status = BookingStatus.CONFIRMED;
                } else if (statusRand < 0.9) {
                    status = BookingStatus.PENDING;
                } else {
                    status = BookingStatus.CANCELLED;
                }

                Booking booking = createBookingWithDetails(traveler, schedule, status);
                booking.setBookingDate(LocalDateTime.now().minusDays(random.nextInt(7) + 1)); // Booked 1-7 days ago
                booking.setCreatedAt(booking.getBookingDate());

                if (status == BookingStatus.CANCELLED) {
                    booking.setCancellationReason("Changed travel plans");
                    booking.setCancelledAt(booking.getBookingDate().plusHours(random.nextInt(48)));
                }

                bookings.add(bookingRepository.save(booking));
            }
        }

        return bookings;
    }

    private Booking createBookingWithDetails(User traveler, ExperienceSchedule schedule, BookingStatus status) {
        Booking booking = new Booking();
        booking.setExperienceSchedule(schedule);
        booking.setTraveler(traveler); // Set the traveler relationship (required for DB constraint)
        booking.setNumberOfParticipants(1 + random.nextInt(2)); // 1-2 participants
        booking.setStatus(status);

        // Set contact information from traveler
        booking.setContactFirstName(traveler.getFirstName());
        booking.setContactLastName(traveler.getLastName());
        booking.setContactEmail(traveler.getEmail());
        booking.setContactPhone(traveler.getPhoneNumber());

        // Calculate pricing breakdown
        BigDecimal experiencePrice = schedule.getExperience().getPrice();
        BigDecimal baseAmount = experiencePrice.multiply(BigDecimal.valueOf(booking.getNumberOfParticipants()));
        BigDecimal serviceFee = baseAmount.multiply(BigDecimal.valueOf(0.04)); // 4% service fee
        BigDecimal totalAmount = baseAmount.add(serviceFee);

        booking.setBaseAmount(baseAmount);
        booking.setServiceFee(serviceFee);
        booking.setTotalAmount(totalAmount);

        // Generate proper confirmation code format: TRP-XXXXXXXX
        booking.setConfirmationCode(generateConfirmationCode());

        booking.setUpdatedAt(LocalDateTime.now());

        return booking;
    }

    private String generateConfirmationCode() {
        return "TRP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void createTransactions(List<Booking> bookings) {
        String[] cardBrands = { "visa", "mastercard", "amex", "discover" };
        String[] paymentMethods = { "CREDIT_CARD" };

        for (Booking booking : bookings) {
            // Create transactions based on booking status
            switch (booking.getStatus()) {
                case COMPLETED:
                case CONFIRMED:
                    // Create successful payment transaction
                    Transaction successfulTransaction = new Transaction();
                    successfulTransaction.setBooking(booking);
                    successfulTransaction.setUser(booking.getTraveler());
                    successfulTransaction.setType(TransactionType.PAYMENT);
                    successfulTransaction.setStatus(TransactionStatus.COMPLETED);
                    successfulTransaction.setAmount(booking.getTotalAmount());
                    successfulTransaction.setPaymentMethod(paymentMethods[0]);
                    successfulTransaction.setLastFourDigits(String.format("%04d", 1000 + random.nextInt(9000)));
                    successfulTransaction.setCardBrand(cardBrands[random.nextInt(cardBrands.length)]);
                    successfulTransaction.setCreatedAt(booking.getBookingDate().plusMinutes(random.nextInt(30)));
                    successfulTransaction.setUpdatedAt(successfulTransaction.getCreatedAt());

                    transactionRepository.save(successfulTransaction);
                    break;

                case CANCELLED:
                    // Create successful payment followed by refund
                    Transaction originalTransaction = new Transaction();
                    originalTransaction.setBooking(booking);
                    originalTransaction.setUser(booking.getTraveler());
                    originalTransaction.setType(TransactionType.PAYMENT);
                    originalTransaction.setStatus(TransactionStatus.COMPLETED);
                    originalTransaction.setAmount(booking.getTotalAmount());
                    originalTransaction.setPaymentMethod(paymentMethods[0]);
                    originalTransaction.setLastFourDigits(String.format("%04d", 1000 + random.nextInt(9000)));
                    originalTransaction.setCardBrand(cardBrands[random.nextInt(cardBrands.length)]);
                    originalTransaction.setCreatedAt(booking.getBookingDate().plusMinutes(random.nextInt(30)));
                    originalTransaction.setUpdatedAt(originalTransaction.getCreatedAt());

                    transactionRepository.save(originalTransaction);

                    // Create refund transaction
                    Transaction refundTransaction = new Transaction();
                    refundTransaction.setBooking(booking);
                    refundTransaction.setUser(booking.getTraveler());
                    refundTransaction.setType(TransactionType.REFUND);
                    refundTransaction.setStatus(TransactionStatus.COMPLETED);
                    refundTransaction.setAmount(booking.getTotalAmount().negate()); // Negative amount for refund
                    refundTransaction.setPaymentMethod(paymentMethods[0]);
                    refundTransaction.setLastFourDigits(originalTransaction.getLastFourDigits());
                    refundTransaction.setCardBrand(originalTransaction.getCardBrand());
                    refundTransaction.setCreatedAt(booking.getCancelledAt());
                    refundTransaction.setUpdatedAt(refundTransaction.getCreatedAt());

                    transactionRepository.save(refundTransaction);
                    break;
            }
        }
    }

    private String getRandomFailureReason() {
        String[] reasons = {
                "Your card was declined.",
                "Your card has insufficient funds.",
                "Your card's security code is incorrect.",
                "Your card has expired.",
                "Your card does not support this type of purchase.",
                "An error occurred while processing your card."
        };
        return reasons[random.nextInt(reasons.length)];
    }

    private void createWishlistItems(List<User> users, List<Experience> experiences) {
        // Create wishlist items for traveler users
        List<User> travelers = users.stream()
                .filter(user -> !user.getCanCreateExperiences())
                .toList();

        for (User traveler : travelers) {
            // Each traveler wishlist 2-5 random experiences
            int wishlistCount = 2 + random.nextInt(4);
            List<Experience> shuffledExperiences = new ArrayList<>(experiences);
            java.util.Collections.shuffle(shuffledExperiences);

            for (int i = 0; i < wishlistCount && i < shuffledExperiences.size(); i++) {
                WishlistItem wishlistItem = new WishlistItem();
                wishlistItem.setUser(traveler);
                wishlistItem.setExperience(shuffledExperiences.get(i));
                wishlistItem.setAddedAt(LocalDateTime.now().minusDays(random.nextInt(30)));

                wishlistItemRepository.save(wishlistItem);
            }
        }
    }

    private void createReviews(List<Booking> bookings, List<User> users) {
        String[] reviewTexts = {
                "Amazing experience! The guide was knowledgeable and friendly. Would definitely recommend!",
                "Great value for money. Everything was well organized and the location was beautiful.",
                "Had an incredible time! The activity was challenging but rewarding. Perfect for adventure seekers.",
                "Excellent cultural experience. Learned so much about local traditions and customs.",
                "Beautiful scenery and great photo opportunities. The guide made sure everyone felt safe.",
                "Very professional service. All equipment was provided and in good condition.",
                "Perfect for beginners! The instructor was patient and encouraging throughout.",
                "Unforgettable experience! This will definitely be one of the highlights of our trip.",
                "Well worth the price. The small group size made it feel very personal and special.",
                "Great activity for families. Our kids loved every minute of it!"
        };

        // Create reviews for completed bookings (70% chance per booking)
        for (Booking booking : bookings) {
            if (booking.getStatus() == BookingStatus.COMPLETED && random.nextDouble() < 0.7) {
                // Find a traveler user to be the reviewer (using contact email)
                User reviewer = users.stream()
                        .filter(user -> user.getEmail().equals(booking.getContactEmail()))
                        .findFirst()
                        .orElse(null);

                if (reviewer != null) {
                    Review review = new Review();
                    review.setBooking(booking);
                    review.setExperience(booking.getExperienceSchedule().getExperience());
                    review.setReviewer(reviewer);
                    review.setRating(3 + random.nextInt(3)); // 3-5 stars
                    review.setComment(reviewTexts[random.nextInt(reviewTexts.length)]);
                    review.setTripPointsEarned(review.getRating() * 10); // Points based on rating
                    review.setCreatedAt(
                            booking.getExperienceSchedule().getEndDateTime().plusDays(random.nextInt(7) + 1));
                    review.setUpdatedAt(review.getCreatedAt());

                    reviewRepository.save(review);
                }
            }
        }
    }

    // Helper methods for generating content
    private String generateFullDescription(String shortDescription) {
        return shortDescription
                + "\n\nThis carefully curated experience offers participants an authentic and immersive " +
                "adventure that combines cultural insights with unforgettable memories. Our expert guides ensure " +
                "your safety while providing fascinating commentary throughout the journey. Perfect for solo travelers, "
                +
                "couples, and groups looking for something special.";
    }

    private String generateHighlights(String title) {
        return "• Professional expert guide\n• Small group experience\n• All necessary equipment included\n• " +
                "Perfect for photography\n• Safe and well-organized\n• Authentic local experience";
    }

    private String generateWhatIncluded() {
        return "Professional guide, all necessary equipment, safety briefing, small group experience (max 12 people), "
                +
                "refreshments, and comprehensive insurance coverage.";
    }

    private String generateImportantInfo() {
        return "Please wear comfortable walking shoes and weather-appropriate clothing. Minimum age requirement is 12 years. "
                +
                "Activity may be cancelled due to weather conditions with full refund offered.";
    }

    private String generateCancellationPolicy() {
        return "Free cancellation up to 24 hours before the experience starts. Cancellations within 24 hours are " +
                "subject to a 50% fee. No-shows are non-refundable.";
    }

    private List<String> generateTags(ExperienceCategory category) {
        List<String> baseTags = Arrays.asList("adventure", "outdoor", "cultural", "photography", "nature", "local");
        List<String> categoryTags = new ArrayList<>(baseTags);

        switch (category) {
            case GUIDED_TOUR:
                categoryTags.addAll(Arrays.asList("history", "walking", "sightseeing"));
                break;
            case ADVENTURE:
                categoryTags.addAll(Arrays.asList("adrenaline", "challenging", "hiking"));
                break;
            case WORKSHOP:
                categoryTags.addAll(Arrays.asList("hands-on", "learning", "traditional"));
                break;
            case WATER_ACTIVITY:
                categoryTags.addAll(Arrays.asList("swimming", "marine", "underwater"));
                break;
            case DAYTRIP:
                categoryTags.addAll(Arrays.asList("full-day", "comprehensive", "scenic"));
                break;
            default:
                categoryTags.addAll(Arrays.asList("unique", "special", "memorable"));
        }

        // Return 4-6 random tags
        java.util.Collections.shuffle(categoryTags);
        return categoryTags.subList(0, Math.min(4 + random.nextInt(3), categoryTags.size()));
    }
}