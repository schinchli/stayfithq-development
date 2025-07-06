#!/usr/bin/env node

/**
 * MCP Server Test Suite
 * Comprehensive testing for the StayFit Health Companion MCP Server
 */

const path = require('path');
const fs = require('fs').promises;

// MCP Server and Components
const StayFitMCPServer = require('../src/mcp-server/index');
const OpenSearchMCPTools = require('../src/mcp-server/lib/opensearch-mcp-tools');
const OpenSearchHealthQueries = require('../src/mcp-server/lib/opensearch-health-queries');

class MCPServerTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    
    this.mcpServer = null;
    this.mcpTools = null;
    this.healthQueries = null;
  }

  async runAllTests() {
    console.log('🧪 Starting MCP Server Test Suite...\n');
    
    try {
      // Initialize components
      await this.initializeComponents();
      
      // Run MCP server tests
      await this.testMCPServerInitialization();
      await this.testMCPTools();
      
      // Run OpenSearch MCP tests
      await this.testOpenSearchMCPTools();
      await this.testHealthQueries();
      
      // Run integration tests
      await this.testMCPIntegration();
      
      // Generate test report
      await this.generateTestReport();
      
      console.log('\n✅ MCP Server Test Suite completed successfully!');
      console.log(`📊 Results: ${this.testResults.passed} passed, ${this.testResults.failed} failed, ${this.testResults.skipped} skipped`);
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async initializeComponents() {
    console.log('🔧 Initializing MCP components...');
    
    try {
      this.mcpServer = new StayFitMCPServer();
      this.mcpTools = new OpenSearchMCPTools();
      this.healthQueries = new OpenSearchHealthQueries();
      
      console.log('   ✅ All components initialized successfully\n');
    } catch (error) {
      console.log('   ❌ Component initialization failed:', error.message);
      throw error;
    }
  }

  async testMCPServerInitialization() {
    console.log('🖥️  Testing MCP Server Initialization...');

    await this.runTest('MCP Server Creation', async () => {
      if (!this.mcpServer) throw new Error('MCP server not created');
      return { created: true };
    });

    await this.runTest('MCP Tools Registration', async () => {
      const tools = this.mcpServer.tools;
      if (!tools || Object.keys(tools).length === 0) {
        throw new Error('No MCP tools registered');
      }
      
      const expectedTools = [
        'search_health_data',
        'upload_health_document',
        'download_health_document',
        'extract_document_text',
        'analyze_health_document',
        'generate_health_insights',
        'analyze_health_trends',
        'generate_personalized_recommendations',
        'health_check'
      ];

      const registeredTools = Object.keys(tools);
      const missingTools = expectedTools.filter(tool => !registeredTools.includes(tool));
      
      if (missingTools.length > 0) {
        throw new Error(`Missing tools: ${missingTools.join(', ')}`);
      }

      return {
        toolCount: registeredTools.length,
        tools: registeredTools
      };
    });

    await this.runTest('MCP Server Initialization', async () => {
      try {
        const result = await this.mcpServer.initialize();
        return result;
      } catch (error) {
        if (error.message.includes('credentials') || error.message.includes('AWS')) {
          throw { skip: true, reason: 'AWS credentials not available for initialization' };
        }
        throw error;
      }
    });

    console.log('   ✅ MCP Server initialization tests completed\n');
  }

  async testMCPTools() {
    console.log('🛠️  Testing MCP Tools...');

    await this.runTest('Search Health Data Tool', async () => {
      const args = {
        query: 'show me steps last week',
        user_id: 'test-user',
        include_insights: true
      };

      const result = await this.mcpServer.searchHealthData(args);
      
      if (!result.success) throw new Error('Search failed');
      if (!result.query) throw new Error('Query not processed');
      
      return {
        success: result.success,
        tool: result.tool,
        aws_sdk_version: result.aws_sdk_version
      };
    });

    await this.runTest('Health Check Tool', async () => {
      const result = await this.mcpServer.performHealthCheck({});
      
      if (!result.success) throw new Error('Health check failed');
      if (!result.aws_sdk_version) throw new Error('AWS SDK version not reported');
      
      return {
        success: result.success,
        aws_sdk_version: result.aws_sdk_version,
        services: Object.keys(result.services || {})
      };
    });

    await this.runTest('Upload Health Document Tool', async () => {
      const mockFileData = Buffer.from('Mock health document content').toString('base64');
      const args = {
        file_data: mockFileData,
        filename: 'test-health-doc.pdf',
        user_id: 'test-user',
        metadata: { content_type: 'application/pdf' }
      };

      try {
        const result = await this.mcpServer.uploadHealthDocument(args);
        return {
          success: result.success,
          tool: result.tool
        };
      } catch (error) {
        if (error.message.includes('credentials') || error.message.includes('S3')) {
          throw { skip: true, reason: 'AWS S3 credentials not available' };
        }
        throw error;
      }
    });

    await this.runTest('Generate Health Insights Tool', async () => {
      const args = {
        health_data: {
          steps: 8500,
          heart_rate: 72,
          sleep_hours: 7.5
        },
        user_id: 'test-user',
        options: {
          temperature: 0.3,
          maxTokens: 1000
        }
      };

      try {
        const result = await this.mcpServer.generateHealthInsights(args);
        return {
          success: result.success,
          tool: result.tool
        };
      } catch (error) {
        if (error.message.includes('credentials') || error.message.includes('Bedrock')) {
          throw { skip: true, reason: 'AWS Bedrock credentials not available' };
        }
        throw error;
      }
    });

    console.log('   ✅ MCP Tools tests completed\n');
  }

  async testOpenSearchMCPTools() {
    console.log('🔍 Testing OpenSearch MCP Tools...');

    await this.runTest('OpenSearch MCP Tools Initialization', async () => {
      if (!this.mcpTools) throw new Error('OpenSearch MCP tools not initialized');
      
      const tools = this.mcpTools.getTools();
      if (!tools || tools.length === 0) {
        throw new Error('No OpenSearch MCP tools available');
      }

      return {
        toolCount: tools.length,
        tools: tools.map(t => t.name)
      };
    });

    await this.runTest('Search Health Data MCP Tool', async () => {
      const args = {
        query: 'show me steps last week',
        user_id: 'test-user',
        include_insights: true
      };

      const result = await this.mcpTools.executeTool('search_health_data', args);
      
      if (!result.success) throw new Error('Search tool execution failed');
      
      return {
        success: result.success,
        totalRecords: result.totalRecords,
        mcp_tool: result.mcp_tool
      };
    });

    await this.runTest('Aggregate Health Metrics MCP Tool', async () => {
      const args = {
        metric_type: 'steps',
        time_period: 'last_week',
        user_id: 'test-user'
      };

      const result = await this.mcpTools.executeTool('aggregate_health_metrics', args);
      
      if (!result.success) throw new Error('Aggregation tool execution failed');
      
      return {
        success: result.success,
        metric_type: result.metric_type,
        mcp_tool: result.mcp_tool
      };
    });

    await this.runTest('Get Health Trends MCP Tool', async () => {
      const args = {
        metric_types: ['steps', 'heart_rate'],
        analysis_period: '30_days',
        user_id: 'test-user',
        include_predictions: true
      };

      const result = await this.mcpTools.executeTool('get_health_trends', args);
      
      if (!result.success) throw new Error('Trends tool execution failed');
      
      return {
        success: result.success,
        metrics_analyzed: result.metrics_analyzed,
        mcp_tool: result.mcp_tool
      };
    });

    await this.runTest('OpenSearch MCP Health Check', async () => {
      const health = await this.mcpTools.healthCheck();
      
      return {
        status: health.status,
        tools_available: health.tools_available,
        timestamp: health.timestamp
      };
    });

    console.log('   ✅ OpenSearch MCP Tools tests completed\n');
  }

  async testHealthQueries() {
    console.log('💬 Testing Health Queries...');

    await this.runTest('Natural Language Query Processing', async () => {
      const query = 'show me steps last week';
      const result = await this.healthQueries.processHealthQuery(query, 'test-user');
      
      if (!result.query) throw new Error('Query not processed');
      if (!result.metric) throw new Error('Metric not identified');
      
      return {
        query: result.query,
        metric: result.metric,
        totalRecords: result.totalRecords
      };
    });

    await this.runTest('Query Pattern Recognition', async () => {
      const testQueries = [
        'heart rate this month',
        'my workouts yesterday',
        'sleep data last 7 days',
        'weight measurements last month'
      ];

      const results = [];
      for (const query of testQueries) {
        const parsed = this.healthQueries.parseQuery(query);
        results.push({
          query: query,
          metric: parsed.metric,
          timePeriod: parsed.timePeriod
        });
      }

      const successfulParses = results.filter(r => r.metric !== null);
      if (successfulParses.length !== testQueries.length) {
        throw new Error(`Only ${successfulParses.length}/${testQueries.length} queries parsed successfully`);
      }

      return {
        queriesTested: testQueries.length,
        successfulParses: successfulParses.length,
        results: results
      };
    });

    await this.runTest('Query Examples Generation', async () => {
      const examples = this.healthQueries.getQueryExamples();
      
      if (!examples || examples.length === 0) {
        throw new Error('No query examples available');
      }

      return {
        exampleCount: examples.length,
        examples: examples.slice(0, 3) // Show first 3 examples
      };
    });

    await this.runTest('Health Queries Health Check', async () => {
      const health = await this.healthQueries.healthCheck();
      
      return {
        status: health.status,
        indices: health.indices || 0
      };
    });

    console.log('   ✅ Health Queries tests completed\n');
  }

  async testMCPIntegration() {
    console.log('🔗 Testing MCP Integration...');

    await this.runTest('End-to-End Health Query', async () => {
      // Test complete flow from MCP server to health queries
      const args = {
        query: 'show me steps last week',
        user_id: 'integration-test-user',
        include_insights: true
      };

      const result = await this.mcpServer.searchHealthData(args);
      
      if (!result.success) throw new Error('End-to-end query failed');
      
      return {
        success: result.success,
        aws_sdk_version: result.aws_sdk_version,
        tool: result.tool
      };
    });

    await this.runTest('MCP Tool Chain Execution', async () => {
      // Test multiple MCP tools working together
      const healthCheckResult = await this.mcpServer.performHealthCheck({});
      
      if (!healthCheckResult.success) {
        throw new Error('Health check in chain failed');
      }

      const searchResult = await this.mcpServer.searchHealthData({
        query: 'steps today',
        user_id: 'chain-test-user'
      });

      if (!searchResult.success) {
        throw new Error('Search in chain failed');
      }

      return {
        healthCheck: healthCheckResult.success,
        search: searchResult.success,
        chainComplete: true
      };
    });

    console.log('   ✅ MCP Integration tests completed\n');
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
      testSuite: 'MCP Server',
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
        platform: process.platform
      },
      tests: this.testResults.tests
    };

    const reportPath = path.join(__dirname, 'mcp-server-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report generated: ${reportPath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new MCPServerTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = MCPServerTestSuite;
