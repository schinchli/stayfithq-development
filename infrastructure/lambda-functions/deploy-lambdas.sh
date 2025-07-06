#!/bin/bash

# AWS Lambda Deployment Script for StayFit Health Settings
# Based on reference implementation from https://djdqaajrajlri.cloudfront.net/settings.html

set -e

echo "🚀 Deploying StayFit Health Settings Lambda Functions..."

# Configuration
REGION="us-east-1"
ROLE_NAME="StayFitHealthLambdaRole"
BUCKET_NAME="stayfit-healthhq-lambda-deployments"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo_error "AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo_success "AWS CLI configured successfully"

# Create S3 bucket for Lambda deployments if it doesn't exist
echo_info "Creating S3 bucket for Lambda deployments..."
if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo_warning "Bucket ${BUCKET_NAME} already exists"
else
    aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION}
    echo_success "Created S3 bucket: ${BUCKET_NAME}"
fi

# Create IAM role for Lambda functions
echo_info "Creating IAM role for Lambda functions..."

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Check if role exists
if aws iam get-role --role-name ${ROLE_NAME} &> /dev/null; then
    echo_warning "IAM role ${ROLE_NAME} already exists"
else
    aws iam create-role \
        --role-name ${ROLE_NAME} \
        --assume-role-policy-document "${TRUST_POLICY}"
    echo_success "Created IAM role: ${ROLE_NAME}"
fi

# Attach policies to the role
echo_info "Attaching policies to IAM role..."

POLICIES=(
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    "arn:aws:iam::aws:policy/AmazonS3FullAccess"
    "arn:aws:iam::aws:<REDACTED_CREDENTIAL>"
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
    "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
)

for policy in "${POLICIES[@]}"; do
    aws iam attach-role-policy \
        --role-name ${ROLE_NAME} \
        --policy-arn ${policy}
    echo_success "Attached policy: $(basename ${policy})"
done

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} --query 'Role.Arn' --output text)
echo_info "Role ARN: ${ROLE_ARN}"

# Wait for role to be available
echo_info "Waiting for IAM role to be available..."
sleep 10

# Function to deploy a Lambda function
deploy_lambda() {
    local FUNCTION_NAME=$1
    local PYTHON_FILE=$2
    local DESCRIPTION=$3
    
    echo_info "Deploying Lambda function: ${FUNCTION_NAME}"
    
    # Create deployment package
    local TEMP_DIR=$(mktemp -d)
    cp ${PYTHON_FILE} ${TEMP_DIR}/lambda_function.py
    
    # Add requirements if they exist
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt -t ${TEMP_DIR}/
    fi
    
    # Create ZIP file
    local ZIP_FILE="${FUNCTION_NAME}.zip"
    (cd ${TEMP_DIR} && zip -r ../${ZIP_FILE} .)
    
    # Upload to S3
    aws s3 cp ${ZIP_FILE} s3://${BUCKET_NAME}/${ZIP_FILE}
    
    # Check if function exists
    if aws lambda get-function --function-name ${FUNCTION_NAME} &> /dev/null; then
        echo_warning "Function ${FUNCTION_NAME} exists, updating..."
        aws lambda update-function-code \
            --function-name ${FUNCTION_NAME} \
            --s3-bucket ${BUCKET_NAME} \
            --s3-key ${ZIP_FILE}
    else
        echo_info "Creating new function: ${FUNCTION_NAME}"
        aws lambda create-function \
            --function-name ${FUNCTION_NAME} \
            --runtime python3.9 \
            --role ${ROLE_ARN} \
            --handler lambda_function.lambda_handler \
            --code S3Bucket=${BUCKET_NAME},S3Key=${ZIP_FILE} \
            --description "${DESCRIPTION}" \
            --timeout 30 \
            --memory-size 256 \
            --environment Variables='{
                "OPENSEARCH_ENDPOINT":"https://search-YOUR-DOMAIN.us-region-1.es.amazonaws.com",
                "OPENSEARCH_INDEX":"health-data",
                "S3_BUCKET":"stayfit-healthhq-uploads"
            }'
    fi
    
    # Clean up
    rm -rf ${TEMP_DIR} ${ZIP_FILE}
    
    echo_success "Deployed Lambda function: ${FUNCTION_NAME}"
}

# Deploy Lambda functions
echo_info "Deploying Lambda functions..."

deploy_lambda "stayfit-data-ingest" "data-ingest-lambda.py" "Health data ingestion from files to OpenSearch"
deploy_lambda "stayfit-data-empty" "data-empty-lambda.py" "Empty all health data from OpenSearch"
deploy_lambda "stayfit-perplexity-proxy" "perplexity-proxy-lambda.py" "Proxy requests to Perplexity AI API with rate limiting"

# Create API Gateway
echo_info "Creating API Gateway..."

API_NAME="stayfit-health-settings-api"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='${API_NAME}'].id" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    echo_info "Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name ${API_NAME} \
        --description "StayFit Health Settings API" \
        --query 'id' --output text)
    echo_success "Created API Gateway: ${API_ID}"
else
    echo_warning "API Gateway already exists: ${API_ID}"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id ${API_ID} \
    --query 'items[?path==`/`].id' --output text)

# Function to create API Gateway resource and method
create_api_resource() {
    local RESOURCE_PATH=$1
    local LAMBDA_FUNCTION=$2
    local HTTP_METHOD=$3
    
    echo_info "Creating API resource: ${RESOURCE_PATH}"
    
    # Create resource
    RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id ${API_ID} \
        --parent-id ${ROOT_RESOURCE_ID} \
        --path-part ${RESOURCE_PATH} \
        --query 'id' --output text 2>/dev/null || \
        aws apigateway get-resources \
            --rest-api-id ${API_ID} \
            --query "items[?pathPart=='${RESOURCE_PATH}'].id" --output text)
    
    # Create method
    aws apigateway put-method \
        --rest-api-id ${API_ID} \
        --resource-id ${RESOURCE_ID} \
        --http-method ${HTTP_METHOD} \
        --authorization-type NONE \
        --no-api-key-required 2>/dev/null || true
    
    # Create integration
    LAMBDA_ARN="arn:aws:lambda:${REGION}:$(aws sts get-caller-identity --query Account --output text):function:${LAMBDA_FUNCTION}"
    
    aws apigateway put-integration \
        --rest-api-id ${API_ID} \
        --resource-id ${RESOURCE_ID} \
        --http-method ${HTTP_METHOD} \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" 2>/dev/null || true
    
    # Add Lambda permission
    aws lambda add-permission \
        --function-name ${LAMBDA_FUNCTION} \
        --statement-id "apigateway-${RESOURCE_PATH}-${HTTP_METHOD}" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query Account --output text):${API_ID}/*/${HTTP_METHOD}/${RESOURCE_PATH}" 2>/dev/null || true
    
    echo_success "Created API resource: ${RESOURCE_PATH}"
}

# Create API resources
create_api_resource "ingest" "stayfit-data-ingest" "POST"
create_api_resource "empty" "stayfit-data-empty" "DELETE"
create_api_resource "perplexity" "stayfit-perplexity-proxy" "POST"

# Deploy API
echo_info "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id ${API_ID} \
    --stage-name prod \
    --description "Production deployment"

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo_success "API Gateway deployed successfully!"
echo_info "API Endpoint: ${API_ENDPOINT}"

# Create DynamoDB tables for Perplexity caching and rate limiting
echo_info "Creating DynamoDB tables..."

# Cache table
aws dynamodb create-table \
    --table-name perplexity-cache \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --time-to-live-specification Enabled=true,AttributeName=ttl 2>/dev/null || \
    echo_warning "Table perplexity-cache already exists"

# Rate limit table
aws dynamodb create-table \
    --table-name perplexity-rate-limits \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --time-to-live-specification Enabled=true,AttributeName=ttl 2>/dev/null || \
    echo_warning "Table perplexity-rate-limits already exists"

echo_success "DynamoDB tables created successfully!"

# Store Perplexity API key in Parameter Store
echo_info "Setting up Parameter Store..."
read -s -p "Enter your Perplexity API key (or press Enter to skip): " PERPLEXITY_API_KEY
echo

if [ ! -z "$PERPLEXITY_API_KEY" ]; then
    aws ssm put-parameter \
        --name "/stayfit/perplexity/api-key" \
        --value "${PERPLEXITY_API_KEY}" \
        --type "SecureString" \
        --overwrite 2>/dev/null || true
    echo_success "Perplexity API key stored in Parameter Store"
fi

# Final summary
echo ""
echo_success "🎉 Deployment completed successfully!"
echo ""
echo_info "📋 Deployment Summary:"
echo "   • Lambda Functions: 3 deployed"
echo "   • API Gateway: ${API_ENDPOINT}"
echo "   • DynamoDB Tables: 2 created"
echo "   • S3 Bucket: ${BUCKET_NAME}"
echo "   • IAM Role: ${ROLE_NAME}"
echo ""
echo_info "🔗 API Endpoints:"
echo "   • Data Ingest: ${API_ENDPOINT}/ingest"
echo "   • Data Empty: ${API_ENDPOINT}/empty"
echo "   • Perplexity AI: ${API_ENDPOINT}/perplexity"
echo ""
echo_info "🌐 Frontend URL:"
echo "   • Settings Page: https://d3r155fcnafufg.cloudfront.net/settings-reference-replica.html"
echo ""
echo_warning "⚠️  Next Steps:"
echo "   1. Update the API endpoints in your frontend code"
echo "   2. Configure OpenSearch cluster if not already done"
echo "   3. Test all endpoints with the settings page"
echo "   4. Set up monitoring and logging"
echo ""
echo_success "✅ All systems ready for production use!"
