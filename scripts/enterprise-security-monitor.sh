#!/bin/bash

# Enterprise Security Monitoring Script for StayFit Health Companion
# Comprehensive security monitoring and reporting

set -e

WAF_NAME="StayFit-Enterprise-WAF-Security"
CLOUDFRONT_DIST_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"
AWS_REGION="us-east-1"

echo "🏢 ENTERPRISE SECURITY MONITORING - STAYFIT HEALTH COMPANION"
echo "<REDACTED_CREDENTIAL>==================="

# Function to get enterprise security metrics
get_enterprise_metrics() {
    echo "📊 Enterprise Security Metrics (Last 24 hours):"
    echo "-----------------------------------------------"
    
    # Get total requests
    TOTAL_REQUESTS=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/WAFV2 \
        --metric-name AllowedRequests \
        --dimensions Name=WebACL,Value="$WAF_NAME" Name=Region,Value=CloudFront Name=Rule,Value=ALL \
        --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 86400 \
        --statistics Sum \
        --region $AWS_REGION \
        --query 'Datapoints[0].Sum' \
        --output text 2>/dev/null || echo "0")
    
    # Get blocked requests
    BLOCKED_REQUESTS=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/WAFV2 \
        --metric-name BlockedRequests \
        --dimensions Name=WebACL,Value="$WAF_NAME" Name=Region,Value=CloudFront Name=Rule,Value=ALL \
        --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 86400 \
        --statistics Sum \
        --region $AWS_REGION \
        --query 'Datapoints[0].Sum' \
        --output text 2>/dev/null || echo "0")
    
    echo "✅ Total Allowed Requests: ${TOTAL_REQUESTS:-0}"
    echo "🚫 Total Blocked Requests: ${BLOCKED_REQUESTS:-0}"
    
    if [ "${BLOCKED_REQUESTS:-0}" != "0" ] && [ "${TOTAL_REQUESTS:-0}" != "0" ]; then
        TOTAL_ALL_REQUESTS=$((${TOTAL_REQUESTS:-0} + ${BLOCKED_REQUESTS:-0}))
        BLOCK_RATE=$(echo "scale=2; ${BLOCKED_REQUESTS} * 100 / ${TOTAL_ALL_REQUESTS}" | bc -l 2>/dev/null || echo "0")
        echo "📈 Enterprise Block Rate: ${BLOCK_RATE}%"
        
        if (( $(echo "${BLOCK_RATE} > 10" | bc -l) )); then
            echo "🚨 HIGH SECURITY ACTIVITY DETECTED"
        elif (( $(echo "${BLOCK_RATE} > 5" | bc -l) )); then
            echo "⚠️ MODERATE SECURITY ACTIVITY"
        else
            echo "✅ NORMAL SECURITY ACTIVITY"
        fi
    fi
}

# Function to get enterprise rule statistics
get_enterprise_rule_stats() {
    echo ""
    echo "🛡️ Enterprise Security Rules Performance:"
    echo "----------------------------------------"
    
    ENTERPRISE_RULES=(
        "Enterprise-OWASP-Core-Rules:OWASP Core Protection"
        "Enterprise-Known-Bad-Inputs:Known Bad Inputs"
        "Enterprise-SQL-Injection-Protection:SQL Injection Shield"
        "Enterprise-Authentication-Rate-Limit:Auth Rate Limiting"
        "Enterprise-Geographic-Blocking:Geo Blocking"
        "Enterprise-IP-Reputation:IP Reputation Filter"
    )
    
    for rule_info in "${ENTERPRISE_RULES[@]}"; do
        IFS=':' read -r rule_name rule_desc <<< "$rule_info"
        
        RULE_BLOCKS=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/WAFV2 \
            --metric-name BlockedRequests \
            --dimensions Name=WebACL,Value="$WAF_NAME" Name=Region,Value=CloudFront Name=Rule,Value="$rule_name" \
            --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 86400 \
            --statistics Sum \
            --region $AWS_REGION \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        
        if [ "${RULE_BLOCKS:-0}" != "0" ]; then
            echo "🚫 $rule_desc: ${RULE_BLOCKS} threats blocked"
        else
            echo "✅ $rule_desc: No threats detected"
        fi
    done
}

# Function to check enterprise security health
check_enterprise_health() {
    echo ""
    echo "🏥 Enterprise Security Health Check:"
    echo "-----------------------------------"
    
    # Check if Enterprise WAF exists
    ENTERPRISE_WAF_STATUS=$(aws wafv2 list-web-acls \
        --scope CLOUDFRONT \
        --region $AWS_REGION \
        --query "WebACLs[?Name=='$WAF_NAME'].Name" \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$ENTERPRISE_WAF_STATUS" = "$WAF_NAME" ]; then
        echo "✅ Enterprise WAF: Active and Healthy"
        
        # Check CloudFront association
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        CLOUDFRONT_ARN="arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${CLOUDFRONT_DIST_ID}"
        
        ASSOCIATION=$(aws wafv2 get-web-acl-for-resource \
            --resource-arn "$CLOUDFRONT_ARN" \
            --region $AWS_REGION \
            --query 'WebACL.Name' \
            --output text 2>/dev/null || echo "NOT_ASSOCIATED")
        
        if [ "$ASSOCIATION" = "$WAF_NAME" ]; then
            echo "✅ CloudFront Association: Enterprise WAF Active"
            
            # Get rule count
            RULE_COUNT=$(aws wafv2 get-web-acl \
                --name "$WAF_NAME" \
                --scope CLOUDFRONT \
                --id $(aws wafv2 list-web-acls --scope CLOUDFRONT --region $AWS_REGION --query "WebACLs[?Name=='$WAF_NAME'].Id" --output text) \
                --region $AWS_REGION \
                --query 'length(WebACL.Rules)' \
                --output text 2>/dev/null || echo "0")
            
            echo "📊 Active Enterprise Rules: $RULE_COUNT"
            
        else
            echo "⚠️ CloudFront Association: Not Found or Different WAF"
        fi
        
    else
        echo "❌ Enterprise WAF: Not Found or Inactive"
    fi
    
    # Check Security Headers Policy
    HEADERS_POLICY=$(aws cloudfront list-response-headers-policies \
        --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='StayFit-Enterprise-Security-Headers'].ResponseHeadersPolicy.Id" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$HEADERS_POLICY" ]; then
        echo "✅ Security Headers Policy: Active ($HEADERS_POLICY)"
    else
        echo "⚠️ Security Headers Policy: Not Found"
    fi
    
    # Check SNS Security Alerts
    SNS_TOPIC=$(aws sns list-topics --region $AWS_REGION \
        --query "Topics[?contains(TopicArn, 'StayFit-Security-Alerts')].TopicArn" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$SNS_TOPIC" ]; then
        echo "✅ Security Alerts: Configured ($SNS_TOPIC)"
    else
        echo "⚠️ Security Alerts: Not Configured"
    fi
}

# Function to show security recommendations
show_enterprise_recommendations() {
    echo ""
    echo "💡 Enterprise Security Recommendations:"
    echo "--------------------------------------"
    echo "1. 📊 Monitor enterprise dashboard daily"
    echo "2. 🔍 Review blocked requests for false positives"
    echo "3. 📈 Set up SNS notifications for security alerts"
    echo "4. 🔄 Update WAF rules based on threat intelligence"
    echo "5. 📝 Conduct monthly security reviews"
    echo "6. 🛡️ Consider AWS Shield Advanced for DDoS protection"
    echo "7. 🔐 Implement additional authentication layers"
    echo "8. 📋 Regular security compliance audits"
    echo "9. 🚨 Set up automated incident response"
    echo "10. 📖 Keep security documentation updated"
}

# Function to run enterprise security scan
run_enterprise_scan() {
    echo ""
    echo "🔒 Running Enterprise Security Scan:"
    echo "-----------------------------------"
    
    if [ -f "./scripts/security-scan.sh" ]; then
        echo "Executing comprehensive security scan..."
        ./scripts/security-scan.sh
    else
        echo "⚠️ Security scan script not found"
        echo "💡 Run: ./scripts/security-scan.sh manually"
    fi
}

# Main execution
case "${1:-status}" in
    "status")
        get_enterprise_metrics
        get_enterprise_rule_stats
        check_enterprise_health
        ;;
    "health")
        check_enterprise_health
        ;;
    "metrics")
        get_enterprise_metrics
        get_enterprise_rule_stats
        ;;
    "scan")
        run_enterprise_scan
        ;;
    "recommendations")
        show_enterprise_recommendations
        ;;
    "full")
        get_enterprise_metrics
        get_enterprise_rule_stats
        check_enterprise_health
        show_enterprise_recommendations
        ;;
    *)
        echo "Usage: $0 [status|health|metrics|scan|recommendations|full]"
        echo ""
        echo "Commands:"
        echo "  status         - Show enterprise security status (default)"
        echo "  health         - Check enterprise security health"
        echo "  metrics        - Show detailed security metrics"
        echo "  scan           - Run comprehensive security scan"
        echo "  recommendations - Show security recommendations"
        echo "  full           - Show all information"
        exit 1
        ;;
esac

echo ""
echo "🔗 StayFit Health Companion: https://d3r155fcnafufg.cloudfront.net/"
echo "📊 Enterprise Dashboard: AWS Console > CloudWatch > Dashboards > StayFit-Enterprise-Security-Dashboard"
echo ""
echo "✅ Enterprise security monitoring completed at $(date)"
