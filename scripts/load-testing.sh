#!/bin/bash

# Load Testing Script for StayFit Health Companion
# Tests performance and WAF behavior under load

set -e

TARGET_URL="https://your-distribution.cloudfront.net"
LOAD_TEST_RESULTS_DIR="load-test-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "⚡ LOAD TESTING FOR STAYFIT HEALTH COMPANION"
echo "<REDACTED_CREDENTIAL>==="
echo "Target: $TARGET_URL"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create results directory
mkdir -p "$LOAD_TEST_RESULTS_DIR"

# Function to test basic connectivity
test_connectivity() {
    echo "🔍 Testing Basic Connectivity..."
    
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$TARGET_URL/")
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/")
    
    echo "HTTP Status: $HTTP_STATUS"
    echo "Response Time: ${RESPONSE_TIME}s"
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Basic connectivity working"
        return 0
    else
        echo "❌ Connectivity issue detected"
        return 1
    fi
}

# Function to perform light load test
light_load_test() {
    echo -e "\n⚡ Light Load Test (10 concurrent requests)..."
    
    # Create temporary script for concurrent requests
    cat > /tmp/load_test.sh << 'EOF'
#!/bin/bash
URL="$1"
REQUESTS="$2"
RESULTS_FILE="$3"

for i in $(seq 1 $REQUESTS); do
    START_TIME=$(date +%s.%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    END_TIME=$(date +%s.%N)
    RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l)
    echo "$i,$HTTP_CODE,$RESPONSE_TIME" >> "$RESULTS_FILE"
done
EOF
    
    chmod +x /tmp/load_test.sh
    
    # Run 10 concurrent requests
    RESULTS_FILE="$LOAD_TEST_RESULTS_DIR/light_load_$TIMESTAMP.csv"
    echo "request_id,http_code,response_time" > "$RESULTS_FILE"
    
    for i in {1..10}; do
        /tmp/load_test.sh "$TARGET_URL" 1 "$RESULTS_FILE" &
    done
    
    wait
    
    # Analyze results
    TOTAL_REQUESTS=$(tail -n +2 "$RESULTS_FILE" | wc -l)
    SUCCESS_REQUESTS=$(tail -n +2 "$RESULTS_FILE" | grep ",200," | wc -l)
    BLOCKED_REQUESTS=$(tail -n +2 "$RESULTS_FILE" | grep -E ",403,|,429," | wc -l)
    
    if [ "$TOTAL_REQUESTS" -gt 0 ]; then
        SUCCESS_RATE=$((SUCCESS_REQUESTS * 100 / TOTAL_REQUESTS))
        BLOCK_RATE=$((BLOCKED_REQUESTS * 100 / TOTAL_REQUESTS))
        
        echo "Total Requests: $TOTAL_REQUESTS"
        echo "Successful Requests: $SUCCESS_REQUESTS ($SUCCESS_RATE%)"
        echo "Blocked Requests: $BLOCKED_REQUESTS ($BLOCK_RATE%)"
        
        # Calculate average response time
        if command -v awk >/dev/null 2>&1; then
            AVG_RESPONSE=$(tail -n +2 "$RESULTS_FILE" | awk -F',' '{sum+=$3; count++} END {if(count>0) print sum/count; else print 0}')
            echo "Average Response Time: ${AVG_RESPONSE}s"
        fi
    fi
    
    rm -f /tmp/load_test.sh
}

# Function to test rate limiting
rate_limit_test() {
    echo -e "\n🚦 Rate Limiting Test (50 rapid requests)..."
    
    RATE_RESULTS_FILE="$LOAD_TEST_RESULTS_DIR/rate_limit_$TIMESTAMP.csv"
    echo "request_id,http_code,response_time" > "$RATE_RESULTS_FILE"
    
    BLOCKED_COUNT=0
    SUCCESS_COUNT=0
    
    for i in {1..50}; do
        START_TIME=$(date +%s.%N)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/" || echo "ERROR")
        END_TIME=$(date +%s.%N)
        RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
        
        echo "$i,$HTTP_CODE,$RESPONSE_TIME" >> "$RATE_RESULTS_FILE"
        
        if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "429" ]; then
            ((BLOCKED_COUNT++))
        elif [ "$HTTP_CODE" = "200" ]; then
            ((SUCCESS_COUNT++))
        fi
        
        # Small delay to avoid overwhelming
        sleep 0.1
    done
    
    echo "Rate Limit Test Results:"
    echo "Successful Requests: $SUCCESS_COUNT"
    echo "Blocked Requests: $BLOCKED_COUNT"
    echo "Block Rate: $((BLOCKED_COUNT * 100 / 50))%"
    
    if [ "$BLOCKED_COUNT" -gt 0 ]; then
        echo "✅ Rate limiting is active"
    else
        echo "⚠️ No rate limiting detected"
    fi
}

# Function to test geographic access (if possible)
geographic_test() {
    echo -e "\n🌍 Geographic Access Test..."
    
    # Test with different User-Agent strings to simulate different regions
    echo "Testing with different user agents..."
    
    # Standard request
    NORMAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/")
    echo "Normal Request: $NORMAL_RESPONSE"
    
    # Request with suspicious patterns
    SUSPICIOUS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "User-Agent: BadBot/1.0" \
        "$TARGET_URL/")
    echo "Suspicious User-Agent: $SUSPICIOUS_RESPONSE"
    
    if [ "$SUSPICIOUS_RESPONSE" = "403" ]; then
        echo "✅ User-Agent filtering may be active"
    else
        echo "⚠️ No User-Agent filtering detected"
    fi
}

# Function to test different endpoints
endpoint_load_test() {
    echo -e "\n📄 Endpoint Load Test..."
    
    ENDPOINTS=(
        "/"
        "/index.html"
        "/health-reports.html"
        "/digital-analysis.html"
        "/search.html"
        "/settings.html"
    )
    
    ENDPOINT_RESULTS_FILE="$LOAD_TEST_RESULTS_DIR/endpoints_$TIMESTAMP.csv"
    echo "endpoint,http_code,response_time" > "$ENDPOINT_RESULTS_FILE"
    
    for endpoint in "${ENDPOINTS[@]}"; do
        echo "Testing endpoint: $endpoint"
        
        START_TIME=$(date +%s.%N)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL$endpoint" || echo "ERROR")
        END_TIME=$(date +%s.%N)
        RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l 2>/dev/null || echo "0")
        
        echo "$endpoint,$HTTP_CODE,$RESPONSE_TIME" >> "$ENDPOINT_RESULTS_FILE"
        echo "  Status: $HTTP_CODE, Time: ${RESPONSE_TIME}s"
    done
}

# Function to generate load test report
generate_report() {
    echo -e "\n📊 LOAD TEST REPORT"
    echo "==================="
    echo "Target: $TARGET_URL"
    echo "Test Date: $(date)"
    echo "Results Directory: $LOAD_TEST_RESULTS_DIR"
    echo ""
    
    echo "📁 Generated Files:"
    ls -la "$LOAD_TEST_RESULTS_DIR"/*"$TIMESTAMP"* 2>/dev/null || echo "No test files generated"
    
    echo ""
    echo "🎯 Load Test Summary:"
    echo "- Light Load Test: 10 concurrent requests"
    echo "- Rate Limit Test: 50 rapid requests"
    echo "- Endpoint Test: 6 different pages"
    echo "- Geographic Test: User-agent variations"
    
    echo ""
    echo "💡 Recommendations:"
    if [ "$BLOCKED_COUNT" -gt 0 ]; then
        echo "✅ Rate limiting is working - good security posture"
    else
        echo "⚠️ Consider implementing rate limiting for better protection"
    fi
    
    echo "📈 For detailed analysis, review CSV files in $LOAD_TEST_RESULTS_DIR/"
}

# Main execution
echo "🚀 Starting Load Testing Suite..."

if test_connectivity; then
    light_load_test
    rate_limit_test
    geographic_test
    endpoint_load_test
    generate_report
else
    echo "❌ Cannot proceed with load testing - connectivity issues"
    exit 1
fi

echo ""
echo "✅ Load testing completed successfully!"
echo "📊 Results saved to: $LOAD_TEST_RESULTS_DIR/"
echo "🔗 Target tested: $TARGET_URL"
