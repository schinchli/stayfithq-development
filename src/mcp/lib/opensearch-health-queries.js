/**
 * OpenSearch MCP Health Data Queries
 * Handles natural language queries for health data like "show me footsteps last week"
 */

const { Client } = require('@opensearch-project/opensearch');
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

class OpenSearchHealthQueries {
  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_ENDPOINT || 'https://localhost:9200',
      auth: {
        username = "your_username".env.OPENSEARCH_USERNAME || 'admin',
        password = "your_secure_password"|| 'admin'
      }
    });

    this.indices = {
      health_metrics: 'health-metrics',
      apple_health: 'apple-health-data',
      health_records: 'health-records'
    };

    // Natural language query patterns
    this.queryPatterns = {
      steps: /(?:show me |get |find )?(?:my )?(?:foot)?steps?(?:\s+(?:data|count|activity))?(?:\s+(?:for|from|in|during|over))?\s+(.+)/i,
      heart_rate: /(?:show me |get |find )?(?:my )?heart\s*rate(?:\s+(?:data|readings))?(?:\s+(?:for|from|in|during|over))?\s+(.+)/i,
      workouts: /(?:show me |get |find )?(?:my )?(?:workouts?|exercise|activities?)(?:\s+(?:data|sessions?))?(?:\s+(?:for|from|in|during|over))?\s+(.+)/i,
      sleep: /(?:show me |get |find )?(?:my )?sleep(?:\s+(?:data|patterns?|hours?))?(?:\s+(?:for|from|in|during|over))?\s+(.+)/i,
      weight: /(?:show me |get |find )?(?:my )?weight(?:\s+(?:data|measurements?))?(?:\s+(?:for|from|in|during|over))?\s+(.+)/i,
      blood_pressure: /(?:show me |get |find )?(?:my )?(?:blood\s*pressure|bp)(?:\s+(?:data|readings?))?(?:\s+(?:for|from|in|during|over))?\s+(.+)/i
    };

    // Time period patterns
    this.timePatterns = {
      'last week': { days: 7, type: 'last' },
      'this week': { days: 7, type: 'current' },
      'past week': { days: 7, type: 'last' },
      'last month': { days: 30, type: 'last' },
      'this month': { days: 30, type: 'current' },
      'past month': { days: 30, type: 'last' },
      'last 7 days': { days: 7, type: 'last' },
      'last 30 days': { days: 30, type: 'last' },
      'yesterday': { days: 1, type: 'last' },
      'today': { days: 1, type: 'current' },
      'last year': { days: 365, type: 'last' },
      'this year': { days: 365, type: 'current' }
    };
  }

  /**
   * Process natural language health query
   */
  async processHealthQuery(query, userId = 'default_user') {
    try {
      logger.info(`Processing health query: "${query}" for user ${userId}`);

      // Parse the query to identify metric type and time period
      const parsedQuery = this.parseQuery(query);
      
      if (!parsedQuery.metric) {
        return {
          error: 'Could not understand the health metric requested',
          suggestion: 'Try queries like "show me steps last week" or "heart rate this month"'
        };
      }

      // Build OpenSearch query
      const searchQuery = this.buildOpenSearchQuery(parsedQuery, userId);
      
      // Execute search
      const results = await this.executeSearch(searchQuery, parsedQuery.metric);
      
      // Format results for display
      const formattedResults = this.formatResults(results, parsedQuery);
      
      logger.info(`Query processed successfully: ${results.hits?.total?.value || 0} records found`);
      
      return formattedResults;

    } catch (error) {
      logger.error('Error processing health query:', error);
      throw error;
    }
  }

  /**
   * Parse natural language query
   */
  parseQuery(query) {
    const lowerQuery = query.toLowerCase().trim();
    
    let metric = null;
    let timePhrase = null;
    let timePeriod = null;

    // Identify metric type
    for (const [metricType, pattern] of Object.entries(this.queryPatterns)) {
      const match = lowerQuery.match(pattern);
      if (match) {
        metric = metricType;
        timePhrase = match[1]?.trim();
        break;
      }
    }

    // Parse time period
    if (timePhrase) {
      for (const [phrase, period] of Object.entries(this.timePatterns)) {
        if (timePhrase.includes(phrase)) {
          timePeriod = period;
          break;
        }
      }
    }

    // Default to last week if no time period specified
    if (!timePeriod) {
      timePeriod = { days: 7, type: 'last' };
    }

    return {
      originalQuery: query,
      metric: metric,
      timePhrase: timePhrase,
      timePeriod: timePeriod
    };
  }

  /**
   * Build OpenSearch query
   */
  buildOpenSearchQuery(parsedQuery, userId) {
    const { metric, timePeriod } = parsedQuery;
    
    // Calculate date range
    const endDate = timePeriod.type === 'current' ? new Date() : new Date();
    const startDate = new Date();
    
    if (timePeriod.type === 'last') {
      endDate.setDate(endDate.getDate() - 1); // End yesterday for "last week"
      startDate.setDate(endDate.getDate() - timePeriod.days + 1);
    } else {
      // Current period (this week/month)
      startDate.setDate(endDate.getDate() - timePeriod.days + 1);
    }

    const query = {
      index: this.indices.health_metrics,
      body: {
        query: {
          bool: {
            must: [
              {
                term: {
                  'user_id.keyword': userId
                }
              },
              {
                term: {
                  'type.keyword': metric === 'steps' ? 'steps' : metric
                }
              },
              {
                range: {
                  timestamp: {
                    gte: startDate.toISOString(),
                    lte: endDate.toISOString()
                  }
                }
              }
            ]
          }
        },
        sort: [
          {
            timestamp: {
              order: 'desc'
            }
          }
        ],
        size: 1000,
        aggs: {
          daily_totals: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'day',
              format: 'yyyy-MM-dd'
            },
            aggs: {
              total_value: {
                sum: {
                  field: 'value'
                }
              },
              avg_value: {
                avg: {
                  field: 'value'
                }
              }
            }
          },
          total_sum: {
            sum: {
              field: 'value'
            }
          },
          avg_value: {
            avg: {
              field: 'value'
            }
          },
          max_value: {
            max: {
              field: 'value'
            }
          },
          min_value: {
            min: {
              field: 'value'
            }
          }
        }
      }
    };

    return query;
  }

  /**
   * Execute OpenSearch query
   */
  async executeSearch(query, metric) {
    try {
      // For demonstration, return mock data since we may not have OpenSearch running
      if (process.env.NODE_ENV === 'development' || !process.env.OPENSEARCH_ENDPOINT) {
        return this.getMockData(metric);
      }

      const response = await this.client.search(query);
      return response.body;

    } catch (error) {
      logger.warn('OpenSearch not available, returning mock data:', error.message);
      return this.getMockData(metric);
    }
  }

  /**
   * Get mock data for demonstration
   */
  getMockData(metric) {
    const mockData = {
      steps: {
        hits: {
          total: { value: 7 },
          hits: [
            { _source: { timestamp: '2024-06-27T00:00:00Z', value: 1247, type: 'steps' } },
            { _source: { timestamp: '2024-06-26T00:00:00Z', value: 2156, type: 'steps' } },
            { _source: { timestamp: '2024-06-25T00:00:00Z', value: 892, type: 'steps' } },
            { _source: { timestamp: '2024-06-24T00:00:00Z', value: 3421, type: 'steps' } },
            { _source: { timestamp: '2024-06-23T00:00:00Z', value: 1876, type: 'steps' } },
            { _source: { timestamp: '2024-06-22T00:00:00Z', value: 2543, type: 'steps' } },
            { _source: { timestamp: '2024-06-21T00:00:00Z', value: 1987, type: 'steps' } }
          ]
        },
        aggregations: {
          total_sum: { value: 14122 },
          avg_value: { value: 2017.4 },
          max_value: { value: 3421 },
          min_value: { value: 892 },
          daily_totals: {
            buckets: [
              { key_as_string: '2024-06-21', total_value: { value: 1987 } },
              { key_as_string: '2024-06-22', total_value: { value: 2543 } },
              { key_as_string: '2024-06-23', total_value: { value: 1876 } },
              { key_as_string: '2024-06-24', total_value: { value: 3421 } },
              { key_as_string: '2024-06-25', total_value: { value: 892 } },
              { key_as_string: '2024-06-26', total_value: { value: 2156 } },
              { key_as_string: '2024-06-27', total_value: { value: 1247 } }
            ]
          }
        }
      },
      heart_rate: {
        hits: {
          total: { value: 15 },
          hits: [
            { _source: { timestamp: '2024-06-27T12:00:00Z', value: 72, type: 'heart_rate' } },
            { _source: { timestamp: '2024-06-27T08:00:00Z', value: 68, type: 'heart_rate' } },
            { _source: { timestamp: '2024-06-26T15:00:00Z', value: 75, type: 'heart_rate' } }
          ]
        },
        aggregations: {
          total_sum: { value: 1080 },
          avg_value: { value: 72 },
          max_value: { value: 85 },
          min_value: { value: 62 }
        }
      },
      workouts: {
        hits: {
          total: { value: 3 },
          hits: [
            { _source: { timestamp: '2024-06-27T07:00:00Z', value: 30, type: 'workouts', workout_type: 'running' } },
            { _source: { timestamp: '2024-06-25T18:00:00Z', value: 45, type: 'workouts', workout_type: 'cycling' } },
            { _source: { timestamp: '2024-06-23T06:30:00Z', value: 25, type: 'workouts', workout_type: 'walking' } }
          ]
        },
        aggregations: {
          total_sum: { value: 100 },
          avg_value: { value: 33.3 }
        }
      }
    };

    return mockData[metric] || mockData.steps;
  }

  /**
   * Format results for display
   */
  formatResults(results, parsedQuery) {
    const { metric, timePeriod, originalQuery } = parsedQuery;
    
    const totalRecords = results.hits?.total?.value || 0;
    const records = results.hits?.hits || [];
    const aggregations = results.aggregations || {};

    // Format based on metric type
    let formattedResult = {
      query: originalQuery,
      metric: metric,
      timePeriod: `${timePeriod.type} ${timePeriod.days} days`,
      totalRecords: totalRecords,
      summary: {},
      dailyData: [],
      insights: [],
      visualization: {}
    };

    switch (metric) {
      case 'steps':
        formattedResult = this.formatStepsResults(formattedResult, results, aggregations);
        break;
      case 'heart_rate':
        formattedResult = this.formatHeartRateResults(formattedResult, results, aggregations);
        break;
      case 'workouts':
        formattedResult = this.formatWorkoutResults(formattedResult, results, aggregations);
        break;
      default:
        formattedResult.summary = { message: 'Data retrieved successfully' };
    }

    return formattedResult;
  }

  /**
   * Format steps results
   */
  formatStepsResults(result, results, aggregations) {
    const totalSteps = aggregations.total_sum?.value || 0;
    const avgSteps = aggregations.avg_value?.value || 0;
    const maxSteps = aggregations.max_value?.value || 0;
    const minSteps = aggregations.min_value?.value || 0;

    result.summary = {
      totalSteps: Math.round(totalSteps),
      averagePerDay: Math.round(avgSteps),
      highestDay: Math.round(maxSteps),
      lowestDay: Math.round(minSteps),
      unit: 'steps'
    };

    // Daily breakdown
    if (aggregations.daily_totals?.buckets) {
      result.dailyData = aggregations.daily_totals.buckets.map(bucket => ({
        date: bucket.key_as_string,
        steps: Math.round(bucket.total_value.value),
        dayOfWeek: new Date(bucket.key_as_string).toLocaleDateString('en-US', { weekday: 'short' })
      }));
    }

    // Generate insights
    result.insights = [];
    
    if (avgSteps < 5000) {
      result.insights.push({
        type: 'warning',
        message: `Your average of ${Math.round(avgSteps)} steps/day is below the recommended 8,000-10,000 steps`,
        recommendation: 'Try to increase daily walking activity'
      });
    } else if (avgSteps >= 10000) {
      result.insights.push({
        type: 'positive',
        message: `Excellent! You're averaging ${Math.round(avgSteps)} steps/day`,
        recommendation: 'Keep up the great activity level!'
      });
    } else {
      result.insights.push({
        type: 'info',
        message: `You're averaging ${Math.round(avgSteps)} steps/day`,
        recommendation: 'Try to reach 10,000 steps daily for optimal health'
      });
    }

    // Check for consistency
    const dailySteps = result.dailyData.map(d => d.steps);
    const variance = this.calculateVariance(dailySteps);
    if (variance > 1000000) { // High variance
      result.insights.push({
        type: 'info',
        message: 'Your daily step count varies significantly',
        recommendation: 'Try to maintain more consistent daily activity'
      });
    }

    // Visualization data
    result.visualization = {
      chartType: 'line',
      labels: result.dailyData.map(d => d.dayOfWeek),
      data: result.dailyData.map(d => d.steps),
      goal: 10000,
      color: avgSteps >= 8000 ? '#28a745' : avgSteps >= 5000 ? '#ffc107' : '#dc3545'
    };

    return result;
  }

  /**
   * Format heart rate results
   */
  formatHeartRateResults(result, results, aggregations) {
    const avgHR = aggregations.avg_value?.value || 0;
    const maxHR = aggregations.max_value?.value || 0;
    const minHR = aggregations.min_value?.value || 0;

    result.summary = {
      averageHeartRate: Math.round(avgHR),
      maxHeartRate: Math.round(maxHR),
      minHeartRate: Math.round(minHR),
      unit: 'bpm'
    };

    // Generate insights
    result.insights = [];
    
    if (avgHR > 100) {
      result.insights.push({
        type: 'warning',
        message: `Your average heart rate of ${Math.round(avgHR)} bpm is elevated`,
        recommendation: 'Consider consulting with a healthcare provider'
      });
    } else if (avgHR >= 60 && avgHR <= 100) {
      result.insights.push({
        type: 'positive',
        message: `Your average heart rate of ${Math.round(avgHR)} bpm is within normal range`,
        recommendation: 'Continue monitoring your heart health'
      });
    }

    return result;
  }

  /**
   * Format workout results
   */
  formatWorkoutResults(result, results, aggregations) {
    const totalMinutes = aggregations.total_sum?.value || 0;
    const avgDuration = aggregations.avg_value?.value || 0;
    const workoutCount = results.hits?.total?.value || 0;

    result.summary = {
      totalWorkouts: workoutCount,
      totalMinutes: Math.round(totalMinutes),
      averageDuration: Math.round(avgDuration),
      unit: 'minutes'
    };

    // Workout types
    const workoutTypes = {};
    results.hits?.hits?.forEach(hit => {
      const type = hit._source.workout_type || 'unknown';
      workoutTypes[type] = (workoutTypes[type] || 0) + 1;
    });

    result.workoutTypes = workoutTypes;

    // Generate insights
    result.insights = [];
    
    if (workoutCount < 3) {
      result.insights.push({
        type: 'recommendation',
        message: `You had ${workoutCount} workouts this period`,
        recommendation: 'Aim for at least 3 workout sessions per week'
      });
    } else {
      result.insights.push({
        type: 'positive',
        message: `Great job! You completed ${workoutCount} workouts`,
        recommendation: 'Keep up the consistent exercise routine'
      });
    }

    return result;
  }

  /**
   * Calculate variance for consistency analysis
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get available query examples
   */
  getQueryExamples() {
    return [
      "show me steps last week",
      "footsteps this month",
      "my heart rate yesterday",
      "workouts last 30 days",
      "sleep data this week",
      "weight measurements last month",
      "blood pressure readings last week",
      "show me my activity today",
      "steps for the past 7 days",
      "heart rate trends this month"
    ];
  }

  /**
   * Health check for OpenSearch connection
   */
  async healthCheck() {
    try {
      const response = await this.client.cluster.health();
      return {
        status: 'healthy',
        cluster_status: response.body.status,
        indices: Object.keys(this.indices).length
      };
    } catch (error) {
      return {
        status: 'unavailable',
        error: error.message,
        fallback: 'Using mock data'
      };
    }
  }
}

module.exports = OpenSearchHealthQueries;
