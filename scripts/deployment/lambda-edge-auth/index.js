'use strict';

const AUTH_username = "your_username";
const AUTH_password = "your_secure_password";

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    
    // Check if authorization header exists
    const authHeader = headers.authorization && headers.authorization[0] ? headers.authorization[0].value : '';
    
    if (!authHeader) {
        return requireAuth(callback);
    }
    
    // Parse Basic Auth
    const encoded = authHeader.split(' ')[1];
    if (!encoded) {
        return requireAuth(callback);
    }
    
    const decoded = Buffer.from(encoded, 'base64').toString();
    const [username, password] = decoded.split(':');
    
    // Validate credentials
    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
        // Authentication successful, continue with request
        callback(null, request);
    } else {
        return requireAuth(callback);
    }
};

function requireAuth(callback) {
    const response = {
        status: '401',
        statusDescription: 'Unauthorized',
        headers: {
            'www-authenticate': [{
                key: 'WWW-Authenticate',
                value: 'Basic realm="StayFit Health Companion"'
            }],
            'content-type': [{
                key: 'Content-Type',
                value: 'text/html'
            }]
        },
        body: `
<!DOCTYPE html>
<html>
<head>
    <title>StayFit Health Companion - Authentication Required</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { color: #007bff; font-size: 2rem; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .credentials { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏥 StayFit Health Companion</div>
        <h1>Authentication Required</h1>
        <p>This is a secure health management platform. Please enter your credentials to access the application.</p>
        <div class="credentials">
            <strong>Demo Credentials:</strong><br>
            username = "your_username"<br>
            password = "your_secure_password"</div>
        <p><small>Your health data is protected with enterprise-grade security.</small></p>
    </div>
</body>
</html>
        `
    };
    callback(null, response);
}
