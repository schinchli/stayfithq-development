#!/usr/bin/env node

/**
 * JavaScript Minification Script for StayFit Health Companion
 * Minifies all JavaScript files for optimal performance
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

class JSMinifier {
    constructor() {
        this.jsDir = path.join(__dirname, '..', 'src', 'assets', 'js');
        this.minifiedDir = path.join(__dirname, '..', 'dist', 'js');
        this.terserOptions = {
            compress: {
                drop_console: false, // Keep console.log for debugging
                drop_debugger: true,
                pure_funcs: ['console.debug'],
                passes: 2
            },
            mangle: {
                reserved: ['$', 'jQuery', 'Chart', 'bootstrap'] // Preserve global variables
            },
            format: {
                comments: false,
                beautify: false
            },
            sourceMap: false
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
        console.log('⚡ Starting JavaScript minification process...');
        
        // Create output directory
        if (!fs.existsSync(this.minifiedDir)) {
            fs.mkdirSync(this.minifiedDir, { recursive: true });
        }
        
        // Create reports directory
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        return this.minifyAllJS();
    }

    /**
     * Minify all JavaScript files
     */
    async minifyAllJS() {
        try {
            const jsFiles = fs.readdirSync(this.jsDir).filter(file => file.endsWith('.js'));
            
            console.log(`📄 Found ${jsFiles.length} JavaScript files to minify`);
            
            for (const file of jsFiles) {
                await this.minifyJS(file);
            }
            
            this.generateReport();
            return true;
            
        } catch (error) {
            console.error('❌ JavaScript minification failed:', error);
            return false;
        }
    }

    /**
     * Minify individual JavaScript file
     */
    async minifyJS(filename) {
        const inputPath = path.join(this.jsDir, filename);
        const outputPath = path.join(this.minifiedDir, filename);
        
        try {
            const originalJS = fs.readFileSync(inputPath, 'utf8');
            const originalSize = Buffer.byteLength(originalJS, 'utf8');
            
            console.log(`🔄 Minifying: ${filename}`);
            
            const result = await minify(originalJS, this.terserOptions);
            
            if (result.error) {
                console.error(`❌ Error minifying ${filename}:`, result.error);
                return false;
            }
            
            const minifiedJS = result.code;
            const minifiedSize = Buffer.byteLength(minifiedJS, 'utf8');
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
            
            // Write minified JavaScript
            fs.writeFileSync(outputPath, minifiedJS);
            
            // Update stats
            this.stats.filesProcessed++;
            this.stats.originalSize += originalSize;
            this.stats.minifiedSize += minifiedSize;
            
            console.log(`✅ ${filename}: ${this.formatBytes(originalSize)} → ${this.formatBytes(minifiedSize)} (${savings}% reduction)`);
            
            // Also update the original file with minified version
            fs.writeFileSync(inputPath, minifiedJS);
            
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
        
        console.log('\n📊 JavaScript Minification Report:');
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
            terserOptions: this.terserOptions
        };
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'reports', 'js-minification-report.json'),
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
    const minifier = new JSMinifier();
    minifier.initialize().then(success => {
        if (success) {
            console.log('✅ JavaScript minification completed successfully!');
            process.exit(0);
        } else {
            console.error('❌ JavaScript minification failed!');
            process.exit(1);
        }
    });
}

module.exports = JSMinifier;
