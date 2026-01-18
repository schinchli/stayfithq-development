#!/usr/bin/env node

/**
 * HTML Minification Script for StayFit Health Companion
 * Minifies all HTML files for optimal performance
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

class HTMLMinifier {
    constructor() {
        this.htmlDir = path.join(__dirname, '..', 'src', 'pages');
        this.minifiedDir = path.join(__dirname, '..', 'dist', 'html');
        this.minifyOptions = {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            removeEmptyAttributes: true,
            removeOptionalTags: false, // Keep for compatibility
            caseSensitive: false,
            keepClosingSlash: true,
            preserveLineBreaks: false,
            preventAttributesEscaping: false
        };
        
        this.stats = {
            filesProcessed: 0,
            originalSize: 0,
            minifiedSize: 0,
            savings: 0
        };
    }

    /**
     * Initialize minification process
     */
    async initialize() {
        console.log('📄 Starting HTML minification process...');
        
        // Create output directory
        if (!fs.existsSync(this.minifiedDir)) {
            fs.mkdirSync(this.minifiedDir, { recursive: true });
        }
        
        // Create reports directory
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        return this.minifyAllHTML();
    }

    /**
     * Minify all HTML files
     */
    async minifyAllHTML() {
        try {
            const htmlFiles = fs.readdirSync(this.htmlDir).filter(file => file.endsWith('.html'));
            
            console.log(`📄 Found ${htmlFiles.length} HTML files to minify`);
            
            for (const file of htmlFiles) {
                await this.minifyHTML(file);
            }
            
            this.generateReport();
            return true;
            
        } catch (error) {
            console.error('❌ HTML minification failed:', error);
            return false;
        }
    }

    /**
     * Minify individual HTML file
     */
    async minifyHTML(filename) {
        const inputPath = path.join(this.htmlDir, filename);
        const outputPath = path.join(this.minifiedDir, filename);
        
        try {
            const originalHTML = fs.readFileSync(inputPath, 'utf8');
            const originalSize = Buffer.byteLength(originalHTML, 'utf8');
            
            console.log(`🔄 Minifying: ${filename}`);
            
            const minifiedHTML = await minify(originalHTML, this.minifyOptions);
            const minifiedSize = Buffer.byteLength(minifiedHTML, 'utf8');
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
            
            // Write minified HTML
            fs.writeFileSync(outputPath, minifiedHTML);
            
            // Update stats
            this.stats.filesProcessed++;
            this.stats.originalSize += originalSize;
            this.stats.minifiedSize += minifiedSize;
            
            console.log(`✅ ${filename}: ${this.formatBytes(originalSize)} → ${this.formatBytes(minifiedSize)} (${savings}% reduction)`);
            
            // Also update the original file with minified version
            fs.writeFileSync(inputPath, minifiedHTML);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to minify ${filename}:`, error);
            return false;
        }
    }

    /**
     * Generate minification report
     */
    generateReport() {
        const totalSavings = ((this.stats.originalSize - this.stats.minifiedSize) / this.stats.originalSize * 100).toFixed(2);
        
        console.log('\n📊 HTML Minification Report:');
        console.log(`Files processed: ${this.stats.filesProcessed}`);
        console.log(`Original size: ${this.formatBytes(this.stats.originalSize)}`);
        console.log(`Minified size: ${this.formatBytes(this.stats.minifiedSize)}`);
        console.log(`Total savings: ${this.formatBytes(this.stats.originalSize - this.stats.minifiedSize)} (${totalSavings}%)`);
        
        // Save report
        const report = {
            timestamp: new Date().toISOString(),
            filesProcessed: this.stats.filesProcessed,
            originalSize: this.stats.originalSize,
            minifiedSize: this.stats.minifiedSize,
            savings: totalSavings,
            savingsBytes: this.stats.originalSize - this.stats.minifiedSize,
            minifyOptions: this.minifyOptions
        };
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'reports', 'html-minification-report.json'),
            JSON.stringify(report, null, 2)
        );
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run minification if called directly
if (require.main === module) {
    const minifier = new HTMLMinifier();
    minifier.initialize().then(success => {
        if (success) {
            console.log('✅ HTML minification completed successfully!');
            process.exit(0);
        } else {
            console.error('❌ HTML minification failed!');
            process.exit(1);
        }
    });
}

module.exports = HTMLMinifier;
