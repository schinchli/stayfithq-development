
/**
 * MCP Integration Middleware
 * Connects main server with MCP and OpenSearch functionality
 */

const MockOpenSearchService = require('./mcp-server/mock-opensearch-service');

class MCPIntegrationMiddleware {
    constructor() {
        this.mockOpenSearch = new MockOpenSearchService();
        this.isEnabled = process.env.MCP_SERVER_ENABLED === 'true';
    }

    // Add MCP-powered search endpoint
    addSearchEndpoint(app) {
        app.get('/api/mcp/search', async (req, res) => {
            try {
                const { query, type = 'all' } = req.query;
                
                if (!query) {
                    return res.status(400).json({ error: 'Query parameter required' });
                }

                console.log(`🔍 MCP Search: ${query} (type: ${type})`);

                // Use mock OpenSearch for demonstration
                const searchResult = await this.mockOpenSearch.search({
                    index: 'healthcare-*',
                    body: {
                        query: {
                            multi_match: {
                                query: query,
                                fields: ['*']
                            }
                        }
                    }
                });

                res.json({
                    success: true,
                    query,
                    type,
                    totalHits: searchResult.body.hits.total.value,
                    results: searchResult.body.hits.hits,
                    mcpEnabled: this.isEnabled,
                    searchEngine: 'Mock OpenSearch',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    mcpEnabled: this.isEnabled
                });
            }
        });

        console.log('✅ Added MCP search endpoint: /api/mcp/search');
    }

    // Add MCP health check
    addHealthCheck(app) {
        app.get('/api/mcp/health', async (req, res) => {
            try {
                const clusterHealth = await this.mockOpenSearch.cluster().health();
                
                res.json({
                    status: 'MCP Integration Active',
                    opensearch: {
                        status: clusterHealth.body.status,
                        cluster: clusterHealth.body.cluster_name,
                        type: 'Mock Service'
                    },
                    mcp: {
                        enabled: this.isEnabled,
                        tools: [
                            'search_healthcare_data',
                            'create_fhir_patient',
                            'audit_data_access',
                            'analyze_clinical_data'
                        ]
                    },
                    integration: 'ACTIVE',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    integration: 'ERROR'
                });
            }
        });

        console.log('✅ Added MCP health check: /api/mcp/health');
    }

    // Add MCP patient indexing
    addPatientIndexing(app) {
        app.post('/api/mcp/index-patient', async (req, res) => {
            try {
                const patientData = req.body;
                
                // Index patient in mock OpenSearch
                const indexResult = await this.mockOpenSearch.index({
                    index: 'healthcare-patients',
                    id: patientData.id || `patient-${Date.now()}`,
                    body: {
                        ...patientData,
                        indexed_at: new Date().toISOString(),
                        compliance: 'HIPAA_COMPLIANT',
                        searchable: true
                    }
                });

                res.json({
                    success: true,
                    indexed: true,
                    documentId: indexResult.body._id,
                    index: indexResult.body._index,
                    mcpEnabled: this.isEnabled,
                    message: 'Patient indexed for MCP search'
                });

            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    indexed: false
                });
            }
        });

        console.log('✅ Added MCP patient indexing: /api/mcp/index-patient');
    }

    // Initialize all MCP endpoints
    initialize(app) {
        if (!this.isEnabled) {
            console.log('ℹ️  MCP integration disabled in environment');
            return;
        }

        console.log('🚀 Initializing MCP Integration...');
        this.addSearchEndpoint(app);
        this.addHealthCheck(app);
        this.addPatientIndexing(app);
        console.log('✅ MCP Integration initialized successfully');
    }
}

module.exports = MCPIntegrationMiddleware;
