#!/usr/bin/env node

/**
 * StayFit Health Companion - CloudFront Deployment Test Suite
 * Validates website functionality, navigation, and consistency across all pages
 */

const https = require('https');
const { JSDOM } = require('jsdom');

// Configuration
const CLOUDFRONT_URL = 'https://YOUR-DOMAIN.cloudfront.net';
const AUTH_username = "your_username";
const AUTH_password = "your_secure_password";
const AUTH_HEADER = 'Basic ' + Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString('base64');

// Test configuration
const PAGES_TO_TEST = [
    { path: '/', name: 'Dashboard (Home)', file: 'index.html' },
    { path: '/health-reports.html', name: 'Health Reports', file: 'health-reports.html' },
    { path: '/analysis.html', name: 'Analysis', file: 'analysis.html' },
    { path: '/digital-analysis.html', name: 'Digital Analysis', file: 'digital-analysis.html' },
    { path: '/search.html', name: 'Search & AI Assistant', file: 'search.html' },
    { path: '/dashboard.html', name: 'Advanced Dashboard', file: 'dashboard.html' },
    { path: '/settings.html', name: 'Settings', file: 'settings.html' }
];

const EXPECTED_NAVIGATION_ITEMS = [
    { text: 'Dashboard', href: 'index.html' },
    { text: 'Health Reports', href: 'health-reports.html' },
    { text: 'Analysis', href: 'analysis.html' },
    { text: 'Digital Analysis', href: 'digital-analysis.html' },
    { text: 'Search & AI Assistant', href: 'search.html' },
    { text: 'Advanced Dashboard', href: 'dashboard.html' },
    { text: 'Settings', href: 'settings.html' }
];

// Test results storage
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, message, details = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`${testName}: ${message}`, 'success');
    } else {
        testResults.failed++;
        log(`${testName}: ${message}`, 'error');
    }
    
    testResults.details.push({
        test: testName,
        passed,
        message,
        details,
        timestamp: new Date().toISOString()
    });
}

// HTTP request helper with authentication
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            headers: {
                'Authorization': AUTH_HEADER,
                'User-Agent': 'StayFit-Test-Suite/1.0',
                ...options.headers
            },
            timeout: 10000
        };

        const req = https.get(url, requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    url: url
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test functions
async function testPageLoad(page) {
    const testName = `Page Load - ${page.name}`;
    const url = `${CLOUDFRONT_URL}${page.path}`;
    
    try {
        const response = await makeRequest(url);
        
        if (response.statusCode === 200) {
            addTestResult(testName, true, `Page loaded successfully (${response.statusCode})`);
            return response.body;
        } else {
            addTestResult(testName, false, `Page failed to load (${response.statusCode})`);
            return null;
        }
    } catch (error) {
        addTestResult(testName, false, `Page load error: ${error.message}`);
        return null;
    }
}

async function testAuthentication() {
    const testName = 'Authentication Test';
    const url = `${CLOUDFRONT_URL}/`;
    
    try {
        // Test without authentication
        const unauthResponse = await makeRequest(url, { headers: {} });
        
        if (unauthResponse.statusCode === 401) {
            addTestResult(testName, true, 'Authentication properly required (401 without credentials)');
        } else {
            addTestResult(testName, false, `Expected 401 without auth, got ${unauthResponse.statusCode}`);
        }
        
        // Test with authentication
        const authResponse = await makeRequest(url);
        
        if (authResponse.statusCode === 200) {
            addTestResult(testName + ' - Valid Credentials', true, 'Authentication successful with valid credentials');
        } else {
            addTestResult(testName + ' - Valid Credentials', false, `Expected 200 with auth, got ${authResponse.statusCode}`);
        }
        
    } catch (error) {
        addTestResult(testName, false, `Authentication test error: ${error.message}`);
    }
}

function testPageStructure(html, pageName) {
    const testName = `Page Structure - ${pageName}`;
    
    try {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Test for required elements
        const requiredElements = [
            { selector: 'title', name: 'Page Title' },
            { selector: '.sidebar', name: 'Sidebar Navigation' },
            { selector: '.main-content', name: 'Main Content Area' },
            { selector: '.page-header', name: 'Page Header' },
            { selector: '.footer', name: 'Footer' },
            { selector: '.mobile-menu-toggle', name: 'Mobile Menu Toggle' }
        ];
        
        let missingElements = [];
        
        requiredElements.forEach(element => {
            const found = document.querySelector(element.selector);
            if (!found) {
                missingElements.push(element.name);
            }
        });
        
        if (missingElements.length === 0) {
            addTestResult(testName, true, 'All required page elements found');
        } else {
            addTestResult(testName, false, `Missing elements: ${missingElements.join(', ')}`);
        }
        
        return document;
        
    } catch (error) {
        addTestResult(testName, false, `Page structure test error: ${error.message}`);
        return null;
    }
}

function testNavigation(document, pageName) {
    const testName = `Navigation - ${pageName}`;
    
    try {
        const navLinks = document.querySelectorAll('.nav-link');
        
        if (navLinks.length === 0) {
            addTestResult(testName, false, 'No navigation links found');
            return;
        }
        
        let foundNavItems = [];
        let missingNavItems = [];
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();
            foundNavItems.push({ href, text });
        });
        
        // Check if all expected navigation items are present
        EXPECTED_NAVIGATION_ITEMS.forEach(expectedItem => {
            const found = foundNavItems.some(item => 
                item.href === expectedItem.href && 
                item.text.includes(expectedItem.text.split(' ')[0]) // Partial match for flexibility
            );
            
            if (!found) {
                missingNavItems.push(expectedItem.text);
            }
        });
        
        if (missingNavItems.length === 0) {
            addTestResult(testName, true, `All ${foundNavItems.length} navigation items found`);
        } else {
            addTestResult(testName, false, `Missing navigation items: ${missingNavItems.join(', ')}`);
        }
        
        // Test for active navigation state
        const activeLinks = document.querySelectorAll('.nav-link.active');
        if (activeLinks.length > 0) {
            addTestResult(testName + ' - Active State', true, 'Active navigation state found');
        } else {
            addTestResult(testName + ' - Active State', false, 'No active navigation state found');
        }
        
    } catch (error) {
        addTestResult(testName, false, `Navigation test error: ${error.message}`);
    }
}

function testPageHeader(document, pageName) {
    const testName = `Page Header - ${pageName}`;
    
    try {
        const pageHeader = document.querySelector('.page-header');
        
        if (!pageHeader) {
            addTestResult(testName, false, 'Page header not found');
            return;
        }
        
        // Check for header elements
        const headerTitle = pageHeader.querySelector('h1, h2');
        const headerDivider = pageHeader.querySelector('.header-divider');
        const headerDescription = pageHeader.querySelector('p');
        
        let headerElements = [];
        if (headerTitle) headerElements.push('title');
        if (headerDivider) headerElements.push('divider');
        if (headerDescription) headerElements.push('description');
        
        if (headerElements.length >= 2) {
            addTestResult(testName, true, `Header contains: ${headerElements.join(', ')}`);
        } else {
            addTestResult(testName, false, `Incomplete header structure: ${headerElements.join(', ')}`);
        }
        
    } catch (error) {
        addTestResult(testName, false, `Page header test error: ${error.message}`);
    }
}

function testFooter(document, pageName) {
    const testName = `Footer - ${pageName}`;
    
    try {
        const footer = document.querySelector('.footer, footer');
        
        if (!footer) {
            addTestResult(testName, false, 'Footer not found');
            return;
        }
        
        const footerText = footer.textContent.trim();
        
        if (footerText.includes('StayFit Health Companion') && footerText.includes('2024')) {
            addTestResult(testName, true, 'Footer contains expected content');
        } else {
            addTestResult(testName, false, 'Footer missing expected content');
        }
        
    } catch (error) {
        addTestResult(testName, false, `Footer test error: ${error.message}`);
    }
}

function testResponsiveDesign(document, pageName) {
    const testName = `Responsive Design - ${pageName}`;
    
    try {
        // Check for viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        
        if (!viewportMeta) {
            addTestResult(testName, false, 'Viewport meta tag missing');
            return;
        }
        
        const viewportContent = viewportMeta.getAttribute('content');
        
        if (viewportContent && viewportContent.includes('width=device-width')) {
            addTestResult(testName, true, 'Responsive viewport meta tag found');
        } else {
            addTestResult(testName, false, 'Viewport meta tag incorrect');
        }
        
        // Check for Bootstrap CSS
        const bootstrapCSS = document.querySelector('link[href*="bootstrap"]');
        
        if (bootstrapCSS) {
            addTestResult(testName + ' - Bootstrap', true, 'Bootstrap CSS found');
        } else {
            addTestResult(testName + ' - Bootstrap', false, 'Bootstrap CSS not found');
        }
        
    } catch (error) {
        addTestResult(testName, false, `Responsive design test error: ${error.message}`);
    }
}

function testClickableElements(document, pageName) {
    const testName = `Clickable Elements - ${pageName}`;
    
    try {
        const buttons = document.querySelectorAll('button, .btn');
        const links = document.querySelectorAll('a[href]');
        
        let clickableCount = buttons.length + links.length;
        
        if (clickableCount > 0) {
            addTestResult(testName, true, `Found ${clickableCount} clickable elements (${buttons.length} buttons, ${links.length} links)`);
        } else {
            addTestResult(testName, false, 'No clickable elements found');
        }
        
        // Test for proper button classes
        let properlyStyledButtons = 0;
        buttons.forEach(button => {
            if (button.className.includes('btn')) {
                properlyStyledButtons++;
            }
        });
        
        if (properlyStyledButtons > 0) {
            addTestResult(testName + ' - Styling', true, `${properlyStyledButtons} properly styled buttons`);
        }
        
    } catch (error) {
        addTestResult(testName, false, `Clickable elements test error: ${error.message}`);
    }
}

async function testCSSAndAssets(document, pageName) {
    const testName = `CSS & Assets - ${pageName}`;
    
    try {
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        const jsScripts = document.querySelectorAll('script[src]');
        
        let cssCount = cssLinks.length;
        let jsCount = jsScripts.length;
        
        if (cssCount > 0) {
            addTestResult(testName + ' - CSS', true, `${cssCount} CSS files linked`);
        } else {
            addTestResult(testName + ' - CSS', false, 'No CSS files found');
        }
        
        if (jsCount > 0) {
            addTestResult(testName + ' - JS', true, `${jsCount} JavaScript files linked`);
        }
        
        // Test for unified CSS files
        const unifiedCSS = Array.from(cssLinks).some(link => 
            link.href.includes('bootstrap-theme-unified') ||
            link.href.includes('navigation-unified') ||
            link.href.includes('layout-unified')
        );
        
        if (unifiedCSS) {
            addTestResult(testName + ' - Unified CSS', true, 'Unified CSS files found');
        } else {
            addTestResult(testName + ' - Unified CSS', false, 'Unified CSS files not found');
        }
        
    } catch (error) {
        addTestResult(testName, false, `CSS & Assets test error: ${error.message}`);
    }
}

// Main test execution
async function runAllTests() {
    console.log('🚀 StayFit Health Companion - CloudFront Deployment Test Suite');
    console.log('<REDACTED_CREDENTIAL>========================');
    console.log(`Testing CloudFront URL: ${CLOUDFRONT_URL}`);
    console.log(`Authentication: ${AUTH_USERNAME}:${AUTH_PASSWORD.replace(/./g, '*')}`);
    console.log('');
    
    // Test authentication first
    await testAuthentication();
    
    // Test each page
    for (const page of PAGES_TO_TEST) {
        console.log(`\n📄 Testing page: ${page.name} (${page.path})`);
        console.log('─'.repeat(50));
        
        // Load the page
        const html = await testPageLoad(page);
        
        if (html) {
            // Parse and test page structure
            const document = testPageStructure(html, page.name);
            
            if (document) {
                // Run all page-specific tests
                testNavigation(document, page.name);
                testPageHeader(document, page.name);
                testFooter(document, page.name);
                testResponsiveDesign(document, page.name);
                testClickableElements(document, page.name);
                await testCSSAndAssets(document, page.name);
            }
        }
        
        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate final report
    generateTestReport();
}

function generateTestReport() {
    console.log('\n');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        console.log('─'.repeat(40));
        testResults.details
            .filter(result => !result.passed)
            .forEach(result => {
                console.log(`• ${result.test}: ${result.message}`);
            });
    }
    
    console.log('\n📋 DETAILED TEST REPORT:');
    console.log('─'.repeat(40));
    
    // Group results by page
    const pageResults = {};
    testResults.details.forEach(result => {
        const pageName = result.test.split(' - ')[1] || 'General';
        if (!pageResults[pageName]) {
            pageResults[pageName] = { passed: 0, failed: 0, tests: [] };
        }
        
        if (result.passed) {
            pageResults[pageName].passed++;
        } else {
            pageResults[pageName].failed++;
        }
        
        pageResults[pageName].tests.push(result);
    });
    
    Object.keys(pageResults).forEach(pageName => {
        const results = pageResults[pageName];
        const total = results.passed + results.failed;
        const successRate = ((results.passed / total) * 100).toFixed(1);
        
        console.log(`\n${pageName}: ${results.passed}/${total} tests passed (${successRate}%)`);
    });
    
    // Save detailed report to file
    const reportData = {
        timestamp: new Date().toISOString(),
        cloudfront_url: CLOUDFRONT_URL,
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            success_rate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
        },
        pages_tested: PAGES_TO_TEST.length,
        detailed_results: testResults.details
    };
    
    require('fs').writeFileSync(
        'cloudfront-test-report.json',
        JSON.stringify(reportData, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: cloudfront-test-report.json');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testResults,
    CLOUDFRONT_URL,
    PAGES_TO_TEST
};
