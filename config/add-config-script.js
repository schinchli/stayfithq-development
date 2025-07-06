const fs = require('fs');
const path = require('path');

console.log('🔧 Adding config.js script tags to HTML files...\n');

const htmlFiles = [
    'src/web/index.html',
    'src/web/login.html',
    'src/web/auth-test.html',
    'src/web/digital-analysis.html',
    'src/web/health-reports.html',
    'src/web/import.html',
    'src/web/search.html',
    'src/web/settings.html',
    'src/web/wiki.html',
    'src/web/dashboard.html',
    'src/web/abha-integration.html'
];

let filesUpdated = 0;

htmlFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if config.js is already included
    if (content.includes('src="js/config.js"') || content.includes('config.js')) {
        console.log(`✅ ${path.basename(filePath)} - config.js already included`);
        return;
    }
    
    // Find the head section and add config.js before other scripts
    const headEndIndex = content.indexOf('</head>');
    if (headEndIndex !== -1) {
        const configScript = '    <!-- Configuration -->\n    <script src="js/config.js"></script>\n    \n';
        content = content.slice(0, headEndIndex) + configScript + content.slice(headEndIndex);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${path.basename(filePath)} - Added config.js script tag`);
        filesUpdated++;
    } else {
        console.log(`⚠️  ${path.basename(filePath)} - Could not find </head> tag`);
    }
});

console.log(`\n🎉 Updated ${filesUpdated} HTML files with config.js script tags`);
console.log('\n📋 Next steps:');
console.log('1. Run: npm run install:config');
console.log('2. Test locally: npm run test:local');
console.log('3. Deploy to AWS');
