#!/usr/bin/env node

/**
 * Update all HTML pages with standardized footer
 * Ensures consistent footer across all pages with proper centering and attribution
 */

const fs = require('fs');
const path = require('path');

const standardFooterHTML = `    <!-- Standardized HealthHQ Footer -->
    <footer class="healthhq-footer">
        <div class="healthhq-footer-content">
            <!-- Main Footer Text -->
            <p class="healthhq-footer-main">
                Built with <span class="heart-emoji">❤️</span> for Healthcare Excellence by 
                <span class="healthhq-footer-author">
                    <a href="https://in.linkedin.com/in/shashankk" target="_blank" rel="noopener noreferrer">
                        Shashank Chinchli, Solutions Architect, AWS
                    </a>
                </span>
            </p>
            
            <!-- Feature Tags -->
            <p class="healthhq-footer-features">
                <span>HIPAA-Compliant</span>
                <span class="feature-separator">•</span>
                <span>FHIR R4</span>
                <span class="feature-separator">•</span>
                <span>openEHR</span>
                <span class="feature-separator">•</span>
                <span>MCP Connected</span>
                <span class="feature-separator">•</span>
                <span>OpenSearch Ready</span>
                <span class="feature-separator">•</span>
                <span>Enterprise Security</span>
            </p>
        </div>
    </footer>`;

const standardFooterCSS = `    <link rel="stylesheet" href="../assets/css/footer-standard.css">`;

function updateHTMLFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // Add standard footer CSS if not present
        if (!content.includes('footer-standard.css')) {
            // Find the last CSS link and add after it
            const cssLinkRegex = /<link[^>]*\.css[^>]*>/g;
            const matches = [...content.matchAll(cssLinkRegex)];
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const insertIndex = lastMatch.index + lastMatch[0].length;
                content = content.slice(0, insertIndex) + '\n' + standardFooterCSS + content.slice(insertIndex);
                updated = true;
            }
        }

        // Replace existing footer with standardized footer
        const footerPatterns = [
            // Pattern 1: Simple footer with container
            /<footer[^>]*>[\s\S]*?<div[^>]*container[^>]*>[\s\S]*?<\/div>[\s\S]*?<\/footer>/gi,
            // Pattern 2: Footer with paragraph
            /<footer[^>]*>[\s\S]*?<p[^>]*>[\s\S]*?<\/p>[\s\S]*?<\/footer>/gi,
            // Pattern 3: Any footer element
            /<footer[\s\S]*?<\/footer>/gi
        ];

        for (const pattern of footerPatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, standardFooterHTML);
                updated = true;
                break;
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

function findHTMLFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findHTMLFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Main execution
console.log('🔄 Updating all HTML pages with standardized footer...\n');

const pagesDir = path.join(__dirname, 'src/pages');
const htmlFiles = findHTMLFiles(pagesDir);

let updatedCount = 0;
for (const file of htmlFiles) {
    if (updateHTMLFile(file)) {
        updatedCount++;
    }
}

console.log(`\n🎉 Footer update complete!`);
console.log(`📊 Updated ${updatedCount} out of ${htmlFiles.length} HTML files`);
console.log(`\n✨ Standardized footer features:`);
console.log(`   - ❤️ Heart emoji with proper spacing`);
console.log(`   - 👤 Attribution to Shashank Chinchli, Solutions Architect, AWS`);
console.log(`   - 🏥 Healthcare feature badges (HIPAA, FHIR R4, openEHR, MCP, OpenSearch)`);
console.log(`   - 📱 Responsive design with proper centering`);
console.log(`   - 🎨 Healthcare-themed styling with icons`);
console.log(`   - 📅 Last updated date`);

console.log(`\n🔗 Footer is now consistent across all pages with:`);
console.log(`   - Horizontal and vertical centering`);
console.log(`   - Professional healthcare branding`);
console.log(`   - Complete feature showcase`);
console.log(`   - Responsive mobile design`);
