/**
 * AWS Bedrock Health Analyzer
 * Specialized health analysis using Claude models via AWS Bedrock
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
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
    new winston.transports.File({ filename: 'logs/bedrock-analyzer.log' })
  ]
});

class BedrockHealthAnalyzer {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'your-aws-region'
    });

    this.models = {
      claude_sonnet: 'anthropic.claude-3-sonnet-20240229-v1:0',
      claude_haiku: 'anthropic.claude-3-haiku-20240307-v1:0'
    };

    this.analysisTypes = {
      COMPREHENSIVE: 'comprehensive',
      TREND_ANALYSIS: 'trend_analysis',
      RISK_ASSESSMENT: 'risk_assessment',
      FAMILY_SUMMARY: 'family_summary',
      MEDICATION_REVIEW: 'medication_review'
    };
  }

  /**
   * Analyze health data comprehensively using Claude Sonnet
   */
  async analyzeHealthData(healthData, analysisType = this.analysisTypes.COMPREHENSIVE, options = {}) {
    try {
      logger.info(`Starting ${analysisType} analysis with Bedrock Claude`);

      const prompt = this.buildHealthAnalysisPrompt(healthData, analysisType, options);
      const modelId = analysisType === this.analysisTypes.COMPREHENSIVE ? 
        this.models.claude_sonnet : this.models.claude_haiku;

      const response = await this.invokeClaudeModel(modelId, prompt, {
        maxTokens: analysisType === this.analysisTypes.COMPREHENSIVE ? 3000 : 1500,
        temperature: 0.3
      });

      const analysis = this.parseHealthAnalysis(response, analysisType);
      
      logger.info(`Completed ${analysisType} analysis successfully`);
      return analysis;

    } catch (error) {
      logger.error(`Error in ${analysisType} analysis:`, error);
      throw error;
    }
  }

  /**
   * Generate family health insights with privacy considerations
   */
  async analyzeFamilyHealth(familyHealthData, privacyLevel = 'basic') {
    try {
      logger.info(`Analyzing family health data with ${privacyLevel} privacy level`);

      const sanitizedData = this.sanitizeFamilyData(familyHealthData, privacyLevel);
      const prompt = this.buildFamilyAnalysisPrompt(sanitizedData, privacyLevel);

      const response = await this.invokeClaudeModel(
        this.models.claude_sonnet, 
        prompt, 
        { maxTokens: 2500, temperature: 0.2 }
      );

      const familyInsights = {
        analysis_type: 'family_health_summary',
        privacy_level: privacyLevel,
        insights: this.parseFamilyAnalysis(response),
        member_count: familyHealthData.length,
        generated_at: new Date().toISOString(),
        recommendations: this.generateFamilyRecommendations(sanitizedData)
      };

      logger.info('Family health analysis completed');
      return familyInsights;

    } catch (error) {
      logger.error('Error in family health analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze health trends over time
   */
  async analyzeTrends(healthData, timeframe = '3months') {
    try {
      const trendData = this.prepareTimeSeriesData(healthData, timeframe);
      const prompt = this.buildTrendAnalysisPrompt(trendData, timeframe);

      const response = await this.invokeClaudeModel(
        this.models.claude_haiku,
        prompt,
        { maxTokens: 2000, temperature: 0.3 }
      );

      return {
        analysis_type: 'trend_analysis',
        timeframe: timeframe,
        trends: this.parseTrendAnalysis(response),
        data_points: trendData.length,
        confidence_score: this.calculateTrendConfidence(trendData),
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in trend analysis:', error);
      throw error;
    }
  }

  /**
   * Assess health risks based on current data
   */
  async assessHealthRisks(healthData, medicalHistory = []) {
    try {
      const riskFactors = this.identifyRiskFactors(healthData, medicalHistory);
      const prompt = this.buildRiskAssessmentPrompt(healthData, riskFactors, medicalHistory);

      const response = await this.invokeClaudeModel(
        this.models.claude_sonnet,
        prompt,
        { maxTokens: 2500, temperature: 0.2 }
      );

      return {
        analysis_type: 'risk_assessment',
        risk_factors: riskFactors,
        assessment: this.parseRiskAssessment(response),
        recommendations: this.generateRiskMitigationRecommendations(riskFactors),
        confidence_level: this.calculateRiskConfidence(healthData, medicalHistory),
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in risk assessment:', error);
      throw error;
    }
  }

  /**
   * Review medications and potential interactions
   */
  async reviewMedications(medications, healthData, allergies = []) {
    try {
      const prompt = this.buildMedicationReviewPrompt(medications, healthData, allergies);

      const response = await this.invokeClaudeModel(
        this.models.claude_sonnet,
        prompt,
        { maxTokens: 2000, temperature: 0.1 }
      );

      return {
        analysis_type: 'medication_review',
        medications_reviewed: medications.length,
        review: this.parseMedicationReview(response),
        interactions: this.identifyPotentialInteractions(medications),
        recommendations: this.generateMedicationRecommendations(medications, healthData),
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in medication review:', error);
      throw error;
    }
  }

  /**
   * Invoke Claude model via Bedrock
   */
  async invokeClaudeModel(modelId, prompt, options = {}) {
    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }

  /**
   * Build comprehensive health analysis prompt
   */
  buildHealthAnalysisPrompt(healthData, analysisType, options) {
    const baseContext = `You are a specialized health data analyst AI. Analyze the following health data and provide professional insights.

IMPORTANT: This is for informational purposes only and should not replace professional medical advice.

Health Data Summary:
- Total records: ${healthData.length}
- Data types: ${this.getDataTypes(healthData).join(', ')}
- Date range: ${this.getDateRange(healthData)}
- User context: ${options.userContext || 'General health monitoring'}

Detailed Health Metrics:
${this.formatHealthDataForAnalysis(healthData)}`;

    switch (analysisType) {
      case this.analysisTypes.COMPREHENSIVE:
        return `${baseContext}

Please provide a comprehensive health analysis including:

1. **Overall Health Assessment**
   - Current health status based on available data
   - Key strengths and positive indicators
   - Areas requiring attention or improvement

2. **Data Quality Analysis**
   - Completeness and reliability of the data
   - Gaps in monitoring or tracking
   - Recommendations for better data collection

3. **Health Patterns and Trends**
   - Notable patterns in the health metrics
   - Positive or concerning trends over time
   - Correlations between different health indicators

4. **Personalized Recommendations**
   - Specific, actionable health recommendations
   - Lifestyle modifications based on the data
   - Monitoring and tracking suggestions

5. **Risk Factors and Alerts**
   - Any concerning patterns or values
   - Potential health risks based on current data
   - Recommendations for professional consultation

Format your response with clear sections and bullet points for easy reading.`;

      case this.analysisTypes.TREND_ANALYSIS:
        return `${baseContext}

Focus specifically on trend analysis. Provide:

1. **Trend Identification**
   - Improving metrics and positive trends
   - Declining metrics or concerning patterns
   - Stable metrics and their significance

2. **Pattern Analysis**
   - Seasonal or cyclical patterns
   - Correlations between different metrics
   - Unusual variations or outliers

3. **Trajectory Assessment**
   - Current health trajectory
   - Projected outcomes if trends continue
   - Recommendations for trend improvement

Provide specific data points and percentages where possible.`;

      case this.analysisTypes.RISK_ASSESSMENT:
        return `${baseContext}

Conduct a health risk assessment focusing on:

1. **Current Risk Factors**
   - Identified risk factors from the data
   - Severity and likelihood of each risk
   - Modifiable vs. non-modifiable factors

2. **Risk Stratification**
   - Low, medium, high risk categories
   - Timeframe for potential health impacts
   - Priority areas for intervention

3. **Mitigation Strategies**
   - Specific actions to reduce identified risks
   - Lifestyle modifications for risk reduction
   - Monitoring recommendations

Be specific about risk levels and provide evidence-based recommendations.`;

      default:
        return `${baseContext}

Provide a general health analysis with key insights and recommendations.`;
    }
  }

  /**
   * Build family health analysis prompt
   */
  buildFamilyAnalysisPrompt(familyData, privacyLevel) {
    return `You are analyzing aggregated family health data. Respect privacy and provide family-level insights.

Privacy Level: ${privacyLevel}
Family Members: ${familyData.length}

Aggregated Family Health Data:
${JSON.stringify(familyData, null, 2)}

Provide family health insights including:

1. **Family Health Overview**
   - Overall family health status
   - Common health patterns across family members
   - Strengths and areas for improvement

2. **Shared Health Goals**
   - Family-wide health objectives
   - Collaborative health activities
   - Mutual support opportunities

3. **Health Education Opportunities**
   - Family health education topics
   - Age-appropriate health information
   - Preventive care recommendations

4. **Family Health Management**
   - Coordination of health activities
   - Shared health monitoring strategies
   - Emergency preparedness

Keep recommendations family-focused and respect individual privacy boundaries.`;
  }

  /**
   * Build trend analysis prompt
   */
  buildTrendAnalysisPrompt(trendData, timeframe) {
    return `Analyze health trends over the ${timeframe} timeframe.

Time Series Health Data:
${JSON.stringify(trendData.slice(0, 50), null, 2)}

Provide detailed trend analysis including:

1. **Trend Direction**
   - Improving, stable, or declining trends
   - Rate of change for each metric
   - Statistical significance of trends

2. **Seasonal Patterns**
   - Recurring patterns or cycles
   - Environmental or lifestyle influences
   - Predictable variations

3. **Correlation Analysis**
   - Relationships between different health metrics
   - Leading and lagging indicators
   - Cause-and-effect relationships

4. **Future Projections**
   - Expected trajectory if current trends continue
   - Potential inflection points
   - Recommendations for trend improvement

Use specific data points and statistical observations where possible.`;
  }

  /**
   * Build risk assessment prompt
   */
  buildRiskAssessmentPrompt(healthData, riskFactors, medicalHistory) {
    return `Conduct a comprehensive health risk assessment.

Current Health Data:
${this.formatHealthDataForAnalysis(healthData.slice(0, 20))}

Identified Risk Factors:
${riskFactors.map(factor => `- ${factor.type}: ${factor.description} (${factor.severity})`).join('\n')}

Medical History:
${medicalHistory.map(item => `- ${item.condition} (${item.date})`).join('\n')}

Provide risk assessment including:

1. **Risk Stratification**
   - Categorize risks by severity (low/medium/high)
   - Timeframe for potential impact (immediate/short-term/long-term)
   - Modifiable vs. non-modifiable risk factors

2. **Evidence-Based Risk Calculation**
   - Use established risk calculators where applicable
   - Consider multiple risk factors simultaneously
   - Account for protective factors

3. **Intervention Priorities**
   - Most critical risks requiring immediate attention
   - Medium-term risks for ongoing monitoring
   - Long-term prevention strategies

4. **Monitoring Recommendations**
   - Specific metrics to track for each risk
   - Frequency of monitoring
   - Warning signs to watch for

Be specific about risk levels and provide actionable recommendations.`;
  }

  /**
   * Build medication review prompt
   */
  buildMedicationReviewPrompt(medications, healthData, allergies) {
    return `Review the following medications for safety and effectiveness.

IMPORTANT: This is for informational purposes only. Always consult healthcare providers for medication decisions.

Current Medications:
${medications.map(med => `- ${med.name} ${med.dosage} ${med.frequency}`).join('\n')}

Relevant Health Data:
${this.formatHealthDataForAnalysis(healthData.slice(0, 10))}

Known Allergies:
${allergies.join(', ') || 'None reported'}

Provide medication review including:

1. **Drug Interactions**
   - Potential interactions between current medications
   - Severity and clinical significance
   - Recommendations for management

2. **Dosage Assessment**
   - Appropriateness of current dosages
   - Potential for optimization
   - Considerations based on health data

3. **Monitoring Requirements**
   - Lab tests or health metrics to monitor
   - Frequency of monitoring
   - Warning signs to watch for

4. **Lifestyle Considerations**
   - Drug-food interactions
   - Timing recommendations
   - Activity restrictions

Focus on safety and provide evidence-based recommendations.`;
  }

  /**
   * Helper methods for data processing
   */
  formatHealthDataForAnalysis(healthData) {
    return healthData.slice(0, 20).map(record => {
      return `${record.type || 'Unknown'}: ${record.value || 'N/A'} ${record.unit || ''} (${new Date(record.timestamp || record.date).toLocaleDateString()})`;
    }).join('\n');
  }

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

  sanitizeFamilyData(familyData, privacyLevel) {
    return familyData.map(memberData => {
      const sanitized = {
        member_id: memberData.member_id || 'anonymous',
        age_group: this.getAgeGroup(memberData.age),
        data_summary: {
          total_records: memberData.health_data?.length || 0,
          data_types: this.getDataTypes(memberData.health_data || [])
        }
      };

      if (privacyLevel === 'detailed' || privacyLevel === 'full') {
        sanitized.key_metrics = this.extractKeyMetrics(memberData.health_data || []);
      }

      return sanitized;
    });
  }

  getAgeGroup(age) {
    if (age < 13) return 'child';
    if (age < 18) return 'teen';
    if (age < 65) return 'adult';
    return 'senior';
  }

  prepareTimeSeriesData(healthData, timeframe) {
    const cutoffDate = new Date();
    switch (timeframe) {
      case '1month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }

    return healthData.filter(record => {
      const recordDate = new Date(record.timestamp || record.date);
      return recordDate >= cutoffDate;
    }).sort((a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date));
  }

  identifyRiskFactors(healthData, medicalHistory) {
    const riskFactors = [];

    // Analyze health data for risk factors
    const stepData = healthData.filter(record => record.type === 'steps');
    if (stepData.length > 0) {
      const avgSteps = stepData.reduce((sum, record) => sum + (record.value || 0), 0) / stepData.length;
      if (avgSteps < 5000) {
        riskFactors.push({
          type: 'sedentary_lifestyle',
          description: `Low daily step count (${Math.round(avgSteps)} steps/day)`,
          severity: 'medium'
        });
      }
    }

    // Check medical history for risk factors
    medicalHistory.forEach(condition => {
      if (condition.condition.toLowerCase().includes('diabetes')) {
        riskFactors.push({
          type: 'diabetes',
          description: 'History of diabetes',
          severity: 'high'
        });
      }
      if (condition.condition.toLowerCase().includes('hypertension')) {
        riskFactors.push({
          type: 'hypertension',
          description: 'History of high blood pressure',
          severity: 'medium'
        });
      }
    });

    return riskFactors;
  }

  extractKeyMetrics(healthData) {
    const metrics = {};
    
    const stepData = healthData.filter(record => record.type === 'steps');
    if (stepData.length > 0) {
      metrics.avg_daily_steps = Math.round(stepData.reduce((sum, record) => sum + (record.value || 0), 0) / stepData.length);
    }
    
    const hrData = healthData.filter(record => record.type === 'heart_rate');
    if (hrData.length > 0) {
      metrics.avg_heart_rate = Math.round(hrData.reduce((sum, record) => sum + (record.value || 0), 0) / hrData.length);
    }
    
    return metrics;
  }

  /**
   * Parsing methods for different analysis types
   */
  parseHealthAnalysis(response, analysisType) {
    return {
      raw_analysis: response,
      analysis_type: analysisType,
      structured_insights: this.extractStructuredInsights(response),
      recommendations: this.extractRecommendations(response),
      confidence_indicators: this.extractConfidenceIndicators(response),
      generated_at: new Date().toISOString()
    };
  }

  parseFamilyAnalysis(response) {
    return {
      family_overview: this.extractSection(response, 'Family Health Overview'),
      shared_goals: this.extractSection(response, 'Shared Health Goals'),
      education_opportunities: this.extractSection(response, 'Health Education Opportunities'),
      management_strategies: this.extractSection(response, 'Family Health Management')
    };
  }

  parseTrendAnalysis(response) {
    return {
      trend_direction: this.extractSection(response, 'Trend Direction'),
      seasonal_patterns: this.extractSection(response, 'Seasonal Patterns'),
      correlations: this.extractSection(response, 'Correlation Analysis'),
      projections: this.extractSection(response, 'Future Projections')
    };
  }

  parseRiskAssessment(response) {
    return {
      risk_stratification: this.extractSection(response, 'Risk Stratification'),
      evidence_based_risks: this.extractSection(response, 'Evidence-Based Risk Calculation'),
      intervention_priorities: this.extractSection(response, 'Intervention Priorities'),
      monitoring_recommendations: this.extractSection(response, 'Monitoring Recommendations')
    };
  }

  parseMedicationReview(response) {
    return {
      drug_interactions: this.extractSection(response, 'Drug Interactions'),
      dosage_assessment: this.extractSection(response, 'Dosage Assessment'),
      monitoring_requirements: this.extractSection(response, 'Monitoring Requirements'),
      lifestyle_considerations: this.extractSection(response, 'Lifestyle Considerations')
    };
  }

  extractSection(text, sectionTitle) {
    const regex = new RegExp(`\\*\\*${sectionTitle}\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  extractStructuredInsights(response) {
    // Extract key insights from the response
    const insights = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.includes('•') || line.includes('-')) {
        const insight = line.replace(/[•-]\s*/, '').trim();
        if (insight.length > 10) {
          insights.push(insight);
        }
      }
    });
    
    return insights;
  }

  extractRecommendations(response) {
    const recommendations = [];
    const recommendationSection = this.extractSection(response, 'Personalized Recommendations') || 
                                 this.extractSection(response, 'Recommendations');
    
    if (recommendationSection) {
      const lines = recommendationSection.split('\n');
      lines.forEach(line => {
        if (line.includes('•') || line.includes('-')) {
          const recommendation = line.replace(/[•-]\s*/, '').trim();
          if (recommendation.length > 10) {
            recommendations.push(recommendation);
          }
        }
      });
    }
    
    return recommendations;
  }

  extractConfidenceIndicators(response) {
    const indicators = [];
    
    if (response.includes('high confidence') || response.includes('strongly recommend')) {
      indicators.push('high_confidence');
    }
    if (response.includes('moderate confidence') || response.includes('likely')) {
      indicators.push('moderate_confidence');
    }
    if (response.includes('low confidence') || response.includes('uncertain')) {
      indicators.push('low_confidence');
    }
    
    return indicators;
  }

  calculateTrendConfidence(trendData) {
    let confidence = 5; // Base confidence
    
    if (trendData.length > 30) confidence += 2;
    if (trendData.length > 100) confidence += 1;
    
    const dataTypes = this.getDataTypes(trendData);
    if (dataTypes.length > 2) confidence += 1;
    if (dataTypes.length > 4) confidence += 1;
    
    return Math.min(confidence, 10);
  }

  calculateRiskConfidence(healthData, medicalHistory) {
    let confidence = 6; // Base confidence for risk assessment
    
    if (healthData.length > 50) confidence += 1;
    if (medicalHistory.length > 0) confidence += 1;
    if (medicalHistory.length > 3) confidence += 1;
    
    return Math.min(confidence, 10);
  }

  generateFamilyRecommendations(familyData) {
    const recommendations = [];
    
    if (familyData.length > 1) {
      recommendations.push('Establish family health goals and track progress together');
      recommendations.push('Schedule regular family health check-ins and discussions');
    }
    
    if (familyData.some(member => member.age_group === 'child' || member.age_group === 'teen')) {
      recommendations.push('Implement age-appropriate health education and activities');
    }
    
    return recommendations;
  }

  generateRiskMitigationRecommendations(riskFactors) {
    const recommendations = [];
    
    riskFactors.forEach(factor => {
      switch (factor.type) {
        case 'sedentary_lifestyle':
          recommendations.push('Increase daily physical activity and set step goals');
          break;
        case 'diabetes':
          recommendations.push('Monitor blood glucose regularly and maintain diabetic diet');
          break;
        case 'hypertension':
          recommendations.push('Monitor blood pressure and reduce sodium intake');
          break;
      }
    });
    
    return recommendations;
  }

  generateMedicationRecommendations(medications, healthData) {
    const recommendations = [];
    
    if (medications.length > 5) {
      recommendations.push('Consider medication management system or app for organization');
    }
    
    if (medications.some(med => med.name.toLowerCase().includes('blood pressure'))) {
      recommendations.push('Monitor blood pressure regularly while on antihypertensive medications');
    }
    
    return recommendations;
  }

  identifyPotentialInteractions(medications) {
    const interactions = [];
    
    // Simple interaction checking (in production, use comprehensive drug interaction database)
    const medicationNames = medications.map(med => med.name.toLowerCase());
    
    if (medicationNames.includes('warfarin') && medicationNames.some(name => name.includes('aspirin'))) {
      interactions.push({
        medications: ['warfarin', 'aspirin'],
        severity: 'high',
        description: 'Increased bleeding risk'
      });
    }
    
    return interactions;
  }
}

module.exports = BedrockHealthAnalyzer;
