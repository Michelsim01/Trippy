#!/bin/bash

echo "🌱 Starting database seeding process..."
echo "This will populate your database with sample users, experiences, schedules, bookings, reviews, and wishlist items."

# Navigate to the backend directory
cd "$(dirname "$0")"

# Compile and run the seeding application
echo "📦 Compiling and running the database seeder..."
./mvnw compile exec:java -Dexec.mainClass="com.backend.SeedDatabaseRunner" -Dexec.classpathScope=runtime

echo "✅ Database seeding process completed!"
echo ""
echo "📊 What was created:"
echo "   • 25 users (10 guides + 15 travelers)"
echo "   • 20 diverse experiences across all categories"
echo "   • 60-100 experience schedules (past and future)"
echo "   • Bookings for completed experiences"
echo "   • Reviews for ~70% of completed bookings"
echo "   • Wishlist items for travelers"
echo ""
echo "🚀 You can now test the application with realistic data!"