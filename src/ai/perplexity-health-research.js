/**
 * Perplexity API Health Research Integration
 * Provides evidence-based medical literature search and health trend analysis
 */

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
    new winston.transports.File({ filename: 'logs/perplexity-research.log' })
  ]
});

class PerplexityHealthResearch {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = 'https://api.perplexity.ai';
    this.models = {
      sonar_small: 'llama-3.1-sonar-small-128k-online',
      sonar_large: 'llama-3.1-sonar-large-128k-online',
      sonar_huge: 'llama-3.1-sonar-huge-128k-online'
    };
    
    this.researchCategories = {
      MEDICAL_LITERATURE: 'medical_literature',
      HEALTH_TRENDS: 'health_trends',
      TREATMENT_OPTIONS: 'treatment_options',
      PREVENTION_STRATEGIES: 'prevention_strategies',
      DRUG_INFORMATION: 'drug_information',
      CLINICAL_GUIDELINES: 'clinical_guidelines'
    };

    if (!this.apiKey) {
      logger.warn('Perplexity API key not configured. Research features will be limited.');
    }
  }

  /**
   * Search medical literature for health conditions and treatments
   */
  async searchMedicalLiterature(query, options = {}) {
    try {
      logger.info(`Searching medical literature for: ${query}`);

      const enhancedQuery = this.enhanceQuery(query, this.researchCategories.MEDICAL_LITERATURE);
      const response = await this.makePerplexityRequest(enhancedQuery, {
        model: options.detailed ? this.models.sonar_large : this.models.sonar_small,
        maxTokens: options.maxTokens || 1500,
        temperature: 0.2
      });

      const research = {
        query: query,
        category: this.researchCategories.MEDICAL_LITERATURE,
        findings: response.content,
        sources: response.citations || [],
        confidence_score: this.assessSourceQuality(response.citations || []),
        search_timestamp: new Date().toISOString(),
        evidence_level: this.categorizeEvidenceLevel(response.content)
      };

      logger.info(`Medical literature search completed with ${research.sources.length} sources`);
      return research;

    } catch (error) {
      logger.error('Error searching medical literature:', error);
      throw error;
    }
  }

  /**
   * Research current health trends and statistics
   */
  async researchHealthTrends(healthCondition, demographics = {}) {
    try {
      logger.info(`Researching health trends for: ${healthCondition}`);

      const trendQuery = this.buildTrendQuery(healthCondition, demographics);
      const response = await this.makePerplexityRequest(trendQuery, {
        model: this.models.sonar_large,
        maxTokens: 2000,
        temperature: 0.3
      });

      const trends = {
        condition: healthCondition,
        demographics: demographics,
        category: this.researchCategories.HEALTH_TRENDS,
        trend_analysis: response.content,
        data_sources: response.citations || [],
        statistical_confidence: this.assessStatisticalReliability(response.content),
        research_timestamp: new Date().toISOString(),
        key_statistics: this.extractStatistics(response.content)
      };

      logger.info(`Health trends research completed for ${healthCondition}`);
      return trends;

    } catch (error) {
      logger.error('Error researching health trends:', error);
      throw error;
    }
  }

  /**
   * Research treatment options for specific conditions
   */
  async researchTreatmentOptions(condition, patientProfile = {}) {
    try {
      logger.info(`Researching treatment options for: ${condition}`);

      const treatmentQuery = this.buildTreatmentQuery(condition, patientProfile);
      const response = await this.makePerplexityRequest(treatmentQuery, {
        model: this.models.sonar_large,
        maxTokens: 2500,
        temperature: 0.2
      });

      const treatments = {
        condition: condition,
        patient_profile: patientProfile,
        category: this.researchCategories.TREATMENT_OPTIONS,
        treatment_options: this.parseTreatmentOptions(response.content),
        evidence_base: response.citations || [],
        clinical_guidelines: this.extractGuidelines(response.content),
        research_timestamp: new Date().toISOString(),
        recommendation_strength: this.assessRecommendationStrength(response.content)
      };

      logger.info(`Treatment options research completed for ${condition}`);
      return treatments;

    } catch (error) {
      logger.error('Error researching treatment options:', error);
      throw error;
    }
  }

  /**
   * Research prevention strategies for health conditions
   */
  async researchPreventionStrategies(riskFactors, targetConditions = []) {
    try {
      logger.info(`Researching prevention strategies for risk factors: ${riskFactors.join(', ')}`);

      const preventionQuery = this.buildPreventionQuery(riskFactors, targetConditions);
      const response = await this.makePerplexityRequest(preventionQuery, {
        model: this.models.sonar_small,
        maxTokens: 2000,
        temperature: 0.3
      });

      const prevention = {
        risk_factors: riskFactors,
        target_conditions: targetConditions,
        category: this.researchCategories.PREVENTION_STRATEGIES,
        prevention_strategies: this.parsePreventionStrategies(response.content),
        evidence_sources: response.citations || [],
        effectiveness_ratings: this.extractEffectivenessRatings(response.content),
        research_timestamp: new Date().toISOString(),
        implementation_difficulty: this.assessImplementationDifficulty(response.content)
      };

      logger.info(`Prevention strategies research completed`);
      return prevention;

    } catch (error) {
      logger.error('Error researching prevention strategies:', error);
      throw error;
    }
  }

  /**
   * Research drug information and interactions
   */
  async researchDrugInformation(medications, interactions = true) {
    try {
      logger.info(`Researching drug information for: ${medications.join(', ')}`);

      const drugQuery = this.buildDrugQuery(medications, interactions);
      const response = await this.makePerplexityRequest(drugQuery, {
        model: this.models.sonar_small,
        maxTokens: 1800,
        temperature: 0.1
      });

      const drugInfo = {
        medications: medications,
        category: this.researchCategories.DRUG_INFORMATION,
        drug_profiles: this.parseDrugProfiles(response.content),
        interaction_warnings: interactions ? this.parseInteractionWarnings(response.content) : [],
        safety_information: this.parseSafetyInformation(response.content),
        clinical_sources: response.citations || [],
        research_timestamp: new Date().toISOString(),
        reliability_score: this.assessDrugInfoReliability(response.citations || [])
      };

      logger.info(`Drug information research completed`);
      return drugInfo;

    } catch (error) {
      logger.error('Error researching drug information:', error);
      throw error;
    }
  }

  /**
   * Research clinical guidelines for specific conditions
   */
  async researchClinicalGuidelines(condition, organization = 'major medical organizations') {
    try {
      logger.info(`Researching clinical guidelines for: ${condition}`);

      const guidelinesQuery = this.buildGuidelinesQuery(condition, organization);
      const response = await this.makePerplexityRequest(guidelinesQuery, {
        model: this.models.sonar_large,
        maxTokens: 2500,
        temperature: 0.2
      });

      const guidelines = {
        condition: condition,
        organization: organization,
        category: this.researchCategories.CLINICAL_GUIDELINES,
        guidelines_summary: response.content,
        authoritative_sources: response.citations || [],
        guideline_strength: this.assessGuidelineStrength(response.content),
        last_updated: this.extractGuidelineDate(response.content),
        research_timestamp: new Date().toISOString(),
        implementation_recommendations: this.extractImplementationGuidance(response.content)
      };

      logger.info(`Clinical guidelines research completed for ${condition}`);
      return guidelines;

    } catch (error) {
      logger.error('Error researching clinical guidelines:', error);
      throw error;
    }
  }

  /**
   * Comprehensive health research combining multiple categories
   */
  async comprehensiveHealthResearch(healthProfile, researchAreas = []) {
    try {
      logger.info('Starting comprehensive health research');

      const results = {
        health_profile: healthProfile,
        research_areas: researchAreas,
        research_results: {},
        combined_insights: '',
        research_timestamp: new Date().toISOString(),
        overall_confidence: 0
      };

      // Conduct research in specified areas
      for (const area of researchAreas) {
        switch (area) {
          case this.researchCategories.MEDICAL_LITERATURE:
            if (healthProfile.conditions) {
              results.research_results.literature = await this.searchMedicalLiterature(
                healthProfile.conditions.join(' '), { detailed: true }
              );
            }
            break;

          case this.researchCategories.HEALTH_TRENDS:
            if (healthProfile.primaryCondition) {
              results.research_results.trends = await this.researchHealthTrends(
                healthProfile.primaryCondition, healthProfile.demographics
              );
            }
            break;

          case this.researchCategories.TREATMENT_OPTIONS:
            if (healthProfile.primaryCondition) {
              results.research_results.treatments = await this.researchTreatmentOptions(
                healthProfile.primaryCondition, healthProfile
              );
            }
            break;

          case this.researchCategories.PREVENTION_STRATEGIES:
            if (healthProfile.riskFactors) {
              results.research_results.prevention = await this.researchPreventionStrategies(
                healthProfile.riskFactors, healthProfile.conditions
              );
            }
            break;

          case this.researchCategories.DRUG_INFORMATION:
            if (healthProfile.medications) {
              results.research_results.drugs = await this.researchDrugInformation(
                healthProfile.medications, true
              );
            }
            break;
        }
      }

      // Generate combined insights
      results.combined_insights = await this.synthesizeResearchFindings(results.research_results);
      results.overall_confidence = this.calculateOverallConfidence(results.research_results);

      logger.info('Comprehensive health research completed');
      return results;

    } catch (error) {
      logger.error('Error in comprehensive health research:', error);
      throw error;
    }
  }

  /**
   * Make request to Perplexity API
   */
  async makePerplexityRequest(query, options = {}) {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: options.model || this.models.sonar_small,
          messages: [
            {
              role: 'system',
              content: 'You are a medical research assistant. Provide accurate, evidence-based information from reliable medical sources. Always cite your sources and indicate the strength of evidence. Focus on peer-reviewed research and established clinical guidelines.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: options.maxTokens || 1500,
          temperature: options.temperature || 0.2,
          return_citations: true,
          return_images: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        citations: response.data.citations || [],
        usage: response.data.usage
      };

    } catch (error) {
      if (error.response) {
        logger.error('Perplexity API error:', error.response.data);
        throw new Error(`Perplexity API error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
      } else {
        logger.error('Network error calling Perplexity API:', error.message);
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  /**
   * Query enhancement methods
   */
  enhanceQuery(query, category) {
    const enhancements = {
      [this.researchCategories.MEDICAL_LITERATURE]: 'peer-reviewed medical literature and clinical studies about',
      [this.researchCategories.HEALTH_TRENDS]: 'current epidemiological trends and statistics for',
      [this.researchCategories.TREATMENT_OPTIONS]: 'evidence-based treatment options and clinical guidelines for',
      [this.researchCategories.PREVENTION_STRATEGIES]: 'evidence-based prevention strategies and risk reduction for',
      [this.researchCategories.DRUG_INFORMATION]: 'clinical pharmacology and safety information for',
      [this.researchCategories.CLINICAL_GUIDELINES]: 'current clinical practice guidelines from major medical organizations for'
    };

    return `Find recent ${enhancements[category]} ${query}. Focus on sources from 2022-2024 and include information about evidence quality and clinical significance.`;
  }

  buildTrendQuery(condition, demographics) {
    let query = `Current epidemiological trends and statistics for ${condition}`;
    
    if (demographics.age) query += ` in ${demographics.age} age group`;
    if (demographics.gender) query += ` among ${demographics.gender} patients`;
    if (demographics.region) query += ` in ${demographics.region}`;
    
    query += '. Include prevalence rates, incidence trends, and demographic patterns from recent health surveys and epidemiological studies.';
    
    return query;
  }

  buildTreatmentQuery(condition, patientProfile) {
    let query = `Evidence-based treatment options for ${condition}`;
    
    if (patientProfile.age) query += ` in ${patientProfile.age}-year-old patients`;
    if (patientProfile.comorbidities) query += ` with comorbidities: ${patientProfile.comorbidities.join(', ')}`;
    
    query += '. Include first-line treatments, alternative options, treatment effectiveness, and current clinical guidelines from major medical organizations.';
    
    return query;
  }

  buildPreventionQuery(riskFactors, targetConditions) {
    let query = `Evidence-based prevention strategies for individuals with risk factors: ${riskFactors.join(', ')}`;
    
    if (targetConditions.length > 0) {
      query += ` to prevent ${targetConditions.join(', ')}`;
    }
    
    query += '. Include lifestyle interventions, screening recommendations, and preventive treatments with evidence of effectiveness.';
    
    return query;
  }

  buildDrugQuery(medications, includeInteractions) {
    let query = `Clinical pharmacology information for medications: ${medications.join(', ')}`;
    
    if (includeInteractions) {
      query += '. Include drug interactions, contraindications, side effects, and monitoring requirements';
    }
    
    query += '. Focus on FDA-approved information and clinical prescribing guidelines.';
    
    return query;
  }

  buildGuidelinesQuery(condition, organization) {
    return `Current clinical practice guidelines for ${condition} from ${organization}. Include diagnostic criteria, treatment recommendations, monitoring guidelines, and evidence grades. Focus on the most recent guidelines from 2022-2024.`;
  }

  /**
   * Content parsing methods
   */
  parseTreatmentOptions(content) {
    const treatments = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('treatment') || line.includes('therapy') || line.includes('medication')) {
        const treatment = line.trim();
        if (treatment.length > 20) {
          treatments.push({
            description: treatment,
            evidence_level: this.extractEvidenceLevel(line),
            recommendation_grade: this.extractRecommendationGrade(line)
          });
        }
      }
    });
    
    return treatments;
  }

  parsePreventionStrategies(content) {
    const strategies = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('prevent') || line.includes('reduce risk') || line.includes('screening')) {
        const strategy = line.trim();
        if (strategy.length > 20) {
          strategies.push({
            strategy: strategy,
            effectiveness: this.extractEffectiveness(line),
            implementation: this.extractImplementationLevel(line)
          });
        }
      }
    });
    
    return strategies;
  }

  parseDrugProfiles(content) {
    const profiles = [];
    const sections = content.split(/\n\s*\n/);
    
    sections.forEach(section => {
      if (section.includes('mg') || section.includes('dosage') || section.includes('indication')) {
        profiles.push({
          information: section.trim(),
          safety_level: this.extractSafetyLevel(section),
          monitoring_required: section.toLowerCase().includes('monitor')
        });
      }
    });
    
    return profiles;
  }

  parseInteractionWarnings(content) {
    const warnings = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('interaction') || line.includes('contraindicated') || line.includes('caution')) {
        warnings.push({
          warning: line.trim(),
          severity: this.extractSeverityLevel(line)
        });
      }
    });
    
    return warnings;
  }

  parseSafetyInformation(content) {
    const safetyInfo = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('side effect') || line.includes('adverse') || line.includes('warning')) {
        safetyInfo.push({
          information: line.trim(),
          severity: this.extractSeverityLevel(line)
        });
      }
    });
    
    return safetyInfo;
  }

  /**
   * Assessment and extraction methods
   */
  assessSourceQuality(citations) {
    let qualityScore = 0;
    
    citations.forEach(citation => {
      if (citation.includes('pubmed') || citation.includes('nejm') || citation.includes('jama')) {
        qualityScore += 3;
      } else if (citation.includes('nih') || citation.includes('cdc') || citation.includes('who')) {
        qualityScore += 2;
      } else if (citation.includes('.gov') || citation.includes('.edu')) {
        qualityScore += 1;
      }
    });
    
    return Math.min(qualityScore / citations.length * 2, 10);
  }

  categorizeEvidenceLevel(content) {
    if (content.includes('systematic review') || content.includes('meta-analysis')) {
      return 'Level 1 - Systematic Review/Meta-analysis';
    } else if (content.includes('randomized controlled trial') || content.includes('RCT')) {
      return 'Level 2 - Randomized Controlled Trial';
    } else if (content.includes('cohort study') || content.includes('case-control')) {
      return 'Level 3 - Observational Study';
    } else if (content.includes('case series') || content.includes('expert opinion')) {
      return 'Level 4 - Case Series/Expert Opinion';
    }
    return 'Level 5 - Other Evidence';
  }

  assessStatisticalReliability(content) {
    let reliability = 5;
    
    if (content.includes('95% confidence interval') || content.includes('p-value')) reliability += 2;
    if (content.includes('large sample') || content.includes('population-based')) reliability += 1;
    if (content.includes('meta-analysis') || content.includes('systematic review')) reliability += 2;
    
    return Math.min(reliability, 10);
  }

  extractStatistics(content) {
    const stats = [];
    const statRegex = /(\d+(?:\.\d+)?%|\d+(?:,\d+)*|\d+(?:\.\d+)?\s*(?:times|fold))/g;
    const matches = content.match(statRegex);
    
    if (matches) {
      matches.forEach(match => {
        stats.push(match);
      });
    }
    
    return stats.slice(0, 10); // Limit to top 10 statistics
  }

  extractGuidelines(content) {
    const guidelines = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('recommend') || line.includes('should') || line.includes('guideline')) {
        guidelines.push(line.trim());
      }
    });
    
    return guidelines;
  }

  extractEffectivenessRatings(content) {
    const ratings = [];
    const effectivenessTerms = ['highly effective', 'moderately effective', 'limited effectiveness', 'proven effective'];
    
    effectivenessTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        ratings.push(term);
      }
    });
    
    return ratings;
  }

  extractEvidenceLevel(text) {
    if (text.includes('strong evidence') || text.includes('Level A')) return 'Strong';
    if (text.includes('moderate evidence') || text.includes('Level B')) return 'Moderate';
    if (text.includes('limited evidence') || text.includes('Level C')) return 'Limited';
    return 'Insufficient';
  }

  extractRecommendationGrade(text) {
    if (text.includes('Grade A') || text.includes('strongly recommend')) return 'A';
    if (text.includes('Grade B') || text.includes('recommend')) return 'B';
    if (text.includes('Grade C') || text.includes('may consider')) return 'C';
    return 'Ungraded';
  }

  extractEffectiveness(text) {
    if (text.includes('highly effective') || text.includes('significant reduction')) return 'High';
    if (text.includes('moderately effective') || text.includes('moderate reduction')) return 'Moderate';
    if (text.includes('limited effectiveness') || text.includes('small reduction')) return 'Limited';
    return 'Unknown';
  }

  extractImplementationLevel(text) {
    if (text.includes('easy to implement') || text.includes('simple')) return 'Easy';
    if (text.includes('moderate effort') || text.includes('requires planning')) return 'Moderate';
    if (text.includes('difficult') || text.includes('complex')) return 'Difficult';
    return 'Unknown';
  }

  extractSafetyLevel(text) {
    if (text.includes('generally safe') || text.includes('well tolerated')) return 'Safe';
    if (text.includes('monitor') || text.includes('caution')) return 'Monitor';
    if (text.includes('contraindicated') || text.includes('avoid')) return 'Avoid';
    return 'Unknown';
  }

  extractSeverityLevel(text) {
    if (text.includes('severe') || text.includes('serious') || text.includes('life-threatening')) return 'High';
    if (text.includes('moderate') || text.includes('significant')) return 'Moderate';
    if (text.includes('mild') || text.includes('minor')) return 'Low';
    return 'Unknown';
  }

  assessRecommendationStrength(content) {
    let strength = 0;
    
    if (content.includes('strongly recommend') || content.includes('Grade A')) strength += 3;
    if (content.includes('recommend') || content.includes('Grade B')) strength += 2;
    if (content.includes('consider') || content.includes('Grade C')) strength += 1;
    
    return strength > 2 ? 'Strong' : strength > 0 ? 'Moderate' : 'Weak';
  }

  assessImplementationDifficulty(content) {
    if (content.includes('simple') || content.includes('easy')) return 'Low';
    if (content.includes('moderate') || content.includes('planning')) return 'Moderate';
    if (content.includes('complex') || content.includes('difficult')) return 'High';
    return 'Unknown';
  }

  assessGuidelineStrength(content) {
    if (content.includes('Class I') || content.includes('Level A')) return 'Strong';
    if (content.includes('Class II') || content.includes('Level B')) return 'Moderate';
    if (content.includes('Class III') || content.includes('Level C')) return 'Weak';
    return 'Ungraded';
  }

  extractGuidelineDate(content) {
    const dateRegex = /20\d{2}/g;
    const dates = content.match(dateRegex);
    return dates ? Math.max(...dates.map(Number)).toString() : 'Unknown';
  }

  extractImplementationGuidance(content) {
    const guidance = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('implement') || line.includes('apply') || line.includes('practice')) {
        guidance.push(line.trim());
      }
    });
    
    return guidance;
  }

  assessDrugInfoReliability(citations) {
    let reliability = 0;
    
    citations.forEach(citation => {
      if (citation.includes('fda.gov') || citation.includes('drugs.com')) reliability += 3;
      if (citation.includes('pubmed') || citation.includes('pharmacology')) reliability += 2;
      if (citation.includes('.gov') || citation.includes('medical')) reliability += 1;
    });
    
    return Math.min(reliability / citations.length * 2, 10);
  }

  /**
   * Synthesis methods
   */
  async synthesizeResearchFindings(researchResults) {
    const findings = [];
    
    Object.keys(researchResults).forEach(category => {
      const result = researchResults[category];
      findings.push(`${category.toUpperCase()}: ${this.summarizeFindings(result)}`);
    });
    
    return findings.join('\n\n');
  }

  summarizeFindings(result) {
    if (result.findings) return result.findings.substring(0, 200) + '...';
    if (result.trend_analysis) return result.trend_analysis.substring(0, 200) + '...';
    if (result.guidelines_summary) return result.guidelines_summary.substring(0, 200) + '...';
    return 'Research findings available';
  }

  calculateOverallConfidence(researchResults) {
    let totalConfidence = 0;
    let count = 0;
    
    Object.values(researchResults).forEach(result => {
      if (result.confidence_score) {
        totalConfidence += result.confidence_score;
        count++;
      }
      if (result.statistical_confidence) {
        totalConfidence += result.statistical_confidence;
        count++;
      }
      if (result.reliability_score) {
        totalConfidence += result.reliability_score;
        count++;
      }
    });
    
    return count > 0 ? totalConfidence / count : 5;
  }

  /**
   * Health check for Perplexity API
   */
  async checkAPIHealth() {
    try {
      if (!this.apiKey) {
        return { status: 'unavailable', reason: 'API key not configured' };
      }

      const testResponse = await this.makePerplexityRequest('What is the current year?', {
        maxTokens: 50,
        temperature: 0
      });

      return {
        status: 'healthy',
        response_time: Date.now(),
        test_response: testResponse.content.substring(0, 100)
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = PerplexityHealthResearch;
