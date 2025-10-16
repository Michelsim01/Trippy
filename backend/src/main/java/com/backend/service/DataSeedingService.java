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

    /**
     * Determine which cluster a user belongs to based on their user ID
     * User IDs 1-15 are guides (not clustered)
     * User IDs 16-80 are travelers (65 travelers split into 4 clusters)
     * Cluster 0: User ID 16-32 (17 travelers - Luxury Cultural Explorers)
     * Cluster 1: User ID 33-48 (16 travelers - Budget Social Travelers)
     * Cluster 2: User ID 49-64 (16 travelers - Adventure Enthusiasts)
     * Cluster 3: User ID 65-80 (16 travelers - Light Casual Travelers)
     */
    private int getUserCluster(Long userId) {
        int id = userId.intValue();
        if (id >= 16 && id <= 32) return 0;      // Luxury Cultural Explorers (17 travelers)
        else if (id >= 33 && id <= 48) return 1; // Budget Social Travelers (16 travelers)
        else if (id >= 49 && id <= 64) return 2; // Adventure Enthusiasts (16 travelers)
        else return 3;                            // Light Casual Travelers (16 travelers: 65-80)
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

        System.out.println("Database seeding completed successfully!");
        System.out.println("Created " + users.size() + " users");
        System.out.println("Created " + experiences.size() + " experiences");
        System.out.println("Created " + schedules.size() + " schedules");
        System.out.println("Created " + bookings.size() + " bookings");
        System.out.println("Created " + reviews.size() + " reviews");
        System.out.println("Created " + surveys.size() + " user surveys");
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
        System.out.println("  - Cluster 3 (Light Casual Travelers): " + cluster3Count + " travelers (IDs 65-80)");
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
            guide.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(365)));
            guide.setUpdatedAt(LocalDateTime.now());

            users.add(userRepository.save(guide));
        }

        // Create regular traveler users
        // Total: 65 travelers (all will have bookings for active user analytics)
        String[] travelerNames = {
                // Original 15 travelers
                "Alice Cooper", "Bob Wilson", "Catherine Lee", "Daniel Park", "Elena Volkov",
                "Frank Miller", "Grace Kim", "Henry Davis", "Isabella Cruz", "Jack Taylor",
                "Kate Anderson", "Liam O'Brien", "Mia Zhang", "Noah Williams", "Olivia Martinez",
                
                // 50 new travelers for expanded analytics testing
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
        
        // Create past schedules for completed bookings (increase to 200 for better variety)
        List<ExperienceSchedule> pastSchedules = createPastSchedules(schedules, 200);
        
        // Create bookings for each traveler based on their cluster profile
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
        
        System.out.println("Updated ratings for " + experiences.size() + " experiences and " + guides.size() + " guides");
    }

    /**
     * Create user surveys for all users with cluster-specific characteristics
     */
    private List<UserSurvey> createUserSurveys(List<User> users) {
        List<UserSurvey> surveys = new ArrayList<>();
        
        // Define cluster-specific travel styles
        java.util.Map<Integer, String[]> clusterTravelStyles = java.util.Map.of(
            0, new String[]{"Luxury Traveler", "Cultural Explorer"},
            1, new String[]{"Budget Traveler", "Family Traveler"},
            2, new String[]{"Adventure Seeker", "Eco Traveler"},
            3, new String[]{"Cultural Explorer", "Family Traveler"}
        );
        
        // Define cluster-specific budgets
        java.util.Map<Integer, String[]> clusterBudgets = java.util.Map.of(
            0, new String[]{"Premium", "Luxury"},
            1, new String[]{"Budget-Friendly", "Moderate"},
            2, new String[]{"Moderate", "Premium"},
            3, new String[]{"Moderate"}
        );
        
        // Define cluster-specific interests
        java.util.Map<Integer, List<String>> clusterInterests = java.util.Map.of(
            0, Arrays.asList("Culture", "History", "Art", "Architecture"),
            1, Arrays.asList("Food", "Beaches", "Music"),
            2, Arrays.asList("Adventure", "Mountains", "Nature", "Wildlife"),
            3, Arrays.asList("Photography", "Food", "Beaches")
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
            
            // Assign cluster-specific interests (randomize order but use cluster interests)
            List<String> interests = new ArrayList<>(clusterInterests.get(cluster));
            java.util.Collections.shuffle(interests);
            // Cluster 0 & 2: 4-5 interests, Cluster 1: 3-4 interests, Cluster 3: 2-3 interests
            int interestCount = cluster == 0 || cluster == 2 ? (4 + random.nextInt(2)) : 
                                (cluster == 1 ? 3 + random.nextInt(2) : 2 + random.nextInt(2));
            survey.setInterests(interests.subList(0, Math.min(interestCount, interests.size())));
            
            survey.setCompletedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
            
            surveys.add(userSurveyRepository.save(survey));
        }
        
        return surveys;
    }
}