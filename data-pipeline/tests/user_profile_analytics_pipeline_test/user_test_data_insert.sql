-- =====================================================
-- TEST SCRIPT: Incremental User Profile Analytics
-- =====================================================
-- This script inserts 10 new test users with complete data
-- to test the incremental data processing pipeline
-- =====================================================

-- First, let's get the next available user_id
-- Run this to check: SELECT MAX(user_id) FROM users;
-- Then update START_USER_ID below if needed

BEGIN;

-- =====================================================
-- 1. INSERT 10 NEW USERS
-- =====================================================
-- NOTE: All test users use password "Password123"
-- BCrypt hash copied from existing seeded users in database
INSERT INTO users (user_id, email, password, first_name, last_name, is_active, is_admin, can_create_experiences, is_email_verified, kyc_status, trip_points, created_at, updated_at)
VALUES 
-- User 1: Budget Adventurer
(1001, 'test.user1@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Alex', 'Chen', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 2: Luxury Cultural Traveler
(1002, 'test.user2@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Maria', 'Rodriguez', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 3: Nature Enthusiast
(1003, 'test.user3@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'John', 'Smith', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 4: Food & Culture Lover
(1004, 'test.user4@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Yuki', 'Tanaka', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 5: Adventure Seeker
(1005, 'test.user5@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Emma', 'Johnson', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 6: Relaxation Focused
(1006, 'test.user6@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Lucas', 'Silva', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 7: Social Traveler
(1007, 'test.user7@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Sophie', 'Martin', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 8: Photography Enthusiast
(1008, 'test.user8@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'David', 'Kim', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 9: Budget Backpacker
(1009, 'test.user9@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Isabella', 'Santos', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- User 10: Premium Adventure
(1010, 'test.user10@incremental.test', '$2a$10$z868RNVt.gfwbfCOlITMCeTdZNDBzJZD/mgsVWFZq8UxNMlBtj4gu', 'Oliver', 'Brown', true, false, false, true, 'NOT_STARTED', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

SELECT 'Inserted 10 new users (1001-1010)' AS status;

-- =====================================================
-- 2. INSERT USER SURVEYS WITH INTERESTS
-- =====================================================

-- User 1: Budget Social Explorer
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1001, 'social', 'Budget-Friendly', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('adventure'), ('wildlife'), ('sports'), ('photography'), ('culture')) AS t(interest)
WHERE user_id = 1001;

-- User 2: Luxury Romantic Traveler
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1002, 'romantic', 'Luxury', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('culture'), ('art'), ('shopping'), ('wellness'), ('entertainment')) AS t(interest)
WHERE user_id = 1002;

-- User 3: Family Nature Enthusiast
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1003, 'family', 'Moderate', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('wildlife'), ('photography'), ('beach'), ('wellness'), ('shopping')) AS t(interest)
WHERE user_id = 1003;

-- User 4: Social Food & Culture Lover
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1004, 'social', 'Moderate', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('food'), ('beach'), ('nightlife'), ('entertainment'), ('sports')) AS t(interest)
WHERE user_id = 1004;

-- User 5: Business + Adventure Seeker
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1005, 'business', 'Premium', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('adventure'), ('wildlife'), ('photography'), ('sports'), ('culture')) AS t(interest)
WHERE user_id = 1005;

-- User 6: Romantic Relaxation Focused
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1006, 'romantic', 'Moderate', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('beach'), ('wellness'), ('culture'), ('art'), ('shopping')) AS t(interest)
WHERE user_id = 1006;

-- User 7: Social Traveler
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1007, 'social', 'Budget-Friendly', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('food'), ('nightlife'), ('entertainment'), ('beach'), ('sports')) AS t(interest)
WHERE user_id = 1007;

-- User 8: Family Photography Enthusiast
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1008, 'family', 'Premium', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('photography'), ('food'), ('beach'), ('wellness'), ('shopping')) AS t(interest)
WHERE user_id = 1008;

-- User 9: Budget Social Backpacker
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1009, 'social', 'Budget-Friendly', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('adventure'), ('beach'), ('food'), ('nightlife'), ('entertainment')) AS t(interest)
WHERE user_id = 1009;

-- User 10: Business + Luxury Adventure
INSERT INTO user_survey (user_id, travel_style, experience_budget, completed_at)
VALUES (1010, 'business', 'Luxury', CURRENT_TIMESTAMP);

INSERT INTO user_survey_interests (user_survey_survey_id, interests)
SELECT survey_id, interest
FROM user_survey, 
     (VALUES ('adventure'), ('wildlife'), ('photography'), ('sports'), ('culture')) AS t(interest)
WHERE user_id = 1010;

SELECT 'Inserted user surveys with interests for 10 users' AS status;

-- =====================================================
-- 3. INSERT BOOKINGS FOR NEW USERS
-- =====================================================
-- NOTE: This uses existing experience_schedule_id values
-- You may need to adjust these IDs based on your database

-- First, let's get some valid schedule IDs
-- Run this query to check: SELECT schedule_id FROM experience_schedule LIMIT 10;

-- User 1: 2 bookings
INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1001, schedule_id, CURRENT_TIMESTAMP, 2, 96.15, 3.85, 100.00, 'COMPLETED', 'Alex', 'Chen', 'test.user1@incremental.test', '+12001234567', 'TRP-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule
WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 0);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1001, schedule_id, CURRENT_TIMESTAMP - INTERVAL '5 days', 1, 48.08, 1.92, 50.00, 'COMPLETED', 'Alex', 'Chen', 'test.user1@incremental.test', '+12001234567', 'TRP-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8), CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days'
FROM experience_schedule
WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 1);

-- User 2: 3 bookings (high spender)
INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1002, schedule_id, CURRENT_TIMESTAMP, 2, 673.08, 26.92, 700.00, 'COMPLETED', 'Maria', 'Rodriguez', 'test.user2@incremental.test', '+12001234568', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule
WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 2);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1002, schedule_id, CURRENT_TIMESTAMP - INTERVAL '3 days', 2, 576.92, 23.08, 600.00, 'COMPLETED', 'Maria', 'Rodriguez', 'test.user2@incremental.test', '+12001234568', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM experience_schedule
WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 3);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1002, schedule_id, CURRENT_TIMESTAMP - INTERVAL '10 days', 1, 384.62, 15.38, 400.00, 'COMPLETED', 'Maria', 'Rodriguez', 'test.user2@incremental.test', '+12001234568', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'
FROM experience_schedule
WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 4);

-- User 3: 2 bookings
INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1003, schedule_id, CURRENT_TIMESTAMP, 1, 115.38, 4.62, 120.00, 'COMPLETED', 'John', 'Smith', 'test.user3@incremental.test', '+12001234569', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 5);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1003, schedule_id, CURRENT_TIMESTAMP - INTERVAL '2 days', 2, 230.77, 9.23, 240.00, 'COMPLETED', 'John', 'Smith', 'test.user3@incremental.test', '+12001234569', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 6);

-- User 4: 1 booking
INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1004, schedule_id, CURRENT_TIMESTAMP, 2, 346.15, 13.85, 360.00, 'COMPLETED', 'Yuki', 'Tanaka', 'test.user4@incremental.test', '+12001234570', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 7);

-- User 5: 3 bookings
INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1005, schedule_id, CURRENT_TIMESTAMP, 2, 423.08, 16.92, 440.00, 'PENDING', 'Emma', 'Johnson', 'test.user5@incremental.test', '+12001234571', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 8);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1005, schedule_id, CURRENT_TIMESTAMP - INTERVAL '7 days', 1, 211.54, 8.46, 220.00, 'COMPLETED', 'Emma', 'Johnson', 'test.user5@incremental.test', '+12001234571', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 9);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1005, schedule_id, CURRENT_TIMESTAMP - INTERVAL '1 day', 3, 634.62, 25.38, 660.00, 'COMPLETED', 'Emma', 'Johnson', 'test.user5@incremental.test', '+12001234571', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 10);

-- User 6-10: 1-2 bookings each
INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1006, schedule_id, CURRENT_TIMESTAMP, 2, 288.46, 11.54, 300.00, 'COMPLETED', 'Lucas', 'Silva', 'test.user6@incremental.test', '+12001234572', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 11);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1007, schedule_id, CURRENT_TIMESTAMP, 1, 96.15, 3.85, 100.00, 'COMPLETED', 'Sophie', 'Martin', 'test.user7@incremental.test', '+12001234573', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 12);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1008, schedule_id, CURRENT_TIMESTAMP, 1, 269.23, 10.77, 280.00, 'COMPLETED', 'David', 'Kim', 'test.user8@incremental.test', '+12001234574', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 13);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1008, schedule_id, CURRENT_TIMESTAMP - INTERVAL '4 days', 2, 538.46, 21.54, 560.00, 'COMPLETED', 'David', 'Kim', 'test.user8@incremental.test', '+12001234574', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days'
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 14);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1009, schedule_id, CURRENT_TIMESTAMP, 1, 38.46, 1.54, 40.00, 'COMPLETED', 'Isabella', 'Santos', 'test.user9@incremental.test', '+12001234575', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 15);

INSERT INTO booking (traveler_id, experience_schedule_id, booking_date, number_of_participants, base_amount, service_fee, total_amount, status, contact_first_name, contact_last_name, contact_email, contact_phone, confirmation_code, created_at, updated_at)
SELECT 1010, schedule_id, CURRENT_TIMESTAMP, 2, 769.23, 30.77, 800.00, 'COMPLETED', 'Oliver', 'Brown', 'test.user10@incremental.test', '+12001234576', 'TRP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM experience_schedule WHERE schedule_id IN (SELECT schedule_id FROM experience_schedule ORDER BY schedule_id LIMIT 1 OFFSET 16);

SELECT 'Inserted 20+ bookings for test users' AS status;

-- =====================================================
-- 4. INSERT SOME REVIEWS (Optional but helpful)
-- =====================================================
-- Reviews must be tied to bookings, so we'll link them to the bookings we just created

-- User 1: 1 review (for their first completed booking)
INSERT INTO review (reviewer_id, booking_id, experience_id, rating, title, comment, created_at, updated_at)
SELECT 
    b.traveler_id,
    b.booking_id,
    es.experience_id,
    5,
    'Amazing adventure!', 
    'Had an incredible time on this adventure tour. The guide was knowledgeable and the scenery was breathtaking.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM booking b
JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
WHERE b.traveler_id = 1001 
  AND b.status = 'COMPLETED'
ORDER BY b.booking_id
LIMIT 1;

-- User 2: 2 reviews (for their first two completed bookings)
INSERT INTO review (reviewer_id, booking_id, experience_id, rating, title, comment, created_at, updated_at)
SELECT 
    b.traveler_id,
    b.booking_id,
    es.experience_id,
    5,
    'Outstanding cultural experience', 
    'This tour exceeded all expectations. The historical insights were fascinating and the guide was excellent.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM booking b
JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
WHERE b.traveler_id = 1002 
  AND b.status = 'COMPLETED'
ORDER BY b.booking_id
LIMIT 1;

INSERT INTO review (reviewer_id, booking_id, experience_id, rating, title, comment, created_at, updated_at)
SELECT 
    b.traveler_id,
    b.booking_id,
    es.experience_id,
    4,
    'Worth every penny', 
    'Beautiful locations and well organized. Would definitely recommend to others.',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM booking b
JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
WHERE b.traveler_id = 1002 
  AND b.status = 'COMPLETED'
ORDER BY b.booking_id
LIMIT 1 OFFSET 1;

-- User 3: 1 review
INSERT INTO review (reviewer_id, booking_id, experience_id, rating, title, comment, created_at, updated_at)
SELECT 
    b.traveler_id,
    b.booking_id,
    es.experience_id,
    5,
    'Nature lover''s paradise', 
    'Perfect for photography enthusiasts. Saw amazing wildlife and captured stunning shots.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM booking b
JOIN experience_schedule es ON b.experience_schedule_id = es.schedule_id
WHERE b.traveler_id = 1003 
  AND b.status = 'COMPLETED'
ORDER BY b.booking_id
LIMIT 1;

SELECT 'Inserted reviews for some test users' AS status;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

SELECT '=====================================' AS separator;
SELECT 'VERIFICATION RESULTS' AS title;
SELECT '=====================================' AS separator;

-- Count new users
SELECT 'New Users:' AS metric, COUNT(*) AS count 
FROM users 
WHERE user_id BETWEEN 1001 AND 1010;

-- Count surveys
SELECT 'User Surveys:' AS metric, COUNT(*) AS count 
FROM user_survey 
WHERE user_id BETWEEN 1001 AND 1010;

-- Count survey interests
SELECT 'Survey Interests:' AS metric, COUNT(*) AS count 
FROM user_survey_interests usi
JOIN user_survey us ON usi.user_survey_survey_id = us.survey_id
WHERE us.user_id BETWEEN 1001 AND 1010;

-- Count bookings
SELECT 'Bookings:' AS metric, COUNT(*) AS count 
FROM booking 
WHERE traveler_id BETWEEN 1001 AND 1010;

-- Count reviews
SELECT 'Reviews:' AS metric, COUNT(*) AS count 
FROM review 
WHERE reviewer_id BETWEEN 1001 AND 1010;

-- Show user summary
SELECT 
    u.user_id,
    u.first_name,
    us.travel_style,
    us.experience_budget,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(DISTINCT r.review_id) AS total_reviews
FROM users u
LEFT JOIN user_survey us ON u.user_id = us.user_id
LEFT JOIN booking b ON u.user_id = b.traveler_id
LEFT JOIN review r ON u.user_id = r.reviewer_id
WHERE u.user_id BETWEEN 1001 AND 1010
GROUP BY u.user_id, u.first_name, us.travel_style, us.experience_budget
ORDER BY u.user_id;

COMMIT;

-- =====================================================
-- TESTING INSTRUCTIONS
-- =====================================================
-- 
-- 1. Run this script to insert test data
-- 2. Check the watermark table:
--    SELECT * FROM pipeline_watermarks WHERE pipeline_name = 'user_profile_analytics';
-- 3. Run the user_profile_analytics DAG in Airflow
-- 4. Check the logs - should show:
--    - "Pipeline mode: INCREMENTAL"
--    - "Extracted 10 users with booking activity"
-- 5. Verify results:
--    SELECT * FROM user_analytics_profile WHERE user_id BETWEEN 1001 AND 1010;
-- 6. Check clusters:
--    SELECT user_id, cluster_id FROM user_analytics_profile WHERE user_id BETWEEN 1001 AND 1010;
--
-- =====================================================

