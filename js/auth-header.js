// Authentication check - runs immediately in head
(function() {
    // Skip auth check for login page
    if (window.location.pathname === '/login.html') return;
    
    // Check for access token
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verify token with Cognito (async)
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof AWS !== 'undefined') {
            AWS.config.region = 'us-east-1';
            const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
            
            cognitoIdentityServiceProvider.getUser({
                AccessToken: token
            }).promise().catch(function(err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('idToken');
                window.location.href = '/login.html';
            });
        }
    });
})();
