# Observability and Monitoring - StayFit Health Companion

## AWS X-Ray Integration

### Overview
AWS X-Ray provides distributed tracing for the StayFit Health Companion application, enabling:
- End-to-end request tracing
- Performance bottleneck identification
- Service dependency mapping
- Error analysis and debugging

### Features Implemented

#### 1. Distributed Tracing
- **Service Map**: Visual representation of application architecture
- **Trace Timeline**: Detailed request flow analysis
- **Subsegment Tracking**: Individual component performance monitoring

#### 2. Custom Instrumentation
```javascript
// Health data operations
XRayMiddleware.traceHealthData('dashboard-data')

// AI interactions
XRayMiddleware.traceAIOperation('chat-interaction')

// AWS service calls
XRayMiddleware.traceAWSService('s3-upload')
```

#### 3. Sampling Rules
- **Health API**: 20% sampling rate (high priority)
- **AI Interactions**: 30% sampling rate (critical path)
- **Static Assets**: 5% sampling rate (low priority)
- **Default**: 10% sampling rate

#### 4. Annotations and Metadata
- **Annotations**: Filterable trace data
  - `service`: stayfit-health-companion
  - `operation`: specific operation type
  - `environment`: development/production
  - `error`: true/false

- **Metadata**: Detailed trace information
  - Request/response details
  - Processing times
  - User context
  - Error details

### X-Ray Dashboard Queries

#### Performance Analysis
```
service("stayfit-health-companion") AND responsetime > 5
```

#### Error Analysis
```
service("stayfit-health-companion") AND error = true
```

#### AI Operations
```
service("stayfit-health-companion") AND annotation.operation = "chat-interaction"
```

#### Health Data Access
```
service("stayfit-health-companion") AND http.url CONTAINS "/api/health"
```

## AWS CloudTrail Integration

### Overview
AWS CloudTrail provides comprehensive audit logging for:
- API access tracking
- Security event monitoring
- Compliance reporting
- Forensic analysis

### Features Implemented

#### 1. Comprehensive Logging
- **API Access Events**: All HTTP requests logged
- **Health Data Access**: HIPAA-compliant audit trail
- **AI Interactions**: Complete conversation logging
- **Security Events**: Unauthorized access attempts
- **Error Events**: Application and system errors

#### 2. Event Types

##### API Access Events
```json
{
  "eventName": "APIAccess",
  "eventSource": "stayfit-health-companion",
  "userIdentity": {
    "type": "WebUser",
    "principalId": "session-id",
    "userName": "user-identifier"
  },
  "requestParameters": {
    "method": "GET",
    "url": "/api/health/dashboard",
    "headers": "sanitized-headers"
  },
  "responseElements": {
    "statusCode": 200,
    "responseTime": 150
  }
}
```

##### Health Data Access Events
```json
{
  "eventName": "HealthDataAccess",
  "requestParameters": {
    "dataType": "dashboard",
    "operation": "read"
  },
  "responseElements": {
    "success": true,
    "recordCount": 1,
    "dataSize": 1024
  }
}
```

##### AI Interaction Events
```json
{
  "eventName": "AIInteraction",
  "requestParameters": {
    "aiService": "bedrock-claude",
    "queryLength": 50,
    "queryType": "health"
  },
  "responseElements": {
    "success": true,
    "responseLength": 200,
    "tokensUsed": 75
  }
}
```

#### 3. Security Monitoring
- **Unauthorized Access**: Failed authentication attempts
- **Suspicious Activity**: Unusual access patterns
- **Data Breach Detection**: Abnormal data access
- **Root Account Usage**: Administrative access monitoring

#### 4. CloudWatch Integration
- **Log Groups**: `/aws/cloudtrail/stayfit-health-companion`
- **Metric Filters**: Custom security metrics
- **Alarms**: Real-time security alerts
- **Dashboards**: Operational visibility

### CloudWatch Alarms

#### Security Alarms
1. **Unauthorized API Calls**
   - Threshold: 1 occurrence
   - Period: 5 minutes
   - Action: SNS notification

2. **Root Account Usage**
   - Threshold: 1 occurrence
   - Period: 1 minute
   - Action: Immediate alert

3. **IAM Policy Changes**
   - Threshold: 1 occurrence
   - Period: 1 minute
   - Action: Security team notification

#### Performance Alarms
1. **High Error Rate**
   - Threshold: 5% error rate
   - Period: 5 minutes
   - Action: Operations alert

2. **High Latency**
   - Threshold: 5 seconds average
   - Period: 5 minutes
   - Action: Performance alert

## Setup Instructions

### 1. X-Ray Setup
```bash
# Install dependencies
npm install aws-xray-sdk-core aws-xray-sdk-express

# Run X-Ray setup script
npm run setup:xray

# Verify X-Ray service map in AWS Console
```

### 2. CloudTrail Setup
```bash
# Install dependencies
npm install winston winston-cloudwatch

# Run CloudTrail setup script
npm run setup:cloudtrail

# Verify CloudTrail logging in AWS Console
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure AWS credentials and regions
# Set X-Ray and CloudTrail parameters
```

### 4. Application Deployment
```bash
# Start application with observability
npm start

# Verify health endpoint
curl http://localhost:3000/health
```

## Monitoring Best Practices

### 1. Trace Analysis
- Monitor service map for dependency changes
- Analyze trace timelines for performance bottlenecks
- Set up alerts for error rate increases
- Review sampling rates regularly

### 2. Log Analysis
- Implement log aggregation and search
- Set up automated anomaly detection
- Create compliance reports
- Monitor security events continuously

### 3. Performance Optimization
- Use X-Ray insights for optimization opportunities
- Monitor cold start times for Lambda functions
- Analyze database query performance
- Track API response times

### 4. Security Monitoring
- Review CloudTrail logs daily
- Investigate security alarms immediately
- Implement automated incident response
- Maintain audit trail integrity

## Compliance and Governance

### HIPAA Compliance
- All health data access logged
- User identity tracking
- Data access audit trails
- Encryption in transit and at rest

### SOC 2 Compliance
- Comprehensive activity logging
- Security monitoring
- Access control verification
- Incident response tracking

### Data Retention
- CloudTrail logs: 90 days in CloudWatch
- X-Ray traces: 30 days retention
- Long-term storage in S3
- Automated lifecycle policies

## Troubleshooting

### Common Issues

#### X-Ray Not Receiving Traces
1. Check IAM permissions for X-Ray
2. Verify X-Ray daemon is running
3. Check sampling rules configuration
4. Validate service name consistency

#### CloudTrail Logs Missing
1. Verify CloudTrail is enabled
2. Check S3 bucket permissions
3. Validate CloudWatch Logs role
4. Review event selectors

#### High Observability Costs
1. Optimize sampling rates
2. Review log retention periods
3. Implement intelligent filtering
4. Use cost allocation tags

### Support Resources
- AWS X-Ray Documentation
- AWS CloudTrail User Guide
- Application Performance Monitoring Best Practices
- Security Logging Guidelines

---

**Last Updated**: June 30, 2025  
**Status**: ✅ Fully Implemented and Operational
