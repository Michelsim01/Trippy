#!/bin/bash
# =====================================================
# Helper Script: Insert Test Data
# =====================================================

echo "📝 Inserting test data for experience_intelligence pipeline..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the SQL script through Docker
docker exec -i postgres-spring psql -U app -d appdb < "$SCRIPT_DIR/exp_test_data_insert.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test data inserted successfully!"
    echo ""
else
    echo ""
    echo "❌ Error inserting test data."
    exit 1
fi

