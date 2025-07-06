/**
 * Strands Agent for Multi-Service Orchestration
 * Coordinates AWS Bedrock Claude, OpenSearch MCP, and Perplexity API
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const axios = require('axios');
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
    }),
    new winston.transports.File({ filename: 'logs/strands-agent.log' })
  ]
});

class StrandsAgent {
  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'your-aws-region'
    });
    
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.perplexityBaseUrl = 'https://api.perplexity.ai';
    
    this.services = {
      bedrock: { available: true, lastCheck: null },
      opensearch: { available: true, lastCheck: null },
      perplexity: { available: !!this.perplexityApiKey, lastCheck: null }
    };

    this.healthInsightPrompts = {
      trends: this.createTrendAnalysisPrompt(),
      recommendations: this.createRecommendationPrompt(),
      alerts: this.createHealthAlertPrompt(),
      summary: this.createSummaryPrompt()
    };
  }

  /**
   * Generate comprehensive health insights using multiple AI services
   */
  async generateHealthInsights(healthData, insightType, userId) {
    try {
      logger.info(`Generating ${insightType} insights for user ${userId}`);

      // Step 1: Analyze health data with Claude
      const claudeAnalysis = await this.analyzeWithClaude(healthData, insightType);
      
      // Step 2: Enhance with medical literature search via Perplexity
      const literatureContext = await this.searchMedicalLiterature(healthData, insightType);
      
      // Step 3: Combine insights and generate final recommendations
      const combinedInsights = await this.synthesizeInsights(
        claudeAnalysis, 
        literatureContext, 
        healthData, 
        insightType
      );

      logger.info(`Successfully generated ${insightType} insights for user ${userId}`);
      return combinedInsights;

    } catch (error) {
      logger.error('Error generating health insights:', error);
      throw error;
    }
  }

  /**
   * Analyze health data using AWS Bedrock Claude
   */
  async analyzeWithClaude(healthData, insightType) {
    try {
      const prompt = this.buildClaudePrompt(healthData, insightType);
      
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        analysis: responseBody.content[0].text,
        confidence: this.calculateConfidence(healthData),
        source: 'aws_bedrock_claude',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error analyzing with Claude:', error);
      
      // Fallback to local analysis if Bedrock is unavailable
      return this.generateFallbackAnalysis(healthData, insightType);
    }
  }

  /**
   * Search medical literature using Perplexity API
   */
  async searchMedicalLiterature(healthData, insightType) {
    if (!this.services.perplexity.available) {
      logger.warn('Perplexity API not available, skipping literature search');
      return null;
    }

    try {
      const searchQuery = this.buildMedicalSearchQuery(healthData, insightType);
      
      const response = await axios.post(
        `${this.perplexityBaseUrl}/chat/completions`,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a medical research assistant. Provide evidence-based information from recent medical literature and studies. Focus on peer-reviewed sources and clinical guidelines.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 1000,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        literature_findings: response.data.choices[0].message.content,
        sources: response.data.citations || [],
        source: 'perplexity_api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error searching medical literature:', error);
      return null;
    }
  }

  /**
   * Synthesize insights from multiple AI services
   */
  async synthesizeInsights(claudeAnalysis, literatureContext, healthData, insightType) {
    const synthesizedInsights = {
      type: insightType,
      user_data_summary: this.summarizeHealthData(healthData),
      ai_analysis: claudeAnalysis,
      literature_context: literatureContext,
      recommendations: [],
      alerts: [],
      confidence_score: claudeAnalysis.confidence,
      generated_at: new Date().toISOString(),
      data_sources: ['health_records', 'aws_bedrock_claude']
    };

    if (literatureContext) {
      synthesizedInsights.data_sources.push('medical_literature');
    }

    // Generate specific recommendations based on insight type
    switch (insightType) {
      case 'trends':
        synthesizedInsights.recommendations = this.generateTrendRecommendations(healthData, claudeAnalysis);
        break;
      case 'recommendations':
        synthesizedInsights.recommendations = this.generateActionableRecommendations(healthData, claudeAnalysis, literatureContext);
        break;
      case 'alerts':
        synthesizedInsights.alerts = this.generateHealthAlerts(healthData, claudeAnalysis);
        break;
      case 'summary':
        synthesizedInsights.summary = this.generateHealthSummary(healthData, claudeAnalysis);
        break;
    }

    return synthesizedInsights;
  }

  /**
   * Build Claude prompt for health analysis
   */
  buildClaudePrompt(healthData, insightType) {
    const basePrompt = `You are a health data analyst AI assistant. Analyze the following health data and provide ${insightType} insights.

Health Data Summary:
- Total records: ${healthData.length || 0}
- Data types: ${this.getDataTypes(healthData).join(', ')}
- Date range: ${this.getDateRange(healthData)}

Detailed Health Data:
${JSON.stringify(healthData.slice(0, 10), null, 2)}

${this.healthInsightPrompts[insightType]}

Please provide:
1. Key findings from the data
2. Health patterns and trends
3. Specific recommendations
4. Any concerning patterns that need attention
5. Confidence level in your analysis (1-10)

Format your response as structured analysis with clear sections.`;

    return basePrompt;
  }

  /**
   * Build medical search query for Perplexity
   */
  buildMedicalSearchQuery(healthData, insightType) {
    const dataTypes = this.getDataTypes(healthData);
    const healthConcerns = this.identifyHealthConcerns(healthData);

    let query = `Recent medical research and clinical guidelines for `;

    switch (insightType) {
      case 'trends':
        query += `health trend analysis and monitoring for ${dataTypes.join(', ')} data. `;
        break;
      case 'recommendations':
        query += `evidence-based health recommendations for ${healthConcerns.join(', ')}. `;
        break;
      case 'alerts':
        query += `health alert criteria and warning signs for ${healthConcerns.join(', ')}. `;
        break;
      case 'summary':
        query += `comprehensive health assessment guidelines for ${dataTypes.join(', ')}. `;
        break;
    }

    query += `Focus on peer-reviewed studies from 2023-2024 and current clinical practice guidelines.`;

    return query;
  }

  /**
   * Generate trend-specific recommendations
   */
  generateTrendRecommendations(healthData, claudeAnalysis) {
    const recommendations = [];
    const dataTypes = this.getDataTypes(healthData);

    if (dataTypes.includes('steps')) {
      const stepData = healthData.filter(record => record.type === 'steps');
      const avgSteps = stepData.reduce((sum, record) => sum + (record.value || 0), 0) / stepData.length;
      
      if (avgSteps < 5000) {
        recommendations.push({
          category: 'activity',
          priority: 'high',
          recommendation: 'Increase daily walking activity to reach 8,000-10,000 steps per day',
          evidence_level: 'strong',
          source: 'trend_analysis'
        });
      }
    }

    if (dataTypes.includes('heart_rate')) {
      recommendations.push({
        category: 'cardiovascular',
        priority: 'medium',
        recommendation: 'Continue monitoring heart rate patterns and consider cardio fitness assessment',
        evidence_level: 'moderate',
        source: 'trend_analysis'
      });
    }

    return recommendations;
  }

  /**
   * Generate actionable recommendations
   */
  generateActionableRecommendations(healthData, claudeAnalysis, literatureContext) {
    const recommendations = [];

    // Base recommendations from Claude analysis
    if (claudeAnalysis.analysis.includes('exercise') || claudeAnalysis.analysis.includes('activity')) {
      recommendations.push({
        category: 'lifestyle',
        priority: 'high',
        recommendation: 'Implement structured exercise routine based on current fitness level',
        evidence_level: 'strong',
        source: 'ai_analysis'
      });
    }

    // Enhanced recommendations from literature
    if (literatureContext && literatureContext.literature_findings) {
      const literatureText = literatureContext.literature_findings.toLowerCase();
      
      if (literatureText.includes('mediterranean diet')) {
        recommendations.push({
          category: 'nutrition',
          priority: 'medium',
          recommendation: 'Consider Mediterranean diet pattern for cardiovascular health',
          evidence_level: 'strong',
          source: 'medical_literature'
        });
      }

      if (literatureText.includes('sleep')) {
        recommendations.push({
          category: 'sleep',
          priority: 'high',
          recommendation: 'Optimize sleep hygiene and aim for 7-9 hours of quality sleep',
          evidence_level: 'strong',
          source: 'medical_literature'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate health alerts
   */
  generateHealthAlerts(healthData, claudeAnalysis) {
    const alerts = [];
    
    // Check for concerning patterns in the data
    const recentData = healthData.filter(record => {
      const recordDate = new Date(record.timestamp || record.date);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return recordDate >= threeDaysAgo;
    });

    if (recentData.length === 0) {
      alerts.push({
        type: 'data_gap',
        severity: 'medium',
        message: 'No recent health data available for analysis',
        recommendation: 'Ensure regular health data collection and sync',
        timestamp: new Date().toISOString()
      });
    }

    // Check Claude analysis for concerning patterns
    if (claudeAnalysis.analysis.includes('concerning') || claudeAnalysis.analysis.includes('alert')) {
      alerts.push({
        type: 'pattern_alert',
        severity: 'high',
        message: 'AI analysis identified concerning health patterns',
        recommendation: 'Consider consulting with healthcare provider',
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  /**
   * Generate health summary
   */
  generateHealthSummary(healthData, claudeAnalysis) {
    return {
      overview: claudeAnalysis.analysis.substring(0, 200) + '...',
      data_completeness: this.assessDataCompleteness(healthData),
      key_metrics: this.extractKeyMetrics(healthData),
      ai_confidence: claudeAnalysis.confidence,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Helper methods
   */
  getDataTypes(healthData) {
    const types = new Set();
    healthData.forEach(record => {
      if (record.type) types.add(record.type);
    });
    return Array.from(types);
  }

  getDateRange(healthData) {
    if (!healthData.length) return 'No data';
    
    const dates = healthData.map(record => new Date(record.timestamp || record.date)).filter(date => !isNaN(date));
    if (dates.length === 0) return 'No valid dates';
    
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    return `${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`;
  }

  identifyHealthConcerns(healthData) {
    const concerns = [];
    const dataTypes = this.getDataTypes(healthData);
    
    if (dataTypes.includes('blood_pressure')) concerns.push('hypertension monitoring');
    if (dataTypes.includes('glucose')) concerns.push('diabetes management');
    if (dataTypes.includes('weight')) concerns.push('weight management');
    if (dataTypes.includes('heart_rate')) concerns.push('cardiovascular health');
    
    return concerns.length > 0 ? concerns : ['general health monitoring'];
  }

  calculateConfidence(healthData) {
    let confidence = 5; // Base confidence
    
    if (healthData.length > 100) confidence += 2;
    if (healthData.length > 1000) confidence += 1;
    
    const dataTypes = this.getDataTypes(healthData);
    if (dataTypes.length > 3) confidence += 1;
    if (dataTypes.length > 5) confidence += 1;
    
    return Math.min(confidence, 10);
  }

  summarizeHealthData(healthData) {
    return {
      total_records: healthData.length,
      data_types: this.getDataTypes(healthData),
      date_range: this.getDateRange(healthData),
      completeness_score: this.assessDataCompleteness(healthData)
    };
  }

  assessDataCompleteness(healthData) {
    const expectedTypes = ['steps', 'heart_rate', 'sleep', 'weight'];
    const availableTypes = this.getDataTypes(healthData);
    
    return (availableTypes.filter(type => expectedTypes.includes(type)).length / expectedTypes.length) * 100;
  }

  extractKeyMetrics(healthData) {
    const metrics = {};
    
    const stepData = healthData.filter(record => record.type === 'steps');
    if (stepData.length > 0) {
      metrics.avg_daily_steps = stepData.reduce((sum, record) => sum + (record.value || 0), 0) / stepData.length;
    }
    
    const hrData = healthData.filter(record => record.type === 'heart_rate');
    if (hrData.length > 0) {
      metrics.avg_heart_rate = hrData.reduce((sum, record) => sum + (record.value || 0), 0) / hrData.length;
    }
    
    return metrics;
  }

  generateFallbackAnalysis(healthData, insightType) {
    return {
      analysis: `Local analysis of ${healthData.length} health records. ${insightType} insights generated using fallback algorithms.`,
      confidence: 6,
      source: 'local_fallback',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prompt templates for different insight types
   */
  createTrendAnalysisPrompt() {
    return `Focus on identifying patterns, trends, and changes over time in the health data. Look for:
- Improving or declining health metrics
- Seasonal patterns
- Correlation between different health indicators
- Progress toward health goals`;
  }

  createRecommendationPrompt() {
    return `Provide specific, actionable health recommendations based on the data. Include:
- Lifestyle modifications
- Health monitoring suggestions
- Preventive care recommendations
- Goal-setting advice`;
  }

  createHealthAlertPrompt() {
    return `Identify any concerning patterns or values that may require attention. Look for:
- Values outside normal ranges
- Sudden changes in health metrics
- Missing or irregular data patterns
- Potential health risks`;
  }

  createSummaryPrompt() {
    return `Provide a comprehensive overview of the person's health status based on available data. Include:
- Overall health assessment
- Key strengths and areas for improvement
- Data quality and completeness
- General health trajectory`;
  }

  /**
   * Service health check
   */
  async checkServiceHealth() {
    const health = {
      bedrock: false,
      opensearch: false,
      perplexity: false,
      overall: false
    };

    try {
      // Check Bedrock
      const testCommand = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
      
      await this.bedrockClient.send(testCommand);
      health.bedrock = true;
    } catch (error) {
      logger.warn('Bedrock health check failed:', error.message);
    }

    // Check Perplexity
    if (this.perplexityApiKey) {
      try {
        await axios.get(`${this.perplexityBaseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${this.perplexityApiKey}` }
        });
        health.perplexity = true;
      } catch (error) {
        logger.warn('Perplexity health check failed:', error.message);
      }
    }

    health.overall = health.bedrock || health.perplexity;
    return health;
  }
}

module.exports = StrandsAgent;
