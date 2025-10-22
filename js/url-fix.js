// Dynamic URL configuration
const BASE_URL = window.location.origin;

// Function to make URLs dynamic
function makeUrlsDynamic() {
    // Update navigation links
    const navLinks = document.querySelectorAll('.nav-link[href]');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
            link.setAttribute('href', `${BASE_URL}/${href}`);
        }
    });
    
    // Update button links
    const buttonLinks = document.querySelectorAll('a.btn[href]');
    buttonLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
            link.setAttribute('href', `${BASE_URL}/${href}`);
        }
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', makeUrlsDynamic);
