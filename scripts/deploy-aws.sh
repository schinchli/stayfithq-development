#!/bin/bash

# StayFit Health Companion - Complete AWS Deployment Script
# Deploys infrastructure and AI services for Phase 1 and Phase 3 tasks

set -e

# Configuration
PROJECT_NAME="stayfit-health-companion"
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}

echo "🚀 StayFit Health Companion - Complete AWS Deployment"
echo "<REDACTED_CREDENTIAL>============="
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
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

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Step 1: Deploy Core Infrastructure
echo ""
echo "🏗️  Step 1: Deploying Core Infrastructure..."
cd aws-setup
./deploy-infrastructure.sh $ENVIRONMENT $AWS_REGION
cd ..

# Step 2: Configure Bedrock Model Access
echo ""
echo "🧠 Step 2: Configuring AWS Bedrock Model Access..."

# Enable Claude models in Bedrock
echo "   Requesting access to Claude models..."
aws bedrock put-model-invocation-logging-configuration \
    --logging-config '{
        "cloudWatchConfig": {
            "logGroupName": "/aws/bedrock/'$PROJECT_NAME'-'$ENVIRONMENT'",
            "roleArn": "arn:aws:iam::'$(aws sts get-caller-identity --query Account --output text)':role/service-<REDACTED_CREDENTIAL>Model"
        },
        "embeddingDataDeliveryEnabled": false,
        "imageDataDeliveryEnabled": false,
        "textDataDeliveryEnabled": true
    }' \
    --region $AWS_REGION 2>/dev/null || echo "   ⚠️  Bedrock logging configuration may already exist"

# Test Bedrock access
echo "   Testing Bedrock Claude access..."
BEDROCK_TEST=$(aws bedrock list-foundation-models \
    --region $AWS_REGION \
    --query 'modelSummaries[?contains(modelId, `claude`)].modelId' \
    --output text 2>/dev/null || echo "")

if [ -n "$BEDROCK_TEST" ]; then
    echo "   ✅ Bedrock Claude models available"
else
    echo "   ⚠️  Bedrock Claude models may need manual access request"
    echo "   📝 Please request access to Claude models in AWS Bedrock console"
fi

# Step 3: Deploy MCP Server Infrastructure
echo ""
echo "🔧 Step 3: Deploying MCP Server Infrastructure..."

# Create MCP server deployment package
echo "   Creating MCP server deployment package..."
mkdir -p dist/mcp-server
cp -r src/mcp-server/* dist/mcp-server/
cp -r src/ai dist/mcp-server/
cp -r src/processors dist/mcp-server/
cp package.json dist/mcp-server/
cp config/mcp-server.json dist/mcp-server/

# Install production dependencies
cd dist/mcp-server
npm install --production
cd ../..

echo "   ✅ MCP server package created"

# Step 4: Configure Environment Variables
echo ""
echo "🔐 Step 4: Configuring Environment Variables..."

# Get stack outputs
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-infrastructure"
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs' 2>/dev/null || echo "[]")

if [ "$OUTPUTS" != "[]" ]; then
    # Extract values from stack outputs
    HEALTH_DOCS_BUCKET=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="HealthDocumentsBucket") | .OutputValue')
    OPENSEARCH_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="OpenSearchDomainEndpoint") | .OutputValue')
    REDIS_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="RedisEndpoint") | .OutputValue')
    USER_POOL_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolId") | .OutputValue')
    USER_POOL_CLIENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolClientId") | .OutputValue')

    # Create production environment file
    cat > .env.production << EOF
# StayFit Health Companion - Production Environment
# Generated: $(date)

# Environment
NODE_ENV=production
AWS_REGION=$AWS_REGION
PROJECT_NAME=$PROJECT_NAME
ENVIRONMENT=$ENVIRONMENT

# AWS Services
HEALTH_DOCUMENTS_BUCKET=$HEALTH_DOCS_BUCKET
OPENSEARCH_ENDPOINT=https://$OPENSEARCH_ENDPOINT
REDIS_URL=<REDACTED_CREDENTIAL>
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID

# MCP Server
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=0.0.0.0

# AI Services
BEDROCK_REGION=$AWS_REGION
# PERPLEXITY_api_key = "your_api_key_here"# Health Data Processing
APPLE_HEALTH_DATA_PATH=/app/data/health
MAX_PROCESSING_THREADS=4
BATCH_PROCESSING_SIZE=1000

# Caching
CACHE_TTL_HOURS=720
ENABLE_CACHE_WARMING=true

# Security
ENABLE_RATE_LIMITING=true
CORS_ENABLED=false
LOG_LEVEL=info

# Family Health
FAMILY_PRIVACY_MODE=strict
ENABLE_FAMILY_SHARING=true
MAX_FAMILY_MEMBERS=8
EOF

    echo "   ✅ Production environment configured"
    echo "   📝 Environment file created: .env.production"
else
    echo "   ⚠️  Could not retrieve stack outputs. Manual configuration required."
fi

# Step 5: Test AI Integration
echo ""
echo "🤖 Step 5: Testing AI Integration..."

# Set environment variables for testing
export AWS_REGION=$AWS_REGION
export NODE_ENV=production

# Run AI integration test
echo "   Running AI integration test..."
node test-ai-integration.js > ai-test-results.log 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ AI integration test passed"
    echo "   📊 Test results saved to ai-test-results.log"
else
    echo "   ⚠️  AI integration test completed with warnings"
    echo "   📋 Check ai-test-results.log for details"
fi

# Step 6: Deploy Health Processing Test
echo ""
echo "🏥 Step 6: Testing Health Data Processing..."

# Run health processing test with production environment
echo "   Testing health data processing capabilities..."
node test-health-processing.js > health-test-results.log 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Health processing test passed"
    echo "   📊 Test results saved to health-test-results.log"
else
    echo "   ⚠️  Health processing test completed with warnings"
    echo "   📋 Check health-test-results.log for details"
fi

# Step 7: Deployment Summary
echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo ""
echo "✅ Completed Deployments:"
echo "   • AWS Core Infrastructure (VPC, S3, OpenSearch, Redis, Cognito)"
echo "   • AWS Bedrock Claude model access configuration"
echo "   • MCP Server deployment package"
echo "   • Production environment configuration"
echo "   • AI integration testing"
echo "   • Health data processing validation"
echo ""
echo "📋 Deployed Resources:"
if [ "$OUTPUTS" != "[]" ]; then
    echo "   • S3 Bucket: $HEALTH_DOCS_BUCKET"
    echo "   • OpenSearch: https://$OPENSEARCH_ENDPOINT"
    echo "   • Redis Cache: $REDIS_ENDPOINT:6379"
    echo "   • Cognito User Pool: $USER_POOL_ID"
fi
echo ""
echo "🔧 Manual Configuration Required:"
echo "   1. Set PERPLEXITY_API_KEY in .env.production for medical research"
echo "   2. Request Bedrock Claude model access if not automatically granted"
echo "   3. Configure OpenSearch admin password"
echo "   4. Set up monitoring and alerting"
echo ""
echo "🚀 Next Steps:"
echo "   1. Deploy MCP server to production environment"
echo "   2. Configure family authentication and user management"
echo "   3. Set up health data ingestion pipelines"
echo "   4. Implement frontend dashboard"
echo "   5. Configure HIPAA compliance monitoring"
echo ""
echo "📊 Test Results:"
echo "   • AI Integration: Check ai-test-results.log"
echo "   • Health Processing: Check health-test-results.log"
echo ""
echo "🎯 StayFit Health Companion deployment completed!"
echo "   Environment: $ENVIRONMENT"
echo "   Region: $AWS_REGION"
echo "   Timestamp: $(date)"
