/**
 * Local Health Processor
 * Integrates PDF and Apple Health data extraction for comprehensive health data processing
 */

const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const AppleHealthProcessor = require('./apple-health-processor');
const PDFProcessor = require('./pdf-processor');

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
    new winston.transports.File({ filename: 'logs/health-processor.log' })
  ]
});

class LocalHealthProcessor {
  constructor() {
    this.appleHealthProcessor = new AppleHealthProcessor();
    this.pdfProcessor = new PDFProcessor();
    this.processedData = {
      apple_health: null,
      pdf_documents: [],
      combined_insights: [],
      processing_summary: {}
    };
  }

  /**
   * Process health data from HR folder containing Apple Health export and PDF reports
   */
  async processHealthDataFolder(folderPath) {
    try {
      logger.info(`Starting health data processing from folder: ${folderPath}`);

      // Verify folder exists
      const folderStats = await fs.stat(folderPath);
      if (!folderStats.isDirectory()) {
        throw new Error(`Path is not a directory: ${folderPath}`);
      }

      // Scan folder for health data files
      const files = await this.scanHealthDataFiles(folderPath);
      logger.info(`Found ${files.appleHealthFiles.length} Apple Health files and ${files.pdfFiles.length} PDF files`);

      const results = {
        apple_health_results: [],
        pdf_results: [],
        processing_errors: [],
        combined_insights: []
      };

      // Process Apple Health exports
      for (const appleHealthFile of files.appleHealthFiles) {
        try {
          logger.info(`Processing Apple Health export: ${appleHealthFile}`);
          const appleHealthResult = await this.appleHealthProcessor.processAppleHealthExport(appleHealthFile);
          results.apple_health_results.push({
            file: appleHealthFile,
            result: appleHealthResult
          });
          this.processedData.apple_health = appleHealthResult;
        } catch (error) {
          logger.error(`Error processing Apple Health file ${appleHealthFile}:`, error);
          results.processing_errors.push({
            file: appleHealthFile,
            error: error.message,
            type: 'apple_health'
          });
        }
      }

      // Process PDF health documents
      for (const pdfFile of files.pdfFiles) {
        try {
          logger.info(`Processing PDF health document: ${pdfFile}`);
          const pdfResult = await this.pdfProcessor.processPDFHealthDocument(pdfFile);
          results.pdf_results.push({
            file: pdfFile,
            result: pdfResult
          });
          this.processedData.pdf_documents.push(pdfResult);
        } catch (error) {
          logger.error(`Error processing PDF file ${pdfFile}:`, error);
          results.processing_errors.push({
            file: pdfFile,
            error: error.message,
            type: 'pdf'
          });
        }
      }

      // Generate combined insights
      results.combined_insights = await this.generateCombinedInsights();
      this.processedData.combined_insights = results.combined_insights;

      // Generate processing summary
      this.processedData.processing_summary = this.generateProcessingSummary(results);

      logger.info('Health data processing completed successfully');
      return results;

    } catch (error) {
      logger.error('Error processing health data folder:', error);
      throw error;
    }
  }

  /**
   * Scan folder for health data files
   */
  async scanHealthDataFiles(folderPath) {
    const files = {
      appleHealthFiles: [],
      pdfFiles: [],
      otherFiles: []
    };

    try {
      const dirContents = await fs.readdir(folderPath, { withFileTypes: true });

      for (const item of dirContents) {
        const fullPath = path.join(folderPath, item.name);

        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          const fileName = item.name.toLowerCase();

          // Identify Apple Health export files
          if (fileName.includes('export') && ext === '.xml') {
            files.appleHealthFiles.push(fullPath);
          }
          // Identify PDF health documents
          else if (ext === '.pdf') {
            files.pdfFiles.push(fullPath);
          }
          // Other files
          else {
            files.otherFiles.push(fullPath);
          }
        }
        // Recursively scan subdirectories
        else if (item.isDirectory()) {
          const subFiles = await this.scanHealthDataFiles(fullPath);
          files.appleHealthFiles.push(...subFiles.appleHealthFiles);
          files.pdfFiles.push(...subFiles.pdfFiles);
          files.otherFiles.push(...subFiles.otherFiles);
        }
      }

    } catch (error) {
      logger.error(`Error scanning directory ${folderPath}:`, error);
    }

    return files;
  }

  /**
   * Generate combined insights from all processed health data
   */
  async generateCombinedInsights() {
    const insights = [];

    try {
      // Get Apple Health insights
      if (this.processedData.apple_health) {
        const appleInsights = this.appleHealthProcessor.getHealthInsights();
        insights.push(...appleInsights.map(insight => ({
          ...insight,
          source: 'apple_health'
        })));
      }

      // Get PDF document insights
      for (const pdfDoc of this.processedData.pdf_documents) {
        if (pdfDoc.health_insights) {
          insights.push(...pdfDoc.health_insights.map(insight => ({
            ...insight,
            source: 'pdf_document',
            document: pdfDoc.file_name
          })));
        }
      }

      // Generate cross-data insights
      const crossInsights = await this.generateCrossDataInsights();
      insights.push(...crossInsights);

      // Prioritize insights by importance
      insights.sort((a, b) => {
        const priority = { 'alert': 3, 'recommendation': 2, 'positive': 1 };
        return (priority[b.type] || 0) - (priority[a.type] || 0);
      });

      logger.info(`Generated ${insights.length} combined health insights`);
      return insights;

    } catch (error) {
      logger.error('Error generating combined insights:', error);
      return [];
    }
  }

  /**
   * Generate insights that cross-reference different data sources
   */
  async generateCrossDataInsights() {
    const crossInsights = [];

    try {
      // Compare Apple Health activity data with medical records
      if (this.processedData.apple_health && this.processedData.pdf_documents.length > 0) {
        
        // Check for activity recommendations in medical records vs actual activity
        const appleHealthSummary = this.processedData.apple_health.summary;
        const medicalRecommendations = this.extractMedicalRecommendations();

        if (appleHealthSummary.daily_step_stats && medicalRecommendations.activity) {
          const actualSteps = appleHealthSummary.daily_step_stats.average;
          const recommendedSteps = medicalRecommendations.activity.recommended_steps || 8000;

          if (actualSteps < recommendedSteps * 0.7) {
            crossInsights.push({
              type: 'alert',
              category: 'activity_compliance',
              message: `Activity level below medical recommendations: ${Math.round(actualSteps)} vs ${recommendedSteps} steps/day`,
              recommendation: 'Consider discussing activity goals with healthcare provider',
              source: 'cross_reference',
              data_sources: ['apple_health', 'medical_records']
            });
          }
        }

        // Check for medication adherence patterns
        const medicationSchedule = this.extractMedicationSchedule();
        if (medicationSchedule.length > 0) {
          crossInsights.push({
            type: 'recommendation',
            category: 'medication_tracking',
            message: `${medicationSchedule.length} medications identified in medical records`,
            recommendation: 'Consider using Apple Health medication tracking features',
            source: 'cross_reference',
            data_sources: ['medical_records']
          });
        }

        // Correlate heart rate data with medical conditions
        if (appleHealthSummary.heart_rate_stats) {
          const heartConditions = this.extractHeartConditions();
          if (heartConditions.length > 0 && appleHealthSummary.heart_rate_stats.average > 90) {
            crossInsights.push({
              type: 'alert',
              category: 'heart_rate_monitoring',
              message: `Elevated heart rate patterns detected with known cardiac conditions`,
              recommendation: 'Share heart rate data with cardiologist at next appointment',
              source: 'cross_reference',
              data_sources: ['apple_health', 'medical_records']
            });
          }
        }
      }

      // Check for data gaps
      const dataGaps = this.identifyDataGaps();
      if (dataGaps.length > 0) {
        crossInsights.push({
          type: 'recommendation',
          category: 'data_completeness',
          message: `Data gaps identified: ${dataGaps.join(', ')}`,
          recommendation: 'Consider enabling additional health tracking features',
          source: 'data_analysis'
        });
      }

    } catch (error) {
      logger.error('Error generating cross-data insights:', error);
    }

    return crossInsights;
  }

  /**
   * Extract medical recommendations from PDF documents
   */
  extractMedicalRecommendations() {
    const recommendations = {
      activity: {},
      diet: {},
      medication: {},
      monitoring: {}
    };

    try {
      for (const pdfDoc of this.processedData.pdf_documents) {
        if (pdfDoc.extracted_text) {
          const text = pdfDoc.extracted_text.toLowerCase();

          // Look for activity recommendations
          const stepMatch = text.match(/(\d+,?\d*)\s*steps?\s*per\s*day/);
          if (stepMatch) {
            recommendations.activity.recommended_steps = parseInt(stepMatch[1].replace(',', ''));
          }

          // Look for exercise recommendations
          if (text.includes('exercise') || text.includes('physical activity')) {
            recommendations.activity.exercise_recommended = true;
          }

          // Look for diet recommendations
          if (text.includes('diet') || text.includes('nutrition')) {
            recommendations.diet.dietary_changes = true;
          }
        }
      }
    } catch (error) {
      logger.error('Error extracting medical recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Extract medication schedule from PDF documents
   */
  extractMedicationSchedule() {
    const medications = [];

    try {
      for (const pdfDoc of this.processedData.pdf_documents) {
        if (pdfDoc.structured_data && pdfDoc.structured_data.medications) {
          medications.push(...pdfDoc.structured_data.medications);
        }
      }
    } catch (error) {
      logger.error('Error extracting medication schedule:', error);
    }

    return medications;
  }

  /**
   * Extract heart conditions from medical records
   */
  extractHeartConditions() {
    const conditions = [];

    try {
      for (const pdfDoc of this.processedData.pdf_documents) {
        if (pdfDoc.extracted_text) {
          const text = pdfDoc.extracted_text.toLowerCase();
          
          const heartConditions = [
            'hypertension', 'high blood pressure', 'cardiac', 'heart disease',
            'arrhythmia', 'atrial fibrillation', 'coronary', 'myocardial'
          ];

          heartConditions.forEach(condition => {
            if (text.includes(condition)) {
              conditions.push(condition);
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error extracting heart conditions:', error);
    }

    return [...new Set(conditions)]; // Remove duplicates
  }

  /**
   * Identify gaps in health data collection
   */
  identifyDataGaps() {
    const gaps = [];

    try {
      // Check Apple Health data completeness
      if (this.processedData.apple_health) {
        const metrics = this.processedData.apple_health.metrics;
        
        if (metrics.weight.length === 0) {
          gaps.push('weight_tracking');
        }
        
        if (metrics.sleep.length === 0) {
          gaps.push('sleep_tracking');
        }
        
        if (metrics.blood_pressure.length === 0) {
          gaps.push('blood_pressure_monitoring');
        }
        
        if (metrics.workouts.length < 10) {
          gaps.push('workout_logging');
        }
      }

      // Check for missing recent medical records
      const recentPDFs = this.processedData.pdf_documents.filter(doc => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return doc.creation_date && new Date(doc.creation_date) > oneYearAgo;
      });

      if (recentPDFs.length === 0) {
        gaps.push('recent_medical_records');
      }

    } catch (error) {
      logger.error('Error identifying data gaps:', error);
    }

    return gaps;
  }

  /**
   * Generate comprehensive processing summary
   */
  generateProcessingSummary(results) {
    const summary = {
      processing_date: new Date().toISOString(),
      total_files_processed: results.apple_health_results.length + results.pdf_results.length,
      apple_health_files: results.apple_health_results.length,
      pdf_files: results.pdf_results.length,
      processing_errors: results.processing_errors.length,
      insights_generated: results.combined_insights.length,
      data_quality: this.assessDataQuality(),
      recommendations: this.generateProcessingRecommendations()
    };

    // Add Apple Health summary if available
    if (this.processedData.apple_health && this.processedData.apple_health.summary) {
      summary.apple_health_summary = this.processedData.apple_health.summary;
    }

    // Add PDF processing summary
    summary.pdf_summary = {
      total_documents: this.processedData.pdf_documents.length,
      document_types: this.categorizeDocumentTypes(),
      extraction_success_rate: this.calculateExtractionSuccessRate()
    };

    return summary;
  }

  /**
   * Assess overall data quality
   */
  assessDataQuality() {
    let qualityScore = 0;
    const factors = [];

    // Apple Health data quality
    if (this.processedData.apple_health) {
      const summary = this.processedData.apple_health.summary;
      
      if (summary.steps_records > 100) {
        qualityScore += 25;
        factors.push('Sufficient step data');
      }
      
      if (summary.heart_rate_records > 50) {
        qualityScore += 25;
        factors.push('Good heart rate data');
      }
      
      if (summary.workout_records > 10) {
        qualityScore += 20;
        factors.push('Regular workout logging');
      }
    }

    // PDF data quality
    if (this.processedData.pdf_documents.length > 0) {
      qualityScore += 20;
      factors.push('Medical records available');
      
      if (this.processedData.pdf_documents.length >= 3) {
        qualityScore += 10;
        factors.push('Multiple medical documents');
      }
    }

    return {
      score: Math.min(qualityScore, 100),
      factors: factors,
      grade: qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : qualityScore >= 40 ? 'Fair' : 'Poor'
    };
  }

  /**
   * Categorize document types from PDF processing
   */
  categorizeDocumentTypes() {
    const types = {};

    this.processedData.pdf_documents.forEach(doc => {
      const type = doc.document_type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });

    return types;
  }

  /**
   * Calculate extraction success rate for PDF processing
   */
  calculateExtractionSuccessRate() {
    if (this.processedData.pdf_documents.length === 0) return 0;

    const successfulExtractions = this.processedData.pdf_documents.filter(doc => 
      doc.extracted_text && doc.extracted_text.length > 100
    ).length;

    return (successfulExtractions / this.processedData.pdf_documents.length) * 100;
  }

  /**
   * Generate processing recommendations
   */
  generateProcessingRecommendations() {
    const recommendations = [];

    // Data collection recommendations
    const dataGaps = this.identifyDataGaps();
    if (dataGaps.length > 0) {
      recommendations.push(`Enable missing health tracking: ${dataGaps.join(', ')}`);
    }

    // Data quality recommendations
    const quality = this.assessDataQuality();
    if (quality.score < 60) {
      recommendations.push('Improve data collection consistency for better insights');
    }

    // Processing recommendations
    if (this.processedData.pdf_documents.length === 0) {
      recommendations.push('Add medical records for comprehensive health analysis');
    }

    if (this.processedData.apple_health === null) {
      recommendations.push('Include Apple Health export for activity and biometric data');
    }

    return recommendations;
  }

  /**
   * Export all processed data to JSON
   */
  async exportProcessedData(outputPath) {
    try {
      const exportData = {
        export_metadata: {
          export_date: new Date().toISOString(),
          processor_version: '1.0.0',
          data_sources: ['apple_health', 'pdf_documents']
        },
        processed_data: this.processedData
      };

      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
      logger.info(`Exported all processed health data to: ${outputPath}`);

      return exportData;

    } catch (error) {
      logger.error('Error exporting processed data:', error);
      throw error;
    }
  }

  /**
   * Get processed data summary
   */
  getProcessedDataSummary() {
    return {
      has_apple_health_data: this.processedData.apple_health !== null,
      pdf_documents_count: this.processedData.pdf_documents.length,
      insights_count: this.processedData.combined_insights.length,
      processing_summary: this.processedData.processing_summary,
      data_quality: this.assessDataQuality()
    };
  }

  /**
   * Reset processor state
   */
  reset() {
    this.appleHealthProcessor.reset();
    this.processedData = {
      apple_health: null,
      pdf_documents: [],
      combined_insights: [],
      processing_summary: {}
    };
  }
}

module.exports = LocalHealthProcessor;
