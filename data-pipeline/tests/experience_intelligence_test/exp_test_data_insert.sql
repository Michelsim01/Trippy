-- =====================================================
-- TEST SCRIPT: Incremental Experience Intelligence Pipeline
-- =====================================================
-- This script inserts 10 new test experiences with complete data
-- to test the incremental data processing pipeline
-- =====================================================

BEGIN;

-- =====================================================
-- 1. INSERT 10 NEW EXPERIENCES
-- =====================================================
-- Note: Using experience_id 2001-2010 to avoid conflicts
-- Guide IDs should exist in your database (using IDs 1-5)

INSERT INTO experiences (experience_id, guide_id, title, short_description, full_description, highlights, category, price, duration, location, latitude, longitude, country, participants_allowed, status, created_at, updated_at)
VALUES 
-- Experience 2001: Adventure Mountain Hiking
(2001, 1, 'Extreme Mountain Peak Adventure', 
 'Challenging trek to stunning mountain peaks with breathtaking views', 
 'Join us for an adrenaline-pumping adventure climbing to the highest peaks. This challenging trek is perfect for adventure seekers who love extreme sports and want to experience nature at its finest. Expert guides will ensure your safety throughout the journey.',
 'Professional climbing gear included, Experienced mountain guides, Spectacular sunrise views, Small group sizes',
 'ADVENTURE', 280.00, 8.0, 'Mount Kinabalu, Sabah', 6.0752, 116.5583, 'Malaysia', 8, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2002: Cultural Heritage Tour
(2002, 2, 'Ancient Temple Heritage Walk', 
 'Explore historical temples and learn about local culture and traditions', 
 'Immerse yourself in the rich cultural heritage of ancient temples. Our expert guide will share fascinating stories about the historical significance and traditional practices. This tour includes visits to multiple temples, a traditional lunch, and cultural performances.',
 'Visit 5 historical temples, Traditional cultural lunch, Local guide with deep knowledge, Cultural dance performance',
 'GUIDED_TOUR', 120.00, 6.0, 'Georgetown, Penang', 5.4164, 100.3327, 'Malaysia', 15, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2003: Nature Wildlife Safari
(2003, 1, 'Rainforest Wildlife Photography Safari', 
 'Capture stunning wildlife photos in pristine rainforest habitat', 
 'A paradise for photography enthusiasts and nature lovers. Trek through the lush rainforest with professional wildlife photographers to spot exotic birds, monkeys, and other fascinating creatures. Perfect for both beginner and experienced photographers.',
 'Professional photography guidance, Wildlife spotting opportunities, Forest conservation education, Small intimate groups',
 'ADVENTURE', 180.00, 5.0, 'Taman Negara, Pahang', 4.5833, 102.4167, 'Malaysia', 10, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2004: Culinary Food Tour
(2004, 3, 'Street Food Culinary Adventure', 
 'Taste authentic local cuisine and learn cooking secrets from local chefs', 
 'Embark on a mouth-watering journey through bustling food markets and hidden culinary gems. Sample over 15 different local dishes, meet local vendors, and learn the secrets behind traditional recipes. This food tour is perfect for social travelers who love to eat!',
 'Over 15 food tastings, Local market exploration, Meet authentic chefs, Cooking demonstration included',
 'GUIDED_TOUR', 95.00, 4.0, 'Jalan Alor, Kuala Lumpur', 3.1478, 101.7089, 'Malaysia', 12, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2005: Wellness Spa Retreat
(2005, 4, 'Tropical Spa & Wellness Retreat', 
 'Relaxing spa experience with traditional massage and wellness treatments', 
 'Escape to a peaceful oasis for a day of ultimate relaxation. Enjoy traditional Malay massage, aromatherapy, and meditation sessions in a serene tropical setting. This wellness retreat includes healthy organic meals and yoga by the beach.',
 'Full body traditional massage, Aromatherapy session, Yoga and meditation, Healthy organic lunch',
 'OTHERS', 220.00, 7.0, 'Langkawi Island', 6.3500, 99.8000, 'Malaysia', 6, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2006: Beach Water Sports
(2006, 2, 'Island Hopping & Water Sports Adventure', 
 'Exciting day of snorkeling, diving, and beach activities', 
 'Spend an action-packed day exploring beautiful islands with crystal clear waters. Activities include snorkeling at coral reefs, kayaking, paddle boarding, and beach volleyball. Perfect for adventurous groups and families who love the ocean!',
 'Visit 3 pristine islands, Snorkeling gear provided, Professional dive instructors, BBQ beach lunch',
 'WATER_ACTIVITY', 165.00, 8.0, 'Perhentian Islands, Terengganu', 5.9167, 102.7333, 'Malaysia', 20, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2007: Urban Photography Walk
(2007, 3, 'City Streets Photography Workshop', 
 'Learn urban photography techniques while exploring vibrant city streets', 
 'Perfect for photography enthusiasts wanting to capture the essence of urban life. Learn composition, lighting, and storytelling through street photography. This workshop covers both day and evening shooting with expert feedback.',
 'Professional photography instruction, City landmarks tour, Day and night shooting, Photo editing tips',
 'WORKSHOP', 140.00, 5.0, 'Petaling Jaya, Selangor', 3.1073, 101.6067, 'Malaysia', 8, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2008: Budget Backpacker City Tour
(2008, 5, 'Budget-Friendly City Explorer Tour', 
 'Affordable walking tour covering major attractions and hidden gems', 
 'Discover the city on a budget! This easy-paced walking tour covers all the must-see attractions, local markets, and hidden spots that only locals know. Great for solo travelers and backpackers wanting to meet new friends.',
 'Free welcome drink, Visit 8 major attractions, Local insider tips, Social group atmosphere',
 'DAYTRIP', 45.00, 3.0, 'Kuala Lumpur City Center', 3.1478, 101.6953, 'Malaysia', 25, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2009: Luxury Sunset Cruise
(2009, 4, 'Premium Sunset Yacht Experience', 
 'Exclusive yacht cruise with gourmet dinner and champagne', 
 'Indulge in luxury aboard a private yacht as you watch the spectacular sunset over the ocean. This romantic premium experience includes a gourmet 5-course dinner prepared by a chef, unlimited champagne, and live acoustic music.',
 'Private yacht experience, 5-course gourmet dinner, Premium champagne, Live music entertainment',
 'WATER_ACTIVITY', 450.00, 4.0, 'Port Dickson Marina', 2.5167, 101.8167, 'Malaysia', 10, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Experience 2010: Family Adventure Park
(2010, 5, 'Family Fun Adventure Park Day', 
 'Exciting day at adventure park with activities for all ages', 
 'Perfect family day out with activities suitable for all ages! Enjoy zip-lining, rope courses, rock climbing, and nature trails. Safety equipment and training provided. Family-friendly guides ensure everyone has a safe and memorable experience.',
 'Activities for all ages, Professional safety equipment, Trained family guides, Picnic lunch included',
 'DAYTRIP', 130.00, 6.0, 'Genting Highlands', 3.4230, 101.7930, 'Malaysia', 30, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

SELECT 'Inserted 10 new test experiences (2001-2010)' AS status;

-- =====================================================
-- 2. INSERT EXPERIENCE TAGS
-- =====================================================

INSERT INTO experience_tags (experience_experience_id, tags)
VALUES 
-- Experience 2001: Adventure Mountain
(2001, 'adventure'), (2001, 'hiking'), (2001, 'extreme'), (2001, 'nature'),

-- Experience 2002: Cultural Heritage
(2002, 'culture'), (2002, 'heritage'), (2002, 'history'), (2002, 'traditional'),

-- Experience 2003: Wildlife Safari
(2003, 'nature'), (2003, 'wildlife'), (2003, 'photography'), (2003, 'conservation'),

-- Experience 2004: Food Tour
(2004, 'food'), (2004, 'culinary'), (2004, 'local'), (2004, 'social'),

-- Experience 2005: Spa Retreat
(2005, 'wellness'), (2005, 'spa'), (2005, 'relaxation'), (2005, 'yoga'),

-- Experience 2006: Water Sports
(2006, 'beach'), (2006, 'snorkeling'), (2006, 'adventure'), (2006, 'island'),

-- Experience 2007: Photography
(2007, 'photography'), (2007, 'urban'), (2007, 'art'), (2007, 'creative'),

-- Experience 2008: Budget Tour
(2008, 'budget'), (2008, 'walking'), (2008, 'social'), (2008, 'backpacker'),

-- Experience 2009: Luxury Cruise
(2009, 'luxury'), (2009, 'romantic'), (2009, 'sunset'), (2009, 'premium'),

-- Experience 2010: Family Park
(2010, 'family'), (2010, 'adventure'), (2010, 'kids'), (2010, 'outdoor');

SELECT 'Inserted tags for all test experiences' AS status;

-- =====================================================
-- 3. INSERT EXPERIENCE SCHEDULES
-- =====================================================
-- Create 3 schedules per experience (some past, some future)

INSERT INTO experience_schedule (experience_id, start_date_time, end_date_time, available_spots, created_at)
SELECT 
    exp_id,
    start_time,
    end_time,
    available,
    CURRENT_TIMESTAMP
FROM (VALUES
    -- Experience 2001: Mountain Hiking
    (2001, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '8 hours', 0),
    (2001, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '8 hours', 2),
    (2001, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '8 hours', 8),
    
    -- Experience 2002: Cultural Heritage
    (2002, CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days' + INTERVAL '6 hours', 0),
    (2002, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '6 hours', 3),
    (2002, CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '10 days' + INTERVAL '6 hours', 15),
    
    -- Experience 2003: Wildlife Safari
    (2003, CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '5 hours', 0),
    (2003, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '5 hours', 4),
    (2003, CURRENT_TIMESTAMP + INTERVAL '12 days', CURRENT_TIMESTAMP + INTERVAL '12 days' + INTERVAL '5 hours', 10),
    
    -- Experience 2004: Food Tour
    (2004, CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days' + INTERVAL '4 hours', 0),
    (2004, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '4 hours', 0),
    (2004, CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '4 hours', 12),
    
    -- Experience 2005: Spa Retreat
    (2005, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '7 hours', 0),
    (2005, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '7 hours', 2),
    (2005, CURRENT_TIMESTAMP + INTERVAL '8 days', CURRENT_TIMESTAMP + INTERVAL '8 days' + INTERVAL '7 hours', 6),
    
    -- Experience 2006: Water Sports
    (2006, CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '9 days' + INTERVAL '8 hours', 0),
    (2006, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '8 hours', 5),
    (2006, CURRENT_TIMESTAMP + INTERVAL '6 days', CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '8 hours', 20),
    
    -- Experience 2007: Photography
    (2007, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '5 hours', 0),
    (2007, CURRENT_TIMESTAMP + INTERVAL '14 days', CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '5 hours', 8),
    (2007, CURRENT_TIMESTAMP + INTERVAL '21 days', CURRENT_TIMESTAMP + INTERVAL '21 days' + INTERVAL '5 hours', 8),
    
    -- Experience 2008: Budget Tour
    (2008, CURRENT_TIMESTAMP - INTERVAL '11 days', CURRENT_TIMESTAMP - INTERVAL '11 days' + INTERVAL '3 hours', 0),
    (2008, CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '3 hours', 0),
    (2008, CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '3 hours', 25),
    
    -- Experience 2009: Luxury Cruise
    (2009, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '4 hours', 0),
    (2009, CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days' + INTERVAL '4 hours', 10),
    (2009, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '30 days' + INTERVAL '4 hours', 10),
    
    -- Experience 2010: Family Park
    (2010, CURRENT_TIMESTAMP - INTERVAL '13 days', CURRENT_TIMESTAMP - INTERVAL '13 days' + INTERVAL '6 hours', 0),
    (2010, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '6 hours', 0),
    (2010, CURRENT_TIMESTAMP + INTERVAL '9 days', CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '6 hours', 30)
) AS t(exp_id, start_time, end_time, available);

SELECT 'Inserted schedules for test experiences' AS status;

-- =====================================================
-- 4. INSERT BOOKINGS (for past schedules)
-- =====================================================
-- Using existing user IDs (1-10 from seeded data)
-- Create 2-3 bookings per past schedule

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 
    (1 + (ROW_NUMBER() OVER ()) % 10)::INTEGER as traveler_id,  -- Cycle through users 1-10
    schedule_id,
    start_date_time - INTERVAL '5 days' as booking_date,
    2 as number_of_participants,
    268.80 as base_amount,
    11.20 as service_fee,
    280.00 as total_amount,
    'COMPLETED' as status,
    'Test' as contact_first_name,
    'User' as contact_last_name,
    'test@experience.test' as contact_email,
    '+60123456789' as contact_phone,
    'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) as confirmation_code,
    start_date_time - INTERVAL '5 days' as created_at,
    start_date_time - INTERVAL '5 days' as updated_at
FROM experience_schedule
WHERE experience_id BETWEEN 2001 AND 2010 
AND start_date_time < CURRENT_TIMESTAMP
LIMIT 20;  -- Create 20 bookings

SELECT 'Inserted bookings for test experiences' AS status;

-- =====================================================
-- 5. INSERT REVIEWS (for completed bookings)
-- =====================================================

-- Create one review per booking with varied ratings and comments
INSERT INTO review (reviewer_id, booking_id, experience_id, rating, title, comment, created_at, updated_at)
SELECT 
    b.traveler_id,
    b.booking_id,
    es.experience_id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 10 IN (1,2,3,4,5,6,7) THEN 5  -- 70% get 5 stars
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 10 IN (8,9) THEN 4             -- 20% get 4 stars
        ELSE 3                                                                           -- 10% get 3 stars
    END as rating,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 0 THEN 'Amazing experience!'
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 1 THEN 'Highly recommended'
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 2 THEN 'Great but challenging'
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 3 THEN 'Unforgettable adventure'
        ELSE 'Very good experience'
    END as title,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 0 THEN 'This was absolutely incredible! The guide was knowledgeable and the scenery was breathtaking. Highly recommend for anyone seeking adventure.'
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 1 THEN 'Perfect day out! Everything was well organized and the experience exceeded my expectations. Will definitely come back again.'
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 2 THEN 'Really enjoyed this experience. It was more challenging than expected but worth every moment. Great value for money.'
        WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 5 = 3 THEN 'One of the best experiences of my life! The guide made sure everyone was safe and having fun. Beautiful locations and great atmosphere.'
        ELSE 'Had a wonderful time. The itinerary was well planned and we got to see amazing sights. Would recommend to friends and family.'
    END as comment,
    b.created_at + INTERVAL '2 days',
    b.created_at + INTERVAL '2 days'
FROM booking b
JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
WHERE es.experience_id BETWEEN 2001 AND 2010
AND b.status = 'COMPLETED';

SELECT 'Inserted reviews for test experiences' AS status;

-- =====================================================
-- 6. INSERT EXPERIENCE ITINERARIES (for content richness)
-- =====================================================

-- Itinerary for Experience 2001: Mountain Hiking
INSERT INTO experience_itinerary (experience_id, stop_order, stop_type, location_name, duration)
VALUES 
(2001, 1, 'PICKUP', 'Base Camp Meeting Point', '30'),
(2001, 2, 'ACTIVITY', 'Lower Trail Ascent', '120'),
(2001, 3, 'STOP', 'Mountain Ridge Viewpoint', '45'),
(2001, 4, 'ACTIVITY', 'Peak Summit', '90'),
(2001, 5, 'DROPOFF', 'Base Camp Return', '60');

-- Itinerary for Experience 2002: Cultural Heritage
INSERT INTO experience_itinerary (experience_id, stop_order, stop_type, location_name, duration)
VALUES 
(2002, 1, 'PICKUP', 'Heritage Center', '15'),
(2002, 2, 'STOP', 'Ancient Temple Complex', '60'),
(2002, 3, 'STOP', 'Traditional Market', '45'),
(2002, 4, 'ACTIVITY', 'Cultural Performance', '90'),
(2002, 5, 'STOP', 'Heritage Restaurant', '75');

-- Itinerary for Experience 2003: Wildlife Safari
INSERT INTO experience_itinerary (experience_id, stop_order, stop_type, location_name, duration)
VALUES 
(2003, 1, 'PICKUP', 'Rainforest Entrance', '20'),
(2003, 2, 'ACTIVITY', 'Canopy Walkway', '60'),
(2003, 3, 'STOP', 'Wildlife Observation Point', '90'),
(2003, 4, 'ACTIVITY', 'River Trail Photography', '75'),
(2003, 5, 'DROPOFF', 'Forest Exit Point', '15');

-- Itinerary for Experience 2006: Water Sports
INSERT INTO experience_itinerary (experience_id, stop_order, stop_type, location_name, duration)
VALUES 
(2006, 1, 'PICKUP', 'Marina Jetty', '20'),
(2006, 2, 'ACTIVITY', 'First Island Snorkeling', '90'),
(2006, 3, 'STOP', 'Beach Island Lunch', '60'),
(2006, 4, 'ACTIVITY', 'Second Island Water Sports', '90'),
(2006, 5, 'DROPOFF', 'Marina Return', '20');

SELECT 'Inserted itineraries for key test experiences' AS status;

-- =====================================================
-- 7. UPDATE EXPERIENCE STATS (to simulate real data)
-- =====================================================

UPDATE experiences e
SET 
    total_stars = (SELECT COALESCE(SUM(r.rating), 0) FROM review r WHERE r.experience_id = e.experience_id),
    total_reviews = (SELECT COUNT(*) FROM review r WHERE r.experience_id = e.experience_id),
    average_rating = (SELECT COALESCE(AVG(r.rating), 0) FROM review r WHERE r.experience_id = e.experience_id),
    updated_at = CURRENT_TIMESTAMP
WHERE e.experience_id BETWEEN 2001 AND 2010;

SELECT 'Updated experience statistics' AS status;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

SELECT '=====================================' AS separator;
SELECT 'VERIFICATION RESULTS' AS title;
SELECT '=====================================' AS separator;

-- Count new experiences
SELECT 'New Experiences:' AS metric, COUNT(*) AS count 
FROM experiences 
WHERE experience_id BETWEEN 2001 AND 2010;

-- Count tags
SELECT 'Experience Tags:' AS metric, COUNT(*) AS count 
FROM experience_tags 
WHERE experience_experience_id BETWEEN 2001 AND 2010;

-- Count schedules
SELECT 'Experience Schedules:' AS metric, COUNT(*) AS count 
FROM experience_schedule 
WHERE experience_id BETWEEN 2001 AND 2010;

-- Count bookings
SELECT 'Bookings:' AS metric, COUNT(*) AS count 
FROM booking b
JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
WHERE es.experience_id BETWEEN 2001 AND 2010;

-- Count reviews
SELECT 'Reviews:' AS metric, COUNT(*) AS count 
FROM review 
WHERE experience_id BETWEEN 2001 AND 2010;

-- Count itineraries
SELECT 'Itinerary Stops:' AS metric, COUNT(*) AS count 
FROM experience_itinerary 
WHERE experience_id BETWEEN 2001 AND 2010;

-- Show experience summary
SELECT 
    e.experience_id,
    e.title,
    e.category,
    e.price,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(DISTINCT r.review_id) AS total_reviews,
    COALESCE(AVG(r.rating), 0) AS avg_rating
FROM experiences e
LEFT JOIN experience_schedule es ON e.experience_id = es.experience_id
LEFT JOIN booking b ON es.schedule_id = b.experience_schedule_id
LEFT JOIN review r ON e.experience_id = r.experience_id
WHERE e.experience_id BETWEEN 2001 AND 2010
GROUP BY e.experience_id, e.title, e.category, e.price
ORDER BY e.experience_id;

COMMIT;

-- =====================================================
-- TESTING INSTRUCTIONS
-- =====================================================
-- 
-- 1. Run this script to insert test data
-- 2. Check the watermark table:
--    SELECT * FROM pipeline_watermarks WHERE pipeline_name = 'experience_intelligence';
-- 3. Run the experience_intelligence DAG in Airflow
-- 4. Check the logs - should show:
--    - "Pipeline mode: INCREMENTAL"
--    - "Extracted 10 experiences for processing"
-- 5. Verify results:
--    SELECT * FROM experience_intelligence WHERE experience_id BETWEEN 2001 AND 2010;
-- 6. Check similarities:
--    SELECT * FROM experience_similarities WHERE experience_id BETWEEN 2001 AND 2010;
--
-- =====================================================

