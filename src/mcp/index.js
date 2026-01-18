#!/usr/bin/env node

/**
 * StayFit Health Companion MCP Server
 * Provides health data search, AI insights, and caching capabilities
 * Updated to use AWS SDK v3
 */

const { Server, StdioServerTransport, CallToolRequestSchema, ListToolsRequestSchema } = require('./lib/mcp-sdk-mock.js');
const winston = require('winston');

// AWS SDK v3 Services
const S3ServiceV3 = require('../aws/s3-service-v3');
const TextractServiceV3 = require('../aws/textract-service-v3');
const BedrockServiceV3 = require('../aws/bedrock-service-v3');
const { awsConfig } = require('../aws/aws-config-v3');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class StayFitMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'stayfit-health-companion',
        version: '1.0.0'
      },
      {
        tools: {}
      }
    );

    // Initialize AWS SDK v3 services
    this.s3Service = new S3ServiceV3();
    this.textractService = new TextractServiceV3();
    this.bedrockService = new BedrockServiceV3();
    
    this.isInitialized = false;
    this.setupTools();
  }

  async initialize() {
    try {
      logger.info('Initializing StayFit Health Companion MCP Server with AWS SDK v3...');

      // Validate AWS configuration
      const awsValidation = await awsConfig.validateConfiguration();
      if (!awsValidation.valid) {
        logger.warn('AWS configuration validation failed:', awsValidation.error);
      } else {
        logger.info('AWS configuration validated successfully', {
          account: awsValidation.account,
          region: awsValidation.region
        });
      }

      // Perform health checks on AWS services
      await this.performHealthChecks();

      this.isInitialized = true;
      logger.info('StayFit Health Companion MCP Server initialized successfully with AWS SDK v3');

      return {
        status: 'initialized',
        aws_sdk_version: 'v3',
        services: ['S3', 'Textract', 'Bedrock'],
        tools_count: Object.keys(this.tools).length
      };

    } catch (error) {
      logger.error('Failed to initialize MCP Server:', error);
      throw error;
    }
  }

  setupTools() {
    this.tools = {
      // Health data search and processing
      search_health_data: {
        description: 'Search through processed health records and metrics using natural language queries',
        handler: this.searchHealthData.bind(this)
      },

      // AWS S3 document management
      upload_health_document: {
        description: 'Upload health document to secure S3 storage with encryption',
        handler: this.uploadHealthDocument.bind(this)
      },

      download_health_document: {
        description: 'Download health document from S3 storage',
        handler: this.downloadHealthDocument.bind(this)
      },

      // AWS Textract document processing
      extract_document_text: {
        description: 'Extract text from health documents using AWS Textract',
        handler: this.extractDocumentText.bind(this)
      },

      analyze_health_document: {
        description: 'Comprehensive analysis of health documents with forms and tables',
        handler: this.analyzeHealthDocument.bind(this)
      },

      // AWS Bedrock AI insights
      generate_health_insights: {
        description: 'Generate AI-powered health insights using AWS Bedrock Claude',
        handler: this.generateHealthInsights.bind(this)
      },

      analyze_health_trends: {
        description: 'Analyze health trends and provide recommendations using AI',
        handler: this.analyzeHealthTrends.bind(this)
      },

      generate_personalized_recommendations: {
        description: 'Generate personalized health recommendations based on user data',
        handler: this.generatePersonalizedRecommendations.bind(this)
      },

      // Health checks and monitoring
      health_check: {
        description: 'Perform comprehensive health check of all services',
        handler: this.performHealthCheck.bind(this)
      }
    };

    // Set up MCP server request handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.entries(this.tools).map(([name, tool]) => ({
          name,
          description: tool.description
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (!this.tools[name]) {
        throw new Error(`Unknown tool: ${name}`);
      }

      logger.info(`Executing tool: ${name}`);
      return await this.tools[name].handler(args || {});
    });
  }

  // Tool implementations using AWS SDK v3

  async searchHealthData(args) {
    try {
      const { query, user_id = 'default_user', include_insights = true } = args;
      
      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Mock search result for demonstration
      const result = {
        query: query,
        user_id: user_id,
        results: [
          {
            type: 'health_metric',
            data: 'Mock health data search result',
            confidence: 0.95,
            timestamp: new Date().toISOString()
          }
        ],
        total_results: 1,
        insights: include_insights ? ['This is a mock insight'] : []
      };

      return {
        success: true,
        ...result,
        tool: 'search_health_data',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in search_health_data:', error);
      throw error;
    }
  }

  async uploadHealthDocument(args) {
    try {
      const { file_data, filename, user_id, metadata = {} } = args;
      
      if (!file_data || !filename || !user_id) {
        throw new Error('file_data, filename, and user_id are required');
      }

      // Convert base64 to buffer if needed
      const buffer = Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data, 'base64');
      
      const file = {
        buffer: buffer,
        originalname: filename,
        mimetype: metadata.content_type || 'application/octet-stream',
        size: buffer.length
      };

      const result = await this.s3Service.uploadHealthDocument(file, user_id, metadata);

      return {
        success: true,
        ...result,
        tool: 'upload_health_document',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in upload_health_document:', error);
      throw error;
    }
  }

  async downloadHealthDocument(args) {
    try {
      const { s3_key, user_id } = args;
      
      if (!s3_key || !user_id) {
        throw new Error('s3_key and user_id are required');
      }

      const result = await this.s3Service.downloadHealthDocument(s3_key, user_id);

      return {
        success: true,
        ...result,
        buffer: result.buffer.toString('base64'), // Convert to base64 for transport
        tool: 'download_health_document',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in download_health_document:', error);
      throw error;
    }
  }

  async extractDocumentText(args) {
    try {
      const { document_source, user_id } = args;
      
      if (!document_source || !user_id) {
        throw new Error('document_source and user_id are required');
      }

      const result = await this.textractService.extractTextFromDocument(document_source, user_id);

      return {
        success: true,
        ...result,
        tool: 'extract_document_text',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in extract_document_text:', error);
      throw error;
    }
  }

  async analyzeHealthDocument(args) {
    try {
      const { document_source, user_id, features = ['TABLES', 'FORMS'] } = args;
      
      if (!document_source || !user_id) {
        throw new Error('document_source and user_id are required');
      }

      const result = await this.textractService.analyzeHealthDocument(document_source, user_id, features);

      return {
        success: true,
        ...result,
        tool: 'analyze_health_document',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in analyze_health_document:', error);
      throw error;
    }
  }

  async generateHealthInsights(args) {
    try {
      const { health_data, user_id, options = {} } = args;
      
      if (!health_data || !user_id) {
        throw new Error('health_data and user_id are required');
      }

      const result = await this.bedrockService.generateHealthInsights(health_data, user_id, options);

      return {
        success: true,
        ...result,
        tool: 'generate_health_insights',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in generate_health_insights:', error);
      throw error;
    }
  }

  async analyzeHealthTrends(args) {
    try {
      const { trend_data, user_id, timeframe = '30_days' } = args;
      
      if (!trend_data || !user_id) {
        throw new Error('trend_data and user_id are required');
      }

      const result = await this.bedrockService.analyzeHealthTrends(trend_data, user_id, timeframe);

      return {
        success: true,
        ...result,
        tool: 'analyze_health_trends',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in analyze_health_trends:', error);
      throw error;
    }
  }

  async generatePersonalizedRecommendations(args) {
    try {
      const { user_profile, health_data, goals = [] } = args;
      
      if (!user_profile || !health_data) {
        throw new Error('user_profile and health_data are required');
      }

      const result = await this.bedrockService.generatePersonalizedRecommendations(user_profile, health_data, goals);

      return {
        success: true,
        ...result,
        tool: 'generate_personalized_recommendations',
        aws_sdk_version: 'v3'
      };

    } catch (error) {
      logger.error('Error in generate_personalized_recommendations:', error);
      throw error;
    }
  }

  async performHealthCheck(args) {
    try {
      const healthChecks = await this.performHealthChecks();

      return {
        success: true,
        ...healthChecks,
        tool: 'health_check',
        aws_sdk_version: 'v3',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in health_check:', error);
      throw error;
    }
  }

  async performHealthChecks() {
    try {
      logger.info('Performing comprehensive health checks...');

      const [s3Health, textractHealth, bedrockHealth] = await Promise.allSettled([
        this.s3Service.healthCheck(),
        this.textractService.healthCheck(),
        this.bedrockService.healthCheck()
      ]);

      const healthStatus = {
        overall_status: 'healthy',
        aws_sdk_version: 'v3',
        services: {
          s3: s3Health.status === 'fulfilled' ? s3Health.value : { status: 'error', error: s3Health.reason?.message },
          textract: textractHealth.status === 'fulfilled' ? textractHealth.value : { status: 'error', error: textractHealth.reason?.message },
          bedrock: bedrockHealth.status === 'fulfilled' ? bedrockHealth.value : { status: 'error', error: bedrockHealth.reason?.message }
        },
        aws_account: await awsConfig.getAccountInfo().catch(() => ({ error: 'Could not retrieve account info' })),
        environment: awsConfig.getEnvironmentConfig(),
        timestamp: new Date().toISOString()
      };

      // Determine overall status
      const serviceStatuses = Object.values(healthStatus.services);
      const unhealthyServices = serviceStatuses.filter(service => service.status !== 'healthy');
      
      if (unhealthyServices.length > 0) {
        healthStatus.overall_status = unhealthyServices.length === serviceStatuses.length ? 'unhealthy' : 'degraded';
        healthStatus.issues = unhealthyServices.length;
      }

      logger.info(`Health check completed: ${healthStatus.overall_status}`);
      return healthStatus;

    } catch (error) {
      logger.error('Error performing health checks:', error);
      return {
        overall_status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async start() {
    try {
      await this.initialize();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('StayFit Health Companion MCP Server started with AWS SDK v3');
      
    } catch (error) {
      logger.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    try {
      logger.info('Shutting down StayFit Health Companion MCP Server...');
      logger.info('MCP Server shutdown complete');
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (global.mcpServer) {
    await global.mcpServer.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  if (global.mcpServer) {
    await global.mcpServer.shutdown();
  }
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  const server = new StayFitMCPServer();
  global.mcpServer = server;
  server.start();
}

module.exports = StayFitMCPServer;
