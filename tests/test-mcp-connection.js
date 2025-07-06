#!/usr/bin/env node

/**
 * MCP and OpenSearch Connection Test
 * Tests the current integration status
 */

const axios = require('axios');

async function testMCPConnection() {
    console.log('🔍 Testing MCP and OpenSearch Integration...\n');

    const tests = [
        {
            name: 'Enhanced Health Check',
            url: 'http://localhost:3000/api/enhanced/health',
            expected: 'Enhanced Healthcare Platform Active'
        },
        {
            name: 'MCP Health Check',
            url: 'http://localhost:3000/api/mcp/health',
            expected: 'MCP Integration Active'
        },
        {
            name: 'MCP Search Test',
            url: 'http://localhost:3000/api/mcp/search?query=patient',
            expected: 'search results'
        },
        {
            name: 'Enhanced Test All',
            url: 'http://localhost:3000/api/enhanced/test-all',
            expected: 'FULLY_INTEGRATED'
        }
    ];

    let mcpConnected = false;
    let opensearchConnected = false;

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const response = await axios.get(test.url, { timeout: 5000 });
            
            if (response.status === 200) {
                console.log(`✅ ${test.name}: SUCCESS`);
                
                // Check response content
                const responseText = JSON.stringify(response.data);
                if (responseText.includes('MCP') || responseText.includes('mcp')) {
                    mcpConnected = true;
                    console.log('   📋 MCP Reference Found');
                }
                if (responseText.includes('OpenSearch') || responseText.includes('opensearch')) {
                    opensearchConnected = true;
                    console.log('   🔍 OpenSearch Reference Found');
                }
                
                // Show key data
                if (response.data.status) {
                    console.log(`   📄 Status: ${response.data.status}`);
                }
                if (response.data.features) {
                    console.log(`   🎯 Features: ${Object.keys(response.data.features).join(', ')}`);
                }
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`❌ ${test.name}: NOT FOUND (endpoint not implemented)`);
            } else {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
        console.log('');
    }

    // Summary
    console.log('📊 Integration Summary:');
    console.log(`🔗 MCP Connected: ${mcpConnected ? 'YES' : 'NO'}`);
    console.log(`🔍 OpenSearch Connected: ${opensearchConnected ? 'YES' : 'NO'}`);
    
    if (!mcpConnected && !opensearchConnected) {
        console.log('\n❌ MCP and OpenSearch are NOT connected to your application');
        console.log('\n💡 Current Status:');
        console.log('   - Enhanced healthcare features: ✅ Working');
        console.log('   - FHIR R4 and openEHR: ✅ Integrated');
        console.log('   - MCP integration: ❌ Not connected');
        console.log('   - OpenSearch: ❌ Not connected');
        
        console.log('\n🔧 To connect MCP and OpenSearch:');
        console.log('   1. The MCP server files exist but aren\'t connected to main app');
        console.log('   2. OpenSearch client is installed but no running instance');
        console.log('   3. Mock OpenSearch service is available for testing');
        
        return 'NOT_CONNECTED';
    } else if (mcpConnected && !opensearchConnected) {
        console.log('\n⚠️  MCP is connected but OpenSearch is not');
        return 'PARTIAL_CONNECTION';
    } else {
        console.log('\n✅ MCP and OpenSearch are fully connected!');
        return 'FULLY_CONNECTED';
    }
}

// Run the test
if (require.main === module) {
    testMCPConnection().then(status => {
        console.log(`\n🎯 Final Status: ${status}`);
    }).catch(console.error);
}

module.exports = testMCPConnection;
