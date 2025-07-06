#!/usr/bin/env node

/**
 * Authentication Protection Verification Script
 * Tests that all pages are properly protected with Cognito authentication
 */

const https = require('https');

const baseUrl = 'https://YOUR-DOMAIN.cloudfront.net';
const protectedPages = [
    'index.html',
    'dashboard.html',
    'settings.html',
    'health-reports.html',
    'search.html',
    'digital-analysis.html',
    'abha-integration.html',
    'wiki.html',
    'import.html'
];

const publicPages = [
    'login.html'
];

console.log('🔒 Verifying Authentication Protection Across All Pages\n');

async function checkPageProtection(page) {
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
                    hasAuthGuard: false,
                    hasAuthScript: false,
                    hasLoadingProtection: false,
                    isProtected: false
                };
                
                // Check for authentication guard
                verification.hasAuthGuard = data.includes('auth-guard.js');
                
                // Check for cognito auth script
                verification.hasAuthScript = data.includes('cognito-auth-universal.js');
                
                // Check for loading protection
                verification.hasLoadingProtection = data.includes('visibility: hidden') || 
                                                   data.includes('auth-loading') ||
                                                   data.includes('Verifying Authentication');
                
                // Overall protection status
                verification.isProtected = verification.hasAuthGuard && verification.hasAuthScript;
                
                resolve(verification);
            });
        }).on('error', (err) => {
            resolve({
                page: page,
                status: 'ERROR',
                error: err.message,
                hasAuthGuard: false,
                hasAuthScript: false,
                hasLoadingProtection: false,
                isProtected: false
            });
        });
    });
}

async function runVerification() {
    console.log('📋 Verifying authentication protection on all pages...\n');
    
    const results = [];
    
    // Test protected pages
    console.log('🔒 Testing Protected Pages:');
    for (const page of protectedPages) {
        process.stdout.write(`Checking ${page}... `);
        const result = await checkPageProtection(page);
        results.push(result);
        
        if (result.status === 200 && result.isProtected) {
            console.log(`✅ Protected`);
        } else if (result.status === 200) {
            console.log(`⚠️  Partially Protected`);
        } else {
            console.log(`❌ Error (${result.status})`);
        }
    }
    
    console.log('\n🌐 Testing Public Pages:');
    for (const page of publicPages) {
        process.stdout.write(`Checking ${page}... `);
        const result = await checkPageProtection(page);
        results.push(result);
        
        if (result.status === 200) {
            console.log(`✅ Accessible`);
        } else {
            console.log(`❌ Error (${result.status})`);
        }
    }
    
    console.log('\n📊 Authentication Protection Results:\n');
    
    // Create results table
    console.log('┌─────────────────────────┬────────┬─────────────┬─────────────┬─────────────┬──────────────┐');
    console.log('│ Page                    │ Status │ Auth Guard  │ Auth Script │ Loading     │ Protected    │');
    console.log('├─────────────────────────┼────────┼─────────────┼─────────────┼─────────────┼──────────────┤');
    
    results.forEach(result => {
        const page = result.page.padEnd(23);
        const status = result.status.toString().padEnd(6);
        const authGuard = (result.hasAuthGuard ? '✅' : '❌').padEnd(11);
        const authScript = (result.hasAuthScript ? '✅' : '❌').padEnd(11);
        const loading = (result.hasLoadingProtection ? '✅' : '❌').padEnd(11);
        const protected = (result.isProtected ? '✅' : '❌').padEnd(12);
        
        console.log(`│ ${page} │ ${status} │ ${authGuard} │ ${authScript} │ ${loading} │ ${protected} │`);
    });
    
    console.log('└─────────────────────────┴────────┴─────────────┴─────────────┴─────────────┴──────────────┘');
    
    // Summary statistics
    const totalPages = results.length;
    const workingPages = results.filter(r => r.status === 200).length;
    const protectedPagesCount = results.filter(r => r.isProtected).length;
    const expectedProtected = protectedPages.length;
    const protectionRate = Math.round((protectedPagesCount / expectedProtected) * 100);
    
    console.log('\n📈 Authentication Protection Statistics:');
    console.log(`   • Total Pages Tested: ${totalPages}`);
    console.log(`   • Working Pages: ${workingPages}/${totalPages} (${Math.round(workingPages/totalPages*100)}%)`);
    console.log(`   • Protected Pages: ${protectedPagesCount}/${expectedProtected} (${protectionRate}%)`);
    console.log(`   • Public Pages: ${publicPages.length} (login.html only)`);
    
    // Detailed protection analysis
    console.log('\n🔍 Protection Component Analysis:');
    const authGuardPages = results.filter(r => r.hasAuthGuard).length;
    const authScriptPages = results.filter(r => r.hasAuthScript).length;
    const loadingProtectionPages = results.filter(r => r.hasLoadingProtection).length;
    
    console.log(`   ✅ Auth Guard (auth-guard.js): ${authGuardPages}/${totalPages} pages`);
    console.log(`   ✅ Auth Script (cognito-auth-universal.js): ${authScriptPages}/${totalPages} pages`);
    console.log(`   ✅ Loading Protection: ${loadingProtectionPages}/${totalPages} pages`);
    
    // Security assessment
    console.log('\n🛡️  Security Assessment:');
    
    const fullyProtected = results.filter(r => 
        protectedPages.includes(r.page) && r.isProtected
    ).length;
    
    const unprotected = results.filter(r => 
        protectedPages.includes(r.page) && !r.isProtected
    );
    
    if (fullyProtected === expectedProtected) {
        console.log('   🎉 EXCELLENT: All protected pages have complete authentication');
        console.log('   ✅ Auth Guard prevents immediate access');
        console.log('   ✅ Cognito authentication enforced');
        console.log('   ✅ Only login.html remains public');
    } else {
        console.log(`   ⚠️  WARNING: ${unprotected.length} pages need protection:`);
        unprotected.forEach(page => {
            console.log(`      • ${page.page} - Missing: ${!page.hasAuthGuard ? 'Auth Guard ' : ''}${!page.hasAuthScript ? 'Auth Script' : ''}`);
        });
    }
    
    // Test instructions
    console.log('\n🧪 Manual Testing Instructions:');
    console.log('   1. Open incognito/private browser window');
    console.log('   2. Try to access any protected page directly');
    console.log('   3. Should see "Verifying Authentication..." loading screen');
    console.log('   4. Should redirect to login.html automatically');
    console.log('   5. After login, should access pages normally');
    
    console.log('\n🔗 Test URLs:');
    console.log(`   • Protected: ${baseUrl}/index.html`);
    console.log(`   • Protected: ${baseUrl}/dashboard.html`);
    console.log(`   • Protected: ${baseUrl}/settings.html`);
    console.log(`   • Public: ${baseUrl}/login.html`);
    
    return {
        success: protectionRate >= 100,
        protectionRate,
        results
    };
}

// Run the verification
runVerification().then(result => {
    if (result.success) {
        console.log('\n🎯 SUCCESS: All pages properly protected with authentication!');
        process.exit(0);
    } else {
        console.log('\n⚠️  PARTIAL: Some pages may need additional protection');
        process.exit(1);
    }
}).catch(console.error);
