#!/usr/bin/env node
const fs = require('fs');
const pages = ['index.html','dashboard.html','settings.html','health-reports.html','search.html','digital-analysis.html','abha-integration.html','wiki.html','import.html'];
const importLink = `            <a class="nav-link" href="import.html">
                <i class="bi bi-cloud-upload"></i>
                <span>Health Data Import</span>
            </a>`;

pages.forEach(page => {
    const filePath = `web/${page}`;
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const settingsPattern = /(\s*<a class="nav-link[^"]*" href="settings\.html">\s*<i class="bi bi-gear"><\/i>\s*<span>Settings<\/span>\s*<\/a>)/;
        if (settingsPattern.test(content) && !content.includes('Health Data Import')) {
            content = content.replace(settingsPattern, `${importLink}
$1`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${page}`);
        }
    }
});
console.log('🎯 Navigation updated!');
