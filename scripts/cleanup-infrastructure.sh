#!/bin/bash

# StayFitHQ Infrastructure Cleanup Script
# This script removes all AWS resources to avoid ongoing charges

set -e

echo "🧹 StayFitHQ Infrastructure Cleanup"
echo "===================================="
echo ""
echo "This will delete:"
echo "  - CloudFront Distribution (E2XS425B7TX1I3)"
echo "  - S3 Bucket (stayfithq-web-prod-1768699805)"
echo "  - Lambda Function (stayfit-edge-auth-prod)"
echo "  - IAM Role (stayfit-lambda-edge-role-prod)"
echo "  - Cognito User Pool (if exists)"
echo "  - DynamoDB Table (if exists)"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# 1. Delete S3 Bucket
echo "📦 Deleting S3 bucket..."
BUCKET_NAME="stayfithq-web-prod-1768699805"

if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo "Emptying bucket..."
    aws s3 rm s3://$BUCKET_NAME/ --recursive
    
    echo "Deleting bucket..."
    aws s3api delete-bucket --bucket $BUCKET_NAME --region us-east-1
    echo "✅ S3 bucket deleted"
else
    echo "⚠️  S3 bucket not found or already deleted"
fi

# 2. Delete Lambda Function
echo ""
echo "⚡ Deleting Lambda function..."
FUNCTION_NAME="stayfit-edge-auth-prod"

if aws lambda get-function --function-name $FUNCTION_NAME --region us-east-1 2>/dev/null; then
    aws lambda delete-function --function-name $FUNCTION_NAME --region us-east-1
    echo "✅ Lambda function deleted"
else
    echo "⚠️  Lambda function not found or already deleted"
fi

# 3. Delete IAM Role
echo ""
echo "🔐 Deleting IAM role..."
ROLE_NAME="stayfit-lambda-edge-role-prod"

if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "Detaching policies..."
    aws iam list-attached-role-policies --role-name $ROLE_NAME \
        --query 'AttachedPolicies[].PolicyArn' --output text | \
        xargs -I {} aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn {} 2>/dev/null || true
    
    echo "Deleting role..."
    aws iam delete-role --role-name $ROLE_NAME
    echo "✅ IAM role deleted"
else
    echo "⚠️  IAM role not found or already deleted"
fi

# 4. Delete Cognito User Pool (if exists)
echo ""
echo "👤 Checking for Cognito User Pool..."
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 \
    --query 'UserPools[?Name==`stayfithq-users`].Id' --output text 2>/dev/null || echo "")

if [ ! -z "$USER_POOL_ID" ]; then
    echo "Deleting Cognito User Pool: $USER_POOL_ID"
    aws cognito-idp delete-user-pool --user-pool-id $USER_POOL_ID
    echo "✅ Cognito User Pool deleted"
else
    echo "⚠️  No Cognito User Pool found"
fi

# 5. Delete DynamoDB Table (if exists)
echo ""
echo "💾 Checking for DynamoDB table..."
TABLE_NAME="stayfithq-settings"

if aws dynamodb describe-table --table-name $TABLE_NAME --region us-east-1 2>/dev/null; then
    echo "Deleting DynamoDB table: $TABLE_NAME"
    aws dynamodb delete-table --table-name $TABLE_NAME --region us-east-1
    echo "✅ DynamoDB table deleted"
else
    echo "⚠️  No DynamoDB table found"
fi

# 6. CloudFront Distribution (manual step required)
echo ""
echo "☁️  CloudFront Distribution:"
echo "⚠️  CloudFront deletion requires manual steps:"
echo ""
echo "1. Disable the distribution:"
echo "   aws cloudfront get-distribution-config --id E2XS425B7TX1I3 > /tmp/cf-config.json"
echo "   # Edit /tmp/cf-config.json and set 'Enabled': false"
echo "   aws cloudfront update-distribution --id E2XS425B7TX1I3 --distribution-config file:///tmp/cf-config.json --if-match ETAG"
echo ""
echo "2. Wait for deployment (15-20 minutes):"
echo "   aws cloudfront wait distribution-deployed --id E2XS425B7TX1I3"
echo ""
echo "3. Delete the distribution:"
echo "   aws cloudfront delete-distribution --id E2XS425B7TX1I3 --if-match NEW_ETAG"
echo ""
echo "Or use AWS Console: CloudFront → Distributions → E2XS425B7TX1I3 → Disable → Delete"

echo ""
echo "🎉 Cleanup Complete!"
echo ""
echo "Deleted:"
echo "  ✅ S3 Bucket"
echo "  ✅ Lambda Function"
echo "  ✅ IAM Role"
echo "  ✅ Cognito User Pool (if existed)"
echo "  ✅ DynamoDB Table (if existed)"
echo ""
echo "Manual action required:"
echo "  ⚠️  CloudFront Distribution (see instructions above)"
echo ""
echo "After CloudFront deletion: $0.00/month"
echo ""
echo "Verify cleanup:"
echo "  aws s3 ls | grep stayfithq"
echo "  aws lambda list-functions | grep stayfit"
echo "  aws cloudfront list-distributions"
