package com.backend.service;

import com.backend.entity.*;
import com.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
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
@Profile("!test")
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

    @Autowired
    private TravelArticleRepository travelArticleRepository;

    @Autowired
    private FAQRepository faqRepository;

    @Autowired
    private FAQKnowledgeBaseRepository faqKnowledgeBaseRepository;

    @Autowired
    private ExperienceItineraryRepository experienceItineraryRepository;

    private final Random random = new Random();

    /**
     * Determine which cluster a user belongs to based on their user ID
     * User IDs 1-15 are guides (not clustered)
     * User IDs 16-95 are travelers (80 travelers split into 4 clusters)
     * Cluster 0: User ID 16-32 (17 travelers - Luxury Cultural Explorers)
     * Cluster 1: User ID 33-48 (16 travelers - Budget Social Travelers)
     * Cluster 2: User ID 49-64 (16 travelers - Adventure Enthusiasts)
     * Cluster 3: User ID 65-95 (31 travelers - Light Casual Travelers)
     */
    private int getUserCluster(Long userId) {
        int id = userId.intValue();
        if (id >= 16 && id <= 32) return 0;      // Luxury Cultural Explorers (17 travelers)
        else if (id >= 33 && id <= 48) return 1; // Budget Social Travelers (16 travelers)
        else if (id >= 49 && id <= 64) return 2; // Adventure Enthusiasts (16 travelers)
        else return 3;                            // Light Casual Travelers (31 travelers: 65-95)
    }

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

        // Create itineraries for 50 experiences (multi-location routes)
        List<ExperienceItinerary> itineraries = createExperienceItineraries(experiences);

        // Create schedules for experiences
        List<ExperienceSchedule> schedules = createExperienceSchedules(experiences);

        // Create bookings
        List<Booking> bookings = createBookings(users, schedules);

        // Create transactions for bookings
        createTransactions(bookings);

        // Create reviews for some completed bookings
        List<Review> reviews = createReviews(bookings);

        // Update experience and guide ratings based on reviews
        updateAllRatings(experiences, users);

        // Create user surveys for some users
        List<UserSurvey> surveys = createUserSurveys(users);

        // Create wishlist items
        createWishlistItems(users, experiences);

        // Create travel blog articles
        List<TravelArticle> articles = createTravelArticles(users);

        // Create FAQs
        List<FAQ> faqs = createFAQs();

        System.out.println("Database seeding completed successfully!");
        
        // Count different types of users
        long adminCount = users.stream().filter(User::getIsAdmin).count();
        long guideCount = users.stream().filter(user -> user.getCanCreateExperiences() && !user.getIsAdmin()).count();
        long travelerCount = users.stream().filter(user -> !user.getCanCreateExperiences() && !user.getIsAdmin()).count();
        
        System.out.println("Created " + users.size() + " users:");
        System.out.println("  - " + adminCount + " admin user(s)");
        System.out.println("  - " + guideCount + " guides (can create experiences)");
        System.out.println("  - " + travelerCount + " travelers");
        System.out.println("Created " + experiences.size() + " experiences");
        System.out.println("Created " + itineraries.size() + " itineraries for " + 
            itineraries.stream().map(i -> i.getExperience().getExperienceId()).distinct().count() + " experiences");
        System.out.println("Created " + schedules.size() + " schedules");
        System.out.println("Created " + bookings.size() + " bookings");
        System.out.println("Created " + reviews.size() + " reviews");
        System.out.println("Created " + surveys.size() + " user surveys");
        System.out.println("Created " + (articles != null ? articles.size() : 0) + " travel articles");
        System.out.println("Created " + faqs.size() + " FAQs");
        System.out.println("Updated ratings for experiences and guides based on reviews");

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
        
        // Print cluster distribution
        List<User> travelers = users.stream().filter(u -> !u.getCanCreateExperiences()).toList();
        long cluster0Count = travelers.stream().filter(u -> getUserCluster(u.getId()) == 0).count();
        long cluster1Count = travelers.stream().filter(u -> getUserCluster(u.getId()) == 1).count();
        long cluster2Count = travelers.stream().filter(u -> getUserCluster(u.getId()) == 2).count();
        long cluster3Count = travelers.stream().filter(u -> getUserCluster(u.getId()) == 3).count();
        
        System.out.println("\nUser Cluster Distribution (for analytics testing):");
        System.out.println("  - Cluster 0 (Luxury Cultural Explorers): " + cluster0Count + " travelers (IDs 16-32)");
        System.out.println("  - Cluster 1 (Budget Social Travelers): " + cluster1Count + " travelers (IDs 33-48)");
        System.out.println("  - Cluster 2 (Adventure Enthusiasts): " + cluster2Count + " travelers (IDs 49-64)");
        System.out.println("  - Cluster 3 (Light Casual Travelers): " + cluster3Count + " travelers (IDs 65-95)");
        
        // Print admin credentials for easy access
        if (adminCount > 0) {
            System.out.println("\n🔑 Admin Access:");
            System.out.println("  - Email: admin@trippy.com");
            System.out.println("  - Password: Password123");
            System.out.println("  - Portal: http://localhost:5174/admin/login");
        }
    }

    private List<User> createUsers() {
        List<User> users = new ArrayList<>();

        // Create guide users (KYC approved, can create experiences)
        // Total: 15 guides to handle 100 experiences (avg 6-7 experiences per guide)
        String[] guideNames = {
                // Original 10 guides
                "John Smith", "Maria Garcia", "David Chen", "Sarah Johnson", "Ahmed Hassan",
                "Emma Thompson", "Carlos Rodriguez", "Yuki Tanaka", "Lisa Brown", "Marco Rossi",
                // 5 new guides
                "Sophie Dubois", "Lars Nielsen", "Priya Sharma", "Miguel Santos", "Fatima Al-Mansoori"
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
            guide.setTripPoints(0); // Initialize trip points to 0
            guide.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(365)));
            guide.setUpdatedAt(LocalDateTime.now());

            users.add(userRepository.save(guide));
        }

        // Create regular traveler users
        // Total: 80 travelers (all will have bookings for active user analytics)
        String[] travelerNames = {
                // Original 15 travelers
                "Alice Cooper", "Bob Wilson", "Catherine Lee", "Daniel Park", "Elena Volkov",
                "Frank Miller", "Grace Kim", "Henry Davis", "Isabella Cruz", "Jack Taylor",
                "Kate Anderson", "Liam O'Brien", "Mia Zhang", "Noah Williams", "Olivia Martinez",
                
                // 65 new travelers for expanded analytics testing
                // North American travelers
                "Rachel Green", "Michael Scott", "Emily Davis", "James Brown", "Sophia Taylor",
                "William Anderson", "Charlotte Thomas", "Benjamin Moore", "Amelia Jackson", "Lucas White",
                "Harper Harris", "Alexander Martin", "Evelyn Thompson", "Ethan Garcia", "Abigail Robinson",
                
                // European travelers
                "Oliver Mueller", "Emma Schmidt", "Noah Fischer", "Isabella Weber", "Liam Wagner",
                "Mia Becker", "Lucas Hoffmann", "Sophia Koch", "Leon Werner", "Hannah Schulz",
                "Felix Richter", "Laura Klein", "Paul Neumann", "Anna Schwarz", "Max Zimmermann",
                
                // Asian travelers
                "Yuki Yamamoto", "Sakura Tanaka", "Hiroshi Sato", "Aiko Suzuki", "Takeshi Watanabe",
                "Mei Chen", "Wei Wang", "Li Zhang", "Jing Liu", "Ming Yang",
                "Raj Patel", "Ananya Gupta", "Arjun Kumar", "Diya Singh", "Rohan Mehta",
                
                // Latin American travelers
                "Sofia Rodriguez", "Diego Martinez", "Valentina Lopez", "Santiago Gonzalez", "Camila Hernandez",
                "Mateo Perez", "Lucia Garcia", "Gabriel Silva", "Isabella Fernandez", "Sebastian Torres",
                
                // Middle Eastern/African travelers
                "Omar Hassan", "Layla Abdullah", "Amir Khan", "Zara Ali", "Karim Mohamed",
                "Amara Okafor", "Kwame Mensah", "Aisha Ibrahim", "Jabari Nkosi", "Zuri Banda"
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
            traveler.setTripPoints(0); // Initialize trip points to 0
            traveler.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(365)));
            traveler.setUpdatedAt(LocalDateTime.now());

            users.add(userRepository.save(traveler));
        }

        // Create one admin user for referral system
        User admin = new User();
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setEmail("admin@trippy.com");
        admin.setPassword(new BCryptPasswordEncoder().encode("Password123"));
        admin.setPhoneNumber("+1234567890");
        admin.setIsEmailVerified(true);
        admin.setIsActive(true);
        admin.setCanCreateExperiences(false);
        admin.setIsAdmin(true); // This is the key line - making this user an admin
        admin.setKycStatus(KycStatus.NOT_STARTED); // Admins don't need KYC
        admin.setAverageRating(BigDecimal.ZERO);
        admin.setTripPoints(0);
        admin.setCreatedAt(LocalDateTime.now().minusDays(30)); // Created 30 days ago
        admin.setUpdatedAt(LocalDateTime.now());

        users.add(userRepository.save(admin));

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
        // Total: 100 experiences across all categories for robust analytics pipeline testing
        Object[][] experienceData = {
                // === ORIGINAL 20 EXPERIENCES ===
                { "Sunrise Hike in the Swiss Alps", "Zermatt", "Switzerland",
                        "Watch the sunrise from the Matterhorn base with professional mountain guide",
                        ExperienceCategory.GUIDED_TOUR, 4.5, 150.00, 8,
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
                { "Tokyo Street Food Adventure", "Tokyo", "Japan",
                        "Explore hidden local food spots in Shibuya and taste authentic Japanese cuisine",
                        ExperienceCategory.DAYTRIP, 3.0, 85.00, 12,
                        "https://images.unsplash.com/photo-1557410069-8da84c0523d9" },
                { "Bali Volcano Trekking", "Mount Batur", "Indonesia",
                        "Challenging trek to active volcano summit with sunrise breakfast",
                        ExperienceCategory.ADVENTURE, 6.0, 120.00, 8,
                        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2" },
                { "Venetian Mask Making Workshop", "Venice", "Italy",
                        "Learn traditional Venetian mask making from local artisan",
                        ExperienceCategory.WORKSHOP, 2.5, 75.00, 6,
                        "https://images.unsplash.com/photo-1505142468610-359e7d316be0" },
                { "Maldives Coral Snorkeling", "Malé", "Maldives",
                        "Discover vibrant coral reefs and tropical fish in crystal clear waters",
                        ExperienceCategory.WATER_ACTIVITY, 4.0, 95.00, 10,
                        "https://images.unsplash.com/photo-1573843981267-be1999ff37cd" },
                { "Barcelona Gothic Quarter Walking Tour", "Barcelona", "Spain",
                        "Explore medieval streets and hidden gems of the Gothic Quarter",
                        ExperienceCategory.GUIDED_TOUR, 2.5, 35.00, 15,
                        "https://images.unsplash.com/photo-1503377992-e1123f72969b" },
                { "Tuscany Wine Tasting Day Trip", "Chianti", "Italy",
                        "Visit family-owned vineyards and taste premium Italian wines",
                        ExperienceCategory.DAYTRIP, 8.0, 180.00, 8,
                        "https://images.unsplash.com/photo-1506377295352-e3154d43ea9e" },
                { "Rock Climbing in Joshua Tree", "California", "United States",
                        "Experience world-class rock climbing with certified instructor",
                        ExperienceCategory.ADVENTURE, 6.0, 200.00, 4,
                        "https://images.unsplash.com/photo-1544745630-6175b529b36e" },
                { "Thai Cooking Class Experience", "Bangkok", "Thailand",
                        "Learn to cook authentic Thai dishes in traditional cooking school",
                        ExperienceCategory.WORKSHOP, 4.0, 60.00, 10,
                        "https://images.unsplash.com/photo-1559181567-c3190ca9959b" },
                { "Norwegian Fjord Kayaking", "Geiranger", "Norway",
                        "Paddle through stunning fjords with dramatic waterfalls",
                        ExperienceCategory.WATER_ACTIVITY, 5.0, 140.00, 6,
                        "https://images.unsplash.com/photo-1469474968028-56623f02e42e" },
                { "Marrakech Medina Cultural Tour", "Marrakech", "Morocco",
                        "Navigate the bustling souks and discover Berber culture",
                        ExperienceCategory.GUIDED_TOUR, 3.0, 45.00, 12,
                        "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e" },
                { "Patagonia Hiking Expedition", "Torres del Paine", "Chile",
                        "Multi-day trek through pristine Patagonian wilderness",
                        ExperienceCategory.ADVENTURE, 10.0, 350.00, 6,
                        "https://images.unsplash.com/photo-1520637836862-4d197d17c23a" },
                { "Pottery Making in Kyoto", "Kyoto", "Japan",
                        "Create traditional Japanese ceramics in historic pottery district",
                        ExperienceCategory.WORKSHOP, 3.0, 90.00, 8,
                        "https://images.unsplash.com/photo-1556911220-bff31c812dba" },
                { "Great Barrier Reef Diving", "Cairns", "Australia",
                        "Certified scuba diving experience in the world's largest reef system",
                        ExperienceCategory.WATER_ACTIVITY, 6.0, 250.00, 8,
                        "https://images.unsplash.com/photo-1544551763-46a013bb70d5" },
                { "Santorini Sunset Wine Tour", "Santorini", "Greece",
                        "Watch the famous sunset while tasting local Assyrtiko wines",
                        ExperienceCategory.GUIDED_TOUR, 4.0, 110.00, 10,
                        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff" },
                { "Amazon Rainforest Expedition", "Iquitos", "Peru",
                        "3-day jungle adventure with indigenous guide",
                        ExperienceCategory.ADVENTURE, 72.0, 400.00, 8,
                        "https://images.unsplash.com/photo-1556075798-4825dfaaf498" },
                { "Iceland Northern Lights Tour", "Reykjavik", "Iceland",
                        "Chase the Aurora Borealis with professional photographer guide",
                        ExperienceCategory.OTHERS, 6.0, 160.00, 12,
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
                { "Cooking with Nonna in Rome", "Rome", "Italy",
                        "Learn family recipes from Roman grandmother in her home",
                        ExperienceCategory.WORKSHOP, 3.5, 85.00, 6,
                        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f" },
                { "Surfing Lessons in Costa Rica", "Tamarindo", "Costa Rica",
                        "Learn to surf on perfect beginner waves with certified instructor",
                        ExperienceCategory.WATER_ACTIVITY, 3.0, 70.00, 8,
                        "https://images.unsplash.com/photo-1502680390469-be75c86b636f" },
                { "Sahara Desert Camel Trek", "Merzouga", "Morocco",
                        "Overnight camel expedition with Berber camp experience",
                        ExperienceCategory.ADVENTURE, 18.0, 220.00, 6,
                        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9" },

                // === NEW 80 EXPERIENCES (Added for pipeline testing) ===
                
                // ADVENTURE Experiences (15 new)
                { "Via Ferrata Climbing Adventure", "Cortina d'Ampezzo", "Italy",
                        "Protected climbing route through stunning Dolomites with cable systems and mountain views",
                        ExperienceCategory.ADVENTURE, 5.0, 135.00, 6,
                        "https://images.unsplash.com/photo-1522163182402-834f871fd851" },
                { "Mount Fuji Summit Trek", "Fujinomiya", "Japan",
                        "Challenging overnight climb to Japan's highest peak with sunrise experience",
                        ExperienceCategory.ADVENTURE, 14.0, 280.00, 8,
                        "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65" },
                { "Pyrenees Mountain Hiking", "Ordesa", "Spain",
                        "Full-day trek through dramatic canyons and waterfalls in Spanish Pyrenees",
                        ExperienceCategory.ADVENTURE, 8.0, 95.00, 10,
                        "https://images.unsplash.com/photo-1551632811-561732d1e306" },
                { "Zip-lining Jungle Canopy", "Chiang Mai", "Thailand",
                        "Adrenaline-filled zip-line adventure through rainforest canopy with spectacular views",
                        ExperienceCategory.ADVENTURE, 4.0, 75.00, 12,
                        "https://images.unsplash.com/photo-1527004013197-933c4bb611b3" },
                { "Colca Canyon Trekking", "Arequipa", "Peru",
                        "Multi-day trek through one of world's deepest canyons with condor watching",
                        ExperienceCategory.ADVENTURE, 36.0, 320.00, 6,
                        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b" },
                { "Atlas Mountains Day Hike", "Imlil", "Morocco",
                        "Guided trek through Berber villages with traditional lunch and mountain views",
                        ExperienceCategory.ADVENTURE, 7.0, 85.00, 8,
                        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99" },
                { "Blue Mountains Bushwalking", "Katoomba", "Australia",
                        "Explore dramatic cliffs, waterfalls and eucalyptus forests with expert naturalist guide",
                        ExperienceCategory.ADVENTURE, 6.0, 120.00, 8,
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
                { "Bungee Jumping Experience", "Queenstown", "New Zealand",
                        "Take the ultimate leap from 134m high Kawarau Bridge with safety certified crew",
                        ExperienceCategory.ADVENTURE, 2.0, 180.00, 15,
                        "https://images.unsplash.com/photo-1517649763962-0c623066013b" },
                { "Canyoning Adventure", "Interlaken", "Switzerland",
                        "Rappel down waterfalls and jump into crystal pools in Swiss canyon",
                        ExperienceCategory.ADVENTURE, 4.5, 145.00, 8,
                        "https://images.unsplash.com/photo-1551632811-561732d1e306" },
                { "Ice Climbing Glacier Trek", "Vatnajökull", "Iceland",
                        "Learn ice climbing techniques on ancient glacier with professional mountaineer",
                        ExperienceCategory.ADVENTURE, 5.0, 195.00, 6,
                        "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5" },
                { "Spelunking Cave Exploration", "Gunung Mulu", "Malaysia",
                        "Discover massive limestone caves with underground rivers and bat colonies",
                        ExperienceCategory.ADVENTURE, 6.0, 110.00, 10,
                        "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20" },
                { "Paragliding Mountain Flight", "Pokhara", "Nepal",
                        "Soar above Himalayan foothills with panoramic views of Annapurna range",
                        ExperienceCategory.ADVENTURE, 2.5, 100.00, 12,
                        "https://images.unsplash.com/photo-1490730141103-6cac27aaab94" },
                { "White Water Rafting", "Queenstown", "New Zealand",
                        "Navigate Class 4 rapids through spectacular Shotover River canyon",
                        ExperienceCategory.ADVENTURE, 4.0, 130.00, 8,
                        "https://images.unsplash.com/photo-1527004013197-933c4bb611b3" },
                { "Mountain Biking Trail", "Finale Ligure", "Italy",
                        "Technical single-track descent from mountains to Mediterranean coastline",
                        ExperienceCategory.ADVENTURE, 5.0, 95.00, 6,
                        "https://images.unsplash.com/photo-1541625602330-2277a4c46182" },
                { "Volcano Board Sledding", "León", "Nicaragua",
                        "Extreme volcanic ash boarding down active Cerro Negro volcano",
                        ExperienceCategory.ADVENTURE, 3.0, 60.00, 15,
                        "https://images.unsplash.com/photo-1542224566-6e85f2e6772f" },

                // GUIDED_TOUR Experiences (16 new)
                { "Street Art Walking Tour", "Barcelona", "Spain",
                        "Discover hidden graffiti masterpieces and urban art culture in Raval neighborhood",
                        ExperienceCategory.GUIDED_TOUR, 2.5, 30.00, 15,
                        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b" },
                { "Geisha District Evening Tour", "Kyoto", "Japan",
                        "Walk through Gion at dusk and learn about geisha traditions and tea houses",
                        ExperienceCategory.GUIDED_TOUR, 3.0, 65.00, 10,
                        "https://images.unsplash.com/photo-1528360983277-13d401cdc186" },
                { "Ancient Roman Forum Walk", "Rome", "Italy",
                        "Explore 2000-year-old ruins with archaeologist guide and skip-the-line access",
                        ExperienceCategory.GUIDED_TOUR, 3.5, 75.00, 12,
                        "https://images.unsplash.com/photo-1552832230-c0197dd311b5" },
                { "Floating Market Tour", "Bangkok", "Thailand",
                        "Navigate traditional wooden boats through vibrant Damnoen Saduak market",
                        ExperienceCategory.GUIDED_TOUR, 5.0, 55.00, 12,
                        "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a" },
                { "Louvre Masterpieces Tour", "Paris", "France",
                        "Skip-the-line access with art historian focusing on Mona Lisa and Venus de Milo",
                        ExperienceCategory.GUIDED_TOUR, 3.0, 95.00, 8,
                        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a" },
                { "Inca Trail Sacred Valley", "Cusco", "Peru",
                        "Explore ancient Incan ruins of Ollantaytambo and Pisac with local historian",
                        ExperienceCategory.GUIDED_TOUR, 8.0, 120.00, 10,
                        "https://images.unsplash.com/photo-1526392060635-9d6019884377" },
                { "Fes Medina Guided Walk", "Fes", "Morocco",
                        "Navigate medieval walled city's 9000 alleyways with Unesco heritage expert",
                        ExperienceCategory.GUIDED_TOUR, 4.0, 40.00, 8,
                        "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e" },
                { "Sydney Opera House Tour", "Sydney", "Australia",
                        "Behind-the-scenes tour of iconic architecture and backstage theater areas",
                        ExperienceCategory.GUIDED_TOUR, 2.0, 50.00, 15,
                        "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad" },
                { "Berlin Wall History Walk", "Berlin", "Germany",
                        "Trace Cold War history along remaining wall sections with historian guide",
                        ExperienceCategory.GUIDED_TOUR, 3.5, 35.00, 12,
                        "https://images.unsplash.com/photo-1560969184-10fe8719e047" },
                { "Flamenco Show and Tour", "Seville", "Spain",
                        "Evening tour of flamenco heritage sites followed by authentic tablao performance",
                        ExperienceCategory.GUIDED_TOUR, 4.0, 85.00, 20,
                        "https://images.unsplash.com/photo-1547619292-240402b5e5a6" },
                { "Photography Walking Tour", "Tokyo", "Japan",
                        "Capture neon streets and hidden shrines with professional photographer mentor",
                        ExperienceCategory.GUIDED_TOUR, 3.5, 90.00, 6,
                        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf" },
                { "Bike Tour Through Vineyards", "Tuscany", "Italy",
                        "Cycle through rolling hills visiting wineries and medieval hilltop towns",
                        ExperienceCategory.GUIDED_TOUR, 6.0, 125.00, 8,
                        "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9" },
                { "Jewish Quarter Heritage Walk", "Prague", "Czech Republic",
                        "Explore historic synagogues and learn about Jewish history with expert guide",
                        ExperienceCategory.GUIDED_TOUR, 2.5, 45.00, 12,
                        "https://images.unsplash.com/photo-1541849546-216549ae216d" },
                { "Versailles Palace Day Trip", "Versailles", "France",
                        "Full guided tour of palace, gardens and Marie Antoinette's estate with transport",
                        ExperienceCategory.GUIDED_TOUR, 6.5, 140.00, 15,
                        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa" },
                { "Hagia Sophia History Tour", "Istanbul", "Turkey",
                        "Explore 1500-year-old Byzantine masterpiece with architectural historian",
                        ExperienceCategory.GUIDED_TOUR, 2.0, 40.00, 15,
                        "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200" },
                { "Chinatown Food and Culture Walk", "Singapore", "Singapore",
                        "Sample hawker food while learning about Chinese heritage and temples",
                        ExperienceCategory.GUIDED_TOUR, 3.0, 55.00, 12,
                        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd" },

                // WORKSHOP Experiences (16 new)
                { "Traditional Sushi Making", "Tokyo", "Japan",
                        "Learn authentic sushi preparation from master chef in intimate setting",
                        ExperienceCategory.WORKSHOP, 3.0, 95.00, 8,
                        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351" },
                { "Italian Pasta Making Class", "Florence", "Italy",
                        "Create fresh pasta from scratch with local nonna including wine tasting",
                        ExperienceCategory.WORKSHOP, 3.5, 85.00, 10,
                        "https://images.unsplash.com/photo-1612874742237-6526221588e3" },
                { "Spanish Paella Cooking", "Valencia", "Spain",
                        "Cook authentic paella over wood fire with Michelin-trained chef",
                        ExperienceCategory.WORKSHOP, 4.0, 75.00, 12,
                        "https://images.unsplash.com/photo-1534080564583-6be75777b70a" },
                { "Thai Fruit Carving Class", "Chiang Mai", "Thailand",
                        "Learn traditional Thai art of vegetable and fruit sculpture",
                        ExperienceCategory.WORKSHOP, 2.5, 45.00, 10,
                        "https://images.unsplash.com/photo-1528712306091-ed0763094c98" },
                { "French Pastry Workshop", "Paris", "France",
                        "Master croissant and macaron techniques in professional patisserie kitchen",
                        ExperienceCategory.WORKSHOP, 4.0, 120.00, 8,
                        "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086" },
                { "Peruvian Ceviche Class", "Lima", "Peru",
                        "Prepare traditional ceviche and pisco sour with celebrated local chef",
                        ExperienceCategory.WORKSHOP, 3.0, 70.00, 10,
                        "https://images.unsplash.com/photo-1626074353765-517a6387a180" },
                { "Moroccan Tagine Cooking", "Marrakech", "Morocco",
                        "Cook traditional tagine after shopping at local spice markets",
                        ExperienceCategory.WORKSHOP, 5.0, 65.00, 8,
                        "https://images.unsplash.com/photo-1547592166-23ac45744acd" },
                { "Aboriginal Dot Painting", "Alice Springs", "Australia",
                        "Learn indigenous art techniques from Aboriginal artists sharing cultural stories",
                        ExperienceCategory.WORKSHOP, 2.5, 55.00, 12,
                        "https://images.unsplash.com/photo-1513364776144-60967b0f800f" },
                { "Jewelry Making Workshop", "Ubud", "Indonesia",
                        "Create silver jewelry using traditional Balinese metalworking techniques",
                        ExperienceCategory.WORKSHOP, 3.5, 80.00, 6,
                        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908" },
                { "Photography Masterclass", "Reykjavik", "Iceland",
                        "Master landscape photography techniques for Northern Lights and waterfalls",
                        ExperienceCategory.WORKSHOP, 4.0, 140.00, 8,
                        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e" },
                { "Flamenco Dance Lesson", "Granada", "Spain",
                        "Learn passionate flamenco footwork and arm movements from professional dancer",
                        ExperienceCategory.WORKSHOP, 2.0, 50.00, 10,
                        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad" },
                { "Wood Carving Traditional Art", "Bali", "Indonesia",
                        "Create Balinese-style wooden sculptures with master carver",
                        ExperienceCategory.WORKSHOP, 3.0, 60.00, 8,
                        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b" },
                { "Calligraphy Japanese Art", "Kyoto", "Japan",
                        "Practice shodo brush calligraphy with tea ceremony master",
                        ExperienceCategory.WORKSHOP, 2.5, 70.00, 8,
                        "https://images.unsplash.com/photo-1616400619175-5beda3a17896" },
                { "Mosaic Art Workshop", "Barcelona", "Spain",
                        "Create Gaudi-inspired mosaic tile art using trencadís technique",
                        ExperienceCategory.WORKSHOP, 3.0, 65.00, 10,
                        "https://images.unsplash.com/photo-1513364776144-60967b0f800f" },
                { "Perfume Making Class", "Grasse", "France",
                        "Blend your own signature fragrance in world perfume capital",
                        ExperienceCategory.WORKSHOP, 2.5, 110.00, 8,
                        "https://images.unsplash.com/photo-1541643600914-78b084683601" },
                { "Leather Crafting Workshop", "Florence", "Italy",
                        "Hand-craft leather goods using traditional Florentine techniques",
                        ExperienceCategory.WORKSHOP, 3.5, 95.00, 8,
                        "https://images.unsplash.com/photo-1590736969955-71cc94901144" },

                // WATER_ACTIVITY Experiences (11 new)
                { "Phi Phi Island Snorkeling", "Phuket", "Thailand",
                        "Explore pristine coral reefs and Maya Bay by speedboat with marine biologist",
                        ExperienceCategory.WATER_ACTIVITY, 8.0, 110.00, 15,
                        "https://images.unsplash.com/photo-1544551763-46a013bb70d5" },
                { "Kayaking Venice Canals", "Venice", "Italy",
                        "Paddle through hidden waterways and under historic bridges at sunrise",
                        ExperienceCategory.WATER_ACTIVITY, 3.0, 70.00, 8,
                        "https://images.unsplash.com/photo-1544552866-d3ed42536cfd" },
                { "Stand-Up Paddleboarding", "Barcelona", "Spain",
                        "Glide along Mediterranean coast with skyline views and beach time",
                        ExperienceCategory.WATER_ACTIVITY, 2.5, 45.00, 10,
                        "https://images.unsplash.com/photo-1473773508845-188df298d2d1" },
                { "Scuba Diving Certification", "Koh Tao", "Thailand",
                        "Complete PADI Open Water course in crystal clear tropical waters",
                        ExperienceCategory.WATER_ACTIVITY, 16.0, 380.00, 4,
                        "https://images.unsplash.com/photo-1559827260-dc66d52bef19" },
                { "Whale Watching Excursion", "Hervey Bay", "Australia",
                        "Witness humpback whales during annual migration with marine experts",
                        ExperienceCategory.WATER_ACTIVITY, 4.0, 140.00, 20,
                        "https://images.unsplash.com/photo-1559827260-dc66d52bef19" },
                { "White Water Rafting", "Banos", "Ecuador",
                        "Navigate Class 3-4 rapids through Amazon jungle gateway",
                        ExperienceCategory.WATER_ACTIVITY, 5.0, 85.00, 8,
                        "https://images.unsplash.com/photo-1527004013197-933c4bb611b3" },
                { "Sailing Catamaran Sunset", "Santorini", "Greece",
                        "Private catamaran cruise around caldera with dinner and swimming",
                        ExperienceCategory.WATER_ACTIVITY, 5.0, 180.00, 12,
                        "https://images.unsplash.com/photo-1544551763-46a013bb70d5" },
                { "Sea Kayaking Adventure", "Abel Tasman", "New Zealand",
                        "Multi-day kayaking expedition through pristine coastal national park",
                        ExperienceCategory.WATER_ACTIVITY, 24.0, 420.00, 8,
                        "https://images.unsplash.com/photo-1544552866-d3ed42536cfd" },
                { "Windsurf Lessons", "Tarifa", "Spain",
                        "Learn windsurfing in Europe's wind capital with certified instructors",
                        ExperienceCategory.WATER_ACTIVITY, 3.0, 90.00, 6,
                        "https://images.unsplash.com/photo-1502680390469-be75c86b636f" },
                { "Jet Ski Island Tour", "Phuket", "Thailand",
                        "High-speed adventure around tropical islands with snorkel stops",
                        ExperienceCategory.WATER_ACTIVITY, 4.0, 120.00, 10,
                        "https://images.unsplash.com/photo-1559827260-dc66d52bef19" },
                { "Freediving Introduction", "Dahab", "Egypt",
                        "Learn breath-hold diving techniques in famous Blue Hole",
                        ExperienceCategory.WATER_ACTIVITY, 6.0, 130.00, 6,
                        "https://images.unsplash.com/photo-1544551763-46a013bb70d5" },

                // DAYTRIP Experiences (13 new)
                { "Champagne House Tasting", "Reims", "France",
                        "Visit three prestigious champagne houses with cellar tours and tastings",
                        ExperienceCategory.DAYTRIP, 7.0, 195.00, 8,
                        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3" },
                { "Mount Fuji and Hakone", "Tokyo", "Japan",
                        "Full-day tour to Mt Fuji 5th station, lake cruise and hot spring resort",
                        ExperienceCategory.DAYTRIP, 10.0, 150.00, 20,
                        "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65" },
                { "Cinque Terre Hiking", "La Spezia", "Italy",
                        "Hike coastal path connecting five colorful villages with train passes",
                        ExperienceCategory.DAYTRIP, 8.0, 95.00, 12,
                        "https://images.unsplash.com/photo-1516483638261-f4dbaf036963" },
                { "Montserrat Monastery Visit", "Barcelona", "Spain",
                        "Mountain railway to spiritual monastery with boys choir performance",
                        ExperienceCategory.DAYTRIP, 6.0, 75.00, 15,
                        "https://images.unsplash.com/photo-1539037116277-4db20889f2d4" },
                { "Ayutthaya Ruins Day Tour", "Bangkok", "Thailand",
                        "Explore ancient capital's temple ruins by bicycle and river boat",
                        ExperienceCategory.DAYTRIP, 9.0, 80.00, 12,
                        "https://images.unsplash.com/photo-1563492065599-3520f775eeed" },
                { "Loire Valley Castles", "Tours", "France",
                        "Visit Chambord, Chenonceau and Amboise châteaux with wine tasting",
                        ExperienceCategory.DAYTRIP, 10.0, 160.00, 8,
                        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08" },
                { "Machu Picchu Full Day", "Cusco", "Peru",
                        "Guided tour of Incan citadel via scenic train with buffet lunch",
                        ExperienceCategory.DAYTRIP, 14.0, 240.00, 15,
                        "https://images.unsplash.com/photo-1526392060635-9d6019884377" },
                { "Essaouira Coastal Escape", "Marrakech", "Morocco",
                        "Day trip to fishing port with medina walk, seafood lunch and beach time",
                        ExperienceCategory.DAYTRIP, 10.0, 70.00, 12,
                        "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43" },
                { "Blue Mountains Explorer", "Sydney", "Australia",
                        "Visit Three Sisters, Scenic Railway and wildlife park with bushwalk",
                        ExperienceCategory.DAYTRIP, 9.0, 110.00, 15,
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" },
                { "Stonehenge and Bath", "London", "United Kingdom",
                        "Ancient monument visit combined with Roman baths and Georgian architecture",
                        ExperienceCategory.DAYTRIP, 11.0, 145.00, 20,
                        "https://images.unsplash.com/photo-1599833975787-5436f3b50c0e" },
                { "Plitvice Lakes National Park", "Zagreb", "Croatia",
                        "Explore cascading lakes and waterfalls on wooden walkways through forest",
                        ExperienceCategory.DAYTRIP, 8.0, 85.00, 12,
                        "https://images.unsplash.com/photo-1608481337062-4093bf3ed404" },
                { "Nara Deer Park and Temples", "Osaka", "Japan",
                        "Feed sacred deer and visit Todai-ji temple with giant Buddha statue",
                        ExperienceCategory.DAYTRIP, 6.0, 90.00, 15,
                        "https://images.unsplash.com/photo-1528360983277-13d401cdc186" },
                { "Amalfi Coast Drive", "Naples", "Italy",
                        "Scenic coastal drive visiting Positano, Amalfi and Ravello with lunch",
                        ExperienceCategory.DAYTRIP, 10.0, 165.00, 8,
                        "https://images.unsplash.com/photo-1534445867742-43195f401b6c" },

                // OTHERS Experiences (9 new)
                { "Hot Air Balloon Sunrise", "Cappadocia", "Turkey",
                        "Float above fairy chimneys and rock formations at dawn with champagne toast",
                        ExperienceCategory.OTHERS, 3.0, 220.00, 16,
                        "https://images.unsplash.com/photo-1494222159058-76e34e3b3f2b" },
                { "Traditional Hamam Spa", "Istanbul", "Turkey",
                        "Authentic Turkish bath with scrub, foam massage and relaxation room",
                        ExperienceCategory.OTHERS, 2.5, 65.00, 20,
                        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874" },
                { "Elephant Sanctuary Visit", "Chiang Mai", "Thailand",
                        "Ethical elephant interaction, feeding and bathing in natural habitat",
                        ExperienceCategory.OTHERS, 4.0, 95.00, 12,
                        "https://images.unsplash.com/photo-1564760055775-d63b17a55c44" },
                { "Meditation Temple Retreat", "Kyoto", "Japan",
                        "Zen meditation session with monks in ancient mountain temple",
                        ExperienceCategory.OTHERS, 3.0, 75.00, 10,
                        "https://images.unsplash.com/photo-1508672019048-805c876b67e2" },
                { "Truffle Hunting Experience", "Piedmont", "Italy",
                        "Search for white truffles with trained dogs and truffle-based lunch",
                        ExperienceCategory.OTHERS, 4.0, 180.00, 8,
                        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d" },
                { "Stargazing Desert Night", "Atacama", "Chile",
                        "Astronomical observation in clearest skies on Earth with expert astronomer",
                        ExperienceCategory.OTHERS, 3.5, 105.00, 15,
                        "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a" },
                { "Yoga Beach Sunrise", "Bali", "Indonesia",
                        "Morning yoga session on beach followed by healthy breakfast bowl",
                        ExperienceCategory.OTHERS, 2.0, 35.00, 20,
                        "https://images.unsplash.com/photo-1506126613408-eca07ce68773" },
                { "Wildlife Safari Evening", "Serengeti", "Tanzania",
                        "Sunset game drive spotting lions, elephants and giraffes with naturalist",
                        ExperienceCategory.OTHERS, 4.0, 190.00, 6,
                        "https://images.unsplash.com/photo-1516426122078-c23e76319801" },
                { "Sound Bath Meditation", "Sedona", "United States",
                        "Therapeutic sound healing session with crystal bowls in red rock setting",
                        ExperienceCategory.OTHERS, 1.5, 55.00, 15,
                        "https://images.unsplash.com/photo-1545389336-cf090694435e" },

                // === DEMO EXPERIENCES FOR AI CHATBOT (15 experiences: 5 India, 5 China, 5 USA) ===
                // These experiences are specifically designed for January 2026 trip planning demo
                // Locations are within 300km radius, schedules are non-overlapping with travel buffers
                
                // INDIA - Delhi NCR Region (5 experiences within 250km)
                { "Old Delhi Heritage Walk", "New Delhi", "India",
                        "Explore narrow lanes of Old Delhi visiting Jama Masjid, spice market and historic havelis with local historian",
                        ExperienceCategory.GUIDED_TOUR, 4.0, 45.00, 15,
                        "https://images.unsplash.com/photo-1587474260584-136574528ed5" },
                { "Taj Mahal Sunrise Tour", "Agra", "India",
                        "Early morning visit to iconic Taj Mahal followed by Agra Fort with expert guide and breakfast",
                        ExperienceCategory.DAYTRIP, 12.0, 85.00, 20,
                        "https://images.unsplash.com/photo-1564507592333-c60657eea523" },
                { "Jaipur Pink City Explorer", "Jaipur", "India",
                        "Full-day tour of Amber Fort, City Palace, Hawa Mahal and local bazaars with traditional Rajasthani lunch",
                        ExperienceCategory.DAYTRIP, 10.0, 95.00, 12,
                        "https://images.unsplash.com/photo-1599661046289-e31897846e41" },
                { "Cooking Class Mughlai Cuisine", "New Delhi", "India",
                        "Learn authentic Mughlai dishes including biryani and kebabs in home kitchen with family meal",
                        ExperienceCategory.WORKSHOP, 5.0, 65.00, 8,
                        "https://images.unsplash.com/photo-1585937421612-70a008356fbe" },
                { "Ranthambore Tiger Safari", "Sawai Madhopur", "India",
                        "Morning wildlife safari in Ranthambore National Park with expert naturalist tracking Bengal tigers",
                        ExperienceCategory.ADVENTURE, 6.0, 120.00, 6,
                        "https://images.unsplash.com/photo-1612817288484-6f916006741a" },

                // CHINA - Beijing Area (5 experiences within 200km)
                { "Forbidden City Imperial Tour", "Beijing", "China",
                        "Skip-the-line guided tour of vast Forbidden City palace complex with imperial history expert",
                        ExperienceCategory.GUIDED_TOUR, 4.5, 75.00, 15,
                        "https://images.unsplash.com/photo-1508804185872-d7badad00f7d" },
                { "Great Wall Hiking Adventure", "Mutianyu", "China",
                        "Hike restored sections of Great Wall with cable car access and authentic Chinese lunch",
                        ExperienceCategory.ADVENTURE, 8.0, 110.00, 12,
                        "https://images.unsplash.com/photo-1508804185872-d7badad00f7d" },
                { "Beijing Hutong Bike Tour", "Beijing", "China",
                        "Cycle through traditional alleyways visiting local homes, courtyard gardens and hidden temples",
                        ExperienceCategory.GUIDED_TOUR, 3.5, 50.00, 10,
                        "https://images.unsplash.com/photo-1537895058180-0c91e59d2361" },
                { "Chinese Calligraphy Workshop", "Beijing", "China",
                        "Learn ancient art of brush calligraphy with master artist and create your own artwork",
                        ExperienceCategory.WORKSHOP, 3.0, 60.00, 8,
                        "https://images.unsplash.com/photo-1616400619175-5beda3a17896" },
                { "Temple of Heaven Morning Ritual", "Beijing", "China",
                        "Early morning visit to see locals practicing tai chi, traditional music and morning exercises",
                        ExperienceCategory.OTHERS, 2.5, 35.00, 20,
                        "https://images.unsplash.com/photo-1508804185872-d7badad00f7d" },

                // USA - New York Area (5 experiences within 150km)
                { "Statue of Liberty & Ellis Island", "New York City", "United States",
                        "Ferry tour to Liberty Island and Ellis Island Immigration Museum with skip-the-line access",
                        ExperienceCategory.GUIDED_TOUR, 5.0, 85.00, 25,
                        "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee" },
                { "Central Park Guided Walk", "New York City", "United States",
                        "Explore iconic Central Park landmarks, Bethesda Fountain, Bow Bridge and Strawberry Fields",
                        ExperienceCategory.GUIDED_TOUR, 3.0, 45.00, 15,
                        "https://images.unsplash.com/photo-1551632811-561732d1e306" },
                { "Broadway Theater Experience", "New York City", "United States",
                        "Premium orchestra seats to top Broadway show with pre-theater dinner at Times Square restaurant",
                        ExperienceCategory.OTHERS, 5.0, 280.00, 10,
                        "https://images.unsplash.com/photo-1503095396549-807759245b35" },
                { "Brooklyn Food Tour", "Brooklyn", "United States",
                        "Taste artisanal foods in Williamsburg and DUMBO neighborhoods with local foodie guide",
                        ExperienceCategory.GUIDED_TOUR, 4.0, 95.00, 12,
                        "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8" },
                { "Niagara Falls Day Trip", "Niagara Falls", "United States",
                        "Full-day excursion to Niagara Falls with Maid of the Mist boat ride and Cave of the Winds",
                        ExperienceCategory.DAYTRIP, 14.0, 180.00, 20,
                        "https://images.unsplash.com/photo-1489447068241-b3490214e879" }
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
            
            // Set price and initialize discount fields
            BigDecimal price = BigDecimal.valueOf((Double) data[6]);
            experience.setPrice(price);
            experience.setOriginalPrice(price); // Initialize originalPrice same as price
            experience.setDiscountPercentage(BigDecimal.ZERO); // No discount initially
            experience.setLastPriceUpdate(LocalDateTime.now()); // Set initial price update time
            
            experience.setParticipantsAllowed((Integer) data[7]);
            experience.setCoverPhotoUrl((String) data[8]);
            experience.setStatus(ExperienceStatus.ACTIVE);
            experience.setTotalStars(BigDecimal.ZERO); // Will be updated when reviews are created
            experience.setTotalReviews(0); // Will be updated when reviews are created
            experience.setAverageRating(BigDecimal.ZERO); // Will be calculated from totalStars/totalReviews
            experience.setViewCount(20 + random.nextInt(481)); // Random view count between 20-500
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

    /**
     * Create itineraries for 50 multi-location experiences
     * - 30 experiences with START → END only (simple point-to-point)
     * - 20 experiences with START → STOP(s) → END (1-4 intermediate stops)
     * Focus on GUIDED_TOUR, DAYTRIP, ADVENTURE categories
     */
    private List<ExperienceItinerary> createExperienceItineraries(List<Experience> experiences) {
        List<ExperienceItinerary> allItineraries = new ArrayList<>();
        
        int totalExperiences = experiences.size();
        int demoStartIndex = totalExperiences - 15;
        
        // Select 50 specific experiences by index for itineraries from original 100 experiences
        // Distribution: First 30 = START→END, Next 20 = START→STOP(S)→END
        int[] experienceIndices = {
            // GUIDED_TOUR experiences (indices 0, 5, 10, 16-31 = 18 experiences)
            0, 5, 10, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
            // DAYTRIP experiences (indices 1, 6, 77-89 = 15 experiences)
            1, 6, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
            // ADVENTURE experiences (indices 2, 7, 11, 32-44 = 15 experiences)
            2, 7, 11, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
            // Mix of other categories (2 experiences)
            14, 90
        };
        
        // Add 8 demo experiences with itineraries (last 15 experiences)
        // Simple itineraries (START→END): India #0,2,4, China #5,7, USA #10,12
        // Complex itineraries (START→STOP→END): India #1, China #6
        int[] demoWithItineraries = {
            demoStartIndex + 0,  // India: Old Delhi Heritage Walk (simple)
            demoStartIndex + 1,  // India: Taj Mahal Sunrise Tour (complex - Agra)
            demoStartIndex + 2,  // India: Jaipur Pink City Explorer (simple)
            demoStartIndex + 4,  // India: Ranthambore Tiger Safari (simple)
            demoStartIndex + 5,  // China: Forbidden City Imperial Tour (simple)
            demoStartIndex + 6,  // China: Great Wall Hiking Adventure (complex)
            demoStartIndex + 7,  // China: Beijing Hutong Bike Tour (simple)
            demoStartIndex + 10  // USA: Statue of Liberty & Ellis Island (simple)
        };
        
        System.out.println("Creating itineraries for 50 original + 8 demo experiences...");
        
        // Create itineraries for original 50 experiences
        for (int i = 0; i < experienceIndices.length && i < 50; i++) {
            int expIndex = experienceIndices[i];
            if (expIndex >= experiences.size()) continue;
            
            Experience experience = experiences.get(expIndex);
            List<ExperienceItinerary> expItineraries = new ArrayList<>();
            
            // First 30 experiences: START → END only
            if (i < 30) {
                expItineraries = createSimpleItinerary(experience, i + 1);
            } 
            // Next 20 experiences: START → STOP(S) → END
            else {
                expItineraries = createComplexItinerary(experience, i + 1);
            }
            
            // Save all itineraries for this experience
            for (ExperienceItinerary itinerary : expItineraries) {
                allItineraries.add(experienceItineraryRepository.save(itinerary));
            }
        }
        
        // Create itineraries for 8 demo experiences
        for (int i = 0; i < demoWithItineraries.length; i++) {
            int expIndex = demoWithItineraries[i];
            if (expIndex >= experiences.size()) continue;
            
            Experience experience = experiences.get(expIndex);
            List<ExperienceItinerary> expItineraries = new ArrayList<>();
            
            // Demo experiences: 2 complex (indices 1, 6), rest simple
            if (i == 1 || i == 5) {
                // Complex itinerary for Taj Mahal (India) and Great Wall (China)
                expItineraries = createComplexItinerary(experience, 100 + i);
            } else {
                // Simple itinerary for the rest
                expItineraries = createSimpleItinerary(experience, 100 + i);
            }
            
            // Save all itineraries for this experience
            for (ExperienceItinerary itinerary : expItineraries) {
                allItineraries.add(experienceItineraryRepository.save(itinerary));
            }
        }
        
        System.out.println("Created " + allItineraries.size() + " itinerary items for " + 
            allItineraries.stream().map(i -> i.getExperience().getExperienceId()).distinct().count() + " experiences");
        
        return allItineraries;
    }
    
    /**
     * Create simple START → END itinerary (no intermediate stops)
     */
    private List<ExperienceItinerary> createSimpleItinerary(Experience experience, int seed) {
        List<ExperienceItinerary> itineraries = new ArrayList<>();
        
        // START point (using experience's location)
        ExperienceItinerary start = new ExperienceItinerary();
        start.setExperience(experience);
        start.setStopOrder(1);
        start.setStopType("start");
        start.setLocationName(experience.getLocation() + " Meeting Point");
        start.setDuration(""); // No duration for start point
        start.setLatitude(experience.getLatitude());
        start.setLongitude(experience.getLongitude());
        start.setCreatedAt(LocalDateTime.now());
        itineraries.add(start);
        
        // END point (slightly offset from start for variety)
        ExperienceItinerary end = new ExperienceItinerary();
        end.setExperience(experience);
        end.setStopOrder(2);
        end.setStopType("end");
        end.setLocationName(getEndLocationName(experience, seed));
        end.setDuration(""); // No duration for end point
        // Offset end coordinates slightly (0.01-0.05 degrees, roughly 1-5km)
        BigDecimal latOffset = BigDecimal.valueOf((seed % 5 + 1) * 0.01);
        BigDecimal lonOffset = BigDecimal.valueOf((seed % 3 + 1) * 0.01);
        end.setLatitude(experience.getLatitude().add(latOffset));
        end.setLongitude(experience.getLongitude().add(lonOffset));
        end.setCreatedAt(LocalDateTime.now());
        itineraries.add(end);
        
        return itineraries;
    }
    
    /**
     * Create complex START → STOP(S) → END itinerary (1-4 intermediate stops)
     */
    private List<ExperienceItinerary> createComplexItinerary(Experience experience, int seed) {
        List<ExperienceItinerary> itineraries = new ArrayList<>();
        
        // Determine number of stops (1-4) based on experience duration
        double durationHours = experience.getDuration().doubleValue();
        int numStops;
        if (durationHours >= 8) {
            numStops = 3 + (seed % 2); // 3-4 stops for long experiences
        } else if (durationHours >= 5) {
            numStops = 2 + (seed % 2); // 2-3 stops for medium experiences
        } else {
            numStops = 1 + (seed % 2); // 1-2 stops for shorter experiences
        }
        
        // START point
        ExperienceItinerary start = new ExperienceItinerary();
        start.setExperience(experience);
        start.setStopOrder(1);
        start.setStopType("start");
        start.setLocationName(experience.getLocation() + " Meeting Point");
        start.setDuration("");
        start.setLatitude(experience.getLatitude());
        start.setLongitude(experience.getLongitude());
        start.setCreatedAt(LocalDateTime.now());
        itineraries.add(start);
        
        // Calculate time allocation for stops
        double availableHours = durationHours * 0.8; // 80% of total time for stops
        double timePerStop = availableHours / numStops;
        
        // Create intermediate STOP(S)
        for (int i = 0; i < numStops; i++) {
            ExperienceItinerary stop = new ExperienceItinerary();
            stop.setExperience(experience);
            stop.setStopOrder(i + 2); // Order: START(1), STOP(2), STOP(3), ..., END(last)
            stop.setStopType("stop");
            stop.setLocationName(getStopLocationName(experience, i + 1, seed));
            
            // Format duration (in hours or minutes)
            stop.setDuration(formatDuration(timePerStop));
            
            // Calculate intermediate coordinates (spread stops between start and end)
            double progress = (double)(i + 1) / (numStops + 1);
            BigDecimal latOffset = BigDecimal.valueOf(progress * 0.05 * (1 + seed % 3));
            BigDecimal lonOffset = BigDecimal.valueOf(progress * 0.05 * (1 + seed % 2));
            stop.setLatitude(experience.getLatitude().add(latOffset));
            stop.setLongitude(experience.getLongitude().add(lonOffset));
            stop.setCreatedAt(LocalDateTime.now());
            itineraries.add(stop);
        }
        
        // END point
        ExperienceItinerary end = new ExperienceItinerary();
        end.setExperience(experience);
        end.setStopOrder(numStops + 2); // After all stops
        end.setStopType("end");
        end.setLocationName(getEndLocationName(experience, seed));
        end.setDuration("");
        // End point furthest from start
        BigDecimal latOffset = BigDecimal.valueOf(0.06 * (1 + seed % 3));
        BigDecimal lonOffset = BigDecimal.valueOf(0.06 * (1 + seed % 2));
        end.setLatitude(experience.getLatitude().add(latOffset));
        end.setLongitude(experience.getLongitude().add(lonOffset));
        end.setCreatedAt(LocalDateTime.now());
        itineraries.add(end);
        
        return itineraries;
    }
    
    /**
     * Helper: Get appropriate end location name based on experience
     */
    private String getEndLocationName(Experience experience, int seed) {
        String[] endings = {
            experience.getLocation() + " City Center",
            experience.getLocation() + " Viewpoint",
            experience.getLocation() + " Main Square",
            experience.getLocation() + " Harbor",
            experience.getLocation() + " Station"
        };
        return endings[seed % endings.length];
    }
    
    /**
     * Helper: Get stop location name based on experience and stop number
     */
    private String getStopLocationName(Experience experience, int stopNum, int seed) {
        String[] stopTypes = {
            "Historic Site", "Scenic Overlook", "Local Market", "Cultural Monument",
            "Popular Landmark", "Hidden Gem", "Artisan Quarter", "Viewpoint",
            "Traditional District", "Waterfront Area", "Temple", "Museum"
        };
        return experience.getLocation() + " " + stopTypes[(seed + stopNum) % stopTypes.length];
    }
    
    /**
     * Helper: Format duration in hours/minutes
     */
    private String formatDuration(double hours) {
        if (hours >= 1) {
            int wholeHours = (int) hours;
            int minutes = (int) ((hours - wholeHours) * 60);
            if (minutes > 0) {
                return wholeHours + " hour" + (wholeHours > 1 ? "s" : "") + " " + minutes + " min";
            }
            return wholeHours + " hour" + (wholeHours > 1 ? "s" : "");
        } else {
            int minutes = (int) (hours * 60);
            return minutes + " minutes";
        }
    }

    private List<ExperienceSchedule> createExperienceSchedules(List<Experience> experiences) {
        List<ExperienceSchedule> allSchedules = new ArrayList<>();
        
        // Determine if this is a demo experience (last 15 experiences)
        int totalExperiences = experiences.size();
        int demoStartIndex = totalExperiences - 15;

        for (int expIndex = 0; expIndex < experiences.size(); expIndex++) {
            Experience experience = experiences.get(expIndex);
            boolean isDemoExperience = expIndex >= demoStartIndex;
            
            if (isDemoExperience) {
                // Special handling for demo experiences - create specific January 2026 schedules
                allSchedules.addAll(createDemoSchedules(experience, expIndex - demoStartIndex));
            } else {
                // Regular experiences - create 3-5 schedules from November 2025 onwards
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
                    schedule.setAvailableSpots(experience.getParticipantsAllowed());
                    schedule.setIsAvailable(true);
                    schedule.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));

                    allSchedules.add(experienceScheduleRepository.save(schedule));
                }
            }
        }
        return allSchedules;
    }
    
    /**
     * Create specific January 2026 schedules for demo experiences with smart timing
     * Ensures non-overlapping schedules with proper travel buffers between cities
     */
    private List<ExperienceSchedule> createDemoSchedules(Experience experience, int demoIndex) {
        List<ExperienceSchedule> schedules = new ArrayList<>();
        
        // Define schedule patterns for each demo experience (0-14)
        // India experiences (0-4): Jan 10-18, 2026
        // China experiences (5-9): Jan 19-27, 2026  
        // USA experiences (10-14): Jan 28 - Feb 5, 2026
        
        LocalDateTime baseDate;
        int scheduleCount = 2; // Create 2 schedules per demo experience
        
        if (demoIndex < 5) {
            // INDIA experiences - January 10-18, 2026
            baseDate = LocalDateTime.of(2026, 1, 10, 9, 0);
            baseDate = baseDate.plusDays(demoIndex * 2); // Space out by 2 days for travel between cities
            
        } else if (demoIndex < 10) {
            // CHINA experiences - January 19-27, 2026
            baseDate = LocalDateTime.of(2026, 1, 19, 9, 0);
            baseDate = baseDate.plusDays((demoIndex - 5) * 2); // Space out by 2 days
            
        } else {
            // USA experiences - January 28 - February 5, 2026
            baseDate = LocalDateTime.of(2026, 1, 28, 9, 0);
            baseDate = baseDate.plusDays((demoIndex - 10) * 2); // Space out by 2 days
        }
        
        // Create morning and afternoon/evening schedules
        int[] hourOffsets = {0, 6}; // Morning (9 AM) and Afternoon (3 PM)
        
        for (int i = 0; i < scheduleCount; i++) {
            ExperienceSchedule schedule = new ExperienceSchedule();
            schedule.setExperience(experience);
            
            LocalDateTime startTime = baseDate.plusDays(i).withHour(9 + hourOffsets[i]).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime endTime = startTime.plusHours(experience.getDuration().longValue());
            
            schedule.setStartDateTime(startTime);
            schedule.setEndDateTime(endTime);
            schedule.setAvailableSpots(experience.getParticipantsAllowed());
            schedule.setIsAvailable(true);
            schedule.setCreatedAt(LocalDateTime.now().minusDays(5));
            
            schedules.add(experienceScheduleRepository.save(schedule));
        }
        
        return schedules;
    }

    /**
     * Helper method to create past schedules for completed bookings
     */
    private List<ExperienceSchedule> createPastSchedules(List<ExperienceSchedule> originalSchedules, int count) {
        List<ExperienceSchedule> pastSchedules = new ArrayList<>();
        for (int i = 0; i < Math.min(count, originalSchedules.size() * 3); i++) {
            ExperienceSchedule original = originalSchedules.get(i % originalSchedules.size());
            ExperienceSchedule pastSchedule = new ExperienceSchedule();
            pastSchedule.setExperience(original.getExperience());
            LocalDateTime pastStartTime = LocalDateTime.now()
                    .minusDays(7 + random.nextInt(90)) // 7-97 days ago
                    .withHour(8 + random.nextInt(12))
                    .withMinute(random.nextInt(4) * 15)
                    .withSecond(0)
                    .withNano(0);
            pastSchedule.setStartDateTime(pastStartTime);
            pastSchedule.setEndDateTime(pastStartTime.plusHours(original.getExperience().getDuration().longValue()));
            pastSchedule.setAvailableSpots(original.getExperience().getParticipantsAllowed());
            pastSchedule.setIsAvailable(false);
            pastSchedule.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
            pastSchedules.add(experienceScheduleRepository.save(pastSchedule));
        }
        return pastSchedules;
    }

    private List<Booking> createBookings(List<User> users, List<ExperienceSchedule> schedules) {
        List<Booking> bookings = new ArrayList<>();
        List<User> travelers = users.stream()
                .filter(user -> !user.getCanCreateExperiences())
                .toList();

        // Define cluster-specific booking counts
        java.util.Map<Integer, int[]> clusterBookingRange = java.util.Map.of(
            0, new int[]{8, 15},    // Luxury Cultural: 8-15 bookings
            1, new int[]{5, 10},    // Budget Social: 5-10 bookings
            2, new int[]{10, 18},   // Adventure: 10-18 bookings
            3, new int[]{2, 5}      // Light Casual: 2-5 bookings
        );
        
        // Define cluster-specific completion rates
        java.util.Map<Integer, Double> clusterCompletionRate = java.util.Map.of(
            0, 0.90,  // 85-95%
            1, 0.80,  // 75-85%
            2, 0.95,  // 90-100%
            3, 0.68   // 60-75%
        );
        
        // Define cluster-specific preferred categories
        java.util.Map<Integer, ExperienceCategory[]> clusterPreferredCategories = java.util.Map.of(
            0, new ExperienceCategory[]{ExperienceCategory.GUIDED_TOUR, ExperienceCategory.WORKSHOP, ExperienceCategory.DAYTRIP},
            1, new ExperienceCategory[]{ExperienceCategory.GUIDED_TOUR, ExperienceCategory.WORKSHOP, ExperienceCategory.WATER_ACTIVITY},
            2, new ExperienceCategory[]{ExperienceCategory.ADVENTURE, ExperienceCategory.WATER_ACTIVITY, ExperienceCategory.DAYTRIP},
            3, new ExperienceCategory[]{ExperienceCategory.GUIDED_TOUR, ExperienceCategory.WORKSHOP, ExperienceCategory.OTHERS}
        );
        
        // Create past schedules for completed bookings (increase to 300 for better variety across all experiences)
        List<ExperienceSchedule> pastSchedules = createPastSchedules(schedules, 300);
        
        // STEP 1: Ensure at least 80 unique experiences get completed bookings (for reviews/ratings)
        // Group past schedules by experience
        java.util.Map<Long, List<ExperienceSchedule>> schedulesByExperience = new java.util.HashMap<>();
        for (ExperienceSchedule schedule : pastSchedules) {
            Long expId = schedule.getExperience().getExperienceId();
            schedulesByExperience.computeIfAbsent(expId, k -> new ArrayList<>()).add(schedule);
        }
        
        // Get list of unique experience IDs and shuffle for random distribution
        List<Long> experienceIds = new ArrayList<>(schedulesByExperience.keySet());
        java.util.Collections.shuffle(experienceIds);
        
        // Ensure first 80 experiences each get at least 2-3 completed bookings
        java.util.Set<Long> coveredExperiences = new java.util.HashSet<>();
        int targetExperiencesWithRatings = Math.min(80, experienceIds.size());
        
        for (int i = 0; i < targetExperiencesWithRatings && i < travelers.size(); i++) {
            Long expId = experienceIds.get(i % experienceIds.size());
            List<ExperienceSchedule> expSchedules = schedulesByExperience.get(expId);
            
            if (expSchedules != null && !expSchedules.isEmpty()) {
                // Create 2-3 bookings for this experience from different travelers
                int bookingsForExp = 2 + random.nextInt(2);
                for (int j = 0; j < bookingsForExp && (i * bookingsForExp + j) < travelers.size(); j++) {
                    User traveler = travelers.get((i * bookingsForExp + j) % travelers.size());
                    ExperienceSchedule schedule = expSchedules.get(random.nextInt(expSchedules.size()));
                    
                    Booking booking = createBookingWithDetails(traveler, schedule, BookingStatus.COMPLETED);
                    booking.setBookingDate(schedule.getStartDateTime().minusDays(random.nextInt(30) + 1));
                    booking.setCreatedAt(booking.getBookingDate());
                    bookings.add(bookingRepository.save(booking));
                    
                    coveredExperiences.add(expId);
                }
            }
        }
        
        System.out.println("Guaranteed bookings for " + coveredExperiences.size() + " unique experiences for ratings coverage");
        
        // STEP 2: Create additional cluster-specific bookings for each traveler
        for (User traveler : travelers) {
            int cluster = getUserCluster(traveler.getId());
            int[] bookingRange = clusterBookingRange.get(cluster);
            int totalBookings = bookingRange[0] + random.nextInt(bookingRange[1] - bookingRange[0] + 1);
            
            // Calculate how many should be completed vs future
            int completedBookings = (int) (totalBookings * clusterCompletionRate.get(cluster));
            int futureBookings = totalBookings - completedBookings;
            
            // Filter schedules by cluster preferences
            ExperienceCategory[] preferredCategories = clusterPreferredCategories.get(cluster);
            List<ExperienceSchedule> filteredPastSchedules = pastSchedules.stream()
                .filter(s -> Arrays.asList(preferredCategories).contains(s.getExperience().getCategory()))
                .toList();
            
            List<ExperienceSchedule> filteredFutureSchedules = schedules.stream()
                .filter(s -> Arrays.asList(preferredCategories).contains(s.getExperience().getCategory()))
                .toList();
            
            // Create completed bookings from past schedules
            List<ExperienceSchedule> usedSchedules = new ArrayList<>();
            for (int i = 0; i < completedBookings && filteredPastSchedules.size() > 0; i++) {
                // Find a schedule that hasn't been used by this user
                ExperienceSchedule schedule = null;
                int attempts = 0;
                while (attempts < 20 && schedule == null) {
                    ExperienceSchedule candidate = filteredPastSchedules.get(random.nextInt(filteredPastSchedules.size()));
                    if (!usedSchedules.contains(candidate)) {
                        schedule = candidate;
                    }
                    attempts++;
                }
                
                if (schedule != null) {
                    usedSchedules.add(schedule);
                    Booking booking = createBookingWithDetails(traveler, schedule, BookingStatus.COMPLETED);
                    booking.setBookingDate(schedule.getStartDateTime().minusDays(random.nextInt(30) + 1));
                    booking.setCreatedAt(booking.getBookingDate());
                    bookings.add(bookingRepository.save(booking));
                }
            }
            
            // Create future bookings (CONFIRMED, PENDING, CANCELLED)
            usedSchedules.clear();
            for (int i = 0; i < futureBookings && filteredFutureSchedules.size() > 0; i++) {
                // Find a schedule that hasn't been used by this user
                ExperienceSchedule schedule = null;
                int attempts = 0;
                while (attempts < 20 && schedule == null) {
                    ExperienceSchedule candidate = filteredFutureSchedules.get(random.nextInt(filteredFutureSchedules.size()));
                    if (!usedSchedules.contains(candidate)) {
                        schedule = candidate;
                    }
                    attempts++;
                }
                
                if (schedule != null) {
                    usedSchedules.add(schedule);
                    
                    BookingStatus status;
                    double statusRand = random.nextDouble();
                    if (statusRand < 0.6) status = BookingStatus.CONFIRMED;
                    else if (statusRand < 0.9) status = BookingStatus.PENDING;
                    else status = BookingStatus.CANCELLED;
                    
                    Booking booking = createBookingWithDetails(traveler, schedule, status);
                    booking.setBookingDate(LocalDateTime.now().minusDays(random.nextInt(7) + 1));
                    booking.setCreatedAt(booking.getBookingDate());
                    
                    if (status == BookingStatus.CANCELLED) {
                        booking.setCancellationReason("Changed travel plans");
                        booking.setCancelledAt(booking.getBookingDate().plusHours(random.nextInt(48)));
                    }
                    
                    bookings.add(bookingRepository.save(booking));
                }
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
                case CANCELLED_BY_TOURIST:
                case CANCELLED_BY_GUIDE:
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

                case PENDING:
                    // PENDING bookings have no transactions yet (awaiting payment)
                    break;
            }
        }
    }


    private void createWishlistItems(List<User> users, List<Experience> experiences) {
        // Create wishlist items for traveler users
        List<User> travelers = users.stream()
                .filter(user -> !user.getCanCreateExperiences())
                .toList();

        // Define cluster-specific preferred categories (same as booking preferences)
        java.util.Map<Integer, ExperienceCategory[]> clusterPreferredCategories = java.util.Map.of(
            0, new ExperienceCategory[]{ExperienceCategory.GUIDED_TOUR, ExperienceCategory.WORKSHOP, ExperienceCategory.DAYTRIP},
            1, new ExperienceCategory[]{ExperienceCategory.GUIDED_TOUR, ExperienceCategory.WORKSHOP, ExperienceCategory.WATER_ACTIVITY},
            2, new ExperienceCategory[]{ExperienceCategory.ADVENTURE, ExperienceCategory.WATER_ACTIVITY, ExperienceCategory.DAYTRIP},
            3, new ExperienceCategory[]{ExperienceCategory.GUIDED_TOUR, ExperienceCategory.WORKSHOP, ExperienceCategory.OTHERS}
        );

        for (User traveler : travelers) {
            int cluster = getUserCluster(traveler.getId());
            
            // Each traveler wishlist 2-5 experiences matching their cluster preferences
            int wishlistCount = 2 + random.nextInt(4);
            
            // Filter experiences by cluster preferences
            ExperienceCategory[] preferredCategories = clusterPreferredCategories.get(cluster);
            List<Experience> filteredExperiences = experiences.stream()
                .filter(e -> Arrays.asList(preferredCategories).contains(e.getCategory()))
                .toList();
            
            List<Experience> shuffledExperiences = new ArrayList<>(filteredExperiences);
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
     * Create reviews for completed bookings with cluster-specific patterns
     */
    private List<Review> createReviews(List<Booking> bookings) {
        List<Review> reviews = new ArrayList<>();
        
        // Define cluster-specific review rates
        java.util.Map<Integer, Double> clusterReviewRate = java.util.Map.of(
            0, 0.85,  // Luxury Cultural: 80-90% review rate
            1, 0.65,  // Budget Social: 60-70% review rate
            2, 0.90,  // Adventure: 85-95% review rate
            3, 0.50   // Light Casual: 40-60% review rate
        );
        
        // Define cluster-specific rating ranges
        java.util.Map<Integer, int[]> clusterRatingRange = java.util.Map.of(
            0, new int[]{4, 5},   // 4-5 stars
            1, new int[]{4, 5},   // 4-5 stars
            2, new int[]{4, 5},   // 4-5 stars
            3, new int[]{3, 5}    // 3-5 stars
        );
        
        // Only create reviews for completed bookings
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
            int cluster = getUserCluster(booking.getTraveler().getId());
            double reviewRate = clusterReviewRate.get(cluster);
            
            // Determine if this user leaves a review based on cluster rate
            if (random.nextDouble() < reviewRate) {
                Review review = new Review();
                review.setBooking(booking);
                review.setReviewer(booking.getTraveler());
                review.setExperience(booking.getExperienceSchedule().getExperience());
                
                // Generate rating based on cluster preferences
                int[] ratingRange = clusterRatingRange.get(cluster);
                int rating = ratingRange[0] + random.nextInt(ratingRange[1] - ratingRange[0] + 1);
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
        
        // Log unique experiences with reviews
        long uniqueExperiencesWithReviews = reviews.stream()
            .map(r -> r.getExperience().getExperienceId())
            .distinct()
            .count();
        System.out.println("Created " + reviews.size() + " reviews across " + uniqueExperiencesWithReviews + " unique experiences");
        
        return reviews;
    }

    /**
     * Update experience and guide ratings based on created reviews
     */
    private void updateAllRatings(List<Experience> experiences, List<User> users) {
        System.out.println("Updating experience and guide ratings...");
        
        // Update each experience's rating based on its reviews
        for (Experience experience : experiences) {
            List<Review> experienceReviews = reviewRepository.findByExperience_ExperienceId(experience.getExperienceId());
            
            if (experienceReviews.isEmpty()) {
                // No reviews, keep ratings at 0
                continue;
            }
            
            // Calculate total stars and count
            int totalStars = experienceReviews.stream()
                .mapToInt(Review::getRating)
                .sum();
            int totalReviews = experienceReviews.size();
            
            // Calculate average rating
            BigDecimal averageRating = BigDecimal.valueOf(totalStars)
                .divide(BigDecimal.valueOf(totalReviews), 2, java.math.RoundingMode.HALF_UP);
            
            // Update experience
            experience.setTotalStars(BigDecimal.valueOf(totalStars));
            experience.setTotalReviews(totalReviews);
            experience.setAverageRating(averageRating);
            experienceRepository.save(experience);
        }
        
        // Update each guide's rating based on their experiences
        List<User> guides = users.stream()
            .filter(User::getCanCreateExperiences)
            .toList();
        
        for (User guide : guides) {
            // Get all experiences by this guide
            List<Experience> guideExperiences = experienceRepository.findByGuide_Id(guide.getId());
            
            // Filter to only experiences with ratings (averageRating > 0)
            List<Experience> ratedExperiences = guideExperiences.stream()
                .filter(exp -> exp.getAverageRating() != null &&
                              exp.getAverageRating().compareTo(BigDecimal.ZERO) > 0)
                .toList();
            
            if (ratedExperiences.isEmpty()) {
                // No rated experiences, keep rating at 0
                guide.setAverageRating(BigDecimal.ZERO);
            } else {
                // Calculate sum of all experience average ratings
                BigDecimal sumOfAverageRatings = ratedExperiences.stream()
                    .map(Experience::getAverageRating)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                // Calculate average: sum / number of rated experiences
                BigDecimal guideAverageRating = sumOfAverageRatings.divide(
                    BigDecimal.valueOf(ratedExperiences.size()),
                    2,
                    java.math.RoundingMode.HALF_UP
                );
                
                guide.setAverageRating(guideAverageRating);
            }
            
            userRepository.save(guide);
        }
        
        // Count experiences with ratings
        long experiencesWithRatings = experiences.stream()
            .filter(exp -> exp.getAverageRating() != null && exp.getAverageRating().compareTo(BigDecimal.ZERO) > 0)
            .count();
        
        System.out.println("Updated ratings for " + experiences.size() + " total experiences");
        System.out.println("  - " + experiencesWithRatings + " experiences have ratings (Target: 80/100)");
        System.out.println("  - " + (experiences.size() - experiencesWithRatings) + " experiences without ratings");
        System.out.println("Updated ratings for " + guides.size() + " guides");
    }

    /**
     * Create user surveys for all users with cluster-specific characteristics
     */
    private List<UserSurvey> createUserSurveys(List<User> users) {
        List<UserSurvey> surveys = new ArrayList<>();
        
        // Define cluster-specific travel styles (matching frontend: social, business, family, romantic)
        java.util.Map<Integer, String[]> clusterTravelStyles = java.util.Map.of(
            0, new String[]{"romantic", "business"},        // Luxury Cultural Explorers
            1, new String[]{"social", "family"},            // Budget Social Travelers
            2, new String[]{"social", "business"},          // Adventure Enthusiasts
            3, new String[]{"family", "romantic"}           // Light Casual Travelers
        );
        
        // Define cluster-specific budgets
        java.util.Map<Integer, String[]> clusterBudgets = java.util.Map.of(
            0, new String[]{"Premium", "Luxury"},
            1, new String[]{"Budget-Friendly", "Moderate"},
            2, new String[]{"Moderate", "Premium"},
            3, new String[]{"Budget-Friendly", "Moderate"}  // Light casual travelers can be budget-conscious too
        );
        
        // Define cluster-specific interests (matching frontend IDs) - each cluster has 5 interests
        java.util.Map<Integer, List<String>> clusterInterests = java.util.Map.of(
            0, Arrays.asList("culture", "art", "shopping", "wellness", "entertainment"),      // Luxury Cultural Explorers
            1, Arrays.asList("food", "beach", "nightlife", "entertainment", "sports"), // Budget Social Travelers
            2, Arrays.asList("adventure", "wildlife", "photography", "sports", "culture"), // Adventure Enthusiasts
            3, Arrays.asList("photography", "food", "beach", "wellness", "shopping")     // Light Casual Travelers
        );
        
        // Define cluster-specific introductions
        java.util.Map<Integer, String[]> clusterIntros = java.util.Map.of(
            0, new String[]{"I love history and always seek experiences that teach me about local heritage.",
                            "I enjoy visiting museums, art galleries, and exploring architectural wonders."},
            1, new String[]{"I'm a travel enthusiast who loves trying local cuisines and meeting people.",
                            "Foodie traveler interested in cooking classes and food tours around the world."},
            2, new String[]{"Adventure seeker always looking for the next thrill and unique experiences.",
                            "Nature lover who prefers outdoor activities and eco-friendly travel options."},
            3, new String[]{"Photography is my passion and I travel to capture beautiful moments and landscapes.",
                            "I enjoy slow travel and getting to know local communities during my trips."}
        );
        
        // Create surveys for ALL users (100%) based on their cluster
        for (User user : users) {
            int cluster = getUserCluster(user.getId());
            
            UserSurvey survey = new UserSurvey();
            survey.setUser(user);
            survey.setIntroduction(clusterIntros.get(cluster)[random.nextInt(clusterIntros.get(cluster).length)]);
            survey.setTravelStyle(clusterTravelStyles.get(cluster)[random.nextInt(clusterTravelStyles.get(cluster).length)]);
            survey.setExperienceBudget(clusterBudgets.get(cluster)[random.nextInt(clusterBudgets.get(cluster).length)]);
            
            // Assign all 5 cluster-specific interests (randomize order)
            List<String> interests = new ArrayList<>(clusterInterests.get(cluster));
            java.util.Collections.shuffle(interests);
            // Each user picks exactly 5 interests
            survey.setInterests(interests);
            
            survey.setCompletedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
            
            surveys.add(userSurveyRepository.save(survey));
        }

        return surveys;
    }

    /**
     * Create 50 travel blog articles with diverse content
     * - 40 PUBLISHED (80%), 10 DRAFT (20%)
     * - All 6 categories represented
     * - View counts: 0-2000
     * - 15+ different authors (mix of guides and travelers)
     */
    private List<TravelArticle> createTravelArticles(List<User> users) {
        List<TravelArticle> articles = new ArrayList<>();

        // Check if blogs already exist to avoid duplicates
        if (travelArticleRepository.count() > 0) {
            System.out.println("Travel articles already exist, skipping blog creation...");
            return articles;
        }

        // Get diverse users for blog authoring - mix of guides and travelers
        User rachelGreen = userRepository.findByEmail("rachel.green@trippy.traveler").orElse(null);
        User johnSmith = userRepository.findByEmail("john.smith@trippy.guide").orElse(null);
        User alexanderMartin = userRepository.findByEmail("alexander.martin@trippy.traveler").orElse(null);
        User lucasWhite = userRepository.findByEmail("lucas.white@trippy.traveler").orElse(null);
        User marcoRossi = userRepository.findByEmail("marco.rossi@trippy.guide").orElse(null);
        User fatimaAlMansoori = userRepository.findByEmail("fatima.al-mansoori@trippy.guide").orElse(null);
        User mariaGarcia = userRepository.findByEmail("maria.garcia@trippy.guide").orElse(null);
        User davidChen = userRepository.findByEmail("david.chen@trippy.guide").orElse(null);
        User emilyDavis = userRepository.findByEmail("emily.davis@trippy.traveler").orElse(null);
        User sophiaTaylor = userRepository.findByEmail("sophia.taylor@trippy.traveler").orElse(null);
        User oliverMueller = userRepository.findByEmail("oliver.mueller@trippy.traveler").orElse(null);
        User yukiYamamoto = userRepository.findByEmail("yuki.yamamoto@trippy.traveler").orElse(null);
        User sofiaRodriguez = userRepository.findByEmail("sofia.rodriguez@trippy.traveler").orElse(null);
        User omarHassan = userRepository.findByEmail("omar.hassan@trippy.traveler").orElse(null);
        User sarahJohnson = userRepository.findByEmail("sarah.johnson@trippy.guide").orElse(null);

        // Travel blog articles data: title, content, author, category, tags, thumbnail
        Object[][] blogData = {
            {
                "Hidden Gems in Singapore You Probably Haven't Discovered Yet",
                "<p>Singapore may be famous for its skyline and hawker culture, but beyond the obvious lies a softer, slower side worth exploring. From tucked-away cafés to secret nature trails, here are a few local treasures.</p>\n<blockquote>\"Sometimes the best adventures happen when you wander off the main road.\"</blockquote>\n<h2>☕ The Secret Garden Café at Floral Fantasy</h2>\n<p>Hidden within Gardens by the Bay, this fairytale café is covered in hanging blooms and offers a calm escape from the crowds.</p>\n<figure><img src=\"https://images.unsplash.com/photo-1730130857408-67d0bd27dd1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"flower cafe\" style=\"width:100%;border-radius:8px;\"><figcaption>Inside Floral Fantasy's Secret Garden Café</figcaption></figure>\n<h2>🌊 Yishun Dam for Sunset Chasers</h2>\n<p>Golden light, quiet waves, and the occasional cyclist — it's a peaceful place to watch the day fade away.</p>\n<h2>🏚 Kampong Lorong Buangkok</h2>\n<p>Singapore's last kampong, frozen in time, surrounded by modern flats. It's a nostalgic glimpse of simpler days.</p>\n<blockquote>\"In a city of progress, some corners still whisper stories of the past.\"</blockquote>",
                rachelGreen, ArticleCategoryEnum.EXPLORING, Arrays.asList("singapore", "hidden-gems", "local", "cafe", "sunset"),
                "https://plus.unsplash.com/premium_photo-1697730373939-3ebcaa9d295e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Top 7 Underrated Islands in Southeast Asia",
                "<p>Forget Phuket and Bali. Southeast Asia hides dozens of quiet islands where turquoise waters and local smiles greet you without the crowds.</p>\n<blockquote>\"Paradise doesn't always need to be popular.\"</blockquote>\n<h2>🇹🇭 Koh Yao Noi, Thailand</h2>\n<p>Just 30 min from Phuket, this small island offers local homestays, empty beaches, and mangrove kayaking.</p>\n<h2>🇮🇩 Belitung, Indonesia</h2>\n<p>Granite boulders and crystal lagoons rival the Seychelles — at a fraction of the price.</p>\n<h2>🇵🇭 Siquijor, Philippines</h2>\n<p>Known as the \"Island of Fire,\" Siquijor blends waterfalls, caves, and quiet coastal roads perfect for scooters.</p>\n<figure><img src=\"https://images.unsplash.com/photo-1650621886779-19747038a1f7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"islands\" style=\"width:100%;border-radius:8px;\"><figcaption>Hidden coves across Southeast Asia</figcaption></figure>",
                johnSmith, ArticleCategoryEnum.TRAVEL, Arrays.asList("islands", "southeast-asia", "hidden", "beaches", "paradise"),
                "https://plus.unsplash.com/premium_photo-1693149386423-2e4e264712e5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=3132"
            },
            {
                "How to Travel Solo Without Feeling Lonely",
                "<p>Traveling alone isn't about isolation — it's about connection. The world opens up when you let curiosity lead.</p>\n<blockquote>\"You're never really alone when you travel with an open heart.\"</blockquote>\n<h2>🎒 1. Join Local Experiences</h2>\n<p>Cooking classes, walking tours, and volunteer programs help you meet people naturally while exploring culture.</p>\n<h2>📱 2. Use Apps for Safe Socializing</h2>\n<p>Platforms like Meetup and Backpackr let you find fellow travelers in seconds.</p>\n<h2>💭 3. Embrace Solitude</h2>\n<p>Some of the best travel memories are made during quiet breakfasts or long train rides where thoughts wander freely.</p>\n<figure><img src=\"https://images.unsplash.com/photo-1534777367038-9404f45b869a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"solo travel\" style=\"width:100%;border-radius:8px;\"><figcaption>Peace in motion — solo journeys that heal</figcaption></figure>",
                alexanderMartin, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("solo-travel", "tips", "connection", "apps", "solitude"),
                "https://images.unsplash.com/photo-1605274280779-a4732e176f4b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Backpacking Japan on a Budget",
                "<p>Japan doesn't have to be expensive. With a little planning and curiosity, you can explore temples, neon cities, and ramen alleys for under $50 a day.</p>\n<h2>🚆 JR Pass Hacks</h2>\n<p>Buy regional passes instead of nationwide ones. The Kansai Hiroshima Pass, for instance, saves more if you stay in western Japan.</p>\n<h2>🏨 Sleep Smart</h2>\n<p>Capsule hostels and business hotels often include free breakfast — and spotless showers.</p>\n<h2>🍱 Eat Like a Local</h2>\n<p>Family marts and conveyor-belt sushi offer quality meals under ¥600.</p>\n<blockquote>\"Budget travel isn't about cutting corners — it's about unlocking creativity.\"</blockquote>\n<figure><img src=\"https://images.unsplash.com/photo-1499419819507-77191b8ec46e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"tokyo night\" style=\"width:100%;border-radius:8px;\"><figcaption>Tokyo lights on a shoestring</figcaption></figure>",
                lucasWhite, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("japan", "budget", "backpacking", "jr-pass", "hostels"),
                "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Digital Nomad Life: Working Remotely in Bali",
                "<p>For many, Bali isn't just a vacation — it's an office with palm trees. Between surf breaks and coworking cafés, it's the world's unofficial remote-work capital.</p>\n<h2>🌴 Where to Work</h2>\n<p>Canggu's Dojo Coworking and Ubud's Outpost offer fast Wi-Fi, coffee refills, and community events.</p>\n<h2>☕ Daily Routine</h2>\n<p>Mornings start with yoga, afternoons with code, and sunsets with coconut water. Productivity meets peace.</p>\n<h2>💰 Cost Snapshot</h2>\n<p>About US$900–1200 a month covers rent, food, and a scooter — cheaper than most cities.</p>\n<blockquote>\"Bali turns work-life balance into an art form.\"</blockquote>",
                marcoRossi, ArticleCategoryEnum.TRAVEL, Arrays.asList("digital-nomad", "bali", "remote-work", "coworking", "lifestyle"),
                "https://images.unsplash.com/photo-1585060085275-6035d9d50f96?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2132"
            },
            {
                "The Art of Slow Travel",
                "<p>In an age of checklists and selfies, slow travel invites you to pause — to see, taste, and feel more deeply.</p>\n<blockquote>\"Don't collect places. Collect moments.\"</blockquote>\n<h2>🌿 What It Means</h2>\n<p>Spend weeks in one region instead of hopping cities. Learn a few local phrases. Befriend café owners.</p>\n<h2>🍷 Why It Matters</h2>\n<p>Slow travelers spend less time commuting and more time connecting — with people, culture, and themselves.</p>\n<figure><img src=\"https://images.unsplash.com/photo-1603270504031-4344a08b28b6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"train window\" style=\"width:100%;border-radius:8px;\"><figcaption>Watching the world drift by — slowly</figcaption></figure>",
                fatimaAlMansoori, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("slow-travel", "mindfulness", "culture", "connection", "philosophy"),
                "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Europe's Hidden Food Markets",
                "<p>Skip the tourist restaurants and head straight to where locals eat — the buzzing food markets tucked into Europe's streets.</p>\n<h2>🇭🇺 Budapest: Karaván Street Food</h2>\n<p>Goulash in bread bowls and craft beer in a ruin bar courtyard.</p>\n<h2>🇪🇸 Madrid: Mercado de San Fernando</h2>\n<p>Cheaper than San Miguel but twice as authentic — tapas, vermouth, and flamenco energy.</p>\n<h2>🇵🇹 Lisbon: Time Out Market</h2>\n<p>Michelin chefs meet mom-and-pop dishes — one giant hall of flavor.</p>\n<blockquote>\"Every market is a window into a city's soul.\"</blockquote>",
                johnSmith, ArticleCategoryEnum.EXPLORING, Arrays.asList("europe", "food-markets", "local-food", "budapest", "madrid", "lisbon"),
                "https://images.unsplash.com/photo-1696536465926-e6eb4a2737bb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1980"
            },
            {
                "A Photographer's Guide to Sunrise Spots in Singapore",
                "<p>For photographers, sunrise is magic hour. These spots capture Singapore bathed in gold before the city wakes.</p>\n<h2>📸 Marina Barrage</h2>\n<p>Watch the sun rise behind the skyline — wide angles shine here.</p>\n<h2>🌉 Henderson Waves</h2>\n<p>The highest pedestrian bridge in Singapore glows orange at dawn.</p>\n<h2>🌿 Labrador Nature Reserve</h2>\n<p>Overlooking the southern sea, it's calm and cinematic.</p>\n<figure><img src=\"https://images.unsplash.com/photo-1496543622559-12e927bdd81b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"sunrise\" style=\"width:100%;border-radius:8px;\"><figcaption>First light over the Lion City</figcaption></figure>",
                rachelGreen, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("photography", "singapore", "sunrise", "marina-barrage", "henderson-waves"),
                "https://images.unsplash.com/photo-1686577064246-967d76d53f09?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Eco-Friendly Travel: Small Changes, Big Impact",
                "<p>Travel sustainably isn't a trend — it's a necessity. With small mindful shifts, you can explore responsibly without sacrificing comfort.</p>\n<h2>🧳 Pack Light, Travel Right</h2>\n<p>Every extra kilo burns more fuel. Bring only what you need — and reusable bottles and cutlery.</p>\n<h2>🚴 Choose Greener Transport</h2>\n<p>Walk, bike, or use public transport whenever possible. It's healthier for both you and the planet.</p>\n<h2>🏨 Support Eco-Certified Stays</h2>\n<p>Look for hotels with solar energy, recycling systems, or local sourcing policies.</p>\n<blockquote>\"Leave nothing but footprints — take nothing but memories.\"</blockquote>\n<figure><img src=\"https://plus.unsplash.com/premium_photo-1663047725430-f855f465b6a4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070\" alt=\"green travel\" style=\"width:100%;border-radius:8px;\"><figcaption>Eco-travel done right</figcaption></figure>",
                fatimaAlMansoori, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("eco-travel", "sustainability", "green-travel", "responsible-travel", "environment"),
                "https://plus.unsplash.com/premium_photo-1661808783954-8079b10583fd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Score Cheap Flights Without Losing Sleep",
                "<p>Flight hunting doesn't have to be a full-time job. With the right tools and timing, you can find great deals without endless browsing.</p>\n<h2>✈️ Use Flight Comparison Tools</h2>\n<p>Google Flights, Kayak, and Skyscanner show price trends and cheaper alternatives. Set up alerts for your routes.</p>\n<h2>📅 Be Flexible with Dates</h2>\n<p>Tuesday and Wednesday departures are often cheaper. Use calendar view to spot the best deals.</p>\n<h2>🎯 Book at the Right Time</h2>\n<p>Domestic flights: 1-3 months ahead. International: 2-8 months ahead. Last-minute deals exist but are risky.</p>\n<blockquote>\"The best time to book is when you find a good deal at the right price for you.\"</blockquote>\n<figure><img src=\"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2074\" alt=\"airplane wing\" style=\"width:100%;border-radius:8px;\"><figcaption>Smart booking leads to more adventures</figcaption></figure>",
                alexanderMartin, ArticleCategoryEnum.HOWTO, Arrays.asList("flights", "cheap-travel", "booking", "travel-tips", "budget"),
                "https://images.unsplash.com/photo-1529074963764-98f45c47344b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2086"
            },
            
            // === NEW 40 ARTICLES (articles 11-50) ===
            
            // TIPSANDTRICKS Category (2 more - total 7)
            {
                "Packing Hacks for Long-Term Travel",
                "<p>Living out of a backpack for months? These packing strategies will save space, weight, and sanity.</p>\n<h2>🎒 The Capsule Wardrobe</h2>\n<p>7 tops, 3 bottoms, 2 pairs of shoes. Mix and match for weeks of outfits in one bag.</p>\n<h2>🧳 Compression Is Key</h2>\n<p>Packing cubes and compression bags reduce volume by 30%. Game changer for winter gear.</p>\n<blockquote>\"Travel light, travel far — your back will thank you.\"</blockquote>",
                emilyDavis, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("packing", "backpacking", "minimalism", "travel-gear", "tips"),
                "https://images.unsplash.com/photo-1553531087-88e781a318c4?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Travel Insurance 101: What You Actually Need",
                "<p>Don't get ripped off. Here's what travel insurance should cover — and what's just marketing fluff.</p>\n<h2>✅ Must-Haves</h2>\n<p>Medical emergencies, trip cancellations, and lost luggage. These three are non-negotiable.</p>\n<h2>❌ Skip These</h2>\n<p>Rental car coverage and cancel-for-any-reason policies often overlap with credit card benefits.</p>",
                davidChen, ArticleCategoryEnum.TIPSANDTRICKS, Arrays.asList("insurance", "travel-planning", "safety", "health", "tips"),
                "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            
            // EXPLORING Category (8 more - total 10)
            {
                "Tokyo's Best Coffee Shops Off the Tourist Map",
                "<p>Forget Starbucks. Tokyo's specialty coffee scene rivals any city on Earth — if you know where to look.</p>\n<h2>☕ Omotesando Koffee</h2>\n<p>Tiny espresso bar serving single-origin beans in a minimalist wooden box.</p>\n<h2>☕ Blue Bottle Shinjuku</h2>\n<p>California cool meets Japanese precision. Their pour-over is art.</p>",
                yukiYamamoto, ArticleCategoryEnum.EXPLORING, Arrays.asList("tokyo", "coffee", "cafes", "japan", "specialty-coffee"),
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Lisbon's Secret Viewpoints (Miradouros)",
                "<p>Skip the crowded São Jorge Castle. These hidden miradouros offer stunning views without the selfie sticks.</p>\n<h2>🌇 Miradouro da Graça</h2>\n<p>Sunset over red rooftops with a beer in hand. Locals love it for good reason.</p>\n<h2>🌆 Miradouro de Santa Luzia</h2>\n<p>Tiled terrace overlooking Alfama's maze of alleys and the river beyond.</p>",
                sofiaRodriguez, ArticleCategoryEnum.EXPLORING, Arrays.asList("lisbon", "portugal", "viewpoints", "hidden-gems", "sunset"),
                "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Brooklyn's Underground Art Scene",
                "<p>Manhattan gets the tourists. Brooklyn gets the artists. Explore galleries, studios, and street art in Bushwick and Williamsburg.</p>\n<h2>🎨 Bushwick Collective</h2>\n<p>Entire blocks transformed into open-air galleries by world-class muralists.</p>\n<h2>🖼️ Secret Warehouse Galleries</h2>\n<p>Industrial spaces hosting experimental exhibits. Check Instagram for pop-up alerts.</p>",
                alexanderMartin, ArticleCategoryEnum.EXPLORING, Arrays.asList("brooklyn", "street-art", "galleries", "new-york", "underground"),
                "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Melbourne's Laneway Culture Explained",
                "<p>Melbourne's magic isn't on the main streets — it's in the narrow laneways hiding cafés, bars, and boutiques.</p>\n<h2>🏙️ Hosier Lane</h2>\n<p>Ever-changing street art gallery. Come back weekly for new murals.</p>\n<h2>☕ Degraves Street</h2>\n<p>European café vibes in the heart of the CBD. Breakfast capital of Australia.</p>",
                mariaGarcia, ArticleCategoryEnum.EXPLORING, Arrays.asList("melbourne", "laneways", "australia", "coffee", "street-art"),
                "https://images.unsplash.com/photo-1514395462725-fb4566210144?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Berlin's Alternative Neighborhoods",
                "<p>Forget Mitte. Kreuzberg and Neukölln are where Berlin's counterculture thrives.</p>\n<h2>🌈 Kreuzberg 36</h2>\n<p>Turkish markets, punk bars, and the best döner kebab outside Istanbul.</p>\n<h2>🎵 Neukölln Nightlife</h2>\n<p>Underground clubs in former factories. Techno until sunrise.</p>",
                oliverMueller, ArticleCategoryEnum.EXPLORING, Arrays.asList("berlin", "kreuzberg", "neukölln", "germany", "nightlife"),
                "https://images.unsplash.com/photo-1560969184-10fe8719e047?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Marrakech Beyond the Medina",
                "<p>The old city is beautiful but packed. Venture into Gueliz and Hivernage for modern Marrakech.</p>\n<h2>🌆 Gueliz District</h2>\n<p>French colonial architecture, rooftop bars, and contemporary Moroccan restaurants.</p>\n<h2>🏊 Hivernage Hotels</h2>\n<p>Luxury pools and gardens. A cool oasis after the medina's intensity.</p>",
                omarHassan, ArticleCategoryEnum.EXPLORING, Arrays.asList("marrakech", "morocco", "modern", "gueliz", "nightlife"),
                "https://images.unsplash.com/photo-1597212618440-806262de4f6b?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Seoul's Temple Stay Experience",
                "<p>Want to understand Korean Buddhism? Sleep in a temple, wake at 3 AM for chanting, and find unexpected peace.</p>\n<h2>🛐 Jogyesa Temple</h2>\n<p>Right in downtown Seoul. Short programs perfect for first-timers.</p>\n<h2>🧘 What to Expect</h2>\n<p>Meditation, tea ceremonies, and vegetarian temple food. No Wi-Fi. Just presence.</p>",
                yukiYamamoto, ArticleCategoryEnum.EXPLORING, Arrays.asList("seoul", "korea", "temple-stay", "buddhism", "meditation"),
                "https://images.unsplash.com/photo-1528360983277-13d401cdc186?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Amsterdam's Museum Quarter After Dark",
                "<p>Museums close at 6 PM, but the neighborhood comes alive. Canals, concerts, and cozy brown cafés.</p>\n<h2>🎶 Concertgebouw</h2>\n<p>World-class acoustics for classical music. Free lunchtime concerts on Wednesdays.</p>\n<h2>🍻 Brown Cafés</h2>\n<p>Dark wood, low lights, and local beer. Amsterdam's living rooms.</p>",
                oliverMueller, ArticleCategoryEnum.EXPLORING, Arrays.asList("amsterdam", "netherlands", "museums", "nightlife", "culture"),
                "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            
            // TRAVEL Category (8 more - total 10)
            {
                "Working Remotely From Latin America",
                "<p>Fast internet, low cost of living, and incredible food. Latin America is the new digital nomad frontier.</p>\n<h2>🇲🇽 Mexico City</h2>\n<p>World-class museums, tacos for $1, and a thriving expat community. Visa-free for 180 days.</p>\n<h2>🇨🇴 Medellín</h2>\n<p>Eternal spring weather, affordable apartments, and coworking spaces everywhere.</p>",
                marcoRossi, ArticleCategoryEnum.TRAVEL, Arrays.asList("digital-nomad", "latin-america", "remote-work", "mexico", "colombia"),
                "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Train Travel Through Eastern Europe",
                "<p>Slow travel at its finest. Prague to Budapest to Krakow — medieval cities connected by scenic railways.</p>\n<h2>🚂 The Route</h2>\n<p>Prague → Vienna → Budapest → Krakow. 5 days, 4 countries, endless castles.</p>\n<h2>💺 First vs Second Class</h2>\n<p>Second class is comfortable and half the price. Save your euros for goulash and beer.</p>",
                sophiaTaylor, ArticleCategoryEnum.TRAVEL, Arrays.asList("train-travel", "eastern-europe", "prague", "budapest", "slow-travel"),
                "https://images.unsplash.com/photo-1474487548417-781cb71495f3?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Sabbatical Year: How I Quit My Job to Travel",
                "<p>It's scary, but doable. Here's how I saved $15K, negotiated a leave, and spent a year exploring 30 countries.</p>\n<h2>💰 The Money Part</h2>\n<p>Automate savings, cut subscriptions, and embrace side hustles. It adds up faster than you think.</p>\n<h2>🗣️ Talking to Your Boss</h2>\n<p>Frame it as professional development. Some companies offer unpaid leave. Others let you go. Both are okay.</p>",
                emilyDavis, ArticleCategoryEnum.TRAVEL, Arrays.asList("sabbatical", "career-break", "long-term-travel", "quit-job", "motivation"),
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Vanlife Across New Zealand",
                "<p>Rent a campervan and chase waterfalls, glaciers, and Lord of the Rings filming locations across both islands.</p>\n<h2>🚐 Best Campervan Companies</h2>\n<p>Jucy, Spaceships, and Escape are budget-friendly. Book early for summer (Dec-Feb).</p>\n<h2>🏕️ Freedom Camping Rules</h2>\n<p>You need a self-contained vehicle for free camping. Otherwise, use DOC campsites for $6-15/night.</p>",
                alexanderMartin, ArticleCategoryEnum.TRAVEL, Arrays.asList("vanlife", "new-zealand", "road-trip", "camping", "adventure"),
                "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Overland from Istanbul to Iran",
                "<p>Ancient Silk Road cities, Persian hospitality, and landscapes that feel like Mars. This route is unforgettable.</p>\n<h2>🗺️ The Journey</h2>\n<p>Istanbul → Ankara → Cappadocia → Eastern Turkey → Tabriz → Tehran. Buses and shared taxis connect it all.</p>\n<h2>🛂 Visa Tips</h2>\n<p>Get your Iran visa online (e-visa). Women must wear a headscarf, but locals are incredibly welcoming.</p>",
                omarHassan, ArticleCategoryEnum.TRAVEL, Arrays.asList("overland", "iran", "turkey", "silk-road", "adventure"),
                "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Island Hopping in Greece on a Budget",
                "<p>Santorini is stunning but expensive. Here's how to explore Greek islands without draining your savings.</p>\n<h2>🏝️ Skip Santorini, Try Naxos</h2>\n<p>Same white villages, better beaches, half the tourists, quarter of the price.</p>\n<h2>⛴️ Ferry Strategy</h2>\n<p>Book slow ferries (not catamarans) and travel overnight to save on accommodation.</p>",
                sophiaTaylor, ArticleCategoryEnum.TRAVEL, Arrays.asList("greece", "islands", "budget-travel", "ferry", "naxos"),
                "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Traveling with Kids: Southeast Asia Edition",
                "<p>Yes, you can backpack Asia with children. Here's how to make it safe, fun, and educational for everyone.</p>\n<h2>👶 Best Countries for Families</h2>\n<p>Thailand, Malaysia, and Vietnam are safe, affordable, and kid-friendly. Playgrounds and street food everywhere.</p>\n<h2>🏥 Health Precautions</h2>\n<p>Vaccines, travel insurance, and a well-stocked first aid kit are non-negotiable. Pack familiar snacks for picky eaters.</p>",
                sarahJohnson, ArticleCategoryEnum.TRAVEL, Arrays.asList("family-travel", "kids", "southeast-asia", "parenting", "safety"),
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Cycling the Danube: Vienna to Budapest",
                "<p>One of Europe's most scenic bike routes. Flat, safe, and filled with castles, vineyards, and riverside towns.</p>\n<h2>🚴 The Route</h2>\n<p>300km over 5-7 days. Bike paths the whole way. Even beginners can handle it.</p>\n<h2>🍷 Wine Stops</h2>\n<p>Austria's Wachau Valley is wine country. Stop at heurigers (wine taverns) for local whites and cold cuts.</p>",
                davidChen, ArticleCategoryEnum.TRAVEL, Arrays.asList("cycling", "danube", "vienna", "budapest", "bike-tour"),
                "https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            
            // HOWTO Category (7 more - total 8)
            {
                "How to Learn Basic Phrases in Any Language Fast",
                "<p>You don't need fluency to travel. Learn these 20 phrases and locals will love you.</p>\n<h2>📝 The Essential 20</h2>\n<p>Hello, thank you, please, excuse me, how much, where is, I don't understand, delicious, bathroom, help.</p>\n<h2>🎧 Use Spaced Repetition</h2>\n<p>Apps like Anki drill phrases into long-term memory. 10 minutes a day for a week = survival conversation.</p>",
                lucasWhite, ArticleCategoryEnum.HOWTO, Arrays.asList("language-learning", "phrases", "communication", "tips", "apps"),
                "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Find Free Walking Tours Anywhere",
                "<p>Free (tip-based) walking tours exist in almost every city. Here's how to find the best ones.</p>\n<h2>🔍 Where to Look</h2>\n<p>Google \"free walking tour [city name]\" or check GetYourGuide and Airbnb Experiences. Read reviews carefully.</p>\n<h2>💵 How Much to Tip</h2>\n<p>€5-10 for a 2-hour tour is standard. More if the guide was exceptional.</p>",
                rachelGreen, ArticleCategoryEnum.HOWTO, Arrays.asList("walking-tours", "free-activities", "budget", "sightseeing", "guides"),
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Use Google Maps Offline",
                "<p>No data? No problem. Download offline maps before you travel and navigate without internet.</p>\n<h2>📱 Step-by-Step</h2>\n<p>Search the area → Tap your profile → Offline maps → Select area → Download. Maps last 30 days.</p>\n<h2>🗺️ Pro Tips</h2>\n<p>Download on Wi-Fi to save mobile data. Offline maps still show your location via GPS — no internet needed.</p>",
                davidChen, ArticleCategoryEnum.HOWTO, Arrays.asList("google-maps", "offline", "navigation", "travel-tech", "gps"),
                "https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Negotiate Prices in Markets",
                "<p>Haggling isn't rude — it's expected in many cultures. Here's how to do it respectfully and get fair prices.</p>\n<h2>🤝 The Process</h2>\n<p>Start at 50% of the asking price. Meet somewhere in the middle. Smile. Walk away if needed — they often call you back.</p>\n<h2>❌ When NOT to Haggle</h2>\n<p>Restaurants, supermarkets, and transportation with fixed prices. Know the difference.</p>",
                mariaGarcia, ArticleCategoryEnum.HOWTO, Arrays.asList("negotiation", "markets", "shopping", "culture", "bargaining"),
                "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Stay Connected: SIM Cards vs eSIM",
                "<p>International roaming is expensive. Here's the smarter way to get data abroad.</p>\n<h2>📱 Physical SIM Cards</h2>\n<p>Buy at airports or convenience stores. Cheap and reliable. Downside: swapping SIMs is annoying.</p>\n<h2>🌐 eSIM Revolution</h2>\n<p>Apps like Airalo let you download data plans instantly. No physical card. Perfect for hopping countries.</p>",
                alexanderMartin, ArticleCategoryEnum.HOWTO, Arrays.asList("esim", "sim-cards", "mobile-data", "connectivity", "tech"),
                "https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Find Cheap Accommodation",
                "<p>Hotels are overrated. Hostels, guesthouses, and home stays offer better value and more local connections.</p>\n<h2>🏨 Hostelworld Strategy</h2>\n<p>Book highly-rated hostels in advance. Private rooms exist if dorms aren't your thing.</p>\n<h2>🏠 Airbnb Alternatives</h2>\n<p>Try Booking.com's apartments section or local sites like Vrbo. Often cheaper than Airbnb now.</p>",
                lucasWhite, ArticleCategoryEnum.HOWTO, Arrays.asList("accommodation", "hostels", "budget", "lodging", "booking"),
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "How to Handle Jet Lag Like a Pro",
                "<p>Crossing time zones doesn't have to wreck your trip. Science-backed strategies to adjust fast.</p>\n<h2>☀️ Light Exposure</h2>\n<p>Get sunlight in the morning at your destination. It resets your circadian rhythm faster than anything.</p>\n<h2>💊 Melatonin Timing</h2>\n<p>Take 0.5-3mg of melatonin 30 minutes before your new bedtime. Skip it during the day.</p>",
                sarahJohnson, ArticleCategoryEnum.HOWTO, Arrays.asList("jet-lag", "health", "sleep", "circadian", "science"),
                "https://images.unsplash.com/photo-1517976487492-5750f3195933?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            
            // OFFTOPIC Category (5 articles)
            {
                "Why I'm Quitting Social Media While Traveling",
                "<p>Instagram made me miss sunsets because I was too busy photographing them. Here's what happened when I logged off.</p>\n<h2>📵 The Experiment</h2>\n<p>30 days offline. No posts, no stories, no scrolling. Just presence.</p>\n<h2>🧠 What Changed</h2>\n<p>I noticed details. Talked to strangers. Felt less rushed. Travel became meditation again.</p>",
                emilyDavis, ArticleCategoryEnum.OFFTOPIC, Arrays.asList("social-media", "mindfulness", "digital-detox", "presence", "travel-philosophy"),
                "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "The Ethics of Voluntourism: Am I Actually Helping?",
                "<p>Volunteering abroad feels good, but is it actually beneficial? Let's have an honest conversation.</p>\n<h2>⚠️ Red Flags</h2>\n<p>Orphanage tourism, unskilled labor replacing locals, paying thousands to \"help.\" These often do more harm than good.</p>\n<h2>✅ Better Alternatives</h2>\n<p>Donate directly to vetted NGOs. Volunteer with organizations that prioritize local employment. Or just be a respectful tourist.</p>",
                sofiaRodriguez, ArticleCategoryEnum.OFFTOPIC, Arrays.asList("voluntourism", "ethics", "responsible-travel", "volunteering", "critical-thinking"),
                "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Travel Burnout Is Real: When to Take a Break",
                "<p>Moving every few days sounds romantic until you're exhausted, lonely, and craving routine. It's okay to slow down.</p>\n<h2>🚨 Warning Signs</h2>\n<p>Dreading the next hostel, skipping famous sites, feeling homesick constantly. Your body is asking for rest.</p>\n<h2>🛑 What Helped Me</h2>\n<p>Renting an apartment for a month. Cooking meals. Making a temporary home. Travel doesn't have to be constant motion.</p>",
                lucasWhite, ArticleCategoryEnum.OFFTOPIC, Arrays.asList("burnout", "mental-health", "self-care", "slow-travel", "honesty"),
                "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Why Travel Doesn't Fix Everything (But It Helps)",
                "<p>Travel won't cure depression, solve your career crisis, or magically make you a new person. But it does offer perspective.</p>\n<h2>💭 The Myth</h2>\n<p>\"Find yourself by traveling the world.\" It's not that simple. You take your problems with you.</p>\n<h2>🌍 The Truth</h2>\n<p>Travel gives you space to think. New inputs. Different ways of living. That's valuable — just not magic.</p>",
                marcoRossi, ArticleCategoryEnum.OFFTOPIC, Arrays.asList("self-discovery", "mental-health", "expectations", "reality", "philosophy"),
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "The Loneliness of Long-Term Solo Travel",
                "<p>Solo travel Instagram looks magical. Reality includes lonely dinners, language barriers, and missing home. Let's talk about it.</p>\n<h2>😔 The Hard Parts</h2>\n<p>Eating alone in restaurants feels awkward. Hostels get loud and draining. Making real friends is hard when everyone's transient.</p>\n<h2>💪 Coping Strategies</h2>\n<p>Video calls with family, journaling, and giving yourself permission to have bad days. Loneliness is part of the journey.</p>",
                alexanderMartin, ArticleCategoryEnum.OFFTOPIC, Arrays.asList("loneliness", "solo-travel", "mental-health", "reality", "honesty"),
                "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            
            // OTHERS Category (5 articles)
            {
                "My Favorite Travel Gear After 5 Years on the Road",
                "<p>Tested, broken, replaced, and re-bought. Here's what survived years of abuse and what I'd never travel without.</p>\n<h2>🎒 The Backpack</h2>\n<p>Osprey Farpoint 40. Fits carry-on requirements, has lifetime warranty, still looks new after 50+ flights.</p>\n<h2>👟 The Shoes</h2>\n<p>Allbirds Wool Runners. Comfy, packable, machine-washable. I own 3 pairs.</p>",
                marcoRossi, ArticleCategoryEnum.OTHERS, Arrays.asList("gear", "equipment", "backpack", "recommendations", "review"),
                "https://images.unsplash.com/photo-1622260614927-9aa24c0bc9b2?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Best Travel Credit Cards for 2025",
                "<p>The right credit card pays for flights and hotels through points. Here are the best cards for travelers.</p>\n<h2>💳 Chase Sapphire Preferred</h2>\n<p>2x points on travel and dining. Transfer to airlines for huge value. $95 annual fee pays for itself fast.</p>\n<h2>💳 Capital One Venture X</h2>\n<p>Unlimited 2x miles, $300 annual travel credit, and airport lounge access. Premium but worth it.</p>",
                davidChen, ArticleCategoryEnum.OTHERS, Arrays.asList("credit-cards", "points", "rewards", "finance", "travel-hacking"),
                "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Apps Every Traveler Should Have in 2025",
                "<p>Beyond Google Maps and WhatsApp, these apps solve real problems on the road.</p>\n<h2>📱 Rome2Rio</h2>\n<p>Shows ALL transport options between two places — flights, trains, buses, ferries. Saves hours of research.</p>\n<h2>📱 XE Currency</h2>\n<p>Offline currency converter. Essential for markets and quick mental math.</p>",
                sarahJohnson, ArticleCategoryEnum.OTHERS, Arrays.asList("apps", "technology", "travel-tech", "tools", "mobile"),
                "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Podcasts for Long Flights and Bus Rides",
                "<p>Audiobooks are great, but podcasts keep you entertained without commitment. Here are my go-to travel podcasts.</p>\n<h2>🎧 Zero To Travel</h2>\n<p>Interviews with long-term travelers sharing actionable advice and inspiring stories.</p>\n<h2>🎧 The Trip</h2>\n<p>NPR's travel storytelling at its best. Episodes are like mini documentaries.</p>",
                yukiYamamoto, ArticleCategoryEnum.OTHERS, Arrays.asList("podcasts", "entertainment", "audio", "recommendations", "long-haul"),
                "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            },
            {
                "Travel Books That Changed How I See the World",
                "<p>Not guidebooks — these are stories, philosophies, and essays that rewired my brain about travel and life.</p>\n<h2>📚 Vagabonding by Rolf Potts</h2>\n<p>The bible of long-term travel. It's about lifestyle design, not just tourism.</p>\n<h2>📚 The Art of Travel by Alain de Botton</h2>\n<p>Philosophical essays on why we travel and what we're really searching for.</p>",
                fatimaAlMansoori, ArticleCategoryEnum.OTHERS, Arrays.asList("books", "reading", "literature", "philosophy", "recommendations"),
                "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=2070"
            }
        };

        for (Object[] data : blogData) {
            if (data[2] != null) { // Only create if author exists
                TravelArticle article = new TravelArticle();
                article.setTitle((String) data[0]);
                article.setContent((String) data[1]);
                article.setAuthor((User) data[2]);
                article.setCategory((ArticleCategoryEnum) data[3]);
                article.setTags((List<String>) data[4]);

                // Generate slug from title
                article.setSlug(generateSlugFromTitle((String) data[0]));

                // Set article status: 80% PUBLISHED, 20% DRAFT
                article.setStatus(random.nextDouble() < 0.8 ? 
                    ArticleStatusEnum.PUBLISHED : ArticleStatusEnum.DRAFT);
                
                // Set varied view counts (0-2000 range)
                article.setViewsCount(random.nextInt(2001)); 
                article.setLikesCount(0); // Start with 0 likes
                article.setCommentsCount(0); // Start with 0 comments

                // Set timestamps (articles created 1-30 days ago)
                LocalDateTime createdDate = LocalDateTime.now().minusDays(random.nextInt(30) + 1);
                article.setCreatedAt(createdDate);
                article.setUpdatedAt(createdDate.plusHours(random.nextInt(24)));

                // Set thumbnail URL from provided Unsplash links
                article.setThumbnailUrl((String) data[5]);

                articles.add(travelArticleRepository.save(article));
            } else {
                System.out.println("Skipping article creation - author not found: " + data[0]);
            }
        }

        return articles;
    }

    /**
     * Generate URL-friendly slug from article title
     */
    private String generateSlugFromTitle(String title) {
        return title.toLowerCase()
                   .replaceAll("[^a-z0-9\\s-]", "") // Remove special characters
                   .replaceAll("\\s+", "-") // Replace spaces with hyphens
                   .replaceAll("-+", "-") // Replace multiple hyphens with single
                   .replaceAll("^-|-$", ""); // Remove leading/trailing hyphens
    }

    /**
     * Create sample FAQs for the chatbot
     */
    private List<FAQ> createFAQs() {
        List<FAQ> faqs = new ArrayList<>();
        
        Object[][] faqData = {
            // ==================== BOOKING FAQs ====================
            {
                "How do I make a booking?",
                "Booking is easy! Browse our experiences, select your preferred date and time, fill in your details, and proceed to payment. You'll receive a confirmation email with your booking details.",
                FAQCategory.BOOKING,
                10
            },
            {
                "Can I book for multiple people?",
                "Yes! When making a booking, you can select the number of participants. Each experience has a maximum participants limit, so make sure to check availability.",
                FAQCategory.BOOKING,
                9
            },
            {
                "What information do I need to make a booking?",
                "You'll need to provide your full name, email address, phone number, and payment details. For some experiences, additional information like dietary restrictions or medical conditions may be required.",
                FAQCategory.BOOKING,
                8
            },
            {
                "Can I book an experience on the same day?",
                "Most experiences can be booked up to 2 hours before the start time, depending on availability. We recommend booking in advance to secure your spot!",
                FAQCategory.BOOKING,
                7
            },
            {
                "How far in advance can I book?",
                "You can book experiences up to 6 months in advance. This gives you the best selection of dates and times, especially for popular experiences.",
                FAQCategory.BOOKING,
                8
            },
            {
                "Can I book multiple experiences at once?",
                "Yes! You can add multiple experiences to your cart and complete them in a single transaction. You'll receive separate confirmation emails for each experience.",
                FAQCategory.BOOKING,
                7
            },
            {
                "What if an experience is fully booked?",
                "You can join the waitlist for fully booked experiences. You'll be notified if a spot becomes available due to cancellations.",
                FAQCategory.BOOKING,
                7
            },
            {
                "Do I need to provide my ID when booking?",
                "For most experiences, you don't need to provide ID at booking. However, some experiences (especially those with age restrictions or safety requirements) may require ID verification upon arrival.",
                FAQCategory.BOOKING,
                6
            },
            {
                "Can I book as a gift for someone else?",
                "Yes! During booking, you can specify the participant's details (name and contact info). The gift recipient will receive the booking confirmation. You can also include a gift message.",
                FAQCategory.BOOKING,
                8
            },
            {
                "What if I have special requirements or accessibility needs?",
                "We accommodate special needs whenever possible! Contact the guide directly through messaging after booking, or reach out to support@trippy.com for assistance. It's best to inform us at least 48 hours before the experience.",
                FAQCategory.BOOKING,
                9
            },
            
            // ==================== PAYMENT FAQs ====================
            {
                "What payment methods do you accept?",
                "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. All payments are processed securely through our payment gateway.",
                FAQCategory.PAYMENT,
                10
            },
            {
                "Can I use TripPoints for payment?",
                "Absolutely! TripPoints can be used as a discount on bookings. Earn TripPoints by completing bookings, leaving reviews, and referring friends. Check your TripPoints balance in your profile.",
                FAQCategory.PAYMENT,
                9
            },
            {
                "When is my payment processed?",
                "Payment is processed immediately when you confirm your booking. You'll receive a receipt via email upon successful payment.",
                FAQCategory.PAYMENT,
                8
            },
            {
                "Are there any hidden fees?",
                "No hidden fees! The price you see includes the experience cost and any applicable service fees. All pricing is transparent, and you'll see the complete breakdown before payment.",
                FAQCategory.PAYMENT,
                8
            },
            {
                "What is a service fee?",
                "The service fee is a small charge that covers platform operations, customer support, and booking management. This fee is non-refundable in the event of cancellation.",
                FAQCategory.PAYMENT,
                9
            },
            {
                "Can I pay in installments?",
                "Currently, we require full payment upfront. However, you can save up TripPoints to reduce your total payment amount over time.",
                FAQCategory.PAYMENT,
                7
            },
            {
                "Is my payment information secure?",
                "Absolutely! All payments are processed through industry-standard encryption and secure payment gateways. We never store your full card details on our servers.",
                FAQCategory.PAYMENT,
                10
            },
            {
                "Can I use multiple TripPoints with a credit card?",
                "Yes! You can use TripPoints to reduce your payment amount, and pay the remaining balance with your credit card. Use as many or as few TripPoints as you'd like.",
                FAQCategory.PAYMENT,
                8
            },
            {
                "What currency are prices displayed in?",
                "Prices are displayed in the local currency of the experience location. Your card will be charged with automatic currency conversion if your card uses a different currency.",
                FAQCategory.PAYMENT,
                7
            },
            {
                "Do you store my payment information?",
                "We don't store your payment information. Each booking requires you to enter your card details through our secure payment processor, ensuring maximum security.",
                FAQCategory.PAYMENT,
                8
            },
            {
                "Can I use a different payment method for my next booking?",
                "Yes, you can use any accepted payment method for each new booking. We don't save payment methods for your security.",
                FAQCategory.PAYMENT,
                6
            },
            {
                "Will I receive a receipt?",
                "Yes! You'll receive a detailed receipt via email immediately after completing your booking. It includes the booking details, payment breakdown, and confirmation code.",
                FAQCategory.PAYMENT,
                9
            },
            
            // ==================== CANCELLATION FAQs (Updated with Actual Policy) ====================
            {
                "Can I cancel my booking?",
                "Yes, you can cancel your booking! Our cancellation policy depends on how far in advance you cancel. Here's our policy: Free full refund within 24 hours of purchase, Full base amount refund (7+ days before), 50% refund (3-6 days before), Non-refundable (<3 days before).",
                FAQCategory.CANCELLATION,
                10
            },
            {
                "What is your cancellation policy?",
                "Tourist cancellation policy: Free full refund within 24 hours of purchase. 7+ days before: Full base amount refund (service fee not refunded). 3-6 days before: 50% base amount refund (service fee not refunded). Less than 3 days: Non-refundable. Note: TripPoints used are not refunded.",
                FAQCategory.CANCELLATION,
                10
            },
            {
                "How do I cancel a booking?",
                "You can cancel your booking from the 'My Bookings' section in your account. Select the booking you want to cancel and follow the prompts. Your refund will be calculated and processed according to our cancellation policy.",
                FAQCategory.CANCELLATION,
                9
            },
            {
                "Can I get a full refund?",
                "Yes, you get a full refund if you cancel within 24 hours of purchase OR if you cancel 7 or more days before the experience. The service fee is non-refundable in all cases.",
                FAQCategory.CANCELLATION,
                9
            },
            {
                "What if I cancel between 3-6 days before?",
                "If you cancel 3-6 days before the experience, you'll receive a 50% refund of the base amount only. The service fee and any TripPoints used are not refunded.",
                FAQCategory.CANCELLATION,
                8
            },
            {
                "Can I cancel less than 3 days before?",
                "Cancellations made less than 3 days before the experience are non-refundable. No refund will be provided. We recommend canceling as early as possible.",
                FAQCategory.CANCELLATION,
                9
            },
            {
                "Will I get my TripPoints back after cancellation?",
                "No. TripPoints used in a booking are not refunded after cancellation, regardless of when you cancel. TripPoints are treated as applied discounts and cannot be reversed.",
                FAQCategory.CANCELLATION,
                10
            },
            {
                "Is the service fee refundable?",
                "No, the service fee is non-refundable in all cancellation scenarios. Only the base experience amount is subject to the refund policy.",
                FAQCategory.CANCELLATION,
                9
            },
            {
                "What if the guide cancels?",
                "If the guide cancels, you'll receive a full refund including the service fee and any TripPoints you used will be restored to your account. We'll also help you find an alternative experience if you'd like.",
                FAQCategory.CANCELLATION,
                8
            },
            {
                "Can I reschedule instead of canceling?",
                "Contact your guide directly through the platform to discuss rescheduling. Rescheduling is at the guide's discretion and subject to availability. If rescheduling isn't possible, the standard cancellation policy applies.",
                FAQCategory.CANCELLATION,
                8
            },
            {
                "How long does it take to receive a refund?",
                "Refunds are processed within 5-10 business days to your original payment method. The exact timing depends on your bank or credit card company. You'll receive an email confirmation when the refund is processed.",
                FAQCategory.CANCELLATION,
                8
            },
            {
                "What if the experience is cancelled due to weather?",
                "If the experience is cancelled by the guide due to weather or safety reasons, you'll receive a full refund including the service fee, and TripPoints will be restored to your account.",
                FAQCategory.CANCELLATION,
                8
            },
            {
                "Can I cancel part of a group booking?",
                "Yes, you can reduce the number of participants in a booking, but the refund amount will depend on the cancellation timing and the group size. Contact support for assistance with group booking modifications.",
                FAQCategory.CANCELLATION,
                7
            },
            
            // ==================== ACCOUNT FAQs ====================
            {
                "How do I create an account?",
                "Creating an account is free and easy! Click the 'Sign Up' button, enter your email and password, and verify your email address. You can also sign up with your Google account for faster registration.",
                FAQCategory.ACCOUNT,
                10
            },
            {
                "How do I reset my password?",
                "On the login page, click 'Forgot Password' and enter your email address. You'll receive a password reset link via email. Follow the link to create a new password. The link expires after 24 hours.",
                FAQCategory.ACCOUNT,
                9
            },
            {
                "Can I edit my profile information?",
                "Yes! You can edit your profile information anytime from the 'My Profile' section. Update your name, email, phone number, profile picture, and more. Changes are saved immediately.",
                FAQCategory.ACCOUNT,
                8
            },
            {
                "How do I become a guide?",
                "To become a guide, you need to complete KYC (Know Your Customer) verification. This includes submitting valid identification documents. Once approved, you can create and manage your own experiences. Visit the 'Become a Guide' section to get started.",
                FAQCategory.ACCOUNT,
                9
            },
            {
                "What is KYC verification?",
                "KYC (Know Your Customer) is a verification process required to become a guide. You'll need to submit valid government-issued ID (passport, driver's license, or national ID). The verification process typically takes 2-5 business days.",
                FAQCategory.ACCOUNT,
                8
            },
            {
                "How long does KYC approval take?",
                "KYC verification usually takes 2-5 business days. Our team manually reviews each submission to ensure authenticity. You'll receive an email notification once your verification is approved or if additional information is needed.",
                FAQCategory.ACCOUNT,
                8
            },
            {
                "Can I have multiple accounts?",
                "No, you should only have one account per person. Multiple accounts may lead to suspension. If you're having trouble accessing your account, contact support instead of creating a new one.",
                FAQCategory.ACCOUNT,
                7
            },
            {
                "How do I delete my account?",
                "To delete your account, go to Settings > Account Settings > Delete Account. This action is permanent and cannot be undone. You'll need to cancel any active bookings before deletion.",
                FAQCategory.ACCOUNT,
                7
            },
            {
                "What information is stored in my account?",
                "Your account stores your profile information, booking history, trip points, preferences, and travel survey data. All information is kept confidential and used only for platform functionality and personalization.",
                FAQCategory.ACCOUNT,
                8
            },
            {
                "Can I change my email address?",
                "Yes! Go to your profile settings and click 'Edit Profile'. Enter your new email address and verify it by clicking the confirmation link sent to the new address. Your old email will be unlinked.",
                FAQCategory.ACCOUNT,
                8
            },
            {
                "How do I update my phone number?",
                "Update your phone number in the 'My Profile' section. This is important for booking confirmations and guide communications. Some experiences may require a working phone number.",
                FAQCategory.ACCOUNT,
                7
            },
            {
                "Why do I need to verify my email?",
                "Email verification ensures account security and allows you to receive booking confirmations, updates, and important notifications. You must verify your email before making your first booking.",
                FAQCategory.ACCOUNT,
                8
            },
            
            // ==================== TRIPPOINTS FAQs ====================
            {
                "What are TripPoints?",
                "TripPoints are our loyalty program points that you earn for various activities on our platform. Use TripPoints to get discounts on bookings and save money on your adventures!",
                FAQCategory.TRIPPOINTS,
                10
            },
            {
                "How do I earn TripPoints?",
                "You can earn TripPoints by: • Completing bookings • Leaving reviews after your experience • Referring friends to the platform • Participating in special promotions. Check your activity section for a complete list of ways to earn.",
                FAQCategory.TRIPPOINTS,
                9
            },
            {
                "How do I use TripPoints?",
                "When making a booking, you'll see an option to apply TripPoints as a discount. You can use any amount of your available TripPoints. They're applied instantly to reduce your total payment.",
                FAQCategory.TRIPPOINTS,
                9
            },
            {
                "Do TripPoints expire?",
                "TripPoints don't expire as long as your account remains active. However, if your account is inactive for more than 24 months, your TripPoints may be forfeited.",
                FAQCategory.TRIPPOINTS,
                8
            },
            {
                "How many TripPoints do I earn per booking?",
                "You typically earn 100 TripPoints per completed booking, which equals approximately 1-5% of the booking value depending on the experience price. Special experiences may offer bonus points!",
                FAQCategory.TRIPPOINTS,
                8
            },
            {
                "Are TripPoints refunded when I cancel?",
                "No. If you cancel a booking where you used TripPoints, those TripPoints are NOT refunded to your account. TripPoints act as applied discounts and cannot be recovered after cancellation.",
                FAQCategory.TRIPPOINTS,
                9
            },
            {
                "Can I transfer TripPoints to another account?",
                "No, TripPoints are non-transferable and can only be used in the account where they were earned. This prevents fraud and maintains system integrity.",
                FAQCategory.TRIPPOINTS,
                7
            },
            {
                "Can I use TripPoints to pay the full amount?",
                "Yes, if you have enough TripPoints to cover the entire booking amount (excluding service fee), you can use them. The service fee must still be paid with a credit card.",
                FAQCategory.TRIPPOINTS,
                8
            },
            {
                "What is the TripPoints to dollar conversion?",
                "100 TripPoints equals approximately $1 USD worth of discount. The actual value may vary slightly based on experience pricing, but this is the standard conversion rate.",
                FAQCategory.TRIPPOINTS,
                8
            },
            {
                "How do I check my TripPoints balance?",
                "Your TripPoints balance is visible in your profile and on every booking page. You can also view your TripPoints transaction history in the 'My TripPoints' section of your account.",
                FAQCategory.TRIPPOINTS,
                7
            },
            {
                "Can I buy TripPoints?",
                "No, TripPoints cannot be purchased. They can only be earned through platform activities like bookings, reviews, and referrals. This keeps the loyalty program fair and authentic.",
                FAQCategory.TRIPPOINTS,
                7
            },
            {
                "How long does it take for TripPoints to appear in my account?",
                "TripPoints are credited immediately after the qualifying action. For bookings, points appear after completion. For reviews, they appear after the review is published. No waiting period!",
                FAQCategory.TRIPPOINTS,
                8
            },
            
            // ==================== EXPERIENCE FAQs ====================
            {
                "What is included in an experience?",
                "The 'What's Included' section on each experience page lists everything covered in the price. This typically includes the activity, guide, necessary equipment, and sometimes food or transportation. Details vary by experience.",
                FAQCategory.EXPERIENCES,
                10
            },
            {
                "What should I bring to an experience?",
                "Each experience page includes an 'Important Info' section listing what to bring, recommended clothing, and any special requirements. Check this section before attending to ensure you're fully prepared!",
                FAQCategory.EXPERIENCES,
                9
            },
            {
                "What if it rains or bad weather?",
                "Most experiences operate rain or shine. If weather conditions make an experience unsafe or significantly impact the quality, either you or the guide may cancel with a full refund. Check the experience details for weather policies.",
                FAQCategory.EXPERIENCES,
                9
            },
            {
                "Are the experiences safe?",
                "Safety is our top priority! All experiences must meet safety standards, and guides are vetted. Each experience has specific safety requirements, which are clearly outlined in the 'Important Info' section.",
                FAQCategory.EXPERIENCES,
                10
            },
            {
                "Can I contact the guide before the experience?",
                "Yes! Once you've made a booking, you can message your guide directly through the platform. This is great for asking questions, discussing special requirements, or coordinating logistics.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "How do I find the meeting point?",
                "Meeting point information is provided in your booking confirmation email. You'll receive detailed location, time, and contact information. Most experiences include a Google Maps link for easy navigation.",
                FAQCategory.EXPERIENCES,
                9
            },
            {
                "Can I arrive late to an experience?",
                "Arriving late may result in missing part or all of the experience without a refund. Guides wait for a reasonable time (usually 15 minutes), but cannot delay for other participants. Please arrive on time!",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "What if the guide doesn't show up?",
                "If your guide doesn't show up, you'll receive a full refund and any TripPoints used will be restored. Contact us immediately and we'll help you find an alternative experience or reschedule.",
                FAQCategory.EXPERIENCES,
                9
            },
            {
                "Are experiences suitable for children?",
                "Each experience listing includes age restrictions. Some are family-friendly for all ages, while others have minimum age requirements. Check the 'Important Info' section for child policies.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "Can I book the same experience multiple times?",
                "Yes! There's no limit on how many times you can book the same experience. Many travelers enjoy revisiting favorite experiences or trying them in different seasons.",
                FAQCategory.EXPERIENCES,
                7
            },
            {
                "How long are typical experiences?",
                "Experience duration ranges from 2 hours to full-day (12+ hours). Each experience clearly lists its duration on the booking page. You can filter experiences by duration when searching.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "Do experiences require physical fitness?",
                "Difficulty levels are indicated in each experience description. Some are leisurely walks, others require moderate hiking or activities. Check the 'Important Info' section for fitness requirements.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "Are food and drinks included?",
                "Food and drinks are listed in the 'What's Included' section. Some experiences include meals or snacks, others don't. Always check the listing details before booking.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "Can I get a private experience?",
                "Some guides offer private experiences or you can book the entire experience for your group. Check booking options or contact the guide through messaging to arrange private experiences.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "How many people are typically in a group?",
                "Group sizes vary by experience. Most have a minimum of 2 and maximum of 6-12 participants. Check the 'Participants Allowed' section on each experience page for exact numbers.",
                FAQCategory.EXPERIENCES,
                7
            },
            {
                "Can I take photos during experiences?",
                "Yes! Taking photos is encouraged at most experiences. Some may have restrictions for cultural or safety reasons, which will be mentioned in the 'Important Info' section.",
                FAQCategory.EXPERIENCES,
                8
            },
            {
                "What language are experiences conducted in?",
                "Most experiences are conducted in the local language and English. The experience listing will indicate available languages. Some guides offer multi-language support.",
                FAQCategory.EXPERIENCES,
                7
            },
            {
                "Are discounts available for groups?",
                "Some experiences offer group discounts. Check the pricing section or contact the guide through messaging. Group rates are typically shown when you select 4+ participants.",
                FAQCategory.EXPERIENCES,
                7
            },
            
            // ==================== GENERAL FAQs ====================
            {
                "How do I leave a review?",
                "After completing an experience, you'll receive an email with a link to leave a review. Alternatively, go to 'My Bookings' and click 'Leave Review' on your completed booking. Your feedback helps other travelers and improves our platform!",
                FAQCategory.GENERAL,
                9
            },
            {
                "What is your refund policy?",
                "Our refund policy depends on the experience and cancellation timing. Generally: Full refund for cancellations 48+ hours before. 50% refund for cancellations 24-48 hours before. No refund for cancellations within 24 hours. Check individual experience pages for specific policies.",
                FAQCategory.GENERAL,
                8
            },
            {
                "How do I contact customer support?",
                "You can reach our support team via: • In-app messaging from the 'Support' section • Email at support@trippy.com • Support tickets for more complex issues We aim to respond within 24 hours.",
                FAQCategory.GENERAL,
                9
            },
            
            // ==================== TECHNICAL FAQs ====================
            {
                "The website is not loading properly. What should I do?",
                "Try these troubleshooting steps: • Clear your browser cache and cookies • Try a different browser • Check your internet connection • Disable browser extensions • If the problem persists, contact our support team.",
                FAQCategory.TECHNICAL,
                9
            },
            {
                "I didn't receive my confirmation email. What should I do?",
                "Check your spam/junk folder first. If not there, verify you used the correct email address. You can also check 'My Bookings' in your account to view your booking status. If still not found, contact support.",
                FAQCategory.TECHNICAL,
                8
            },
            {
                "How do I update my email address?",
                "Go to your profile settings and click 'Edit Profile'. Enter your new email address and verify it by clicking the confirmation link sent to the new address.",
                FAQCategory.TECHNICAL,
                8
            },
            {
                "The booking page is showing an error. What should I do?",
                "Try refreshing the page, clearing your browser cache, or using a different browser. If the error persists, take a screenshot and contact support with the booking ID or experience name.",
                FAQCategory.TECHNICAL,
                7
            },
            {
                "My payment was processed but the booking didn't confirm. What now?",
                "Contact support immediately with your payment confirmation/receipt. Our team can verify the payment and manually confirm your booking. This is rare but fully solvable.",
                FAQCategory.TECHNICAL,
                8
            },
            {
                "Can I use the app on mobile?",
                "Yes! Our website is mobile-responsive and works on all smartphones and tablets. We also offer a progressive web app experience for easier mobile access.",
                FAQCategory.TECHNICAL,
                8
            },
            {
                "Why is my session timing out?",
                "For security, sessions time out after 30 minutes of inactivity. This protects your account. Simply log in again to continue where you left off.",
                FAQCategory.TECHNICAL,
                7
            },
            {
                "How do I enable JavaScript if disabled?",
                "Our platform requires JavaScript to function properly. Go to your browser settings to enable JavaScript. We recommend modern browsers like Chrome, Firefox, Safari, or Edge.",
                FAQCategory.TECHNICAL,
                7
            },
            
            // ==================== SAFETY FAQs ====================
            {
                "What safety measures are in place?",
                "All experiences must pass safety reviews. Guides are verified through KYC processes. We provide emergency contact information for each experience. Participants are required to provide accurate health information when necessary.",
                FAQCategory.SAFETY,
                9
            },
            {
                "Are there age restrictions?",
                "Age restrictions vary by experience. Some activities are family-friendly, while others may have minimum age requirements. Check the 'Important Info' section on each experience page for specific age policies.",
                FAQCategory.SAFETY,
                9
            },
            {
                "What if I have health conditions?",
                "If you have medical conditions or mobility restrictions, please inform the guide when booking or message them before the experience. Guides can advise if the experience is suitable for you.",
                FAQCategory.SAFETY,
                9
            },
            {
                "Are guides insured and licensed?",
                "All guides on our platform must pass KYC verification. While individual insurance varies, the platform ensures all guides meet local regulatory requirements for their activities.",
                FAQCategory.SAFETY,
                8
            },
            {
                "What emergency procedures are in place?",
                "Every experience includes emergency contact information. Guides are trained to handle common situations. The platform also has emergency contact procedures in place for serious incidents.",
                FAQCategory.SAFETY,
                8
            },
            {
                "Are experiences safe for solo travelers?",
                "Yes! Many experiences welcome solo travelers. Group sizes are intentionally small for safety and quality. You'll join other travelers in a safe, guided environment.",
                FAQCategory.SAFETY,
                9
            },
            {
                "What happens if someone gets injured during an experience?",
                "Guides are equipped with first aid knowledge and emergency contacts. In serious situations, guides will call emergency services and contact the platform support team immediately.",
                FAQCategory.SAFETY,
                8
            },
            
            // ==================== LOGISTICS FAQs ====================
            {
                "How do I know where to meet?",
                "Meeting point details are provided in your booking confirmation email. You'll receive an exact location, Google Maps link, guide contact information, and meeting time.",
                FAQCategory.LOGISTICS,
                9
            },
            {
                "Is transportation to the meeting point included?",
                "Transportation to the meeting point is typically not included unless specifically stated in the 'What's Included' section. Some experiences may include pickup services - check the listing.",
                FAQCategory.LOGISTICS,
                8
            },
            {
                "What if I need to leave early from an experience?",
                "If you need to leave early, inform your guide at the start. While you won't receive a refund for the missed portion, most guides can accommodate early departures when possible.",
                FAQCategory.LOGISTICS,
                7
            },
            {
                "Can I store luggage during the experience?",
                "Storage options vary by experience. Some guides can accommodate small bags, others cannot. Check the 'Important Info' section or message your guide before the experience.",
                FAQCategory.LOGISTICS,
                7
            },
            {
                "Are experiences accessible for people with disabilities?",
                "Many experiences are accessible, but it depends on the activity type. Each listing mentions accessibility information in the 'Important Info' section. Contact guides directly for specific needs.",
                FAQCategory.LOGISTICS,
                8
            },
            {
                "Can I change the number of participants after booking?",
                "You can modify participant count before the experience if there's availability. Contact support or your guide to make changes. Additional participants require payment of the difference.",
                FAQCategory.LOGISTICS,
                8
            },
            {
                "What if my flight is delayed?",
                "If you're running late due to transportation delays, contact your guide immediately. They may be able to accommodate a late arrival, but there's no guarantee of refund or full experience.",
                FAQCategory.LOGISTICS,
                8
            }
        };
        
        for (Object[] data : faqData) {
            FAQ faq = new FAQ();
            faq.setQuestion((String) data[0]);
            faq.setAnswer((String) data[1]);
            faq.setCategory((FAQCategory) data[2]);
            faq.setPriority((Integer) data[3]);
            faq.setViewCount(0);
            faq.setHelpfulCount(0);
            faq.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(180)));
            faq.setUpdatedAt(LocalDateTime.now());
            
            faqs.add(faqRepository.save(faq));
        }
        
        System.out.println("Created " + faqs.size() + " FAQs across multiple categories");
        return faqs;
    }
}