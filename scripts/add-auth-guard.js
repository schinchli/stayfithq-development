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

// Authentication guard script tag - must be first script in head
const authGuardScript = `    <!-- Authentication Guard - MUST BE FIRST -->
    <script src="js/auth-guard.js"></script>`;

console.log('🔒 Adding Authentication Guard to All Protected Pages\n');

protectedPages.forEach(page => {
    const filePath = path.join(webDir, page);
    
    if (fs.existsSync(filePath)) {
        console.log(`Protecting ${page}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if auth guard is already present
        if (content.includes('auth-guard.js')) {
            console.log(`✅ ${page} already protected`);
            return;
        }
        
        // Find the first script tag in head and add auth guard before it
        const firstScriptPattern = /(<head[^>]*>[\s\S]*?)(<script[^>]*>)/i;
        
        if (firstScriptPattern.test(content)) {
            content = content.replace(firstScriptPattern, `$1${authGuardScript}
    $2`);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Added auth guard to ${page}`);
        } else {
            // Fallback: add after <head> tag
            const headPattern = /(<head[^>]*>)/i;
            if (headPattern.test(content)) {
                content = content.replace(headPattern, `$1
${authGuardScript}`);
                
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Added auth guard to ${page} (fallback)`);
            } else {
                console.log(`⚠️  Could not add auth guard to ${page}`);
            }
        }
    } else {
        console.log(`❌ File not found: ${page}`);
    }
});

console.log('\n🎯 Authentication Guard Implementation Complete!');
console.log('\n🔒 Security Features Added:');
console.log('   • Immediate authentication check before page load');
console.log('   • Page content hidden until authentication verified');
console.log('   • Automatic redirect to login for unauthenticated users');
console.log('   • Token expiration validation');
console.log('   • Loading indicator during authentication check');
console.log('   • Only login.html remains public');

console.log('\n✅ Protected Pages:');
protectedPages.forEach(page => {
    console.log(`   • ${page}`);
});

console.log('\n🌐 Public Pages:');
console.log('   • login.html (only public page)');

console.log('\n🚀 Next Steps:');
console.log('   1. Deploy updated files to S3');
console.log('   2. Invalidate CloudFront cache');
console.log('   3. Test authentication on all pages');
