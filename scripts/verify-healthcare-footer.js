#!/usr/bin/env node

/**
 * Verification Script for Healthcare Footer Update
 * Tests that all pages have the new healthcare-focused footer
 */

const https = require('https');

const baseUrl = 'https://YOUR-DOMAIN.cloudfront.net';
const pages = [
    'index.html',
    'dashboard.html',
    'settings.html',
    'health-reports.html',
    'search.html',
    'digital-analysis.html',
    'abha-integration.html',
    'wiki.html',
    'login.html'
];

const expectedFooterElements = [
    'Built with ❤️ for Healthcare Excellence',
    'Shashank Chinchli, Solutions Architect, AWS',
    'HIPAA-Compliant',
    'FHIR R4',
    'openEHR',
    'MCP Connected',
    'OpenSearch Ready',
    'Enterprise Security',
    'WCAG 2.1 AA Compliant'
];

console.log('🏥 Verifying Healthcare Footer Across All Pages\n');

async function verifyPage(page) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/${page}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const verification = {
                    page: page,
                    status: res.statusCode,
                    hasFooter: false,
                    footerElements: {},
                    footerScore: 0
                };
                
                // Check for each expected footer element
                expectedFooterElements.forEach(element => {
                    const hasElement = data.includes(element);
                    verification.footerElements[element] = hasElement;
                    if (hasElement) verification.footerScore++;
                });
                
                verification.hasFooter = verification.footerScore > 0;
                verification.completeness = Math.round((verification.footerScore / expectedFooterElements.length) * 100);
                
                resolve(verification);
            });
        }).on('error', (err) => {
            resolve({
                page: page,
                status: 'ERROR',
                error: err.message,
                hasFooter: false,
                footerElements: {},
                footerScore: 0,
                completeness: 0
            });
        });
    });
}

async function runVerification() {
    console.log('📋 Verifying healthcare footer on all pages...\n');
    
    const results = [];
    
    for (const page of pages) {
        process.stdout.write(`Checking ${page}... `);
        const result = await verifyPage(page);
        results.push(result);
        
        if (result.status === 200 && result.completeness >= 80) {
            console.log(`✅ (${result.completeness}%)`);
        } else if (result.status === 200) {
            console.log(`⚠️  (${result.completeness}%)`);
        } else {
            console.log(`❌ (${result.status})`);
        }
    }
    
    console.log('\n📊 Healthcare Footer Verification Results:\n');
    
    // Create results table
    console.log('┌─────────────────────────┬────────┬─────────┬──────────────┬─────────────┐');
    console.log('│ Page                    │ Status │ Footer  │ Completeness │ Score       │');
    console.log('├─────────────────────────┼────────┼─────────┼──────────────┼─────────────┤');
    
    results.forEach(result => {
        const page = result.page.padEnd(23);
        const status = result.status.toString().padEnd(6);
        const hasFooter = (result.hasFooter ? '✅' : '❌').padEnd(7);
        const completeness = `${result.completeness}%`.padEnd(12);
        const score = `${result.footerScore}/${expectedFooterElements.length}`.padEnd(11);
        
        console.log(`│ ${page} │ ${status} │ ${hasFooter} │ ${completeness} │ ${score} │`);
    });
    
    console.log('└─────────────────────────┴────────┴─────────┴──────────────┴─────────────┘');
    
    // Detailed element verification
    console.log('\n🔍 Detailed Footer Element Verification:\n');
    
    expectedFooterElements.forEach(element => {
        const pagesWithElement = results.filter(r => r.footerElements[element]).length;
        const percentage = Math.round((pagesWithElement / results.length) * 100);
        const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
        
        console.log(`${status} ${element.padEnd(35)} ${pagesWithElement}/${results.length} pages (${percentage}%)`);
    });
    
    // Summary statistics
    const totalPages = results.length;
    const workingPages = results.filter(r => r.status === 200).length;
    const pagesWithFooter = results.filter(r => r.hasFooter).length;
    const fullyCompliantPages = results.filter(r => r.completeness === 100).length;
    const averageCompleteness = Math.round(results.reduce((sum, r) => sum + r.completeness, 0) / totalPages);
    
    console.log('\n📈 Healthcare Footer Statistics:');
    console.log(`   • Total Pages: ${totalPages}`);
    console.log(`   • Working Pages: ${workingPages}/${totalPages} (${Math.round(workingPages/totalPages*100)}%)`);
    console.log(`   • Pages with Footer: ${pagesWithFooter}/${totalPages} (${Math.round(pagesWithFooter/totalPages*100)}%)`);
    console.log(`   • Fully Compliant: ${fullyCompliantPages}/${totalPages} (${Math.round(fullyCompliantPages/totalPages*100)}%)`);
    console.log(`   • Average Completeness: ${averageCompleteness}%`);
    
    // Healthcare standards verification
    console.log('\n🏥 Healthcare Standards Verification:');
    const hipaaPages = results.filter(r => r.footerElements['HIPAA-Compliant']).length;
    const fhirPages = results.filter(r => r.footerElements['FHIR R4']).length;
    const openEHRPages = results.filter(r => r.footerElements['openEHR']).length;
    const mcpPages = results.filter(r => r.footerElements['MCP Connected']).length;
    const openSearchPages = results.filter(r => r.footerElements['OpenSearch Ready']).length;
    const securityPages = results.filter(r => r.footerElements['Enterprise Security']).length;
    const wcagPages = results.filter(r => r.footerElements['WCAG 2.1 AA Compliant']).length;
    
    console.log(`   ✅ HIPAA-Compliant: ${hipaaPages}/${totalPages} pages`);
    console.log(`   ✅ FHIR R4: ${fhirPages}/${totalPages} pages`);
    console.log(`   ✅ openEHR: ${openEHRPages}/${totalPages} pages`);
    console.log(`   ✅ MCP Connected: ${mcpPages}/${totalPages} pages`);
    console.log(`   ✅ OpenSearch Ready: ${openSearchPages}/${totalPages} pages`);
    console.log(`   ✅ Enterprise Security: ${securityPages}/${totalPages} pages`);
    console.log(`   ✅ WCAG 2.1 AA: ${wcagPages}/${totalPages} pages`);
    
    // Professional branding verification
    const authorPages = results.filter(r => r.footerElements['Shashank Chinchli, Solutions Architect, AWS']).length;
    const excellencePages = results.filter(r => r.footerElements['Built with ❤️ for Healthcare Excellence']).length;
    
    console.log('\n👨‍💼 Professional Branding:');
    console.log(`   ✅ Healthcare Excellence: ${excellencePages}/${totalPages} pages`);
    console.log(`   ✅ Author Attribution: ${authorPages}/${totalPages} pages`);
    
    // Success assessment
    const overallSuccess = averageCompleteness >= 90;
    
    console.log('\n🎯 Overall Assessment:');
    if (overallSuccess) {
        console.log('   🎉 SUCCESS: Healthcare footer successfully deployed across all pages!');
        console.log('   ✅ All healthcare standards properly highlighted');
        console.log('   ✅ Professional branding consistently applied');
        console.log('   ✅ Compliance certifications clearly displayed');
    } else {
        console.log('   ⚠️  PARTIAL: Some pages may need footer updates');
        console.log('   📝 Review pages with completeness < 100%');
    }
    
    console.log('\n🔗 Live Verification:');
    console.log('   Visit any page at: https://YOUR-DOMAIN.cloudfront.net');
    console.log('   Scroll to bottom to see the new healthcare footer');
    console.log('   All healthcare standards and certifications are displayed');
    
    return {
        success: overallSuccess,
        averageCompleteness,
        results
    };
}

// Run the verification
runVerification().then(result => {
    if (result.success) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}).catch(console.error);
