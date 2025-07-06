/**
 * OpenSearch MCP Integration for StayFit Health Companion
 * Enables real-time health data search and indexing
 */

// Configuration
const OPENSEARCH_MCP_CONFIG = {
    searchEndpoint: '<REDACTED_CREDENTIAL>',
    timeout: 15000,
    retryAttempts: 2
};

// OpenSearch MCP status
let mcpStatus = {
    connected: false,
    lastChecked: null,
    indexReady: false
};

/**
 * Initialize OpenSearch MCP integration
 */
async function initializeOpenSearchMCP() {
    console.log('🔍 Initializing OpenSearch MCP...');
    
    try {
        // Check MCP health
        const healthCheck = await performHealthCheck();
        
        if (healthCheck.success) {
            mcpStatus.connected = true;
            mcpStatus.indexReady = true;
            updateMCPStatusIndicators(true);
            
            // Index sample health data
            await indexSampleHealthData();
            
            console.log('✅ OpenSearch MCP initialized successfully');
        } else {
            mcpStatus.connected = false;
            updateMCPStatusIndicators(false);
            console.warn('⚠️ OpenSearch MCP health check failed');
        }
        
    } catch (error) {
        console.error('❌ OpenSearch MCP initialization failed:', error);
        mcpStatus.connected = false;
        updateMCPStatusIndicators(false);
    }
    
    mcpStatus.lastChecked = new Date().toISOString();
}

/**
 * Perform health check on OpenSearch MCP
 */
async function performHealthCheck() {
    try {
        const response = await fetch(OPENSEARCH_MCP_CONFIG.searchEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                action: 'health_check'
            }),
            timeout: OPENSEARCH_MCP_CONFIG.timeout
        });
        
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🏥 OpenSearch cluster health:', data);
        
        return {
            success: data.status === 'healthy',
            clusterStatus: data.cluster_status,
            nodes: data.number_of_nodes
        };
        
    } catch (error) {
        console.error('Health check error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Search health data using OpenSearch MCP
 */
async function searchHealthData(query, userId = 'web_user', filters = {}) {
    try {
        if (!mcpStatus.connected) {
            console.warn('OpenSearch MCP not connected, using fallback');
            return getFallbackSearchResults(query);
        }
        
        const searchRequest = {
            action: 'search',
            query: query,
            user_id: userId,
            filters: filters,
            limit: 10
        };
        
        const response = await fetch(OPENSEARCH_MCP_CONFIG.searchEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(searchRequest),
            timeout: OPENSEARCH_MCP_CONFIG.timeout
        });
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`🔍 Found ${data.total} results for: "${query}"`);
        
        return {
            success: true,
            results: data.results,
            total: data.total,
            query: data.query
        };
        
    } catch (error) {
        console.error('Search error:', error);
        return {
            success: false,
            error: error.message,
            results: getFallbackSearchResults(query)
        };
    }
}

/**
 * Index health data using OpenSearch MCP
 */
async function indexHealthData(healthData, userId = 'web_user') {
    try {
        if (!mcpStatus.connected) {
            console.warn('OpenSearch MCP not connected, skipping indexing');
            return { success: false, error: 'MCP not connected' };
        }
        
        const indexRequest = {
            action: 'index',
            data: healthData,
            user_id: userId
        };
        
        const response = await fetch(OPENSEARCH_MCP_CONFIG.searchEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(indexRequest),
            timeout: OPENSEARCH_MCP_CONFIG.timeout
        });
        
        if (!response.ok) {
            throw new Error(`Indexing failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📝 Health data indexed:', data.document_id);
        
        return {
            success: true,
            documentId: data.document_id,
            indexed: data.indexed
        };
        
    } catch (error) {
        console.error('Indexing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Index sample health data for demonstration
 */
async function indexSampleHealthData() {
    const sampleData = [
        {
            type: 'heart_rate',
            value: 72,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            source: 'fitness_tracker',
            metadata: { activity: 'resting', heart_rate_zone: 'zone1' }
        },
        {
            type: 'steps',
            value: 8247,
            unit: 'steps',
            timestamp: new Date().toISOString(),
            source: 'smartphone',
            metadata: { activity: 'walking' }
        },
        {
            type: 'sleep',
            value: 7.5,
            unit: 'hours',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            source: 'sleep_tracker',
            metadata: { sleep_stage: 'deep_sleep' }
        },
        {
            type: 'blood_pressure',
            value: 120,
            unit: 'mmHg',
            timestamp: new Date().toISOString(),
            source: 'blood_pressure_monitor',
            metadata: { systolic: 120, diastolic: 80 }
        }
    ];
    
    console.log('📊 Indexing sample health data...');
    
    for (const data of sampleData) {
        await indexHealthData(data, 'demo_user');
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    console.log('✅ Sample health data indexed');
}

/**
 * Get fallback search results when MCP is unavailable
 */
function getFallbackSearchResults(query) {
    const fallbackData = [
        {
            id: 'fallback_1',
            score: 1.0,
            data_type: 'heart_rate',
            value: 72,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            source: 'cached',
            relevance: 'high'
        },
        {
            id: 'fallback_2',
            score: 0.8,
            data_type: 'steps',
            value: 8247,
            unit: 'steps',
            timestamp: new Date().toISOString(),
            source: 'cached',
            relevance: 'medium'
        }
    ];
    
    // Filter based on query
    const queryLower = query.toLowerCase();
    return fallbackData.filter(item => 
        item.data_type.includes(queryLower) || 
        queryLower.includes(item.data_type)
    );
}

/**
 * Update MCP status indicators in the UI
 */
function updateMCPStatusIndicators(connected) {
    const opensearchStatus = document.querySelector('[data-status="opensearch"]');
    const modeStatus = document.querySelector('[data-status="mode"]');
    
    if (opensearchStatus) {
        opensearchStatus.innerHTML = connected 
            ? '<span class="badge bg-success">Connected</span>'
            : '<span class="badge bg-warning">Not Connected</span>';
    }
    
    if (modeStatus && connected) {
        modeStatus.innerHTML = '<span class="badge bg-success">Live AI + Search</span>';
    }
    
    // Add MCP status indicator
    const mcpIndicator = document.getElementById('mcp-status-indicator');
    if (mcpIndicator) {
        mcpIndicator.innerHTML = connected
            ? '<i class="bi bi-check-circle-fill text-success"></i> OpenSearch MCP Active'
            : '<i class="bi bi-x-circle-fill text-warning"></i> OpenSearch MCP Offline';
    }
}

/**
 * Enhanced sendMessage function with OpenSearch integration
 */
async function enhancedSendMessage(message, userId = 'web_user') {
    try {
        // Search for relevant health data first
        const searchResults = await searchHealthData(message, userId);
        
        // Send to AI with search context
        const aiRequest = {
            message: message,
            user_id: userId,
            session_id: 'web_session',
            search_context: searchResults.success ? searchResults.results : []
        };
        
        const response = await fetch('<REDACTED_CREDENTIAL>', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(aiRequest)
        });
        
        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            success: true,
            response: data.response,
            searchUsed: searchResults.success,
            searchResults: searchResults.results || [],
            guardrailsActive: data.guardrails_active,
            fallbackUsed: data.fallback_used
        };
        
    } catch (error) {
        console.error('Enhanced message error:', error);
        return {
            success: false,
            error: error.message,
            response: "I'm having trouble processing your request with search capabilities right now."
        };
    }
}

/**
 * Add search results display to chat
 */
function displaySearchResults(results, chatMessages) {
    if (!results || results.length === 0) return;
    
    const searchDiv = document.createElement('div');
    searchDiv.className = 'search-results-display mb-3';
    searchDiv.innerHTML = `
        <div class="alert alert-info">
            <h6><i class="bi bi-search me-2"></i>Relevant Health Data Found</h6>
            <div class="row">
                ${results.slice(0, 3).map(result => `
                    <div class="col-md-4">
                        <div class="card card-sm">
                            <div class="card-body p-2">
                                <h6 class="card-title">${result.data_type}</h6>
                                <p class="card-text">${result.value} ${result.unit}</p>
                                <small class="text-muted">Relevance: ${result.relevance}</small>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <small class="text-muted">
                <i class="bi bi-database me-1"></i>
                Found ${results.length} matching health records
            </small>
        </div>
    `;
    
    chatMessages.appendChild(searchDiv);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOpenSearchMCP);
} else {
    initializeOpenSearchMCP();
}

// Export functions for global use
window.searchHealthData = searchHealthData;
window.indexHealthData = indexHealthData;
window.enhancedSendMessage = enhancedSendMessage;

console.log('🔍 OpenSearch MCP Integration loaded');
