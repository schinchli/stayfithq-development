#!/usr/bin/env node

/**
 * Update all documentation files to remove last updated date
 * Keep consistent footer styling across all markdown files
 */

const fs = require('fs');
const path = require('path');

const docFiles = [
    'FEATURES.md',
    'API_DOCUMENTATION.md', 
    'DEPLOYMENT_GUIDE.md',
    'PRODUCTION_MCP_STATUS.md',
    'ENHANCED_FEATURES.md'
];

function updateDocFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // Remove last updated date patterns
        const datePatterns = [
            /\*Last Updated: [^*]*\*/g,
            /Last Updated: [^\n]*/g,
            /\n\*Last Updated: [^*]*\*\n/g
        ];

        for (const pattern of datePatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, '');
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error updating ${filePath}: ${error.message}`);
        return false;
    }
}

// Main execution
console.log('🔄 Removing last updated dates from documentation files...\n');

let updatedCount = 0;
for (const file of docFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        if (updateDocFile(filePath)) {
            updatedCount++;
        }
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
}

console.log(`\n🎉 Documentation update complete!`);
console.log(`📊 Updated ${updatedCount} out of ${docFiles.length} documentation files`);
console.log(`\n✨ Changes made:`);
console.log(`   - ❌ Removed "Last Updated" dates from all documentation`);
console.log(`   - ✅ Kept consistent footer attribution`);
console.log(`   - ✅ Maintained professional healthcare branding`);
console.log(`   - ✅ Clean, timeless documentation appearance`);
