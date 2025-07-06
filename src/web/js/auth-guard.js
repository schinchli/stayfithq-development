/**
 * Authentication Guard - Immediate Protection
 * Runs before page content loads to enforce authentication
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
        
        if (!accessToken || !userEmail || !tokenExpiresAt) {
            return false;
        }
        
        // Check if token is expired
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
        
        return true;
    }
    
    // Redirect to login
    function redirectToLogin() {
        console.log('Auth Guard: Redirecting to login');
        window.location.href = 'window.STAYFIT_CONFIG.app.baseUrl/login.html';
    }
    
    // Hide page content until authentication is verified
    function hidePageContent() {
        const style = document.createElement('style');
        style.id = 'auth-guard-style';
        style.textContent = `
            body { 
                visibility: hidden !important; 
                opacity: 0 !important; 
            }
            .auth-loading {
                visibility: visible !important;
                opacity: 1 !important;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: 'Inter', sans-serif;
            }
        `;
        document.head.appendChild(style);
        
        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'auth-loading';
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #e3e3e3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h4 style="color: #333; margin: 0;">Verifying Authentication...</h4>
                <p style="color: #666; margin: 10px 0 0;">Please wait while we secure your session</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingDiv);
    }
    
    // Show page content after authentication is verified
    function showPageContent() {
        const authStyle = document.getElementById('auth-guard-style');
        const loadingDiv = document.querySelector('.auth-loading');
        
        if (authStyle) {
            authStyle.remove();
        }
        
        if (loadingDiv) {
            loadingDiv.remove();
        }
        
        // Make body visible
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
    }
    
    // Main authentication guard logic
    function runAuthGuard() {
        console.log('Auth Guard: Running authentication check');
        
        // Skip for login page
        if (isLoginPage()) {
            console.log('Auth Guard: Login page detected, allowing access');
            return;
        }
        
        // Hide content immediately for protected pages
        hidePageContent();
        
        // Check authentication
        if (!hasValidTokens()) {
            console.log('Auth Guard: No valid tokens found');
            redirectToLogin();
            return;
        }
        
        console.log('Auth Guard: Valid tokens found, allowing access');
        
        // Show content after a brief delay to ensure smooth loading
        setTimeout(() => {
            showPageContent();
        }, 500);
    }
    
    // Run immediately when script loads
    runAuthGuard();
    
    // Also run when DOM is ready (backup)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAuthGuard);
    }
    
    // Make functions available globally for debugging
    window.AuthGuard = {
        isLoginPage,
        hasValidTokens,
        redirectToLogin,
        showPageContent
    };
    
})();
