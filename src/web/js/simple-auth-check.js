/**
 * Simple Authentication Check
 * Non-blocking authentication verification that doesn't hide content
 */

(function() {
    'use strict';
    
    // Check if current page is login page
    function isLoginPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return currentPage === 'login.html';
    }
    
    // Check if user has valid tokens
    function hasValidTokens() {
        const accessToken = localStorage.getItem('accessToken');
        const userEmail = localStorage.getItem('userEmail');
        const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
        
        if (!accessToken || !userEmail) {
            return false;
        }
        
        // Check if token is expired (if expiration is set)
        if (tokenExpiresAt) {
            const now = Date.now();
            const expiration = parseInt(tokenExpiresAt);
            
            if (now >= expiration) {
                console.log('Token expired, clearing storage');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('idToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('tokenExpiresAt');
                localStorage.removeItem('tokenIssuedAt');
                return false;
            }
        }
        
        return true;
    }
    
    // Redirect to login with a delay to allow page to load
    function redirectToLogin() {
        console.log('Simple Auth Check: Redirecting to login');
        
        // Show a brief message before redirect
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        alertDiv.innerHTML = `
            <strong>Authentication Required</strong><br>
            Redirecting to login...
        `;
        document.body.appendChild(alertDiv);
        
        // Redirect after a brief delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
    
    // Main authentication check
    function checkAuthentication() {
        // Skip for login page
        if (isLoginPage()) {
            console.log('Simple Auth Check: Login page detected, skipping check');
            return;
        }
        
        // Check authentication after page loads
        if (!hasValidTokens()) {
            console.log('Simple Auth Check: No valid tokens found');
            redirectToLogin();
            return;
        }
        
        console.log('Simple Auth Check: Valid tokens found, allowing access');
    }
    
    // Run check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuthentication);
    } else {
        // DOM is already ready
        setTimeout(checkAuthentication, 1000); // Small delay to ensure page loads
    }
    
    // Make function available globally for debugging
    window.SimpleAuthCheck = {
        isLoginPage,
        hasValidTokens,
        redirectToLogin,
        checkAuthentication
    };
    
})();
