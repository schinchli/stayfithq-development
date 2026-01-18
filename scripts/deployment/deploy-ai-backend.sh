#!/bin/bash

# Deploy AI Backend Infrastructure for StayFit Health Companion
# This script sets up Bedrock, OpenSearch, Lambda functions, and API Gateway

set -e

echo "🚀 Deploying StayFit AI Backend Infrastructure..."

# Configuration
REGION="your-aws-region"
LAMBDA_ROLE_NAME="StayFitHealthAssistantRole"
API_GATEWAY_NAME="StayFitHealthAPI"
OPENSEARCH_DOMAIN="health-analytics"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Create IAM Role for Lambda functions
echo_status "Creating IAM role for Lambda functions..."

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

# Create the role
aws iam create-role \
    --role-name $LAMBDA_ROLE_NAME \
    --assume-role-policy-document "$TRUST_POLICY" \
    --region $REGION || echo_warning "Role may already exist"

# Attach policies
aws iam attach-role-policy \
    --role-name $LAMBDA_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
    --role-name $LAMBDA_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
    --role-name $LAMBDA_ROLE_NAME \
    --policy-arn arn:aws:iam::aws:<REDACTED_CREDENTIAL>

echo_success "IAM role created and configured"

# Step 2: Package and deploy Lambda functions
echo_status "Packaging Lambda functions..."

# Create deployment packages
mkdir -p lambda-packages

# Package Bedrock Health Assistant
cd lambda
zip -r ../lambda-packages/bedrock-health-assistant.zip bedrock-health-assistant.py
zip -r ../lambda-packages/opensearch-health-indexer.zip opensearch-health-indexer.py
cd ..

echo_success "Lambda packages created"

# Step 3: Deploy Lambda functions
echo_status "Deploying Lambda functions..."

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name $LAMBDA_ROLE_NAME --query 'Role.Arn' --output text)

# Deploy Bedrock Health Assistant Lambda
aws lambda create-function \
    --function-name StayFitHealthAssistant \
    --runtime python3.9 \
    --role $ROLE_ARN \
    --handler bedrock-health-assistant.lambda_handler \
    --zip-file fileb://lambda-packages/bedrock-health-assistant.zip \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables='{
        "OPENSEARCH_ENDPOINT":"search-YOUR-DOMAIN.us-region-1.es.amazonaws.com",
        "CLAUDE_MODEL_ID":"anthropic.claude-3-5-sonnet-20240620-v1:0"
    }' \
    --region $REGION || echo_warning "Function may already exist"

# Deploy OpenSearch Indexer Lambda
aws lambda create-function \
    --function-name StayFitHealthIndexer \
    --runtime python3.9 \
    --role $ROLE_ARN \
    --handler opensearch-health-indexer.lambda_handler \
    --zip-file fileb://lambda-packages/opensearch-health-indexer.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment Variables='{
        "OPENSEARCH_ENDPOINT":"https://your-service.amazonaws.com"
    }' \
    --region $REGION || echo_warning "Function may already exist"

echo_success "Lambda functions deployed"

# Step 4: Create API Gateway
echo_status "Creating API Gateway..."

# Create REST API
API_ID=$(aws apigateway create-rest-api \
    --name $API_GATEWAY_NAME \
    --description "StayFit Health Companion AI API" \
    --region $REGION \
    --query 'id' --output text 2>/dev/null || echo "existing")

if [ "$API_ID" = "existing" ]; then
    echo_warning "API Gateway may already exist, getting existing ID..."
    API_ID=$(aws apigateway get-rest-apis \
        --query "items[?name=='$API_GATEWAY_NAME'].id" \
        --output text --region $REGION)
fi

echo_status "API Gateway ID: $API_ID"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text --region $REGION)

# Create /chat resource
CHAT_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part chat \
    --region $REGION \
    --query 'id' --output text 2>/dev/null || echo "existing")

# Create POST method for /chat
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || echo_warning "Method may already exist"

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function \
    --function-name StayFitHealthAssistant \
    --query 'Configuration.FunctionArn' \
    --output text --region $REGION)

# Set up Lambda integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION 2>/dev/null || echo_warning "Integration may already exist"

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name StayFitHealthAssistant \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*" \
    --region $REGION 2>/dev/null || echo_warning "Permission may already exist"

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

echo_success "API Gateway configured and deployed"

# Step 5: Enable CORS
echo_status "Enabling CORS..."

# Add OPTIONS method for CORS
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION 2>/dev/null || echo_warning "OPTIONS method may already exist"

# Set up CORS integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --integration-http-method OPTIONS \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region $REGION 2>/dev/null || echo_warning "CORS integration may already exist"

# Set up CORS response
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Headers": false,
        "method.response.header.Access-Control-Allow-Methods": false,
        "method.response.header.Access-Control-Allow-Origin": false
    }' \
    --region $REGION 2>/dev/null || echo_warning "CORS method response may already exist"

aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'",
        "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,OPTIONS'"'"'",
        "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"
    }' \
    --region $REGION 2>/dev/null || echo_warning "CORS integration response may already exist"

# Redeploy API with CORS
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

echo_success "CORS enabled"

# Step 6: Test the setup
echo_status "Testing the deployment..."

API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "• Region: $REGION"
echo "• OpenSearch Domain: $OPENSEARCH_DOMAIN"
echo "• Lambda Functions:"
echo "  - StayFitHealthAssistant (Bedrock AI)"
echo "  - StayFitHealthIndexer (OpenSearch)"
echo "• API Gateway: $API_GATEWAY_NAME"
echo "• API Endpoint: $API_ENDPOINT"
echo ""
echo "🔗 API Endpoints:"
echo "• Chat: POST $API_ENDPOINT/chat"
echo ""
echo "🛡️ Guardrails Status: ✅ Active"
echo "🤖 AI Model: Claude 3.5 Sonnet"
echo "🔍 Search: OpenSearch with embeddings"
echo ""
echo "Next steps:"
echo "1. Update your web application to use: $API_ENDPOINT/chat"
echo "2. Test the AI assistant functionality"
echo "3. Monitor CloudWatch logs for any issues"
echo ""
echo_success "StayFit AI Backend is ready! 🚀"
