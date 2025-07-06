#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

console.log('🏥 STAYFITHQ LOCALHOST SERVER\n');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Configuration
const PORT = 3000;
const HOST = 'localhost';
const WEB_ROOT = path.join(__dirname, 'src', 'web');

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root requests
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Security: prevent directory traversal
    pathname = pathname.replace(/\.\./g, '');
    
    const filePath = path.join(WEB_ROOT, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    console.log(`📄 ${req.method} ${pathname}`);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 404 - File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - Page Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                        .error { color: #dc3545; }
                        a { color: #007bff; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <h1 class="error">404 - Page Not Found</h1>
                    <p>The requested file <code>${pathname}</code> was not found.</p>
                    <p><a href="/">← Back to Home</a></p>
                    <p>StayFit Health Companion - Localhost Development Server</p>
                </body>
                </html>
            `);
            return;
        }
        
        // Serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Server Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                            .error { color: #dc3545; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">500 - Server Error</h1>
                        <p>Unable to read file: ${path.basename(filePath)}</p>
                        <p><a href="/">← Back to Home</a></p>
                    </body>
                    </html>
                `);
                return;
            }
            
            // Set appropriate headers
            const headers = {
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            };
            
            res.writeHead(200, headers);
            res.end(data);
        });
    });
});

// Start server
server.listen(PORT, HOST, () => {
    console.log('🚀 StayFit Health Companion - Development Server Started!');
    console.log('<REDACTED_CREDENTIAL>========');
    console.log('');
    console.log('🌐 Server Details:');
    console.log(`   • URL: http://${HOST}:${PORT}`);
    console.log(`   • Web Root: ${WEB_ROOT}`);
    console.log(`   • Environment: Development`);
    console.log('');
    console.log('📄 Available Pages:');
    
    // List available HTML files
    try {
        const files = fs.readdirSync(WEB_ROOT);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        htmlFiles.forEach(file => {
            const name = file.replace('.html', '');
            const url = `http://${HOST}:${PORT}/${file}`;
            console.log(`   • ${name.charAt(0).toUpperCase() + name.slice(1)}: ${url}`);
        });
    } catch (error) {
        console.log('   • Unable to list files in web directory');
    }
    
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('   • This is a development server - NOT for production');
    console.log('   • CORS enabled for local development');
    console.log('   • No authentication required in localhost mode');
    console.log('');
    console.log('🛑 To stop server: Press Ctrl+C');
    console.log('');
    console.log('🏥 StayFit Health Companion ready for local development!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down StayFit localhost server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});
