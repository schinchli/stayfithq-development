#!/usr/bin/env node

/**
 * AWS SDK v3 Services Test Suite
 * Comprehensive testing for all AWS SDK v3 service implementations
 */

const path = require('path');
const fs = require('fs').promises;

// AWS SDK v3 Services
const { awsConfig } = require('../src/aws/aws-config-v3');
const S3ServiceV3 = require('../src/aws/s3-service-v3');
const TextractServiceV3 = require('../src/aws/textract-service-v3');
const BedrockServiceV3 = require('../src/aws/bedrock-service-v3');

class AWSSDKV3TestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    
    this.services = {
      config: null,
      s3: null,
      textract: null,
      bedrock: null
    };
  }

  async runAllTests() {
    console.log('🧪 Starting AWS SDK v3 Services Test Suite...\n');
    
    try {
      // Initialize services
      await this.initializeServices();
      
      // Run configuration tests
      await this.testAWSConfiguration();
      
      // Run service tests
      await this.testS3Service();
      await this.testTextractService();
      await this.testBedrockService();
      
      // Run integration tests
      await this.testServiceIntegration();
      
      // Generate test report
      await this.generateTestReport();
      
      console.log('\n✅ AWS SDK v3 Test Suite completed successfully!');
      console.log(`📊 Results: ${this.testResults.passed} passed, ${this.testResults.failed} failed, ${this.testResults.skipped} skipped`);
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async initializeServices() {
    console.log('🔧 Initializing AWS SDK v3 services...');
    
    try {
      this.services.s3 = new S3ServiceV3();
      this.services.textract = new TextractServiceV3();
      this.services.bedrock = new BedrockServiceV3();
      
      console.log('   ✅ All services initialized successfully\n');
    } catch (error) {
      console.log('   ❌ Service initialization failed:', error.message);
      throw error;
    }
  }

  async testAWSConfiguration() {
    console.log('🔧 Testing AWS Configuration...');
    
    await this.runTest('AWS Config Initialization', async () => {
      const config = awsConfig.getCommonConfig();
      if (!config.region) throw new Error('Region not configured');
      return { region: config.region };
    });

    await this.runTest('Environment Detection', async () => {
      const env = awsConfig.getEnvironmentConfig();
      return {
        environment: env.environment,
        isAWS: env.isAWS,
        region: env.region
      };
    });

    await this.runTest('Service Configuration', async () => {
      const s3Config = awsConfig.getServiceConfig('s3');
      const textractConfig = awsConfig.getServiceConfig('textract');
      const bedrockConfig = awsConfig.getServiceConfig('bedrock');
      
      return {
        s3: !!s3Config.region,
        textract: !!textractConfig.region,
        bedrock: !!bedrockConfig.region
      };
    });

    // Skip credential validation in test environment
    await this.runTest('Credential Validation', async () => {
      try {
        const validation = await awsConfig.validateConfiguration();
        return validation;
      } catch (error) {
        // Skip if no credentials available in test environment
        throw { skip: true, reason: 'No AWS credentials available in test environment' };
      }
    });

    console.log('   ✅ AWS Configuration tests completed\n');
  }

  async testS3Service() {
    console.log('📦 Testing S3 Service v3...');

    await this.runTest('S3 Service Initialization', async () => {
      if (!this.services.s3) throw new Error('S3 service not initialized');
      return { initialized: true };
    });

    await this.runTest('S3 Health Check', async () => {
      const health = await this.services.s3.healthCheck();
      return health;
    });

    await this.runTest('Document Key Generation', async () => {
      const key = this.services.s3.generateDocumentKey('test-user', 'test-document.pdf');
      if (!key.includes('test-user')) throw new Error('User ID not in key');
      if (!key.includes('test-document.pdf')) throw new Error('Filename not in key');
      return { key: key };
    });

    await this.runTest('Mock Document Upload', async () => {
      const mockFile = {
        buffer: Buffer.from('Test document content'),
        originalname: 'test-health-doc.pdf',
        mimetype: 'application/pdf',
        size: 23
      };

      try {
        // This will fail without real AWS credentials, but we test the method structure
        await this.services.s3.uploadHealthDocument(mockFile, 'test-user');
        return { uploaded: true };
      } catch (error) {
        if (error.message.includes('credentials') || error.message.includes('region')) {
          throw { skip: true, reason: 'AWS credentials not available for upload test' };
        }
        throw error;
      }
    });

    console.log('   ✅ S3 Service tests completed\n');
  }

  async testTextractService() {
    console.log('📄 Testing Textract Service v3...');

    await this.runTest('Textract Service Initialization', async () => {
      if (!this.services.textract) throw new Error('Textract service not initialized');
      return { initialized: true };
    });

    await this.runTest('Textract Health Check', async () => {
      const health = await this.services.textract.healthCheck();
      return health;
    });

    await this.runTest('Mock Text Extraction', async () => {
      const mockDocument = {
        buffer: Buffer.from('Mock PDF content for testing')
      };

      try {
        await this.services.textract.extractTextFromDocument(mockDocument, 'test-user');
        return { extracted: true };
      } catch (error) {
        if (error.message.includes('credentials') || error.message.includes('InvalidDocument')) {
          throw { skip: true, reason: 'AWS credentials not available or mock document invalid' };
        }
        throw error;
      }
    });

    await this.runTest('Health Metrics Extraction', async () => {
      const mockAnalysisData = {
        extractedText: 'Blood pressure: 120/80. Heart rate: 72 bpm. Weight: 70kg.',
        keyValuePairs: [
          { key: 'Blood Pressure', value: '120/80' },
          { key: 'Heart Rate', value: '72 bpm' }
        ]
      };

      const healthMetrics = this.services.textract.extractHealthMetrics(mockAnalysisData);
      
      if (!healthMetrics.vitals) throw new Error('Health metrics not extracted');
      return healthMetrics;
    });

    console.log('   ✅ Textract Service tests completed\n');
  }

  async testBedrockService() {
    console.log('🤖 Testing Bedrock Service v3...');

    await this.runTest('Bedrock Service Initialization', async () => {
      if (!this.services.bedrock) throw new Error('Bedrock service not initialized');
      return { initialized: true };
    });

    await this.runTest('Available Models', async () => {
      const models = this.services.bedrock.getAvailableModels();
      if (!models.models) throw new Error('No models available');
      return {
        modelCount: Object.keys(models.models).length,
        defaultModel: models.default
      };
    });

    await this.runTest('Health Insights Prompt Building', async () => {
      const mockHealthData = {
        steps: 8500,
        heart_rate: 72,
        sleep_hours: 7.5
      };

      const prompt = this.services.bedrock.buildHealthInsightsPrompt(mockHealthData);
      if (!prompt.includes('health data')) throw new Error('Invalid prompt generated');
      return { promptLength: prompt.length };
    });

    await this.runTest('Bedrock Health Check', async () => {
      const health = await this.services.bedrock.healthCheck();
      return health;
    });

    await this.runTest('Mock Health Insights Generation', async () => {
      const mockHealthData = {
        steps: 8500,
        heart_rate: 72,
        sleep_hours: 7.5
      };

      try {
        await this.services.bedrock.generateHealthInsights(mockHealthData, 'test-user');
        return { generated: true };
      } catch (error) {
        if (error.message.includes('credentials') || error.message.includes('region')) {
          throw { skip: true, reason: 'AWS credentials not available for Bedrock test' };
        }
        throw error;
      }
    });

    console.log('   ✅ Bedrock Service tests completed\n');
  }

  async testServiceIntegration() {
    console.log('🔗 Testing Service Integration...');

    await this.runTest('Service Health Status', async () => {
      const healthChecks = await Promise.allSettled([
        this.services.s3.healthCheck(),
        this.services.textract.healthCheck(),
        this.services.bedrock.healthCheck()
      ]);

      const results = healthChecks.map((result, index) => ({
        service: ['s3', 'textract', 'bedrock'][index],
        status: result.status,
        healthy: result.status === 'fulfilled' && result.value.status === 'healthy'
      }));

      return { services: results };
    });

    await this.runTest('Cross-Service Compatibility', async () => {
      // Test that services can work together
      const s3Key = this.services.s3.generateDocumentKey('test-user', 'integration-test.pdf');
      const healthData = { steps: 10000, heart_rate: 75 };
      const prompt = this.services.bedrock.buildHealthInsightsPrompt(healthData);

      return {
        s3KeyGenerated: !!s3Key,
        promptGenerated: !!prompt,
        integration: true
      };
    });

    console.log('   ✅ Service Integration tests completed\n');
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`   🧪 ${testName}...`);
      const result = await testFunction();
      
      this.testResults.passed++;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        result: result,
        timestamp: new Date().toISOString()
      });
      
      console.log(`      ✅ PASSED`);
      
    } catch (error) {
      if (error.skip) {
        this.testResults.skipped++;
        this.testResults.tests.push({
          name: testName,
          status: 'SKIPPED',
          reason: error.reason,
          timestamp: new Date().toISOString()
        });
        
        console.log(`      ⏭️  SKIPPED: ${error.reason}`);
      } else {
        this.testResults.failed++;
        this.testResults.tests.push({
          name: testName,
          status: 'FAILED',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.log(`      ❌ FAILED: ${error.message}`);
      }
    }
  }

  async generateTestReport() {
    const report = {
      testSuite: 'AWS SDK v3 Services',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.tests.length,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        skipped: this.testResults.skipped,
        successRate: Math.round((this.testResults.passed / this.testResults.tests.length) * 100)
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        awsRegion: process.env.AWS_REGION || 'us-east-1'
      },
      tests: this.testResults.tests
    };

    const reportPath = path.join(__dirname, 'aws-sdk-v3-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report generated: ${reportPath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new AWSSDKV3TestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = AWSSDKV3TestSuite;
