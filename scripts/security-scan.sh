#!/bin/bash

# Security Scanning Script for StayFit Health Companion
# Tests common web vulnerabilities to verify WAF protection

set -e

TARGET_URL="https://your-distribution.cloudfront.net"
SCAN_RESULTS_DIR="security-scan-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔒 SECURITY SCANNING FOR STAYFIT HEALTH COMPANION"
echo "<REDACTED_CREDENTIAL>========="
echo "Target: $TARGET_URL"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create results directory
mkdir -p "$SCAN_RESULTS_DIR"

echo "=== BASIC RECONNAISSANCE ==="
echo "🔍 Gathering basic information..."

# Basic HTTP headers analysis
echo "📋 HTTP Headers Analysis:"
curl -s -I "$TARGET_URL/" > "$SCAN_RESULTS_DIR/headers-$TIMESTAMP.txt"
cat "$SCAN_RESULTS_DIR/headers-$TIMESTAMP.txt"

echo -e "\n=== SECURITY HEADER ANALYSIS ==="
echo "🔒 Checking security headers..."

# Check for security headers
SECURITY_HEADERS=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Strict-Transport-Security"
    "Content-Security-Policy"
    "Referrer-Policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
    if grep -qi "$header" "$SCAN_RESULTS_DIR/headers-$TIMESTAMP.txt"; then
        echo "✅ $header: Present"
    else
        echo "❌ $header: Missing"
    fi
done

echo -e "\n=== COMMON VULNERABILITY TESTS ==="
echo "🧪 Testing common web vulnerabilities..."

# Test 1: SQL Injection attempts (should be blocked by WAF)
echo "🔍 Test 1: SQL Injection Detection"
SQL_PAYLOADS=(
    "' OR '1'='1"
    "'; DROP TABLE users; --"
    "1' UNION SELECT NULL--"
    "admin'--"
)

for payload in "${SQL_PAYLOADS[@]}"; do
    echo "Testing payload: $payload"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/?id=$payload" || echo "ERROR")
    echo "Response: $RESPONSE"
    
    if [ "$RESPONSE" = "403" ]; then
        echo "✅ BLOCKED - WAF protection active"
    elif [ "$RESPONSE" = "200" ]; then
        echo "⚠️ ALLOWED - No WAF protection detected"
    else
        echo "🔍 RESPONSE: $RESPONSE"
    fi
done

echo -e "\n🔍 Test 2: Cross-Site Scripting (XSS) Detection"
XSS_PAYLOADS=(
    "<script>alert('XSS')</script>"
    "javascript:alert('XSS')"
    "<img src=x onerror=alert('XSS')>"
    "';alert('XSS');//"
)

for payload in "${XSS_PAYLOADS[@]}"; do
    echo "Testing XSS payload: $payload"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/?search=$payload" || echo "ERROR")
    echo "Response: $RESPONSE"
    
    if [ "$RESPONSE" = "403" ]; then
        echo "✅ BLOCKED - WAF protection active"
    elif [ "$RESPONSE" = "200" ]; then
        echo "⚠️ ALLOWED - No WAF protection detected"
    else
        echo "🔍 RESPONSE: $RESPONSE"
    fi
done

echo -e "\n🔍 Test 3: Path Traversal Detection"
PATH_PAYLOADS=(
    "../../../etc/passwd"
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts"
    "....//....//....//etc/passwd"
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
)

for payload in "${PATH_PAYLOADS[@]}"; do
    echo "Testing path traversal: $payload"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/$payload" || echo "ERROR")
    echo "Response: $RESPONSE"
    
    if [ "$RESPONSE" = "403" ]; then
        echo "✅ BLOCKED - WAF protection active"
    elif [ "$RESPONSE" = "404" ]; then
        echo "🔍 NOT FOUND - Normal response"
    elif [ "$RESPONSE" = "200" ]; then
        echo "⚠️ ALLOWED - Potential vulnerability"
    else
        echo "🔍 RESPONSE: $RESPONSE"
    fi
done

echo -e "\n🔍 Test 4: Command Injection Detection"
CMD_PAYLOADS=(
    "; ls -la"
    "| whoami"
    "&& cat /etc/passwd"
    "\`id\`"
)

for payload in "${CMD_PAYLOADS[@]}"; do
    echo "Testing command injection: $payload"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/?cmd=$payload" || echo "ERROR")
    echo "Response: $RESPONSE"
    
    if [ "$RESPONSE" = "403" ]; then
        echo "✅ BLOCKED - WAF protection active"
    elif [ "$RESPONSE" = "200" ]; then
        echo "⚠️ ALLOWED - No WAF protection detected"
    else
        echo "🔍 RESPONSE: $RESPONSE"
    fi
done

echo -e "\n🔍 Test 5: Rate Limiting Test"
echo "Testing rate limiting (10 rapid requests)..."
RATE_LIMIT_BLOCKED=0
RATE_LIMIT_ALLOWED=0

for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/" || echo "ERROR")
    if [ "$RESPONSE" = "429" ] || [ "$RESPONSE" = "403" ]; then
        ((RATE_LIMIT_BLOCKED++))
    elif [ "$RESPONSE" = "200" ]; then
        ((RATE_LIMIT_ALLOWED++))
    fi
    sleep 0.1
done

echo "Rate limit test results:"
echo "Allowed requests: $RATE_LIMIT_ALLOWED"
echo "Blocked requests: $RATE_LIMIT_BLOCKED"

if [ "$RATE_LIMIT_BLOCKED" -gt 0 ]; then
    echo "✅ Rate limiting active"
else
    echo "⚠️ No rate limiting detected"
fi

echo -e "\n=== SECURITY SCAN SUMMARY ==="
echo "<REDACTED_CREDENTIAL>====="
echo "Target: $TARGET_URL"
echo "Scan Date: $(date)"
echo ""

# Generate summary
TOTAL_TESTS=0
BLOCKED_TESTS=0

# Count SQL injection blocks
for payload in "${SQL_PAYLOADS[@]}"; do
    ((TOTAL_TESTS++))
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/?id=$payload" 2>/dev/null || echo "ERROR")
    [ "$RESPONSE" = "403" ] && ((BLOCKED_TESTS++))
done

# Count XSS blocks
for payload in "${XSS_PAYLOADS[@]}"; do
    ((TOTAL_TESTS++))
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/?search=$payload" 2>/dev/null || echo "ERROR")
    [ "$RESPONSE" = "403" ] && ((BLOCKED_TESTS++))
done

# Count path traversal blocks
for payload in "${PATH_PAYLOADS[@]}"; do
    ((TOTAL_TESTS++))
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/$payload" 2>/dev/null || echo "ERROR")
    [ "$RESPONSE" = "403" ] && ((BLOCKED_TESTS++))
done

# Count command injection blocks
for payload in "${CMD_PAYLOADS[@]}"; do
    ((TOTAL_TESTS++))
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/?cmd=$payload" 2>/dev/null || echo "ERROR")
    [ "$RESPONSE" = "403" ] && ((BLOCKED_TESTS++))
done

BLOCK_PERCENTAGE=$((BLOCKED_TESTS * 100 / TOTAL_TESTS))

echo "📊 Security Test Results:"
echo "   Total vulnerability tests: $TOTAL_TESTS"
echo "   Blocked by security: $BLOCKED_TESTS"
echo "   Block rate: $BLOCK_PERCENTAGE%"
echo ""

if [ "$BLOCKED_TESTS" -eq 0 ]; then
    echo "🚨 SECURITY STATUS: UNPROTECTED"
    echo "   No WAF protection detected"
    echo "   All malicious payloads were allowed"
    echo "   Recommendation: Associate WAF with CloudFront"
elif [ "$BLOCK_PERCENTAGE" -lt 50 ]; then
    echo "⚠️ SECURITY STATUS: PARTIALLY PROTECTED"
    echo "   Some protection detected but not comprehensive"
    echo "   Recommendation: Review and enhance WAF rules"
elif [ "$BLOCK_PERCENTAGE" -ge 80 ]; then
    echo "✅ SECURITY STATUS: WELL PROTECTED"
    echo "   Strong WAF protection detected"
    echo "   Most malicious payloads blocked"
else
    echo "🔍 SECURITY STATUS: MODERATELY PROTECTED"
    echo "   Moderate protection detected"
    echo "   Some vulnerabilities may exist"
fi

echo ""
echo "📁 Detailed results saved to: $SCAN_RESULTS_DIR/"
echo "<REDACTED_CREDENTIAL>====="
