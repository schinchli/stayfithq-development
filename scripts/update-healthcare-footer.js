#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// New healthcare-focused footer
const newFooter = `Built with ❤️ for Healthcare Excellence by Shashank Chinchli, Solutions Architect, AWS </br>*HIPAA-Compliant • FHIR R4 • openEHR • MCP Connected • OpenSearch Ready • Enterprise Security • WCAG 2.1 AA Compliant`;

// Pages to update
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

const webDir = path.join(__dirname, 'web');

console.log('🏥 Updating Healthcare Footer Across All Pages\n');

pages.forEach(page => {
    const filePath = path.join(webDir, page);
    
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${page}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Common footer patterns to replace
        const footerPatterns = [
            // Pattern 1: Footer with copyright
            /<footer[^>]*>[\s\S]*?<\/footer>/gi,
            // Pattern 2: Footer div with text-center
            /<div[^>]*class="[^"]*text-center[^"]*"[^>]*>[\s\S]*?Built with.*?<\/div>/gi,
            // Pattern 3: Simple footer text
            /Built with.*?(?=<\/|$)/gi,
            // Pattern 4: Footer section
            /<section[^>]*>[\s\S]*?Built with[\s\S]*?<\/section>/gi
        ];
        
        let updated = false;
        
        // Try each pattern
        footerPatterns.forEach(pattern => {
            if (pattern.test(content) && !updated) {
                content = content.replace(pattern, (match) => {
                    // Preserve the opening tag structure but replace content
                    if (match.includes('<footer')) {
                        return `<footer class="bg-light text-center py-4 mt-5">
    <div class="container">
        <p class="mb-0 text-muted small">
            ${newFooter}
        </p>
    </div>
</footer>`;
                    } else if (match.includes('<div')) {
                        return `<div class="text-center py-4 mt-5 bg-light">
    <p class="mb-0 text-muted small">
        ${newFooter}
    </p>
</div>`;
                    } else if (match.includes('<section')) {
                        return `<section class="bg-light text-center py-4 mt-5">
    <div class="container">
        <p class="mb-0 text-muted small">
            ${newFooter}
        </p>
    </div>
</section>`;
                    } else {
                        return newFooter;
                    }
                });
                updated = true;
            }
        });
        
        // If no existing footer found, add one before closing body tag
        if (!updated) {
            const bodyClosePattern = /<\/body>/i;
            if (bodyClosePattern.test(content)) {
                content = content.replace(bodyClosePattern, `
<footer class="bg-light text-center py-4 mt-5">
    <div class="container">
        <p class="mb-0 text-muted small">
            ${newFooter}
        </p>
    </div>
</footer>

</body>`);
                updated = true;
            }
        }
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated ${page}`);
        } else {
            console.log(`⚠️  Could not find footer pattern in ${page}`);
        }
    } else {
        console.log(`❌ File not found: ${page}`);
    }
});

console.log('\n🎯 Healthcare Footer Update Complete!');
console.log('\n📋 New Footer Features:');
console.log('   • Healthcare Excellence branding');
console.log('   • Shashank Chinchli, Solutions Architect, AWS attribution');
console.log('   • HIPAA-Compliant certification');
console.log('   • FHIR R4 standard compliance');
console.log('   • openEHR integration ready');
console.log('   • MCP Connected architecture');
console.log('   • OpenSearch Ready for analytics');
console.log('   • Enterprise Security implementation');
console.log('   • WCAG 2.1 AA Accessibility Compliant');

console.log('\n🏥 Healthcare Standards Highlighted:');
console.log('   ✅ HIPAA-Compliant - Healthcare data protection');
console.log('   ✅ FHIR R4 - Fast Healthcare Interoperability Resources');
console.log('   ✅ openEHR - Open Electronic Health Records');
console.log('   ✅ MCP Connected - Model Context Protocol integration');
console.log('   ✅ OpenSearch Ready - Advanced healthcare analytics');
console.log('   ✅ Enterprise Security - Multi-layer protection');
console.log('   ✅ WCAG 2.1 AA - Web accessibility compliance');
