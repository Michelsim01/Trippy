#!/bin/bash

# Local CI Test Runner
# This script runs the same tests that will run in CI

set -e

echo "🚀 Running Local CI Tests..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "backend/pom.xml" ]] || [[ ! -f "frontend/package.json" ]]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Backend dependencies (Maven will download them during test)
print_status "Backend dependencies will be resolved by Maven"

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [[ ! -f "package-lock.json" ]]; then
    print_warning "No package-lock.json found, running npm install"
    npm install
else
    npm ci
fi
cd ..

# Admin frontend dependencies
echo "Installing admin frontend dependencies..."
cd admin_frontend
if [[ ! -f "package-lock.json" ]]; then
    print_warning "No package-lock.json found, running npm install"
    npm install
else
    npm ci
fi
cd ..

echo ""
echo "🧪 Running Tests..."
echo "==================="

# Backend tests (excluding email tests)
echo "Running backend tests (excluding email tests)..."
cd backend
if ./mvnw test -Dspring.profiles.active=ci \
    -Dtest='!**/*EmailServiceTest,!**/*EmailControllerTest,!**/*MailTest,!**/*EmailTest' \
    -Dmaven.test.failure.ignore=false; then
    print_status "Backend tests passed"
else
    print_error "Backend tests failed"
    exit 1
fi
cd ..

# Frontend lint
echo "Running frontend lint..."
cd frontend
if npm run lint; then
    print_status "Frontend lint passed"
else
    print_error "Frontend lint failed"
    exit 1
fi
cd ..

# Admin frontend lint
echo "Running admin frontend lint..."
cd admin_frontend
if npm run lint; then
    print_status "Admin frontend lint passed"
else
    print_error "Admin frontend lint failed"
    exit 1
fi
cd ..

echo ""
echo "🏗️  Running Builds..."
echo "===================="

# Backend build
echo "Building backend..."
cd backend
if ./mvnw package -DskipTests; then
    print_status "Backend build successful"
else
    print_error "Backend build failed"
    exit 1
fi
cd ..

# Frontend build
echo "Building frontend..."
cd frontend
if npm run build; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Admin frontend build
echo "Building admin frontend..."
cd admin_frontend
if npm run build; then
    print_status "Admin frontend build successful"
else
    print_error "Admin frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "🎉 All CI tests passed locally!"
echo "==============================="
echo "Your changes are ready for CI pipeline"