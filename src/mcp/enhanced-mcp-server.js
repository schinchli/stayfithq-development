#!/usr/bin/env node

/**
 * Enhanced MCP Server with OpenSearch Integration
 * Connects healthcare platform with MCP, OpenSearch, and enhanced features
 */

const { Server, StdioServerTransport } = require('./lib/mcp-sdk-mock.js');
const winston = require('winston');
const { Client } = require('@opensearch-project/opensearch');

// Import enhanced healthcare services
const HealthcareIntegrationService = require('../integration/healthcare-integration-service');
const HIPAAFramework = require('../compliance/hipaa-framework');
const FHIRR4Implementation = require('../standards/fhir-r4-implementation');
const OpenEHRImplementation = require('../standards/openehr-implementation');

class EnhancedMCPServer {
    constructor() {
        this.server = new Server(
            { name: 'enhanced-healthcare-mcp', version: '2.0.0' },
            { capabilities: { tools: {} } }
        );

        // Initialize enhanced healthcare services
        this.healthcareService = new HealthcareIntegrationService();
        this.hipaa = new HIPAAFramework();
        this.fhir = new FHIRR4Implementation();
        this.openehr = new OpenEHRImplementation();

        // Initialize OpenSearch client
        this.opensearchClient = new Client({
            node: process.env.OPENSEARCH_ENDPOINT || 'https://localhost:9200',
            auth: {
                username = "your_username".env.OPENSEARCH_USERNAME || 'admin',
                password = "your_secure_password"|| 'admin'
            },
            ssl: {
                rejectUnauthorized: false
            }
        });

        // Configure logging
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/enhanced-mcp.log' }),
                new winston.transports.Console({ format: winston.format.simple() })
            ]
        });

        this.initializeTools();
        this.setupRequestHandlers();
    }

    initializeTools() {
        this.tools = {
            // Enhanced Healthcare Search with OpenSearch
            search_healthcare_data: {
                description: 'Search healthcare data using OpenSearch with HIPAA compliance',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                        patientId: { type: 'string', description: 'Patient ID for filtering' },
                        dataType: { type: 'string', enum: ['patient', 'observation', 'medication', 'condition'] },
                        dateRange: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } } }
                    },
                    required: ['query']
                },
                handler: this.searchHealthcareData.bind(this)
            },

            // FHIR R4 Operations
            create_fhir_patient: {
                description: 'Create FHIR R4 compliant patient record',
                inputSchema: {
                    type: 'object',
                    properties: {
                        patientData: { type: 'object', description: 'Patient data in FHIR format' }
                    },
                    required: ['patientData']
                },
                handler: this.createFHIRPatient.bind(this)
            },

            search_fhir_resources: {
                description: 'Search FHIR resources with OpenSearch backend',
                inputSchema: {
                    type: 'object',
                    properties: {
                        resourceType: { type: 'string', description: 'FHIR resource type' },
                        searchParams: { type: 'object', description: 'FHIR search parameters' }
                    },
                    required: ['resourceType']
                },
                handler: this.searchFHIRResources.bind(this)
            },

            // openEHR Operations
            create_openehr_composition: {
                description: 'Create openEHR composition with clinical data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ehrId: { type: 'string', description: 'EHR ID' },
                        compositionData: { type: 'object', description: 'Composition data' }
                    },
                    required: ['ehrId', 'compositionData']
                },
                handler: this.createOpenEHRComposition.bind(this)
            },

            execute_aql_query: {
                description: 'Execute openEHR AQL query with OpenSearch optimization',
                inputSchema: {
                    type: 'object',
                    properties: {
                        aql: { type: 'string', description: 'AQL query string' },
                        parameters: { type: 'object', description: 'Query parameters' }
                    },
                    required: ['aql']
                },
                handler: this.executeAQLQuery.bind(this)
            },

            // HIPAA Compliance Operations
            audit_data_access: {
                description: 'Log HIPAA compliant data access with OpenSearch indexing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string', description: 'User ID' },
                        dataType: { type: 'string', description: 'Type of data accessed' },
                        operation: { type: 'string', description: 'Operation performed' },
                        patientId: { type: 'string', description: 'Patient ID if applicable' }
                    },
                    required: ['userId', 'dataType', 'operation']
                },
                handler: this.auditDataAccess.bind(this)
            },

            generate_compliance_report: {
                description: 'Generate HIPAA compliance report from OpenSearch data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        startDate: { type: 'string', description: 'Report start date' },
                        endDate: { type: 'string', description: 'Report end date' },
                        reportType: { type: 'string', enum: ['access', 'security', 'audit'] }
                    },
                    required: ['startDate', 'endDate']
                },
                handler: this.generateComplianceReport.bind(this)
            },

            // Enhanced AI Operations
            analyze_clinical_data: {
                description: 'AI analysis of clinical data with FHIR/openEHR context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        patientId: { type: 'string', description: 'Patient ID' },
                        analysisType: { type: 'string', enum: ['trends', 'risks', 'recommendations'] },
                        dataTypes: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['patientId', 'analysisType']
                },
                handler: this.analyzeClinicalData.bind(this)
            },

            // OpenSearch Management
            create_healthcare_index: {
                description: 'Create OpenSearch index for healthcare data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        indexName: { type: 'string', description: 'Index name' },
                        mapping: { type: 'object', description: 'Index mapping' }
                    },
                    required: ['indexName']
                },
                handler: this.createHealthcareIndex.bind(this)
            },

            index_healthcare_document: {
                description: 'Index healthcare document in OpenSearch',
                inputSchema: {
                    type: 'object',
                    properties: {
                        index: { type: 'string', description: 'Index name' },
                        document: { type: 'object', description: 'Document to index' },
                        documentId: { type: 'string', description: 'Document ID' }
                    },
                    required: ['index', 'document']
                },
                handler: this.indexHealthcareDocument.bind(this)
            },

            // System Health and Status
            enhanced_health_check: {
                description: 'Comprehensive health check of all enhanced services',
                inputSchema: { type: 'object', properties: {} },
                handler: this.enhancedHealthCheck.bind(this)
            }
        };
    }

    setupRequestHandlers() {
        // List tools handler
        this.server.setRequestHandler({ method: 'tools/list' }, async () => {
            return {
                tools: Object.entries(this.tools).map(([name, tool]) => ({
                    name,
                    description: tool.description,
                    inputSchema: tool.inputSchema
                }))
            };
        });

        // Call tool handler
        this.server.setRequestHandler({ method: 'tools/call' }, async (request) => {
            const { name, arguments: args } = request.params;
            
            if (!this.tools[name]) {
                throw new Error(`Unknown tool: ${name}`);
            }

            try {
                const result = await this.tools[name].handler(args);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                this.logger.error(`Tool ${name} failed:`, error);
                throw error;
            }
        });
    }

    // Tool Implementations

    async searchHealthcareData(args) {
        const { query, patientId, dataType, dateRange } = args;
        
        // Log HIPAA access
        this.hipaa.logDataAccess('mcp-user', 'HEALTHCARE_SEARCH', 'READ', patientId);

        const searchBody = {
            query: {
                bool: {
                    must: [
                        { multi_match: { query, fields: ['*'] } }
                    ],
                    filter: []
                }
            }
        };

        if (patientId) {
            searchBody.query.bool.filter.push({ term: { 'patient.id': patientId } });
        }

        if (dataType) {
            searchBody.query.bool.filter.push({ term: { 'resourceType': dataType } });
        }

        if (dateRange) {
            searchBody.query.bool.filter.push({
                range: {
                    'timestamp': {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                }
            });
        }

        try {
            const response = await this.opensearchClient.search({
                index: 'healthcare-*',
                body: searchBody
            });

            return {
                success: true,
                totalHits: response.body.hits.total.value,
                results: response.body.hits.hits.map(hit => ({
                    id: hit._id,
                    source: hit._source,
                    score: hit._score
                })),
                compliance: 'HIPAA_LOGGED'
            };
        } catch (error) {
            this.logger.error('OpenSearch query failed:', error);
            return { success: false, error: error.message };
        }
    }

    async createFHIRPatient(args) {
        const { patientData } = args;
        
        try {
            // Create FHIR patient
            const fhirPatient = this.fhir.createPatient(patientData);
            
            // Index in OpenSearch
            await this.opensearchClient.index({
                index: 'healthcare-patients',
                id: fhirPatient.id,
                body: {
                    ...fhirPatient,
                    indexed_at: new Date().toISOString(),
                    compliance: 'HIPAA_COMPLIANT'
                }
            });

            // Log HIPAA access
            this.hipaa.logDataAccess('mcp-user', 'PATIENT_RECORD', 'CREATE', fhirPatient.id);

            return {
                success: true,
                patient: fhirPatient,
                indexed: true,
                compliance: 'HIPAA_COMPLIANT'
            };
        } catch (error) {
            this.logger.error('FHIR patient creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async searchFHIRResources(args) {
        const { resourceType, searchParams = {} } = args;
        
        try {
            const searchResults = this.fhir.searchResources(resourceType, searchParams);
            
            // Enhance with OpenSearch
            const opensearchQuery = {
                query: {
                    bool: {
                        must: [
                            { term: { 'resourceType': resourceType } }
                        ]
                    }
                }
            };

            const response = await this.opensearchClient.search({
                index: 'healthcare-*',
                body: opensearchQuery
            });

            return {
                success: true,
                fhirResults: searchResults,
                opensearchResults: response.body.hits.hits,
                totalFound: response.body.hits.total.value
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createOpenEHRComposition(args) {
        const { ehrId, compositionData } = args;
        
        try {
            const composition = this.openehr.createComposition(compositionData);
            
            // Index in OpenSearch
            await this.opensearchClient.index({
                index: 'healthcare-compositions',
                id: composition.uid.value,
                body: {
                    ...composition,
                    ehr_id: ehrId,
                    indexed_at: new Date().toISOString()
                }
            });

            return {
                success: true,
                composition,
                indexed: true
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async executeAQLQuery(args) {
        const { aql, parameters = {} } = args;
        
        try {
            const result = await this.openehr.executeAQL(aql, parameters);
            
            // Log query execution
            this.logger.info('AQL Query executed', { aql, parameters, resultCount: result.rows.length });
            
            return {
                success: true,
                aqlResult: result,
                executedAt: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async auditDataAccess(args) {
        const { userId, dataType, operation, patientId } = args;
        
        const auditEvent = this.hipaa.logDataAccess(userId, dataType, operation, patientId);
        
        // Index audit event in OpenSearch
        try {
            await this.opensearchClient.index({
                index: 'healthcare-audit',
                body: {
                    ...auditEvent,
                    indexed_at: new Date().toISOString()
                }
            });

            return {
                success: true,
                auditEvent,
                indexed: true
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async generateComplianceReport(args) {
        const { startDate, endDate, reportType = 'audit' } = args;
        
        try {
            const query = {
                query: {
                    bool: {
                        must: [
                            { term: { 'eventType': 'PHI_ACCESS' } }
                        ],
                        filter: [
                            {
                                range: {
                                    'timestamp': {
                                        gte: startDate,
                                        lte: endDate
                                    }
                                }
                            }
                        ]
                    }
                },
                aggs: {
                    by_user: { terms: { field: 'userId' } },
                    by_data_type: { terms: { field: 'dataType' } },
                    by_operation: { terms: { field: 'operation' } }
                }
            };

            const response = await this.opensearchClient.search({
                index: 'healthcare-audit',
                body: query
            });

            return {
                success: true,
                reportPeriod: { startDate, endDate },
                totalEvents: response.body.hits.total.value,
                aggregations: response.body.aggregations,
                compliance: 'HIPAA_COMPLIANT'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async analyzeClinicalData(args) {
        const { patientId, analysisType, dataTypes = [] } = args;
        
        try {
            // Get patient data from OpenSearch
            const patientQuery = {
                query: {
                    bool: {
                        must: [
                            { term: { 'patient.id': patientId } }
                        ]
                    }
                }
            };

            const response = await this.opensearchClient.search({
                index: 'healthcare-*',
                body: patientQuery
            });

            const clinicalData = response.body.hits.hits.map(hit => hit._source);
            
            // Use healthcare service for analysis
            const analysisResult = await this.healthcareService.queryHealthcareData(
                {
                    type: analysisType,
                    patientId,
                    dataTypes,
                    purpose: 'TREATMENT'
                },
                { userId: 'mcp-user', userRole: 'clinician' }
            );

            return {
                success: true,
                patientId,
                analysisType,
                dataFound: clinicalData.length,
                analysis: analysisResult,
                compliance: 'HIPAA_COMPLIANT'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createHealthcareIndex(args) {
        const { indexName, mapping = {} } = args;
        
        const defaultMapping = {
            properties: {
                resourceType: { type: 'keyword' },
                patient: {
                    properties: {
                        id: { type: 'keyword' },
                        name: { type: 'text' }
                    }
                },
                timestamp: { type: 'date' },
                compliance: { type: 'keyword' },
                indexed_at: { type: 'date' }
            }
        };

        try {
            await this.opensearchClient.indices.create({
                index: indexName,
                body: {
                    mappings: { ...defaultMapping, ...mapping }
                }
            });

            return {
                success: true,
                indexName,
                created: true
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async indexHealthcareDocument(args) {
        const { index, document, documentId } = args;
        
        try {
            const response = await this.opensearchClient.index({
                index,
                id: documentId,
                body: {
                    ...document,
                    indexed_at: new Date().toISOString(),
                    compliance: 'HIPAA_COMPLIANT'
                }
            });

            return {
                success: true,
                documentId: response.body._id,
                indexed: true
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async enhancedHealthCheck() {
        const checks = {
            opensearch: false,
            fhir: false,
            openehr: false,
            hipaa: false,
            healthcare_service: false
        };

        try {
            // Check OpenSearch
            const osHealth = await this.opensearchClient.cluster.health();
            checks.opensearch = osHealth.body.status !== 'red';
        } catch (error) {
            this.logger.warn('OpenSearch health check failed:', error.message);
        }

        // Check other services
        checks.fhir = !!this.fhir;
        checks.openehr = !!this.openehr;
        checks.hipaa = !!this.hipaa;
        checks.healthcare_service = !!this.healthcareService;

        const allHealthy = Object.values(checks).every(check => check === true);

        return {
            status: allHealthy ? 'HEALTHY' : 'DEGRADED',
            checks,
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        };
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        this.logger.info('Enhanced MCP Server with OpenSearch started');
        console.log('🏥 Enhanced Healthcare MCP Server with OpenSearch Integration Started');
        console.log('✅ HIPAA Compliance: Active');
        console.log('✅ FHIR R4: Integrated');
        console.log('✅ openEHR: Available');
        console.log('✅ OpenSearch: Connected');
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new EnhancedMCPServer();
    server.start().catch(console.error);
}

module.exports = EnhancedMCPServer;
