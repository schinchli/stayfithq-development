
/**
 * Mock OpenSearch Service for Testing
 * Simulates OpenSearch functionality when actual OpenSearch is not available
 */

class MockOpenSearchService {
    constructor() {
        this.indices = new Map();
        this.documents = new Map();
        console.log('🔍 Mock OpenSearch Service initialized');
    }

    async search(params) {
        const { index, body } = params;
        console.log(`🔍 Mock search in index: ${index}`);
        
        // Simulate search results
        return {
            body: {
                hits: {
                    total: { value: 2 },
                    hits: [
                        {
                            _id: 'mock-doc-1',
                            _source: {
                                resourceType: 'Patient',
                                id: 'patient-123',
                                name: [{ family: 'Doe', given: ['John'] }],
                                compliance: 'HIPAA_COMPLIANT',
                                indexed_at: new Date().toISOString()
                            },
                            _score: 1.0
                        },
                        {
                            _id: 'mock-doc-2', 
                            _source: {
                                resourceType: 'Observation',
                                id: 'obs-456',
                                patient: { id: 'patient-123' },
                                code: { text: 'Blood Pressure' },
                                valueQuantity: { value: 120, unit: 'mmHg' },
                                compliance: 'HIPAA_COMPLIANT',
                                indexed_at: new Date().toISOString()
                            },
                            _score: 0.8
                        }
                    ]
                }
            }
        };
    }

    async index(params) {
        const { index, id, body } = params;
        console.log(`📝 Mock indexing document ${id} in ${index}`);
        
        if (!this.documents.has(index)) {
            this.documents.set(index, new Map());
        }
        
        this.documents.get(index).set(id, body);
        
        return {
            body: {
                _id: id,
                _index: index,
                result: 'created'
            }
        };
    }

    async indices() {
        return {
            create: async (params) => {
                const { index } = params;
                console.log(`🏗️  Mock creating index: ${index}`);
                this.indices.set(index, { created: new Date().toISOString() });
                return { body: { acknowledged: true } };
            }
        };
    }

    async cluster() {
        return {
            health: async () => ({
                body: {
                    status: 'green',
                    cluster_name: 'mock-healthcare-cluster',
                    number_of_nodes: 1
                }
            })
        };
    }
}

module.exports = MockOpenSearchService;
