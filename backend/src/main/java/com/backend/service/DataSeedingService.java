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

        System.out.println("Database seeding completed successfully!");
        System.out.println("Created " + users.size() + " users");
        System.out.println("Created " + experiences.size() + " experiences");
        System.out.println("Created " + schedules.size() + " schedules");
        System.out.println("Created " + bookings.size() + " bookings");
        System.out.println("Created " + reviews.size() + " reviews");
        System.out.println("Created " + surveys.size() + " user surveys");
        System.out.println("Created " + (articles != null ? articles.size() : 0) + " travel articles");
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
                        "https://images.unsplash.com/photo-1545389336-cf090694435e" }
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
     * Create travel blog articles with content provided by user
     */
    private List<TravelArticle> createTravelArticles(List<User> users) {
        List<TravelArticle> articles = new ArrayList<>();

        // Check if blogs already exist to avoid duplicates
        if (travelArticleRepository.count() > 0) {
            System.out.println("Travel articles already exist, skipping blog creation...");
            return articles;
        }

        // Get specific users by email for blog authoring - use database lookup instead of assuming they're in the passed list
        User rachelGreen = userRepository.findByEmail("rachel.green@trippy.traveler").orElse(null);
        User johnSmith = userRepository.findByEmail("john.smith@trippy.guide").orElse(null);
        User alexanderMartin = userRepository.findByEmail("alexander.martin@trippy.traveler").orElse(null);
        User lucasWhite = userRepository.findByEmail("lucas.white@trippy.traveler").orElse(null);
        User marcoRossi = userRepository.findByEmail("marco.rossi@trippy.guide").orElse(null);
        User fatimaAlMansoori = userRepository.findByEmail("fatima.al-mansoori@trippy.guide").orElse(null);

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

                // Set article details
                article.setStatus(ArticleStatusEnum.PUBLISHED);
                article.setViewsCount(0); // Start with 0 views
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
}