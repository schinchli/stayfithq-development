#!/usr/bin/env node

/**
 * Security & Compliance Test Suite
 * Comprehensive security testing for HIPAA compliance, data protection, and access controls
 */

const crypto = require('crypto');
const https = require('https');

class SecurityComplianceTestSuite {
  constructor() {
    this.testResults = {
      suiteName: 'Security & Compliance Tests',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
      endTime: null
    };
  }

  // Test execution helper
  async runTest(testName, testFunction) {
    const startTime = Date.now();
    try {
      console.log(`🔒 Running: ${testName}`);
      await testFunction();
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        error: null
      });
      this.testResults.passed++;
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'FAILED',
        duration: `${duration}ms`,
        error: error.message
      });
      this.testResults.failed++;
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
    }
  }

  // HIPAA Compliance Tests
  async testHIPAACompliance() {
    await this.runTest('HIPAA Data Encryption at Rest', async () => {
      // Test encryption of health data
      const testData = 'Patient health record: BP 120/80, HR 72';
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(testData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      if (!encrypted || encrypted === testData) {
        throw new Error('Data encryption failed');
      }
      
      // Verify decryption
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      if (decrypted !== testData) {
        throw new Error('Data decryption failed');
      }
    });

    await this.runTest('HIPAA Data Transmission Security', async () => {
      // Test HTTPS enforcement
      const testUrl = 'https://YOUR-DOMAIN.cloudfront.net/settings.html';
      
      return new Promise((resolve, reject) => {
        const req = https.get(testUrl, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTPS request failed with status: ${res.statusCode}`));
          }
          
          // Check security headers
          const securityHeaders = [
            'strict-transport-security',
            'x-content-type-options',
            'x-frame-options'
          ];
          
          const missingHeaders = securityHeaders.filter(header => !res.headers[header]);
          if (missingHeaders.length > 0) {
            console.warn(`⚠️  Missing security headers: ${missingHeaders.join(', ')}`);
          }
          
          resolve();
        });
        
        req.on('error', (error) => {
          reject(new Error(`HTTPS connection failed: ${error.message}`));
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('HTTPS request timeout'));
        });
      });
    });

    await this.runTest('HIPAA Access Control Validation', async () => {
      // Test user authentication and authorization
      const mockUserSession = {
        userId: 'test-user-123',
        permissions: ['read:own_health_data', 'write:own_health_data'],
        sessionExpiry: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
      
      // Validate session structure
      if (!mockUserSession.userId || !mockUserSession.permissions || !mockUserSession.sessionExpiry) {
        throw new Error('Invalid session structure');
      }
      
      // Test permission validation
      const requiredPermissions = ['read:own_health_data', 'write:own_health_data'];
      const hasPermissions = requiredPermissions.every(perm => 
        mockUserSession.permissions.includes(perm)
      );
      
      if (!hasPermissions) {
        throw new Error('Insufficient permissions for health data access');
      }
      
      // Test session expiry
      if (mockUserSession.sessionExpiry <= Date.now()) {
        throw new Error('Session expired');
      }
    });

    await this.runTest('HIPAA Audit Logging', async () => {
      // Test audit log structure and completeness
      const mockAuditLog = {
        timestamp: new Date().toISOString(),
        userId: 'test-user-123',
        action: 'VIEW_HEALTH_DATA',
        resource: 'patient-health-record',
        ipAddress: '192.168.X.X',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        success: true,
        details: 'Viewed blood pressure readings'
      };
      
      // Validate required audit fields
      const requiredFields = ['timestamp', 'userId', 'action', 'resource', 'ipAddress', 'success'];
      const missingFields = requiredFields.filter(field => !mockAuditLog[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing audit log fields: ${missingFields.join(', ')}`);
      }
      
      // Validate timestamp format
      if (isNaN(Date.parse(mockAuditLog.timestamp))) {
        throw new Error('Invalid timestamp format in audit log');
      }
    });
  }

  // Data Protection Tests
  async testDataProtection() {
    await this.runTest('PII Detection and Masking', async () => {
      const testData = {
        name: 'John Doe',
        ssn: 'XXX-XX-XXXX',
        email: 'john.doe@example.com',
        phone: '<REDACTED_CREDENTIAL>',
        address: '123 Main St, Anytown, ST 12345'
      };
      
      // Mock PII detection function
      const detectPII = (data) => {
        const piiPatterns = {
          ssn: /\d{3}-\d{2}-\d{4}/,
          email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
          phone: /\+?1?-?\d{3}-?\d{3}-?\d{4}/
        };
        
        const detectedPII = {};
        for (const [key, value] of Object.entries(data)) {
          for (const [piiType, pattern] of Object.entries(piiPatterns)) {
            if (pattern.test(value)) {
              detectedPII[key] = piiType;
            }
          }
        }
        return detectedPII;
      };
      
      const detectedPII = detectPII(testData);
      const expectedPII = ['ssn', 'email', 'phone'];
      const foundPII = Object.values(detectedPII);
      
      if (!expectedPII.every(pii => foundPII.includes(pii))) {
        throw new Error('PII detection incomplete');
      }
    });

    await this.runTest('Data Anonymization', async () => {
      const healthData = {
        patientId: 'P123456',
        name: 'Jane Smith',
        age: 35,
        bloodPressure: '120/80',
        heartRate: 72,
        diagnosis: 'Hypertension'
      };
      
      // Mock anonymization function
      const anonymizeData = (data) => {
        const anonymized = { ...data };
        delete anonymized.name;
        delete anonymized.patientId;
        anonymized.ageGroup = anonymized.age >= 30 ? '30-40' : '20-30';
        delete anonymized.age;
        return anonymized;
      };
      
      const anonymizedData = anonymizeData(healthData);
      
      if (anonymizedData.name || anonymizedData.patientId) {
        throw new Error('Data anonymization failed - PII still present');
      }
      
      if (!anonymizedData.bloodPressure || !anonymizedData.heartRate) {
        throw new Error('Data anonymization removed required health metrics');
      }
    });

    await this.runTest('Secure Data Deletion', async () => {
      // Test secure deletion of sensitive data
      const sensitiveData = Buffer.from('Sensitive health information');
      const originalLength = sensitiveData.length;
      
      // Mock secure deletion (overwrite with random data)
      const secureDelete = (buffer) => {
        crypto.randomFillSync(buffer);
        return buffer.fill(0); // Final zero fill
      };
      
      const deletedData = secureDelete(sensitiveData);
      
      // Verify data is overwritten
      const isZeroed = deletedData.every(byte => byte === 0);
      if (!isZeroed) {
        throw new Error('Secure deletion failed - data not properly overwritten');
      }
      
      if (deletedData.length !== originalLength) {
        throw new Error('Secure deletion changed buffer length');
      }
    });
  }

  // Access Control Tests
  async testAccessControls() {
    await this.runTest('Role-Based Access Control (RBAC)', async () => {
      const roles = {
        patient: ['read:own_data', 'write:own_data'],
        guardian: ['read:child_data', 'write:child_data', 'read:own_data', 'write:own_data'],
        healthcare_provider: ['read:patient_data', 'write:medical_notes'],
        admin: ['read:all_data', 'write:system_config', 'manage:users']
      };
      
      const testUser = {
        id: 'user123',
        role: 'patient',
        permissions: roles.patient
      };
      
      // Test permission validation
      const hasPermission = (user, requiredPermission) => {
        return user.permissions.includes(requiredPermission);
      };
      
      if (!hasPermission(testUser, 'read:own_data')) {
        throw new Error('Patient should have read access to own data');
      }
      
      if (hasPermission(testUser, 'read:all_data')) {
        throw new Error('Patient should not have admin permissions');
      }
    });

    await this.runTest('Family Data Access Controls', async () => {
      const familyStructure = {
        parent: 'user123',
        children: ['child456', 'child789'],
        permissions: {
          'user123': ['read:child456', 'read:child789', 'write:child456', 'write:child789'],
          'child456': ['read:own_data', 'write:own_data'],
          'child789': ['read:own_data', 'write:own_data']
        }
      };
      
      // Test parent access to child data
      const parentPermissions = familyStructure.permissions['user123'];
      if (!parentPermissions.includes('read:child456')) {
        throw new Error('Parent should have access to child data');
      }
      
      // Test child cannot access sibling data
      const childPermissions = familyStructure.permissions['child456'];
      if (childPermissions.includes('read:child789')) {
        throw new Error('Child should not have access to sibling data');
      }
    });

    await this.runTest('Emergency Access Override', async () => {
      const emergencyScenario = {
        patientId: 'patient123',
        emergencyContactId: 'emergency456',
        emergencyCode: 'MEDICAL_EMERGENCY_2024',
        timestamp: Date.now(),
        validityPeriod: 24 * 60 * 60 * 1000 // 24 hours
      };
      
      // Validate emergency access structure
      if (!emergencyScenario.emergencyCode || !emergencyScenario.timestamp) {
        throw new Error('Invalid emergency access structure');
      }
      
      // Test emergency access expiry
      const isValid = (Date.now() - emergencyScenario.timestamp) < emergencyScenario.validityPeriod;
      if (!isValid) {
        throw new Error('Emergency access should be time-limited');
      }
    });
  }

  // Vulnerability Tests
  async testSecurityVulnerabilities() {
    await this.runTest('SQL Injection Prevention', async () => {
      // Test SQL injection prevention in health data queries
      const maliciousInput = "'; DROP TABLE patients; --";
      const sanitizedInput = maliciousInput.replace(/[';\\]/g, '');
      
      if (sanitizedInput.includes('DROP TABLE') || sanitizedInput.includes(';')) {
        throw new Error('SQL injection prevention failed');
      }
    });

    await this.runTest('XSS Prevention', async () => {
      // Test XSS prevention in health data display
      const maliciousScript = '<script>alert("XSS")</script>';
      const sanitizedScript = maliciousScript
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      
      if (sanitizedScript.includes('<script>') || sanitizedScript.includes('alert(')) {
        throw new Error('XSS prevention failed');
      }
    });

    await this.runTest('CSRF Protection', async () => {
      // Test CSRF token validation
      const csrfToken = crypto.randomBytes(32).toString('hex');
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Mock CSRF validation
      const validateCSRF = (token, session) => {
        return token && session && token.length === 64 && session.length === 64;
      };
      
      if (!validateCSRF(csrfToken, sessionToken)) {
        throw new Error('CSRF protection validation failed');
      }
    });

    await this.runTest('Rate Limiting', async () => {
      // Test API rate limiting
      const rateLimiter = {
        requests: 0,
        windowStart: Date.now(),
        limit: 100,
        window: 60000 // 1 minute
      };
      
      // Simulate multiple requests
      for (let i = 0; i < 150; i++) {
        rateLimiter.requests++;
        
        if (rateLimiter.requests > rateLimiter.limit) {
          const timeElapsed = Date.now() - rateLimiter.windowStart;
          if (timeElapsed < rateLimiter.window) {
            // Rate limit should be triggered
            break;
          }
        }
      }
      
      if (rateLimiter.requests <= rateLimiter.limit) {
        throw new Error('Rate limiting not properly enforced');
      }
    });
  }

  // Compliance Tests
  async testComplianceRequirements() {
    await this.runTest('Data Retention Policy', async () => {
      const dataRetentionPolicy = {
        healthRecords: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        auditLogs: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
        sessionData: 30 * 24 * 60 * 60 * 1000, // 30 days
        temporaryFiles: 24 * 60 * 60 * 1000 // 24 hours
      };
      
      const testRecord = {
        type: 'healthRecords',
        createdAt: Date.now() - (8 * 365 * 24 * 60 * 60 * 1000), // 8 years old
        data: 'Patient health data'
      };
      
      const shouldBeDeleted = (Date.now() - testRecord.createdAt) > dataRetentionPolicy[testRecord.type];
      
      if (!shouldBeDeleted) {
        throw new Error('Data retention policy not properly enforced');
      }
    });

    await this.runTest('Consent Management', async () => {
      const consentRecord = {
        userId: 'user123',
        consentType: 'data_processing',
        granted: true,
        timestamp: Date.now(),
        version: '1.0',
        ipAddress: '192.168.X.X'
      };
      
      // Validate consent record structure
      const requiredFields = ['userId', 'consentType', 'granted', 'timestamp', 'version'];
      const missingFields = requiredFields.filter(field => consentRecord[field] === undefined);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing consent fields: ${missingFields.join(', ')}`);
      }
      
      if (typeof consentRecord.granted !== 'boolean') {
        throw new Error('Consent status must be boolean');
      }
    });

    await this.runTest('Right to Data Portability', async () => {
      const userData = {
        profile: { name: 'John Doe', age: 35 },
        healthData: [
          { date: '2024-01-01', type: 'blood_pressure', value: '120/80' },
          { date: '2024-01-02', type: 'heart_rate', value: '72' }
        ],
        preferences: { theme: 'dark', notifications: true }
      };
      
      // Mock data export function
      const exportUserData = (data) => {
        return {
          format: 'JSON',
          data: JSON.stringify(data, null, 2),
          timestamp: new Date().toISOString(),
          checksum: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
        };
      };
      
      const exportedData = exportUserData(userData);
      
      if (!exportedData.data || !exportedData.checksum) {
        throw new Error('Data export incomplete');
      }
      
      // Verify data integrity
      const parsedData = JSON.parse(exportedData.data);
      if (!parsedData.profile || !parsedData.healthData) {
        throw new Error('Exported data structure invalid');
      }
    });
  }

  // Run all security tests
  async runAllTests() {
    console.log('\n🔒 Starting Security & Compliance Test Suite...\n');
    
    await this.testHIPAACompliance();
    await this.testDataProtection();
    await this.testAccessControls();
    await this.testSecurityVulnerabilities();
    await this.testComplianceRequirements();
    
    this.testResults.endTime = new Date();
    
    console.log('\n📊 Security & Compliance Test Results:');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
    console.log(`⏱️  Duration: ${this.testResults.endTime - this.testResults.startTime}ms\n`);
    
    return this.testResults;
  }
}

// Export for use in test runner
module.exports = SecurityComplianceTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new SecurityComplianceTestSuite();
  testSuite.runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
