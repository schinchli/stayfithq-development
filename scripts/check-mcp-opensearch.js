#!/usr/bin/env node

/**
 * MCP and OpenSearch Integration Checker
 * Verifies connection between enhanced healthcare platform, MCP, and OpenSearch
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class MCPOpenSearchChecker {
    constructor() {
        this.results = {
            mcpServer: {},
            opensearchConnection: {},
            integration: {},
            tools: {},
            overall: 'UNKNOWN'
        };
    }

    async checkMCPServerFiles() {
        console.log('🔍 Checking MCP Server Files...\n');
        
        const mcpFiles = {
            'Original MCP Server': 'src/mcp-server/index.js',
            'Enhanced MCP Server': 'src/mcp-server/enhanced-mcp-server.js',
            'MCP SDK Mock': 'src/mcp-server/lib/mcp-sdk-mock.js'
        };

        Object.entries(mcpFiles).forEach(([name, file]) => {
            const exists = fs.existsSync(path.join(__dirname, file));
            this.results.mcpServer[name] = exists;
            console.log(`${exists ? '✅' : '❌'} ${name}: ${file}`);
        });

        // Check if enhanced MCP server has OpenSearch integration
        if (fs.existsSync(path.join(__dirname, 'src/mcp-server/enhanced-mcp-server.js'))) {
            const content = fs.readFileSync(path.join(__dirname, 'src/mcp-server/enhanced-mcp-server.js'), 'utf8');
            const hasOpenSearch = content.includes('@opensearch-project/opensearch');
            console.log(`${hasOpenSearch ? '✅' : '❌'} OpenSearch Integration in Enhanced MCP`);
            this.results.mcpServer['OpenSearch Integration'] = hasOpenSearch;
        }
    }

    async checkOpenSearchConnection() {
        console.log('\n🔍 Checking OpenSearch Connection...\n');
        
        const opensearchEndpoints = [
            'http://localhost:9200',
            'https://localhost:9200',
            process.env.OPENSEARCH_ENDPOINT
        ].filter(Boolean);

        for (const endpoint of opensearchEndpoints) {
            try {
                console.log(`Testing OpenSearch at: ${endpoint}`);
                const response = await axios.get(`${endpoint}/_cluster/health`, {
                    timeout: 5000,
                    auth: {
                        username = "your_username".env.OPENSEARCH_USERNAME || 'admin',
                        password = "your_secure_password"|| 'admin'
                    },
                    httpsAgent: new (require('https').Agent)({
                        rejectUnauthorized: false
                    })
                });

                console.log(`✅ OpenSearch Connected: ${endpoint}`);
                console.log(`   Status: ${response.data.status}`);
                console.log(`   Cluster: ${response.data.cluster_name}`);
                
                this.results.opensearchConnection[endpoint] = {
                    status: 'CONNECTED',
                    clusterHealth: response.data.status,
                    clusterName: response.data.cluster_name
                };
                
                return true;
            } catch (error) {
                console.log(`❌ OpenSearch Failed: ${endpoint} - ${error.message}`);
                this.results.opensearchConnection[endpoint] = {
                    status: 'FAILED',
                    error: error.message
                };
            }
        }
        
        return false;
    }

    async checkMCPTools() {
        console.log('\n🔍 Checking Available MCP Tools...\n');
        
        try {
            // Try to load enhanced MCP server and check tools
            const EnhancedMCPServer = require('./src/mcp-server/enhanced-mcp-server.js');
            const mcpServer = new EnhancedMCPServer();
            
            const expectedTools = [
                'search_healthcare_data',
                'create_fhir_patient', 
                'search_fhir_resources',
                'create_openehr_composition',
                'execute_aql_query',
                'audit_data_access',
                'generate_compliance_report',
                'analyze_clinical_data',
                'create_healthcare_index',
                'index_healthcare_document',
                'enhanced_health_check'
            ];

            expectedTools.forEach(tool => {
                const exists = mcpServer.tools && mcpServer.tools[tool];
                this.results.tools[tool] = exists;
                console.log(`${exists ? '✅' : '❌'} ${tool}`);
            });

            console.log(`\n📊 Total Tools Available: ${Object.values(this.results.tools).filter(Boolean).length}/${expectedTools.length}`);
            
        } catch (error) {
            console.log(`❌ Could not load Enhanced MCP Server: ${error.message}`);
            this.results.tools['Load Error'] = error.message;
        }
    }

    async checkIntegrationWithMainApp() {
        console.log('\n🔍 Checking Integration with Main Application...\n');
        
        try {
            // Check if main server has MCP integration
            const serverContent = fs.readFileSync(path.join(__dirname, 'src/server.js'), 'utf8');
            
            const integrationChecks = {
                'MCP Server Import': serverContent.includes('mcp-server') || serverContent.includes('MCP'),
                'OpenSearch References': serverContent.includes('opensearch') || serverContent.includes('OpenSearch'),
                'Healthcare Integration Service': serverContent.includes('HealthcareIntegrationService'),
                'Enhanced Endpoints': serverContent.includes('/api/enhanced/')
            };

            Object.entries(integrationChecks).forEach(([check, passed]) => {
                this.results.integration[check] = passed;
                console.log(`${passed ? '✅' : '❌'} ${check}`);
            });

        } catch (error) {
            console.log(`❌ Could not check main server integration: ${error.message}`);
        }
    }

    async testMCPEndpoints() {
        console.log('\n🔍 Testing MCP-Related Endpoints...\n');
        
        const endpoints = [
            { url: 'http://localhost:3000/api/enhanced/health', name: 'Enhanced Health' },
            { url: 'http://localhost:3000/api/enhanced/test-all', name: 'Enhanced Test All' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint.url, { timeout: 5000 });
                console.log(`✅ ${endpoint.name}: Working`);
                
                // Check if response mentions MCP or OpenSearch
                const responseText = JSON.stringify(response.data);
                const hasMCPRef = responseText.toLowerCase().includes('mcp');
                const hasOpenSearchRef = responseText.toLowerCase().includes('opensearch');
                
                if (hasMCPRef) console.log(`   📋 MCP Reference: Found`);
                if (hasOpenSearchRef) console.log(`   🔍 OpenSearch Reference: Found`);
                
            } catch (error) {
                console.log(`❌ ${endpoint.name}: ${error.message}`);
            }
        }
    }

    checkDependencies() {
        console.log('\n🔍 Checking Required Dependencies...\n');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            
            const requiredDeps = {
                '@opensearch-project/opensearch': 'OpenSearch Client',
                'winston': 'Logging (Available)',
                'axios': 'HTTP Client (Available)'
            };

            Object.entries(requiredDeps).forEach(([dep, description]) => {
                const exists = packageJson.dependencies && packageJson.dependencies[dep];
                console.log(`${exists ? '✅' : '❌'} ${dep} (${description})`);
            });

            // Check if OpenSearch client is missing
            if (!packageJson.dependencies || !packageJson.dependencies['@opensearch-project/opensearch']) {
                console.log('\n💡 To install OpenSearch client:');
                console.log('   npm install @opensearch-project/opensearch');
            }

        } catch (error) {
            console.log(`❌ Could not check dependencies: ${error.message}`);
        }
    }

    generateOverallStatus() {
        console.log('\n📊 MCP & OpenSearch Integration Status...\n');
        
        const mcpFilesCount = Object.values(this.results.mcpServer).filter(Boolean).length;
        const totalMCPFiles = Object.keys(this.results.mcpServer).length;
        const opensearchConnected = Object.values(this.results.opensearchConnection).some(conn => conn.status === 'CONNECTED');
        const toolsAvailable = Object.values(this.results.tools).filter(Boolean).length;
        const integrationChecks = Object.values(this.results.integration).filter(Boolean).length;

        console.log(`📁 MCP Files: ${mcpFilesCount}/${totalMCPFiles} present`);
        console.log(`🔍 OpenSearch: ${opensearchConnected ? 'Connected' : 'Not Connected'}`);
        console.log(`🛠️  MCP Tools: ${toolsAvailable} available`);
        console.log(`🔗 Integration: ${integrationChecks} checks passed`);

        // Determine overall status
        if (mcpFilesCount >= 2 && toolsAvailable >= 8) {
            if (opensearchConnected) {
                this.results.overall = 'FULLY_INTEGRATED';
                console.log('\n🎉 Status: FULLY INTEGRATED');
                console.log('✅ MCP and OpenSearch are properly integrated!');
            } else {
                this.results.overall = 'MCP_READY_OPENSEARCH_MISSING';
                console.log('\n⚠️  Status: MCP READY, OPENSEARCH MISSING');
                console.log('🔧 MCP server is ready but OpenSearch needs to be set up');
            }
        } else if (mcpFilesCount > 0) {
            this.results.overall = 'PARTIAL_MCP_INTEGRATION';
            console.log('\n📁 Status: PARTIAL MCP INTEGRATION');
            console.log('⚠️  Some MCP files exist but integration is incomplete');
        } else {
            this.results.overall = 'NOT_INTEGRATED';
            console.log('\n❌ Status: NOT INTEGRATED');
            console.log('❌ MCP and OpenSearch integration not found');
        }
    }

    provideRecommendations() {
        console.log('\n💡 Recommendations:\n');

        switch (this.results.overall) {
            case 'FULLY_INTEGRATED':
                console.log('✅ Your MCP and OpenSearch integration is complete!');
                console.log('🚀 Next steps:');
                console.log('   - Test MCP tools with healthcare data');
                console.log('   - Configure OpenSearch indices for optimal performance');
                console.log('   - Set up monitoring dashboards');
                break;

            case 'MCP_READY_OPENSEARCH_MISSING':
                console.log('🔧 MCP server is ready, but OpenSearch needs setup:');
                console.log('   1. Install OpenSearch: docker run -p 9200:9200 opensearchproject/opensearch:latest');
                console.log('   2. Install client: npm install @opensearch-project/opensearch');
                console.log('   3. Configure connection in .env file');
                console.log('   4. Test connection again');
                break;

            case 'PARTIAL_MCP_INTEGRATION':
                console.log('📁 Partial integration found:');
                console.log('   1. Enhanced MCP server is available');
                console.log('   2. Install dependencies: npm install @opensearch-project/opensearch');
                console.log('   3. Set up OpenSearch instance');
                console.log('   4. Configure environment variables');
                break;

            case 'NOT_INTEGRATED':
                console.log('❌ MCP and OpenSearch need to be set up:');
                console.log('   1. Enhanced MCP server is already created');
                console.log('   2. Install OpenSearch client: npm install @opensearch-project/opensearch');
                console.log('   3. Set up OpenSearch instance');
                console.log('   4. Configure integration');
                break;
        }

        console.log('\n🔗 Quick Setup Commands:');
        console.log('   # Install OpenSearch client');
        console.log('   npm install @opensearch-project/opensearch');
        console.log('   ');
        console.log('   # Start OpenSearch with Docker');
        console.log('   docker run -d -p 9200:9200 -e "discovery.type=single-node" opensearchproject/opensearch:latest');
        console.log('   ');
        console.log('   # Test enhanced MCP server');
        console.log('   node src/mcp-server/enhanced-mcp-server.js');
    }

    async runAllChecks() {
        console.log('🏥 MCP & OpenSearch Integration Checker\n');
        console.log('=' .repeat(60));
        
        await this.checkMCPServerFiles();
        await this.checkOpenSearchConnection();
        await this.checkMCPTools();
        await this.checkIntegrationWithMainApp();
        await this.testMCPEndpoints();
        this.checkDependencies();
        this.generateOverallStatus();
        this.provideRecommendations();
        
        console.log('\n' + '='.repeat(60));
        console.log('🏁 MCP & OpenSearch Check Complete');
        
        return this.results;
    }
}

// Run the checker
if (require.main === module) {
    const checker = new MCPOpenSearchChecker();
    checker.runAllChecks().catch(console.error);
}

module.exports = MCPOpenSearchChecker;
