package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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
    private BookingRepository bookingRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private GeocodingService geocodingService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserSurveyRepository userSurveyRepository;

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

        // Create reviews for some completed bookings
        List<Review> reviews = createReviews(bookings);

        // Create user surveys for some users
        List<UserSurvey> surveys = createUserSurveys(users);

        // Create wishlist items
        createWishlistItems(users, experiences);

        System.out.println("Database seeding completed successfully!");
        System.out.println("Created " + users.size() + " users");
        System.out.println("Created " + experiences.size() + " experiences");
        System.out.println("Created " + schedules.size() + " schedules");
        System.out.println("Created " + bookings.size() + " bookings");
        System.out.println("Created " + reviews.size() + " reviews");
        System.out.println("Created " + surveys.size() + " user surveys");

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
            guide.setPassword(new BCryptPasswordEncoder().encode("Password123"));
            guide.setPhoneNumber("+1" + (2000000000L + random.nextInt(899999999)));
            guide.setIsEmailVerified(true);
            guide.setIsActive(true);
            guide.setCanCreateExperiences(true);
            guide.setKycStatus(KycStatus.APPROVED);
            guide.setKycApprovedAt(LocalDateTime.now().minusDays(random.nextInt(180)));
            guide.setAverageRating(BigDecimal.ZERO); // Will be calculated when reviews are created
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
            traveler.setPassword(new BCryptPasswordEncoder().encode("Password123"));
            traveler.setPhoneNumber("+1" + (2000000000L + random.nextInt(899999999)));
            traveler.setIsEmailVerified(true);
            traveler.setIsActive(true);
            traveler.setCanCreateExperiences(false);
            traveler.setKycStatus(KycStatus.NOT_STARTED);
            traveler.setAverageRating(BigDecimal.ZERO); // Travelers don't have ratings, but initialize to 0
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
                        "https://images.unsplash.com/photo-1557410069-8da84c0523d9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
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
            
            // Fetch and set coordinates
            BigDecimal[] coordinates = fetchCoordinates((String) data[1], (String) data[2]);
            experience.setLatitude(coordinates[0]);
            experience.setLongitude(coordinates[1]);
            
            experience.setShortDescription((String) data[3]);
            experience.setFullDescription(generateFullDescription((String) data[3]));
            experience.setCategory((ExperienceCategory) data[4]);
            experience.setDuration(BigDecimal.valueOf((Double) data[5]));
            experience.setPrice(BigDecimal.valueOf((Double) data[6]));
            experience.setParticipantsAllowed((Integer) data[7]);
            experience.setCoverPhotoUrl((String) data[8]);
            experience.setStatus(ExperienceStatus.ACTIVE);
            experience.setTotalStars(BigDecimal.ZERO); // Will be updated when reviews are created
            experience.setTotalReviews(0); // Will be updated when reviews are created
            experience.setAverageRating(BigDecimal.ZERO); // Will be calculated from totalStars/totalReviews
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

        // Create more past schedules for demo purposes (completed experiences with reviews)
        List<ExperienceSchedule> pastSchedules = new ArrayList<>();
        for (int i = 0; i < Math.min(25, schedules.size()); i++) {
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
            int bookingCount = 2 + random.nextInt(4);
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

                    // Create payout transaction for COMPLETED bookings only
                    if (booking.getStatus() == BookingStatus.COMPLETED) {
                        Transaction payoutTransaction = new Transaction();
                        payoutTransaction.setBooking(booking);
                        payoutTransaction.setUser(booking.getExperienceSchedule().getExperience().getGuide());
                        payoutTransaction.setType(TransactionType.PAYOUT);
                        payoutTransaction.setStatus(TransactionStatus.COMPLETED);
                        payoutTransaction.setAmount(booking.getBaseAmount()); // Guide gets base amount (excludes service fees)
                        payoutTransaction.setPaymentMethod(paymentMethods[0]);
                        payoutTransaction.setLastFourDigits(successfulTransaction.getLastFourDigits());
                        payoutTransaction.setCardBrand(successfulTransaction.getCardBrand());
                        // Payout created after tour completion (1-3 days after end date)
                        payoutTransaction.setCreatedAt(booking.getExperienceSchedule().getEndDateTime().plusDays(1 + random.nextInt(3)));
                        payoutTransaction.setUpdatedAt(payoutTransaction.getCreatedAt());
                        payoutTransaction.setProcessedAt(payoutTransaction.getCreatedAt());
                        transactionRepository.save(payoutTransaction);
                    }
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

    /**
     * Fetch coordinates for a location using the GeocodingService
     * @param location The location name
     * @param country The country name
     * @return Array of [latitude, longitude] or [null, null] if not found
     */
    private BigDecimal[] fetchCoordinates(String location, String country) {
        try {
            String query = location + ", " + country;
            var suggestions = geocodingService.searchLocations(query);
            
            if (!suggestions.isEmpty()) {
                var bestMatch = suggestions.get(0);
                System.out.println("Fetched coordinates for " + query + ": " + 
                    bestMatch.getLatitude() + ", " + bestMatch.getLongitude());
                return new BigDecimal[]{bestMatch.getLatitude(), bestMatch.getLongitude()};
            } else {
                System.out.println("No coordinates found for: " + query);
                return new BigDecimal[]{null, null};
            }
        } catch (Exception e) {
            System.err.println("Error fetching coordinates for " + location + ", " + country + ": " + e.getMessage());
            return new BigDecimal[]{null, null};
        }
    }

    /**
     * Create reviews for completed bookings
     */
    private List<Review> createReviews(List<Booking> bookings) {
        List<Review> reviews = new ArrayList<>();
        
        // Only create reviews for completed bookings (about 70% of completed bookings get reviews)
        List<Booking> completedBookings = bookings.stream()
            .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
            .toList();
        
        String[] reviewTitles = {
            "Amazing experience!", "Highly recommended", "Great value for money",
            "Unforgettable adventure", "Excellent guide", "Worth every penny",
            "Fantastic experience", "Well organized", "Exceeded expectations",
            "Memorable trip", "Perfect for families", "Unique experience"
        };
        
        String[] reviewComments = {
            "This was absolutely incredible! The guide was knowledgeable and friendly. Would definitely book again.",
            "Had an amazing time. Everything was well organized and the views were breathtaking.",
            "Great experience overall. The guide provided excellent insights and made the trip memorable.",
            "Exceeded our expectations. Professional guide and stunning locations. Highly recommend!",
            "Perfect activity for our family. Kids loved it and adults enjoyed it too.",
            "Unique experience that you can't find elsewhere. Worth the price and time.",
            "Well planned itinerary with great attention to detail. The guide was passionate and informative.",
            "Fantastic day out! Great weather and even better company. Will book more experiences.",
            "Amazing views and great photo opportunities. Guide was very patient with our questions.",
            "Excellent value for money. Professional service and unforgettable memories created."
        };
        
        for (Booking booking : completedBookings) {
            // 100% chance of getting a review
            if (true) {
                Review review = new Review();
                review.setBooking(booking);
                review.setReviewer(booking.getTraveler());
                review.setExperience(booking.getExperienceSchedule().getExperience());
                
                // Generate rating (80% are 4-5 stars, 20% are 1-3 stars)
                int rating = random.nextDouble() < 0.8 ? (4 + random.nextInt(2)) : (1 + random.nextInt(3));
                review.setRating(rating);
                
                review.setTitle(reviewTitles[random.nextInt(reviewTitles.length)]);
                review.setComment(reviewComments[random.nextInt(reviewComments.length)]);
                review.setTripPointsEarned(rating * 10); // 10 points per star
                review.setLikeCount(random.nextInt(15)); // 0-14 likes
                
                LocalDateTime reviewDate = booking.getExperienceSchedule().getStartDateTime().plusDays(1 + random.nextInt(7));
                review.setCreatedAt(reviewDate);
                review.setUpdatedAt(reviewDate);
                
                reviews.add(reviewRepository.save(review));
            }
        }
        
        return reviews;
    }

    /**
     * Create user surveys for some users
     */
    private List<UserSurvey> createUserSurveys(List<User> users) {
        List<UserSurvey> surveys = new ArrayList<>();
        
        String[] introductions = {
            "I'm a travel enthusiast who loves exploring new cultures and trying local cuisines.",
            "Adventure seeker always looking for the next thrill and unique experiences.",
            "I enjoy slow travel and getting to know local communities during my trips.",
            "Photography is my passion and I travel to capture beautiful moments and landscapes.",
            "I love history and always seek experiences that teach me about local heritage.",
            "Nature lover who prefers outdoor activities and eco-friendly travel options.",
            "Foodie traveler interested in cooking classes and food tours around the world."
        };
        
        String[] travelStyles = {"Budget Traveler", "Luxury Traveler", "Adventure Seeker", 
                                 "Cultural Explorer", "Eco Traveler", "Family Traveler"};
        
        String[] budgetRanges = {"Budget-Friendly", "Moderate", "Premium", "Luxury"};
        
        List<String> allInterests = Arrays.asList(
            "Adventure", "Culture", "Food", "History", "Nature", "Photography", 
            "Art", "Music", "Wildlife", "Architecture", "Beaches", "Mountains"
        );
        
        // Create surveys for ALL users (100%)
        for (User user : users) {
            if (true) {
                UserSurvey survey = new UserSurvey();
                survey.setUser(user);
                survey.setIntroduction(introductions[random.nextInt(introductions.length)]);
                survey.setTravelStyle(travelStyles[random.nextInt(travelStyles.length)]);
                survey.setExperienceBudget(budgetRanges[random.nextInt(budgetRanges.length)]);
                
                // Assign 3-5 random interests
                List<String> userInterests = new ArrayList<>(allInterests);
                java.util.Collections.shuffle(userInterests);
                survey.setInterests(userInterests.subList(0, 3 + random.nextInt(3)));
                
                survey.setCompletedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
                
                surveys.add(userSurveyRepository.save(survey));
            }
        }
        
        return surveys;
    }
}