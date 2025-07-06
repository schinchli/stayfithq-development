#!/bin/bash

# StayFit Health Companion - AWS Infrastructure Deployment Script
# This script deploys the core AWS infrastructure for the health companion platform

set -e

# Configuration
PROJECT_NAME="stayfit-health-companion"
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-infrastructure"

echo "🏥 StayFit Health Companion - AWS Infrastructure Deployment"
echo "<REDACTED_CREDENTIAL>=========="
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Stack: $STACK_NAME"
echo ""

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured and credentials verified"

# Validate CloudFormation template
echo "🔍 Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://cloudformation-infrastructure.yaml \
    --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo "✅ CloudFormation template is valid"
else
    echo "❌ CloudFormation template validation failed"
    exit 1
fi

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_EXISTS" = "DOES_NOT_EXIST" ]; then
    echo "🚀 Creating new CloudFormation stack..."
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://cloudformation-infrastructure.yaml \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
                    ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION \
        --tags Key=Project,Value=$PROJECT_NAME \
               Key=Environment,Value=$ENVIRONMENT \
               Key=ManagedBy,Value=CloudFormation
    
    echo "⏳ Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $AWS_REGION
else
    echo "🔄 Updating existing CloudFormation stack..."
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://cloudformation-infrastructure.yaml \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
                    ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION
    
    echo "⏳ Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME \
        --region $AWS_REGION
fi

# Get stack outputs
echo "📊 Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs')

echo "✅ Infrastructure deployment completed successfully!"
echo ""
echo "📋 Stack Outputs:"
echo "$OUTPUTS" | jq -r '.[] | "  \(.OutputKey): \(.OutputValue)"'

# Create environment file with outputs
echo "📝 Creating environment configuration file..."
cat > ../config/aws-${ENVIRONMENT}.env << EOF
# AWS Infrastructure Configuration - Generated $(date)
AWS_REGION=$AWS_REGION
ENVIRONMENT=$ENVIRONMENT
PROJECT_NAME=$PROJECT_NAME

# Stack Outputs
HEALTH_DOCUMENTS_BUCKET=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="HealthDocumentsBucket") | .OutputValue')
OPENSEARCH_ENDPOINT=https://$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="OpenSearchDomainEndpoint") | .OutputValue')
REDIS_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="RedisEndpoint") | .OutputValue')
COGNITO_USER_POOL_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolId") | .OutputValue')
COGNITO_USER_POOL_CLIENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolClientId") | .OutputValue')
VPC_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="VPCId") | .OutputValue')

# Redis Configuration
REDIS_URL=<REDACTED_CREDENTIAL>

# OpenSearch Configuration
OPENSEARCH_username = "your_username"OPENSEARCH_password = "your_secure_password"# MCP Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=0.0.0.0
EOF

echo "✅ Environment configuration saved to ../config/aws-${ENVIRONMENT}.env"

# Set up billing alerts
echo "💰 Setting up billing alerts..."
aws budgets create-budget \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --budget '{
        "BudgetName": "'$PROJECT_NAME'-'$ENVIRONMENT'-monthly-budget",
        "BudgetLimit": {
            "Amount": "50.0",
            "Unit": "USD"
        },
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST",
        "CostFilters": {
            "TagKey": ["Project"],
            "TagValue": ["'$PROJECT_NAME'"]
        }
    }' \
    --notifications-with-subscribers '[
        {
            "Notification": {
                "NotificationType": "ACTUAL",
                "ComparisonOperator": "GREATER_THAN",
                "Threshold": 80.0,
                "ThresholdType": "PERCENTAGE"
            },
            "Subscribers": [
                {
                    "SubscriptionType": "EMAIL",
                    "Address": "admin@example.com"
                }
            ]
        }
    ]' \
    --region us-east-1 2>/dev/null || echo "⚠️  Billing alert setup skipped (may already exist)"

echo ""
echo "🎉 AWS Infrastructure deployment completed!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the generated AWS configuration"
echo "2. Set the OPENSEARCH_ADMIN_PASSWORD environment variable"
echo "3. Deploy the MCP server to the created infrastructure"
echo "4. Configure your application to use the new AWS resources"
echo ""
echo "Resources created:"
echo "  • VPC with public/private subnets"
echo "  • S3 bucket for health documents"
echo "  • OpenSearch domain for health data indexing"
echo "  • Redis cache for MCP server"
echo "  • Cognito User Pool for family authentication"
echo "  • CloudTrail for HIPAA compliance audit logging"
echo "  • Security groups and IAM policies"
