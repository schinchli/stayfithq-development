#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages to protect (all except login.html)
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

const webDir = path.join(__dirname, 'web');

// Simple auth check script tag - add at the end of body
const simpleAuthScript = `    <!-- Simple Authentication Check -->
    <script src="js/simple-auth-check.js"></script>`;

console.log('🔒 Adding Simple Authentication Check to Protected Pages\n');

protectedPages.forEach(page => {
    const filePath = path.join(webDir, page);
    
    if (fs.existsSync(filePath)) {
        console.log(`Adding simple auth to ${page}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if simple auth is already present
        if (content.includes('simple-auth-check.js')) {
            console.log(`✅ ${page} already has simple auth`);
            return;
        }
        
        // Add before closing body tag
        const bodyClosePattern = /(<\/body>)/i;
        
        if (bodyClosePattern.test(content)) {
            content = content.replace(bodyClosePattern, `${simpleAuthScript}
$1`);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Added simple auth to ${page}`);
        } else {
            console.log(`⚠️  Could not find </body> tag in ${page}`);
        }
    } else {
        console.log(`❌ File not found: ${page}`);
    }
});

console.log('\n🎯 Simple Authentication Implementation Complete!');
console.log('\n🔒 Security Features:');
console.log('   • Non-blocking authentication check');
console.log('   • Runs after page loads completely');
console.log('   • Shows warning before redirect');
console.log('   • Preserves page functionality');
console.log('   • Only login.html remains public');

console.log('\n✅ Protected Pages:');
protectedPages.forEach(page => {
    console.log(`   • ${page}`);
});

console.log('\n🚀 Next Steps:');
console.log('   1. Deploy simple-auth-check.js to S3');
console.log('   2. Deploy updated HTML pages');
console.log('   3. Test authentication works without white screens');
