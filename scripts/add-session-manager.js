#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages to update
const pages = [
    'settings.html',
    'health-reports.html', 
    'search.html',
    'digital-analysis.html',
    'abha-integration.html',
    'wiki.html'
];

const webDir = path.join(__dirname, 'web');

// Session manager script tag to add
const sessionManagerScript = `
<!-- 30-Minute Session Manager -->
<script src="js/session-manager.js"></script>`;

pages.forEach(page => {
    const filePath = path.join(webDir, page);
    
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${page}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the cognito-auth-universal.js script tag and add session manager after it
        const cognitoScriptPattern = /(<script src="js\/cognito-auth-universal\.js"><\/script>)/;
        
        if (cognitoScriptPattern.test(content)) {
            content = content.replace(
                cognitoScriptPattern,
                `$1${sessionManagerScript}`
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated ${page}`);
        } else {
            console.log(`⚠️  Could not find cognito script in ${page}`);
        }
    } else {
        console.log(`❌ File not found: ${page}`);
    }
});

console.log('\n🎯 Session manager added to all pages!');
console.log('\n📋 Features added:');
console.log('   • 30-minute session duration');
console.log('   • Automatic token refresh every 5 minutes');
console.log('   • Session timer display in top-right corner');
console.log('   • Session expiry warnings');
console.log('   • Cross-page session persistence');
console.log('   • Session extension capability');
