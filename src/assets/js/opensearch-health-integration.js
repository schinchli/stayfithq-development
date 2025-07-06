/**
 * OpenSearch Health Data Integration Service
 * HIPAA-compliant health data indexing and search functionality
 */

class OpenSearchHealthService {
    constructor() {
        this.client = null;
        this.indices = {
            vitalSigns: 'health-vital-signs',
            activityData: 'health-activity-data',
            sleepData: 'health-sleep-data',
            bodyMeasurements: 'health-body-measurements',
            labResults: 'health-lab-results',
            workouts: 'health-workouts',
            activitySummaries: 'health-activity-summaries'
        };
        
        this.init();
    }

    async init() {
        await this.initializeClient();
        await this.createIndices();
    }

    async initializeClient() {
        // Initialize OpenSearch client with AWS credentials
        const config = {
            node: process.env.OPENSEARCH_ENDPOINT || 'https://your-opensearch-domain.region.es.amazonaws.com',
            auth: {
                username = "your_username".env.OPENSEARCH_USERNAME,
                password = "your_secure_password"},
            ssl: {
                rejectUnauthorized: true
            }
        };

        // In a real implementation, you would use the official OpenSearch client
        // For demo purposes, we'll simulate the client
        this.client = {
            indices: {
                create: this.mockCreate.bind(this),
                exists: this.mockExists.bind(this)
            },
            index: this.mockIndex.bind(this),
            bulk: this.mockBulk.bind(this),
            search: this.mockSearch.bind(this)
        };
    }

    async createIndices() {
        const indexMappings = {
            [this.indices.vitalSigns]: this.getVitalSignsMapping(),
            [this.indices.activityData]: this.getActivityDataMapping(),
            [this.indices.sleepData]: this.getSleepDataMapping(),
            [this.indices.bodyMeasurements]: this.getBodyMeasurementsMapping(),
            [this.indices.labResults]: this.getLabResultsMapping(),
            [this.indices.workouts]: this.getWorkoutsMapping(),
            [this.indices.activitySummaries]: this.getActivitySummariesMapping()
        };

        for (const [indexName, mapping] of Object.entries(indexMappings)) {
            try {
                const exists = await this.client.indices.exists({ index: indexName });
                
                if (!exists.body) {
                    await this.client.indices.create({
                        index: indexName,
                        body: {
                            settings: {
                                number_of_shards: 1,
                                number_of_replicas: 1,
                                analysis: {
                                    analyzer: {
                                        health_analyzer: {
                                            type: 'custom',
                                            tokenizer: 'standard',
                                            filter: ['lowercase', 'stop']
                                        }
                                    }
                                }
                            },
                            mappings: mapping
                        }
                    });
                    
                    console.log(`Created index: ${indexName}`);
                }
            } catch (error) {
                console.error(`Error creating index ${indexName}:`, error);
            }
        }
    }

    getVitalSignsMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'float' },
                unit: { type: 'keyword' },
                timestamp: { type: 'date' },
                source: { type: 'keyword' },
                device: { type: 'text' },
                userId: { type: 'keyword' },
                normalRange: {
                    properties: {
                        min: { type: 'float' },
                        max: { type: 'float' }
                    }
                },
                tags: { type: 'keyword' },
                metadata: {
                    properties: {
                        accuracy: { type: 'keyword' },
                        confidence: { type: 'float' }
                    }
                }
            }
        };
    }

    getActivityDataMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'float' },
                unit: { type: 'keyword' },
                timestamp: { type: 'date' },
                duration: { type: 'long' },
                source: { type: 'keyword' },
                userId: { type: 'keyword' },
                location: { type: 'geo_point' },
                weather: {
                    properties: {
                        temperature: { type: 'float' },
                        humidity: { type: 'float' },
                        conditions: { type: 'keyword' }
                    }
                }
            }
        };
    }

    getSleepDataMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'keyword' },
                startTime: { type: 'date' },
                endTime: { type: 'date' },
                duration: { type: 'long' },
                source: { type: 'keyword' },
                userId: { type: 'keyword' },
                sleepStages: {
                    properties: {
                        deep: { type: 'long' },
                        light: { type: 'long' },
                        rem: { type: 'long' },
                        awake: { type: 'long' }
                    }
                },
                quality: { type: 'float' }
            }
        };
    }

    getBodyMeasurementsMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'float' },
                unit: { type: 'keyword' },
                timestamp: { type: 'date' },
                source: { type: 'keyword' },
                userId: { type: 'keyword' },
                bmi: { type: 'float' },
                bodyFatPercentage: { type: 'float' },
                muscleMass: { type: 'float' }
            }
        };
    }

    getLabResultsMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                value: { type: 'float' },
                unit: { type: 'keyword' },
                timestamp: { type: 'date' },
                source: { type: 'keyword' },
                userId: { type: 'keyword' },
                referenceRange: {
                    properties: {
                        min: { type: 'float' },
                        max: { type: 'float' },
                        unit: { type: 'keyword' }
                    }
                },
                status: { type: 'keyword' }, // normal, high, low, critical
                labName: { type: 'text' },
                physicianNotes: { type: 'text' }
            }
        };
    }

    getWorkoutsMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                workoutActivityType: { type: 'keyword' },
                duration: { type: 'float' },
                durationUnit: { type: 'keyword' },
                totalDistance: { type: 'float' },
                totalDistanceUnit: { type: 'keyword' },
                totalEnergyBurned: { type: 'float' },
                totalEnergyBurnedUnit: { type: 'keyword' },
                creationDate: { type: 'date' },
                startDate: { type: 'date' },
                endDate: { type: 'date' },
                userId: { type: 'keyword' },
                route: { type: 'geo_shape' },
                heartRateData: {
                    properties: {
                        average: { type: 'float' },
                        maximum: { type: 'float' },
                        minimum: { type: 'float' }
                    }
                }
            }
        };
    }

    getActivitySummariesMapping() {
        return {
            properties: {
                id: { type: 'keyword' },
                dateComponents: { type: 'date' },
                activeEnergyBurned: { type: 'float' },
                activeEnergyBurnedGoal: { type: 'float' },
                activeEnergyBurnedUnit: { type: 'keyword' },
                appleExerciseTime: { type: 'float' },
                appleExerciseTimeGoal: { type: 'float' },
                appleStandHours: { type: 'integer' },
                appleStandHoursGoal: { type: 'integer' },
                userId: { type: 'keyword' },
                completionPercentages: {
                    properties: {
                        move: { type: 'float' },
                        exercise: { type: 'float' },
                        stand: { type: 'float' }
                    }
                }
            }
        };
    }

    async indexHealthData(category, data, userId) {
        const indexName = this.indices[category];
        if (!indexName) {
            throw new Error(`Unknown health data category: ${category}`);
        }

        try {
            // Prepare bulk indexing operations
            const bulkOps = [];
            
            data.forEach(record => {
                // Add user ID for data isolation
                record.userId = userId;
                record.indexedAt = new Date().toISOString();
                
                // Add HIPAA compliance metadata
                record.hipaaCompliant = true;
                record.dataClassification = 'PHI'; // Protected Health Information
                
                bulkOps.push({
                    index: {
                        _index: indexName,
                        _id: record.id
                    }
                });
                bulkOps.push(record);
            });

            // Execute bulk indexing
            const response = await this.client.bulk({
                body: bulkOps,
                refresh: true
            });

            if (response.body.errors) {
                const errors = response.body.items.filter(item => item.index.error);
                console.error('Bulk indexing errors:', errors);
                throw new Error(`Failed to index ${errors.length} records`);
            }

            return {
                success: true,
                indexed: data.length,
                category: category,
                index: indexName
            };

        } catch (error) {
            console.error(`Error indexing ${category} data:`, error);
            throw error;
        }
    }

    async searchHealthData(query, userId, options = {}) {
        const {
            category = null,
            dateRange = null,
            limit = 100,
            offset = 0,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = options;

        try {
            // Determine which indices to search
            const indices = category ? [this.indices[category]] : Object.values(this.indices);
            
            // Build search query
            const searchQuery = {
                index: indices.join(','),
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    term: {
                                        userId: userId
                                    }
                                }
                            ],
                            filter: []
                        }
                    },
                    sort: [
                        {
                            [sortBy]: {
                                order: sortOrder
                            }
                        }
                    ],
                    from: offset,
                    size: limit
                }
            };

            // Add text search if query provided
            if (query && query.trim()) {
                searchQuery.body.query.bool.must.push({
                    multi_match: {
                        query: query,
                        fields: ['type^2', 'source', 'device', 'workoutActivityType'],
                        fuzziness: 'AUTO'
                    }
                });
            }

            // Add date range filter
            if (dateRange) {
                searchQuery.body.query.bool.filter.push({
                    range: {
                        timestamp: {
                            gte: dateRange.start,
                            lte: dateRange.end
                        }
                    }
                });
            }

            // Execute search
            const response = await this.client.search(searchQuery);
            
            return {
                hits: response.body.hits.hits.map(hit => ({
                    id: hit._id,
                    index: hit._index,
                    score: hit._score,
                    data: hit._source
                })),
                total: response.body.hits.total.value,
                maxScore: response.body.hits.max_score
            };

        } catch (error) {
            console.error('Error searching health data:', error);
            throw error;
        }
    }

    async getHealthDataAggregations(userId, category, aggregationType, dateRange = null) {
        const indexName = this.indices[category];
        if (!indexName) {
            throw new Error(`Unknown health data category: ${category}`);
        }

        try {
            const aggregationQuery = {
                index: indexName,
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    term: {
                                        userId: userId
                                    }
                                }
                            ],
                            filter: dateRange ? [{
                                range: {
                                    timestamp: {
                                        gte: dateRange.start,
                                        lte: dateRange.end
                                    }
                                }
                            }] : []
                        }
                    },
                    aggs: this.buildAggregation(aggregationType, category),
                    size: 0
                }
            };

            const response = await this.client.search(aggregationQuery);
            return response.body.aggregations;

        } catch (error) {
            console.error('Error getting health data aggregations:', error);
            throw error;
        }
    }

    buildAggregation(type, category) {
        switch (type) {
            case 'daily_average':
                return {
                    daily_stats: {
                        date_histogram: {
                            field: 'timestamp',
                            calendar_interval: 'day'
                        },
                        aggs: {
                            avg_value: {
                                avg: {
                                    field: 'value'
                                }
                            }
                        }
                    }
                };
            
            case 'weekly_trends':
                return {
                    weekly_trends: {
                        date_histogram: {
                            field: 'timestamp',
                            calendar_interval: 'week'
                        },
                        aggs: {
                            avg_value: { avg: { field: 'value' } },
                            min_value: { min: { field: 'value' } },
                            max_value: { max: { field: 'value' } }
                        }
                    }
                };
            
            case 'source_breakdown':
                return {
                    sources: {
                        terms: {
                            field: 'source',
                            size: 10
                        }
                    }
                };
            
            default:
                return {
                    basic_stats: {
                        stats: {
                            field: 'value'
                        }
                    }
                };
        }
    }

    async deleteHealthData(userId, category = null, recordId = null) {
        try {
            if (recordId) {
                // Delete specific record
                const indexName = this.indices[category];
                await this.client.delete({
                    index: indexName,
                    id: recordId
                });
                
                return { success: true, deleted: 1 };
            } else {
                // Delete all data for user in category or all categories
                const indices = category ? [this.indices[category]] : Object.values(this.indices);
                
                const deleteQuery = {
                    index: indices.join(','),
                    body: {
                        query: {
                            term: {
                                userId: userId
                            }
                        }
                    }
                };

                const response = await this.client.deleteByQuery(deleteQuery);
                return { 
                    success: true, 
                    deleted: response.body.deleted 
                };
            }
        } catch (error) {
            console.error('Error deleting health data:', error);
            throw error;
        }
    }

    // Mock methods for demo purposes
    async mockExists(params) {
        return { body: false };
    }

    async mockCreate(params) {
        console.log(`Mock: Creating index ${params.index}`);
        return { body: { acknowledged: true } };
    }

    async mockIndex(params) {
        console.log(`Mock: Indexing document in ${params.index}`);
        return { body: { _id: params.id || 'mock_id', result: 'created' } };
    }

    async mockBulk(params) {
        const operations = params.body.length / 2;
        console.log(`Mock: Bulk indexing ${operations} documents`);
        return { 
            body: { 
                errors: false, 
                items: Array(operations).fill({ index: { result: 'created' } })
            } 
        };
    }

    async mockSearch(params) {
        console.log(`Mock: Searching in ${params.index}`);
        return {
            body: {
                hits: {
                    total: { value: 0 },
                    max_score: null,
                    hits: []
                }
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenSearchHealthService;
} else {
    window.OpenSearchHealthService = OpenSearchHealthService;
}
