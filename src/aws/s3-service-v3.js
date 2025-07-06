/**
 * S3 Service using AWS SDK v3
 * Handles health document storage and retrieval
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { awsConfig } = require('./aws-config-v3');
const winston = require('winston');
const fs = require('fs');
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

class S3ServiceV3 {
  constructor() {
    this.client = new S3Client(awsConfig.getServiceConfig('s3'));
    this.bucketName = process.env.HEALTH_DOCUMENTS_BUCKET || 'stayfit-health-docs';
    this.defaultExpiration = 3600; // 1 hour for signed URLs
  }

  /**
   * Upload health document to S3
   */
  async uploadHealthDocument(file, userId, metadata = {}) {
    try {
      const key = this.generateDocumentKey(userId, file.originalname || file.name);
      
      logger.info(`Uploading health document to S3: ${key}`);

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer || fs.createReadStream(file.path),
        ContentType: file.mimetype || 'application/octet-stream',
        Metadata: {
          userId: userId,
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname || file.name,
          ...metadata
        },
        ServerSideEncryption: 'AES256',
        StorageClass: 'STANDARD_IA' // Infrequent Access for cost optimization
      };

      // Use multipart upload for large files
      if (file.size > 5 * 1024 * 1024) { // 5MB threshold
        const upload = new Upload({
          client: this.client,
          params: uploadParams,
          partSize: 5 * 1024 * 1024, // 5MB parts
          queueSize: 4 // 4 concurrent uploads
        });

        upload.on('httpUploadProgress', (progress) => {
          logger.info(`Upload progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        });

        const result = await upload.done();
        
        logger.info(`Health document uploaded successfully: ${key}`);
        return {
          success: true,
          key: key,
          location: result.Location,
          etag: result.ETag,
          size: file.size
        };
      } else {
        // Simple upload for smaller files
        const command = new PutObjectCommand(uploadParams);
        const result = await this.client.send(command);
        
        logger.info(`Health document uploaded successfully: ${key}`);
        return {
          success: true,
          key: key,
          location: `https://${this.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`,
          etag: result.ETag,
          size: file.size
        };
      }

    } catch (error) {
      logger.error('Error uploading health document to S3:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Download health document from S3
   */
  async downloadHealthDocument(key, userId) {
    try {
      // Verify user has access to this document
      if (!key.includes(userId)) {
        throw new Error('Access denied: Document does not belong to user');
      }

      logger.info(`Downloading health document from S3: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      logger.info(`Health document downloaded successfully: ${key}`);
      return {
        success: true,
        buffer: buffer,
        contentType: response.ContentType,
        metadata: response.Metadata,
        lastModified: response.LastModified,
        size: response.ContentLength
      };

    } catch (error) {
      logger.error('Error downloading health document from S3:', error);
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for secure document access
   */
  async generatePresignedUrl(key, userId, operation = 'getObject', expiresIn = 3600) {
    try {
      // Verify user has access to this document
      if (!key.includes(userId)) {
        throw new Error('Access denied: Document does not belong to user');
      }

      logger.info(`Generating presigned URL for: ${key}`);

      let command;
      switch (operation) {
        case 'getObject':
          command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
          });
          break;
        case 'putObject':
          command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key
          });
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      
      logger.info(`Presigned URL generated successfully for: ${key}`);
      return {
        success: true,
        url: signedUrl,
        expiresIn: expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      };

    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error(`Presigned URL generation failed: ${error.message}`);
    }
  }

  /**
   * List user's health documents
   */
  async listUserDocuments(userId, prefix = '', maxKeys = 100) {
    try {
      const userPrefix = `users/${userId}/${prefix}`;
      
      logger.info(`Listing health documents for user: ${userId}`);

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: userPrefix,
        MaxKeys: maxKeys
      });

      const response = await this.client.send(command);
      
      const documents = (response.Contents || []).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
        storageClass: obj.StorageClass,
        filename: path.basename(obj.Key)
      }));

      logger.info(`Found ${documents.length} health documents for user: ${userId}`);
      return {
        success: true,
        documents: documents,
        count: documents.length,
        isTruncated: response.IsTruncated,
        nextContinuationToken: response.NextContinuationToken
      };

    } catch (error) {
      logger.error('Error listing user documents:', error);
      throw new Error(`S3 list operation failed: ${error.message}`);
    }
  }

  /**
   * Delete health document
   */
  async deleteHealthDocument(key, userId) {
    try {
      // Verify user has access to this document
      if (!key.includes(userId)) {
        throw new Error('Access denied: Document does not belong to user');
      }

      logger.info(`Deleting health document from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.client.send(command);
      
      logger.info(`Health document deleted successfully: ${key}`);
      return {
        success: true,
        key: key,
        deletedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error deleting health document from S3:', error);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(key, userId) {
    try {
      // Verify user has access to this document
      if (!key.includes(userId)) {
        throw new Error('Access denied: Document does not belong to user');
      }

      logger.info(`Getting metadata for health document: ${key}`);

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      
      return {
        success: true,
        key: key,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
        storageClass: response.StorageClass,
        serverSideEncryption: response.ServerSideEncryption
      };

    } catch (error) {
      logger.error('Error getting document metadata:', error);
      throw new Error(`S3 metadata retrieval failed: ${error.message}`);
    }
  }

  /**
   * Copy document (for backup or organization)
   */
  async copyDocument(sourceKey, destinationKey, userId) {
    try {
      // Verify user has access to source document
      if (!sourceKey.includes(userId) || !destinationKey.includes(userId)) {
        throw new Error('Access denied: Invalid document access');
      }

      logger.info(`Copying health document: ${sourceKey} -> ${destinationKey}`);

      const { CopyObjectCommand } = require('@aws-sdk/client-s3');
      
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
        MetadataDirective: 'COPY'
      });

      const response = await this.client.send(command);
      
      logger.info(`Health document copied successfully: ${destinationKey}`);
      return {
        success: true,
        sourceKey: sourceKey,
        destinationKey: destinationKey,
        etag: response.ETag,
        copiedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error copying health document:', error);
      throw new Error(`S3 copy failed: ${error.message}`);
    }
  }

  /**
   * Batch upload multiple documents
   */
  async batchUploadDocuments(files, userId, metadata = {}) {
    try {
      logger.info(`Batch uploading ${files.length} health documents for user: ${userId}`);

      const uploadPromises = files.map(file => 
        this.uploadHealthDocument(file, userId, metadata)
      );

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

      logger.info(`Batch upload completed: ${successful.length} successful, ${failed.length} failed`);
      
      return {
        success: failed.length === 0,
        successful: successful,
        failed: failed,
        totalCount: files.length,
        successCount: successful.length,
        failureCount: failed.length
      };

    } catch (error) {
      logger.error('Error in batch upload:', error);
      throw new Error(`Batch upload failed: ${error.message}`);
    }
  }

  /**
   * Generate document key with proper structure
   */
  generateDocumentKey(userId, filename) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/documents/${timestamp}/${Date.now()}_${sanitizedFilename}`;
  }

  /**
   * Health check for S3 service
   */
  async healthCheck() {
    try {
      // Try to list objects in the bucket (with limit 1)
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1
      });

      await this.client.send(command);
      
      return {
        status: 'healthy',
        service: 'S3',
        bucket: this.bucketName,
        region: awsConfig.region,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'S3',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get storage statistics for user
   */
  async getUserStorageStats(userId) {
    try {
      const userPrefix = `users/${userId}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: userPrefix
      });

      const response = await this.client.send(command);
      
      const objects = response.Contents || [];
      const totalSize = objects.reduce((sum, obj) => sum + obj.Size, 0);
      const totalCount = objects.length;

      // Group by file type
      const fileTypes = {};
      objects.forEach(obj => {
        const ext = path.extname(obj.Key).toLowerCase();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      });

      return {
        success: true,
        userId: userId,
        totalDocuments: totalCount,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        fileTypes: fileTypes,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting user storage stats:', error);
      throw new Error(`Storage stats retrieval failed: ${error.message}`);
    }
  }
}

module.exports = S3ServiceV3;
