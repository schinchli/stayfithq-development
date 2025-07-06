# 🚀 StayFit Health Companion - Deployment Prompts & Commands

## 📋 **COMPLETE DEPLOYMENT HISTORY**

This file contains all prompts, commands, and deployment steps used throughout the project development.

## 🏗️ **INITIAL SETUP PROMPTS**

### **Project Initialization**
```bash
# Create project structure
mkdir StayFitHQ
cd StayFitHQ
npm init -y
```

### **AWS Infrastructure Setup**
```bash
# Configure AWS CLI
aws configure
aws s3 mb s3://stayfit-healthhq-web-prod --region us-east-1
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## 🔐 **COGNITO AUTHENTICATION SETUP**

### **User Pool Creation**
```bash
# Create Cognito User Pool
aws cognito-idp create-user-pool --pool-name StayFitHealthCompanion --policies file://user-pool-policies.json

# Create User Pool Client
aws cognito-idp create-user-pool-client --user-pool-id YOUR_USER_POOL_ID --client-name StayFitWebClient
```

### **Authentication Implementation Prompts**
- "Implement Cognito authentication across all pages except login.html"
- "Add 30-minute session management with automatic token refresh"
- "Ensure all protected pages redirect to login if not authenticated"
- "Create universal authentication system for consistent behavior"

## 🛡️ **SECURITY IMPLEMENTATION PROMPTS**

### **WAF Configuration**
```bash
# Deploy WAF with OWASP rules
aws wafv2 create-web-acl --name StayFit-HealthCompanion-WAF --scope CLOUDFRONT --default-action Allow={}

# Associate WAF with CloudFront
aws cloudfront update-distribution --id YOUR_DISTRIBUTION_ID --distribution-config file://waf-enabled-config.json
```

### **Security Hardening Prompts**
- "Scan the code for potential sensitive data leaks, including API keys and database credentials"
- "Replace with dummy content and mention users to update accordingly"
- "Ensure no PII data, no PDF files, complete security sanitization"
- "Remove all hardcoded credentials and replace with environment variables"

## 🚀 **DEPLOYMENT COMMANDS**

### **S3 Deployment**
```bash
# Sync website files to S3
aws s3 sync src/web/ s3://stayfit-healthhq-web-prod/ --delete --region us-east-1

# Set bucket policy for CloudFront access
aws s3api put-bucket-policy --bucket stayfit-healthhq-web-prod --policy file://s3-bucket-policy.json
```

### **CloudFront Cache Invalidation**
```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### **Lambda Function Deployment**
```bash
# Deploy health analysis Lambda
aws lambda create-function --function-name bedrock-health-assistant --runtime python3.9 --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role --handler lambda_function.lambda_handler --zip-file fileb://bedrock-health-assistant.zip

# Deploy data processing Lambda
aws lambda create-function --function-name data-ingest-lambda --runtime python3.9 --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role --handler lambda_function.lambda_handler --zip-file fileb://data-ingest-lambda.zip
```

## 🧪 **TESTING PROMPTS**

### **Navigation Testing**
- "Test navigation across all pages, ensure cognito is protecting all pages"
- "Link to import file is hardcoded and not working on CloudFront distribution"
- "Ensure https://YOUR-DOMAIN.cloudfront.net/import.html is not hardcoded"

### **Authentication Testing**
- "Verify all pages except login.html require authentication"
- "Test 30-minute session timeout and automatic refresh"
- "Ensure cross-tab authentication synchronization"

## 📊 **OPTIMIZATION PROMPTS**

### **Code Organization**
- "Go through all folders, do security scan, and identify anything sensitive not redundant remove"
- "Scan all tests file, see if it is relevant as per cloudfront distribution"
- "Remove all report, demo data notice, comprehensive cleanup, test relevance report"

### **Performance Optimization**
- "Minify all CSS, JavaScript, and HTML files for production"
- "Optimize images and assets for faster loading"
- "Implement caching strategies for better performance"

## 🔄 **ROLLBACK PROMPTS**

### **Version Control**
- "Take a backup of all folder and roll back to git changes done 9:30 AM or before today"
- "Rollback to all changes done today 6:30 am commit"
- "Create a github folder without impacting this project so that I can share it with others publicly"

## 🏥 **HEALTHCARE COMPLIANCE PROMPTS**

### **HIPAA Compliance**
- "Ensure HIPAA compliance throughout the application"
- "Implement proper data encryption at rest and in transit"
- "Add audit logging for all healthcare data access"

### **FHIR Integration**
- "Implement FHIR R4 standards for healthcare data interoperability"
- "Create healthcare data validation according to FHIR specifications"
- "Ensure proper healthcare data formatting and structure"

## 🔧 **INFRASTRUCTURE AS CODE**

### **CloudFormation Templates**
```yaml
# Main infrastructure template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'StayFit Health Companion Infrastructure'

Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: stayfit-healthhq-web-prod
      
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.DomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OriginAccessIdentity}'
```

### **Terraform Configuration**
```hcl
# Terraform main configuration
provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "web_bucket" {
  bucket = "stayfit-healthhq-web-prod"
}

resource "aws_cloudfront_distribution" "web_distribution" {
  origin {
    domain_name = aws_s3_bucket.web_bucket.bucket_domain_name
    origin_id   = "S3-stayfit-healthhq-web-prod"
  }
}
```

## 📱 **MOBILE & RESPONSIVE PROMPTS**

### **Mobile Optimization**
- "Ensure responsive design works across all device sizes"
- "Optimize touch interactions for mobile devices"
- "Implement mobile-specific navigation patterns"

### **Progressive Web App**
- "Add service worker for offline functionality"
- "Implement push notifications for health reminders"
- "Create app manifest for mobile installation"

## 🔍 **MONITORING & LOGGING PROMPTS**

### **CloudWatch Integration**
```bash
# Create CloudWatch log groups
aws logs create-log-group --log-group-name /aws/lambda/bedrock-health-assistant
aws logs create-log-group --log-group-name /aws/lambda/data-ingest-lambda
```

### **X-Ray Tracing**
```bash
# Enable X-Ray tracing
aws xray create-service-map --service-name StayFitHealthCompanion
```

## 🚀 **FINAL DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All sensitive data removed and replaced with placeholders
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] WAF rules configured and tested
- [ ] Backup procedures in place

### **Deployment Steps**
1. **Build and minify assets**
2. **Run security scan**
3. **Deploy to S3**
4. **Invalidate CloudFront cache**
5. **Test all functionality**
6. **Monitor logs and metrics**

### **Post-Deployment**
- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Confirm security headers
- [ ] Check performance metrics
- [ ] Validate HIPAA compliance

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues & Solutions**
- **CloudFront 403 errors**: Check S3 bucket policy and OAI configuration
- **Authentication failures**: Verify Cognito configuration and JWT tokens
- **Performance issues**: Check CloudWatch metrics and optimize accordingly
- **Security alerts**: Review WAF logs and adjust rules as needed

---

*This document contains all deployment prompts and commands used throughout the StayFit Health Companion development process. Keep this updated with any new deployment procedures.*
