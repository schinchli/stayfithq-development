/**
 * Enhanced AI Backend Integration with Sample Questions Cache
 * Provides instant responses for cached sample questions
 */

// Configuration
const AI_ENDPOINT = '<REDACTED_CREDENTIAL>';

// Override the existing sendMessage function with cache support
window.sendMessage = async function() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!chatInput || !chatMessages) {
        console.error('Chat elements not found');
        return;
    }
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    try {
        let response;
        let isCached = false;
        
        // Check if this is a cached sample question
        if (window.isSampleQuestion && window.getCachedSampleResponse) {
            const cachedResponse = window.getCachedSampleResponse(message);
            
            if (cachedResponse) {
                // Use cached response
                response = {
                    response: cachedResponse.response,
                    cached: true,
                    cache_hit: true,
                    guardrails_active: cachedResponse.guardrails_active,
                    search_results: cachedResponse.search_results || []
                };
                isCached = true;
                
                // Add small delay to simulate processing (for better UX)
                await new Promise(resolve => setTimeout(resolve, 800));
                
                console.log('✅ Using cached response for sample question');
            }
        }
        
        // If not cached, make API call
        if (!isCached) {
            const apiResponse = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    user_id: 'web_user',
                    session_id: 'web_session'
                })
            });
            
            if (!apiResponse.ok) {
                throw new Error(`API request failed: ${apiResponse.status}`);
            }
            
            response = await apiResponse.json();
            console.log('✅ Received API response');
        }
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add AI response to chat
        addMessageToChat(response.response, 'ai', {
            cached: isCached,
            guardrails: response.guardrails_active,
            searchResults: response.search_results
        });
        
        // Update status indicators if available
        if (response.guardrails_active !== undefined) {
            updateStatusIndicators(response);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Show error message
        addMessageToChat(
            "I'm having trouble processing your request right now. Please try again later.\n\nFor immediate health concerns, please contact your healthcare provider.",
            'ai',
            { error: true }
        );
    }
};

// Enhanced message display function
function addMessageToChat(message, sender, options = {}) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start mb-3 justify-content-end">
                <div class="message-content">
                    <div class="bg-primary text-white p-3 rounded">
                        <p class="mb-0">${escapeHtml(message)}</p>
                    </div>
                    <small class="text-muted">You • ${timestamp}</small>
                </div>
                <div class="avatar bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center ms-3" style="width: 40px; height: 40px;">
                    <i class="bi bi-person"></i>
                </div>
            </div>
        `;
    } else {
        // AI message with enhanced indicators
        const cacheIndicator = options.cached ? 
            '<span class="badge bg-info ms-2" title="Instant cached response"><i class="bi bi-lightning-fill"></i> Cached</span>' : '';
        
        const guardrailsIndicator = options.guardrails ? 
            '<span class="badge bg-success ms-1" title="AI safety guardrails active"><i class="bi bi-shield-check"></i></span>' : '';
        
        const errorIndicator = options.error ? 
            '<span class="badge bg-warning ms-1" title="Fallback response"><i class="bi bi-exclamation-triangle"></i></span>' : '';
        
        messageDiv.innerHTML = `
            <div class="d-flex align-items-start mb-3">
                <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                    <i class="bi bi-robot"></i>
                </div>
                <div class="message-content">
                    <div class="bg-light p-3 rounded">
                        <div class="message-text">${formatMessage(message)}</div>
                    </div>
                    <small class="text-muted">
                        AI Assistant • ${timestamp}
                        ${cacheIndicator}
                        ${guardrailsIndicator}
                        ${errorIndicator}
                    </small>
                </div>
            </div>
        `;
        
        // Add search results if available
        if (options.searchResults && options.searchResults.length > 0) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'search-results-preview mt-2';
            searchDiv.innerHTML = `
                <div class="alert alert-info alert-sm">
                    <small>
                        <i class="bi bi-database me-1"></i>
                        Based on ${options.searchResults.length} health data points
                    </small>
                </div>
            `;
            messageDiv.querySelector('.message-content').appendChild(searchDiv);
        }
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format message text (convert line breaks, etc.)
function formatMessage(text) {
    return escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/•/g, '&bull;');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;
    
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'chat-message ai-message';
    typingDiv.innerHTML = `
        <div class="d-flex align-items-start mb-3">
            <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                <i class="bi bi-robot"></i>
            </div>
            <div class="message-content">
                <div class="bg-light p-3 rounded">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <small class="text-muted">AI Assistant is thinking...</small>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
    if (typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }
}

// Update status indicators
function updateStatusIndicators(response) {
    // Update mode status
    const modeStatus = document.querySelector('[data-status="mode"]');
    if (modeStatus) {
        const modeText = response.cached ? 'Cached + Live AI' : 'Live AI Assistant';
        modeStatus.innerHTML = `<span class="badge bg-success">${modeText}</span>`;
    }
}

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

console.log('✅ Enhanced AI Backend Integration with Cache loaded');
