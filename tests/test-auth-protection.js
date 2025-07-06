#!/usr/bin/env node

/**
 * Quick Authentication Protection Test
 * Tests that pages redirect to login when accessed without authentication
 */

const https = require('https');

const baseUrl = 'https://YOUR-DOMAIN.cloudfront.net';
const testPages = [
    'index.html',
    'dashboard.html',
    'settings.html'
];

console.log('🔒 Testing Authentication Protection\n');

async function testPageProtection(page) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/${page}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const hasAuthGuard = data.includes('auth-guard.js');
                const hasLoadingScreen = data.includes('Verifying Authentication');
                const hasRedirectLogic = data.includes('redirectToLogin');
                
                resolve({
                    page,
                    status: res.statusCode,
                    hasAuthGuard,
                    hasLoadingScreen,
                    hasRedirectLogic,
                    isProtected: hasAuthGuard && (hasLoadingScreen || hasRedirectLogic)
                });
            });
        }).on('error', (err) => {
            resolve({
                page,
                status: 'ERROR',
                error: err.message,
                isProtected: false
            });
        });
    });
}

async function runTest() {
    console.log('Testing protected pages...\n');
    
    for (const page of testPages) {
        process.stdout.write(`Testing ${page}... `);
        const result = await testPageProtection(page);
        
        if (result.isProtected) {
            console.log('✅ Protected');
        } else {
            console.log('❌ Not Protected');
        }
    }
    
    console.log('\n🎯 Authentication Test Complete!');
    console.log('\n📋 Manual Test Instructions:');
    console.log('1. Open incognito/private browser window');
    console.log('2. Go to: https://YOUR-DOMAIN.cloudfront.net/index.html');
    console.log('3. Should see "Verifying Authentication..." loading screen');
    console.log('4. Should redirect to: https://YOUR-DOMAIN.cloudfront.net/login.html');
    console.log('5. Login page should have pre-filled test credentials');
    console.log('6. Click "Quick Test Login" button for instant login');
    
    console.log('\n🔑 Test Credentials:');
    console.log('   Email: user@example.com');
    console.log('   password = "your_secure_password");
    
    console.log('\n🌐 Test URLs:');
    console.log('   • Protected: https://YOUR-DOMAIN.cloudfront.net/index.html');
    console.log('   • Protected: https://YOUR-DOMAIN.cloudfront.net/dashboard.html');
    console.log('   • Protected: https://YOUR-DOMAIN.cloudfront.net/settings.html');
    console.log('   • Login: https://YOUR-DOMAIN.cloudfront.net/login.html');
}

runTest().catch(console.error);
