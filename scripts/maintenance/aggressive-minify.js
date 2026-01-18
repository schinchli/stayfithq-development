#!/usr/bin/env node

/**
 * Aggressive Minification Script for StayFit Health Companion
 * Implements comprehensive minification with maximum compression
 */

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');
const { minify: minifyHTML } = require('html-minifier-terser');

class AggressiveMinifier {
    constructor() {
        this.startTime = Date.now();
        this.stats = {
            css: { original: 0, minified: 0, files: 0 },
            js: { original: 0, minified: 0, files: 0 },
            html: { original: 0, minified: 0, files: 0 }
        };
        
        // Aggressive CSS options
        this.cssOptions = {
            level: {
                1: {
                    all: true,
                    normalizeUrls: false
                },
                2: {
                    all: true,
                    restructureRules: true,
                    removeUnusedAtRules: true,
                    mergeSemantically: true,
                    overrideProperties: true
                }
            },
            format: 'keep-breaks',
            inline: ['remote']
        };
        
        // Aggressive JS options
        this.jsOptions = {
            compress: {
                drop_console: false,
                drop_debugger: true,
                pure_funcs: ['console.debug', 'console.info'],
                passes: 3,
                unsafe: true,
                unsafe_comps: true,
                unsafe_math: true,
                unsafe_proto: true,
                unsafe_regexp: true,
                conditionals: true,
                dead_code: true,
                evaluate: true,
                if_return: true,
                join_vars: true,
                loops: true,
                properties: true,
                sequences: true,
                side_effects: true,
                switches: true,
                unused: true
            },
            mangle: {
                toplevel: true,
                reserved: ['$', 'jQuery', 'Chart', 'bootstrap', 'Plotly']
            },
            format: {
                comments: false,
                beautify: false,
                semicolons: false
            }
        };
        
        // Aggressive HTML options
        this.htmlOptions = {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: {
                level: 2,
                format: 'keep-breaks'
            },
            minifyJS: {
                compress: {
                    drop_console: false,
                    passes: 2
                },
                mangle: true
            },
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            caseSensitive: false,
            keepClosingSlash: false,
            preserveLineBreaks: false,
            preventAttributesEscaping: false,
            processConditionalComments: true,
            removeAttributeQuotes: true,
            removeEmptyElements: false,
            sortAttributes: true,
            sortClassName: true
        };
    }

    /**
     * Run aggressive minification
     */
    async runAggressiveMinification() {
        console.log('🚀 Starting AGGRESSIVE minification process...');
        console.log('=' .repeat(70));
        
        try {
            await this.minifyCSS();
            await this.minifyJS();
            await this.minifyHTML();
            
            this.generateReport();
            
            console.log('\n✅ Aggressive minification completed successfully!');
            return true;
            
        } catch (error) {
            console.error('\n❌ Aggressive minification failed:', error);
            return false;
        }
    }

    /**
     * Aggressively minify CSS files
     */
    async minifyCSS() {
        console.log('\n🎨 AGGRESSIVE CSS MINIFICATION');
        console.log('-'.repeat(50));
        
        const cssDir = path.join(__dirname, '..', 'src', 'assets', 'css');
        const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
        
        const cleanCSS = new CleanCSS(this.cssOptions);
        
        for (const file of cssFiles) {
            const filePath = path.join(cssDir, file);
            const originalCSS = fs.readFileSync(filePath, 'utf8');
            const originalSize = Buffer.byteLength(originalCSS, 'utf8');
            
            console.log(`🔄 Minifying: ${file}`);
            
            const result = await cleanCSS.minify(originalCSS);
            
            if (result.errors.length > 0) {
                console.error(`❌ Errors in ${file}:`, result.errors);
                continue;
            }
            
            const minifiedCSS = result.styles;
            const minifiedSize = Buffer.byteLength(minifiedCSS, 'utf8');
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
            
            // Write minified CSS back to original file
            fs.writeFileSync(filePath, minifiedCSS);
            
            this.stats.css.original += originalSize;
            this.stats.css.minified += minifiedSize;
            this.stats.css.files++;
            
            console.log(`✅ ${file}: ${this.formatBytes(originalSize)} → ${this.formatBytes(minifiedSize)} (${savings}% reduction)`);
        }
    }

    /**
     * Aggressively minify JavaScript files
     */
    async minifyJS() {
        console.log('\n⚡ AGGRESSIVE JAVASCRIPT MINIFICATION');
        console.log('-'.repeat(50));
        
        const jsDir = path.join(__dirname, '..', 'src', 'assets', 'js');
        const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
        
        for (const file of jsFiles) {
            const filePath = path.join(jsDir, file);
            const originalJS = fs.readFileSync(filePath, 'utf8');
            const originalSize = Buffer.byteLength(originalJS, 'utf8');
            
            console.log(`🔄 Minifying: ${file}`);
            
            try {
                const result = await minifyJS(originalJS, this.jsOptions);
                
                if (result.error) {
                    console.error(`❌ Error minifying ${file}:`, result.error);
                    continue;
                }
                
                const minifiedJS = result.code;
                const minifiedSize = Buffer.byteLength(minifiedJS, 'utf8');
                const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
                
                // Write minified JS back to original file
                fs.writeFileSync(filePath, minifiedJS);
                
                this.stats.js.original += originalSize;
                this.stats.js.minified += minifiedSize;
                this.stats.js.files++;
                
                console.log(`✅ ${file}: ${this.formatBytes(originalSize)} → ${this.formatBytes(minifiedSize)} (${savings}% reduction)`);
                
            } catch (error) {
                console.error(`❌ Failed to minify ${file}:`, error.message);
            }
        }
    }

    /**
     * Aggressively minify HTML files
     */
    async minifyHTML() {
        console.log('\n📄 AGGRESSIVE HTML MINIFICATION');
        console.log('-'.repeat(50));
        
        const htmlDir = path.join(__dirname, '..', 'src', 'pages');
        const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));
        
        for (const file of htmlFiles) {
            const filePath = path.join(htmlDir, file);
            const originalHTML = fs.readFileSync(filePath, 'utf8');
            const originalSize = Buffer.byteLength(originalHTML, 'utf8');
            
            console.log(`🔄 Minifying: ${file}`);
            
            try {
                const minifiedHTML = await minifyHTML(originalHTML, this.htmlOptions);
                const minifiedSize = Buffer.byteLength(minifiedHTML, 'utf8');
                const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
                
                // Write minified HTML back to original file
                fs.writeFileSync(filePath, minifiedHTML);
                
                this.stats.html.original += originalSize;
                this.stats.html.minified += minifiedSize;
                this.stats.html.files++;
                
                console.log(`✅ ${file}: ${this.formatBytes(originalSize)} → ${this.formatBytes(minifiedSize)} (${savings}% reduction)`);
                
            } catch (error) {
                console.error(`❌ Failed to minify ${file}:`, error.message);
            }
        }
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        const totalOriginal = this.stats.css.original + this.stats.js.original + this.stats.html.original;
        const totalMinified = this.stats.css.minified + this.stats.js.minified + this.stats.html.minified;
        const totalSavings = ((totalOriginal - totalMinified) / totalOriginal * 100).toFixed(2);
        const totalFiles = this.stats.css.files + this.stats.js.files + this.stats.html.files;
        
        console.log('\n' + '='.repeat(70));
        console.log('📊 AGGRESSIVE MINIFICATION SUMMARY');
        console.log('='.repeat(70));
        
        console.log(`Total files processed: ${totalFiles}`);
        console.log(`Original total size: ${this.formatBytes(totalOriginal)}`);
        console.log(`Minified total size: ${this.formatBytes(totalMinified)}`);
        console.log(`Total savings: ${this.formatBytes(totalOriginal - totalMinified)} (${totalSavings}%)`);
        
        console.log('\n📋 Detailed breakdown:');
        
        // CSS Stats
        if (this.stats.css.files > 0) {
            const cssSavings = ((this.stats.css.original - this.stats.css.minified) / this.stats.css.original * 100).toFixed(2);
            console.log(`CSS: ${this.stats.css.files} files, ${this.formatBytes(this.stats.css.original - this.stats.css.minified)} saved (${cssSavings}%)`);
        }
        
        // JS Stats
        if (this.stats.js.files > 0) {
            const jsSavings = ((this.stats.js.original - this.stats.js.minified) / this.stats.js.original * 100).toFixed(2);
            console.log(`JS: ${this.stats.js.files} files, ${this.formatBytes(this.stats.js.original - this.stats.js.minified)} saved (${jsSavings}%)`);
        }
        
        // HTML Stats
        if (this.stats.html.files > 0) {
            const htmlSavings = ((this.stats.html.original - this.stats.html.minified) / this.stats.html.original * 100).toFixed(2);
            console.log(`HTML: ${this.stats.html.files} files, ${this.formatBytes(this.stats.html.original - this.stats.html.minified)} saved (${htmlSavings}%)`);
        }
        
        console.log(`\n⏱️ Processing time: ${((Date.now() - this.startTime) / 1000).toFixed(2)} seconds`);
        console.log('='.repeat(70));
        
        // Save report
        const report = {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - this.startTime,
            totalFiles: totalFiles,
            totalOriginalSize: totalOriginal,
            totalMinifiedSize: totalMinified,
            totalSavings: totalSavings,
            totalSavingsBytes: totalOriginal - totalMinified,
            breakdown: {
                css: {
                    files: this.stats.css.files,
                    originalSize: this.stats.css.original,
                    minifiedSize: this.stats.css.minified,
                    savings: this.stats.css.files > 0 ? ((this.stats.css.original - this.stats.css.minified) / this.stats.css.original * 100).toFixed(2) : 0
                },
                js: {
                    files: this.stats.js.files,
                    originalSize: this.stats.js.original,
                    minifiedSize: this.stats.js.minified,
                    savings: this.stats.js.files > 0 ? ((this.stats.js.original - this.stats.js.minified) / this.stats.js.original * 100).toFixed(2) : 0
                },
                html: {
                    files: this.stats.html.files,
                    originalSize: this.stats.html.original,
                    minifiedSize: this.stats.html.minified,
                    savings: this.stats.html.files > 0 ? ((this.stats.html.original - this.stats.html.minified) / this.stats.html.original * 100).toFixed(2) : 0
                }
            }
        };
        
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(reportsDir, 'aggressive-minification-report.json'),
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

// Run aggressive minification if called directly
if (require.main === module) {
    const minifier = new AggressiveMinifier();
    minifier.runAggressiveMinification().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = AggressiveMinifier;
