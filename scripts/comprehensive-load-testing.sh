#!/bin/bash

# Comprehensive Load Testing Suite for StayFit Health Companion
# Target: https://your-distribution.cloudfront.net/
# Author: Shashank Chinchli
# Date: July 1, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_URL="https://your-distribution.cloudfront.net"
RESULTS_DIR="load-test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$RESULTS_DIR/load_test_$TIMESTAMP.log"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}🚀 StayFit Health Companion - Comprehensive Load Testing Suite${NC}"
echo -e "${BLUE}<REDACTED_CREDENTIAL>========================${NC}"
echo "Target URL: $TARGET_URL"
echo "Test Date: $(date)"
echo "Results Directory: $RESULTS_DIR"
echo "Log File: $LOG_FILE"
echo ""

# Initialize log file
{
    echo "StayFit Health Companion - Load Testing Results"
    echo "<REDACTED_CREDENTIAL>======"
    echo "Test Date: $(date)"
    echo "Target URL: $TARGET_URL"
    echo ""
} > "$LOG_FILE"

# Function to log results
log_result() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to test endpoint
test_endpoint() {
    local url="$1"
    local description="$2"
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    # Test with curl and capture metrics
    local response=$(curl -s -o /dev/null -w "HTTP_CODE:%{http_code};TIME_TOTAL:%{time_total};TIME_CONNECT:%{time_connect};SIZE_DOWNLOAD:%{size_download}" "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "${RED}❌ FAILED: $description${NC}"
        log_result "❌ FAILED: $description - Connection error"
        return 1
    fi
    
    # Parse response
    local http_code=$(echo "$response" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
    local time_total=$(echo "$response" | grep -o 'TIME_TOTAL:[0-9.]*' | cut -d: -f2)
    local time_connect=$(echo "$response" | grep -o 'TIME_CONNECT:[0-9.]*' | cut -d: -f2)
    local size_download=$(echo "$response" | grep -o 'SIZE_DOWNLOAD:[0-9]*' | cut -d: -f2)
    
    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✅ SUCCESS: $description${NC}"
        echo "   HTTP Code: $http_code | Response Time: ${time_total}s | Size: ${size_download} bytes"
        log_result "✅ SUCCESS: $description - HTTP: $http_code, Time: ${time_total}s, Size: ${size_download}B"
        return 0
    else
        echo -e "${RED}❌ FAILED: $description${NC}"
        echo "   HTTP Code: $http_code | Response Time: ${time_total}s"
        log_result "❌ FAILED: $description - HTTP: $http_code, Time: ${time_total}s"
        return 1
    fi
}

# Function to run concurrent load test
concurrent_load_test() {
    local num_requests="$1"
    local description="$2"
    local url="${3:-$TARGET_URL}"
    
    echo -e "${YELLOW}🔄 Running: $description ($num_requests concurrent requests)${NC}"
    
    local success_count=0
    local total_time=0
    local start_time=$(date +%s.%N)
    
    # Create temporary file for results
    local temp_results="/tmp/load_test_$$"
    
    # Run concurrent requests
    for ((i=1; i<=num_requests; i++)); do
        {
            local response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "$url" 2>/dev/null || echo "000:0")
            echo "$response" >> "$temp_results"
        } &
    done
    
    # Wait for all background jobs to complete
    wait
    
    local end_time=$(date +%s.%N)
    local total_test_time=$(echo "$end_time - $start_time" | bc -l)
    
    # Analyze results
    if [[ -f "$temp_results" ]]; then
        while IFS=':' read -r http_code response_time; do
            if [[ "$http_code" == "200" ]]; then
                ((success_count++))
                total_time=$(echo "$total_time + $response_time" | bc -l)
            fi
        done < "$temp_results"
        
        rm -f "$temp_results"
    fi
    
    local success_rate=$(echo "scale=2; $success_count * 100 / $num_requests" | bc -l)
    local avg_response_time=$(echo "scale=3; $total_time / $success_count" | bc -l 2>/dev/null || echo "0")
    local requests_per_second=$(echo "scale=2; $num_requests / $total_test_time" | bc -l)
    
    echo "   Results: $success_count/$num_requests successful (${success_rate}%)"
    echo "   Average Response Time: ${avg_response_time}s"
    echo "   Total Test Time: ${total_test_time}s"
    echo "   Requests/Second: ${requests_per_second}"
    
    log_result "$description Results:"
    log_result "  - Success Rate: $success_count/$num_requests (${success_rate}%)"
    log_result "  - Average Response Time: ${avg_response_time}s"
    log_result "  - Total Test Time: ${total_test_time}s"
    log_result "  - Requests/Second: ${requests_per_second}"
    
    if (( $(echo "$success_rate >= 95" | bc -l) )); then
        echo -e "${GREEN}✅ PASSED: $description${NC}"
        log_result "✅ PASSED: $description"
        return 0
    else
        echo -e "${RED}❌ FAILED: $description${NC}"
        log_result "❌ FAILED: $description"
        return 1
    fi
}

# Test 1: Basic Connectivity Test
echo -e "\n${BLUE}📡 Test 1: Basic Connectivity Test${NC}"
echo "=================================="
test_endpoint "$TARGET_URL" "Main Dashboard"
basic_connectivity=$?

# Test 2: All Endpoints Test
echo -e "\n${BLUE}📄 Test 2: All Application Endpoints${NC}"
echo "===================================="
endpoints=(
    "$TARGET_URL/"
    "$TARGET_URL/index.html"
    "$TARGET_URL/health-reports.html"
    "$TARGET_URL/digital-analysis.html"
    "$TARGET_URL/search.html"
    "$TARGET_URL/settings.html"
)

endpoint_descriptions=(
    "Dashboard Root"
    "Main Dashboard"
    "Health Reports"
    "Digital Analysis"
    "AI Search"
    "Settings Page"
)

endpoint_success=0
endpoint_total=${#endpoints[@]}

for i in "${!endpoints[@]}"; do
    if test_endpoint "${endpoints[$i]}" "${endpoint_descriptions[$i]}"; then
        ((endpoint_success++))
    fi
done

endpoint_success_rate=$(echo "scale=2; $endpoint_success * 100 / $endpoint_total" | bc -l)
echo "Endpoint Test Summary: $endpoint_success/$endpoint_total successful (${endpoint_success_rate}%)"

# Test 3: Light Load Test
echo -e "\n${BLUE}⚡ Test 3: Light Load Test${NC}"
echo "=========================="
concurrent_load_test 10 "Light Load Test (10 concurrent requests)"
light_load=$?

# Test 4: Medium Load Test
echo -e "\n${BLUE}🔥 Test 4: Medium Load Test${NC}"
echo "==========================="
concurrent_load_test 25 "Medium Load Test (25 concurrent requests)"
medium_load=$?

# Test 5: Heavy Load Test
echo -e "\n${BLUE}💪 Test 5: Heavy Load Test${NC}"
echo "=========================="
concurrent_load_test 50 "Heavy Load Test (50 concurrent requests)"
heavy_load=$?

# Test 6: Stress Test
echo -e "\n${BLUE}🚨 Test 6: Stress Test${NC}"
echo "======================"
concurrent_load_test 100 "Stress Test (100 concurrent requests)"
stress_test=$?

# Test 7: Sustained Load Test
echo -e "\n${BLUE}⏱️  Test 7: Sustained Load Test${NC}"
echo "==============================="
echo "Running sustained load for 60 seconds..."

sustained_start=$(date +%s)
sustained_success=0
sustained_total=0

while [[ $(($(date +%s) - sustained_start)) -lt 60 ]]; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL" 2>/dev/null || echo "000")
    ((sustained_total++))
    if [[ "$response" == "200" ]]; then
        ((sustained_success++))
    fi
    sleep 1
done

sustained_success_rate=$(echo "scale=2; $sustained_success * 100 / $sustained_total" | bc -l)
echo "Sustained Load Results: $sustained_success/$sustained_total successful (${sustained_success_rate}%)"
log_result "Sustained Load Test (60s): $sustained_success/$sustained_total (${sustained_success_rate}%)"

# Test 8: Performance Benchmark
echo -e "\n${BLUE}📊 Test 8: Performance Benchmark${NC}"
echo "================================="

echo "Running performance benchmark (10 samples)..."
total_time=0
successful_requests=0

for i in {1..10}; do
    response_time=$(curl -s -o /dev/null -w "%{time_total}:%{http_code}" "$TARGET_URL" 2>/dev/null || echo "0:000")
    time_part=$(echo "$response_time" | cut -d: -f1)
    code_part=$(echo "$response_time" | cut -d: -f2)
    
    if [[ "$code_part" == "200" ]]; then
        total_time=$(echo "$total_time + $time_part" | bc -l)
        ((successful_requests++))
    fi
done

if [[ $successful_requests -gt 0 ]]; then
    avg_time=$(echo "scale=3; $total_time / $successful_requests" | bc -l)
    echo "Average Response Time: ${avg_time}s (from $successful_requests successful requests)"
    log_result "Performance Benchmark: Average ${avg_time}s ($successful_requests/10 successful)"
    
    if (( $(echo "$avg_time < 2.0" | bc -l) )); then
        echo -e "${GREEN}✅ PASSED: Performance benchmark (<2s average)${NC}"
        performance_test=0
    else
        echo -e "${YELLOW}⚠️  WARNING: Performance benchmark (>2s average)${NC}"
        performance_test=1
    fi
else
    echo -e "${RED}❌ FAILED: Performance benchmark (no successful requests)${NC}"
    performance_test=1
fi

# Test Summary
echo -e "\n${BLUE}📋 COMPREHENSIVE LOAD TESTING SUMMARY${NC}"
echo "======================================"

log_result ""
log_result "COMPREHENSIVE LOAD TESTING SUMMARY"
log_result "=================================="

tests_passed=0
total_tests=8

# Check each test result
if [[ $basic_connectivity -eq 0 ]]; then
    echo -e "${GREEN}✅ Basic Connectivity Test: PASSED${NC}"
    log_result "✅ Basic Connectivity Test: PASSED"
    ((tests_passed++))
else
    echo -e "${RED}❌ Basic Connectivity Test: FAILED${NC}"
    log_result "❌ Basic Connectivity Test: FAILED"
fi

if (( $(echo "$endpoint_success_rate >= 95" | bc -l) )); then
    echo -e "${GREEN}✅ Endpoint Test: PASSED (${endpoint_success_rate}%)${NC}"
    log_result "✅ Endpoint Test: PASSED (${endpoint_success_rate}%)"
    ((tests_passed++))
else
    echo -e "${RED}❌ Endpoint Test: FAILED (${endpoint_success_rate}%)${NC}"
    log_result "❌ Endpoint Test: FAILED (${endpoint_success_rate}%)"
fi

if [[ $light_load -eq 0 ]]; then
    echo -e "${GREEN}✅ Light Load Test: PASSED${NC}"
    log_result "✅ Light Load Test: PASSED"
    ((tests_passed++))
else
    echo -e "${RED}❌ Light Load Test: FAILED${NC}"
    log_result "❌ Light Load Test: FAILED"
fi

if [[ $medium_load -eq 0 ]]; then
    echo -e "${GREEN}✅ Medium Load Test: PASSED${NC}"
    log_result "✅ Medium Load Test: PASSED"
    ((tests_passed++))
else
    echo -e "${RED}❌ Medium Load Test: FAILED${NC}"
    log_result "❌ Medium Load Test: FAILED"
fi

if [[ $heavy_load -eq 0 ]]; then
    echo -e "${GREEN}✅ Heavy Load Test: PASSED${NC}"
    log_result "✅ Heavy Load Test: PASSED"
    ((tests_passed++))
else
    echo -e "${RED}❌ Heavy Load Test: FAILED${NC}"
    log_result "❌ Heavy Load Test: FAILED"
fi

if [[ $stress_test -eq 0 ]]; then
    echo -e "${GREEN}✅ Stress Test: PASSED${NC}"
    log_result "✅ Stress Test: PASSED"
    ((tests_passed++))
else
    echo -e "${RED}❌ Stress Test: FAILED${NC}"
    log_result "❌ Stress Test: FAILED"
fi

if (( $(echo "$sustained_success_rate >= 95" | bc -l) )); then
    echo -e "${GREEN}✅ Sustained Load Test: PASSED (${sustained_success_rate}%)${NC}"
    log_result "✅ Sustained Load Test: PASSED (${sustained_success_rate}%)"
    ((tests_passed++))
else
    echo -e "${RED}❌ Sustained Load Test: FAILED (${sustained_success_rate}%)${NC}"
    log_result "❌ Sustained Load Test: FAILED (${sustained_success_rate}%)"
fi

if [[ $performance_test -eq 0 ]]; then
    echo -e "${GREEN}✅ Performance Benchmark: PASSED${NC}"
    log_result "✅ Performance Benchmark: PASSED"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠️  Performance Benchmark: WARNING${NC}"
    log_result "⚠️ Performance Benchmark: WARNING"
fi

# Overall Results
overall_success_rate=$(echo "scale=2; $tests_passed * 100 / $total_tests" | bc -l)

echo ""
echo -e "${BLUE}OVERALL RESULTS:${NC}"
echo "Tests Passed: $tests_passed/$total_tests (${overall_success_rate}%)"
echo "Test Date: $(date)"
echo "Results saved to: $LOG_FILE"

log_result ""
log_result "OVERALL RESULTS:"
log_result "Tests Passed: $tests_passed/$total_tests (${overall_success_rate}%)"
log_result "Test Completed: $(date)"

if (( $(echo "$overall_success_rate >= 85" | bc -l) )); then
    echo -e "\n${GREEN}🎉 LOAD TESTING SUITE: PASSED${NC}"
    echo -e "${GREEN}StayFit Health Companion is performing well under load!${NC}"
    log_result ""
    log_result "🎉 LOAD TESTING SUITE: PASSED"
    log_result "StayFit Health Companion is performing well under load!"
    exit 0
else
    echo -e "\n${RED}⚠️  LOAD TESTING SUITE: NEEDS ATTENTION${NC}"
    echo -e "${RED}Some tests failed. Please review the results above.${NC}"
    log_result ""
    log_result "⚠️ LOAD TESTING SUITE: NEEDS ATTENTION"
    log_result "Some tests failed. Please review the results above."
    exit 1
fi
