#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages to update (all pages with navigation)
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

// Import navigation link to add before Settings
const importNavLink = `            <a class="nav-link" href="https://YOUR-DOMAIN.cloudfront.net/import.html">
                <i class="bi bi-cloud-upload"></i>
                <span>Health Data Import</span>
            </a>`;

console.log('📥 Adding Health Data Import to Navigation Menu\n');

pages.forEach(page => {
    const filePath = path.join(webDir, page);
    
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${page}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the Settings nav-link and add Import before it
        const settingsPattern = /(\s*<a class="nav-link[^"]*" href="settings\.html">\s*<i class="bi bi-gear"><\/i>\s*<span>Settings<\/span>\s*<\/a>)/;
        
        if (settingsPattern.test(content)) {
            // Check if import link already exists
            if (!content.includes('Health Data Import') && !content.includes('import.html')) {
                content = content.replace(settingsPattern, `${importNavLink}
$1`);
                
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Added Import link to ${page}`);
            } else {
                console.log(`ℹ️  Import link already exists in ${page}`);
            }
        } else {
            console.log(`⚠️  Could not find Settings link pattern in ${page}`);
        }
    } else {
        console.log(`❌ File not found: ${page}`);
    }
});

console.log('\n🎯 Health Data Import Navigation Update Complete!');
console.log('\n📋 Navigation Menu Order (Updated):');
console.log('   1. 🏠 Dashboard');
console.log('   2. 📋 Health Reports');
console.log('   3. 🖥️  Digital Analysis');
console.log('   4. 🔍 AI Search');
console.log('   5. 📥 Health Data Import ← NEW');
console.log('   6. ⚙️  Settings');
console.log('   7. 📚 Wiki');

console.log('\n🔗 Import Page Details:');
console.log('   • URL: https://YOUR-DOMAIN.cloudfront.net/import.html');
console.log('   • Title: Health Data Import');
console.log('   • Icon: bi-cloud-upload (cloud upload icon)');
console.log('   • Position: Before Settings page');
console.log('   • Purpose: Import and analyze health data with AI insights');

console.log('\n✨ Features:');
console.log('   • Cross-distribution link (YOUR-DOMAIN.cloudfront.net)');
console.log('   • Consistent styling with existing navigation');
console.log('   • Professional cloud upload icon');
console.log('   • Logical placement in workflow');
