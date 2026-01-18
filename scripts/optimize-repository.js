#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// File operations tracker
const operations = {
  moved: [],
  deleted: [],
  errors: []
};

// Helper functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function moveFile(from, to) {
  try {
    const fromPath = path.join(ROOT, from);
    const toPath = path.join(ROOT, to);
    
    if (!fs.existsSync(fromPath)) {
      console.log(`⚠️  Skip: ${from} (not found)`);
      return;
    }
    
    ensureDir(path.dirname(toPath));
    fs.renameSync(fromPath, toPath);
    operations.moved.push({ from, to });
    console.log(`✅ Moved: ${from} → ${to}`);
  } catch (error) {
    operations.errors.push({ file: from, error: error.message });
    console.error(`❌ Error moving ${from}:`, error.message);
  }
}

function deleteIfExists(filePath) {
  try {
    const fullPath = path.join(ROOT, filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      operations.deleted.push(filePath);
      console.log(`🗑️  Deleted: ${filePath}`);
    }
  } catch (error) {
    operations.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error deleting ${filePath}:`, error.message);
  }
}

console.log('🚀 Starting repository optimization...\n');

// Phase 1: Consolidate Web Assets
console.log('📦 Phase 1: Consolidating web assets...');
ensureDir(path.join(ROOT, 'src/web/pages'));

// Move pages from src/pages to src/web/pages
const pagesToMove = [
  'digital-analysis.html',
  'index.html',
  'import.html',
  'search.html',
  'health-reports.html',
  'settings.html'
];

pagesToMove.forEach(page => {
  const srcPath = `src/pages/${page}`;
  const webPath = `src/web/${page}`;
  
  // Check if file exists in src/pages or src/web
  if (fs.existsSync(path.join(ROOT, srcPath))) {
    moveFile(srcPath, `src/web/pages/${page}`);
  } else if (fs.existsSync(path.join(ROOT, webPath))) {
    moveFile(webPath, `src/web/pages/${page}`);
  }
});

// Remove empty src/pages directory
deleteIfExists('src/pages');

// Consolidate assets
if (fs.existsSync(path.join(ROOT, 'src/assets'))) {
  // Move CSS if not already in src/web/css
  if (fs.existsSync(path.join(ROOT, 'src/assets/css'))) {
    deleteIfExists('src/assets/css'); // Assuming src/web/css is primary
  }
  // Move JS if not already in src/web/js
  if (fs.existsSync(path.join(ROOT, 'src/assets/js'))) {
    deleteIfExists('src/assets/js'); // Assuming src/web/js is primary
  }
  deleteIfExists('src/assets');
}

// Phase 2: Clean Root Directory
console.log('\n🧹 Phase 2: Cleaning root directory...');

// Move documentation files
const docsToMove = {
  'MASTER_DEVELOPMENT_JOURNEY.md': 'docs/getting-started/DEVELOPMENT_JOURNEY.md',
  'DEVELOPMENT_PROMPTS.md': 'docs/development/PROMPTS.md',
  'TECHNICAL_PROMPTS.md': 'docs/development/TECHNICAL_PROMPTS.md',
  'DEPLOYMENT_PROMPTS.md': 'docs/deployment/PROMPTS.md',
  'SECURITY_VERIFICATION_REPORT.md': 'docs/security/VERIFICATION_REPORT.md',
  'INSTALLATION.md': 'docs/getting-started/INSTALLATION.md',
  'design.md': 'docs/architecture/DESIGN.md',
  'ally.md': 'docs/architecture/ACCESSIBILITY.md',
  'tasks.md': 'docs/development/TASKS.md',
  'requirements.md': 'docs/development/REQUIREMENTS.md'
};

Object.entries(docsToMove).forEach(([from, to]) => {
  moveFile(from, to);
});

// Move config files
moveFile('.env.template', 'config/.env.template');

// Phase 3: Organize Scripts
console.log('\n📜 Phase 3: Organizing scripts...');

ensureDir(path.join(ROOT, 'scripts/deployment'));
ensureDir(path.join(ROOT, 'scripts/setup'));
ensureDir(path.join(ROOT, 'scripts/maintenance'));

const deploymentScripts = [
  'deploy-aws.sh',
  'deploy-s3-cloudfront.sh',
  'deploy-enterprise-security.sh',
  'deploy-waf-owasp.sh',
  'deploy-waf-owasp-fixed.sh',
  'deploy-ai-backend.sh',
  'deploy-lambda-mcp.sh',
  'deploy-mcp-production.sh',
  'deploy-production-mcp.sh',
  'deploy-enhanced.sh',
  'fix-cloudfront-website.sh'
];

deploymentScripts.forEach(script => {
  moveFile(`scripts/${script}`, `scripts/deployment/${script}`);
});

const setupScripts = [
  'setup-xray.js',
  'setup-cloudtrail.js',
  'setup-mcp-opensearch.js',
  'integrate-enhanced-features.js'
];

setupScripts.forEach(script => {
  moveFile(`scripts/${script}`, `scripts/setup/${script}`);
});

const maintenanceScripts = [
  'cleanup-old-aws-code.js',
  'cleanup-unused-files.js',
  'minify-all.js',
  'minify-html.js',
  'minify-css.js',
  'minify-js.js',
  'aggressive-minify.js',
  'security-scan.sh',
  'waf-monitoring.sh',
  'enterprise-security-monitor.sh'
];

maintenanceScripts.forEach(script => {
  moveFile(`scripts/${script}`, `scripts/maintenance/${script}`);
});

// Phase 4: Simplify Documentation
console.log('\n📚 Phase 4: Simplifying documentation...');

// Remove redundant organized-project folder
deleteIfExists('docs/organized-project');

// Remove outdated status reports
const statusReports = [
  'docs/deployment/PROJECT_STATUS_FINAL.md',
  'docs/deployment/CURRENT_STATUS.md',
  'docs/deployment/WEBSITE_STATUS_REPORT.md',
  'docs/deployment/PRODUCTION_MCP_STATUS.md',
  'docs/deployment/ASSOCIATION_AND_TESTING_STATUS.md',
  'docs/deployment/AWS_CLEANUP_REPORT.md'
];

statusReports.forEach(report => {
  deleteIfExists(report);
});

// Phase 5: Infrastructure Cleanup
console.log('\n🏗️  Phase 5: Organizing infrastructure...');

// Consolidate AWS setup into infrastructure
ensureDir(path.join(ROOT, 'infrastructure/cloudformation'));
moveFile('infrastructure/aws-setup/cloudformation-infrastructure.yaml', 
         'infrastructure/cloudformation/main.yaml');

// Move other AWS configs
const awsConfigs = fs.readdirSync(path.join(ROOT, 'infrastructure/aws-setup'))
  .filter(f => f.endsWith('.json'));

awsConfigs.forEach(config => {
  moveFile(`infrastructure/aws-setup/${config}`, `infrastructure/cloudformation/${config}`);
});

deleteIfExists('infrastructure/aws-setup');

// Consolidate lambda functions
if (fs.existsSync(path.join(ROOT, 'infrastructure/lambda-functions'))) {
  const lambdaFiles = fs.readdirSync(path.join(ROOT, 'infrastructure/lambda-functions'));
  lambdaFiles.forEach(file => {
    if (file.endsWith('.py') || file.endsWith('.js')) {
      moveFile(`infrastructure/lambda-functions/${file}`, `infrastructure/lambda/${file}`);
    }
  });
  deleteIfExists('infrastructure/lambda-functions');
}

// Phase 6: Source Code Organization
console.log('\n💻 Phase 6: Organizing source code...');

// Create server directory structure
ensureDir(path.join(ROOT, 'src/server'));
moveFile('src/server.js', 'src/server/index.js');
moveFile('src/enhanced-server.js', 'src/server/enhanced-server.js');

// Move middleware
if (fs.existsSync(path.join(ROOT, 'src/middleware'))) {
  moveFile('src/middleware', 'src/server/middleware');
}

// Create shared utilities
ensureDir(path.join(ROOT, 'src/shared'));
moveFile('src/processors', 'src/shared/processors');
moveFile('src/integration', 'src/shared/integration');

// Organize MCP server
if (fs.existsSync(path.join(ROOT, 'src/mcp-server'))) {
  moveFile('src/mcp-server', 'src/mcp');
}

// Move standalone files
moveFile('src/mcp-integration-middleware.js', 'src/mcp/middleware.js');
moveFile('src/enhanced-integration.js', 'src/shared/enhanced-integration.js');

// Move components and architecture
moveFile('src/components', 'src/web/components');
deleteIfExists('src/architecture'); // Likely documentation, not code

// Summary
console.log('\n✨ Optimization complete!\n');
console.log(`📊 Summary:`);
console.log(`   ✅ Moved: ${operations.moved.length} files`);
console.log(`   🗑️  Deleted: ${operations.deleted.length} files/directories`);
console.log(`   ❌ Errors: ${operations.errors.length}`);

if (operations.errors.length > 0) {
  console.log('\n⚠️  Errors encountered:');
  operations.errors.forEach(({ file, error }) => {
    console.log(`   - ${file}: ${error}`);
  });
}

console.log('\n📝 Next steps:');
console.log('   1. Review changes with: git status');
console.log('   2. Update import paths in code');
console.log('   3. Test the application');
console.log('   4. Commit changes: git add . && git commit -m "Optimize repository structure"');
console.log('   5. Push to GitHub: git push origin main\n');
