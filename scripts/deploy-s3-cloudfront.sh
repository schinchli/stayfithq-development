#!/bin/bash

# StayFit Health Companion - S3 + CloudFront + Lambda@Edge Deployment
# Deploys web application with authentication protection

set -e

# Configuration
PROJECT_NAME="stayfit-health-companion"
ENVIRONMENT=${1:-prod}
AWS_REGION=${2:-us-east-1}
BUCKET_NAME="stayfit-healthhq-web-${ENVIRONMENT}"
CLOUDFRONT_COMMENT="StayFit Health Companion - ${ENVIRONMENT}"

# Authentication credentials
AUTH_username = "your_username"AUTH_password = "your_secure_password"echo "🚀 StayFit Health Companion - S3 + CloudFront Deployment"
echo "<REDACTED_CREDENTIAL>================"
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "S3 Bucket: $BUCKET_NAME"
echo "Auth Username: $AUTH_USERNAME"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Step 1: Create S3 Bucket
echo ""
echo "🪣 Step 1: Creating S3 Bucket..."

# Check if bucket exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ S3 bucket $BUCKET_NAME already exists"
else
    echo "Creating S3 bucket: $BUCKET_NAME"
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    echo "✅ S3 bucket created successfully"
fi

# Configure bucket for static website hosting
echo "Configuring bucket for static website hosting..."
aws s3api put-bucket-website --bucket "$BUCKET_NAME" --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
}'

# Block public access (we'll use CloudFront)
aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "✅ S3 bucket configured for static website hosting"

# Step 2: Create Lambda@Edge function for authentication
echo ""
echo "🔐 Step 2: Creating Lambda@Edge Authentication Function..."

# Create Lambda function directory
mkdir -p lambda-edge-auth
cd lambda-edge-auth

# Create the authentication function
cat > index.js << 'EOF'
'use strict';

const AUTH_username = "your_username";
const AUTH_password = "your_secure_password";

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    
    // Check if authorization header exists
    const authHeader = headers.authorization && headers.authorization[0] ? headers.authorization[0].value : '';
    
    if (!authHeader) {
        return requireAuth(callback);
    }
    
    // Parse Basic Auth
    const encoded = authHeader.split(' ')[1];
    if (!encoded) {
        return requireAuth(callback);
    }
    
    const decoded = Buffer.from(encoded, 'base64').toString();
    const [username, password] = decoded.split(':');
    
    // Validate credentials
    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
        // Authentication successful, continue with request
        callback(null, request);
    } else {
        return requireAuth(callback);
    }
};

function requireAuth(callback) {
    const response = {
        status: '401',
        statusDescription: 'Unauthorized',
        headers: {
            'www-authenticate': [{
                key: 'WWW-Authenticate',
                value: 'Basic realm="StayFit Health Companion"'
            }],
            'content-type': [{
                key: 'Content-Type',
                value: 'text/html'
            }]
        },
        body: `
<!DOCTYPE html>
<html>
<head>
    <title>StayFit Health Companion - Authentication Required</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { color: #007bff; font-size: 2rem; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .credentials { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏥 StayFit Health Companion</div>
        <h1>Authentication Required</h1>
        <p>This is a secure health management platform. Please enter your credentials to access the application.</p>
        <div class="credentials">
            <strong>Demo Credentials:</strong><br>
            username = "your_username"<br>
            password = "your_secure_password"</div>
        <p><small>Your health data is protected with enterprise-grade security.</small></p>
    </div>
</body>
</html>
        `
    };
    callback(null, response);
}
EOF

# Create package.json for Lambda function
cat > package.json << EOF
{
  "name": "stayfit-lambda-edge-auth",
  "version": "1.0.0",
  "description": "Lambda@Edge authentication for StayFit Health Companion",
  "main": "index.js",
  "engines": {
    "node": "18.x"
  }
}
EOF

# Create deployment package
zip -r lambda-auth.zip index.js package.json

# Create Lambda function
LAMBDA_FUNCTION_NAME="stayfit-edge-auth-${ENVIRONMENT}"
LAMBDA_ROLE_NAME="stayfit-lambda-edge-role-${ENVIRONMENT}"

# Create IAM role for Lambda@Edge
echo "Creating IAM role for Lambda@Edge..."
aws iam create-role --role-name "$LAMBDA_ROLE_NAME" --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "lambda.amazonaws.com",
                    "edgelambda.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}' || echo "Role may already exist"

# Attach basic execution policy
aws iam attach-role-policy --role-name "$LAMBDA_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" || true

# Get role ARN
LAMBDA_ROLE_ARN=$(aws iam get-role --role-name "$LAMBDA_ROLE_NAME" --query 'Role.Arn' --output text)

# Wait for role to be ready
echo "Waiting for IAM role to be ready..."
sleep 10

# Create Lambda function in us-east-1 (required for Lambda@Edge)
echo "Creating Lambda@Edge function..."
aws lambda create-function \
    --region us-east-1 \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --runtime nodejs18.x \
    --role "$LAMBDA_ROLE_ARN" \
    --handler index.handler \
    --zip-file fileb://lambda-auth.zip \
    --description "Authentication for StayFit Health Companion" \
    --timeout 5 \
    --memory-size 128 || echo "Function may already exist"

# Publish version for Lambda@Edge
echo "Publishing Lambda function version..."
LAMBDA_VERSION=$(aws lambda publish-version \
    --region us-east-1 \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --query 'Version' --output text)

LAMBDA_ARN="arn:aws:lambda:us-east-1:$(aws sts get-caller-identity --query Account --output text):function:${LAMBDA_FUNCTION_NAME}:${LAMBDA_VERSION}"

echo "✅ Lambda@Edge function created: $LAMBDA_ARN"

cd ..

# Step 3: Upload web files to S3
echo ""
echo "📁 Step 3: Uploading web files to S3..."

# Sync web directory to S3
aws s3 sync web/ s3://"$BUCKET_NAME"/ \
    --exclude "*.md" \
    --exclude "server.js" \
    --exclude "settings-server.js" \
    --exclude "node_modules/*" \
    --cache-control "public, max-age=86400" \
    --metadata-directive REPLACE

# Set specific cache headers for HTML files
aws s3 cp s3://"$BUCKET_NAME"/index.html s3://"$BUCKET_NAME"/index.html \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE

echo "✅ Web files uploaded to S3"

# Step 4: Create CloudFront Origin Access Control
echo ""
echo "🌐 Step 4: Creating CloudFront Distribution..."

# Create Origin Access Control
OAC_NAME="stayfit-oac-${ENVIRONMENT}"
OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
        "Name": "'$OAC_NAME'",
        "Description": "OAC for StayFit Health Companion",
        "OriginAccessControlOriginType": "s3",
        "SigningBehavior": "always",
        "SigningProtocol": "sigv4"
    }' --query 'OriginAccessControl.Id' --output text 2>/dev/null || \
    aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id" --output text)

echo "Origin Access Control ID: $OAC_ID"

# Create CloudFront distribution configuration
cat > cloudfront-config.json << EOF
{
    "CallerReference": "stayfit-${ENVIRONMENT}-$(date +%s)",
    "Comment": "$CLOUDFRONT_COMMENT",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "$OAC_ID"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
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
                    "LambdaFunctionARN": "$LAMBDA_ARN",
                    "EventType": "viewer-request",
                    "IncludeBody": false
                }
            ]
        }
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100",
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    }
}
EOF

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json \
    --query 'Distribution.Id' --output text)

echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"

# Get distribution domain name
DISTRIBUTION_DOMAIN=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' --output text)

echo "✅ CloudFront domain: $DISTRIBUTION_DOMAIN"

# Step 5: Update S3 bucket policy for CloudFront OAC
echo ""
echo "🔒 Step 5: Updating S3 bucket policy..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DISTRIBUTION_ID"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json

echo "✅ S3 bucket policy updated for CloudFront access"

# Step 6: Wait for distribution deployment
echo ""
echo "⏳ Step 6: Waiting for CloudFront distribution deployment..."
echo "This may take 10-15 minutes..."

aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

echo "✅ CloudFront distribution deployed successfully"

# Cleanup temporary files
rm -f cloudfront-config.json bucket-policy.json
rm -rf lambda-edge-auth

# Step 7: Display deployment information
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📊 Deployment Summary:"
echo "  S3 Bucket: $BUCKET_NAME"
echo "  CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "  CloudFront Domain: $DISTRIBUTION_DOMAIN"
echo "  Lambda@Edge Function: $LAMBDA_FUNCTION_NAME:$LAMBDA_VERSION"
echo ""
echo "🔐 Authentication Details:"
echo "  Username: $AUTH_USERNAME"
echo "  password = "your_secure_password"echo ""
echo "🌐 Access URLs:"
echo "  Primary: https://$DISTRIBUTION_DOMAIN"
echo "  Direct S3 (blocked): https://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
echo ""
echo "📝 Next Steps:"
echo "  1. Test the application at: https://$DISTRIBUTION_DOMAIN"
echo "  2. Verify authentication is working"
echo "  3. Check all pages load correctly"
echo "  4. Monitor CloudWatch logs for any issues"
echo ""
echo "✅ StayFit Health Companion is now live and secured!"
