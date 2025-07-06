// Global Theme Management for StayFit Health Companion
// This script should be included on all pages to ensure theme consistency

(function() {
    'use strict';
    
    const THEME_STORAGE_KEY = 'stayfit_theme';
    const THEME_API_ENDPOINT = '/api/theme/load';
    
    // Apply theme immediately to prevent flash
    async function loadAndApplyTheme() {
        try {
            let themeData = null;
            
            // Try to load from server first
            try {
                const response = await fetch(THEME_API_ENDPOINT, {
                    headers: {
                        'X-User-Id': getCurrentUserId()
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.theme) {
                        themeData = result.theme;
                        console.log('🎨 Theme loaded from server:', themeData.theme);
                    }
                }
            } catch (error) {
                console.log('📝 Server theme unavailable, using localStorage');
            }
            
            // Fall back to localStorage if server is unavailable
            if (!themeData) {
                const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme) {
                    themeData = JSON.parse(savedTheme);
                    console.log('🎨 Theme loaded from localStorage:', themeData.theme);
                }
            }
            
            // Apply theme
            if (themeData && themeData.theme) {
                applyTheme(themeData.theme);
                applyOtherSettings(themeData);
            } else {
                // Default to light theme
                applyTheme('light');
            }
            
        } catch (error) {
            console.error('Error loading theme:', error);
            applyTheme('light'); // Fallback to light theme
        }
    }
    
    function applyTheme(theme) {
        console.log(`🎨 Applying theme: ${theme}`);
        
        // Set theme attribute on document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Apply CSS custom properties
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.style.setProperty('--bg-primary', '#1a1a1a');
            root.style.setProperty('--bg-secondary', '#2d2d2d');
            root.style.setProperty('--bg-tertiary', '#404040');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b0b0b0');
            root.style.setProperty('--text-muted', '#6c757d');
            root.style.setProperty('--border-color', '#404040');
            root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
            root.style.setProperty('--input-bg', '#2d2d2d');
            root.style.setProperty('--input-border', '#404040');
            
            // Update Bootstrap theme
            document.body.setAttribute('data-bs-theme', 'dark');
            
        } else if (theme === 'light') {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8f9fa');
            root.style.setProperty('--bg-tertiary', '#e9ecef');
            root.style.setProperty('--text-primary', '#212529');
            root.style.setProperty('--text-secondary', '#6c757d');
            root.style.setProperty('--text-muted', '#adb5bd');
            root.style.setProperty('--border-color', '#dee2e6');
            root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
            root.style.setProperty('--input-bg', '#ffffff');
            root.style.setProperty('--input-border', '#ced4da');
            
            // Update Bootstrap theme
            document.body.setAttribute('data-bs-theme', 'light');
            
        } else if (theme === 'auto') {
            // Auto theme follows system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
            return;
        }
        
        // Store current theme globally
        window.currentTheme = theme;
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
        
        console.log(`✅ Theme applied: ${theme}`);
    }
    
    function applyOtherSettings(themeData) {
        const root = document.documentElement;
        
        // Apply font size
        if (themeData.fontSize) {
            const sizeMap = {
                'small': '14px',
                'medium': '16px',
                'large': '18px',
                'extra-large': '20px'
            };
            root.style.setProperty('--base-font-size', sizeMap[themeData.fontSize] || '16px');
        }
        
        // Apply compact mode
        if (themeData.compactMode) {
            root.classList.add('compact-mode');
        } else {
            root.classList.remove('compact-mode');
        }
        
        // Apply accessibility settings
        if (themeData.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
        
        if (themeData.reducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }
        
        // Apply custom colors
        if (themeData.primaryColor) {
            root.style.setProperty('--primary-color', themeData.primaryColor);
        }
        if (themeData.successColor) {
            root.style.setProperty('--success-color', themeData.successColor);
        }
        if (themeData.warningColor) {
            root.style.setProperty('--warning-color', themeData.warningColor);
        }
    }
    
    function getCurrentUserId() {
        return localStorage.getItem('stayfit_user_id') || 'default-user';
    }
    
    // Listen for system theme changes
    function setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(function(e) {
                if (window.currentTheme === 'auto') {
                    applyTheme('auto');
                }
            });
        }
    }
    
    // Global theme API
    window.StayFitTheme = {
        getCurrentTheme: () => window.currentTheme || 'light',
        
        setTheme: (theme) => {
            applyTheme(theme);
            
            // Save to localStorage immediately
            const themeData = {
                theme: theme,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeData));
            
            // Save to server (fire and forget)
            saveThemeToServer(themeData);
        },
        
        onThemeChange: (callback) => {
            window.addEventListener('themeChanged', callback);
        },
        
        reload: () => {
            loadAndApplyTheme();
        }
    };
    
    async function saveThemeToServer(themeData) {
        try {
            await fetch('/api/theme/save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-Id': getCurrentUserId()
                },
                body: JSON.stringify(themeData)
            });
        } catch (error) {
            console.log('Theme save to server failed (offline mode)');
        }
    }
    
    // Initialize theme as soon as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadAndApplyTheme();
            setupSystemThemeListener();
        });
    } else {
        loadAndApplyTheme();
        setupSystemThemeListener();
    }
    
    console.log('🎨 Global theme management initialized');
})();
