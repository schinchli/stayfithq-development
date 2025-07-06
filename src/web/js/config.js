// StayFit Health Companion - Local Development Configuration
// This is a working configuration for local testing

window.STAYFIT_CONFIG = {
    // AWS Cognito Configuration (Demo values for local testing)
    cognito: {
        userPoolId: 'DEMO_MODE',
        clientId: 'DEMO_MODE',
        clientSecret: 'DEMO_MODE',
        identityPoolId: 'DEMO_MODE',
        cognitoDomain: 'DEMO_MODE',
        region: 'us-east-1'
    },
    
    // Application URLs (Local development)
    app: {
        baseUrl: 'http://localhost:3000',
        loginUrl: 'http://localhost:3000/login.html',
        redirectUri: 'http://localhost:3000/index.html'
    },
    
    // ABHA Integration (Demo mode)
    abha: {
        clientId: 'demo',
        clientSecret: 'demo',
        baseUrl: 'https://healthidsbx.abdm.gov.in'
    },
    
    // Demo/Test Configuration
    demo: {
        enabled: true,
        testCredentials: {
            email: 'user@example.com',
            password = "your_secure_password"|| 'demo-password'
        }
    },
    
    // Validation function
    validate: function() {
        console.log('✅ Local configuration loaded successfully');
        return true;
    }
};

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.STAYFIT_CONFIG;
}

console.log('📋 StayFit Local Configuration loaded');
