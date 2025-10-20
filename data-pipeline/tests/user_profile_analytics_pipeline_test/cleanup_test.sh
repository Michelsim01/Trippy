#!/bin/bash
# =====================================================
# Helper Script: Cleanup Test Data
# =====================================================

echo "🧹 Cleaning up test data..."
echo ""
echo "⚠️  This will DELETE all test users (1001-1010) and related data."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Removing test data..."

# SQL cleanup script
docker exec -i postgres-spring psql -U app -d appdb <<-EOSQL
BEGIN;

DELETE FROM review WHERE reviewer_id BETWEEN 1001 AND 1010;
DELETE FROM booking WHERE traveler_id BETWEEN 1001 AND 1010;
DELETE FROM user_survey_interests WHERE user_survey_survey_id IN 
    (SELECT survey_id FROM user_survey WHERE user_id BETWEEN 1001 AND 1010);
DELETE FROM user_survey WHERE user_id BETWEEN 1001 AND 1010;
DELETE FROM user_analytics_profile WHERE user_id BETWEEN 1001 AND 1010;
DELETE FROM users WHERE user_id BETWEEN 1001 AND 1010;

SELECT '✅ Test data cleaned up successfully' AS status;

COMMIT;
EOSQL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Cleanup complete!"
else
    echo ""
    echo "❌ Error during cleanup. Check the output above."
    exit 1
fi

