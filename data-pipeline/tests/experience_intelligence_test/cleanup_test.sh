#!/bin/bash

# =====================================================
# Cleanup Experience Intelligence Test Data
# =====================================================
# This script removes all test data inserted by the
# 01_test_data_insert.sql script
# =====================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Experience Intelligence Test Data Cleanup${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Confirmation prompt
echo -e "${YELLOW}WARNING: This will delete all test data for experiences 2001-2010${NC}"
echo -e "${YELLOW}This includes:${NC}"
echo "  - 10 test experiences"
echo "  - All associated schedules"
echo "  - All bookings for these experiences"
echo "  - All reviews for these experiences"
echo "  - All tags and itineraries"
echo "  - Intelligence data and similarities"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cleanup cancelled${NC}"
    exit 0
fi

# Check if Docker container is running
if ! docker ps | grep -q postgres; then
    echo -e "${RED}Error: PostgreSQL Docker container is not running${NC}"
    echo "Please start your Docker container first"
    exit 1
fi

echo ""
echo -e "${GREEN}Cleaning up test data...${NC}"

# Execute cleanup SQL
docker exec -i $(docker ps -q -f name=postgres) psql -U app -d appdb <<EOF
BEGIN;

-- Delete in reverse order of foreign key dependencies

-- 1. Delete experience intelligence data
DELETE FROM experience_similarities WHERE experience_id BETWEEN 2001 AND 2010;
DELETE FROM experience_intelligence WHERE experience_id BETWEEN 2001 AND 2010;
SELECT 'Deleted intelligence data' AS status;

-- 2. Delete reviews
DELETE FROM review WHERE experience_id BETWEEN 2001 AND 2010;
SELECT 'Deleted reviews' AS status;

-- 3. Delete bookings (via schedules)
DELETE FROM booking WHERE experience_schedule_id IN (
    SELECT schedule_id FROM experience_schedule WHERE experience_id BETWEEN 2001 AND 2010
);
SELECT 'Deleted bookings' AS status;

-- 4. Delete experience schedules
DELETE FROM experience_schedule WHERE experience_id BETWEEN 2001 AND 2010;
SELECT 'Deleted schedules' AS status;

-- 5. Delete experience itineraries
DELETE FROM experience_itinerary WHERE experience_id BETWEEN 2001 AND 2010;
SELECT 'Deleted itineraries' AS status;

-- 6. Delete experience tags
DELETE FROM experience_tags WHERE experience_experience_id BETWEEN 2001 AND 2010;
SELECT 'Deleted tags' AS status;

-- 7. Delete experiences
DELETE FROM experiences WHERE experience_id BETWEEN 2001 AND 2010;
SELECT 'Deleted experiences' AS status;

-- Verification
SELECT '=====================================' AS separator;
SELECT 'CLEANUP VERIFICATION' AS title;
SELECT '=====================================' AS separator;

SELECT 'Remaining test experiences:' AS metric, COUNT(*) AS count 
FROM experiences WHERE experience_id BETWEEN 2001 AND 2010;

SELECT 'Remaining test reviews:' AS metric, COUNT(*) AS count 
FROM review WHERE experience_id BETWEEN 2001 AND 2010;

SELECT 'Remaining test bookings:' AS metric, COUNT(*) AS count 
FROM booking WHERE experience_schedule_id IN (
    SELECT schedule_id FROM experience_schedule WHERE experience_id BETWEEN 2001 AND 2010
);

COMMIT;

SELECT 'Cleanup completed successfully!' AS final_status;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Test data cleaned up successfully!${NC}"
    echo ""
    echo -e "${BLUE}All test experiences (2001-2010) have been removed from the database${NC}"
else
    echo ""
    echo -e "${RED}❌ Error during cleanup${NC}"
    echo "Please check the error messages above"
    exit 1
fi

