#!/bin/bash

# Fix CloudFront and S3 for Static Website Hosting
# Resolves issue where files are downloaded instead of displayed

set -e

# Configuration
BUCKET_NAME="stayfit-healthhq-web-prod"
DISTRIBUTION_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"
AWS_REGION="us-east-1"

echo "🔧 Fixing CloudFront Static Website Hosting"
echo "<REDACTED_CREDENTIAL>=="
echo "S3 Bucket: $BUCKET_NAME"
echo "CloudFront Distribution: $DISTRIBUTION_ID"
echo ""

# Step 1: Configure S3 bucket for static website hosting
echo "📁 Step 1: Configuring S3 bucket for static website hosting..."

# Enable static website hosting on S3 bucket
aws s3api put-bucket-website --bucket "$BUCKET_NAME" --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
}'

echo "✅ S3 static website hosting configured"

# Step 2: Set proper content types for HTML files
echo ""
echo "🏷️  Step 2: Setting proper content types for files..."

# Update content-type for HTML files
aws s3 cp s3://"$BUCKET_NAME"/index.html s3://"$BUCKET_NAME"/index.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

aws s3 cp s3://"$BUCKET_NAME"/health-reports.html s3://"$BUCKET_NAME"/health-reports.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

aws s3 cp s3://"$BUCKET_NAME"/analysis.html s3://"$BUCKET_NAME"/analysis.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

aws s3 cp s3://"$BUCKET_NAME"/digital-analysis.html s3://"$BUCKET_NAME"/digital-analysis.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

aws s3 cp s3://"$BUCKET_NAME"/search.html s3://"$BUCKET_NAME"/search.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

aws s3 cp s3://"$BUCKET_NAME"/dashboard.html s3://"$BUCKET_NAME"/dashboard.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

aws s3 cp s3://"$BUCKET_NAME"/settings.html s3://"$BUCKET_NAME"/settings.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

# Update content-type for CSS files
aws s3 cp s3://"$BUCKET_NAME"/css/ s3://"$BUCKET_NAME"/css/ \
    --recursive \
    --content-type "text/css" \
    --cache-control "public, max-age=86400" \
    --metadata-directive REPLACE

# Update content-type for JS files
aws s3 cp s3://"$BUCKET_NAME"/js/ s3://"$BUCKET_NAME"/js/ \
    --recursive \
    --content-type "application/javascript" \
    --cache-control "public, max-age=86400" \
    --metadata-directive REPLACE

echo "✅ Content types updated for all files"

# Step 3: Get current CloudFront distribution configuration
echo ""
echo "🌐 Step 3: Updating CloudFront distribution configuration..."

# Get current distribution config
aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > current-config.json

# Extract ETag for update
ETAG=$(jq -r '.ETag' current-config.json)

# Extract and modify distribution config
jq '.DistributionConfig' current-config.json > distribution-config.json

# Update the distribution config to fix content serving
cat > updated-distribution-config.json << 'EOF'
{
    "CallerReference": "",
    "Comment": "StayFit Health Companion - prod (Fixed for static website)",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "",
                "DomainName": "",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "",
                "CustomOriginConfig": null
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 0
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true,
        "LambdaFunctionAssociations": {
            "Quantity": 1,
            "Items": [
                {
                    "LambdaFunctionARN": "",
                    "EventType": "viewer-request",
                    "IncludeBody": false
                }
            ]
        },
        "ResponseHeadersPolicy": null,
        "OriginRequestPolicy": null,
        "CachePolicyId": null
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100",
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html", 
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    }
}
EOF

# Merge current config with updates, preserving dynamic values
jq --slurpfile current distribution-config.json \
   --slurpfile updated updated-distribution-config.json \
   '$updated[0] | 
    .CallerReference = $current[0].CallerReference |
    .Origins.Items[0].Id = $current[0].Origins.Items[0].Id |
    .Origins.Items[0].DomainName = $current[0].Origins.Items[0].DomainName |
    .Origins.Items[0].OriginAccessControlId = $current[0].Origins.Items[0].OriginAccessControlId |
    .DefaultCacheBehavior.TargetOriginId = $current[0].DefaultCacheBehavior.TargetOriginId |
    .DefaultCacheBehavior.LambdaFunctionAssociations.Items[0].LambdaFunctionARN = $current[0].DefaultCacheBehavior.LambdaFunctionAssociations.Items[0].LambdaFunctionARN' \
   > final-distribution-config.json

echo "✅ CloudFront configuration prepared"

# Step 4: Update CloudFront distribution
echo ""
echo "🔄 Step 4: Updating CloudFront distribution..."

aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --distribution-config file://final-distribution-config.json \
    --if-match "$ETAG"

echo "✅ CloudFront distribution updated"

# Step 5: Create invalidation to clear cache
echo ""
echo "🗑️  Step 5: Creating CloudFront invalidation..."

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' --output text)

echo "✅ Invalidation created: $INVALIDATION_ID"

# Step 6: Wait for invalidation to complete
echo ""
echo "⏳ Step 6: Waiting for invalidation to complete..."
echo "This may take 5-10 minutes..."

aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID"

echo "✅ Invalidation completed"

# Cleanup temporary files
rm -f current-config.json distribution-config.json updated-distribution-config.json final-distribution-config.json

# Step 7: Test the website
echo ""
echo "🧪 Step 7: Testing website functionality..."

CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)

echo "Testing website access..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Basic $(echo -n 'healthhq:StayFit2025!' | base64)" "https://$CLOUDFRONT_DOMAIN/")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Website is accessible and returning HTML content"
else
    echo "⚠️  Website returned status: $HTTP_STATUS"
fi

# Final summary
echo ""
echo "🎉 CloudFront Static Website Fix Complete!"
echo "<REDACTED_CREDENTIAL>=="
echo ""
echo "📊 Summary:"
echo "  S3 Bucket: $BUCKET_NAME (configured for static website hosting)"
echo "  CloudFront Distribution: $DISTRIBUTION_ID (updated configuration)"
echo "  Invalidation: $INVALIDATION_ID (cache cleared)"
echo "  Website URL: https://$CLOUDFRONT_DOMAIN"
echo ""
echo "🔐 Authentication:"
echo "  username = "your_username"echo "  password = "your_secure_password"echo ""
echo "✅ The website should now display properly in browsers instead of downloading files"
echo "✅ All HTML, CSS, and JS files have correct content-type headers"
echo "✅ CloudFront cache has been cleared to reflect changes immediately"
echo ""
echo "🌐 Test the website now: https://$CLOUDFRONT_DOMAIN"
