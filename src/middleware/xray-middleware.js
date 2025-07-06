/**
 * AWS X-Ray Middleware for StayFit Health Companion
 * Provides distributed tracing and performance monitoring
 */

const AWSXRay = require('aws-xray-sdk-core');
const express = require('express');

// Configure X-Ray
AWSXRay.config([
    AWSXRay.plugins.ECSPlugin,
    AWSXRay.plugins.EC2Plugin,
]);

// Capture AWS SDK calls
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

class XRayMiddleware {
    /**
     * Initialize X-Ray middleware
     */
    static init() {
        return AWSXRay.express.openSegment('StayFit-HealthCompanion');
    }

    /**
     * Close X-Ray segment
     */
    static close() {
        return AWSXRay.express.closeSegment();
    }

    /**
     * Create custom subsegment for health operations
     */
    static createHealthSubsegment(name, operation) {
        return (req, res, next) => {
            const segment = AWSXRay.getSegment();
            const subsegment = segment.addNewSubsegment(name);
            
            // Add metadata
            subsegment.addMetadata('health_operation', {
                operation: operation,
                timestamp: new Date().toISOString(),
                user_agent: req.get('User-Agent'),
                ip_address: req.ip,
                method: req.method,
                url: req.url
            });

            // Add annotations for filtering
            subsegment.addAnnotation('service', 'health-companion');
            subsegment.addAnnotation('operation', operation);
            subsegment.addAnnotation('environment', process.env.NODE_ENV || 'development');

            req.xraySubsegment = subsegment;
            
            res.on('finish', () => {
                subsegment.addAnnotation('response_code', res.statusCode);
                subsegment.addMetadata('response', {
                    status_code: res.statusCode,
                    content_length: res.get('Content-Length') || 0
                });
                subsegment.close();
            });

            next();
        };
    }

    /**
     * Trace AI operations
     */
    static traceAIOperation(operationType) {
        return this.createHealthSubsegment('AI-Operation', operationType);
    }

    /**
     * Trace health data operations
     */
    static traceHealthData(dataType) {
        return this.createHealthSubsegment('Health-Data', dataType);
    }

    /**
     * Trace AWS service calls
     */
    static traceAWSService(serviceName) {
        return this.createHealthSubsegment('AWS-Service', serviceName);
    }

    /**
     * Add custom trace data
     */
    static addTraceData(req, key, value) {
        if (req.xraySubsegment) {
            req.xraySubsegment.addMetadata(key, value);
        }
    }

    /**
     * Add trace annotation
     */
    static addTraceAnnotation(req, key, value) {
        if (req.xraySubsegment) {
            req.xraySubsegment.addAnnotation(key, value);
        }
    }

    /**
     * Error handling for X-Ray
     */
    static errorHandler() {
        return (err, req, res, next) => {
            const segment = AWSXRay.getSegment();
            if (segment) {
                segment.addError(err);
                segment.addAnnotation('error', true);
                segment.addMetadata('error_details', {
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                });
            }
            next(err);
        };
    }
}

module.exports = {
    XRayMiddleware,
    AWSXRay,
    AWS
};
