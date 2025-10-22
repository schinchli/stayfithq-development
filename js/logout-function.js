// Logout function
function logout() {
    // Clear all authentication tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/login.html';
}
