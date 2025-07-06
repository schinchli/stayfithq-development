/**
 * Enhanced Security Framework
 * Comprehensive security implementation for healthcare applications
 * Includes encryption, authentication, authorization, and threat detection
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

class EnhancedSecurityFramework {
    constructor() {
        this.encryptionAlgorithm = 'aes-256-gcm';
        this.hashAlgorithm = 'sha256';
        this.saltRounds = 12;
        
        this.securityLogger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/security-events.log' }),
                new winston.transports.CloudWatchLogs({
                    logGroupName: '/aws/lambda/security-events',
                    logStreamName: 'security-framework-stream'
                })
            ]
        });

        // Security configuration
        this.config = {
            jwtSecret: process.env.JWT_SECRET || this.generateSecureKey(),
            encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecureKey(),
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
            lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
            passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12,
            mfaRequired: process.env.MFA_REQUIRED === 'true',
            auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 2555 // 7 years for HIPAA
        };

        // Threat detection patterns
        this.threatPatterns = {
            sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(\-\-)|(\;)|(\|)|(\*)|(\%27)|(\%3B)|(\%7C)/i,
            xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            pathTraversal: /(\.\.[\/\\])|(\.\.[\\\/])/,
            commandInjection: /(\||&|;|\$\(|\`)/,
            ldapInjection: /(\*|\(|\)|\||&)/
        };

        // Initialize security middleware
        this.initializeSecurityMiddleware();
    }

    /**
     * Authentication & Authorization
     */
    
    async authenticateUser(credentials) {
        const authEvent = {
            eventType: 'USER_AUTHENTICATION_ATTEMPT',
            username = "your_username".username,
            timestamp: new Date().toISOString(),
            eventId: uuidv4(),
            ipAddress: credentials.ipAddress,
            userAgent: credentials.userAgent
        };

        try {
            // Check for account lockout
            if (await this.isAccountLocked(credentials.username)) {
                authEvent.result = 'ACCOUNT_LOCKED';
                this.securityLogger.warn('Authentication attempt on locked account', authEvent);
                throw new Error('Account is temporarily locked due to multiple failed attempts');
            }

            // Validate credentials
            const <REDACTED_CREDENTIAL>this.validateCredentials(credentials.username, credentials.password);
            
            if (!user) {
                await this.recordFailedAttempt(credentials.username);
                authEvent.result = 'INVALID_CREDENTIALS';
                this.securityLogger.warn('Invalid credentials provided', authEvent);
                throw new Error('Invalid username or password');
            }

            // Check MFA if required
            if (this.config.mfaRequired && !await this.validateMFA(user.id, credentials.mfaToken)) {
                authEvent.result = 'MFA_REQUIRED';
                this.securityLogger.warn('MFA validation failed', authEvent);
                throw new Error('Multi-factor authentication required');
            }

            // Generate JWT token
            const token = this.generateJWT(user);
            
            // Reset failed attempts
            await this.resetFailedAttempts(credentials.username);
            
            authEvent.result = 'SUCCESS';
            authEvent.userId = user.id;
            this.securityLogger.info('User authenticated successfully', authEvent);

            return {
                <REDACTED_CREDENTIAL>.sanitizeUserData(user),
                token,
                expiresAt: new Date(Date.now() + this.config.sessionTimeout).toISOString()
            };

        } catch (error) {
            authEvent.result = 'ERROR';
            authEvent.error = error.message;
            this.securityLogger.error('Authentication error', authEvent);
            throw error;
        }
    }

    generateJWT(user) {
        const payload = {
            userId: user.id,
            username = "your_username".username,
            roles: user.roles,
            permissions: user.permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor((Date.now() + this.config.sessionTimeout) / 1000)
        };

        return jwt.sign(payload, this.config.jwtSecret, {
            algorithm: 'HS256',
            issuer: 'healthhq-security-framework',
            audience: 'healthhq-application'
        });
    }

    verifyJWT(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret, {
                algorithms: ['HS256'],
                issuer: 'healthhq-security-framework',
                audience: 'healthhq-application'
            });

            // Check if token is expired
            if (decoded.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Token expired');
            }

            return decoded;
        } catch (error) {
            this.securityLogger.warn('JWT verification failed', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error('Invalid or expired token');
        }
    }

    async authorizeAccess(userId, resource, action, context = {}) {
        const authzEvent = {
            eventType: 'AUTHORIZATION_CHECK',
            userId,
            resource,
            action,
            context,
            timestamp: new Date().toISOString(),
            eventId: uuidv4()
        };

        try {
            const <REDACTED_CREDENTIAL>this.getUser(userId);
            if (!user) {
                authzEvent.result = 'USER_NOT_FOUND';
                this.securityLogger.warn('Authorization failed - user not found', authzEvent);
                return false;
            }

            // Check role-based permissions
            const hasRolePermission = await this.checkRolePermission(user.roles, resource, action);
            
            // Check attribute-based permissions
            const hasAttributePermission = await this.checkAttributePermission(user, resource, action, context);
            
            // Check resource-specific permissions
            const hasResourcePermission = await this.checkResourcePermission(userId, resource, action);

            const authorized = hasRolePermission && hasAttributePermission && hasResourcePermission;
            
            authzEvent.result = authorized ? 'AUTHORIZED' : 'DENIED';
            authzEvent.rolePermission = hasRolePermission;
            authzEvent.attributePermission = hasAttributePermission;
            authzEvent.resourcePermission = hasResourcePermission;

            if (authorized) {
                this.securityLogger.info('Access authorized', authzEvent);
            } else {
                this.securityLogger.warn('Access denied', authzEvent);
            }

            return authorized;

        } catch (error) {
            authzEvent.result = 'ERROR';
            authzEvent.error = error.message;
            this.securityLogger.error('Authorization error', authzEvent);
            return false;
        }
    }

    /**
     * Data Encryption & Decryption
     */
    
    encryptSensitiveData(data, additionalData = '') {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.encryptionAlgorithm, this.config.encryptionKey);
            
            if (additionalData) {
                cipher.setAAD(Buffer.from(additionalData));
            }

            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            const encryptedData = {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.encryptionAlgorithm,
                timestamp: new Date().toISOString()
            };

            this.securityLogger.info('Data encrypted', {
                dataSize: JSON.stringify(data).length,
                encryptedSize: encrypted.length,
                timestamp: new Date().toISOString()
            });

            return encryptedData;

        } catch (error) {
            this.securityLogger.error('Encryption failed', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error('Data encryption failed');
        }
    }

    decryptSensitiveData(encryptedData, additionalData = '') {
        try {
            const decipher = crypto.createDecipher(
                encryptedData.algorithm,
                this.config.encryptionKey
            );

            if (additionalData) {
                decipher.setAAD(Buffer.from(additionalData));
            }

            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            this.securityLogger.info('Data decrypted', {
                timestamp: new Date().toISOString()
            });

            return JSON.parse(decrypted);

        } catch (error) {
            this.securityLogger.error('Decryption failed', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error('Data decryption failed');
        }
    }

    /**
     * Password Security
     */
    
    async hashPassword(password) {
        // Validate password strength
        if (!this.validatePasswordStrength(password)) {
            throw new Error('Password does not meet security requirements');
        }

        const salt = await bcrypt.genSalt(this.saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        this.securityLogger.info('Password hashed', {
            timestamp: new Date().toISOString()
        });

        return hashedPassword;
    }

    async verifyPassword(password, hashedPassword) {
        const isValid = await bcrypt.compare(password, hashedPassword);
        
        this.securityLogger.info('Password verification', {
            result: isValid ? 'VALID' : 'INVALID',
            timestamp: new Date().toISOString()
        });

        return isValid;
    }

    validatePasswordStrength(password) {
        const requirements = {
            minLength: password.length >= this.config.passwordMinLength,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            noCommonPatterns: !this.containsCommonPatterns(password)
        };

        const isValid = Object.values(requirements).every(req => req === true);

        this.securityLogger.info('Password strength validation', {
            requirements,
            isValid,
            timestamp: new Date().toISOString()
        });

        return isValid;
    }

    /**
     * Threat Detection & Prevention
     */
    
    detectThreats(input, context = {}) {
        const threats = [];
        const detectionEvent = {
            eventType: 'THREAT_DETECTION',
            input: this.sanitizeForLogging(input),
            context,
            timestamp: new Date().toISOString(),
            eventId: uuidv4()
        };

        // Check for various threat patterns
        for (const [threatType, pattern] of Object.entries(this.threatPatterns)) {
            if (pattern.test(input)) {
                threats.push({
                    type: threatType,
                    severity: this.getThreatSeverity(threatType),
                    pattern: pattern.toString(),
                    matched: true
                });
            }
        }

        // Check for suspicious patterns
        const suspiciousPatterns = this.detectSuspiciousPatterns(input);
        threats.push(...suspiciousPatterns);

        detectionEvent.threats = threats;
        detectionEvent.threatCount = threats.length;

        if (threats.length > 0) {
            this.securityLogger.warn('Threats detected', detectionEvent);
            
            // Auto-block high-severity threats
            const highSeverityThreats = threats.filter(t => t.severity === 'HIGH' || t.severity === 'CRITICAL');
            if (highSeverityThreats.length > 0) {
                this.triggerSecurityResponse(detectionEvent);
            }
        }

        return {
            hasThreats: threats.length > 0,
            threats,
            riskScore: this.calculateRiskScore(threats)
        };
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        // Remove potentially dangerous characters
        let sanitized = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/[<>'"]/g, '');

        // Encode special characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        return sanitized;
    }

    /**
     * Session Management
     */
    
    createSecureSession(userId, sessionData = {}) {
        const sessionId = uuidv4();
        const session = {
            sessionId,
            userId,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.config.sessionTimeout).toISOString(),
            ipAddress: sessionData.ipAddress,
            userAgent: sessionData.userAgent,
            data: sessionData.data || {}
        };

        // Store session (implementation would use Redis or database)
        this.storeSession(sessionId, session);

        this.securityLogger.info('Secure session created', {
            sessionId,
            userId,
            timestamp: new Date().toISOString()
        });

        return sessionId;
    }

    validateSession(sessionId) {
        const session = this.getSession(sessionId);
        
        if (!session) {
            this.securityLogger.warn('Session validation failed - not found', {
                sessionId,
                timestamp: new Date().toISOString()
            });
            return null;
        }

        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
            this.destroySession(sessionId);
            this.securityLogger.warn('Session validation failed - expired', {
                sessionId,
                timestamp: new Date().toISOString()
            });
            return null;
        }

        // Update last activity
        session.lastActivity = new Date().toISOString();
        this.storeSession(sessionId, session);

        return session;
    }

    destroySession(sessionId) {
        this.removeSession(sessionId);
        
        this.securityLogger.info('Session destroyed', {
            sessionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Security Middleware
     */
    
    initializeSecurityMiddleware() {
        // Rate limiting
        this.rateLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.securityLogger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
                res.status(429).json({ error: 'Rate limit exceeded' });
            }
        });

        // Helmet configuration for security headers
        this.helmetConfig = helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://api.healthhq.com"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }

    /**
     * Audit & Compliance
     */
    
    logSecurityEvent(eventType, details) {
        const auditEvent = {
            eventType,
            details,
            timestamp: new Date().toISOString(),
            eventId: uuidv4(),
            source: 'enhanced-security-framework'
        };

        this.securityLogger.info('Security event logged', auditEvent);
        
        // Store in compliance database for long-term retention
        this.storeComplianceEvent(auditEvent);
    }

    generateSecurityReport(startDate, endDate) {
        const report = {
            reportId: uuidv4(),
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            summary: {
                totalEvents: 0,
                authenticationEvents: 0,
                authorizationEvents: 0,
                threatDetections: 0,
                securityIncidents: 0
            },
            details: []
        };

        // Implementation would query audit logs and generate comprehensive report
        this.securityLogger.info('Security report generated', {
            reportId: report.reportId,
            period: report.period
        });

        return report;
    }

    /**
     * Utility Methods
     */
    
    generateSecureKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    sanitizeForLogging(input) {
        if (typeof input !== 'string') {
            return input;
        }
        // Remove sensitive data patterns for logging
        return input.replace(/password|token|key|secret/gi, '[REDACTED]');
    }

    containsCommonPatterns(password) {
        const commonPatterns = [
            'password', '123456', 'qwerty', 'admin', 'letmein',
            'welcome', 'monkey', 'dragon', 'master', 'shadow'
        ];
        return commonPatterns.some(pattern => 
            password.toLowerCase().includes(pattern)
        );
    }

    getThreatSeverity(threatType) {
        const severityMap = {
            sqlInjection: 'CRITICAL',
            xss: 'HIGH',
            pathTraversal: 'HIGH',
            commandInjection: 'CRITICAL',
            ldapInjection: 'HIGH'
        };
        return severityMap[threatType] || 'MEDIUM';
    }

    detectSuspiciousPatterns(input) {
        const patterns = [];
        
        // Check for excessive special characters
        if ((input.match(/[!@#$%^&*()]/g) || []).length > input.length * 0.3) {
            patterns.push({
                type: 'excessive_special_chars',
                severity: 'MEDIUM',
                matched: true
            });
        }

        // Check for base64 encoded content
        if (/^[A-Za-z0-9+/]+=*$/.test(input) && input.length > 20) {
            patterns.push({
                type: 'base64_content',
                severity: 'MEDIUM',
                matched: true
            });
        }

        return patterns;
    }

    calculateRiskScore(threats) {
        const severityScores = {
            'LOW': 1,
            'MEDIUM': 3,
            'HIGH': 7,
            'CRITICAL': 10
        };

        return threats.reduce((score, threat) => {
            return score + (severityScores[threat.severity] || 1);
        }, 0);
    }

    triggerSecurityResponse(detectionEvent) {
        // Implementation for automated security response
        this.securityLogger.error('Security response triggered', detectionEvent);
    }

    // Placeholder methods for external integrations
    async validateCredentials(username, password) { return null; }
    async isAccountLocked(username) { return false; }
    async recordFailedAttempt(username) { }
    async resetFailedAttempts(username) { }
    async validateMFA(userId, token) { return true; }
    async getUser(userId) { return null; }
    async checkRolePermission(roles, resource, action) { return true; }
    async checkAttributePermission(user, resource, action, context) { return true; }
    async checkResourcePermission(userId, resource, action) { return true; }
    sanitizeUserData(user) { return user; }
    storeSession(sessionId, session) { }
    getSession(sessionId) { return null; }
    removeSession(sessionId) { }
    storeComplianceEvent(event) { }
}

module.exports = EnhancedSecurityFramework;
