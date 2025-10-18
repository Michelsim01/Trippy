#!/bin/bash

echo "🌱 Starting database seeding process..."
echo "This will populate your database with sample users, experiences, schedules, bookings, reviews, and wishlist items."

# Navigate to the backend directory
cd "$(dirname "$0")"

# Compile and run the seeding application
echo "📦 Compiling and running the database seeder..."
./mvnw compile exec:java -Dexec.mainClass="com.backend.SeedDatabaseRunner"

echo "✅ Database seeding process completed!"
echo ""
echo "📊 What was created:"
echo "   • 80 users (15 guides + 65 travelers) with 0 trip points"
echo "   • 100 diverse experiences across all categories"
echo "   • 300-500 experience schedules (past and future)"
echo "   • Bookings for 65 active travelers"
echo "   • Reviews for ~70% of completed bookings"
echo "   • User surveys for all 80 users"
echo "   • Wishlist items for travelers"
echo ""
echo "🚀 You can now test the analytics pipelines with robust data!"