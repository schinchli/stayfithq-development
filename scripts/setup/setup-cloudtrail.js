#!/usr/bin/env node

/**
 * AWS CloudTrail Setup Script for StayFit Health Companion
 * Configures CloudTrail for comprehensive audit logging
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class CloudTrailSetup {
    constructor() {
        this.cloudtrail = new AWS.CloudTrail({
            region: process.env.AWS_REGION || 'your-aws-region'
        });
        
        this.s3 = new AWS.S3({
            region: process.env.AWS_REGION || 'your-aws-region'
        });
        
        this.cloudwatchLogs = new AWS.CloudWatchLogs({
            region: process.env.AWS_REGION || 'your-aws-region'
        });
        
        this.accountId = process.env.AWS_ACCOUNT_ID;
        this.region = process.env.AWS_REGION || 'your-aws-region';
        this.trailName = 'stayfit-health-companion-trail';
        this.bucketName = `stayfit-cloudtrail-logs-${this.accountId}-${this.region}`;
    }

    /**
     * Create S3 bucket for CloudTrail logs
     */
    async createS3Bucket() {
        console.log('🪣 Creating S3 bucket for CloudTrail logs...');

        try {
            // Check if bucket exists
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            console.log(`✅ S3 bucket already exists: ${this.bucketName}`);
        } catch (error) {
            if (error.code === 'NotFound') {
                // Create bucket
                const bucketParams = {
                    Bucket: this.bucketName,
                    CreateBucketConfiguration: {
                        LocationConstraint: this.region !== 'your-aws-region' ? this.region : undefined
                    }
                };

                await this.s3.createBucket(bucketParams).promise();
                console.log(`✅ Created S3 bucket: ${this.bucketName}`);

                // Set bucket policy for CloudTrail
                await this.setBucketPolicy();
            } else {
                throw error;
            }
        }
    }

    /**
     * Set S3 bucket policy for CloudTrail
     */
    async setBucketPolicy() {
        console.log('🔐 Setting S3 bucket policy for CloudTrail...');

        const bucketPolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AWSCloudTrailAclCheck',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudtrail.amazonaws.com'
                    },
                    Action: 's3:GetBucketAcl',
                    Resource: `arn:aws:s3:::${this.bucketName}`,
                    Condition: {
                        StringEquals: {
                            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.accountId}:trail/${this.trailName}`
                        }
                    }
                },
                {
                    Sid: 'AWSCloudTrailWrite',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudtrail.amazonaws.com'
                    },
                    Action: 's3:PutObject',
                    Resource: `arn:aws:s3:::${this.bucketName}/*`,
                    Condition: {
                        StringEquals: {
                            's3:x-amz-acl': 'bucket-owner-full-control',
                            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.accountId}:trail/${this.trailName}`
                        }
                    }
                }
            ]
        };

        await this.s3.putBucketPolicy({
            Bucket: this.bucketName,
            Policy: JSON.stringify(bucketPolicy)
        }).promise();

        console.log('✅ S3 bucket policy configured for CloudTrail');
    }

    /**
     * Create CloudWatch Log Group for CloudTrail
     */
    async createLogGroup() {
        console.log('📝 Creating CloudWatch Log Group for CloudTrail...');

        const logGroupName = '/aws/cloudtrail/stayfit-health-companion';

        try {
            await this.cloudwatchLogs.createLogGroup({
                logGroupName: logGroupName,
                retentionInDays: 90
            }).promise();
            
            console.log(`✅ Created CloudWatch Log Group: ${logGroupName}`);
        } catch (error) {
            if (error.code === 'ResourceAlreadyExistsException') {
                console.log(`✅ CloudWatch Log Group already exists: ${logGroupName}`);
            } else {
                throw error;
            }
        }

        return logGroupName;
    }

    /**
     * Create IAM role for CloudTrail CloudWatch Logs
     */
    async createCloudTrailRole() {
        console.log('👤 Creating IAM role for CloudTrail CloudWatch Logs...');

        const iam = new AWS.IAM({ region: this.region });
        const roleName = 'StayFit-CloudTrail-CloudWatchLogs-Role';

        const trustPolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudtrail.amazonaws.com'
                    },
                    Action: 'sts:AssumeRole'
                }
            ]
        };

        const rolePolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:PutLogEvents',
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream'
                    ],
                    Resource: `arn:aws:logs:${this.region}:${this.accountId}:log-group:/aws/cloudtrail/stayfit-health-companion:*`
                }
            ]
        };

        try {
            // Create role
            const roleResult = await iam.createRole({
                RoleName: roleName,
                AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
                Description: 'Role for CloudTrail to write logs to CloudWatch'
            }).promise();

            // Attach inline policy
            await iam.putRolePolicy({
                RoleName: roleName,
                PolicyName: 'CloudTrailLogsPolicy',
                PolicyDocument: JSON.stringify(rolePolicy)
            }).promise();

            console.log(`✅ Created IAM role: ${roleName}`);
            return roleResult.Role.Arn;

        } catch (error) {
            if (error.code === 'EntityAlreadyExistsException') {
                const roleResult = await iam.getRole({ RoleName: roleName }).promise();
                console.log(`✅ IAM role already exists: ${roleName}`);
                return roleResult.Role.Arn;
            } else {
                throw error;
            }
        }
    }

    /**
     * Create CloudTrail
     */
    async createCloudTrail() {
        console.log('🛤️  Creating CloudTrail...');

        const logGroupName = await this.createLogGroup();
        const roleArn = await this.createCloudTrailRole();

        const trailParams = {
            Name: this.trailName,
            S3BucketName: this.bucketName,
            S3KeyPrefix: 'stayfit-health-companion-logs',
            IncludeGlobalServiceEvents: true,
            IsMultiRegionTrail: true,
            EnableLogFileValidation: true,
            CloudWatchLogsLogGroupArn: `arn:aws:logs:${this.region}:${this.accountId}:log-group:${logGroupName}:*`,
            CloudWatchLogsRoleArn: roleArn,
            EventSelectors: [
                {
                    ReadWriteType: 'All',
                    IncludeManagementEvents: true,
                    DataResources: [
                        {
                            Type: 'AWS::S3::Object',
                            Values: ['arn:aws:s3:::stayfit-healthhq-web-prod/*']
                        },
                        {
                            Type: 'AWS::S3::Bucket',
                            Values: ['arn:aws:s3:::stayfit-healthhq-web-prod']
                        }
                    ]
                }
            ],
            InsightSelectors: [
                {
                    InsightType: 'ApiCallRateInsight'
                }
            ]
        };

        try {
            await this.cloudtrail.createTrail(trailParams).promise();
            console.log(`✅ Created CloudTrail: ${this.trailName}`);

            // Start logging
            await this.cloudtrail.startLogging({
                Name: this.trailName
            }).promise();
            
            console.log(`✅ Started logging for CloudTrail: ${this.trailName}`);

        } catch (error) {
            if (error.code === 'TrailAlreadyExistsException') {
                console.log(`✅ CloudTrail already exists: ${this.trailName}`);
                
                // Update trail configuration
                await this.cloudtrail.updateTrail(trailParams).promise();
                console.log(`✅ Updated CloudTrail configuration: ${this.trailName}`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Create CloudWatch alarms for CloudTrail
     */
    async createCloudWatchAlarms() {
        console.log('🚨 Creating CloudWatch alarms for CloudTrail...');

        const cloudwatch = new AWS.CloudWatch({ region: this.region });
        const logGroupName = '/aws/cloudtrail/stayfit-health-companion';

        const alarms = [
            {
                AlarmName: 'StayFit-Unauthorized-API-Calls',
                AlarmDescription: 'Alarm for unauthorized API calls',
                MetricName: 'UnauthorizedAPICalls',
                FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }',
                Threshold: 1
            },
            {
                AlarmName: 'StayFit-Root-Usage',
                AlarmDescription: 'Alarm for root account usage',
                MetricName: 'RootUsage',
                FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }',
                Threshold: 1
            },
            {
                AlarmName: 'StayFit-IAM-Changes',
                AlarmDescription: 'Alarm for IAM policy changes',
                MetricName: 'IAMChanges',
                FilterPattern: '{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreateRole) || ($.eventName = DeleteRole) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) }',
                Threshold: 1
            }
        ];

        for (const alarm of alarms) {
            try {
                // Create metric filter
                await this.cloudwatchLogs.putMetricFilter({
                    logGroupName: logGroupName,
                    filterName: alarm.MetricName,
                    filterPattern: alarm.FilterPattern,
                    metricTransformations: [
                        {
                            metricName: alarm.MetricName,
                            metricNamespace: 'StayFit/Security',
                            metricValue: '1'
                        }
                    ]
                }).promise();

                // Create alarm
                await cloudwatch.putMetricAlarm({
                    AlarmName: alarm.AlarmName,
                    AlarmDescription: alarm.AlarmDescription,
                    MetricName: alarm.MetricName,
                    Namespace: 'StayFit/Security',
                    Statistic: 'Sum',
                    Period: 300,
                    EvaluationPeriods: 1,
                    Threshold: alarm.Threshold,
                    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
                    TreatMissingData: 'notBreaching'
                }).promise();

                console.log(`✅ Created alarm: ${alarm.AlarmName}`);

            } catch (error) {
                if (error.code === 'ResourceAlreadyExistsException') {
                    console.log(`✅ Alarm already exists: ${alarm.AlarmName}`);
                } else {
                    console.error(`❌ Error creating alarm ${alarm.AlarmName}:`, error.message);
                }
            }
        }
    }

    /**
     * Create configuration files
     */
    async createConfigFiles() {
        console.log('📄 Creating CloudTrail configuration files...');

        const config = {
            trailName: this.trailName,
            s3Bucket: this.bucketName,
            logGroup: '/aws/cloudtrail/stayfit-health-companion',
            region: this.region,
            accountId: this.accountId,
            features: {
                dataEvents: true,
                insightEvents: true,
                managementEvents: true,
                logFileValidation: true,
                multiRegion: true
            },
            monitoring: {
                cloudwatchLogs: true,
                alarms: true,
                insights: true
            }
        };

        const configPath = path.join(__dirname, '..', 'config', 'cloudtrail-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log(`✅ CloudTrail configuration saved to: ${configPath}`);
    }

    /**
     * Run complete CloudTrail setup
     */
    async setup() {
        console.log('🚀 Starting CloudTrail setup for StayFit Health Companion...');

        try {
            await this.createS3Bucket();
            await this.createCloudTrail();
            await this.createCloudWatchAlarms();
            await this.createConfigFiles();
            
            console.log('\n✅ CloudTrail setup completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Verify CloudTrail is logging events in AWS Console');
            console.log('2. Set up SNS notifications for CloudWatch alarms');
            console.log('3. Configure log analysis tools (e.g., AWS Config, Security Hub)');
            console.log('4. Review and customize alarm thresholds as needed');
            console.log(`5. Monitor S3 bucket: ${this.bucketName}`);
            console.log(`6. Monitor CloudWatch Log Group: /aws/cloudtrail/stayfit-health-companion`);
            
        } catch (error) {
            console.error('❌ CloudTrail setup failed:', error.message);
            process.exit(1);
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new CloudTrailSetup();
    setup.setup().catch(console.error);
}

module.exports = CloudTrailSetup;
