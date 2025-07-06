/**
 * CloudTrail Logger for StayFit Health Companion
 * Provides comprehensive audit logging and compliance tracking
 */

const winston = require('winston');
const CloudWatchLogs = require('winston-cloudwatch');
const { v4: uuidv4 } = require('uuid');

class CloudTrailLogger {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: {
                service: 'stayfit-health-companion',
                version: '1.0.0'
            },
            transports: [
                // Console logging for development
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                
                // CloudWatch Logs for production
                new CloudWatchLogs({
                    logGroupName: '/aws/stayfit/health-companion',
                    logStreamName: `health-companion-${new Date().toISOString().split('T')[0]}`,
                    awsRegion: process.env.AWS_REGION || 'your-aws-region',
                    jsonMessage: true,
                    retentionInDays: 30
                })
            ]
        });
    }

    /**
     * Log API access events
     */
    logAPIAccess(req, res, responseTime) {
        const eventData = {
            eventVersion: '1.0',
            userIdentity: {
                type: 'WebUser',
                principalId: req.sessionID || 'anonymous',
                arn: null,
                accountId: process.env.AWS_ACCOUNT_ID,
                accessKeyId: null,
                username = "your_username".user?.username || 'anonymous',
                sessionContext: {
                    attributes: {
                        mfaAuthenticated: 'false',
                        creationDate: new Date().toISOString()
                    }
                }
            },
            eventTime: new Date().toISOString(),
            eventSource: 'stayfit-health-companion',
            eventName: 'APIAccess',
            awsRegion: process.env.AWS_REGION || 'your-aws-region',
            sourceIPAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            requestParameters: {
                method: req.method,
                url: req.url,
                headers: this.sanitizeHeaders(req.headers),
                query: req.query,
                body: this.sanitizeBody(req.body)
            },
            responseElements: {
                statusCode: res.statusCode,
                responseTime: responseTime,
                contentLength: res.get('Content-Length') || 0
            },
            requestID: req.requestId || uuidv4(),
            eventID: uuidv4(),
            eventType: 'AwsApiCall',
            recipientAccountId: process.env.AWS_ACCOUNT_ID,
            serviceEventDetails: {
                responseElements: {
                    success: res.statusCode < 400
                }
            }
        };

        this.logger.info('API Access Event', eventData);
    }

    /**
     * Log health data access events
     */
    logHealthDataAccess(req, dataType, operation, result) {
        const eventData = {
            eventVersion: '1.0',
            userIdentity: {
                type: 'WebUser',
                principalId: req.sessionID || 'anonymous',
                username = "your_username".user?.username || 'anonymous'
            },
            eventTime: new Date().toISOString(),
            eventSource: 'stayfit-health-companion',
            eventName: 'HealthDataAccess',
            awsRegion: process.env.AWS_REGION || 'your-aws-region',
            sourceIPAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestParameters: {
                dataType: dataType,
                operation: operation,
                timestamp: new Date().toISOString()
            },
            responseElements: {
                success: result.success,
                recordCount: result.recordCount || 0,
                dataSize: result.dataSize || 0
            },
            requestID: req.requestId || uuidv4(),
            eventID: uuidv4(),
            eventType: 'DataAccess',
            resources: [{
                accountId: process.env.AWS_ACCOUNT_ID,
                type: 'HealthData',
                ARN: `arn:aws:stayfit:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:health-data/${dataType}`
            }]
        };

        this.logger.info('Health Data Access Event', eventData);
    }

    /**
     * Log AI interaction events
     */
    logAIInteraction(req, aiService, query, response) {
        const eventData = {
            eventVersion: '1.0',
            userIdentity: {
                type: 'WebUser',
                principalId: req.sessionID || 'anonymous',
                username = "your_username".user?.username || 'anonymous'
            },
            eventTime: new Date().toISOString(),
            eventSource: 'stayfit-health-companion',
            eventName: 'AIInteraction',
            awsRegion: process.env.AWS_REGION || 'your-aws-region',
            sourceIPAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestParameters: {
                aiService: aiService,
                queryLength: query?.length || 0,
                queryType: this.classifyQuery(query)
            },
            responseElements: {
                success: response.success,
                responseLength: response.content?.length || 0,
                processingTime: response.processingTime || 0,
                tokensUsed: response.tokensUsed || 0
            },
            requestID: req.requestId || uuidv4(),
            eventID: uuidv4(),
            eventType: 'AIService',
            resources: [{
                accountId: process.env.AWS_ACCOUNT_ID,
                type: 'AIService',
                ARN: `arn:aws:bedrock:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:model/${aiService}`
            }]
        };

        this.logger.info('AI Interaction Event', eventData);
    }

    /**
     * Log security events
     */
    logSecurityEvent(req, eventType, details) {
        const eventData = {
            eventVersion: '1.0',
            userIdentity: {
                type: 'WebUser',
                principalId: req.sessionID || 'anonymous',
                username = "your_username".user?.username || 'anonymous'
            },
            eventTime: new Date().toISOString(),
            eventSource: 'stayfit-health-companion',
            eventName: 'SecurityEvent',
            awsRegion: process.env.AWS_REGION || 'your-aws-region',
            sourceIPAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestParameters: {
                eventType: eventType,
                details: details,
                severity: this.getSeverityLevel(eventType)
            },
            requestID: req.requestId || uuidv4(),
            eventID: uuidv4(),
            eventType: 'SecurityEvent'
        };

        this.logger.warn('Security Event', eventData);
    }

    /**
     * Log error events
     */
    logError(req, error, context) {
        const eventData = {
            eventVersion: '1.0',
            userIdentity: {
                type: 'WebUser',
                principalId: req?.sessionID || 'system',
                username = "your_username"?.user?.username || 'system'
            },
            eventTime: new Date().toISOString(),
            eventSource: 'stayfit-health-companion',
            eventName: 'ErrorEvent',
            awsRegion: process.env.AWS_REGION || 'your-aws-region',
            sourceIPAddress: req?.ip || 'internal',
            errorCode: error.code || 'UNKNOWN_ERROR',
            errorMessage: error.message,
            requestParameters: {
                context: context,
                stack: error.stack,
                url: req?.url,
                method: req?.method
            },
            requestID: req?.requestId || uuidv4(),
            eventID: uuidv4(),
            eventType: 'ErrorEvent'
        };

        this.logger.error('Error Event', eventData);
    }

    /**
     * Sanitize headers for logging
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        return sanitized;
    }

    /**
     * Sanitize request body for logging
     */
    sanitizeBody(body) {
        if (!body) return {};
        
        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.apiKey;
        delete sanitized.secret;
        
        return sanitized;
    }

    /**
     * Classify query type for AI interactions
     */
    classifyQuery(query) {
        if (!query) return 'unknown';
        
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('health') || lowerQuery.includes('medical')) return 'health';
        if (lowerQuery.includes('chart') || lowerQuery.includes('data')) return 'analytics';
        if (lowerQuery.includes('report') || lowerQuery.includes('summary')) return 'reporting';
        
        return 'general';
    }

    /**
     * Get severity level for security events
     */
    getSeverityLevel(eventType) {
        const severityMap = {
            'unauthorized_access': 'HIGH',
            'failed_login': 'MEDIUM',
            'suspicious_activity': 'HIGH',
            'data_breach': 'CRITICAL',
            'invalid_request': 'LOW'
        };
        
        return severityMap[eventType] || 'MEDIUM';
    }

    /**
     * Create middleware for automatic logging
     */
    createMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            req.requestId = uuidv4();
            
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.logAPIAccess(req, res, responseTime);
            });
            
            next();
        };
    }
}

module.exports = CloudTrailLogger;
