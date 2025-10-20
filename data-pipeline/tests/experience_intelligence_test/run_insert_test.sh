#!/bin/bash

# =====================================================
# Run Experience Intelligence Test Data Insert Script
# =====================================================
# This script executes the test data insert SQL script
# using Docker to connect to the PostgreSQL database
# =====================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Experience Intelligence Test Data Insert${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Check if Docker container is running
if ! docker ps | grep -q postgres; then
    echo -e "${RED}Error: PostgreSQL Docker container is not running${NC}"
    echo "Please start your Docker container first"
    exit 1
fi

# Execute the SQL script
echo -e "${GREEN}Inserting 10 test experiences (2001-2010)...${NC}"
echo ""

docker exec -i $(docker ps -q -f name=postgres) psql -U app -d appdb < exp_test_data_insert.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Test data inserted successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Run the experience_intelligence pipeline in Airflow"
    echo "2. Check logs for 'Extracted 10 experiences for processing'"
    echo "3. Verify results in experience_intelligence table"
    echo ""
    echo -e "${BLUE}Quick verification query:${NC}"
    echo "docker exec -i \$(docker ps -q -f name=postgres) psql -U app -d appdb -c \"SELECT experience_id, title, category FROM experiences WHERE experience_id BETWEEN 2001 AND 2010;\""
else
    echo ""
    echo -e "${RED}❌ Error inserting test data${NC}"
    echo "Please check the error messages above"
    exit 1
fi

