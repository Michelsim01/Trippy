#!/bin/bash

# Comprehensive Error Analysis Script
# Run this to get detailed error information for all components

set +e  # Don't exit on errors - we want to capture them

echo "🔍 Comprehensive Error Analysis"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_section "🔴 BACKEND ERRORS"

cd backend

echo -e "${YELLOW}📋 Root Cause Analysis:${NC}"
echo ""

# Try to get the first error in detail
echo "🎯 Primary Error:"
if ./mvnw test 2>&1 | grep -A 20 "Could not resolve placeholder 'mapbox.api.access-token'" | head -10; then
    echo ""
    echo -e "${RED}❌ MAIN ISSUE: Missing 'mapbox.api.access-token' property in test configuration${NC}"
    echo ""
    echo "💡 SOLUTION:"
    echo "   1. The test profile is missing the MapBox API configuration"
    echo "   2. Need to add mapbox.api.access-token to application-test.properties"
    echo "   3. Or mock the GeocodingService in tests"
    echo ""
else
    echo "Running simplified test to get root cause..."
    ./mvnw test -Dtest=BackendApplicationTests 2>&1 | grep -A 10 -B 5 "Could not resolve placeholder" | head -15
fi

echo -e "${YELLOW}📊 Error Summary:${NC}"
echo "   - ApplicationContext fails to load"
echo "   - Missing configuration: mapbox.api.access-token"
echo "   - H2 syntax issues with PostgreSQL-specific SQL"
echo "   - 13 test methods affected"
echo ""

print_section "🟡 FRONTEND ERRORS"

cd ../frontend

echo -e "${YELLOW}📋 ESLint Issues:${NC}"
echo ""

# Get detailed linting errors
if npm run lint > lint-report.txt 2>&1; then
    echo -e "${GREEN}✅ No linting errors found${NC}"
else
    echo "🎯 Top Issues Found:"
    echo ""
    
    # Count different types of errors
    unused_vars=$(grep -c "no-unused-vars" lint-report.txt 2>/dev/null || echo "0")
    useless_escape=$(grep -c "no-useless-escape" lint-report.txt 2>/dev/null || echo "0")
    exhaustive_deps=$(grep -c "react-hooks/exhaustive-deps" lint-report.txt 2>/dev/null || echo "0")
    
    echo "📊 Error Breakdown:"
    echo "   - Unused variables/imports: $unused_vars"
    echo "   - Unnecessary escape characters: $useless_escape"
    echo "   - Missing useEffect dependencies: $exhaustive_deps"
    echo ""
    
    echo "🔍 Sample Issues:"
    head -20 lint-report.txt | grep -E "error|warning" | head -10
fi

echo ""
echo -e "${YELLOW}📊 Frontend Build Status:${NC}"
if npm run build > build-report.txt 2>&1; then
    echo -e "${GREEN}✅ Frontend builds successfully despite linting issues${NC}"
    if [ -d dist ]; then
        build_size=$(du -sh dist/ | cut -f1)
        echo "   📦 Build size: $build_size"
    fi
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    echo "Build errors:"
    tail -10 build-report.txt
fi

print_section "🟠 ADMIN FRONTEND ERRORS"

cd ../admin_frontend

echo -e "${YELLOW}📋 ESLint Configuration:${NC}"
echo ""

# Check ESLint configuration
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    echo -e "${GREEN}✅ ESLint configuration found${NC}"
    if npm run lint > admin-lint-report.txt 2>&1; then
        echo -e "${GREEN}✅ No linting errors${NC}"
    else
        echo "🎯 Linting Issues:"
        head -15 admin-lint-report.txt
    fi
else
    echo -e "${RED}❌ ESLint configuration missing${NC}"
    echo ""
    echo "💡 SOLUTION:"
    echo "   1. Run: npm init @eslint/config"
    echo "   2. Or copy configuration from main frontend"
    echo "   3. Or disable linting temporarily"
fi

echo ""
echo -e "${YELLOW}📊 Admin Frontend Build Status:${NC}"
if npm run build > admin-build-report.txt 2>&1; then
    echo -e "${GREEN}✅ Admin frontend builds successfully${NC}"
    if [ -d dist ]; then
        build_size=$(du -sh dist/ | cut -f1)
        echo "   📦 Build size: $build_size"
    fi
else
    echo -e "${RED}❌ Admin frontend build failed${NC}"
    echo "Build errors:"
    tail -10 admin-build-report.txt
fi

print_section "🔧 SOLUTIONS SUMMARY"

echo -e "${YELLOW}🎯 Priority Fixes:${NC}"
echo ""

echo "1️⃣  BACKEND - HIGH PRIORITY"
echo "   Problem: Tests fail due to missing MapBox configuration"
echo "   Quick Fix:"
echo "     cd backend/src/test/resources"
echo "     echo 'mapbox.api.access-token=test-token' >> application-test.properties"
echo ""

echo "2️⃣  FRONTEND - MEDIUM PRIORITY"
echo "   Problem: Code quality issues (unused variables, missing dependencies)"
echo "   Quick Fix:"
echo "     cd frontend"
echo "     # Remove unused imports and variables manually"
echo "     # Add missing dependencies to useEffect arrays"
echo ""

echo "3️⃣  ADMIN FRONTEND - LOW PRIORITY"
echo "   Problem: Missing ESLint configuration"
echo "   Quick Fix:"
echo "     cd admin_frontend"
echo "     cp ../frontend/.eslintrc.* . # Copy from main frontend"
echo "     # OR disable linting in package.json temporarily"
echo ""

print_section "🚀 VERIFICATION COMMANDS"

echo "After making fixes, verify with these commands:"
echo ""
echo "Backend:"
echo "  cd backend && ./mvnw test -Dtest=BackendApplicationTests"
echo ""
echo "Frontend:"
echo "  cd frontend && npm run lint --silent || echo 'Linting issues remain'"
echo "  cd frontend && npm run build"
echo ""
echo "Admin Frontend:"
echo "  cd admin_frontend && npm run build"
echo ""
echo "All components:"
echo "  ./scripts/verify-build.sh"

echo ""
echo -e "${GREEN}✅ Error analysis complete!${NC}"
echo ""

cd ..