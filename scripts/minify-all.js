#!/usr/bin/env node

/**
 * Complete Minification Script for StayFit Health Companion
 * Orchestrates CSS, JS, and HTML minification
 */

const fs = require('fs');
const path = require('path');
const CSSMinifier = require('./minify-css');
const JSMinifier = require('./minify-js');
const HTMLMinifier = require('./minify-html');

class CompleteMinifier {
    constructor() {
        this.startTime = Date.now();
        this.reportsDir = path.join(__dirname, '..', 'reports');
        this.totalStats = {
            css: null,
            js: null,
            html: null,
            totalOriginalSize: 0,
            totalMinifiedSize: 0,
            totalSavings: 0,
            totalFiles: 0
        };
    }

    /**
     * Run complete minification process
     */
    async runCompleteMinification() {
        console.log('🚀 Starting complete minification process...');
        console.log('=' .repeat(60));
        
        try {
            // Create reports directory
            if (!fs.existsSync(this.reportsDir)) {
                fs.mkdirSync(this.reportsDir, { recursive: true });
            }
            
            // Run CSS minification
            console.log('\n🎨 Phase 1: CSS Minification');
            console.log('-'.repeat(40));
            const cssMinifier = new CSSMinifier();
            const cssSuccess = await cssMinifier.initialize();
            
            if (!cssSuccess) {
                throw new Error('CSS minification failed');
            }
            
            // Run JavaScript minification
            console.log('\n⚡ Phase 2: JavaScript Minification');
            console.log('-'.repeat(40));
            const jsMinifier = new JSMinifier();
            const jsSuccess = await jsMinifier.initialize();
            
            if (!jsSuccess) {
                throw new Error('JavaScript minification failed');
            }
            
            // Run HTML minification
            console.log('\n📄 Phase 3: HTML Minification');
            console.log('-'.repeat(40));
            const htmlMinifier = new HTMLMinifier();
            const htmlSuccess = await htmlMinifier.initialize();
            
            if (!htmlSuccess) {
                throw new Error('HTML minification failed');
            }
            
            // Generate comprehensive report
            await this.generateComprehensiveReport();
            
            console.log('\n✅ Complete minification process finished successfully!');
            return true;
            
        } catch (error) {
            console.error('\n❌ Complete minification process failed:', error);
            return false;
        }
    }

    /**
     * Generate comprehensive minification report
     */
    async generateComprehensiveReport() {
        console.log('\n📊 Generating comprehensive minification report...');
        
        try {
            // Read individual reports
            const cssReport = this.readReport('css-minification-report.json');
            const jsReport = this.readReport('js-minification-report.json');
            const htmlReport = this.readReport('html-minification-report.json');
            
            // Calculate totals
            this.totalStats.css = cssReport;
            this.totalStats.js = jsReport;
            this.totalStats.html = htmlReport;
            
            if (cssReport) {
                this.totalStats.totalOriginalSize += cssReport.originalSize;
                this.totalStats.totalMinifiedSize += cssReport.minifiedSize;
                this.totalStats.totalFiles += cssReport.filesProcessed;
            }
            
            if (jsReport) {
                this.totalStats.totalOriginalSize += jsReport.originalSize;
                this.totalStats.totalMinifiedSize += jsReport.minifiedSize;
                this.totalStats.totalFiles += jsReport.filesProcessed;
            }
            
            if (htmlReport) {
                this.totalStats.totalOriginalSize += htmlReport.originalSize;
                this.totalStats.totalMinifiedSize += htmlReport.minifiedSize;
                this.totalStats.totalFiles += htmlReport.filesProcessed;
            }
            
            this.totalStats.totalSavings = ((this.totalStats.totalOriginalSize - this.totalStats.totalMinifiedSize) / this.totalStats.totalOriginalSize * 100).toFixed(2);
            
            // Display summary
            this.displaySummary();
            
            // Save comprehensive report
            const comprehensiveReport = {
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - this.startTime,
                summary: this.totalStats,
                details: {
                    css: cssReport,
                    js: jsReport,
                    html: htmlReport
                }
            };
            
            fs.writeFileSync(
                path.join(this.reportsDir, 'comprehensive-minification-report.json'),
                JSON.stringify(comprehensiveReport, null, 2)
            );
            
            // Generate markdown report
            this.generateMarkdownReport(comprehensiveReport);
            
        } catch (error) {
            console.error('❌ Failed to generate comprehensive report:', error);
        }
    }

    /**
     * Read individual report file
     */
    readReport(filename) {
        try {
            const reportPath = path.join(this.reportsDir, filename);
            if (fs.existsSync(reportPath)) {
                return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            }
        } catch (error) {
            console.warn(`⚠️ Could not read ${filename}:`, error.message);
        }
        return null;
    }

    /**
     * Display minification summary
     */
    displaySummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE MINIFICATION SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`Total files processed: ${this.totalStats.totalFiles}`);
        console.log(`Original total size: ${this.formatBytes(this.totalStats.totalOriginalSize)}`);
        console.log(`Minified total size: ${this.formatBytes(this.totalStats.totalMinifiedSize)}`);
        console.log(`Total savings: ${this.formatBytes(this.totalStats.totalOriginalSize - this.totalStats.totalMinifiedSize)} (${this.totalStats.totalSavings}%)`);
        
        console.log('\n📋 Breakdown by file type:');
        
        if (this.totalStats.css) {
            console.log(`CSS: ${this.totalStats.css.filesProcessed} files, ${this.totalStats.css.savings}% reduction`);
        }
        
        if (this.totalStats.js) {
            console.log(`JS: ${this.totalStats.js.filesProcessed} files, ${this.totalStats.js.savings}% reduction`);
        }
        
        if (this.totalStats.html) {
            console.log(`HTML: ${this.totalStats.html.filesProcessed} files, ${this.totalStats.html.savings}% reduction`);
        }
        
        console.log(`\n⏱️ Processing time: ${((Date.now() - this.startTime) / 1000).toFixed(2)} seconds`);
        console.log('='.repeat(60));
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(report) {
        const markdown = `# Minification Report - StayFit Health Companion

## Summary
- **Date**: ${new Date(report.timestamp).toLocaleString()}
- **Processing Time**: ${(report.processingTime / 1000).toFixed(2)} seconds
- **Total Files**: ${report.summary.totalFiles}
- **Total Savings**: ${this.formatBytes(report.summary.totalOriginalSize - report.summary.totalMinifiedSize)} (${report.summary.totalSavings}%)

## File Type Breakdown

### CSS Files
- **Files Processed**: ${report.details.css?.filesProcessed || 0}
- **Original Size**: ${this.formatBytes(report.details.css?.originalSize || 0)}
- **Minified Size**: ${this.formatBytes(report.details.css?.minifiedSize || 0)}
- **Savings**: ${report.details.css?.savings || 0}%

### JavaScript Files
- **Files Processed**: ${report.details.js?.filesProcessed || 0}
- **Original Size**: ${this.formatBytes(report.details.js?.originalSize || 0)}
- **Minified Size**: ${this.formatBytes(report.details.js?.minifiedSize || 0)}
- **Savings**: ${report.details.js?.savings || 0}%

### HTML Files
- **Files Processed**: ${report.details.html?.filesProcessed || 0}
- **Original Size**: ${this.formatBytes(report.details.html?.originalSize || 0)}
- **Minified Size**: ${this.formatBytes(report.details.html?.minifiedSize || 0)}
- **Savings**: ${report.details.html?.savings || 0}%

## Performance Impact
- **Reduced File Sizes**: Faster download times
- **Improved Loading**: Better user experience
- **Bandwidth Savings**: Reduced server costs
- **SEO Benefits**: Better performance scores

---
*Generated by StayFit Health Companion Minification System*
`;
        
        fs.writeFileSync(
            path.join(this.reportsDir, 'MINIFICATION_REPORT.md'),
            markdown
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

// Run complete minification if called directly
if (require.main === module) {
    const minifier = new CompleteMinifier();
    minifier.runCompleteMinification().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = CompleteMinifier;
