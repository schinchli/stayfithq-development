#!/usr/bin/env node

/**
 * StayFit Health Companion - Cleanup Unused Files
 * Identifies and removes unused CSS, HTML, and other files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WEB_DIR = './web';
const BACKUP_DIR = './web-backup-unused';

// Files that should be kept (production files)
const PRODUCTION_FILES = [
    // HTML Pages
    'index.html',
    'health-reports.html',
    'analysis.html',
    'digital-analysis.html',
    'search.html',
    'dashboard.html',
    'settings.html',
    
    // CSS Files
    'css/bootstrap-theme-unified.css',
    'css/navigation-unified.css',
    'css/layout-unified.css',
    'css/uniform_page_header.css',
    'css/footer-unified.css',
    
    // JavaScript Files
    'js/app.js',
    'js/template-app.js',
    
    // Server Files (for local development)
    'server.js',
    
    // Documentation
    'README.md',
    'LOCALHOST_REDESIGN_COMPLETE.md',
    'MERGED_SEARCH_COMPLETE.md',
    'RESPONSIVE_REDESIGN_SUMMARY.md'
];

// File patterns to exclude from cleanup
const EXCLUDE_PATTERNS = [
    /^\./, // Hidden files
    /node_modules/, // Node modules
    /\.git/, // Git files
];

let cleanupResults = {
    scanned: 0,
    unused: 0,
    removed: 0,
    backed_up: 0,
    errors: 0,
    files: {
        kept: [],
        unused: [],
        removed: [],
        errors: []
    }
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isProductionFile(relativePath) {
    return PRODUCTION_FILES.includes(relativePath) || 
           PRODUCTION_FILES.some(prodFile => relativePath.endsWith(prodFile));
}

function scanDirectory(dirPath, baseDir = dirPath) {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.relative(baseDir, fullPath);
        
        // Skip excluded patterns
        if (shouldExclude(relativePath)) {
            return;
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            scanDirectory(fullPath, baseDir);
        } else {
            cleanupResults.scanned++;
            
            if (isProductionFile(relativePath)) {
                cleanupResults.files.kept.push(relativePath);
                log(`KEEP: ${relativePath}`, 'success');
            } else {
                cleanupResults.unused++;
                cleanupResults.files.unused.push(relativePath);
                log(`UNUSED: ${relativePath}`, 'warning');
            }
        }
    });
}

function createBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        log(`Created backup directory: ${BACKUP_DIR}`, 'info');
    }
}

function backupFile(filePath) {
    try {
        const relativePath = path.relative(WEB_DIR, filePath);
        const backupPath = path.join(BACKUP_DIR, relativePath);
        const backupDirPath = path.dirname(backupPath);
        
        // Create backup directory structure
        if (!fs.existsSync(backupDirPath)) {
            fs.mkdirSync(backupDirPath, { recursive: true });
        }
        
        // Copy file to backup
        fs.copyFileSync(filePath, backupPath);
        cleanupResults.backed_up++;
        log(`Backed up: ${relativePath}`, 'info');
        
        return true;
    } catch (error) {
        cleanupResults.errors++;
        cleanupResults.files.errors.push({ file: filePath, error: error.message });
        log(`Backup error for ${filePath}: ${error.message}`, 'error');
        return false;
    }
}

function removeFile(filePath) {
    try {
        fs.unlinkSync(filePath);
        cleanupResults.removed++;
        const relativePath = path.relative(WEB_DIR, filePath);
        cleanupResults.files.removed.push(relativePath);
        log(`Removed: ${relativePath}`, 'success');
        return true;
    } catch (error) {
        cleanupResults.errors++;
        cleanupResults.files.errors.push({ file: filePath, error: error.message });
        log(`Remove error for ${filePath}: ${error.message}`, 'error');
        return false;
    }
}

function analyzeFileUsage() {
    log('Analyzing file usage in HTML files...', 'info');
    
    const htmlFiles = cleanupResults.files.kept.filter(file => file.endsWith('.html'));
    const referencedFiles = new Set();
    
    htmlFiles.forEach(htmlFile => {
        try {
            const fullPath = path.join(WEB_DIR, htmlFile);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Find CSS references
            const cssMatches = content.match(/href=["']([^"']+\.css)["']/g);
            if (cssMatches) {
                cssMatches.forEach(match => {
                    const cssFile = match.match(/href=["']([^"']+)["']/)[1];
                    if (!cssFile.startsWith('http')) {
                        referencedFiles.add(cssFile);
                    }
                });
            }
            
            // Find JS references
            const jsMatches = content.match(/src=["']([^"']+\.js)["']/g);
            if (jsMatches) {
                jsMatches.forEach(match => {
                    const jsFile = match.match(/src=["']([^"']+)["']/)[1];
                    if (!jsFile.startsWith('http')) {
                        referencedFiles.add(jsFile);
                    }
                });
            }
            
            // Find image references
            const imgMatches = content.match(/src=["']([^"']+\.(png|jpg|jpeg|gif|svg))["']/g);
            if (imgMatches) {
                imgMatches.forEach(match => {
                    const imgFile = match.match(/src=["']([^"']+)["']/)[1];
                    if (!imgFile.startsWith('http')) {
                        referencedFiles.add(imgFile);
                    }
                });
            }
            
        } catch (error) {
            log(`Error analyzing ${htmlFile}: ${error.message}`, 'error');
        }
    });
    
    log(`Found ${referencedFiles.size} referenced files in HTML`, 'info');
    return Array.from(referencedFiles);
}

function generateCleanupReport() {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            files_scanned: cleanupResults.scanned,
            files_kept: cleanupResults.files.kept.length,
            files_unused: cleanupResults.unused,
            files_removed: cleanupResults.removed,
            files_backed_up: cleanupResults.backed_up,
            errors: cleanupResults.errors
        },
        production_files: cleanupResults.files.kept,
        unused_files: cleanupResults.files.unused,
        removed_files: cleanupResults.files.removed,
        errors: cleanupResults.files.errors
    };
    
    fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2));
    log('Cleanup report saved to: cleanup-report.json', 'info');
    
    return report;
}

function displaySummary() {
    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Files Scanned: ${cleanupResults.scanned}`);
    console.log(`Files Kept: ${cleanupResults.files.kept.length} ✅`);
    console.log(`Files Unused: ${cleanupResults.unused} ⚠️`);
    console.log(`Files Removed: ${cleanupResults.removed} 🗑️`);
    console.log(`Files Backed Up: ${cleanupResults.backed_up} 💾`);
    console.log(`Errors: ${cleanupResults.errors} ❌`);
    
    if (cleanupResults.files.kept.length > 0) {
        console.log('\n✅ PRODUCTION FILES KEPT:');
        cleanupResults.files.kept.forEach(file => {
            console.log(`  • ${file}`);
        });
    }
    
    if (cleanupResults.files.unused.length > 0) {
        console.log('\n⚠️ UNUSED FILES IDENTIFIED:');
        cleanupResults.files.unused.forEach(file => {
            console.log(`  • ${file}`);
        });
    }
    
    if (cleanupResults.files.removed.length > 0) {
        console.log('\n🗑️ FILES REMOVED:');
        cleanupResults.files.removed.forEach(file => {
            console.log(`  • ${file}`);
        });
    }
    
    if (cleanupResults.files.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        cleanupResults.files.errors.forEach(error => {
            console.log(`  • ${error.file}: ${error.error}`);
        });
    }
}

async function runCleanup(dryRun = false) {
    console.log('🧹 StayFit Health Companion - File Cleanup');
    console.log('<REDACTED_CREDENTIAL>==');
    console.log(`Web Directory: ${WEB_DIR}`);
    console.log(`Backup Directory: ${BACKUP_DIR}`);
    console.log(`Dry Run: ${dryRun ? 'YES' : 'NO'}`);
    console.log('');
    
    // Check if web directory exists
    if (!fs.existsSync(WEB_DIR)) {
        log(`Web directory not found: ${WEB_DIR}`, 'error');
        process.exit(1);
    }
    
    // Scan directory
    log('Scanning web directory...', 'info');
    scanDirectory(WEB_DIR);
    
    // Analyze file usage
    const referencedFiles = analyzeFileUsage();
    
    // Update unused files list based on actual usage
    cleanupResults.files.unused = cleanupResults.files.unused.filter(file => {
        const isReferenced = referencedFiles.some(ref => file.includes(ref) || ref.includes(file));
        if (isReferenced) {
            cleanupResults.files.kept.push(file);
            cleanupResults.unused--;
            log(`REFERENCED: ${file} (moved to keep list)`, 'info');
            return false;
        }
        return true;
    });
    
    if (!dryRun && cleanupResults.files.unused.length > 0) {
        // Create backup directory
        createBackup();
        
        // Process unused files
        log('Processing unused files...', 'info');
        
        for (const unusedFile of cleanupResults.files.unused) {
            const fullPath = path.join(WEB_DIR, unusedFile);
            
            // Backup first
            if (backupFile(fullPath)) {
                // Then remove
                removeFile(fullPath);
            }
        }
    }
    
    // Generate report
    const report = generateCleanupReport();
    
    // Display summary
    displaySummary();
    
    if (dryRun) {
        console.log('\n🔍 DRY RUN COMPLETE - No files were actually removed');
        console.log('Run without --dry-run flag to perform actual cleanup');
    }
    
    return report;
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-d');
    
    runCleanup(dryRun).catch(error => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runCleanup,
    cleanupResults,
    PRODUCTION_FILES
};
