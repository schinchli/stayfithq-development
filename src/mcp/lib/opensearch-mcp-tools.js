/**
 * OpenSearch MCP Tools
 * Implements MCP tools for health data search and aggregation
 */

const OpenSearchHealthQueries = require('./opensearch-health-queries');
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

class OpenSearchMCPTools {
  constructor() {
    this.healthQueries = new OpenSearchHealthQueries();
    this.tools = this.initializeTools();
  }

  /**
   * Initialize MCP tools for OpenSearch health data
   */
  initializeTools() {
    return {
      search_health_data: {
        name: 'search_health_data',
        description: 'Search through processed health records and metrics using natural language queries',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query like "show me steps last week" or "heart rate this month"'
            },
            user_id: {
              type: 'string',
              description: 'User ID for scoped search (optional, defaults to current user)',
              default: 'default_user'
            },
            include_insights: {
              type: 'boolean',
              description: 'Whether to include AI-generated insights',
              default: true
            }
          },
          required: ['query']
        },
        handler: this.searchHealthData.bind(this)
      },

      aggregate_health_metrics: {
        name: 'aggregate_health_metrics',
        description: 'Aggregate health metrics across time periods with statistical analysis',
        inputSchema: {
          type: 'object',
          properties: {
            metric_type: {
              type: 'string',
              enum: ['steps', 'heart_rate', 'workouts', 'sleep', 'weight', 'blood_pressure'],
              description: 'Type of health metric to aggregate'
            },
            time_period: {
              type: 'string',
              enum: ['last_week', 'this_week', 'last_month', 'this_month', 'last_year', 'custom'],
              description: 'Time period for aggregation'
            },
            start_date: {
              type: 'string',
              description: 'Start date for custom time period (ISO format)',
              format: 'date'
            },
            end_date: {
              type: 'string',
              description: 'End date for custom time period (ISO format)',
              format: 'date'
            },
            user_id: {
              type: 'string',
              description: 'User ID for scoped aggregation',
              default: 'default_user'
            }
          },
          required: ['metric_type', 'time_period']
        },
        handler: this.aggregateHealthMetrics.bind(this)
      },

      get_health_trends: {
        name: 'get_health_trends',
        description: 'Analyze health trends and patterns over time with predictive insights',
        inputSchema: {
          type: 'object',
          properties: {
            metric_types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['steps', 'heart_rate', 'workouts', 'sleep', 'weight', 'blood_pressure']
              },
              description: 'Array of health metrics to analyze for trends'
            },
            analysis_period: {
              type: 'string',
              enum: ['30_days', '90_days', '6_months', '1_year'],
              description: 'Period for trend analysis',
              default: '30_days'
            },
            user_id: {
              type: 'string',
              description: 'User ID for scoped analysis',
              default: 'default_user'
            },
            include_predictions: {
              type: 'boolean',
              description: 'Whether to include trend predictions',
              default: true
            }
          },
          required: ['metric_types']
        },
        handler: this.getHealthTrends.bind(this)
      },

      search_family_health: {
        name: 'search_family_health',
        description: 'Search family health data with privacy controls and aggregated insights',
        inputSchema: {
          type: 'object',
          properties: {
            family_id: {
              type: 'string',
              description: 'Family group identifier'
            },
            query: {
              type: 'string',
              description: 'Natural language query for family health data'
            },
            privacy_level: {
              type: 'string',
              enum: ['summary_only', 'aggregated', 'detailed'],
              description: 'Level of detail to return based on privacy settings',
              default: 'summary_only'
            },
            include_member_names: {
              type: 'boolean',
              description: 'Whether to include family member names (requires permission)',
              default: false
            }
          },
          required: ['family_id', 'query']
        },
        handler: this.searchFamilyHealth.bind(this)
      },

      get_health_correlations: {
        name: 'get_health_correlations',
        description: 'Find correlations between different health metrics and lifestyle factors',
        inputSchema: {
          type: 'object',
          properties: {
            primary_metric: {
              type: 'string',
              enum: ['steps', 'heart_rate', 'workouts', 'sleep', 'weight', 'blood_pressure'],
              description: 'Primary health metric to analyze'
            },
            correlation_metrics: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['steps', 'heart_rate', 'workouts', 'sleep', 'weight', 'blood_pressure', 'weather', 'stress']
              },
              description: 'Metrics to correlate with primary metric'
            },
            time_window: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly'],
              description: 'Time window for correlation analysis',
              default: 'daily'
            },
            user_id: {
              type: 'string',
              description: 'User ID for scoped analysis',
              default: 'default_user'
            }
          },
          required: ['primary_metric', 'correlation_metrics']
        },
        handler: this.getHealthCorrelations.bind(this)
      }
    };
  }

  /**
   * Search health data using natural language queries
   */
  async searchHealthData(args) {
    try {
      logger.info(`Executing search_health_data with query: "${args.query}"`);

      const results = await this.healthQueries.processHealthQuery(
        args.query,
        args.user_id || 'default_user'
      );

      // Add MCP metadata
      results.mcp_tool = 'search_health_data';
      results.timestamp = new Date().toISOString();
      results.cache_key = `health_search_${Buffer.from(args.query).toString('base64')}_${args.user_id}`;

      if (!args.include_insights) {
        delete results.insights;
      }

      logger.info(`Search completed: ${results.totalRecords} records found`);
      return results;

    } catch (error) {
      logger.error('Error in search_health_data:', error);
      throw new Error(`Health data search failed: ${error.message}`);
    }
  }

  /**
   * Aggregate health metrics with statistical analysis
   */
  async aggregateHealthMetrics(args) {
    try {
      logger.info(`Executing aggregate_health_metrics for ${args.metric_type} over ${args.time_period}`);

      // Convert time period to query format
      let query;
      switch (args.time_period) {
        case 'last_week':
          query = `${args.metric_type} last week`;
          break;
        case 'this_week':
          query = `${args.metric_type} this week`;
          break;
        case 'last_month':
          query = `${args.metric_type} last month`;
          break;
        case 'this_month':
          query = `${args.metric_type} this month`;
          break;
        case 'last_year':
          query = `${args.metric_type} last year`;
          break;
        case 'custom':
          if (!args.start_date || !args.end_date) {
            throw new Error('start_date and end_date required for custom time period');
          }
          query = `${args.metric_type} from ${args.start_date} to ${args.end_date}`;
          break;
        default:
          query = `${args.metric_type} last week`;
      }

      const results = await this.healthQueries.processHealthQuery(query, args.user_id);

      // Enhanced aggregation analysis
      const aggregation = {
        metric_type: args.metric_type,
        time_period: args.time_period,
        summary: results.summary,
        statistical_analysis: this.calculateStatistics(results.dailyData || []),
        trends: this.analyzeTrends(results.dailyData || []),
        benchmarks: this.getBenchmarks(args.metric_type, results.summary),
        mcp_tool: 'aggregate_health_metrics',
        timestamp: new Date().toISOString()
      };

      logger.info(`Aggregation completed for ${args.metric_type}`);
      return aggregation;

    } catch (error) {
      logger.error('Error in aggregate_health_metrics:', error);
      throw new Error(`Health metrics aggregation failed: ${error.message}`);
    }
  }

  /**
   * Analyze health trends and patterns
   */
  async getHealthTrends(args) {
    try {
      logger.info(`Executing get_health_trends for metrics: ${args.metric_types.join(', ')}`);

      const trends = {
        analysis_period: args.analysis_period,
        metrics_analyzed: args.metric_types,
        trends: {},
        correlations: {},
        predictions: {},
        insights: [],
        mcp_tool: 'get_health_trends',
        timestamp: new Date().toISOString()
      };

      // Analyze each metric
      for (const metric of args.metric_types) {
        const query = `${metric} last ${this.getPeriodDays(args.analysis_period)} days`;
        const results = await this.healthQueries.processHealthQuery(query, args.user_id);

        trends.trends[metric] = {
          direction: this.calculateTrendDirection(results.dailyData || []),
          strength: this.calculateTrendStrength(results.dailyData || []),
          volatility: this.calculateVolatility(results.dailyData || []),
          recent_change: this.calculateRecentChange(results.dailyData || [])
        };

        // Add insights
        trends.insights.push(...(results.insights || []));
      }

      // Cross-metric correlations
      if (args.metric_types.length > 1) {
        trends.correlations = await this.calculateCrossMetricCorrelations(
          args.metric_types,
          args.user_id,
          args.analysis_period
        );
      }

      // Predictions if requested
      if (args.include_predictions) {
        trends.predictions = this.generatePredictions(trends.trends);
      }

      logger.info(`Trend analysis completed for ${args.metric_types.length} metrics`);
      return trends;

    } catch (error) {
      logger.error('Error in get_health_trends:', error);
      throw new Error(`Health trends analysis failed: ${error.message}`);
    }
  }

  /**
   * Search family health data with privacy controls
   */
  async searchFamilyHealth(args) {
    try {
      logger.info(`Executing search_family_health for family: ${args.family_id}`);

      // Mock family health data for demonstration
      const familyResults = {
        family_id: args.family_id,
        query: args.query,
        privacy_level: args.privacy_level,
        members_count: 4,
        summary: {
          total_active_members: 3,
          average_daily_steps: 8542,
          family_health_score: 78,
          last_updated: new Date().toISOString()
        },
        aggregated_metrics: {},
        insights: [
          {
            type: 'family_trend',
            message: 'Family activity levels have increased 15% this month',
            recommendation: 'Consider planning more family outdoor activities'
          }
        ],
        privacy_note: 'Individual member data is aggregated to protect privacy',
        mcp_tool: 'search_family_health',
        timestamp: new Date().toISOString()
      };

      // Adjust data based on privacy level
      switch (args.privacy_level) {
        case 'summary_only':
          // Only high-level aggregated data
          break;
        case 'aggregated':
          familyResults.aggregated_metrics = {
            steps: { family_total: 34168, family_average: 8542 },
            workouts: { family_total: 12, family_average: 3 }
          };
          break;
        case 'detailed':
          if (args.include_member_names) {
            familyResults.member_summaries = [
              { name: 'Parent 1', steps_avg: 9200, health_score: 82 },
              { name: 'Parent 2', steps_avg: 8800, health_score: 79 },
              { name: 'Child 1', steps_avg: 7600, health_score: 75 }
            ];
          } else {
            familyResults.member_summaries = [
              { member_id: 'member_1', steps_avg: 9200, health_score: 82 },
              { member_id: 'member_2', steps_avg: 8800, health_score: 79 },
              { member_id: 'member_3', steps_avg: 7600, health_score: 75 }
            ];
          }
          break;
      }

      logger.info(`Family health search completed for ${familyResults.members_count} members`);
      return familyResults;

    } catch (error) {
      logger.error('Error in search_family_health:', error);
      throw new Error(`Family health search failed: ${error.message}`);
    }
  }

  /**
   * Find correlations between health metrics
   */
  async getHealthCorrelations(args) {
    try {
      logger.info(`Executing get_health_correlations for ${args.primary_metric}`);

      const correlations = {
        primary_metric: args.primary_metric,
        correlation_metrics: args.correlation_metrics,
        time_window: args.time_window,
        correlations: {},
        insights: [],
        recommendations: [],
        mcp_tool: 'get_health_correlations',
        timestamp: new Date().toISOString()
      };

      // Calculate correlations (mock data for demonstration)
      for (const metric of args.correlation_metrics) {
        const correlation = this.calculateMockCorrelation(args.primary_metric, metric);
        correlations.correlations[metric] = {
          coefficient: correlation.coefficient,
          strength: correlation.strength,
          significance: correlation.significance,
          interpretation: correlation.interpretation
        };

        // Add insights based on correlation strength
        if (Math.abs(correlation.coefficient) > 0.7) {
          correlations.insights.push({
            type: 'strong_correlation',
            message: `Strong ${correlation.coefficient > 0 ? 'positive' : 'negative'} correlation found between ${args.primary_metric} and ${metric}`,
            correlation_coefficient: correlation.coefficient
          });
        }
      }

      // Generate recommendations
      correlations.recommendations = this.generateCorrelationRecommendations(correlations.correlations, args.primary_metric);

      logger.info(`Correlation analysis completed for ${args.correlation_metrics.length} metrics`);
      return correlations;

    } catch (error) {
      logger.error('Error in get_health_correlations:', error);
      throw new Error(`Health correlations analysis failed: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */

  calculateStatistics(data) {
    if (!data || data.length === 0) return {};

    const values = data.map(d => d.steps || d.value || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      count: values.length,
      sum: Math.round(sum),
      mean: Math.round(mean),
      median: Math.round(median),
      min: Math.min(...values),
      max: Math.max(...values),
      standardDeviation: Math.round(standardDeviation),
      variance: Math.round(variance)
    };
  }

  analyzeTrends(data) {
    if (!data || data.length < 2) return { direction: 'insufficient_data' };

    const values = data.map(d => d.steps || d.value || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change_percentage: Math.round(change * 100) / 100,
      first_period_avg: Math.round(firstAvg),
      second_period_avg: Math.round(secondAvg)
    };
  }

  getBenchmarks(metricType, summary) {
    const benchmarks = {
      steps: {
        excellent: 12000,
        good: 10000,
        fair: 7500,
        poor: 5000,
        current: summary.averagePerDay || summary.totalSteps
      },
      heart_rate: {
        excellent: { min: 60, max: 80 },
        good: { min: 60, max: 90 },
        fair: { min: 50, max: 100 },
        current: summary.averageHeartRate
      },
      workouts: {
        excellent: 5,
        good: 3,
        fair: 2,
        poor: 1,
        current: summary.totalWorkouts
      }
    };

    return benchmarks[metricType] || {};
  }

  calculateTrendDirection(data) {
    if (!data || data.length < 3) return 'insufficient_data';
    
    const values = data.map(d => d.steps || d.value || 0);
    const recentTrend = values.slice(-7); // Last 7 data points
    
    let increases = 0;
    for (let i = 1; i < recentTrend.length; i++) {
      if (recentTrend[i] > recentTrend[i - 1]) increases++;
    }
    
    const increaseRatio = increases / (recentTrend.length - 1);
    
    if (increaseRatio > 0.6) return 'upward';
    if (increaseRatio < 0.4) return 'downward';
    return 'stable';
  }

  calculateTrendStrength(data) {
    if (!data || data.length < 2) return 0;
    
    const values = data.map(d => d.steps || d.value || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    
    // Normalize strength between 0 and 1
    return Math.min(Math.sqrt(variance) / mean, 1);
  }

  calculateVolatility(data) {
    if (!data || data.length < 2) return 0;
    
    const values = data.map(d => d.steps || d.value || 0);
    const changes = [];
    
    for (let i = 1; i < values.length; i++) {
      const change = Math.abs((values[i] - values[i - 1]) / values[i - 1]);
      changes.push(change);
    }
    
    return changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  calculateRecentChange(data) {
    if (!data || data.length < 2) return 0;
    
    const values = data.map(d => d.steps || d.value || 0);
    const recent = values[values.length - 1];
    const previous = values[values.length - 2];
    
    return ((recent - previous) / previous) * 100;
  }

  getPeriodDays(period) {
    const periods = {
      '30_days': 30,
      '90_days': 90,
      '6_months': 180,
      '1_year': 365
    };
    return periods[period] || 30;
  }

  async calculateCrossMetricCorrelations(metrics, userId, period) {
    // Mock correlation calculation
    const correlations = {};
    
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const key = `${metrics[i]}_${metrics[j]}`;
        correlations[key] = {
          coefficient: (Math.random() - 0.5) * 2, // Random correlation between -1 and 1
          significance: Math.random() > 0.5 ? 'significant' : 'not_significant'
        };
      }
    }
    
    return correlations;
  }

  generatePredictions(trends) {
    const predictions = {};
    
    for (const [metric, trend] of Object.entries(trends)) {
      predictions[metric] = {
        next_week: this.predictNextPeriod(trend, 'week'),
        next_month: this.predictNextPeriod(trend, 'month'),
        confidence: this.calculatePredictionConfidence(trend)
      };
    }
    
    return predictions;
  }

  predictNextPeriod(trend, period) {
    // Simple linear prediction based on trend direction
    const baseValue = 1000; // Mock base value
    const trendMultiplier = trend.direction === 'upward' ? 1.1 : trend.direction === 'downward' ? 0.9 : 1.0;
    
    return {
      predicted_value: Math.round(baseValue * trendMultiplier),
      trend_direction: trend.direction,
      confidence_level: trend.strength > 0.7 ? 'high' : trend.strength > 0.4 ? 'medium' : 'low'
    };
  }

  calculatePredictionConfidence(trend) {
    // Confidence based on trend strength and volatility
    const strengthScore = trend.strength || 0;
    const volatilityPenalty = (trend.volatility || 0) * 0.5;
    
    return Math.max(0, Math.min(1, strengthScore - volatilityPenalty));
  }

  calculateMockCorrelation(metric1, metric2) {
    // Mock correlation data for demonstration
    const correlationMap = {
      'steps_workouts': { coefficient: 0.75, strength: 'strong', significance: 'significant' },
      'steps_sleep': { coefficient: 0.45, strength: 'moderate', significance: 'significant' },
      'heart_rate_workouts': { coefficient: 0.65, strength: 'strong', significance: 'significant' },
      'workouts_sleep': { coefficient: -0.35, strength: 'moderate', significance: 'significant' }
    };

    const key = `${metric1}_${metric2}`;
    const reverseKey = `${metric2}_${metric1}`;
    
    const correlation = correlationMap[key] || correlationMap[reverseKey] || {
      coefficient: (Math.random() - 0.5) * 2,
      strength: 'weak',
      significance: 'not_significant'
    };

    correlation.interpretation = this.interpretCorrelation(correlation.coefficient);
    
    return correlation;
  }

  interpretCorrelation(coefficient) {
    const abs = Math.abs(coefficient);
    const direction = coefficient > 0 ? 'positive' : 'negative';
    
    if (abs > 0.8) return `Very strong ${direction} correlation`;
    if (abs > 0.6) return `Strong ${direction} correlation`;
    if (abs > 0.4) return `Moderate ${direction} correlation`;
    if (abs > 0.2) return `Weak ${direction} correlation`;
    return 'No significant correlation';
  }

  generateCorrelationRecommendations(correlations, primaryMetric) {
    const recommendations = [];
    
    for (const [metric, correlation] of Object.entries(correlations)) {
      if (Math.abs(correlation.coefficient) > 0.6) {
        if (correlation.coefficient > 0) {
          recommendations.push({
            type: 'positive_correlation',
            message: `Improving ${metric} may help improve ${primaryMetric}`,
            action: `Focus on activities that boost both ${primaryMetric} and ${metric}`
          });
        } else {
          recommendations.push({
            type: 'negative_correlation',
            message: `${metric} appears to negatively impact ${primaryMetric}`,
            action: `Monitor ${metric} levels when trying to improve ${primaryMetric}`
          });
        }
      }
    }
    
    return recommendations;
  }

  /**
   * Get all available tools
   */
  getTools() {
    return Object.values(this.tools);
  }

  /**
   * Execute a specific tool
   */
  async executeTool(toolName, args) {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    return await tool.handler(args);
  }

  /**
   * Health check for OpenSearch MCP tools
   */
  async healthCheck() {
    try {
      const opensearchHealth = await this.healthQueries.healthCheck();
      
      return {
        status: 'healthy',
        tools_available: Object.keys(this.tools).length,
        opensearch_status: opensearchHealth.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: error.message,
        tools_available: Object.keys(this.tools).length,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = OpenSearchMCPTools;
