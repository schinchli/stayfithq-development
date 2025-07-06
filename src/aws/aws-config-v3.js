/**
 * AWS SDK v3 Configuration
 * Centralized AWS client configuration using the modern AWS SDK v3
 */

const { fromEnv, fromIni, fromInstanceMetadata } = require('@aws-sdk/credential-providers');
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

class AWSConfigV3 {
  constructor() {
    this.region = process.env.AWS_REGION || 'your-aws-region';
    this.credentials = this.getCredentials();
    this.commonConfig = {
      region: this.region,
      credentials: this.credentials,
      maxAttempts: 3,
      retryMode: 'adaptive'
    };
  }

  /**
   * Get AWS credentials using the credential provider chain
   */
  getCredentials() {
    try {
      // Try environment variables first, then AWS config files, then instance metadata
      return fromEnv() || fromIni() || fromInstanceMetadata();
    } catch (error) {
      logger.warn('Could not load AWS credentials from standard providers:', error.message);
      
      // Fallback to manual configuration if available
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN
        };
      }
      
      throw new Error('No AWS credentials found. Please configure AWS credentials.');
    }
  }

  /**
   * Get common AWS client configuration
   */
  getCommonConfig() {
    return { ...this.commonConfig };
  }

  /**
   * Get configuration for specific AWS service
   */
  getServiceConfig(serviceName, additionalConfig = {}) {
    const baseConfig = this.getCommonConfig();
    
    // Service-specific configurations
    const serviceConfigs = {
      s3: {
        ...baseConfig,
        forcePathStyle: false,
        useAccelerateEndpoint: true,
        ...additionalConfig
      },
      textract: {
        ...baseConfig,
        ...additionalConfig
      },
      bedrock: {
        ...baseConfig,
        region: process.env.BEDROCK_REGION || this.region,
        ...additionalConfig
      },
      opensearch: {
        ...baseConfig,
        ...additionalConfig
      },
      lambda: {
        ...baseConfig,
        ...additionalConfig
      },
      cloudformation: {
        ...baseConfig,
        ...additionalConfig
      },
      elasticache: {
        ...baseConfig,
        ...additionalConfig
      },
      ec2: {
        ...baseConfig,
        ...additionalConfig
      },
      cognito: {
        ...baseConfig,
        ...additionalConfig
      }
    };

    return serviceConfigs[serviceName] || { ...baseConfig, ...additionalConfig };
  }

  /**
   * Validate AWS configuration
   */
  async validateConfiguration() {
    try {
      // Import STS client to test credentials
      const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
      
      const stsClient = new STSClient(this.getCommonConfig());
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);
      
      logger.info('AWS configuration validated successfully', {
        account: response.Account,
        arn: response.Arn,
        region: this.region
      });
      
      return {
        valid: true,
        account: response.Account,
        arn: response.Arn,
        region: this.region
      };
      
    } catch (error) {
      logger.error('AWS configuration validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get AWS account information
   */
  async getAccountInfo() {
    try {
      const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
      
      const stsClient = new STSClient(this.getCommonConfig());
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);
      
      return {
        accountId: response.Account,
        arn: response.Arn,
        userId: response.UserId,
        region: this.region
      };
      
    } catch (error) {
      logger.error('Failed to get AWS account info:', error);
      throw error;
    }
  }

  /**
   * Check if running in AWS environment
   */
  isRunningInAWS() {
    return !!(
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.ECS_CONTAINER_METADATA_URI ||
      process.env.AWS_BATCH_JOB_ID
    );
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isAWS = this.isRunningInAWS();
    
    return {
      environment: process.env.NODE_ENV || 'development',
      isProduction,
      isAWS,
      region: this.region,
      enableLogging: !isProduction || process.env.ENABLE_AWS_LOGGING === 'true',
      enableMetrics: isProduction || process.env.ENABLE_AWS_METRICS === 'true'
    };
  }
}

// Export singleton instance
const awsConfig = new AWSConfigV3();

module.exports = {
  AWSConfigV3,
  awsConfig
};
