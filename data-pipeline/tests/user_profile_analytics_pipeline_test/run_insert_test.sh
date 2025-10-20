#!/bin/bash
# =====================================================
# Helper Script: Insert Test Data
# =====================================================

echo "📝 Inserting test data for user_profile_analytics pipeline..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the SQL script through Docker
docker exec -i postgres-spring psql -U app -d appdb < "$SCRIPT_DIR/user_test_data_insert.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test data inserted successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Go to Airflow UI: http://localhost:8080"
    echo "2. Trigger the 'user_profile_analytics' DAG"
    echo "3. Wait for completion"
    echo "4. Run: ./run_verify_test.sh"
else
    echo ""
    echo "❌ Error inserting test data. Check the output above."
    exit 1
fi

