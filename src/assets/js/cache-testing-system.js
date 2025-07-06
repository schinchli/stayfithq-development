/**
 * Cache Testing System for StayFit Health Companion
 * Tests and verifies cache functionality on settings page
 */

// Cache testing configuration
const CACHE_TEST_CONFIG = {
    testInterval: 5000, // 5 seconds
    maxRetries: 3,
    timeoutMs: 10000
};

// Cache test results
let cacheTestResults = {
    initialized: false,
    lastTested: null,
    tests: {
        localStorage: { status: 'pending', message: '', tested_at: null },
        sampleQuestions: { status: 'pending', message: '', tested_at: null },
        cacheSize: { status: 'pending', message: '', tested_at: null },
        cacheExpiry: { status: 'pending', message: '', tested_at: null },
        functionality: { status: 'pending', message: '', tested_at: null }
    },
    overall: { status: 'pending', score: 0, total: 5 }
};

/**
 * Initialize cache testing system
 */
function initializeCacheTestingSystem() {
    console.log('🧪 Initializing Cache Testing System...');
    
    try {
        // Run initial tests
        runAllCacheTests();
        
        // Set up periodic testing
        setInterval(runAllCacheTests, CACHE_TEST_CONFIG.testInterval);
        
        // Update UI
        updateCacheTestUI();
        
        cacheTestResults.initialized = true;
        console.log('✅ Cache Testing System initialized');
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Cache Testing System:', error);
        return false;
    }
}

/**
 * Run all cache tests
 */
async function runAllCacheTests() {
    console.log('🔬 Running cache tests...');
    
    cacheTestResults.lastTested = new Date().toISOString();
    
    // Test 1: LocalStorage availability
    await testLocalStorageAvailability();
    
    // Test 2: Sample questions cache
    await testSampleQuestionsCache();
    
    // Test 3: Cache size and performance
    await testCacheSize();
    
    // Test 4: Cache expiry mechanism
    await testCacheExpiry();
    
    // Test 5: Functional testing
    await testCacheFunctionality();
    
    // Calculate overall score
    calculateOverallScore();
    
    // Update UI
    updateCacheTestUI();
    
    console.log('✅ Cache tests completed');
}

/**
 * Test LocalStorage availability
 */
async function testLocalStorageAvailability() {
    const test = cacheTestResults.tests.localStorage;
    test.tested_at = new Date().toISOString();
    
    try {
        // Test localStorage write/read
        const testKey = 'stayfit_cache_test';
        const testValue = 'test_' + Date.now();
        
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === testValue) {
            test.status = 'passed';
            test.message = 'LocalStorage read/write working correctly';
        } else {
            test.status = 'failed';
            test.message = 'LocalStorage read/write mismatch';
        }
    } catch (error) {
        test.status = 'failed';
        test.message = `LocalStorage error: ${error.message}`;
    }
}

/**
 * Test sample questions cache
 */
async function testSampleQuestionsCache() {
    const test = cacheTestResults.tests.sampleQuestions;
    test.tested_at = new Date().toISOString();
    
    try {
        const cacheKey = 'stayfit_sample_questions_cache';
        const cacheData = localStorage.getItem(cacheKey);
        
        if (!cacheData) {
            test.status = 'failed';
            test.message = 'Sample questions cache not found';
            return;
        }
        
        const parsed = JSON.parse(cacheData);
        const questionCount = Object.keys(parsed.questions || {}).length;
        
        if (questionCount >= 5) {
            test.status = 'passed';
            test.message = `${questionCount} sample questions cached successfully`;
        } else {
            test.status = 'warning';
            test.message = `Only ${questionCount} questions cached (expected 5)`;
        }
    } catch (error) {
        test.status = 'failed';
        test.message = `Cache parsing error: ${error.message}`;
    }
}

/**
 * Test cache size and performance
 */
async function testCacheSize() {
    const test = cacheTestResults.tests.cacheSize;
    test.tested_at = new Date().toISOString();
    
    try {
        const cacheKey = 'stayfit_sample_questions_cache';
        const cacheData = localStorage.getItem(cacheKey);
        
        if (!cacheData) {
            test.status = 'failed';
            test.message = 'No cache data to measure';
            return;
        }
        
        const sizeBytes = new Blob([cacheData]).size;
        const sizeKB = Math.round(sizeBytes / 1024 * 100) / 100;
        
        if (sizeKB > 0 && sizeKB < 1000) { // Reasonable size limits
            test.status = 'passed';
            test.message = `Cache size: ${sizeKB} KB (optimal)`;
        } else if (sizeKB >= 1000) {
            test.status = 'warning';
            test.message = `Cache size: ${sizeKB} KB (large)`;
        } else {
            test.status = 'failed';
            test.message = 'Cache size calculation failed';
        }
    } catch (error) {
        test.status = 'failed';
        test.message = `Size calculation error: ${error.message}`;
    }
}

/**
 * Test cache expiry mechanism
 */
async function testCacheExpiry() {
    const test = cacheTestResults.tests.cacheExpiry;
    test.tested_at = new Date().toISOString();
    
    try {
        const cacheKey = 'stayfit_sample_questions_cache';
        const cacheData = localStorage.getItem(cacheKey);
        
        if (!cacheData) {
            test.status = 'failed';
            test.message = 'No cache data to check expiry';
            return;
        }
        
        const parsed = JSON.parse(cacheData);
        const expiresAt = new Date(parsed.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
            const hoursLeft = Math.round((expiresAt - now) / (1000 * 60 * 60) * 10) / 10;
            test.status = 'passed';
            test.message = `Cache expires in ${hoursLeft} hours`;
        } else {
            test.status = 'warning';
            test.message = 'Cache has expired and needs refresh';
        }
    } catch (error) {
        test.status = 'failed';
        test.message = `Expiry check error: ${error.message}`;
    }
}

/**
 * Test cache functionality
 */
async function testCacheFunctionality() {
    const test = cacheTestResults.tests.functionality;
    test.tested_at = new Date().toISOString();
    
    try {
        // Test if cache functions are available
        const functionsAvailable = [
            typeof window.getCachedSampleResponse === 'function',
            typeof window.isSampleQuestion === 'function',
            typeof window.getCacheStats === 'function'
        ];
        
        const availableCount = functionsAvailable.filter(Boolean).length;
        
        if (availableCount === 3) {
            // Test actual functionality
            const testQuestion = 'Show me my steps from last week';
            const cachedResponse = window.getCachedSampleResponse ? 
                window.getCachedSampleResponse(testQuestion) : null;
            
            if (cachedResponse && cachedResponse.response) {
                test.status = 'passed';
                test.message = 'All cache functions working correctly';
            } else {
                test.status = 'warning';
                test.message = 'Functions available but cache retrieval failed';
            }
        } else {
            test.status = 'failed';
            test.message = `Only ${availableCount}/3 cache functions available`;
        }
    } catch (error) {
        test.status = 'failed';
        test.message = `Functionality test error: ${error.message}`;
    }
}

/**
 * Calculate overall test score
 */
function calculateOverallScore() {
    const tests = cacheTestResults.tests;
    let score = 0;
    let total = 0;
    
    Object.values(tests).forEach(test => {
        total++;
        if (test.status === 'passed') score++;
        else if (test.status === 'warning') score += 0.5;
    });
    
    cacheTestResults.overall.score = score;
    cacheTestResults.overall.total = total;
    
    if (score === total) {
        cacheTestResults.overall.status = 'passed';
    } else if (score >= total * 0.7) {
        cacheTestResults.overall.status = 'warning';
    } else {
        cacheTestResults.overall.status = 'failed';
    }
}

/**
 * Update cache test UI
 */
function updateCacheTestUI() {
    // Update system status indicator
    updateSystemStatusIndicator();
    
    // Update detailed test results if panel exists
    updateDetailedTestResults();
    
    // Update cache statistics
    updateCacheStatistics();
}

/**
 * Update system status indicator
 */
function updateSystemStatusIndicator() {
    const systemStatus = document.querySelector('.alert-success');
    if (!systemStatus) return;
    
    const overall = cacheTestResults.overall;
    const percentage = Math.round((overall.score / overall.total) * 100);
    
    // Find or create cache test indicator
    let cacheTestSpan = systemStatus.querySelector('.cache-test-status');
    if (!cacheTestSpan) {
        cacheTestSpan = document.createElement('span');
        cacheTestSpan.className = 'cache-test-status ms-3';
        systemStatus.querySelector('.flex-grow-1').appendChild(cacheTestSpan);
    }
    
    const statusClass = overall.status === 'passed' ? 'success' : 
                       overall.status === 'warning' ? 'warning' : 'danger';
    
    cacheTestSpan.innerHTML = `Cache Tests: <strong class="text-${statusClass}">${percentage}% (${overall.score}/${overall.total})</strong>`;
}

/**
 * Update detailed test results
 */
function updateDetailedTestResults() {
    const testResultsContainer = document.getElementById('cacheTestResults');
    if (!testResultsContainer) return;
    
    const tests = cacheTestResults.tests;
    let html = '<div class="row">';
    
    Object.entries(tests).forEach(([testName, result]) => {
        const statusIcon = result.status === 'passed' ? 'check-circle-fill text-success' :
                          result.status === 'warning' ? 'exclamation-triangle-fill text-warning' :
                          'x-circle-fill text-danger';
        
        html += `
            <div class="col-md-6 mb-2">
                <div class="d-flex align-items-center">
                    <i class="bi bi-${statusIcon} me-2"></i>
                    <div>
                        <strong>${testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong><br>
                        <small class="text-muted">${result.message}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    testResultsContainer.innerHTML = html;
}

/**
 * Update cache statistics
 */
function updateCacheStatistics() {
    if (typeof window.getCacheStats === 'function') {
        const stats = window.getCacheStats();
        
        // Update cache stats display if it exists
        const statsContainer = document.getElementById('cacheStats');
        if (statsContainer && stats.enabled) {
            statsContainer.innerHTML = `
                <div class="small text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Cache: ${stats.cached_questions} questions, 
                    ${Math.round(stats.cache_size / 1024)} KB, 
                    expires ${new Date(stats.expires_at).toLocaleDateString()}
                </div>
            `;
        }
    }
}

/**
 * Show detailed cache test results
 */
function showDetailedCacheTests() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-clipboard-check me-2"></i>Cache System Test Results
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <strong>Overall Status:</strong> ${cacheTestResults.overall.status.toUpperCase()} 
                        (${cacheTestResults.overall.score}/${cacheTestResults.overall.total} tests passed)
                        <br><small>Last tested: ${new Date(cacheTestResults.lastTested).toLocaleString()}</small>
                    </div>
                    <div id="cacheTestResults"></div>
                    <div id="cacheStats" class="mt-3"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="runAllCacheTests()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Run Tests Again
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Update results in modal
    updateDetailedTestResults();
    updateCacheStatistics();
    
    // Clean up when modal is hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCacheTestingSystem);
} else {
    initializeCacheTestingSystem();
}

// Export functions for global use
window.runAllCacheTests = runAllCacheTests;
window.showDetailedCacheTests = showDetailedCacheTests;
window.cacheTestResults = cacheTestResults;

console.log('🧪 Cache Testing System loaded');
