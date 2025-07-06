/**
 * Session Manager for 30-minute Cognito Sessions
 * Handles session persistence, automatic refresh, and cross-page navigation
 */

const SessionManager = {
    // Configuration
    config: {
        sessionDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
        refreshInterval: 5 * 60 * 1000,  // Check every 5 minutes
        warningTime: 5 * 60 * 1000,      // Warn 5 minutes before expiry
        pages: [
            'index.html',
            'dashboard.html', 
            'settings.html',
            'health-reports.html',
            'search.html',
            'digital-analysis.html',
            'abha-integration.html',
            'wiki.html'
        ]
    },
    
    // Initialize session management
    init() {
        console.log('Session Manager initialized for 30-minute sessions');
        
        // Listen for authentication events
        window.addEventListener('cognitoAuthenticated', (event) => {
            this.onAuthenticated(event.detail);
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSessionOnFocus();
            }
        });
        
        // Handle beforeunload to save session state
        window.addEventListener('beforeunload', () => {
            this.saveSessionState();
        });
        
        // Check session on page load
        this.checkSessionOnLoad();
    },
    
    // Handle successful authentication
    onAuthenticated(detail) {
        console.log('Session authenticated:', detail);
        
        // Update session display
        this.updateSessionDisplay();
        
        // Enable cross-page navigation
        this.enableCrossPageNavigation();
        
        // Start session monitoring
        this.startSessionMonitoring();
    },
    
    // Check session when page loads
    checkSessionOnLoad() {
        const tokens = this.getTokens();
        if (tokens.accessToken) {
            const expiresAt = localStorage.getItem('tokenExpiresAt');
            if (expiresAt) {
                const expiration = parseInt(expiresAt);
                const now = Date.now();
                
                if (now < expiration) {
                    console.log('Valid session found on page load');
                    this.updateSessionDisplay();
                    this.startSessionMonitoring();
                } else {
                    console.log('Session expired on page load');
                    this.handleSessionExpiry();
                }
            }
        }
    },
    
    // Check session when page regains focus
    checkSessionOnFocus() {
        const tokens = this.getTokens();
        if (tokens.accessToken) {
            const expiresAt = localStorage.getItem('tokenExpiresAt');
            if (expiresAt) {
                const expiration = parseInt(expiresAt);
                const now = Date.now();
                
                if (now >= expiration) {
                    console.log('Session expired while away');
                    this.handleSessionExpiry();
                } else {
                    console.log('Session still valid after focus');
                    this.updateSessionDisplay();
                }
            }
        }
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
    
    // Update session display
    updateSessionDisplay() {
        const expiresAt = localStorage.getItem('tokenExpiresAt');
        if (!expiresAt) return;
        
        const expiration = new Date(parseInt(expiresAt));
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((expiration - now) / 1000 / 60));
        
        // Update or create session display
        let sessionElement = document.getElementById('session-timer');
        if (!sessionElement) {
            sessionElement = document.createElement('div');
            sessionElement.id = 'session-timer';
            sessionElement.className = 'session-timer';
            sessionElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                z-index: 1050;
                font-size: 12px;
                font-weight: 500;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            document.body.appendChild(sessionElement);
            
            // Add click handler to show session details
            sessionElement.addEventListener('click', () => {
                this.showSessionDetails();
            });
        }
        
        // Update content and color based on time left
        const icon = timeLeft > 10 ? '🟢' : timeLeft > 5 ? '🟡' : '🔴';
        const bgColor = timeLeft > 10 ? 'linear-gradient(135deg, #28a745, #20c997)' : 
                       timeLeft > 5 ? 'linear-gradient(135deg, #ffc107, #fd7e14)' : 
                       'linear-gradient(135deg, #dc3545, #e83e8c)';
        
        sessionElement.style.background = bgColor;
        sessionElement.innerHTML = `
            ${icon} Session: ${timeLeft}m
            <small style="opacity: 0.8; margin-left: 5px;">30min total</small>
        `;
        
        // Show warning if session is expiring soon
        if (timeLeft <= 5 && timeLeft > 0) {
            this.showExpiryWarning(timeLeft);
        }
    },
    
    // Show session expiry warning
    showExpiryWarning(timeLeft) {
        // Avoid multiple warnings
        if (this.warningShown) return;
        this.warningShown = true;
        
        // Create warning modal
        const warningModal = document.createElement('div');
        warningModal.className = 'session-warning-modal';
        warningModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        warningModal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="font-size: 48px; margin-bottom: 20px;">⏰</div>
                <h4 style="color: #dc3545; margin-bottom: 15px;">Session Expiring Soon</h4>
                <p style="margin-bottom: 20px; color: #666;">
                    Your session will expire in <strong>${timeLeft} minutes</strong>.<br>
                    Click "Extend Session" to continue working.
                </p>
                <div>
                    <button onclick="SessionManager.extendSession()" class="btn btn-primary me-2">
                        Extend Session
                    </button>
                    <button onclick="SessionManager.closeWarning()" class="btn btn-outline-secondary">
                        Continue
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warningModal);
        this.currentWarningModal = warningModal;
        
        // Auto-close after 30 seconds if no action
        setTimeout(() => {
            if (this.currentWarningModal) {
                this.closeWarning();
            }
        }, 30000);
    },
    
    // Extend session by refreshing tokens
    async extendSession() {
        console.log('Extending session...');
        
        if (window.CognitoAuth && typeof window.CognitoAuth.refreshTokens === 'function') {
            const refreshed = await window.CognitoAuth.refreshTokens();
            
            if (refreshed) {
                this.closeWarning();
                this.warningShown = false;
                this.updateSessionDisplay();
                
                // Show success message
                this.showMessage('Session extended for 30 more minutes!', 'success');
            } else {
                this.showMessage('Failed to extend session. Please sign in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        }
    },
    
    // Close warning modal
    closeWarning() {
        if (this.currentWarningModal) {
            this.currentWarningModal.remove();
            this.currentWarningModal = null;
        }
    },
    
    // Show session details modal
    showSessionDetails() {
        const tokens = this.getTokens();
        const expiresAt = localStorage.getItem('tokenExpiresAt');
        const issuedAt = localStorage.getItem('tokenIssuedAt');
        
        if (!expiresAt || !issuedAt) return;
        
        const expiration = new Date(parseInt(expiresAt));
        const issued = new Date(parseInt(issuedAt));
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((expiration - now) / 1000 / 60));
        const timeUsed = Math.floor((now - issued) / 1000 / 60);
        
        const modal = document.createElement('div');
        modal.className = 'session-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                    <h4 style="margin: 0; color: #333;">Session Details</h4>
                    <button onclick="this.closest('.session-details-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>User:</span>
                        <strong>${tokens.userEmail}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Session Started:</span>
                        <strong>${issued.toLocaleTimeString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Session Expires:</span>
                        <strong>${expiration.toLocaleTimeString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Time Used:</span>
                        <strong>${timeUsed} minutes</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Time Remaining:</span>
                        <strong style="color: ${timeLeft > 10 ? '#28a745' : timeLeft > 5 ? '#ffc107' : '#dc3545'}">${timeLeft} minutes</strong>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="SessionManager.extendSession(); this.closest('.session-details-modal').remove();" class="btn btn-primary me-2">
                        Extend Session
                    </button>
                    <button onclick="this.closest('.session-details-modal').remove()" class="btn btn-outline-secondary">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // Start session monitoring
    startSessionMonitoring() {
        // Clear existing timer
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        
        // Update display every minute
        this.monitoringTimer = setInterval(() => {
            this.updateSessionDisplay();
            
            // Check if session has expired
            const expiresAt = localStorage.getItem('tokenExpiresAt');
            if (expiresAt) {
                const expiration = parseInt(expiresAt);
                const now = Date.now();
                
                if (now >= expiration) {
                    console.log('Session expired during monitoring');
                    this.handleSessionExpiry();
                }
            }
        }, 60000); // Every minute
        
        console.log('Session monitoring started');
    },
    
    // Handle session expiry
    handleSessionExpiry() {
        console.log('Handling session expiry');
        
        // Clear all timers
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        // Remove session display
        const sessionElement = document.getElementById('session-timer');
        if (sessionElement) {
            sessionElement.remove();
        }
        
        // Show expiry message
        this.showMessage('Your session has expired. Please sign in again.', 'warning');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    },
    
    // Enable cross-page navigation with session persistence
    enableCrossPageNavigation() {
        // Add session info to all internal links
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Check if it's an internal page
            if (this.config.pages.some(page => href.includes(page))) {
                link.addEventListener('click', (e) => {
                    // Save current session state before navigation
                    this.saveSessionState();
                });
            }
        });
    },
    
    // Save session state
    saveSessionState() {
        const sessionState = {
            lastActivity: Date.now(),
            currentPage: window.location.pathname.split('/').pop() || 'index.html'
        };
        
        localStorage.setItem('sessionState', JSON.stringify(sessionState));
    },
    
    // Show message to user
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} session-message`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        messageDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>${message}</span>
                <button type="button" class="btn-close" onclick="this.closest('.session-message').remove()"></button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
};

// Initialize session manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SessionManager.init();
});

// Make SessionManager globally available
window.SessionManager = SessionManager;
