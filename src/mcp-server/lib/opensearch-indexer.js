/**
 * OpenSearch Health Data Indexer
 * Handles indexing of health data into OpenSearch for MCP queries
 */

const { Client } = require('@opensearch-project/opensearch');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

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

class OpenSearchHealthIndexer {
  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_ENDPOINT || 'https://localhost:9200',
      auth: {
        username = "your_username".env.OPENSEARCH_USERNAME || 'admin',
        password = "your_secure_password"|| 'admin'
      },
      ssl: {
        rejectUnauthorized: false // For development only
      }
    });

    this.indices = {
      health_metrics: 'health-metrics',
      apple_health: 'apple-health-data',
      health_records: 'health-records',
      family_health: 'family-health-data'
    };

    this.indexMappings = this.getIndexMappings();
  }

  /**
   * Initialize OpenSearch indices with proper mappings
   */
  async initializeIndices() {
    try {
      logger.info('Initializing OpenSearch indices for health data...');

      for (const [indexType, indexName] of Object.entries(this.indices)) {
        await this.createIndexIfNotExists(indexName, this.indexMappings[indexType]);
      }

      logger.info('All health data indices initialized successfully');
      return { status: 'success', indices: Object.values(this.indices) };

    } catch (error) {
      logger.error('Failed to initialize indices:', error);
      throw error;
    }
  }

  /**
   * Create index if it doesn't exist
   */
  async createIndexIfNotExists(indexName, mapping) {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (!exists.body) {
        await this.client.indices.create({
          index: indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              'index.mapping.total_fields.limit': 2000
            },
            mappings: mapping
          }
        });
        logger.info(`Created index: ${indexName}`);
      } else {
        logger.info(`Index already exists: ${indexName}`);
      }
    } catch (error) {
      logger.error(`Error creating index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Index Apple Health data from XML export
   */
  async indexAppleHealthData(xmlFilePath, userId = 'default_user') {
    try {
      logger.info(`Indexing Apple Health data from: ${xmlFilePath}`);

      // For demonstration, we'll create mock Apple Health data
      // In production, you would parse the actual XML file
      const mockHealthData = this.generateMockAppleHealthData(userId);

      let indexedCount = 0;
      const batchSize = 100;

      for (let i = 0; i < mockHealthData.length; i += batchSize) {
        const batch = mockHealthData.slice(i, i + batchSize);
        const bulkBody = [];

        for (const record of batch) {
          bulkBody.push({
            index: {
              _index: this.indices.apple_health,
              _id: `${userId}_${record.type}_${record.timestamp}`
            }
          });
          bulkBody.push(record);
        }

        await this.client.bulk({ body: bulkBody });
        indexedCount += batch.length;
        
        logger.info(`Indexed ${indexedCount}/${mockHealthData.length} Apple Health records`);
      }

      logger.info(`Successfully indexed ${indexedCount} Apple Health records`);
      return { status: 'success', indexed_count: indexedCount };

    } catch (error) {
      logger.error('Error indexing Apple Health data:', error);
      throw error;
    }
  }

  /**
   * Index processed health metrics
   */
  async indexHealthMetrics(metrics, userId = 'default_user') {
    try {
      logger.info(`Indexing ${metrics.length} health metrics for user ${userId}`);

      const bulkBody = [];
      
      for (const metric of metrics) {
        const document = {
          user_id: userId,
          type: metric.type,
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp || new Date().toISOString(),
          source: metric.source || 'manual_entry',
          metadata: metric.metadata || {},
          indexed_at: new Date().toISOString()
        };

        bulkBody.push({
          index: {
            _index: this.indices.health_metrics,
            _id: `${userId}_${metric.type}_${document.timestamp}`
          }
        });
        bulkBody.push(document);
      }

      const response = await this.client.bulk({ body: bulkBody });
      
      if (response.body.errors) {
        logger.warn('Some documents failed to index:', response.body.items.filter(item => item.index.error));
      }

      logger.info(`Successfully indexed ${metrics.length} health metrics`);
      return { status: 'success', indexed_count: metrics.length };

    } catch (error) {
      logger.error('Error indexing health metrics:', error);
      throw error;
    }
  }

  /**
   * Index health records (PDFs, documents)
   */
  async indexHealthRecord(recordData, userId = 'default_user') {
    try {
      logger.info(`Indexing health record: ${recordData.filename}`);

      const document = {
        user_id: userId,
        filename: recordData.filename,
        content_type: recordData.content_type,
        extracted_text: recordData.extracted_text,
        metadata: recordData.metadata || {},
        s3_location: recordData.s3_location,
        processed_at: new Date().toISOString(),
        tags: recordData.tags || [],
        category: recordData.category || 'general'
      };

      const response = await this.client.index({
        index: this.indices.health_records,
        id: `${userId}_${recordData.filename}_${Date.now()}`,
        body: document
      });

      logger.info(`Successfully indexed health record: ${recordData.filename}`);
      return { status: 'success', document_id: response.body._id };

    } catch (error) {
      logger.error('Error indexing health record:', error);
      throw error;
    }
  }

  /**
   * Index family health data with privacy controls
   */
  async indexFamilyHealthData(familyData, familyId) {
    try {
      logger.info(`Indexing family health data for family: ${familyId}`);

      const document = {
        family_id: familyId,
        members: familyData.members.map(member => ({
          member_id: member.id,
          relationship: member.relationship,
          age_group: member.age_group,
          health_summary: member.health_summary,
          privacy_level: member.privacy_level || 'summary_only'
        })),
        aggregated_metrics: familyData.aggregated_metrics,
        family_health_score: familyData.family_health_score,
        last_updated: new Date().toISOString(),
        privacy_settings: familyData.privacy_settings || {
          share_individual_data: false,
          share_aggregated_data: true,
          share_trends: true
        }
      };

      const response = await this.client.index({
        index: this.indices.family_health,
        id: `${familyId}_${Date.now()}`,
        body: document
      });

      logger.info(`Successfully indexed family health data for ${familyData.members.length} members`);
      return { status: 'success', document_id: response.body._id };

    } catch (error) {
      logger.error('Error indexing family health data:', error);
      throw error;
    }
  }

  /**
   * Bulk index health data from various sources
   */
  async bulkIndexHealthData(healthDataArray, userId = 'default_user') {
    try {
      logger.info(`Bulk indexing ${healthDataArray.length} health data items`);

      const bulkBody = [];
      
      for (const item of healthDataArray) {
        const indexName = this.getIndexForDataType(item.data_type);
        const document = this.prepareDocumentForIndexing(item, userId);

        bulkBody.push({
          index: {
            _index: indexName,
            _id: this.generateDocumentId(item, userId)
          }
        });
        bulkBody.push(document);
      }

      const response = await this.client.bulk({ body: bulkBody });
      
      const successCount = response.body.items.filter(item => !item.index.error).length;
      const errorCount = response.body.items.filter(item => item.index.error).length;

      if (errorCount > 0) {
        logger.warn(`${errorCount} documents failed to index`);
      }

      logger.info(`Successfully bulk indexed ${successCount}/${healthDataArray.length} health data items`);
      return { 
        status: 'success', 
        indexed_count: successCount, 
        error_count: errorCount 
      };

    } catch (error) {
      logger.error('Error bulk indexing health data:', error);
      throw error;
    }
  }

  /**
   * Search health data (used by MCP tools)
   */
  async searchHealthData(query, userId = 'default_user') {
    try {
      const searchQuery = {
        index: Object.values(this.indices).join(','),
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
                  multi_match: {
                    query: query,
                    fields: ['type', 'extracted_text', 'metadata.*', 'tags'],
                    fuzziness: 'AUTO'
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
          size: 100
        }
      };

      const response = await this.client.search(searchQuery);
      return response.body;

    } catch (error) {
      logger.error('Error searching health data:', error);
      throw error;
    }
  }

  /**
   * Delete user's health data (GDPR compliance)
   */
  async deleteUserHealthData(userId) {
    try {
      logger.info(`Deleting all health data for user: ${userId}`);

      const deleteQuery = {
        query: {
          term: {
            'user_id.keyword': userId
          }
        }
      };

      let deletedCount = 0;
      
      for (const indexName of Object.values(this.indices)) {
        const response = await this.client.deleteByQuery({
          index: indexName,
          body: deleteQuery
        });
        deletedCount += response.body.deleted || 0;
      }

      logger.info(`Successfully deleted ${deletedCount} documents for user ${userId}`);
      return { status: 'success', deleted_count: deletedCount };

    } catch (error) {
      logger.error('Error deleting user health data:', error);
      throw error;
    }
  }

  /**
   * Get index mappings for different data types
   */
  getIndexMappings() {
    return {
      health_metrics: {
        properties: {
          user_id: { type: 'keyword' },
          type: { type: 'keyword' },
          value: { type: 'double' },
          unit: { type: 'keyword' },
          timestamp: { type: 'date' },
          source: { type: 'keyword' },
          metadata: { type: 'object', enabled: false },
          indexed_at: { type: 'date' }
        }
      },
      apple_health: {
        properties: {
          user_id: { type: 'keyword' },
          type: { type: 'keyword' },
          value: { type: 'double' },
          unit: { type: 'keyword' },
          timestamp: { type: 'date' },
          source_name: { type: 'keyword' },
          source_version: { type: 'keyword' },
          device: { type: 'keyword' },
          creation_date: { type: 'date' },
          start_date: { type: 'date' },
          end_date: { type: 'date' }
        }
      },
      health_records: {
        properties: {
          user_id: { type: 'keyword' },
          filename: { type: 'keyword' },
          content_type: { type: 'keyword' },
          extracted_text: { type: 'text', analyzer: 'standard' },
          metadata: { type: 'object' },
          s3_location: { type: 'keyword' },
          processed_at: { type: 'date' },
          tags: { type: 'keyword' },
          category: { type: 'keyword' }
        }
      },
      family_health: {
        properties: {
          family_id: { type: 'keyword' },
          members: {
            type: 'nested',
            properties: {
              member_id: { type: 'keyword' },
              relationship: { type: 'keyword' },
              age_group: { type: 'keyword' },
              health_summary: { type: 'object' },
              privacy_level: { type: 'keyword' }
            }
          },
          aggregated_metrics: { type: 'object' },
          family_health_score: { type: 'integer' },
          last_updated: { type: 'date' },
          privacy_settings: { type: 'object' }
        }
      }
    };
  }

  /**
   * Generate mock Apple Health data for demonstration
   */
  generateMockAppleHealthData(userId) {
    const healthTypes = ['steps', 'heart_rate', 'sleep_hours', 'active_calories', 'distance_walking'];
    const mockData = [];
    
    // Generate 30 days of data
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      for (const type of healthTypes) {
        const record = {
          user_id: userId,
          type: type,
          value: this.generateMockValue(type),
          unit: this.getUnitForType(type),
          timestamp: date.toISOString(),
          source_name: 'iPhone',
          source_version: '17.0',
          device: 'iPhone 15 Pro',
          creation_date: date.toISOString(),
          start_date: date.toISOString(),
          end_date: date.toISOString()
        };
        mockData.push(record);
      }
    }
    
    return mockData;
  }

  generateMockValue(type) {
    const ranges = {
      steps: [3000, 15000],
      heart_rate: [60, 100],
      sleep_hours: [6, 9],
      active_calories: [200, 800],
      distance_walking: [2, 12]
    };
    
    const [min, max] = ranges[type] || [0, 100];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getUnitForType(type) {
    const units = {
      steps: 'count',
      heart_rate: 'bpm',
      sleep_hours: 'hours',
      active_calories: 'kcal',
      distance_walking: 'km'
    };
    
    return units[type] || 'unit';
  }

  getIndexForDataType(dataType) {
    const mapping = {
      'apple_health': this.indices.apple_health,
      'health_metric': this.indices.health_metrics,
      'health_record': this.indices.health_records,
      'family_health': this.indices.family_health
    };
    
    return mapping[dataType] || this.indices.health_metrics;
  }

  prepareDocumentForIndexing(item, userId) {
    return {
      user_id: userId,
      ...item,
      indexed_at: new Date().toISOString()
    };
  }

  generateDocumentId(item, userId) {
    return `${userId}_${item.data_type}_${item.timestamp || Date.now()}`;
  }

  /**
   * Health check for OpenSearch connection
   */
  async healthCheck() {
    try {
      const response = await this.client.cluster.health();
      const indicesInfo = await this.client.cat.indices({ format: 'json' });
      
      return {
        status: 'healthy',
        cluster_status: response.body.status,
        indices: indicesInfo.body.length,
        available_indices: Object.values(this.indices)
      };
    } catch (error) {
      return {
        status: 'unavailable',
        error: error.message
      };
    }
  }

  /**
   * Get indexing statistics
   */
  async getIndexingStats() {
    try {
      const stats = {};
      
      for (const [type, indexName] of Object.entries(this.indices)) {
        const response = await this.client.count({ index: indexName });
        stats[type] = {
          index_name: indexName,
          document_count: response.body.count
        };
      }
      
      return {
        status: 'success',
        indices: stats,
        total_documents: Object.values(stats).reduce((sum, stat) => sum + stat.document_count, 0)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = OpenSearchHealthIndexer;
