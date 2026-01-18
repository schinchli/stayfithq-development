#!/usr/bin/env node

/**
 * AWS X-Ray Setup Script for StayFit Health Companion
 * Configures X-Ray service and sampling rules
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class XRaySetup {
    constructor() {
        this.xray = new AWS.XRay({
            region: process.env.AWS_REGION || 'your-aws-region'
        });
        
        this.serviceName = 'stayfit-health-companion';
    }

    /**
     * Create X-Ray sampling rules
     */
    async createSamplingRules() {
        console.log('🔍 Creating X-Ray sampling rules...');

        const samplingRules = [
            {
                ruleName: 'StayFit-HealthAPI-HighPriority',
                priority: 9000,
                fixedRate: 0.1,
                reservoirSize: 1,
                serviceName: this.serviceName,
                serviceType: '*',
                host: '*',
                method: '*',
                URLPath: '/api/health/*',
                version: 1
            },
            {
                ruleName: 'StayFit-AI-Interactions',
                priority: 9001,
                fixedRate: 0.2,
                reservoirSize: 2,
                serviceName: this.serviceName,
                serviceType: '*',
                host: '*',
                method: 'POST',
                URLPath: '/api/ai/*',
                version: 1
            },
            {
                ruleName: 'StayFit-Dashboard-Pages',
                priority: 9002,
                fixedRate: 0.05,
                reservoirSize: 1,
                serviceName: this.serviceName,
                serviceType: '*',
                host: '*',
                method: 'GET',
                URLPath: '/*.html',
                version: 1
            },
            {
                ruleName: 'StayFit-Default-Sampling',
                priority: 10000,
                fixedRate: 0.01,
                reservoirSize: 1,
                serviceName: this.serviceName,
                serviceType: '*',
                host: '*',
                method: '*',
                URLPath: '*',
                version: 1
            }
        ];

        for (const rule of samplingRules) {
            try {
                await this.xray.createSamplingRule({
                    SamplingRule: rule
                }).promise();
                
                console.log(`✅ Created sampling rule: ${rule.ruleName}`);
            } catch (error) {
                if (error.code === 'RuleAlreadyExistsException') {
                    console.log(`⚠️  Sampling rule already exists: ${rule.ruleName}`);
                } else {
                    console.error(`❌ Error creating sampling rule ${rule.ruleName}:`, error.message);
                }
            }
        }
    }

    /**
     * Create X-Ray service map
     */
    async createServiceMap() {
        console.log('🗺️  Setting up X-Ray service map...');

        // Service map is automatically created by X-Ray based on traces
        // We'll create a configuration file for reference
        const serviceMapConfig = {
            serviceName: this.serviceName,
            serviceType: 'AWS::EC2::Instance',
            components: [
                {
                    name: 'Health Dashboard',
                    type: 'client',
                    endpoints: ['/index.html', '/health-reports.html', '/digital-analysis.html']
                },
                {
                    name: 'AI Assistant',
                    type: 'service',
                    endpoints: ['/api/ai/chat', '/api/ai/analyze']
                },
                {
                    name: 'Health Data API',
                    type: 'service',
                    endpoints: ['/api/health/dashboard', '/api/health/reports']
                },
                {
                    name: 'AWS Services',
                    type: 'downstream',
                    services: ['S3', 'DynamoDB', 'Bedrock', 'OpenSearch']
                }
            ]
        };

        const configPath = path.join(__dirname, '..', 'config', 'xray-service-map.json');
        fs.writeFileSync(configPath, JSON.stringify(serviceMapConfig, null, 2));
        
        console.log(`✅ Service map configuration saved to: ${configPath}`);
    }

    /**
     * Create X-Ray encryption configuration
     */
    async setupEncryption() {
        console.log('🔐 Setting up X-Ray encryption...');

        try {
            await this.xray.putEncryptionConfig({
                Type: 'KMS',
                KeyId: 'alias/aws/xray'
            }).promise();
            
            console.log('✅ X-Ray encryption configured with AWS managed KMS key');
        } catch (error) {
            console.error('❌ Error setting up X-Ray encryption:', error.message);
        }
    }

    /**
     * Create X-Ray insights configuration
     */
    async setupInsights() {
        console.log('💡 Setting up X-Ray insights...');

        const insightsConfig = {
            InsightsEnabled: true,
            NotificationsEnabled: true
        };

        try {
            // Note: X-Ray Insights API might not be available in all regions
            // This is a placeholder for when the API becomes available
            console.log('✅ X-Ray insights configuration prepared');
            
            // Save configuration for manual setup
            const configPath = path.join(__dirname, '..', 'config', 'xray-insights.json');
            fs.writeFileSync(configPath, JSON.stringify(insightsConfig, null, 2));
            
        } catch (error) {
            console.log('⚠️  X-Ray insights setup requires manual configuration in AWS Console');
        }
    }

    /**
     * Create X-Ray dashboard configuration
     */
    async createDashboard() {
        console.log('📊 Creating X-Ray dashboard configuration...');

        const dashboardConfig = {
            name: 'StayFit-Health-Companion-XRay',
            filters: [
                {
                    name: 'Health API Performance',
                    expression: 'service("stayfit-health-companion") AND http.url CONTAINS "/api/health"'
                },
                {
                    name: 'AI Interactions',
                    expression: 'service("stayfit-health-companion") AND http.url CONTAINS "/api/ai"'
                },
                {
                    name: 'Error Analysis',
                    expression: 'service("stayfit-health-companion") AND error = true'
                },
                {
                    name: 'High Latency Requests',
                    expression: 'service("stayfit-health-companion") AND responsetime > 5'
                }
            ],
            widgets: [
                {
                    type: 'service-map',
                    title: 'Service Map',
                    timeRange: '1h'
                },
                {
                    type: 'response-time',
                    title: 'Response Time Distribution',
                    timeRange: '1h'
                },
                {
                    type: 'error-rate',
                    title: 'Error Rate',
                    timeRange: '1h'
                },
                {
                    type: 'throughput',
                    title: 'Request Throughput',
                    timeRange: '1h'
                }
            ]
        };

        const configPath = path.join(__dirname, '..', 'config', 'xray-dashboard.json');
        fs.writeFileSync(configPath, JSON.stringify(dashboardConfig, null, 2));
        
        console.log(`✅ X-Ray dashboard configuration saved to: ${configPath}`);
    }

    /**
     * Run complete X-Ray setup
     */
    async setup() {
        console.log('🚀 Starting X-Ray setup for StayFit Health Companion...');

        try {
            await this.createSamplingRules();
            await this.createServiceMap();
            await this.setupEncryption();
            await this.setupInsights();
            await this.createDashboard();
            
            console.log('\n✅ X-Ray setup completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Deploy your application with X-Ray middleware enabled');
            console.log('2. Visit AWS X-Ray console to view traces and service map');
            console.log('3. Set up CloudWatch alarms for X-Ray metrics');
            console.log('4. Configure X-Ray insights in AWS Console (if available in your region)');
            
        } catch (error) {
            console.error('❌ X-Ray setup failed:', error.message);
            process.exit(1);
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new XRaySetup();
    setup.setup().catch(console.error);
}

module.exports = XRaySetup;
