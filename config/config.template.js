// StayFit Health Companion Configuration Template
// Copy this file to config.js and fill in your actual values

window.STAYFIT_CONFIG = {
    // AWS Cognito Configuration
    cognito: {
        userPoolId: 'YOUR_USER_POOL_ID',           // e.g., 'us-region-1_YOUR_USER_POOL_ID'
        clientId: 'YOUR_CLIENT_ID',               // e.g., '<REDACTED_CREDENTIAL>abcdefghijklmnop'
        clientSecret: 'YOUR_CLIENT_SECRET',       // e.g., 'your-secret-key-here'
        identityPoolId: 'YOUR_IDENTITY_POOL_ID',  // e.g., 'your-aws-region:12<REDACTED_CREDENTIAL>-1234-1234-YOUR_AWS_ACCOUNT_ID'
        cognitoDomain: 'YOUR_COGNITO_DOMAIN',     // e.g., 'your-app.auth.your-aws-region.amazoncognito.com'
        region: 'your-aws-region'
    },
    
    // Application URLs
    app: {
        baseUrl: 'YOUR_CLOUDFRONT_URL',           // e.g., 'https://YOUR-DOMAIN.cloudfront.net'
        loginUrl: 'YOUR_CLOUDFRONT_URL/login.html',
        redirectUri: 'YOUR_CLOUDFRONT_URL/index.html'
    },
    
    // ABHA Integration (Optional - for Indian healthcare system)
    abha: {
        clientId: 'YOUR_ABHA_CLIENT_ID',          // Optional: Leave as 'demo' for testing
        clientSecret: 'YOUR_ABHA_CLIENT_SECRET',  // Optional: Leave as 'demo' for testing
        baseUrl: 'https://healthidsbx.abdm.gov.in' // Sandbox URL
    },
    
    // Demo/Test Configuration
    demo: {
        enabled: true,                            // Set to false in production
        testCredentials: {
            email: 'demo@example.com',            // Demo email for testing
            password = "your_secure_password"// Demo password for testing
        }
    }
};

// Export for Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.STAYFIT_CONFIG;
}
