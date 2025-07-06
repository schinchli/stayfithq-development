/**
 * OpenSearch MCP Server Integration
 * Main integration point for OpenSearch with MCP server
 */

const OpenSearchMCPTools = require('./opensearch-mcp-tools');
const OpenSearchHealthIndexer = require('./opensearch-indexer');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class OpenSearchMCPServer {
  constructor() {
    this.mcpTools = new OpenSearchMCPTools();
    this.indexer = new OpenSearchHealthIndexer();
    this.isInitialized = false;
    this.healthCheckInterval = null;
  }

  /**
   * Initialize OpenSearch MCP integration
   */
  async initialize() {
    try {
      logger.info('Initializing OpenSearch MCP Server...');

      // Initialize OpenSearch indices
      await this.indexer.initializeIndices();

      // Index sample health data for demonstration
      await this.indexSampleHealthData();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      logger.info('OpenSearch MCP Server initialized successfully');

      return {
        status: 'initialized',
        tools_available: this.mcpTools.getTools().length,
        indices_created: Object.keys(this.indexer.indices).length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to initialize OpenSearch MCP Server:', error);
      throw error;
    }
  }

  /**
   * Get all available MCP tools
   */
  getMCPTools() {
    return this.mcpTools.getTools();
  }

  /**
   * Execute MCP tool
   */
  async executeMCPTool(toolName, args) {
    try {
      if (!this.isInitialized) {
        throw new Error('OpenSearch MCP Server not initialized');
      }

      logger.info(`Executing MCP tool: ${toolName}`);
      const result = await this.mcpTools.executeTool(toolName, args);
      
      logger.info(`MCP tool ${toolName} executed successfully`);
      return result;

    } catch (error) {
      logger.error(`Error executing MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Index health data from various sources
   */
  async indexHealthData(data, dataType, userId = 'default_user') {
    try {
      logger.info(`Indexing ${dataType} data for user ${userId}`);

      let result;
      switch (dataType) {
        case 'apple_health':
          result = await this.indexer.indexAppleHealthData(data, userId);
          break;
        case 'health_metrics':
          result = await this.indexer.indexHealthMetrics(data, userId);
          break;
        case 'health_record':
          result = await this.indexer.indexHealthRecord(data, userId);
          break;
        case 'family_health':
          result = await this.indexer.indexFamilyHealthData(data, userId);
          break;
        case 'bulk':
          result = await this.indexer.bulkIndexHealthData(data, userId);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      logger.info(`Successfully indexed ${dataType} data`);
      return result;

    } catch (error) {
      logger.error(`Error indexing ${dataType} data:`, error);
      throw error;
    }
  }

  /**
   * Process natural language health queries
   */
  async processHealthQuery(query, userId = 'default_user', options = {}) {
    try {
      logger.info(`Processing health query: "${query}" for user ${userId}`);

      // Use the search_health_data MCP tool
      const result = await this.executeMCPTool('search_health_data', {
        query: query,
        user_id: userId,
        include_insights: options.include_insights !== false
      });

      // Add query processing metadata
      result.query_metadata = {
        processed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - (result.start_time || Date.now()),
        mcp_server: 'opensearch',
        user_id: userId
      };

      logger.info(`Health query processed successfully: ${result.totalRecords} records found`);
      return result;

    } catch (error) {
      logger.error('Error processing health query:', error);
      throw error;
    }
  }

  /**
   * Get health trends and analytics
   */
  async getHealthAnalytics(metrics, period = '30_days', userId = 'default_user') {
    try {
      logger.info(`Getting health analytics for metrics: ${metrics.join(', ')}`);

      const result = await this.executeMCPTool('get_health_trends', {
        metric_types: metrics,
        analysis_period: period,
        user_id: userId,
        include_predictions: true
      });

      logger.info(`Health analytics completed for ${metrics.length} metrics`);
      return result;

    } catch (error) {
      logger.error('Error getting health analytics:', error);
      throw error;
    }
  }

  /**
   * Search family health data
   */
  async searchFamilyHealth(familyId, query, privacyLevel = 'summary_only') {
    try {
      logger.info(`Searching family health data for family: ${familyId}`);

      const result = await this.executeMCPTool('search_family_health', {
        family_id: familyId,
        query: query,
        privacy_level: privacyLevel,
        include_member_names: privacyLevel === 'detailed'
      });

      logger.info(`Family health search completed`);
      return result;

    } catch (error) {
      logger.error('Error searching family health data:', error);
      throw error;
    }
  }

  /**
   * Get health correlations
   */
  async getHealthCorrelations(primaryMetric, correlationMetrics, userId = 'default_user') {
    try {
      logger.info(`Analyzing correlations for ${primaryMetric}`);

      const result = await this.executeMCPTool('get_health_correlations', {
        primary_metric: primaryMetric,
        correlation_metrics: correlationMetrics,
        time_window: 'daily',
        user_id: userId
      });

      logger.info(`Correlation analysis completed`);
      return result;

    } catch (error) {
      logger.error('Error getting health correlations:', error);
      throw error;
    }
  }

  /**
   * Index sample health data for demonstration
   */
  async indexSampleHealthData() {
    try {
      logger.info('Indexing sample health data for demonstration...');

      // Sample health metrics
      const sampleMetrics = [
        { type: 'steps', value: 8542, unit: 'count', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'apple_health' },
        { type: 'steps', value: 9234, unit: 'count', timestamp: new Date(Date.now() - 172800000).toISOString(), source: 'apple_health' },
        { type: 'steps', value: 7891, unit: 'count', timestamp: new Date(Date.now() - 259200000).toISOString(), source: 'apple_health' },
        { type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'apple_health' },
        { type: 'heart_rate', value: 68, unit: 'bpm', timestamp: new Date(Date.now() - 172800000).toISOString(), source: 'apple_health' },
        { type: 'workouts', value: 30, unit: 'minutes', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'apple_health', metadata: { workout_type: 'running' } },
        { type: 'sleep', value: 7.5, unit: 'hours', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'apple_health' }
      ];

      await this.indexer.indexHealthMetrics(sampleMetrics, 'demo_user');

      // Sample health record
      const sampleRecord = {
        filename: 'annual_checkup_2024.pdf',
        content_type: 'application/pdf',
        extracted_text: 'Annual health checkup results. Blood pressure: 120/80. Cholesterol: Normal. Weight: 70kg. Overall health: Good.',
        metadata: {
          doctor: 'Dr. Smith',
          date: '2024-06-15',
          type: 'annual_checkup'
        },
        s3_location: 's3://health-docs/demo_user/annual_checkup_2024.pdf',
        tags: ['checkup', 'annual', 'blood_pressure', 'cholesterol'],
        category: 'medical_record'
      };

      await this.indexer.indexHealthRecord(sampleRecord, 'demo_user');

      // Sample family health data
      const sampleFamilyData = {
        members: [
          {
            id: 'member_1',
            relationship: 'self',
            age_group: 'adult',
            health_summary: { steps_avg: 8500, health_score: 85 },
            privacy_level: 'detailed'
          },
          {
            id: 'member_2',
            relationship: 'spouse',
            age_group: 'adult',
            health_summary: { steps_avg: 7200, health_score: 78 },
            privacy_level: 'summary_only'
          }
        ],
        aggregated_metrics: {
          family_steps_avg: 7850,
          family_health_score: 81
        },
        family_health_score: 81,
        privacy_settings: {
          share_individual_data: false,
          share_aggregated_data: true,
          share_trends: true
        }
      };

      await this.indexer.indexFamilyHealthData(sampleFamilyData, 'demo_family');

      logger.info('Sample health data indexed successfully');

    } catch (error) {
      logger.warn('Could not index sample data (OpenSearch may not be available):', error.message);
      // Continue initialization even if sample data fails
    }
  }

  /**
   * Start health monitoring for the MCP server
   */
  startHealthMonitoring() {
    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        if (health.status !== 'healthy') {
          logger.warn('OpenSearch MCP Server health check failed:', health);
        }
      } catch (error) {
        logger.error('Health check error:', error);
      }
    }, 300000); // 5 minutes

    logger.info('Health monitoring started for OpenSearch MCP Server');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health monitoring stopped');
    }
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus() {
    try {
      const [mcpToolsHealth, indexerHealth, indexingStats] = await Promise.all([
        this.mcpTools.healthCheck(),
        this.indexer.healthCheck(),
        this.indexer.getIndexingStats()
      ]);

      return {
        status: mcpToolsHealth.status === 'healthy' && indexerHealth.status === 'healthy' ? 'healthy' : 'degraded',
        mcp_tools: mcpToolsHealth,
        opensearch: indexerHealth,
        indexing_stats: indexingStats,
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get query examples for users
   */
  getQueryExamples() {
    return {
      basic_queries: [
        "show me steps last week",
        "heart rate this month",
        "my workouts yesterday",
        "sleep data last 7 days"
      ],
      advanced_queries: [
        "compare my steps this month vs last month",
        "show correlation between workouts and sleep",
        "family health summary for this week",
        "health trends over the past 3 months"
      ],
      mcp_tools: this.getMCPTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        example_usage: this.getToolExampleUsage(tool.name)
      }))
    };
  }

  /**
   * Get example usage for MCP tools
   */
  getToolExampleUsage(toolName) {
    const examples = {
      search_health_data: 'Search for "steps last week" or "heart rate trends"',
      aggregate_health_metrics: 'Aggregate steps data over last_month with statistical analysis',
      get_health_trends: 'Analyze trends for ["steps", "heart_rate"] over 30_days',
      search_family_health: 'Search family health with privacy controls',
      get_health_correlations: 'Find correlations between steps and sleep quality'
    };

    return examples[toolName] || 'See tool documentation for usage examples';
  }

  /**
   * Shutdown the OpenSearch MCP Server
   */
  async shutdown() {
    try {
      logger.info('Shutting down OpenSearch MCP Server...');

      this.stopHealthMonitoring();
      this.isInitialized = false;

      logger.info('OpenSearch MCP Server shutdown complete');

    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

module.exports = OpenSearchMCPServer;
