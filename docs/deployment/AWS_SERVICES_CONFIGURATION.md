# AWS Services Configuration Guide

## 🔧 Required AWS Services Setup

This guide shows you where and how to configure AWS services to make StayFitHQ fully functional.

---

## 1. Amazon Cognito (Authentication)

### Setup Location
**File**: `src/web/js/cognito-auth-universal.js`

### Configuration
```javascript
// Lines 8-11
const userPoolId = '';  // Add your User Pool ID
const clientId = '';    // Add your App Client ID
const cognitoDomain = ''; // Add your Cognito domain
const clientSecret = ''; // Add your App Client Secret (if using)
```

### How to Get Values:
1. Go to AWS Console → Amazon Cognito
2. Create a User Pool or use existing one
3. **User Pool ID**: Found in User Pool settings
4. **App Client ID**: User Pool → App Integration → App clients
5. **Cognito Domain**: User Pool → App Integration → Domain name
6. **Client Secret**: App client settings (if enabled)

### Create User Pool:
```bash
aws cognito-idp create-user-pool \
  --pool-name stayfithq-users \
  --auto-verified-attributes email \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}"
```

---

## 2. Amazon Bedrock (AI Health Analysis)

### Setup Location
**File**: `src/ai/bedrock-health-analyzer.js`

### Configuration
```javascript
// Lines 10-12
const BEDROCK_REGION = 'us-east-1'; // Your preferred region
const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'; // Model to use
```

### Enable Bedrock:
1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access"
3. Request access to Claude models
4. Wait for approval (usually instant)

### Test Bedrock Access:
```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"prompt":"Hello","max_tokens":100}' \
  --region us-east-1 \
  output.json
```

### Alternative File Locations:
- `src/aws/bedrock-service-v3.js` - Bedrock service wrapper
- `infrastructure/lambda/bedrock-health-assistant.py` - Lambda function

---

## 3. Amazon DynamoDB (Settings Storage)

### Setup Location
**File**: `src/web/js/config.js`

### Configuration
```javascript
// Lines 15-20
dynamodb: {
    region: 'us-east-1',
    tableName: 'stayfithq-settings',
    endpoint: '' // Leave empty for production
}
```

### Create DynamoDB Table:
```bash
aws dynamodb create-table \
  --table-name stayfithq-settings \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### CloudFormation Template:
**File**: `infrastructure/cloudformation/main.yaml`
- Contains complete DynamoDB table definition
- Includes indexes and settings

---

## 4. Amazon Textract (Document Processing)

### Setup Location
**File**: `src/aws/textract-service-v3.js`

### Configuration
```javascript
// Lines 8-10
const TEXTRACT_REGION = 'us-east-1';
const S3_BUCKET = 'stayfithq-documents'; // Your S3 bucket for documents
```

### Create S3 Bucket for Documents:
```bash
aws s3api create-bucket \
  --bucket stayfithq-documents-$(date +%s) \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket stayfithq-documents-$(date +%s) \
  --versioning-configuration Status=Enabled
```

---

## 5. Amazon OpenSearch (Health Data Search)

### Setup Location
**File**: `src/mcp/lib/opensearch-mcp-server.js`

### Configuration
```javascript
// Lines 15-20
const OPENSEARCH_ENDPOINT = ''; // Your OpenSearch domain endpoint
const OPENSEARCH_REGION = 'us-east-1';
const OPENSEARCH_INDEX = 'health-records';
```

### Create OpenSearch Domain:
```bash
aws opensearch create-domain \
  --domain-name stayfithq-search \
  --engine-version OpenSearch_2.11 \
  --cluster-config InstanceType=t3.small.search,InstanceCount=1 \
  --ebs-options EBSEnabled=true,VolumeType=gp3,VolumeSize=10 \
  --region us-east-1
```

### Get Domain Endpoint:
```bash
aws opensearch describe-domain \
  --domain-name stayfithq-search \
  --query 'DomainStatus.Endpoint' \
  --output text
```

---

## 6. AWS Lambda (Backend Functions)

### Setup Locations
**Directory**: `infrastructure/lambda/`

### Lambda Functions:
1. **bedrock-health-assistant.py** - AI health analysis
2. **opensearch-health-indexer.py** - Index health data
3. **opensearch-mcp-connector.py** - MCP integration
4. **data-ingest-lambda.py** - Data ingestion
5. **perplexity-proxy-lambda.py** - External API proxy

### Deploy Lambda Functions:
```bash
cd infrastructure/lambda

# Package function
zip -r function.zip bedrock-health-assistant.py

# Create Lambda function
aws lambda create-function \
  --function-name stayfithq-health-assistant \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler bedrock-health-assistant.lambda_handler \
  --zip-file fileb://function.zip \
  --region us-east-1
```

---

## 7. Amazon S3 (File Storage)

### Current Deployment
**Bucket**: `stayfithq-web-prod-1768699805`
**Region**: us-east-1

### Configuration File
**File**: `src/aws/s3-service-v3.js`

```javascript
// Lines 8-10
const S3_REGION = 'us-east-1';
const S3_BUCKET = 'stayfithq-web-prod-1768699805';
```

---

## 8. Amazon CloudFront (CDN)

### Current Deployment
**Distribution ID**: E2XS425B7TX1I3
**Domain**: d28c6zfvylwdaa.cloudfront.net

### No configuration needed - Already deployed!

---

## 🔐 IAM Permissions Required

### Create IAM Role for Lambda:
```bash
aws iam create-role \
  --role-name stayfithq-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

### Attach Policies:
```bash
# Bedrock access
aws iam attach-role-policy \
  --role-name stayfithq-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# DynamoDB access
aws iam attach-role-policy \
  --role-name stayfithq-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# S3 access
aws iam attach-role-policy \
  --role-name stayfithq-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Textract access
aws iam attach-role-policy \
  --role-name stayfithq-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonTextractFullAccess

# CloudWatch Logs
aws iam attach-role-policy \
  --role-name stayfithq-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

---

## 📝 Configuration Files Summary

### Main Configuration File
**File**: `src/web/js/config.js`
- Central configuration for all AWS services
- Update this file with your AWS resource IDs

### Environment Template
**File**: `config/.env.template`
- Environment variables for backend services
- Copy to `.env` and fill in values

### Infrastructure as Code
**Directory**: `infrastructure/cloudformation/`
- Complete CloudFormation templates
- Deploy entire stack with one command

---

## 🚀 Quick Setup Script

Create a file `setup-aws-services.sh`:

```bash
#!/bin/bash

# Set your AWS region
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Setting up AWS services for StayFitHQ..."

# 1. Create Cognito User Pool
echo "Creating Cognito User Pool..."
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name stayfithq-users \
  --auto-verified-attributes email \
  --region $REGION \
  --query 'UserPool.Id' --output text)

echo "User Pool ID: $USER_POOL_ID"

# 2. Create DynamoDB Table
echo "Creating DynamoDB Table..."
aws dynamodb create-table \
  --table-name stayfithq-settings \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# 3. Create S3 Bucket for documents
echo "Creating S3 Bucket..."
BUCKET_NAME="stayfithq-docs-$(date +%s)"
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION

echo "S3 Bucket: $BUCKET_NAME"

# 4. Enable Bedrock (manual step required)
echo "⚠️  Manual Step Required:"
echo "Go to AWS Console → Bedrock → Model Access"
echo "Request access to Claude models"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Update these values in src/web/js/config.js:"
echo "  - Cognito User Pool ID: $USER_POOL_ID"
echo "  - DynamoDB Table: stayfithq-settings"
echo "  - S3 Bucket: $BUCKET_NAME"
```

---

## 🧪 Testing Configuration

### Test Cognito:
```bash
aws cognito-idp list-users \
  --user-pool-id YOUR_USER_POOL_ID \
  --region us-east-1
```

### Test DynamoDB:
```bash
aws dynamodb describe-table \
  --table-name stayfithq-settings \
  --region us-east-1
```

### Test Bedrock:
```bash
aws bedrock list-foundation-models \
  --region us-east-1
```

### Test S3:
```bash
aws s3 ls s3://stayfithq-web-prod-1768699805/
```

---

## 💰 Cost Estimates

- **Cognito**: Free tier covers 50,000 MAUs
- **DynamoDB**: Pay per request (~$0.25 per million)
- **Bedrock**: ~$0.003 per 1K input tokens
- **S3**: ~$0.023 per GB/month
- **CloudFront**: First 1TB free per month
- **Lambda**: 1M free requests per month

**Estimated Monthly Cost**: $5-20 for moderate usage

---

## 📚 Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)
- [DynamoDB Getting Started](https://docs.aws.amazon.com/dynamodb/)
- [Textract Documentation](https://docs.aws.amazon.com/textract/)

---

**Need Help?** Check the deployment logs or create an issue on GitHub.
