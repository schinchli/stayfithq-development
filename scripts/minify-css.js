#!/usr/bin/env node

/**
 * CSS Minification Script for StayFit Health Companion
 * Minifies all CSS files for optimal performance
 */

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

class CSSMinifier {
    constructor() {
        this.cssDir = path.join(__dirname, '..', 'src', 'assets', 'css');
        this.minifiedDir = path.join(__dirname, '..', 'dist', 'css');
        this.cleanCSS = new CleanCSS({
            level: 2, // Advanced optimizations
            returnPromise: true,
            sourceMap: false,
            format: 'beautify', // Keep readable for debugging
            compatibility: 'ie8'
        });
        
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
        console.log('🎨 Starting CSS minification process...');
        
        // Create output directory
        if (!fs.existsSync(this.minifiedDir)) {
            fs.mkdirSync(this.minifiedDir, { recursive: true });
        }
        
        return this.minifyAllCSS();
    }

    /**
     * Minify all CSS files
     */
    async minifyAllCSS() {
        try {
            const cssFiles = fs.readdirSync(this.cssDir).filter(file => file.endsWith('.css'));
            
            console.log(`📄 Found ${cssFiles.length} CSS files to minify`);
            
            for (const file of cssFiles) {
                await this.minifyCSS(file);
            }
            
            this.generateReport();
            return true;
            
        } catch (error) {
            console.error('❌ CSS minification failed:', error);
            return false;
        }
    }

    /**
     * Minify individual CSS file
     */
    async minifyCSS(filename) {
        const inputPath = path.join(this.cssDir, filename);
        const outputPath = path.join(this.minifiedDir, filename);
        
        try {
            const originalCSS = fs.readFileSync(inputPath, 'utf8');
            const originalSize = Buffer.byteLength(originalCSS, 'utf8');
            
            console.log(`🔄 Minifying: ${filename}`);
            
            const result = await this.cleanCSS.minify(originalCSS);
            
            if (result.errors.length > 0) {
                console.error(`❌ Errors in ${filename}:`, result.errors);
                return false;
            }
            
            if (result.warnings.length > 0) {
                console.warn(`⚠️ Warnings in ${filename}:`, result.warnings);
            }
            
            const minifiedCSS = result.styles;
            const minifiedSize = Buffer.byteLength(minifiedCSS, 'utf8');
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
            
            // Write minified CSS
            fs.writeFileSync(outputPath, minifiedCSS);
            
            // Update stats
            this.stats.filesProcessed++;
            this.stats.originalSize += originalSize;
            this.stats.minifiedSize += minifiedSize;
            
            console.log(`✅ ${filename}: ${this.formatBytes(originalSize)} → ${this.formatBytes(minifiedSize)} (${savings}% reduction)`);
            
            // Also update the original file with minified version
            fs.writeFileSync(inputPath, minifiedCSS);
            
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
        
        console.log('\n📊 CSS Minification Report:');
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
            savingsBytes: this.stats.originalSize - this.stats.minifiedSize
        };
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'reports', 'css-minification-report.json'),
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
    const minifier = new CSSMinifier();
    minifier.initialize().then(success => {
        if (success) {
            console.log('✅ CSS minification completed successfully!');
            process.exit(0);
        } else {
            console.error('❌ CSS minification failed!');
            process.exit(1);
        }
    });
}

module.exports = CSSMinifier;
