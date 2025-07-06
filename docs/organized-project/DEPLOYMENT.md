# Deployment Guide - StayFit Health Companion

> **Quick deployment guide for the organized healthcare platform**

## 🚀 **Quick Deploy to AWS**

### **Prerequisites**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure AWS credentials
aws configure
```

### **One-Command Deployment**
```bash
# Deploy everything
./deploy-enhanced.sh
```

---

## 📁 **Deployment Structure**

### **1. Website Deployment**
```bash
# Deploy website to S3
cd website/
aws s3 sync . s3://your-bucket-name/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

### **2. Lambda Functions**
```bash
# Deploy Lambda functions
cd lambda/
zip -r functions.zip .
aws lambda update-function-code --function-name your-function --zip-file fileb://functions.zip
```

### **3. Infrastructure**
```bash
# Deploy with Terraform
cd infrastructure/terraform/
terraform init
terraform plan
terraform apply
```

---

## 🔧 **Environment Setup**

### **Environment Variables**
```bash
# Copy and configure
cp .env.example .env

# Edit with your values:
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-region-1_YOUR_USER_POOL_ID
COGNITO_CLIENT_ID=59kc5qi8el10a7o36na5qn6m3f
CLOUDFRONT_DISTRIBUTION_ID=YOUR_CLOUDFRONT_DISTRIBUTION_ID
S3_BUCKET=stayfit-healthhq-web-prod
```

### **AWS Resources Required**
- ✅ S3 Bucket for static hosting
- ✅ CloudFront Distribution
- ✅ Cognito User Pool & Client
- ✅ Lambda Functions (6 functions)
- ✅ DynamoDB Tables
- ✅ OpenSearch Domain (optional)

---

## 🏥 **Production Configuration**

### **Cognito Setup**
```bash
# Update Cognito User Pool Client
aws cognito-idp update-user-pool-client \
  --user-pool-id us-region-1_YOUR_USER_POOL_ID \
  --client-id 59kc5qi8el10a7o36na5qn6m3f \
  --access-token-validity 30 \
  --id-token-validity 30 \
  --token-validity-units AccessToken=minutes,IdToken=minutes
```

### **Security Setup**
```bash
# Deploy WAF and security
./scripts/deploy-enterprise-security.sh

# Monitor security
./scripts/security-scan.sh
```

---

## 📊 **Verification Steps**

### **1. Website Verification**
- ✅ Visit: https://your-domain.cloudfront.net
- ✅ Test login with Cognito Hosted UI
- ✅ Verify 30-minute session timer
- ✅ Navigate between all 10 pages
- ✅ Test session extension

### **2. Backend Verification**
```bash
# Test Lambda functions
npm test

# Check DynamoDB tables
aws dynamodb list-tables

# Verify OpenSearch (if deployed)
curl -X GET "your-opensearch-endpoint/_cluster/health"
```

### **3. Security Verification**
```bash
# Run security scan
./scripts/security-scan.sh

# Check WAF rules
aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1
```

---

## 🎯 **Production Checklist**

### **Pre-Deployment**
- [ ] AWS credentials configured
- [ ] Environment variables set
- [ ] Domain/SSL certificate ready
- [ ] Backup existing resources

### **Deployment**
- [ ] Website deployed to S3
- [ ] CloudFront distribution configured
- [ ] Lambda functions deployed
- [ ] Cognito User Pool configured
- [ ] DynamoDB tables created
- [ ] Security (WAF) deployed

### **Post-Deployment**
- [ ] Website accessible
- [ ] Authentication working
- [ ] 30-minute sessions active
- [ ] All pages functional
- [ ] Security scan passed
- [ ] Performance optimized

---

## 🔍 **Troubleshooting**

### **Common Issues**

**Authentication Issues**
```bash
# Check Cognito configuration
aws cognito-idp describe-user-pool-client --user-pool-id YOUR-POOL-ID --client-id YOUR-CLIENT-ID

# Verify callback URLs
# Ensure all page URLs are in Cognito callback URLs
```

**Session Issues**
```bash
# Check browser console for errors
# Verify session-manager.js is loaded
# Check token expiration times
```

**Deployment Issues**
```bash
# Check AWS permissions
aws sts get-caller-identity

# Verify S3 bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
```

---

## 📈 **Monitoring & Maintenance**

### **Monitoring**
```bash
# CloudWatch logs
aws logs describe-log-groups

# CloudFront metrics
aws cloudwatch get-metric-statistics --namespace AWS/CloudFront

# Lambda metrics
aws cloudwatch get-metric-statistics --namespace AWS/Lambda
```

### **Updates**
```bash
# Update website
cd website/
aws s3 sync . s3://your-bucket-name/
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"

# Update Lambda functions
cd lambda/
./deploy-lambdas.sh
```

---

## 🎉 **Success Metrics**

### **Deployment Success**
- ✅ **Website**: All 10 pages loading correctly
- ✅ **Authentication**: Cognito Hosted UI working
- ✅ **Sessions**: 30-minute sessions with timer
- ✅ **Security**: WAF protection active
- ✅ **Performance**: Fast loading times

### **Production Ready**
- ✅ **HTTPS**: SSL certificate configured
- ✅ **CDN**: CloudFront distribution active
- ✅ **Monitoring**: CloudWatch logs enabled
- ✅ **Backup**: Regular backups configured
- ✅ **Security**: Enterprise-grade protection

---

*Deployment guide by Shashank Chinchli, Solutions Architect, AWS*
