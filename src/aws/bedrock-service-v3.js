/**
 * Bedrock Service using AWS SDK v3
 * Handles AI-powered health insights using Claude and other foundation models
 */

const { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
const { awsConfig } = require('./aws-config-v3');
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

class BedrockServiceV3 {
  constructor() {
    this.client = new BedrockRuntimeClient(awsConfig.getServiceConfig('bedrock'));
    this.models = {
      claude: 'anthropic.claude-3-sonnet-20240229-v1:0',
      claudeHaiku: 'anthropic.claude-3-haiku-20240307-v1:0',
      claudeOpus: 'anthropic.claude-3-opus-20240229-v1:0',
      titan: 'amazon.titan-text-express-v1',
      llama: 'meta.llama2-70b-chat-v1'
    };
    this.defaultModel = this.models.claude;
  }

  /**
   * Generate health insights from extracted health data
   */
  async generateHealthInsights(healthData, userId, options = {}) {
    try {
      logger.info(`Generating health insights for user: ${userId}`);

      const prompt = this.buildHealthInsightsPrompt(healthData, options);
      
      const response = await this.invokeModel(prompt, {
        model: options.model || this.defaultModel,
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3
      });

      const insights = this.parseHealthInsightsResponse(response);
      
      logger.info(`Health insights generated successfully for user: ${userId}`);
      
      return {
        success: true,
        insights: insights,
        metadata: {
          userId: userId,
          model: options.model || this.defaultModel,
          generatedAt: new Date().toISOString(),
          dataTypes: Object.keys(healthData),
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0
        }
      };

    } catch (error) {
      logger.error('Error generating health insights:', error);
      throw new Error(`Health insights generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze health trends and provide recommendations
   */
  async analyzeHealthTrends(trendData, userId, timeframe = '30_days') {
    try {
      logger.info(`Analyzing health trends for user: ${userId} over ${timeframe}`);

      const prompt = this.buildTrendAnalysisPrompt(trendData, timeframe);
      
      const response = await this.invokeModel(prompt, {
        model: this.models.claude,
        maxTokens: 1500,
        temperature: 0.2
      });

      const analysis = this.parseTrendAnalysisResponse(response);
      
      logger.info(`Health trend analysis completed for user: ${userId}`);
      
      return {
        success: true,
        analysis: analysis,
        timeframe: timeframe,
        metadata: {
          userId: userId,
          analyzedAt: new Date().toISOString(),
          metricsAnalyzed: Object.keys(trendData),
          model: this.models.claude
        }
      };

    } catch (error) {
      logger.error('Error analyzing health trends:', error);
      throw new Error(`Health trend analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate personalized health recommendations
   */
  async generatePersonalizedRecommendations(userProfile, healthData, goals = []) {
    try {
      logger.info(`Generating personalized recommendations for user: ${userProfile.userId}`);

      const prompt = this.buildRecommendationsPrompt(userProfile, healthData, goals);
      
      const response = await this.invokeModel(prompt, {
        model: this.models.claude,
        maxTokens: 2500,
        temperature: 0.4
      });

      const recommendations = this.parseRecommendationsResponse(response);
      
      logger.info(`Personalized recommendations generated for user: ${userProfile.userId}`);
      
      return {
        success: true,
        recommendations: recommendations,
        userProfile: {
          userId: userProfile.userId,
          age: userProfile.age,
          goals: goals
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          model: this.models.claude,
          recommendationCount: recommendations.length
        }
      };

    } catch (error) {
      logger.error('Error generating personalized recommendations:', error);
      throw new Error(`Personalized recommendations failed: ${error.message}`);
    }
  }

  /**
   * Analyze health document content for key insights
   */
  async analyzeHealthDocument(extractedText, documentType = 'general') {
    try {
      logger.info(`Analyzing health document of type: ${documentType}`);

      const prompt = this.buildDocumentAnalysisPrompt(extractedText, documentType);
      
      const response = await this.invokeModel(prompt, {
        model: this.models.claude,
        maxTokens: 1800,
        temperature: 0.2
      });

      const analysis = this.parseDocumentAnalysisResponse(response);
      
      logger.info(`Health document analysis completed`);
      
      return {
        success: true,
        analysis: analysis,
        documentType: documentType,
        metadata: {
          analyzedAt: new Date().toISOString(),
          model: this.models.claude,
          textLength: extractedText.length
        }
      };

    } catch (error) {
      logger.error('Error analyzing health document:', error);
      throw new Error(`Health document analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate family health summary with privacy considerations
   */
  async generateFamilyHealthSummary(familyData, privacyLevel = 'summary') {
    try {
      logger.info(`Generating family health summary with privacy level: ${privacyLevel}`);

      const prompt = this.buildFamilyHealthPrompt(familyData, privacyLevel);
      
      const response = await this.invokeModel(prompt, {
        model: this.models.claude,
        maxTokens: 2000,
        temperature: 0.3
      });

      const summary = this.parseFamilyHealthResponse(response);
      
      logger.info(`Family health summary generated`);
      
      return {
        success: true,
        summary: summary,
        privacyLevel: privacyLevel,
        metadata: {
          familyId: familyData.familyId,
          memberCount: familyData.members?.length || 0,
          generatedAt: new Date().toISOString(),
          model: this.models.claude
        }
      };

    } catch (error) {
      logger.error('Error generating family health summary:', error);
      throw new Error(`Family health summary failed: ${error.message}`);
    }
  }

  /**
   * Stream health insights for real-time responses
   */
  async streamHealthInsights(healthData, userId, options = {}) {
    try {
      logger.info(`Starting streaming health insights for user: ${userId}`);

      const prompt = this.buildHealthInsightsPrompt(healthData, options);
      
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: options.model || this.defaultModel,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.3,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.client.send(command);
      
      return {
        success: true,
        stream: response.body,
        metadata: {
          userId: userId,
          model: options.model || this.defaultModel,
          startedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error streaming health insights:', error);
      throw new Error(`Streaming health insights failed: ${error.message}`);
    }
  }

  /**
   * Invoke Bedrock model with proper error handling
   */
  async invokeModel(prompt, options = {}) {
    try {
      const modelId = options.model || this.defaultModel;
      
      let body;
      
      // Format request based on model type
      if (modelId.includes('anthropic.claude')) {
        body = JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.3,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        });
      } else if (modelId.includes('amazon.titan')) {
        body = JSON.stringify({
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: options.maxTokens || 1000,
            temperature: options.temperature || 0.3,
            topP: options.topP || 0.9
          }
        });
      } else if (modelId.includes('meta.llama')) {
        body = JSON.stringify({
          prompt: prompt,
          max_gen_len: options.maxTokens || 1000,
          temperature: options.temperature || 0.3,
          top_p: options.topP || 0.9
        });
      } else {
        throw new Error(`Unsupported model: ${modelId}`);
      }

      const command = new InvokeModelCommand({
        modelId: modelId,
        body: body,
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Parse response based on model type
      let content;
      let usage = {};
      
      if (modelId.includes('anthropic.claude')) {
        content = responseBody.content[0]?.text || '';
        usage = responseBody.usage || {};
      } else if (modelId.includes('amazon.titan')) {
        content = responseBody.results[0]?.outputText || '';
        usage = {
          input_tokens: responseBody.inputTextTokenCount,
          output_tokens: responseBody.results[0]?.tokenCount
        };
      } else if (modelId.includes('meta.llama')) {
        content = responseBody.generation || '';
        usage = {
          input_tokens: responseBody.prompt_token_count,
          output_tokens: responseBody.generation_token_count
        };
      }

      return {
        content: content,
        usage: usage,
        model: modelId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error invoking Bedrock model:', error);
      throw error;
    }
  }

  /**
   * Build health insights prompt
   */
  buildHealthInsightsPrompt(healthData, options = {}) {
    const context = options.includeContext ? `
User Context:
- Age: ${options.age || 'Not specified'}
- Gender: ${options.gender || 'Not specified'}
- Health Goals: ${options.goals?.join(', ') || 'General wellness'}
- Medical Conditions: ${options.conditions?.join(', ') || 'None specified'}
` : '';

    return `You are a health data analyst AI assistant. Analyze the following health data and provide actionable insights.

${context}

Health Data:
${JSON.stringify(healthData, null, 2)}

Please provide:
1. Key health insights and patterns
2. Areas of concern (if any)
3. Positive trends to celebrate
4. Actionable recommendations
5. Suggested follow-up actions

Format your response as structured JSON with the following sections:
- insights: Array of key findings
- concerns: Array of potential issues
- positives: Array of positive trends
- recommendations: Array of actionable advice
- followUp: Array of suggested next steps

Keep recommendations practical and evidence-based. Do not provide specific medical diagnoses or replace professional medical advice.`;
  }

  /**
   * Build trend analysis prompt
   */
  buildTrendAnalysisPrompt(trendData, timeframe) {
    return `Analyze the following health trend data over ${timeframe} and provide insights:

Trend Data:
${JSON.stringify(trendData, null, 2)}

Please analyze:
1. Overall trend direction for each metric
2. Significant changes or patterns
3. Correlations between different metrics
4. Seasonal or cyclical patterns
5. Recommendations based on trends

Format as JSON with:
- trendSummary: Overall assessment
- metricAnalysis: Per-metric breakdown
- correlations: Identified relationships
- recommendations: Trend-based advice
- predictions: Likely future trends`;
  }

  /**
   * Build personalized recommendations prompt
   */
  buildRecommendationsPrompt(userProfile, healthData, goals) {
    return `Generate personalized health recommendations based on:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Current Health Data:
${JSON.stringify(healthData, null, 2)}

Health Goals:
${goals.join(', ')}

Provide personalized recommendations in these categories:
1. Exercise and Physical Activity
2. Nutrition and Diet
3. Sleep and Recovery
4. Stress Management
5. Preventive Care

Format as JSON array with each recommendation having:
- category: The health category
- title: Brief recommendation title
- description: Detailed explanation
- priority: high/medium/low
- timeframe: When to implement
- measurable: How to track progress`;
  }

  /**
   * Build document analysis prompt
   */
  buildDocumentAnalysisPrompt(extractedText, documentType) {
    return `Analyze this ${documentType} health document and extract key information:

Document Text:
${extractedText}

Extract and structure:
1. Key health metrics and values
2. Diagnoses or conditions mentioned
3. Medications and treatments
4. Important dates and appointments
5. Recommendations from healthcare providers
6. Follow-up actions required

Format as JSON with:
- metrics: Extracted health measurements
- conditions: Medical conditions identified
- medications: Prescribed treatments
- dates: Important dates and deadlines
- recommendations: Provider advice
- followUp: Required actions`;
  }

  /**
   * Build family health summary prompt
   */
  buildFamilyHealthPrompt(familyData, privacyLevel) {
    const privacyNote = privacyLevel === 'summary' ? 
      'Provide only aggregated, anonymized insights without individual member details.' :
      'Include appropriate level of detail while respecting privacy.';

    return `Generate a family health summary with privacy level: ${privacyLevel}

Family Data:
${JSON.stringify(familyData, null, 2)}

${privacyNote}

Provide:
1. Overall family health trends
2. Areas where family excels
3. Opportunities for improvement
4. Family-friendly health activities
5. Collective health goals

Format as JSON with:
- overallHealth: Family health score and summary
- strengths: What the family does well
- improvements: Areas to focus on
- activities: Suggested family health activities
- goals: Recommended family health objectives`;
  }

  /**
   * Parse health insights response
   */
  parseHealthInsightsResponse(response) {
    try {
      const content = response.content;
      
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to structured text parsing
      return this.parseStructuredText(content);
      
    } catch (error) {
      logger.warn('Could not parse structured response, returning raw content');
      return {
        insights: [content],
        concerns: [],
        positives: [],
        recommendations: [],
        followUp: []
      };
    }
  }

  /**
   * Parse trend analysis response
   */
  parseTrendAnalysisResponse(response) {
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        trendSummary: content,
        metricAnalysis: {},
        correlations: [],
        recommendations: [],
        predictions: []
      };
      
    } catch (error) {
      logger.warn('Could not parse trend analysis response');
      return { trendSummary: response.content };
    }
  }

  /**
   * Parse recommendations response
   */
  parseRecommendationsResponse(response) {
    try {
      const content = response.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return [{
        category: 'General',
        title: 'Health Recommendations',
        description: content,
        priority: 'medium',
        timeframe: 'ongoing',
        measurable: 'Track progress weekly'
      }];
      
    } catch (error) {
      logger.warn('Could not parse recommendations response');
      return [];
    }
  }

  /**
   * Parse document analysis response
   */
  parseDocumentAnalysisResponse(response) {
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        metrics: {},
        conditions: [],
        medications: [],
        dates: [],
        recommendations: [],
        followUp: []
      };
      
    } catch (error) {
      logger.warn('Could not parse document analysis response');
      return { summary: response.content };
    }
  }

  /**
   * Parse family health response
   */
  parseFamilyHealthResponse(response) {
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        overallHealth: content,
        strengths: [],
        improvements: [],
        activities: [],
        goals: []
      };
      
    } catch (error) {
      logger.warn('Could not parse family health response');
      return { summary: response.content };
    }
  }

  /**
   * Parse structured text when JSON parsing fails
   */
  parseStructuredText(content) {
    const sections = {
      insights: [],
      concerns: [],
      positives: [],
      recommendations: [],
      followUp: []
    };

    const lines = content.split('\n');
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detect section headers
      if (trimmed.toLowerCase().includes('insight')) {
        currentSection = 'insights';
      } else if (trimmed.toLowerCase().includes('concern')) {
        currentSection = 'concerns';
      } else if (trimmed.toLowerCase().includes('positive')) {
        currentSection = 'positives';
      } else if (trimmed.toLowerCase().includes('recommendation')) {
        currentSection = 'recommendations';
      } else if (trimmed.toLowerCase().includes('follow')) {
        currentSection = 'followUp';
      } else if (currentSection && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
        sections[currentSection].push(trimmed.substring(1).trim());
      }
    });

    return sections;
  }

  /**
   * Health check for Bedrock service
   */
  async healthCheck() {
    try {
      const testPrompt = "Hello, this is a health check. Please respond with 'OK'.";
      
      const response = await this.invokeModel(testPrompt, {
        model: this.models.claudeHaiku, // Use fastest model for health check
        maxTokens: 10,
        temperature: 0
      });
      
      return {
        status: 'healthy',
        service: 'Bedrock',
        model: this.models.claudeHaiku,
        region: awsConfig.region,
        responseTime: Date.now(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'Bedrock',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return {
      models: this.models,
      default: this.defaultModel,
      capabilities: {
        [this.models.claude]: 'General purpose, balanced performance',
        [this.models.claudeHaiku]: 'Fast responses, cost-effective',
        [this.models.claudeOpus]: 'Highest quality, complex reasoning',
        [this.models.titan]: 'Amazon native, good for summarization',
        [this.models.llama]: 'Open source, good for chat'
      }
    };
  }
}

module.exports = BedrockServiceV3;
