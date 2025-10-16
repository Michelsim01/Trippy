#!/bin/bash

echo "🗑️  Database Cleanup Script"
echo "This will remove ALL data from your Trippy database tables."
echo ""

# Get database connection details from application.properties
DB_URL=$(grep "spring.datasource.url" src/main/resources/application.properties | cut -d'=' -f2)
DB_USERNAME=$(grep "spring.datasource.username" src/main/resources/application.properties | cut -d'=' -f2)
DB_PASSWORD=$(grep "spring.datasource.password" src/main/resources/application.properties | cut -d'=' -f2)

# Extract database details from URL (e.g., jdbc:postgresql://localhost:5332/trippy)
DB_HOST=$(echo $DB_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
DB_PORT=$(echo $DB_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
DB_NAME=$(echo $DB_URL | sed 's/.*\/\([^?]*\).*/\1/')

echo "📊 Database: $DB_NAME"
echo "🌐 Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USERNAME"
echo ""

# Confirmation prompt
read -p "⚠️  Are you sure you want to delete ALL data? This action cannot be undone! (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo ""
echo "🧹 Starting database cleanup..."

# Navigate to the backend directory
cd "$(dirname "$0")"

# SQL commands to clear all tables in the correct order (respecting foreign key constraints)
SQL_COMMANDS="
-- Disable foreign key checks temporarily (PostgreSQL)
SET session_replication_role = replica;

-- Clear all data from tables in dependency order
TRUNCATE TABLE article_comment CASCADE;
TRUNCATE TABLE travel_article CASCADE;
TRUNCATE TABLE message CASCADE;
TRUNCATE TABLE chat_member CASCADE;
TRUNCATE TABLE personal_chat CASCADE;
TRUNCATE TABLE cohort_member CASCADE;
TRUNCATE TABLE trip_cohort CASCADE;
TRUNCATE TABLE review CASCADE;
TRUNCATE TABLE booking CASCADE;
TRUNCATE TABLE transaction CASCADE;
TRUNCATE TABLE wishlist_item CASCADE;
TRUNCATE TABLE experience_schedule CASCADE;
TRUNCATE TABLE experience_media CASCADE;
TRUNCATE TABLE experience_itinerary CASCADE;
TRUNCATE TABLE experience_tags CASCADE;
TRUNCATE TABLE experiences CASCADE;
TRUNCATE TABLE kyc_document CASCADE;
TRUNCATE TABLE notification CASCADE;
TRUNCATE TABLE trip_points CASCADE;
TRUNCATE TABLE pending_users CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset all sequences to start from 1 (only for tables that exist and have sequences)
SELECT setval(pg_get_serial_sequence('users', 'user_id'), 1, false);
SELECT setval(pg_get_serial_sequence('experiences', 'experience_id'), 1, false);
SELECT setval(pg_get_serial_sequence('experience_schedule', 'schedule_id'), 1, false);
SELECT setval(pg_get_serial_sequence('experience_media', 'media_id'), 1, false);
SELECT setval(pg_get_serial_sequence('experience_itinerary', 'itinerary_id'), 1, false);
SELECT setval(pg_get_serial_sequence('booking', 'booking_id'), 1, false);
SELECT setval(pg_get_serial_sequence('review', 'review_id'), 1, false);
SELECT setval(pg_get_serial_sequence('wishlist_item', 'wishlist_item_id'), 1, false);
SELECT setval(pg_get_serial_sequence('trip_cohort', 'cohort_id'), 1, false);
SELECT setval(pg_get_serial_sequence('notification', 'notification_id'), 1, false);
SELECT setval(pg_get_serial_sequence('trip_points', 'points_id'), 1, false);
"

# Execute SQL commands
echo "📝 Executing database cleanup commands..."

if command -v psql &> /dev/null; then
    # Use psql if available
    echo "$SQL_COMMANDS" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -q
    
    if [ $? -eq 0 ]; then
        echo "✅ Database cleanup completed successfully!"
    else
        echo "❌ Database cleanup failed. Please check your database connection."
        exit 1
    fi
else
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    echo ""
    echo "Alternative options:"
    echo "1. Install PostgreSQL client: brew install postgresql"
    echo "2. Use a database GUI tool to run the cleanup manually"
    echo "3. Connect via your IDE's database tools"
    exit 1
fi

echo ""
echo "📊 Database Statistics:"
echo "   • All user data cleared"
echo "   • All experiences cleared" 
echo "   • All bookings and reviews cleared"
echo "   • All schedules and media cleared"
echo "   • All sequences reset to start from 1"
echo ""
echo "🚀 Your database is now clean and ready for fresh data!"
echo "💡 You can run './seed-database.sh' to populate it with test data."