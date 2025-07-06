/**
 * Universal Cognito Authentication System
 * Protects all pages with Cognito User Pool authentication
 * Include this script in all pages that need protection
 */

// AWS Cognito Configuration
AWS.config.update({ region: 'your-aws-region' });

const CognitoAuth = {
    // Configuration
    config: {
        userPoolId: 'us-region-1_YOUR_USER_POOL_ID',
        clientId: '59kc5qi8el10a7o36na5qn6m3f',
        clientSecret: '<REDACTED_CREDENTIAL>72gga4tkfmm',
        identityPoolId: 'your-aws-region:1f8c35e3-37b8-4e59-b694-b5f0bb49a02d',
        cognitoDomain: 'stayfit-health-companion.auth.your-aws-region.amazoncognito.com',
        redirectUri: 'https://YOUR-DOMAIN.cloudfront.net/index.html',
        loginUrl: 'https://YOUR-DOMAIN.cloudfront.net/login.html',
        publicPages: ['login.html', 'auth-test.html'] // Pages that don't require authentication
    },
    
    // Services
    cognitoIdentityServiceProvider: new AWS.CognitoIdentityServiceProvider(),
    current<REDACTED_CREDENTIAL>,
    
    // Handle OAuth callback
    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
            console.error('OAuth error:', error);
            this.redirectToLogin();
            return false;
        }
        
        if (authCode) {
            try {
                // Exchange authorization code for tokens
                const tokenResponse = await this.exchangeCodeForTokens(authCode);
                
                if (tokenResponse.access_token) {
                    // Store tokens
                    localStorage.setItem('accessToken', tokenResponse.access_token);
                    localStorage.setItem('idToken', tokenResponse.id_token);
                    localStorage.setItem('refreshToken', tokenResponse.refresh_token);
                    
                    // Decode ID token to get user info
                    const userInfo = this.decodeJWT(tokenResponse.id_token);
                    localStorage.setItem('userEmail', userInfo.email);
                    
                    // Clean URL and redirect to dashboard
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return true;
                }
            } catch (error) {
                console.error('Token exchange failed:', error);
                this.redirectToLogin();
                return false;
            }
        }
        
        return false;
    },
    
    // Exchange authorization code for tokens
    async exchangeCodeForTokens(authCode) {
        const tokenEndpoint = `https://${this.config.cognitoDomain}/oauth2/token`;
        
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.config.clientId,
            code: authCode,
            redirect_uri: this.config.redirectUri
        });
        
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }
        
        return await response.json();
    },
    
    // Decode JWT token
    decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    },
    
    // Calculate secret hash for authentication
    calculateSecretHash(username) {
        const message = username + this.config.clientId;
        return AWS.util.crypto.hmac(this.config.clientSecret, message, 'base64', 'sha256');
    },
    
    // Check if current page is public
    isPublicPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return this.config.publicPages.includes(currentPage);
    },
    
    // Get stored tokens
    getTokens() {
        return {
            accessToken: localStorage.getItem('accessToken'),
            idToken: localStorage.getItem('idToken'),
            refreshToken: localStorage.getItem('refreshToken'),
            userEmail: localStorage.getItem('userEmail')
        };
    },
    
    // Store tokens with timestamp for 30-minute sessions
    storeTokens(tokens, email) {
        const now = Date.now();
        const expiresAt = now + (30 * 60 * 1000); // 30 minutes from now
        
        localStorage.setItem('accessToken', tokens.AccessToken || tokens.access_token);
        localStorage.setItem('idToken', tokens.IdToken || tokens.id_token);
        localStorage.setItem('refreshToken', tokens.RefreshToken || tokens.refresh_token);
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        localStorage.setItem('tokenIssuedAt', now.toString());
        
        if (email) {
            localStorage.setItem('userEmail', email);
        }
        
        console.log('Tokens stored with 30-minute expiration');
    },
    
    // Clear tokens and session data
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('tokenIssuedAt');
        
        // Stop token refresh timer
        this.stopTokenRefreshTimer();
        
        console.log('All tokens and session data cleared');
    },
    
    // Check if tokens are expired or will expire soon (within 5 minutes)
    areTokensExpiring() {
        const expiresAt = localStorage.getItem('tokenExpiresAt');
        if (!expiresAt) return true;
        
        const now = Date.now();
        const expiration = parseInt(expiresAt);
        const fiveMinutesFromNow = now + (5 * 60 * 1000);
        
        return fiveMinutesFromNow >= expiration;
    },
    
    // Refresh tokens automatically
    async refreshTokens() {
        const refreshToken = localStorage.getItem('refreshToken');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!refreshToken || !userEmail) {
            console.log('No refresh token or email available');
            return false;
        }
        
        try {
            console.log('Refreshing tokens...');
            
            const params = {
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                ClientId: this.config.clientId,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                    SECRET_HASH: this.calculateSecretHash(userEmail)
                }
            };
            
            const result = await this.cognitoIdentityServiceProvider.initiateAuth(params).promise();
            
            if (result.AuthenticationResult) {
                // Store new tokens
                this.storeTokens(result.AuthenticationResult, userEmail);
                console.log('Tokens refreshed successfully');
                return true;
            }
            
        } catch (error) {
            console.error('Token refresh failed:', error);
            // If refresh fails, redirect to login
            this.signOut();
            return false;
        }
        
        return false;
    },
    
    // Start automatic token refresh timer
    startTokenRefreshTimer() {
        // Clear any existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Check every 5 minutes if tokens need refreshing
        this.refreshTimer = setInterval(async () => {
            if (this.areTokensExpiring()) {
                console.log('Tokens expiring soon, attempting refresh...');
                await this.refreshTokens();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
        
        console.log('Token refresh timer started - checking every 5 minutes');
    },
    
    // Stop token refresh timer
    stopTokenRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('Token refresh timer stopped');
        }
    },
    
    // Check authentication status with automatic token refresh
    async checkAuthentication() {
        // Skip authentication check for public pages
        if (this.isPublicPage()) {
            console.log('Public page detected, skipping authentication check');
            return true;
        }
        
        const tokens = this.getTokens();
        
        if (!tokens.accessToken || !tokens.userEmail) {
            console.log('No authentication tokens found, redirecting to login');
            this.redirectToLogin();
            return false;
        }
        
        // Check if tokens are expiring and refresh if needed
        if (this.areTokensExpiring()) {
            console.log('Tokens expiring, attempting refresh...');
            const refreshed = await this.refreshTokens();
            
            if (!refreshed) {
                console.log('Token refresh failed, redirecting to login');
                this.redirectToLogin();
                return false;
            }
        }
        
        try {
            // Verify token is still valid
            const params = { AccessToken: localStorage.getItem('accessToken') };
            const userData = await this.cognitoIdentityServiceProvider.getUser(params).promise();
            
            // Store user data
            this.currentUser = {
                email: tokens.userEmail,
                sub: userData.UserAttributes.find(attr => attr.Name === 'sub')?.Value,
                name: userData.UserAttributes.find(attr => attr.Name === 'name')?.Value || tokens.userEmail,
                attributes: userData.UserAttributes
            };
            
            // Configure AWS credentials for authenticated user
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: this.config.identityPoolId,
                Logins: {
                    [`cognito-idp.your-aws-region.amazonaws.com/${this.config.userPoolId}`]: tokens.idToken
                }
            });
            
            // Start token refresh timer if not already running
            if (!this.refreshTimer) {
                this.startTokenRefreshTimer();
            }
            
            // Refresh credentials
            await new Promise((resolve, reject) => {
                AWS.config.credentials.refresh((error) => {
                    if (error) {
                        console.warn('Credential refresh failed:', error);
                        resolve(); // Continue anyway
                    } else {
                        resolve();
                    }
                });
            });
            
            console.log('User authenticated successfully with 30-minute session:', this.currentUser.email);
            return true;
            
        } catch (error) {
            console.error('Authentication failed:', error);
            
            // Try to refresh tokens one more time
            const refreshed = await this.refreshTokens();
            if (!refreshed) {
                this.redirectToLogin();
                return false;
            }
            
            return true;
        }
    },
                });
            });
            
            console.log('Authentication verified for user:', this.currentUser.name);
            return true;
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.clearTokens();
            this.redirectToLogin();
            return false;
        }
    },
    
    // Redirect to login page
    redirectToLogin() {
        if (!this.isPublicPage()) {
            window.location.href = this.config.loginUrl;
        }
    },
    
    // Sign in user
    async signIn(email, password) {
        try {
            const params = {
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: this.config.clientId,
                AuthParameters: {
                    username = "your_username",
                    password = "your_secure_password"SECRET_HASH: this.calculateSecretHash(email)
                }
            };
            
            const result = await this.cognitoIdentityServiceProvider.initiateAuth(params).promise();
            this.storeTokens(result.AuthenticationResult, email);
            
            return { success: true, result };
            
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error };
        }
    },
    
    // Sign up user
    async signUp(email, password, name) {
        try {
            const params = {
                ClientId: this.config.clientId,
                username = "your_username",
                password = "your_secure_password"SecretHash: this.calculateSecretHash(email),
                UserAttributes: [
                    { Name: 'name', Value: name },
                    { Name: 'email', Value: email }
                ]
            };
            
            const result = await this.cognitoIdentityServiceProvider.signUp(params).promise();
            return { success: true, result };
            
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error };
        }
    },
    
    // Verify email
    async verifyEmail(email, code) {
        try {
            const params = {
                ClientId: this.config.clientId,
                username = "your_username",
                ConfirmationCode: code,
                SecretHash: this.calculateSecretHash(email)
            };
            
            const result = await this.cognitoIdentityServiceProvider.confirmSignUp(params).promise();
            return { success: true, result };
            
        } catch (error) {
            console.error('Verification error:', error);
            return { success: false, error };
        }
    },
    
    // Sign out user and clean up session
    signOut() {
        // Clear local tokens and session data
        this.clearTokens();
        this.current<REDACTED_CREDENTIAL>;
        AWS.config.credentials = null;
        
        // Clean up timers
        this.stopTokenRefreshTimer();
        if (this.sessionDisplayTimer) {
            clearInterval(this.sessionDisplayTimer);
            this.sessionDisplayTimer = null;
        }
        
        // Remove session info display
        const sessionElement = document.getElementById('session-info');
        if (sessionElement) {
            sessionElement.remove();
        }
        
        // Redirect to Cognito Hosted UI logout
        const logoutUrl = `https://${this.config.cognitoDomain}/logout?` +
            `client_id=${this.config.clientId}&` +
            `logout_uri=${encodeURIComponent(this.config.loginUrl)}`;
        
        console.log('User signed out, session terminated');
        window.location.href = logoutUrl;
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Get user ID (Cognito sub)
    getUserId() {
        return this.currentUser ? this.currentUser.sub : null;
    },
    
    // Initialize authentication with 30-minute session management
    async initialize() {
        console.log('Initializing Cognito authentication with 30-minute sessions...');
        
        // First, check if this is an OAuth callback
        const isCallback = await this.handleOAuthCallback();
        
        if (isCallback) {
            // OAuth callback handled, user is now authenticated
            console.log('OAuth callback processed successfully');
        }
        
        // Add authentication check to page
        const isAuthenticated = await this.checkAuthentication();
        
        if (isAuthenticated && this.currentUser) {
            // Start session management
            this.startTokenRefreshTimer();
            
            // Add session info to page
            this.addSessionInfoToPage();
            
            // Dispatch custom event for authenticated state
            window.dispatchEvent(new CustomEvent('cognitoAuthenticated', {
                detail: { 
                    <REDACTED_CREDENTIAL>.currentUser,
                    sessionDuration: '30 minutes',
                    autoRefresh: true
                }
            }));
            
            console.log('User authenticated with 30-minute session:', this.currentUser.email);
        } else if (!this.isPublicPage()) {
            // Not authenticated and not on public page, redirect to login
            console.log('User not authenticated, redirecting to login');
            this.redirectToLogin();
        }
        
        return isAuthenticated;
    },
    
    // Add session information to page header
    addSessionInfoToPage() {
        const expiresAt = localStorage.getItem('tokenExpiresAt');
        if (!expiresAt) return;
        
        const expiration = new Date(parseInt(expiresAt));
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((expiration - now) / 1000 / 60));
        
        // Try to find session info element
        let sessionElement = document.getElementById('session-info');
        if (!sessionElement) {
            // Create session info element if it doesn't exist
            sessionElement = document.createElement('div');
            sessionElement.id = 'session-info';
            sessionElement.className = 'session-info small text-muted';
            sessionElement.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 5px 10px; border-radius: 5px; z-index: 1000; font-size: 12px;';
            document.body.appendChild(sessionElement);
        }
        
        sessionElement.innerHTML = `
            <i class="bi bi-clock"></i> Session: ${timeLeft} min left
            <span class="ms-2" style="color: #28a745;">●</span>
        `;
        
        // Update every minute
        if (!this.sessionDisplayTimer) {
            this.sessionDisplayTimer = setInterval(() => {
                this.addSessionInfoToPage();
            }, 60000);
        }
    },
    
    // Add user info to page header (if element exists)
    addUserInfoToHeader() {
        if (!this.currentUser) return;
        
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = this.currentUser.email;
        }
    },
    
    // Add logout functionality to logout buttons
    addLogoutHandlers() {
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.signOut();
            });
        });
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await CognitoAuth.initialize();
        
        // Add user info to header if authenticated
        CognitoAuth.addUserInfoToHeader();
        
        // Add logout handlers
        CognitoAuth.addLogoutHandlers();
        
    } catch (error) {
        console.error('Failed to initialize Cognito authentication:', error);
    }
});

// Listen for authenticated event
window.addEventListener('cognitoAuthenticated', function(event) {
    console.log('User authenticated:', event.detail.user);
    
    // You can add custom logic here for when user is authenticated
    // For example, load user-specific data, show/hide elements, etc.
});

// Export for use in other scripts
window.CognitoAuth = CognitoAuth;
