/**
 * Health Data Manager
 * Integrates AWS Textract, OpenSearch, and Apple Health processing
 * Updated to use AWS SDK v3
 */

const { Client } = require('@opensearch-project/opensearch');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const winston = require('winston');

// AWS SDK v3 Services
const S3ServiceV3 = require('../../aws/s3-service-v3');
const TextractServiceV3 = require('../../aws/textract-service-v3');

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

class HealthDataManager {
  constructor() {
    // AWS SDK v3 Services
    this.s3Service = new S3ServiceV3();
    this.textractService = new TextractServiceV3();

    // OpenSearch client
    this.opensearchClient = new Client({
      node: process.env.OPENSEARCH_ENDPOINT || 'https://localhost:9200',
      auth: {
        username = "your_username".env.OPENSEARCH_USERNAME || 'admin',
        password = "your_secure_password"|| 'admin'
      }
    });

    // Health data indices
    this.indices = {
      health_records: 'health-records',
      health_metrics: 'health-metrics',
      family_data: 'family-health-data'
    };
  }

  /**
   * Search health data across all indices
   */
  async searchHealthData(query, dateRange, dataTypes) {
    try {
      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['content', 'type', 'category', 'description']
                }
              }
            ],
            filter: []
          }
        },
        sort: [
          { timestamp: { order: 'desc' } }
        ],
        size: 100
      };

      // Add date range filter
      if (dateRange && dateRange.start && dateRange.end) {
        searchBody.query.bool.filter.push({
          range: {
            timestamp: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          }
        });
      }

      // Add data type filter
      if (dataTypes && dataTypes.length > 0) {
        searchBody.query.bool.filter.push({
          terms: {
            type: dataTypes
          }
        });
      }

      const results = [];
      
      // Search across all health indices
      for (const indexName of Object.values(this.indices)) {
        try {
          const response = await this.opensearchClient.search({
            index: indexName,
            body: searchBody
          });

          if (response.body.hits && response.body.hits.hits) {
            results.push(...response.body.hits.hits.map(hit => ({
              index: indexName,
              id: hit._id,
              score: hit._score,
              source: hit._source
            })));
          }
        } catch (indexError) {
          logger.warn(`Error searching index ${indexName}:`, indexError.message);
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      logger.info(`Health data search completed: ${results.length} results found`);
      return results;

    } catch (error) {
      logger.error('Error searching health data:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered health insights using Strands Agent
   */
  async generateInsights(userId, insightType, timePeriod) {
    try {
      // Initialize AI services if not already done
      if (!this.strandsAgent) {
        const StrandsAgent = require('../../ai/strands-agent');
        this.strandsAgent = new StrandsAgent();
      }

      // Fetch user's health data for the specified time period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timePeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const healthData = await this.searchHealthData('*', {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }, null);

      // Filter data for specific user
      const userData = healthData.filter(record => 
        record.source.user_id === userId
      );

      // Generate AI-powered insights using Strands Agent
      const aiInsights = await this.strandsAgent.generateHealthInsights(
        userData.map(record => record.source), 
        insightType, 
        userId
      );

      // Combine AI insights with local analysis
      const localInsights = await this.generateLocalInsights(userData, insightType, timePeriod);

      return {
        ai_insights: aiInsights,
        local_analysis: localInsights,
        data_summary: {
          records_analyzed: userData.length,
          time_period: timePeriod,
          insight_type: insightType,
          user_id: userId
        },
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error generating health insights:', error);
      
      // Fallback to local insights if AI services fail
      const userData = await this.getUserHealthData(userId, timePeriod);
      return await this.generateLocalInsights(userData, insightType, timePeriod);
    }
  }

  /**
   * Generate local insights as fallback
   */
  async generateLocalInsights(userData, insightType, timePeriod) {
    let insights = '';

    switch (insightType) {
      case 'trends':
        insights = await this.generateTrendInsights(userData, timePeriod);
        break;
      case 'recommendations':
        insights = await this.generateRecommendations(userData);
        break;
      case 'alerts':
        insights = await this.generateHealthAlerts(userData);
        break;
      case 'summary':
        insights = await this.generateHealthSummary(userData, timePeriod);
        break;
    }

    return {
      type: 'local_analysis',
      insights: insights,
      confidence: 'medium',
      source: 'local_algorithms'
    };
  }

  /**
   * Get user health data for specified time period
   */
  async getUserHealthData(userId, timePeriod) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timePeriod) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const healthData = await this.searchHealthData('*', {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }, null);

    return healthData.filter(record => record.source.user_id === userId);
  }

  /**
   * Generate trend insights from health data
   */
  async generateTrendInsights(userData, timePeriod) {
    const trends = {
      steps: [],
      heart_rate: [],
      workouts: [],
      weight: []
    };

    // Aggregate data by type
    userData.forEach(record => {
      const data = record.source;
      switch (data.type) {
        case 'steps':
          trends.steps.push({ date: data.timestamp, value: data.value });
          break;
        case 'heart_rate':
          trends.heart_rate.push({ date: data.timestamp, value: data.value });
          break;
        case 'workouts':
          trends.workouts.push({ date: data.timestamp, duration: data.duration });
          break;
        case 'weight':
          trends.weight.push({ date: data.timestamp, value: data.value });
          break;
      }
    });

    let insights = `Health Trends Analysis (${timePeriod}):\n\n`;

    // Steps analysis
    if (trends.steps.length > 0) {
      const avgSteps = trends.steps.reduce((sum, item) => sum + item.value, 0) / trends.steps.length;
      insights += `📱 Steps: Average ${Math.round(avgSteps)} steps/day\n`;
      
      if (avgSteps < 5000) {
        insights += `   ⚠️  Below recommended daily activity level\n`;
      } else if (avgSteps > 10000) {
        insights += `   ✅ Excellent daily activity level!\n`;
      }
    }

    // Heart rate analysis
    if (trends.heart_rate.length > 0) {
      const avgHR = trends.heart_rate.reduce((sum, item) => sum + item.value, 0) / trends.heart_rate.length;
      insights += `❤️  Heart Rate: Average ${Math.round(avgHR)} bpm\n`;
    }

    // Workout analysis
    if (trends.workouts.length > 0) {
      const totalWorkouts = trends.workouts.length;
      const avgDuration = trends.workouts.reduce((sum, item) => sum + (item.duration || 0), 0) / totalWorkouts;
      insights += `🏃 Workouts: ${totalWorkouts} sessions, avg ${Math.round(avgDuration)} minutes\n`;
    }

    return insights;
  }

  /**
   * Generate health recommendations
   */
  async generateRecommendations(userData) {
    let recommendations = "Personalized Health Recommendations:\n\n";

    // Analyze activity levels
    const stepData = userData.filter(record => record.source.type === 'steps');
    if (stepData.length > 0) {
      const avgSteps = stepData.reduce((sum, record) => sum + record.source.value, 0) / stepData.length;
      
      if (avgSteps < 5000) {
        recommendations += "🚶 Consider increasing daily walking to reach 8,000-10,000 steps\n";
        recommendations += "   • Take stairs instead of elevators\n";
        recommendations += "   • Park further away from destinations\n";
        recommendations += "   • Take walking breaks every hour\n\n";
      }
    }

    // Analyze workout frequency
    const workoutData = userData.filter(record => record.source.type === 'workouts');
    if (workoutData.length < 3) {
      recommendations += "💪 Aim for at least 3 workout sessions per week\n";
      recommendations += "   • Mix cardio and strength training\n";
      recommendations += "   • Start with 20-30 minute sessions\n\n";
    }

    return recommendations;
  }

  /**
   * Generate health alerts
   */
  async generateHealthAlerts(userData) {
    let alerts = "Health Alerts:\n\n";
    let alertCount = 0;

    // Check for concerning patterns
    const recentData = userData.filter(record => {
      const recordDate = new Date(record.source.timestamp);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return recordDate >= threeDaysAgo;
    });

    // Low activity alert
    const recentSteps = recentData.filter(record => record.source.type === 'steps');
    if (recentSteps.length > 0) {
      const avgRecentSteps = recentSteps.reduce((sum, record) => sum + record.source.value, 0) / recentSteps.length;
      if (avgRecentSteps < 2000) {
        alerts += "⚠️  Very low activity detected in recent days\n";
        alerts += "   Consider consulting with healthcare provider\n\n";
        alertCount++;
      }
    }

    if (alertCount === 0) {
      alerts += "✅ No concerning patterns detected\n";
    }

    return alerts;
  }

  /**
   * Generate health summary
   */
  async generateHealthSummary(userData, timePeriod) {
    let summary = `Health Summary (${timePeriod}):\n\n`;

    const dataTypes = ['steps', 'heart_rate', 'workouts', 'weight'];
    
    dataTypes.forEach(type => {
      const typeData = userData.filter(record => record.source.type === type);
      if (typeData.length > 0) {
        summary += `${type.toUpperCase()}: ${typeData.length} records\n`;
      }
    });

    summary += `\nTotal health records: ${userData.length}\n`;
    summary += `Data collection period: ${timePeriod}\n`;

    return summary;
  }

  /**
   * Get family health summary with privacy controls
   */
  async getFamilyHealthSummary(familyId, includeMembers, privacyLevel) {
    try {
      const familyData = await this.searchHealthData(`family_id:${familyId}`, null, null);
      
      let filteredData = familyData;
      
      // Filter by specific members if requested
      if (includeMembers && includeMembers.length > 0) {
        filteredData = familyData.filter(record => 
          includeMembers.includes(record.source.user_id)
        );
      }

      const summary = {
        family_id: familyId,
        total_members: new Set(filteredData.map(record => record.source.user_id)).size,
        total_records: filteredData.length,
        privacy_level: privacyLevel
      };

      switch (privacyLevel) {
        case 'basic':
          summary.overview = 'Basic health metrics available';
          break;
        case 'detailed':
          summary.member_summaries = this.generateMemberSummaries(filteredData);
          break;
        case 'full':
          summary.member_summaries = this.generateMemberSummaries(filteredData);
          summary.detailed_records = filteredData.slice(0, 50); // Limit for privacy
          break;
      }

      return summary;

    } catch (error) {
      logger.error('Error generating family health summary:', error);
      throw error;
    }
  }

  /**
   * Generate member summaries for family health
   */
  generateMemberSummaries(familyData) {
    const memberData = {};
    
    familyData.forEach(record => {
      const userId = record.source.user_id;
      if (!memberData[userId]) {
        memberData[userId] = {
          user_id: userId,
          record_count: 0,
          data_types: new Set()
        };
      }
      
      memberData[userId].record_count++;
      memberData[userId].data_types.add(record.source.type);
    });

    // Convert sets to arrays for JSON serialization
    Object.values(memberData).forEach(member => {
      member.data_types = Array.from(member.data_types);
    });

    return memberData;
  }

  /**
   * Process health documents using AWS SDK v3 services
   */
  async processHealthDocument(documentPath, documentType, extractTables) {
    try {
      // Read document file
      const documentBuffer = await fs.readFile(documentPath);
      
      // Upload to S3 using v3 service
      const file = {
        buffer: documentBuffer,
        originalname: path.basename(documentPath),
        mimetype: 'application/pdf',
        size: documentBuffer.length
      };

      const uploadResult = await this.s3Service.uploadHealthDocument(file, 'temp-user');
      
      // Process with Textract using v3 service
      const features = extractTables ? ['TABLES', 'FORMS'] : ['FORMS'];
      const textractResult = await this.textractService.analyzeHealthDocument(uploadResult.key, 'temp-user', features);
      
      // Extract text and structured data
      const extractedData = this.parseTextractResults(textractResult, documentType);
      
      // Index in OpenSearch
      await this.indexHealthDocument(extractedData, documentType);
      
      // Clean up S3 object
      await this.s3Service.deleteHealthDocument(uploadResult.key, 'temp-user');

      logger.info(`Successfully processed health document: ${documentPath}`);
      return extractedData;

    } catch (error) {
      logger.error('Error processing health document:', error);
      throw error;
    }
  }

  /**
   * Parse AWS Textract results
   */
  parseTextractResults(textractResult, documentType) {
    const extractedData = {
      document_type: documentType,
      timestamp: new Date().toISOString(),
      text_content: '',
      structured_data: {},
      tables: [],
      forms: []
    };

    if (textractResult.Blocks) {
      textractResult.Blocks.forEach(block => {
        switch (block.BlockType) {
          case 'LINE':
            extractedData.text_content += block.Text + '\n';
            break;
          case 'TABLE':
            // Process table data
            extractedData.tables.push(this.extractTableData(block, textractResult.Blocks));
            break;
          case 'KEY_VALUE_SET':
            // Process form data
            if (block.EntityTypes && block.EntityTypes.includes('KEY')) {
              const formData = this.extractFormData(block, textractResult.Blocks);
              if (formData.key && formData.value) {
                extractedData.forms.push(formData);
              }
            }
            break;
        }
      });
    }

    // Extract health-specific patterns
    extractedData.structured_data = this.extractHealthPatterns(extractedData.text_content, documentType);

    return extractedData;
  }

  /**
   * Extract health-specific patterns from text
   */
  extractHealthPatterns(textContent, documentType) {
    const patterns = {};

    switch (documentType) {
      case 'lab_report':
        patterns.lab_values = this.extractLabValues(textContent);
        break;
      case 'medical_record':
        patterns.vitals = this.extractVitals(textContent);
        patterns.medications = this.extractMedications(textContent);
        break;
      case 'prescription':
        patterns.medications = this.extractMedications(textContent);
        break;
    }

    return patterns;
  }

  /**
   * Extract lab values from text
   */
  extractLabValues(text) {
    const labValues = [];
    
    // Common lab value patterns
    const patterns = [
      /(\w+)\s*:\s*(\d+\.?\d*)\s*(\w+\/?\w*)/g,
      /(\w+)\s+(\d+\.?\d*)\s+(\w+\/?\w*)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        labValues.push({
          test: match[1],
          value: parseFloat(match[2]),
          unit: match[3]
        });
      }
    });

    return labValues;
  }

  /**
   * Extract vital signs from text
   */
  extractVitals(text) {
    const vitals = {};
    
    // Blood pressure
    const bpMatch = text.match(/(\d{2,3})\/(\d{2,3})/);
    if (bpMatch) {
      vitals.blood_pressure = {
        systolic: parseInt(bpMatch[1]),
        diastolic: parseInt(bpMatch[2])
      };
    }

    // Heart rate
    const hrMatch = text.match(/heart rate:?\s*(\d+)/i);
    if (hrMatch) {
      vitals.heart_rate = parseInt(hrMatch[1]);
    }

    // Temperature
    const tempMatch = text.match(/temperature:?\s*(\d+\.?\d*)/i);
    if (tempMatch) {
      vitals.temperature = parseFloat(tempMatch[1]);
    }

    return vitals;
  }

  /**
   * Extract medications from text
   */
  extractMedications(text) {
    const medications = [];
    
    // Simple medication pattern matching
    const medPatterns = [
      /(\w+)\s+(\d+)\s*mg/gi,
      /(\w+)\s+(\d+)\s*mcg/gi
    ];

    medPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        medications.push({
          name: match[1],
          dosage: match[2],
          unit: match[0].includes('mcg') ? 'mcg' : 'mg'
        });
      }
    });

    return medications;
  }

  /**
   * Index health document in OpenSearch
   */
  async indexHealthDocument(extractedData, documentType) {
    try {
      const indexName = this.indices.health_records;
      
      await this.opensearchClient.index({
        index: indexName,
        body: {
          ...extractedData,
          indexed_at: new Date().toISOString()
        }
      });

      logger.info(`Indexed health document in OpenSearch: ${documentType}`);

    } catch (error) {
      logger.error('Error indexing health document:', error);
      throw error;
    }
  }

  /**
   * Extract table data from Textract blocks
   */
  extractTableData(tableBlock, allBlocks) {
    // Simplified table extraction
    return {
      table_id: tableBlock.Id,
      confidence: tableBlock.Confidence,
      // Additional table processing would go here
    };
  }

  /**
   * Extract form data from Textract blocks
   */
  extractFormData(keyBlock, allBlocks) {
    // Simplified form extraction
    return {
      key: keyBlock.Text || '',
      value: '',
      confidence: keyBlock.Confidence
    };
  }
}

module.exports = HealthDataManager;
