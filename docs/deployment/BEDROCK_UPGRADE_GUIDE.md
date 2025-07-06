# Amazon Bedrock Rate Limit Upgrade Guide

## Current Status
- **Claude 3.5 Sonnet**: 1 request/minute (causing throttling)
- **Account**: Basic support plan
- **Issue**: Rate limiting during normal usage

## Immediate Solutions

### Option 1: AWS Console Support Case (Recommended)
1. Go to [AWS Support Center](https://console.aws.amazon.com/support/home)
2. Click "Create case"
3. Select "Service limit increase"
4. Fill out:
   - **Service**: Amazon Bedrock
   - **Limit type**: Model inference
   - **Region**: US East (N. Virginia)
   - **Model**: Claude 3.5 Sonnet
   - **Current limit**: 1 request/minute
   - **Requested limit**: 50 requests/minute
   - **Use case**: Health AI assistant with guardrails

### Option 2: Upgrade Support Plan
1. Go to [AWS Support Plans](https://aws.amazon.com/support/plans/)
2. Choose **Developer** ($29/month) or **Business** ($100/month)
3. Benefits:
   - Faster response times
   - Technical support
   - Service limit increase requests

### Option 3: Alternative Models
- **Claude 3 Haiku**: 20 requests/minute (higher limit)
- **Claude 3 Sonnet**: 10 requests/minute (higher than 3.5)

## Cost Implications

### Bedrock Pricing (per 1M tokens)
- **Claude 3.5 Sonnet**: $3.00 input / $15.00 output
- **Claude 3 Haiku**: $0.25 input / $1.25 output
- **Claude 3 Sonnet**: $3.00 input / $15.00 output

### Support Plan Costs
- **Basic**: Free (current)
- **Developer**: $29/month
- **Business**: $100/month

## Implementation Steps

### Step 1: Request Limit Increase
```bash
# Manual process via AWS Console
# Expected approval time: 1-3 business days
```

### Step 2: Monitor Usage
```bash
# Check current usage
aws logs filter-log-events --log-group-name "/aws/lambda/StayFitHealthAssistant" --filter-pattern "ThrottlingException"
```

### Step 3: Implement Cost Controls
```python
# Add to Lambda function
MAX_DAILY_REQUESTS = 1000
COST_ALERT_THRESHOLD = 50  # USD
```

## Expected Outcomes

### With 50 requests/minute:
- **Concurrent users**: 20-30
- **Response time**: <3 seconds
- **Monthly cost**: ~$50-100 (estimated)

### Timeline:
- **Support case**: 1-3 business days
- **Implementation**: Immediate after approval
- **Testing**: Same day

## Monitoring & Alerts

### CloudWatch Alarms
- Request count > 80% of limit
- Cost > $50/month
- Error rate > 5%

### Cost Optimization
- Use Claude 3 Haiku for simple queries
- Cache common responses
- Implement request queuing

## Contact Information
- **AWS Support**: Via console
- **Account ID**: YOUR_AWS_ACCOUNT_ID
- **Region**: your-aws-region
