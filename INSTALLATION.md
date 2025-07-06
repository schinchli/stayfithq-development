# StayFit Health Companion - Installation Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- AWS Account with Cognito configured
- CloudFront distribution set up

### 1. Clone and Install
```bash
git clone https://github.com/schinchli/healthhq-quackchallenge.git
cd healthhq-quackchallenge
npm install
```

### 2. Configure Your Environment
```bash
npm run install:config
```

This will prompt you for:
- AWS Cognito User Pool ID
- Cognito Client ID & Secret
- Cognito Identity Pool ID
- CloudFront URL
- Optional: ABHA integration settings

### 3. Test Locally
```bash
npm run test:local
```

Visit `http://localhost:3000` to test your configuration.

### 4. Deploy to AWS
```bash
# Sync to your S3 bucket
aws s3 sync src/web/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Configuration Details

### AWS Cognito Setup

1. **Create User Pool**
   ```bash
   aws cognito-idp create-user-pool --pool-name "StayFit-Health-Companion"
   ```

2. **Create User Pool Client**
   ```bash
   aws cognito-idp create-user-pool-client \
     --user-pool-id YOUR_USER_POOL_ID \
     --client-name "StayFit-Web-Client" \
     --generate-secret
   ```

3. **Create Identity Pool**
   ```bash
   aws cognito-identity create-identity-pool \
     --identity-pool-name "StayFit_Identity_Pool" \
     --allow-unauthenticated-identities
   ```

### CloudFront Distribution

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-stayfit-bucket
   ```

2. **Configure Bucket Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-stayfit-bucket/*"
       }
     ]
   }
   ```

3. **Create CloudFront Distribution**
   ```bash
   aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
   ```

## 🔒 Security Configuration

### Environment Variables (Optional)
Instead of the interactive installer, you can set environment variables:

```bash
export COGNITO_USER_POOL_ID="us-region-1_YOUR_USER_POOL_ID"
export COGNITO_CLIENT_ID="your-client-id"
export COGNITO_CLIENT_SECRET="your-client-secret"
export COGNITO_IDENTITY_POOL_ID="us-east-1:12<REDACTED_CREDENTIAL>-1234-1234-YOUR_AWS_ACCOUNT_ID"
export COGNITO_DOMAIN="your-app.auth.us-east-1.amazoncognito.com"
export APP_BASE_URL="https://YOUR-DOMAIN.cloudfront.net"
export AWS_REGION="us-east-1"
```

### Cognito App Client Settings
Configure your Cognito app client with:
- **Callback URLs**: `https://your-cloudfront-url.cloudfront.net/index.html`
- **Sign out URLs**: `https://your-cloudfront-url.cloudfront.net/login.html`
- **OAuth Flows**: Authorization code grant
- **OAuth Scopes**: email, openid, profile

## 🧪 Testing

### Local Testing
```bash
# Start test server
npm run test:local

# Check configuration
curl http://localhost:3000/config-check

# Health check
curl http://localhost:3000/health
```

### Configuration Validation
The application will automatically validate your configuration on startup. Check the browser console for any configuration errors.

## 📁 File Structure

```
src/web/
├── js/
│   ├── config.js              # Generated configuration file
│   ├── cognito-auth-universal.js  # Authentication system
│   └── ...
├── css/                       # Stylesheets
├── index.html                 # Main application
├── login.html                 # Login page
└── ...

config.template.js             # Configuration template
install.js                     # Installation script
test-server.js                 # Local test server
```

## 🔧 Troubleshooting

### Common Issues

1. **Configuration Not Found**
   ```
   Error: Configuration not loaded
   ```
   **Solution**: Run `npm run install:config`

2. **Invalid Cognito Credentials**
   ```
   Error: Invalid configuration
   ```
   **Solution**: Verify your Cognito settings in AWS Console

3. **CORS Issues**
   ```
   Error: Access to fetch blocked by CORS policy
   ```
   **Solution**: Configure your Cognito domain CORS settings

4. **CloudFront 403 Errors**
   ```
   Error: Access Denied
   ```
   **Solution**: Check S3 bucket policy and CloudFront OAC settings

### Debug Mode
Enable debug logging by adding to your config:
```javascript
window.STAYFIT_CONFIG.debug = true;
```

## 🚀 Deployment Options

### Option 1: Manual Deployment
```bash
# Build and sync
npm run build
aws s3 sync dist/ s3://your-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Option 2: CI/CD Pipeline
See `.github/workflows/deploy.yml` for GitHub Actions setup.

### Option 3: AWS CDK/CloudFormation
Infrastructure templates available in `infrastructure/` directory.

## 📞 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: Create an issue on GitHub
- **Security**: Email security concerns privately

## 🔐 Security Best Practices

1. **Never commit sensitive data** to version control
2. **Use environment variables** for production deployments
3. **Enable CloudTrail** for audit logging
4. **Configure WAF** for additional protection
5. **Use HTTPS only** in production
6. **Regularly rotate** Cognito client secrets

## 📊 Monitoring

The application includes built-in monitoring:
- Health check endpoint: `/health`
- Configuration validation
- Authentication flow logging
- Error tracking

For production monitoring, consider:
- CloudWatch dashboards
- X-Ray tracing
- Custom metrics

---

**Need help?** Check the troubleshooting section or create an issue on GitHub.
