# 🚀 StayFit Health Companion - Deployment Guide

> **Comprehensive deployment guide for HIPAA-compliant healthcare platform with MCP & OpenSearch integration**

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [AWS Infrastructure Setup](#aws-infrastructure-setup)
- [MCP and OpenSearch Configuration](#mcp-and-opensearch-configuration)
- [Security Configuration](#security-configuration)
- [Monitoring and Observability](#monitoring-and-observability)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **Git**: Latest version
- **AWS CLI**: 2.0 or higher
- **Docker**: 20.0 or higher (optional)

### AWS Account Requirements
- **AWS Account**: With appropriate permissions
- **IAM Roles**: Lambda execution role, ECS task role
- **VPC**: Configured with public and private subnets
- **Domain**: Optional custom domain for production

### Required AWS Services
- **S3**: Static website hosting and asset storage
- **CloudFront**: Global CDN for content delivery
- **Lambda**: Serverless backend functions
- **API Gateway**: RESTful API management
- **Aurora PostgreSQL**: Primary database
- **ElastiCache Redis**: Caching layer
- **OpenSearch Service**: Healthcare data search
- **CloudWatch**: Monitoring and logging
- **X-Ray**: Distributed tracing
- **KMS**: Key management for encryption

---

## 💻 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/healthhq-quackchallenge.git
cd healthhq-quackchallenge
```

### 2. Install Dependencies
```bash
# Install all dependencies including MCP and OpenSearch
npm install

# Verify installation
npm audit
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```bash
# Application Configuration
NODE_ENV=development
PORT=3000

# MCP Configuration
MCP_SERVER_ENABLED=true
MCP_TOOLS_ENABLED=true
MCP_OPENSEARCH_INTEGRATION=true

# OpenSearch Configuration
OPENSEARCH_ENDPOINT=http://localhost:9200
OPENSEARCH_username = "your_username"OPENSEARCH_PASSWORD=admin

# Healthcare Integration
HEALTHCARE_SEARCH_ENABLED=true
FHIR_SEARCH_ENABLED=true
OPENEHR_SEARCH_ENABLED=true
HIPAA_COMPLIANCE_ENABLED=true

# Security Configuration
JWT_SECRET=your-development-jwt-secret
ENCRYPTION_KEY=your-development-encryption-key
HIPAA_ENCRYPTION_KEY=your-development-hipaa-key

# AWS Configuration (for local testing)
AWS_REGION=your-aws-region
aws_access_key_id = YOUR_AWS_ACCESS_KEY
aws_secret_access_key = YOUR_AWS_SECRET_KEY
```

### 4. Start Development Server
```bash
# Start the enhanced server with MCP integration
npm start

# Or start with specific server
node quick-fix-mcp-server.js

# Access the application
open http://localhost:3000
```

### 5. Verify Local Setup
```bash
# Run integration tests
node test-production-mcp.js

# Check MCP integration
curl http://localhost:3000/api/mcp/health

# Check enhanced features
curl http://localhost:3000/api/enhanced/health
```

---

## 🌐 Production Deployment

### Quick Production Deployment
```bash
# Deploy with MCP and OpenSearch integration
./deploy-mcp-production.sh

# Verify deployment
node test-production-mcp.js
```

### Manual Production Deployment

#### 1. Build Production Assets
```bash
# Install production dependencies
npm install --production

# Build optimized assets
npm run build
```

#### 2. Deploy to S3 and CloudFront
```bash
# Sync static assets to S3
aws s3 sync src/pages/ s3://your-bucket-name/ --delete --cache-control "max-age=300"
aws s3 sync src/assets/ s3://your-bucket-name/assets/ --delete --cache-control "max-age=86400"

# Upload server code
aws s3 cp production-mcp-server.js s3://your-bucket-name/server/
aws s3 sync src/ s3://your-bucket-name/server/src/ --exclude "*.log"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

#### 3. Deploy Lambda Functions
```bash
# Deploy MCP Lambda function
./deploy-lambda-mcp.sh

# Verify Lambda deployment
aws lambda invoke --function-name healthhq-mcp-production response.json
```

---

## ☁️ AWS Infrastructure Setup

### 1. VPC and Networking
```bash
# Create VPC with public and private subnets
aws ec2 create-vpc --cidr-block 10.X.X.X/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=healthhq-vpc}]'

# Create public subnet
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.X.X.X/24 --availability-zone us-east-1a

# Create private subnet
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.X.X.X/24 --availability-zone us-east-1b

# Create internet gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=healthhq-igw}]'
```

### 2. Database Setup (Aurora PostgreSQL)
```bash
# Create DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name healthhq-db-subnet-group \
    --db-subnet-group-description "HealthHQ Database Subnet Group" \
    --subnet-ids subnet-12345678 subnet-87654321

# Create Aurora PostgreSQL cluster
aws rds create-db-cluster \
    --db-cluster-identifier healthhq-aurora-cluster \
    --engine aurora-postgresql \
    --engine-version 13.7 \
    --master-username healthhqadmin \
    --master-user-password YourSecurePassword123! \
    --db-subnet-group-name healthhq-db-subnet-group \
    --vpc-security-group-ids sg-12345678 \
    --storage-encrypted \
    --kms-key-id alias/aws/rds
```

### 3. ElastiCache Redis Setup
```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name healthhq-cache-subnet-group \
    --cache-subnet-group-description "HealthHQ Cache Subnet Group" \
    --subnet-ids subnet-12345678 subnet-87654321

# Create Redis cluster
aws elasticache create-replication-group \
    --replication-group-id healthhq-redis-cluster \
    --description "HealthHQ Redis Cluster" \
    --node-type cache.t3.micro \
    --engine redis \
    --engine-version 6.2 \
    --num-cache-clusters 2 \
    --cache-subnet-group-name healthhq-cache-subnet-group \
    --security-group-ids sg-87654321 \
    --at-rest-encryption-enabled \
    --transit-encryption-enabled
```

### 4. OpenSearch Service Setup
```bash
# Create OpenSearch domain
aws opensearch create-domain \
    --domain-name healthhq-production \
    --elasticsearch-version OpenSearch_2.3 \
    --cluster-config InstanceType=t3.small.search,InstanceCount=2,DedicatedMasterEnabled=true,MasterInstanceType=t3.small.search,MasterInstanceCount=3 \
    --ebs-options EBSEnabled=true,VolumeType=gp3,VolumeSize=20 \
    --vpc-options SubnetIds=subnet-12345678,subnet-87654321,SecurityGroupIds=sg-12345678 \
    --encryption-at-rest-options Enabled=true \
    --node-to-node-encryption-options Enabled=true \
    --domain-endpoint-options EnforceHTTPS=true \
    --advanced-security-options Enabled=true,InternalUserDatabaseEnabled=true,MasterUserOptions='{Masterusername = "your_username",<REDACTED_CREDENTIAL>!}'
```

---

## 🔗 MCP and OpenSearch Configuration

### 1. MCP Server Configuration
```javascript
// config/mcp-config.js
module.exports = {
  server: {
    name: 'healthhq-mcp-production',
    version: '2.0.0',
    port: process.env.MCP_PORT || 3001
  },
  opensearch: {
    endpoint: process.env.OPENSEARCH_ENDPOINT,
    username = "your_username".env.OPENSEARCH_USERNAME,
    password = "your_secure_password"ssl: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  },
  tools: {
    enabled: [
      'search_healthcare_data',
      'create_fhir_patient',
      'search_fhir_resources',
      'create_openehr_composition',
      'execute_aql_query',
      'audit_data_access',
      'generate_compliance_report',
      'analyze_clinical_data',
      'create_healthcare_index',
      'index_healthcare_document',
      'enhanced_health_check'
    ]
  }
};
```

### 2. OpenSearch Index Templates
```bash
# Create patient index template
curl -X PUT "https://your-service.amazonaws.com/_index_template/healthcare-patients" \
-H "Content-Type: application/json" \
-d '{
  "index_patterns": ["healthcare-patients-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "resourceType": {"type": "keyword"},
        "id": {"type": "keyword"},
        "name": {
          "properties": {
            "family": {"type": "text"},
            "given": {"type": "text"}
          }
        },
        "gender": {"type": "keyword"},
        "birthDate": {"type": "date"},
        "compliance": {"type": "keyword"},
        "indexed_at": {"type": "date"}
      }
    }
  }
}'
```

### 3. FHIR R4 Configuration
```javascript
// config/fhir-config.js
module.exports = {
  server: {
    baseUrl: '/fhir/R4',
    version: '4.0.1'
  },
  resources: {
    Patient: {
      enabled: true,
      interactions: ['read', 'create', 'update', 'delete', 'search-type']
    },
    Observation: {
      enabled: true,
      interactions: ['read', 'create', 'update', 'delete', 'search-type']
    },
    MedicationRequest: {
      enabled: true,
      interactions: ['read', 'create', 'update', 'delete', 'search-type']
    }
  },
  validation: {
    enabled: true,
    strict: true
  }
};
```

---

## 🔒 Security Configuration

### 1. HIPAA Compliance Setup
```bash
# Create KMS key for HIPAA encryption
aws kms create-key \
    --description "HealthHQ HIPAA Encryption Key" \
    --key-usage ENCRYPT_DECRYPT \
    --key-spec SYMMETRIC_DEFAULT

# Create alias for the key
aws kms create-alias \
    --alias-name alias/healthhq-hipaa-key \
    --target-key-id 12<REDACTED_CREDENTIAL>-1234-1234-YOUR_AWS_ACCOUNT_ID
```

### 2. IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::stayfit-healthhq-web-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBClusters",
        "rds:Connect"
      ],
      "Resource": "arn:aws:rds:your-aws-region:*:cluster:healthhq-aurora-cluster"
    },
    {
      "Effect": "Allow",
      "Action": [
        "es:ESHttpGet",
        "es:ESHttpPost",
        "es:ESHttpPut",
        "es:ESHttpDelete"
      ],
      "Resource": "arn:aws:es:your-aws-region:*:domain/healthhq-production/*"
    }
  ]
}
```

### 3. Security Groups Configuration
```bash
# Create security group for web tier
aws ec2 create-security-group \
    --group-name healthhq-web-sg \
    --description "HealthHQ Web Security Group" \
    --vpc-id vpc-12345678

# Allow HTTPS traffic
aws ec2 authorize-security-group-ingress \
    --group-id sg-12345678 \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Create security group for database
aws ec2 create-security-group \
    --group-name healthhq-db-sg \
    --description "HealthHQ Database Security Group" \
    --vpc-id vpc-12345678

# Allow PostgreSQL traffic from web tier
aws ec2 authorize-security-group-ingress \
    --group-id sg-87654321 \
    --protocol tcp \
    --port 5432 \
    --source-group sg-12345678
```

---

## 📊 Monitoring and Observability

### 1. CloudWatch Dashboard Setup
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
    --dashboard-name "HealthHQ-Production-Dashboard" \
    --dashboard-body file://cloudwatch-dashboard.json
```

### 2. X-Ray Tracing Configuration
```javascript
// Enable X-Ray tracing
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Configure X-Ray middleware
app.use(AWSXRay.express.openSegment('HealthHQ-Production'));
app.use(AWSXRay.express.closeSegment());
```

### 3. CloudWatch Alarms
```bash
# Create high error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "HealthHQ-High-Error-Rate" \
    --alarm-description "High error rate detected" \
    --metric-name ErrorRate \
    --namespace AWS/Lambda \
    --statistic Average \
    --period 300 \
    --threshold 5.0 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2

# Create high latency alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "HealthHQ-High-Latency" \
    --alarm-description "High latency detected" \
    --metric-name Duration \
    --namespace AWS/Lambda \
    --statistic Average \
    --period 300 \
    --threshold 5000 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

---

## 🔧 Environment-Specific Configuration

### Development Environment
```bash
# .env.development
NODE_ENV=development
PORT=3000
MCP_SERVER_ENABLED=true
OPENSEARCH_ENDPOINT=http://localhost:9200
HIPAA_COMPLIANCE_ENABLED=false
DEBUG_MODE=true
```

### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
PORT=3000
MCP_SERVER_ENABLED=true
OPENSEARCH_ENDPOINT=https://your-service.amazonaws.com
HIPAA_COMPLIANCE_ENABLED=true
DEBUG_MODE=false
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
PORT=3000
MCP_SERVER_ENABLED=true
OPENSEARCH_ENDPOINT=https://your-service.amazonaws.com
HIPAA_COMPLIANCE_ENABLED=true
DEBUG_MODE=false
ENCRYPTION_ENABLED=true
```

---

## 🧪 Testing and Validation

### 1. Integration Testing
```bash
# Run comprehensive integration tests
npm run test:integration

# Test MCP integration
node test-production-mcp.js

# Test HIPAA compliance
npm run test:hipaa

# Test FHIR R4 validation
npm run test:fhir
```

### 2. Load Testing
```bash
# Install load testing tools
npm install -g artillery

# Run load tests
artillery run load-test-config.yml

# Monitor performance during load test
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --start-time 2025-06-30T16:00:00Z \
    --end-time 2025-06-30T17:00:00Z \
    --period 300 \
    --statistics Average
```

### 3. Security Testing
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm install -g snyk
snyk test

# Validate HTTPS configuration
curl -I https://YOUR-DOMAIN.cloudfront.net/
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. MCP Integration Issues
```bash
# Check MCP server status
curl http://localhost:3000/api/mcp/health

# Verify OpenSearch connection
curl -X GET "https://your-service.amazonaws.com/_cluster/health"

# Check MCP server logs
tail -f logs/mcp-server.log
```

#### 2. FHIR R4 Validation Errors
```bash
# Validate FHIR resource
curl -X POST http://localhost:3000/fhir/R4/Patient/$validate \
  -H "Content-Type: application/json" \
  -d @patient-resource.json

# Check FHIR capability statement
curl http://localhost:3000/fhir/R4/metadata
```

#### 3. Database Connection Issues
```bash
# Test database connection
psql -h healthhq-aurora-cluster.cluster-xyz.your-aws-region.rds.amazonaws.com \
     -U healthhqadmin \
     -d healthhq

# Check connection pool status
curl http://localhost:3000/api/health/database
```

#### 4. OpenSearch Issues
```bash
# Check OpenSearch cluster health
curl -X GET "https://your-service.amazonaws.com/_cluster/health"

# List indices
curl -X GET "https://your-service.amazonaws.com/_cat/indices"

# Check index mapping
curl -X GET "https://your-service.amazonaws.com/healthcare-patients/_mapping"
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Create indices for common queries
CREATE INDEX idx_patient_name ON patients USING gin(to_tsvector('english', name));
CREATE INDEX idx_observation_date ON observations (effective_date);
CREATE INDEX idx_patient_id ON observations (patient_id);
```

#### 2. Caching Strategy
```javascript
// Redis caching configuration
const redis = require('redis');
const client = redis.createClient({
  host: 'healthhq-redis-cluster.xyz.cache.amazonaws.com',
  port: 6379,
  ttl: 3600 // 1 hour
});
```

#### 3. CDN Optimization
```bash
# Configure CloudFront caching
aws cloudfront create-cache-policy \
    --cache-policy-config file://cache-policy.json
```

---

## 📚 Additional Resources

### Documentation Links
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [HIPAA Compliance on AWS](https://aws.amazon.com/compliance/hipaa-compliance/)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [openEHR Specifications](https://specifications.openehr.org/)
- [OpenSearch Documentation](https://opensearch.org/docs/)

### Support and Community
- [AWS Support](https://aws.amazon.com/support/)
- [HL7 FHIR Community](https://chat.fhir.org/)
- [openEHR Community](https://discourse.openehr.org/)
- [OpenSearch Community](https://forum.opensearch.org/)

---

**Built with ❤️ for Healthcare Excellence by Shashank Chinchli, Solutions Architect, AWS**

*HIPAA-Compliant • FHIR R4 • openEHR • MCP Connected • OpenSearch Ready • Enterprise Security*
