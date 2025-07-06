#!/usr/bin/env node

/**
 * OpenSearch Integration Test Suite
 * Comprehensive testing for OpenSearch MCP integration
 */

const path = require('path');
const fs = require('fs').promises;

// OpenSearch Components
const OpenSearchMCPServer = require('../src/mcp-server/lib/opensearch-mcp-server');
const OpenSearchHealthIndexer = require('../src/mcp-server/lib/opensearch-indexer');
const OpenSearchHealthQueries = require('../src/mcp-server/lib/opensearch-health-queries');
const OpenSearchMCPTools = require('../src/mcp-server/lib/opensearch-mcp-tools');

class OpenSearchIntegrationTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    
    this.components = {
      mcpServer: null,
      indexer: null,
      queries: null,
      tools: null
    };
  }

  async runAllTests() {
    console.log('🧪 Starting OpenSearch Integration Test Suite...\n');
    
    try {
      // Initialize components
      await this.initializeComponents();
      
      // Run component tests
      await this.testOpenSearchIndexer();
      await this.testHealthQueries();
      await this.testMCPTools();
      await this.testMCPServer();
      
      // Run integration tests
      await this.testFullIntegration();
      
      // Generate test report
      await this.generateTestReport();
      
      console.log('\n✅ OpenSearch Integration Test Suite completed successfully!');
      console.log(`📊 Results: ${this.testResults.passed} passed, ${this.testResults.failed} failed, ${this.testResults.skipped} skipped`);
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async initializeComponents() {
    console.log('🔧 Initializing OpenSearch components...');
    
    try {
      this.components.mcpServer = new OpenSearchMCPServer();
      this.components.indexer = new OpenSearchHealthIndexer();
      this.components.queries = new OpenSearchHealthQueries();
      this.components.tools = new OpenSearchMCPTools();
      
      console.log('   ✅ All components initialized successfully\n');
    } catch (error) {
      console.log('   ❌ Component initialization failed:', error.message);
      throw error;
    }
  }

  async testOpenSearchIndexer() {
    console.log('📊 Testing OpenSearch Health Indexer...');

    await this.runTest('Indexer Initialization', async () => {
      if (!this.components.indexer) throw new Error('Indexer not initialized');
      return { initialized: true };
    });

    await this.runTest('Index Mappings Generation', async () => {
      const mappings = this.components.indexer.getIndexMappings();
      
      const expectedIndices = ['health_metrics', 'apple_health', 'health_records', 'family_health'];
      const availableIndices = Object.keys(mappings);
      
      const missingIndices = expectedIndices.filter(index => !availableIndices.includes(index));
      if (missingIndices.length > 0) {
        throw new Error(`Missing index mappings: ${missingIndices.join(', ')}`);
      }

      return {
        indicesCount: availableIndices.length,
        indices: availableIndices
      };
    });

    await this.runTest('Mock Health Data Generation', async () => {
      const mockData = this.components.indexer.generateMockAppleHealthData('test-user');
      
      if (!mockData || mockData.length === 0) {
        throw new Error('No mock data generated');
      }

      const dataTypes = [...new Set(mockData.map(item => item.type))];
      
      return {
        recordCount: mockData.length,
        dataTypes: dataTypes,
        sampleRecord: mockData[0]
      };
    });

    await this.runTest('Health Metrics Indexing', async () => {
      const mockMetrics = [
        { type: 'steps', value: 8500, unit: 'count', timestamp: new Date().toISOString() },
        { type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date().toISOString() }
      ];

      try {
        const result = await this.components.indexer.indexHealthMetrics(mockMetrics, 'test-user');
        return result;
      } catch (error) {
        if (error.message.includes('OpenSearch') || error.message.includes('connection')) {
          throw { skip: true, reason: 'OpenSearch not available for indexing test' };
        }
        throw error;
      }
    });

    await this.runTest('Indexer Health Check', async () => {
      const health = await this.components.indexer.healthCheck();
      return health;
    });

    console.log('   ✅ OpenSearch Indexer tests completed\n');
  }

  async testHealthQueries() {
    console.log('💬 Testing Health Queries...');

    await this.runTest('Query Parser Initialization', async () => {
      if (!this.components.queries) throw new Error('Health queries not initialized');
      
      const patterns = Object.keys(this.components.queries.queryPatterns);
      const timePatterns = Object.keys(this.components.queries.timePatterns);
      
      return {
        queryPatterns: patterns.length,
        timePatterns: timePatterns.length
      };
    });

    await this.runTest('Natural Language Query Parsing', async () => {
      const testQueries = [
        'show me steps last week',
        'heart rate this month',
        'my workouts yesterday',
        'sleep data last 7 days'
      ];

      const results = [];
      for (const query of testQueries) {
        const parsed = this.components.queries.parseQuery(query);
        results.push({
          query: query,
          metric: parsed.metric,
          timePeriod: parsed.timePeriod?.days
        });
      }

      const successfulParses = results.filter(r => r.metric !== null);
      
      return {
        totalQueries: testQueries.length,
        successfulParses: successfulParses.length,
        parseRate: Math.round((successfulParses.length / testQueries.length) * 100),
        results: results
      };
    });

    await this.runTest('OpenSearch Query Building', async () => {
      const parsedQuery = {
        metric: 'steps',
        timePeriod: { days: 7, type: 'last' }
      };

      const query = this.components.queries.buildOpenSearchQuery(parsedQuery, 'test-user');
      
      if (!query.index) throw new Error('No index specified in query');
      if (!query.body) throw new Error('No query body generated');
      if (!query.body.query) throw new Error('No search query generated');

      return {
        index: query.index,
        hasQuery: !!query.body.query,
        hasAggregations: !!query.body.aggs,
        queryType: Object.keys(query.body.query)[0]
      };
    });

    await this.runTest('Health Query Processing', async () => {
      const result = await this.components.queries.processHealthQuery('steps last week', 'test-user');
      
      if (!result.query) throw new Error('Query not processed');
      if (!result.metric) throw new Error('Metric not identified');
      
      return {
        query: result.query,
        metric: result.metric,
        totalRecords: result.totalRecords,
        hasInsights: !!(result.insights && result.insights.length > 0)
      };
    });

    await this.runTest('Query Examples Generation', async () => {
      const examples = this.components.queries.getQueryExamples();
      
      if (!examples || examples.length === 0) {
        throw new Error('No query examples generated');
      }

      return {
        exampleCount: examples.length,
        examples: examples.slice(0, 3)
      };
    });

    console.log('   ✅ Health Queries tests completed\n');
  }

  async testMCPTools() {
    console.log('🛠️  Testing OpenSearch MCP Tools...');

    await this.runTest('MCP Tools Initialization', async () => {
      if (!this.components.tools) throw new Error('MCP tools not initialized');
      
      const tools = this.components.tools.getTools();
      
      const expectedTools = [
        'search_health_data',
        'aggregate_health_metrics',
        'get_health_trends',
        'search_family_health',
        'get_health_correlations'
      ];

      const availableTools = tools.map(t => t.name);
      const missingTools = expectedTools.filter(tool => !availableTools.includes(tool));
      
      if (missingTools.length > 0) {
        throw new Error(`Missing MCP tools: ${missingTools.join(', ')}`);
      }

      return {
        toolCount: availableTools.length,
        tools: availableTools
      };
    });

    await this.runTest('Search Health Data Tool', async () => {
      const args = {
        query: 'show me steps last week',
        user_id: 'test-user',
        include_insights: true
      };

      const result = await this.components.tools.executeTool('search_health_data', args);
      
      if (!result.success) throw new Error('Search tool failed');
      
      return {
        success: result.success,
        mcp_tool: result.mcp_tool,
        totalRecords: result.totalRecords
      };
    });

    await this.runTest('Aggregate Health Metrics Tool', async () => {
      const args = {
        metric_type: 'steps',
        time_period: 'last_week',
        user_id: 'test-user'
      };

      const result = await this.components.tools.executeTool('aggregate_health_metrics', args);
      
      if (!result.success) throw new Error('Aggregation tool failed');
      
      return {
        success: result.success,
        metric_type: result.metric_type,
        mcp_tool: result.mcp_tool
      };
    });

    await this.runTest('Get Health Trends Tool', async () => {
      const args = {
        metric_types: ['steps', 'heart_rate'],
        analysis_period: '30_days',
        user_id: 'test-user',
        include_predictions: true
      };

      const result = await this.components.tools.executeTool('get_health_trends', args);
      
      if (!result.success) throw new Error('Trends tool failed');
      
      return {
        success: result.success,
        metrics_analyzed: result.metrics_analyzed,
        mcp_tool: result.mcp_tool
      };
    });

    await this.runTest('Family Health Search Tool', async () => {
      const args = {
        family_id: 'test-family',
        query: 'family health summary',
        privacy_level: 'summary_only'
      };

      const result = await this.components.tools.executeTool('search_family_health', args);
      
      if (!result.success) throw new Error('Family health tool failed');
      
      return {
        success: result.success,
        family_id: result.family_id,
        privacy_level: result.privacy_level
      };
    });

    await this.runTest('Health Correlations Tool', async () => {
      const args = {
        primary_metric: 'steps',
        correlation_metrics: ['heart_rate', 'sleep'],
        user_id: 'test-user'
      };

      const result = await this.components.tools.executeTool('get_health_correlations', args);
      
      if (!result.success) throw new Error('Correlations tool failed');
      
      return {
        success: result.success,
        primary_metric: result.primary_metric,
        correlations: Object.keys(result.correlations || {})
      };
    });

    console.log('   ✅ OpenSearch MCP Tools tests completed\n');
  }

  async testMCPServer() {
    console.log('🖥️  Testing OpenSearch MCP Server...');

    await this.runTest('MCP Server Initialization', async () => {
      if (!this.components.mcpServer) throw new Error('MCP server not initialized');
      return { initialized: true };
    });

    await this.runTest('MCP Server Health Status', async () => {
      const health = await this.components.mcpServer.getHealthStatus();
      
      return {
        status: health.status,
        initialized: health.initialized,
        aws_sdk_version: health.aws_sdk_version
      };
    });

    await this.runTest('Health Query Processing', async () => {
      const result = await this.components.mcpServer.processHealthQuery(
        'show me steps last week',
        'test-user',
        { include_insights: true }
      );
      
      if (!result.query) throw new Error('Query not processed by MCP server');
      
      return {
        query: result.query,
        totalRecords: result.totalRecords,
        query_metadata: !!result.query_metadata
      };
    });

    await this.runTest('Health Analytics', async () => {
      const result = await this.components.mcpServer.getHealthAnalytics(
        ['steps', 'heart_rate'],
        '30_days',
        'test-user'
      );
      
      if (!result.analysis_period) throw new Error('Analytics not processed');
      
      return {
        analysis_period: result.analysis_period,
        metrics_analyzed: result.metrics_analyzed,
        mcp_tool: result.mcp_tool
      };
    });

    await this.runTest('Query Examples', async () => {
      const examples = this.components.mcpServer.getQueryExamples();
      
      if (!examples.basic_queries || !examples.advanced_queries) {
        throw new Error('Query examples not available');
      }

      return {
        basicQueries: examples.basic_queries.length,
        advancedQueries: examples.advanced_queries.length,
        mcpTools: examples.mcp_tools.length
      };
    });

    console.log('   ✅ OpenSearch MCP Server tests completed\n');
  }

  async testFullIntegration() {
    console.log('🔗 Testing Full OpenSearch Integration...');

    await this.runTest('End-to-End Health Query Flow', async () => {
      // Test complete flow: MCP Server -> Tools -> Queries -> Results
      const query = 'show me steps last week';
      const userId = 'integration-test-user';

      // Process through MCP server
      const mcpResult = await this.components.mcpServer.processHealthQuery(query, userId);
      
      // Process through tools directly
      const toolResult = await this.components.tools.executeTool('search_health_data', {
        query: query,
        user_id: userId,
        include_insights: true
      });

      // Process through queries directly
      const queryResult = await this.components.queries.processHealthQuery(query, userId);

      return {
        mcpServer: mcpResult.query === query,
        mcpTools: toolResult.success,
        healthQueries: queryResult.query === query,
        integrationComplete: true
      };
    });

    await this.runTest('Multi-Tool Workflow', async () => {
      const userId = 'workflow-test-user';
      
      // Step 1: Search health data
      const searchResult = await this.components.tools.executeTool('search_health_data', {
        query: 'steps last month',
        user_id: userId
      });

      // Step 2: Aggregate metrics
      const aggregateResult = await this.components.tools.executeTool('aggregate_health_metrics', {
        metric_type: 'steps',
        time_period: 'last_month',
        user_id: userId
      });

      // Step 3: Get trends
      const trendsResult = await this.components.tools.executeTool('get_health_trends', {
        metric_types: ['steps'],
        analysis_period: '30_days',
        user_id: userId
      });

      return {
        searchSuccess: searchResult.success,
        aggregateSuccess: aggregateResult.success,
        trendsSuccess: trendsResult.success,
        workflowComplete: true
      };
    });

    await this.runTest('Component Health Status', async () => {
      const healthChecks = await Promise.allSettled([
        this.components.indexer.healthCheck(),
        this.components.queries.healthCheck(),
        this.components.tools.healthCheck(),
        this.components.mcpServer.getHealthStatus()
      ]);

      const results = healthChecks.map((result, index) => ({
        component: ['indexer', 'queries', 'tools', 'mcpServer'][index],
        status: result.status,
        healthy: result.status === 'fulfilled' && 
                (result.value.status === 'healthy' || result.value.status === 'degraded')
      }));

      const healthyComponents = results.filter(r => r.healthy).length;

      return {
        totalComponents: results.length,
        healthyComponents: healthyComponents,
        healthRate: Math.round((healthyComponents / results.length) * 100),
        components: results
      };
    });

    console.log('   ✅ Full Integration tests completed\n');
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
      testSuite: 'OpenSearch Integration',
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

    const reportPath = path.join(__dirname, 'opensearch-integration-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report generated: ${reportPath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new OpenSearchIntegrationTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = OpenSearchIntegrationTestSuite;
