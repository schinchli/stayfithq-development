/**
 * Textract Service using AWS SDK v3
 * Handles health document text extraction and analysis
 */

const { 
  TextractClient, 
  DetectDocumentTextCommand, 
  AnalyzeDocumentCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand
} = require('@aws-sdk/client-textract');
const { awsConfig } = require('./aws-config-v3');
const S3ServiceV3 = require('./s3-service-v3');
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

class TextractServiceV3 {
  constructor() {
    this.client = new TextractClient(awsConfig.getServiceConfig('textract'));
    this.s3Service = new S3ServiceV3();
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Extract text from health document
   */
  async extractTextFromDocument(documentSource, userId) {
    try {
      logger.info('Starting text extraction from health document');

      let document;
      
      // Handle different document sources
      if (typeof documentSource === 'string') {
        // S3 key provided
        document = {
          S3Object: {
            Bucket: process.env.HEALTH_DOCUMENTS_BUCKET || 'stayfit-health-docs',
            Name: documentSource
          }
        };
      } else if (documentSource.buffer) {
        // Direct buffer provided
        document = {
          Bytes: documentSource.buffer
        };
      } else {
        throw new Error('Invalid document source provided');
      }

      const command = new DetectDocumentTextCommand({
        Document: document
      });

      const response = await this.client.send(command);
      
      // Process and structure the extracted text
      const extractedData = this.processTextractResponse(response);
      
      logger.info(`Text extraction completed: ${extractedData.text.length} characters extracted`);
      
      return {
        success: true,
        extractedText: extractedData.text,
        confidence: extractedData.averageConfidence,
        blocks: extractedData.blocks,
        lines: extractedData.lines,
        words: extractedData.words,
        metadata: {
          documentId: response.DocumentMetadata?.DocumentId,
          pages: response.DocumentMetadata?.Pages,
          extractedAt: new Date().toISOString(),
          userId: userId
        }
      };

    } catch (error) {
      logger.error('Error extracting text from document:', error);
      throw new Error(`Textract extraction failed: ${error.message}`);
    }
  }

  /**
   * Analyze health document with forms and tables
   */
  async analyzeHealthDocument(documentSource, userId, features = ['TABLES', 'FORMS']) {
    try {
      logger.info('Starting comprehensive health document analysis');

      let document;
      
      if (typeof documentSource === 'string') {
        document = {
          S3Object: {
            Bucket: process.env.HEALTH_DOCUMENTS_BUCKET || 'stayfit-health-docs',
            Name: documentSource
          }
        };
      } else if (documentSource.buffer) {
        document = {
          Bytes: documentSource.buffer
        };
      } else {
        throw new Error('Invalid document source provided');
      }

      const command = new AnalyzeDocumentCommand({
        Document: document,
        FeatureTypes: features
      });

      const response = await this.client.send(command);
      
      // Process comprehensive analysis
      const analysisData = this.processAnalysisResponse(response);
      
      logger.info(`Document analysis completed: ${analysisData.extractedText.length} characters, ${analysisData.tables.length} tables, ${analysisData.forms.length} forms`);
      
      return {
        success: true,
        extractedText: analysisData.extractedText,
        tables: analysisData.tables,
        forms: analysisData.forms,
        keyValuePairs: analysisData.keyValuePairs,
        confidence: analysisData.averageConfidence,
        healthMetrics: this.extractHealthMetrics(analysisData),
        metadata: {
          documentId: response.DocumentMetadata?.DocumentId,
          pages: response.DocumentMetadata?.Pages,
          analyzedAt: new Date().toISOString(),
          userId: userId,
          features: features
        }
      };

    } catch (error) {
      logger.error('Error analyzing health document:', error);
      throw new Error(`Textract analysis failed: ${error.message}`);
    }
  }

  /**
   * Start asynchronous document analysis for large documents
   */
  async startAsyncDocumentAnalysis(s3Key, userId, features = ['TABLES', 'FORMS']) {
    try {
      logger.info(`Starting async analysis for document: ${s3Key}`);

      const command = new StartDocumentAnalysisCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: process.env.HEALTH_DOCUMENTS_BUCKET || 'stayfit-health-docs',
            Name: s3Key
          }
        },
        FeatureTypes: features,
        ClientRequestToken: `${userId}_${Date.now()}` // Unique token for tracking
      });

      const response = await this.client.send(command);
      
      logger.info(`Async analysis started with JobId: ${response.JobId}`);
      
      return {
        success: true,
        jobId: response.JobId,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
        userId: userId,
        s3Key: s3Key
      };

    } catch (error) {
      logger.error('Error starting async document analysis:', error);
      throw new Error(`Async analysis start failed: ${error.message}`);
    }
  }

  /**
   * Get results from asynchronous document analysis
   */
  async getAsyncAnalysisResults(jobId, userId) {
    try {
      logger.info(`Getting async analysis results for JobId: ${jobId}`);

      const command = new GetDocumentAnalysisCommand({
        JobId: jobId
      });

      const response = await this.client.send(command);
      
      if (response.JobStatus === 'SUCCEEDED') {
        const analysisData = this.processAnalysisResponse(response);
        
        logger.info(`Async analysis completed successfully for JobId: ${jobId}`);
        
        return {
          success: true,
          status: 'COMPLETED',
          extractedText: analysisData.extractedText,
          tables: analysisData.tables,
          forms: analysisData.forms,
          keyValuePairs: analysisData.keyValuePairs,
          confidence: analysisData.averageConfidence,
          healthMetrics: this.extractHealthMetrics(analysisData),
          metadata: {
            jobId: jobId,
            documentId: response.DocumentMetadata?.DocumentId,
            pages: response.DocumentMetadata?.Pages,
            completedAt: new Date().toISOString(),
            userId: userId
          }
        };
      } else if (response.JobStatus === 'FAILED') {
        throw new Error(`Analysis failed: ${response.StatusMessage}`);
      } else {
        return {
          success: false,
          status: response.JobStatus,
          statusMessage: response.StatusMessage,
          jobId: jobId
        };
      }

    } catch (error) {
      logger.error('Error getting async analysis results:', error);
      throw new Error(`Async analysis retrieval failed: ${error.message}`);
    }
  }

  /**
   * Process health document from S3 with full pipeline
   */
  async processHealthDocumentFromS3(s3Key, userId, analysisType = 'comprehensive') {
    try {
      logger.info(`Processing health document from S3: ${s3Key}`);

      // Get document metadata first
      const metadata = await this.s3Service.getDocumentMetadata(s3Key, userId);
      
      let result;
      
      if (analysisType === 'text_only') {
        result = await this.extractTextFromDocument(s3Key, userId);
      } else if (analysisType === 'comprehensive') {
        // Check document size to decide sync vs async
        const fileSizeMB = metadata.contentLength / (1024 * 1024);
        
        if (fileSizeMB > 5) { // Use async for files > 5MB
          const asyncResult = await this.startAsyncDocumentAnalysis(s3Key, userId);
          
          // Poll for completion (in production, use SNS/SQS for notifications)
          result = await this.pollAsyncAnalysis(asyncResult.jobId, userId);
        } else {
          result = await this.analyzeHealthDocument(s3Key, userId);
        }
      } else {
        throw new Error(`Unsupported analysis type: ${analysisType}`);
      }

      // Add S3 metadata to result
      result.s3Metadata = {
        key: s3Key,
        size: metadata.contentLength,
        contentType: metadata.contentType,
        lastModified: metadata.lastModified
      };

      logger.info(`Health document processing completed for: ${s3Key}`);
      return result;

    } catch (error) {
      logger.error('Error processing health document from S3:', error);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Batch process multiple health documents
   */
  async batchProcessDocuments(s3Keys, userId, analysisType = 'comprehensive') {
    try {
      logger.info(`Batch processing ${s3Keys.length} health documents`);

      const processingPromises = s3Keys.map(s3Key => 
        this.processHealthDocumentFromS3(s3Key, userId, analysisType)
          .catch(error => ({ error: error.message, s3Key }))
      );

      const results = await Promise.allSettled(processingPromises);
      
      const successful = results
        .filter(r => r.status === 'fulfilled' && !r.value.error)
        .map(r => r.value);
      
      const failed = results
        .filter(r => r.status === 'rejected' || r.value.error)
        .map(r => r.status === 'rejected' ? r.reason : r.value);

      logger.info(`Batch processing completed: ${successful.length} successful, ${failed.length} failed`);
      
      return {
        success: failed.length === 0,
        successful: successful,
        failed: failed,
        totalCount: s3Keys.length,
        successCount: successful.length,
        failureCount: failed.length,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in batch document processing:', error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }

  /**
   * Process Textract response for text extraction
   */
  processTextractResponse(response) {
    const blocks = response.Blocks || [];
    const lines = [];
    const words = [];
    let fullText = '';
    let totalConfidence = 0;
    let confidenceCount = 0;

    blocks.forEach(block => {
      if (block.BlockType === 'LINE') {
        lines.push({
          text: block.Text,
          confidence: block.Confidence,
          boundingBox: block.Geometry?.BoundingBox
        });
        fullText += block.Text + '\n';
        totalConfidence += block.Confidence;
        confidenceCount++;
      } else if (block.BlockType === 'WORD') {
        words.push({
          text: block.Text,
          confidence: block.Confidence,
          boundingBox: block.Geometry?.BoundingBox
        });
      }
    });

    return {
      text: fullText.trim(),
      lines: lines,
      words: words,
      blocks: blocks,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0
    };
  }

  /**
   * Process comprehensive analysis response
   */
  processAnalysisResponse(response) {
    const blocks = response.Blocks || [];
    const tables = [];
    const forms = [];
    const keyValuePairs = [];
    let extractedText = '';
    let totalConfidence = 0;
    let confidenceCount = 0;

    // Build relationships map
    const blockMap = {};
    blocks.forEach(block => {
      blockMap[block.Id] = block;
    });

    blocks.forEach(block => {
      if (block.BlockType === 'LINE') {
        extractedText += block.Text + '\n';
        totalConfidence += block.Confidence;
        confidenceCount++;
      } else if (block.BlockType === 'TABLE') {
        tables.push(this.processTable(block, blockMap));
      } else if (block.BlockType === 'KEY_VALUE_SET') {
        const kvPair = this.processKeyValueSet(block, blockMap);
        if (kvPair) {
          keyValuePairs.push(kvPair);
        }
      }
    });

    // Group key-value pairs into forms
    const formGroups = this.groupKeyValuePairs(keyValuePairs);
    forms.push(...formGroups);

    return {
      extractedText: extractedText.trim(),
      tables: tables,
      forms: forms,
      keyValuePairs: keyValuePairs,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0
    };
  }

  /**
   * Process table from Textract blocks
   */
  processTable(tableBlock, blockMap) {
    const table = {
      confidence: tableBlock.Confidence,
      rows: [],
      rowCount: 0,
      columnCount: 0
    };

    if (tableBlock.Relationships) {
      const cellRelationship = tableBlock.Relationships.find(r => r.Type === 'CHILD');
      if (cellRelationship) {
        const cells = cellRelationship.Ids.map(id => blockMap[id]).filter(block => block.BlockType === 'CELL');
        
        // Group cells by row
        const rowMap = {};
        cells.forEach(cell => {
          const rowIndex = cell.RowIndex - 1;
          const colIndex = cell.ColumnIndex - 1;
          
          if (!rowMap[rowIndex]) {
            rowMap[rowIndex] = {};
          }
          
          rowMap[rowIndex][colIndex] = {
            text: this.getCellText(cell, blockMap),
            confidence: cell.Confidence,
            isHeader: cell.EntityTypes && cell.EntityTypes.includes('COLUMN_HEADER')
          };
        });

        // Convert to array format
        table.rows = Object.keys(rowMap).sort((a, b) => a - b).map(rowIndex => {
          const row = rowMap[rowIndex];
          return Object.keys(row).sort((a, b) => a - b).map(colIndex => row[colIndex]);
        });

        table.rowCount = table.rows.length;
        table.columnCount = table.rows.length > 0 ? table.rows[0].length : 0;
      }
    }

    return table;
  }

  /**
   * Get text content from a cell
   */
  getCellText(cellBlock, blockMap) {
    let text = '';
    
    if (cellBlock.Relationships) {
      const childRelationship = cellBlock.Relationships.find(r => r.Type === 'CHILD');
      if (childRelationship) {
        childRelationship.Ids.forEach(id => {
          const childBlock = blockMap[id];
          if (childBlock && childBlock.BlockType === 'WORD') {
            text += childBlock.Text + ' ';
          }
        });
      }
    }
    
    return text.trim();
  }

  /**
   * Process key-value set from Textract
   */
  processKeyValueSet(kvBlock, blockMap) {
    if (!kvBlock.EntityTypes) return null;

    const isKey = kvBlock.EntityTypes.includes('KEY');
    const isValue = kvBlock.EntityTypes.includes('VALUE');

    if (isKey) {
      let keyText = '';
      let valueText = '';

      // Get key text
      if (kvBlock.Relationships) {
        const childRel = kvBlock.Relationships.find(r => r.Type === 'CHILD');
        if (childRel) {
          keyText = childRel.Ids.map(id => {
            const block = blockMap[id];
            return block && block.BlockType === 'WORD' ? block.Text : '';
          }).join(' ').trim();
        }

        // Get associated value
        const valueRel = kvBlock.Relationships.find(r => r.Type === 'VALUE');
        if (valueRel && valueRel.Ids.length > 0) {
          const valueBlock = blockMap[valueRel.Ids[0]];
          if (valueBlock && valueBlock.Relationships) {
            const valueChildRel = valueBlock.Relationships.find(r => r.Type === 'CHILD');
            if (valueChildRel) {
              valueText = valueChildRel.Ids.map(id => {
                const block = blockMap[id];
                return block && block.BlockType === 'WORD' ? block.Text : '';
              }).join(' ').trim();
            }
          }
        }
      }

      return {
        key: keyText,
        value: valueText,
        confidence: kvBlock.Confidence
      };
    }

    return null;
  }

  /**
   * Group key-value pairs into logical forms
   */
  groupKeyValuePairs(keyValuePairs) {
    // Simple grouping - in production, you might want more sophisticated logic
    return [{
      type: 'extracted_form',
      fields: keyValuePairs,
      fieldCount: keyValuePairs.length
    }];
  }

  /**
   * Extract health-specific metrics from analyzed data
   */
  extractHealthMetrics(analysisData) {
    const healthMetrics = {
      vitals: {},
      measurements: {},
      dates: [],
      medications: [],
      conditions: []
    };

    // Look for common health patterns in text and key-value pairs
    const text = analysisData.extractedText.toLowerCase();
    const kvPairs = analysisData.keyValuePairs || [];

    // Extract vital signs
    const vitalPatterns = {
      blood_pressure: /(?:bp|blood pressure)[\s:]*(\d{2,3}\/\d{2,3})/gi,
      heart_rate: /(?:hr|heart rate|pulse)[\s:]*(\d{2,3})\s*(?:bpm)?/gi,
      temperature: /(?:temp|temperature)[\s:]*(\d{2,3}(?:\.\d)?)\s*(?:°f|°c|f|c)?/gi,
      weight: /(?:weight|wt)[\s:]*(\d{2,3}(?:\.\d)?)\s*(?:lbs?|kg|pounds?|kilograms?)?/gi,
      height: /(?:height|ht)[\s:]*(\d{1,2}'\s*\d{1,2}"|[\d.]+\s*(?:ft|in|cm|m))/gi
    };

    Object.entries(vitalPatterns).forEach(([metric, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        healthMetrics.vitals[metric] = matches.map(match => match.trim());
      }
    });

    // Extract from key-value pairs
    kvPairs.forEach(pair => {
      const key = pair.key.toLowerCase();
      const value = pair.value;

      if (key.includes('blood pressure') || key.includes('bp')) {
        healthMetrics.vitals.blood_pressure = healthMetrics.vitals.blood_pressure || [];
        healthMetrics.vitals.blood_pressure.push(value);
      } else if (key.includes('heart rate') || key.includes('pulse')) {
        healthMetrics.vitals.heart_rate = healthMetrics.vitals.heart_rate || [];
        healthMetrics.vitals.heart_rate.push(value);
      } else if (key.includes('weight')) {
        healthMetrics.measurements.weight = value;
      } else if (key.includes('height')) {
        healthMetrics.measurements.height = value;
      }
    });

    // Extract dates
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const dateMatches = text.match(datePattern);
    if (dateMatches) {
      healthMetrics.dates = dateMatches;
    }

    return healthMetrics;
  }

  /**
   * Poll async analysis until completion
   */
  async pollAsyncAnalysis(jobId, userId, maxAttempts = 30) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.getAsyncAnalysisResults(jobId, userId);
        
        if (result.status === 'COMPLETED') {
          return result;
        } else if (result.status === 'FAILED') {
          throw new Error(`Analysis failed: ${result.statusMessage}`);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        attempts++;
        
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        attempts++;
      }
    }
    
    throw new Error('Analysis polling timeout - job may still be in progress');
  }

  /**
   * Health check for Textract service
   */
  async healthCheck() {
    try {
      // Create a simple test document
      const testDocument = {
        Bytes: Buffer.from('Test document for health check')
      };

      const command = new DetectDocumentTextCommand({
        Document: testDocument
      });

      await this.client.send(command);
      
      return {
        status: 'healthy',
        service: 'Textract',
        region: awsConfig.region,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'Textract',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = TextractServiceV3;
