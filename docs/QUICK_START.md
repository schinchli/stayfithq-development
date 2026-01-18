# Quick Start Guide - StayFitHQ

Get StayFitHQ running in 15 minutes with minimal AWS setup.

## Prerequisites

- AWS Account with CLI configured
- Basic knowledge of AWS services
- Node.js 18+ (for local development)

## Minimal Setup (Authentication Only)

This gets the app running with just authentication. Other features can be added later.

### Step 1: Deploy Static Website (Already Done!)

Your website is already deployed:
- **S3 Bucket**: `stayfithq-web-prod-1768699805`
- **CloudFront**: `https://d28c6zfvylwdaa.cloudfront.net`

### Step 2: Setup Cognito (Required - 5 minutes)

```bash
# 1. Create User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name stayfithq-users \
  --auto-verified-attributes email \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true}}' \
  --region us-east-1 \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# 2. Create App Client
CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name stayfithq-web \
  --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-1)

CLIENT_ID=$(echo $CLIENT_OUTPUT | jq -r '.UserPoolClient.ClientId')
CLIENT_SECRET=$(echo $CLIENT_OUTPUT | jq -r '.UserPoolClient.ClientSecret')

echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"

# 3. Create Domain
DOMAIN="stayfithq-$(date +%s)"
aws cognito-idp create-user-pool-domain \
  --domain $DOMAIN \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1

echo "Cognito Domain: $DOMAIN.auth.us-east-1.amazoncognito.com"

# 4. Create Test User
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@stayfithq.com \
  --user-attributes Name=email,Value=admin@stayfithq.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --region us-east-1

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username admin@stayfithq.com \
  --password Admin@2026 \
  --permanent \
  --region us-east-1

echo ""
echo "✅ Cognito Setup Complete!"
echo ""
echo "Save these values:"
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo "Domain: $DOMAIN.auth.us-east-1.amazoncognito.com"
echo ""
echo "Test Login:"
echo "Email: admin@stayfithq.com"
echo "Password: Admin@2026"
```

### Step 3: Update Configuration Files

Clone the repository and update config:

```bash
git clone https://github.com/schinchli/stayfithq-development.git
cd stayfithq-development
```

**Edit `src/web/js/cognito-auth-universal.js`** (lines 8-12):
```javascript
const userPoolId = 'YOUR_USER_POOL_ID';
const clientId = 'YOUR_CLIENT_ID';
const cognitoDomain = 'YOUR_DOMAIN.auth.us-east-1.amazoncognito.com';
const clientSecret = 'YOUR_CLIENT_SECRET';
```

**Edit `src/web/js/config.js`** (lines 25-30):
```javascript
cognito: {
    region: 'us-east-1',
    userPoolId: 'YOUR_USER_POOL_ID',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    cognitoDomain: 'YOUR_DOMAIN.auth.us-east-1.amazoncognito.com'
}
```

### Step 4: Deploy Updated Files

```bash
# Upload updated JS files
aws s3 cp src/web/js/cognito-auth-universal.js s3://stayfithq-web-prod-1768699805/js/
aws s3 cp src/web/js/config.js s3://stayfithq-web-prod-1768699805/js/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E2XS425B7TX1I3 \
  --paths "/js/*"
```

### Step 5: Test Your Application

1. Go to: https://d28c6zfvylwdaa.cloudfront.net
2. Click "Login"
3. Enter:
   - Email: `admin@stayfithq.com`
   - Password: `Admin@2026`
4. You should see the dashboard!

## What's Working Now

✅ Static website hosting (S3 + CloudFront)
✅ User authentication (Cognito)
✅ All UI pages and navigation
✅ Responsive design
✅ HTTPS security

## What's Not Working Yet

❌ AI health analysis (needs Bedrock)
❌ Data persistence (needs DynamoDB)
❌ Document processing (needs Textract)
❌ Health data search (needs OpenSearch)

## Add More Features Later

Once basic authentication works, you can add:

1. **DynamoDB** (5 min) - For saving user settings
2. **Bedrock** (10 min) - For AI health insights
3. **Textract** (5 min) - For document scanning
4. **OpenSearch** (15 min) - For health data search

See [AWS_SERVICES_CONFIGURATION.md](AWS_SERVICES_CONFIGURATION.md) for detailed setup.

## Troubleshooting

### Login doesn't work
- Check CloudFront cache is invalidated (wait 2-3 minutes)
- Verify Cognito credentials in browser console (F12)
- Check User Pool ID and Client ID are correct

### Can't create user
- Verify User Pool exists: `aws cognito-idp list-user-pools --max-results 10`
- Check IAM permissions for Cognito

### Configuration not updating
- Clear browser cache (Ctrl+Shift+Delete)
- Invalidate CloudFront: `aws cloudfront create-invalidation --distribution-id E2XS425B7TX1I3 --paths "/*"`

## Cost Estimate

**Minimal Setup (Cognito only):**
- Cognito: Free (up to 50,000 MAUs)
- S3: ~$0.01/month
- CloudFront: Free (1TB/month)
- **Total: ~$0.01/month**

## Next Steps

1. ✅ Complete this quick start
2. Test login and navigation
3. Add more AWS services as needed
4. Customize for your use case
5. Deploy to production

## Support

- Documentation: [docs/](../README.md)
- Issues: [GitHub Issues](https://github.com/schinchli/stayfithq-development/issues)
- Full Setup: [AWS_SERVICES_CONFIGURATION.md](AWS_SERVICES_CONFIGURATION.md)

---

**Time to complete**: 15 minutes
**Cost**: ~$0.01/month
**Difficulty**: Beginner-friendly
