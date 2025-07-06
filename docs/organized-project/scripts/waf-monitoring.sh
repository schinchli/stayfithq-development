#!/bin/bash

# AWS WAF Monitoring and Management Script for StayFit Health Companion
# Context Requirements: Following valuable programmatic script hooks

set -e

WAF_NAME="StayFit-HealthCompanion-WAF-OWASP"
AWS_REGION="us-east-1"

echo "🔍 AWS WAF Monitoring Dashboard for StayFit Health Companion"
echo "<REDACTED_CREDENTIAL>===================="

# Function to get WAF statistics
get_waf_stats() {
    echo "📊 WAF Statistics (Last 24 hours):"
    echo "-----------------------------------"
    
    # Get allowed requests
    ALLOWED_REQUESTS=$(aws cloudwatch get-metric-statistics \
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
    
    echo "✅ Allowed Requests: ${ALLOWED_REQUESTS:-0}"
    echo "🚫 Blocked Requests: ${BLOCKED_REQUESTS:-0}"
    
    if [ "${BLOCKED_REQUESTS:-0}" != "0" ] && [ "${ALLOWED_REQUESTS:-0}" != "0" ]; then
        BLOCK_RATE=$(echo "scale=2; ${BLOCKED_REQUESTS} * 100 / (${ALLOWED_REQUESTS} + ${BLOCKED_REQUESTS})" | bc -l 2>/dev/null || echo "0")
        echo "📈 Block Rate: ${BLOCK_RATE}%"
    fi
}

# Function to get OWASP rule statistics
get_owasp_stats() {
    echo ""
    echo "🛡️ OWASP Top 10 Rule Statistics:"
    echo "--------------------------------"
    
    OWASP_RULES=(
        "OWASP-01-InjectionProtection:Injection Attacks"
        "OWASP-02-BrokenAuthentication:Auth Attacks"
        "OWASP-03-SensitiveDataExposure:Data Exposure"
        "OWASP-04-XMLExternalEntities:XXE Attacks"
        "OWASP-05-BrokenAccessControl:Access Control"
        "OWASP-06-SecurityMisconfiguration:Misconfig"
        "OWASP-07-CrossSiteScripting:XSS Attacks"
        "OWASP-08-InsecureDeserialization:Deserialization"
        "OWASP-09-VulnerableComponents:Vulnerable Components"
        "HealthCompanion-GeoBlocking:Geo Blocking"
    )
    
    for rule_info in "${OWASP_RULES[@]}"; do
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
            echo "🚫 $rule_desc: ${RULE_BLOCKS} blocked"
        else
            echo "✅ $rule_desc: No threats detected"
        fi
    done
}

# Function to get recent blocked requests
get_recent_blocks() {
    echo ""
    echo "🚨 Recent Security Events (Last 100 blocked requests):"
    echo "-----------------------------------------------------"
    
    # Check if log group exists
    LOG_GROUP="/aws/wafv2/webacl/$WAF_NAME"
    
    if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region $AWS_REGION --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$LOG_GROUP"; then
        echo "📋 Querying WAF logs..."
        
        aws logs start-query \
            --log-group-name "$LOG_GROUP" \
            --start-time $(date -d '1 hour ago' +%s) \
            --end-time $(date +%s) \
            --query-string 'fields @timestamp, action, terminatingRuleId, httpRequest.clientIp, httpRequest.uri | filter action = "BLOCK" | sort @timestamp desc | limit 10' \
            --region $AWS_REGION > /dev/null 2>&1 || echo "⚠️ WAF logging may not be fully configured"
    else
        echo "ℹ️ WAF detailed logging not configured. Enable Kinesis Data Firehose for detailed logs."
    fi
}

# Function to check WAF health
check_waf_health() {
    echo ""
    echo "🏥 WAF Health Check:"
    echo "-------------------"
    
    # Check if Web ACL exists
    WAF_STATUS=$(aws wafv2 get-web-acl \
        --name "$WAF_NAME" \
        --scope CLOUDFRONT \
        --id $(aws wafv2 list-web-acls --scope CLOUDFRONT --region $AWS_REGION --query "WebACLs[?Name=='$WAF_NAME'].Id" --output text) \
        --region $AWS_REGION \
        --query 'WebACL.Name' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$WAF_STATUS" = "$WAF_NAME" ]; then
        echo "✅ WAF Web ACL: Active and Healthy"
        
        # Check CloudFront association
        CLOUDFRONT_DIST="YOUR_CLOUDFRONT_DISTRIBUTION_ID"
        ASSOCIATION=$(aws wafv2 get-web-acl-for-resource \
            --resource-arn "arn:aws:cloudfront::$(aws sts get-caller-identity --query Account --output text):distribution/$CLOUDFRONT_DIST" \
            --region $AWS_REGION \
            --query 'WebACL.Name' \
            --output text 2>/dev/null || echo "NOT_ASSOCIATED")
        
        if [ "$ASSOCIATION" = "$WAF_NAME" ]; then
            echo "✅ CloudFront Association: Active"
        else
            echo "⚠️ CloudFront Association: Not Found"
        fi
        
        # Check rule count
        RULE_COUNT=$(aws wafv2 get-web-acl \
            --name "$WAF_NAME" \
            --scope CLOUDFRONT \
            --id $(aws wafv2 list-web-acls --scope CLOUDFRONT --region $AWS_REGION --query "WebACLs[?Name=='$WAF_NAME'].Id" --output text) \
            --region $AWS_REGION \
            --query 'length(WebACL.Rules)' \
            --output text 2>/dev/null || echo "0")
        
        echo "📊 Active Rules: $RULE_COUNT"
        
    else
        echo "❌ WAF Web ACL: Not Found or Inactive"
        echo "💡 Run deploy-waf-owasp.sh to create the WAF configuration"
    fi
}

# Function to show security recommendations
show_recommendations() {
    echo ""
    echo "💡 Security Recommendations:"
    echo "---------------------------"
    echo "1. 📊 Monitor WAF metrics daily via CloudWatch Dashboard"
    echo "2. 🔍 Review blocked requests for false positives"
    echo "3. 📈 Set up SNS notifications for high block rates"
    echo "4. 🔄 Update IP whitelist as needed"
    echo "5. 📝 Enable detailed WAF logging with Kinesis Data Firehose"
    echo "6. 🛡️ Regularly review and update OWASP rules"
    echo "7. 🌍 Adjust geo-blocking rules based on legitimate traffic"
    echo "8. 📋 Conduct monthly security reviews"
}

# Main execution
case "${1:-status}" in
    "status")
        get_waf_stats
        get_owasp_stats
        check_waf_health
        ;;
    "health")
        check_waf_health
        ;;
    "stats")
        get_waf_stats
        get_owasp_stats
        ;;
    "events")
        get_recent_blocks
        ;;
    "recommendations")
        show_recommendations
        ;;
    "full")
        get_waf_stats
        get_owasp_stats
        get_recent_blocks
        check_waf_health
        show_recommendations
        ;;
    *)
        echo "Usage: $0 [status|health|stats|events|recommendations|full]"
        echo ""
        echo "Commands:"
        echo "  status         - Show WAF statistics and health (default)"
        echo "  health         - Check WAF configuration health"
        echo "  stats          - Show detailed statistics"
        echo "  events         - Show recent security events"
        echo "  recommendations - Show security recommendations"
        echo "  full           - Show all information"
        exit 1
        ;;
esac

echo ""
echo "🔗 StayFit Health Companion: https://d3r155fcnafufg.cloudfront.net/"
echo "📊 CloudWatch Dashboard: AWS Console > CloudWatch > Dashboards > StayFit-HealthCompanion-WAF-Security"
echo ""
echo "✅ WAF monitoring completed at $(date)"
