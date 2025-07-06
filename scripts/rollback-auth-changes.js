#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages to fix (remove auth-guard.js)
const pages = [
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

console.log('🔄 Rolling Back Authentication Guard Changes\n');

pages.forEach(page => {
    const filePath = path.join(webDir, page);
    
    if (fs.existsSync(filePath)) {
        console.log(`Fixing ${page}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove the auth-guard.js script line
        const authGuardPattern = /\s*<!-- Authentication Guard - MUST BE FIRST -->\s*\n\s*<script src="js\/auth-guard\.js"><\/script>\s*\n?/g;
        
        if (authGuardPattern.test(content)) {
            content = content.replace(authGuardPattern, '');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Removed auth guard from ${page}`);
        } else {
            // Try alternative pattern
            const altPattern = /<script src="js\/auth-guard\.js"><\/script>\s*\n?/g;
            if (altPattern.test(content)) {
                content = content.replace(altPattern, '');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Removed auth guard from ${page} (alt pattern)`);
            } else {
                console.log(`ℹ️  No auth guard found in ${page}`);
            }
        }
    } else {
        console.log(`❌ File not found: ${page}`);
    }
});

console.log('\n🎯 Rollback Complete!');
console.log('\n✅ Changes Made:');
console.log('   • Removed auth-guard.js from all pages');
console.log('   • Pages should now load normally');
console.log('   • Authentication still works via cognito-auth-universal.js');

console.log('\n🚀 Next Steps:');
console.log('   1. Deploy updated files to S3');
console.log('   2. Invalidate CloudFront cache');
console.log('   3. Test pages load correctly');
