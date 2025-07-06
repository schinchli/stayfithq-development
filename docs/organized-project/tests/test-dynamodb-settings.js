#!/usr/bin/env node

/**
 * Test DynamoDB Settings Storage
 * Tests the ability to save and retrieve user settings from DynamoDB
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const SETTINGS_TABLE = 'StayFitUserSettings';

async function testDynamoDBSettings() {
    console.log('🧪 Testing DynamoDB Settings Storage...\n');
    
    const testUserId = 'test_user_' + Date.now();
    const testSettings = {
        userId: testUserId,
        timestamp: new Date().toISOString(),
        opensearch: {
            endpoint: 'https://test-endpoint.us-east-1.es.amazonaws.com',
            index: 'test-health-data',
            username = "your_username",
            password = "your_secure_password"},
        perplexity: {
            apiKey: 'test-api-key',
            model: 'llama-3.1-sonar-small-128k-online',
            temperature: '0.2',
            maxTokens: '1000'
        },
        bedrock: {
            region: 'us-east-1',
            model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            temperature: '0.1',
            maxTokens: '4000'
        },
        bedrockHealth: {
            region: 'us-east-1',
            model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            temperature: '0.1',
            maxTokens: '4096',
            systemPrompt: 'You are a health analysis assistant.'
        },
        mcp: {
            serverUrl: 'localhost:8080',
            enabled: true
        },
        features: {
            trendAnalysis: true,
            riskAssessment: true,
            personalizedInsights: false
        }
    };
    
    try {
        // Test 1: Save settings
        console.log('📝 Test 1: Saving settings to DynamoDB...');
        const putParams = {
            TableName: SETTINGS_TABLE,
            Item: testSettings
        };
        
        await dynamodb.put(putParams).promise();
        console.log('✅ Settings saved successfully');
        
        // Test 2: Retrieve settings
        console.log('\n📖 Test 2: Retrieving settings from DynamoDB...');
        const getParams = {
            TableName: SETTINGS_TABLE,
            Key: {
                userId: testUserId
            }
        };
        
        const result = await dynamodb.get(getParams).promise();
        
        if (result.Item) {
            console.log('✅ Settings retrieved successfully');
            console.log('📊 Retrieved settings:', JSON.stringify(result.Item, null, 2));
            
            // Verify data integrity
            if (result.Item.opensearch.endpoint === testSettings.opensearch.endpoint &&
                result.Item.perplexity.apiKey === testSettings.perplexity.apiKey &&
                result.Item.bedrock.model === testSettings.bedrock.model) {
                console.log('✅ Data integrity verified');
            } else {
                console.log('❌ Data integrity check failed');
            }
        } else {
            console.log('❌ No settings found');
        }
        
        // Test 3: Update settings
        console.log('\n🔄 Test 3: Updating settings...');
        testSettings.timestamp = new Date().toISOString();
        testSettings.opensearch.endpoint = 'https://updated-endpoint.us-east-1.es.amazonaws.com';
        
        await dynamodb.put(putParams).promise();
        console.log('✅ Settings updated successfully');
        
        // Test 4: Clean up
        console.log('\n🧹 Test 4: Cleaning up test data...');
        const deleteParams = {
            TableName: SETTINGS_TABLE,
            Key: {
                userId: testUserId
            }
        };
        
        await dynamodb.delete(deleteParams).promise();
        console.log('✅ Test data cleaned up');
        
        console.log('\n🎉 All DynamoDB settings tests passed!');
        
    } catch (error) {
        console.error('❌ DynamoDB settings test failed:', error);
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    testDynamoDBSettings().catch(console.error);
}

module.exports = { testDynamoDBSettings };
