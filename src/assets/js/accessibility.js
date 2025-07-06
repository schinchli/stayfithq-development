/**
 * Healthcare Platform - Accessibility JavaScript
 * WCAG 2.1 AA Compliant Interactive Features
 */

class HealthcareAccessibility {
  constructor() {
    this.init();
  }

  init() {
    this.setupSkipLinks();
    this.setupKeyboardNavigation();
    this.setupVoiceInterface();
    this.setupMotionControls();
    this.setupFormAccessibility();
    this.setupChartAccessibility();
    this.setupLiveRegions();
    this.setupScreenReaderSupport();
  }

  // <REDACTED_CREDENTIAL>==================================
  // SKIP LINKS AND NAVIGATION
  // <REDACTED_CREDENTIAL>==================================

  setupSkipLinks() {
    const skipLinksHTML = `
      <div class="skip-links">
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#navigation" class="skip-link">Skip to navigation</a>
        <a href="#health-dashboard" class="skip-link">Skip to health dashboard</a>
        <a href="#ai-assistant" class="skip-link">Skip to AI assistant</a>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', skipLinksHTML);
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard navigation for health widgets
    const healthWidgets = document.querySelectorAll('.health-widget');
    
    healthWidgets.forEach(widget => {
      this.makeWidgetKeyboardAccessible(widget);
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + H: Go to health dashboard
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        this.focusElement('#health-dashboard');
        this.announceToUser('Navigated to health dashboard');
      }
      
      // Alt + A: Open AI assistant
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        this.focusElement('#ai-assistant');
        this.announceToUser('Opened AI health assistant');
      }
      
      // Alt + M: Open main menu
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        this.focusElement('#main-navigation');
        this.announceToUser('Opened main menu');
      }
    });
  }

  makeWidgetKeyboardAccessible(widget) {
    widget.setAttribute('tabindex', '0');
    widget.setAttribute('role', 'application');
    
    const items = widget.querySelectorAll('.widget-item');
    let currentIndex = 0;

    widget.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          currentIndex = (currentIndex + 1) % items.length;
          this.focusWidgetItem(items[currentIndex]);
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          currentIndex = (currentIndex - 1 + items.length) % items.length;
          this.focusWidgetItem(items[currentIndex]);
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          items[currentIndex].click();
          break;
          
        case 'Home':
          e.preventDefault();
          currentIndex = 0;
          this.focusWidgetItem(items[currentIndex]);
          break;
          
        case 'End':
          e.preventDefault();
          currentIndex = items.length - 1;
          this.focusWidgetItem(items[currentIndex]);
          break;
      }
    });
  }

  focusWidgetItem(item) {
    // Remove previous focus
    const previousFocus = document.querySelector('.widget-item.focused');
    if (previousFocus) {
      previousFocus.classList.remove('focused');
    }
    
    // Set new focus
    item.classList.add('focused');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Announce to screen readers
    const itemText = item.textContent || item.getAttribute('aria-label');
    this.announceToUser(`Focused on ${itemText}`);
  }

  // <REDACTED_CREDENTIAL>==================================
  // VOICE INTERFACE
  // <REDACTED_CREDENTIAL>==================================

  setupVoiceInterface() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.speechSynthesis = window.speechSynthesis;
    this.voiceEnabled = localStorage.getItem('voice-enabled') !== 'false';
    
    this.setupVoiceControls();
    this.setupVoiceCommands();
  }

  setupVoiceControls() {
    const voiceControlsHTML = `
      <div class="voice-controls" role="group" aria-labelledby="voice-controls-title">
        <h3 id="voice-controls-title">Voice Controls</h3>
        
        <button id="toggle-voice" class="audio-control-button" 
                aria-pressed="${this.voiceEnabled}">
          <span class="icon" aria-hidden="true">🎤</span>
          Voice Commands: ${this.voiceEnabled ? 'On' : 'Off'}
        </button>
        
        <button id="start-voice-input" class="audio-control-button"
                aria-describedby="voice-input-help">
          <span class="icon" aria-hidden="true">🗣️</span>
          Start Voice Input
        </button>
        <div id="voice-input-help" class="help-text">
          Click to start speaking your health question or command
        </div>
        
        <div class="speed-control">
          <label for="speech-rate">Speech Rate:</label>
          <input type="range" id="speech-rate" min="0.5" max="2" step="0.1" value="0.8"
                 aria-describedby="speech-rate-help">
          <span id="speech-rate-value">0.8x</span>
        </div>
        <div id="speech-rate-help" class="help-text">
          Adjust how fast the AI speaks responses (0.5x to 2x speed)
        </div>
        
        <div class="voice-status" role="status" aria-live="polite">
          <span id="voice-status-text">Ready</span>
        </div>
      </div>
    `;

    // Add voice controls to AI assistant section
    const aiSection = document.querySelector('#ai-assistant') || document.querySelector('.ai-chat-container');
    if (aiSection) {
      aiSection.insertAdjacentHTML('afterbegin', voiceControlsHTML);
      this.setupVoiceEventListeners();
    }
  }

  setupVoiceEventListeners() {
    document.getElementById('toggle-voice').addEventListener('click', (e) => {
      this.voiceEnabled = !this.voiceEnabled;
      localStorage.setItem('voice-enabled', this.voiceEnabled);
      
      e.target.setAttribute('aria-pressed', this.voiceEnabled);
      e.target.innerHTML = `
        <span class="icon" aria-hidden="true">🎤</span>
        Voice Commands: ${this.voiceEnabled ? 'On' : 'Off'}
      `;
      
      this.announceToUser(`Voice commands ${this.voiceEnabled ? 'enabled' : 'disabled'}`);
    });

    document.getElementById('start-voice-input').addEventListener('click', () => {
      if (this.voiceEnabled) {
        this.startVoiceInput();
      }
    });

    document.getElementById('speech-rate').addEventListener('input', (e) => {
      const rate = e.target.value;
      document.getElementById('speech-rate-value').textContent = `${rate}x`;
    });
  }

  setupVoiceCommands() {
    this.voiceCommands = {
      'show blood pressure': () => this.navigateToSection('blood-pressure'),
      'show heart rate': () => this.navigateToSection('heart-rate'),
      'show weight': () => this.navigateToSection('weight'),
      'show medications': () => this.navigateToSection('medications'),
      'read latest results': () => this.readLatestResults(),
      'schedule appointment': () => this.openAppointmentScheduler(),
      'emergency help': () => this.triggerEmergencyProtocol(),
      'help': () => this.showVoiceHelp()
    };

    this.speechRecognition.continuous = false;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';

    this.speechRecognition.onstart = () => {
      this.updateVoiceStatus('Listening...', 'listening');
    };

    this.speechRecognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase().trim();
      this.processVoiceCommand(command);
    };

    this.speechRecognition.onerror = (event) => {
      this.updateVoiceStatus('Error occurred', 'error');
      this.announceToUser('Sorry, I couldn\'t understand. Please try again.');
    };

    this.speechRecognition.onend = () => {
      this.updateVoiceStatus('Ready', 'ready');
    };
  }

  startVoiceInput() {
    if (!this.voiceEnabled) return;
    
    try {
      this.speechRecognition.start();
      this.announceToUser('Listening for your command...');
    } catch (error) {
      this.announceToUser('Voice input is not available right now.');
    }
  }

  processVoiceCommand(command) {
    this.updateVoiceStatus('Processing...', 'processing');
    
    // Find matching command
    const matchedCommand = Object.keys(this.voiceCommands).find(cmd => 
      command.includes(cmd)
    );

    if (matchedCommand) {
      this.voiceCommands[matchedCommand]();
      this.announceToUser(`Executing: ${matchedCommand}`);
    } else {
      // Send to AI assistant if no direct command match
      this.sendToAIAssistant(command);
    }
  }

  updateVoiceStatus(text, status) {
    const statusElement = document.getElementById('voice-status-text');
    const statusContainer = statusElement.parentElement;
    
    statusElement.textContent = text;
    statusContainer.className = `voice-status ${status}`;
  }

  // <REDACTED_CREDENTIAL>==================================
  // MOTION CONTROLS
  // <REDACTED_CREDENTIAL>==================================

  setupMotionControls() {
    const motionControlsHTML = `
      <div class="motion-controls" role="group" aria-labelledby="motion-controls-title">
        <h3 id="motion-controls-title" class="sr-only">Motion Preferences</h3>
        <input type="checkbox" id="reduce-motion" class="reduce-motion-toggle">
        <label for="reduce-motion">Reduce Motion</label>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', motionControlsHTML);

    // Check user's system preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const userPreference = localStorage.getItem('reduce-motion') === 'true';
    
    if (prefersReducedMotion || userPreference) {
      document.getElementById('reduce-motion').checked = true;
      document.body.classList.add('reduce-motion');
    }

    document.getElementById('reduce-motion').addEventListener('change', (e) => {
      this.toggleMotion(e.target.checked);
    });
  }

  toggleMotion(reduce) {
    if (reduce) {
      document.body.classList.add('reduce-motion');
      localStorage.setItem('reduce-motion', 'true');
      this.announceToUser('Animations disabled for better accessibility');
    } else {
      document.body.classList.remove('reduce-motion');
      localStorage.setItem('reduce-motion', 'false');
      this.announceToUser('Animations enabled');
    }
  }

  // <REDACTED_CREDENTIAL>==================================
  // FORM ACCESSIBILITY
  // <REDACTED_CREDENTIAL>==================================

  setupFormAccessibility() {
    const forms = document.querySelectorAll('.health-form, form');
    
    forms.forEach(form => {
      this.enhanceFormAccessibility(form);
    });
  }

  enhanceFormAccessibility(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Add real-time validation
      input.addEventListener('blur', (e) => {
        this.validateField(e.target);
      });

      // Add helpful guidance
      input.addEventListener('input', (e) => {
        this.provideFieldGuidance(e.target);
      });

      // Ensure proper labeling
      this.ensureProperLabeling(input);
    });

    // Form submission handling
    form.addEventListener('submit', (e) => {
      if (!this.validateForm(form)) {
        e.preventDefault();
        this.focusFirstError(form);
      }
    });
  }

  validateField(field) {
    const fieldType = field.getAttribute('data-health-type');
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Health-specific validation
    switch(fieldType) {
      case 'blood-pressure-systolic':
        if (value && (value < 70 || value > 250)) {
          isValid = false;
          errorMessage = 'Systolic blood pressure should be between 70 and 250 mmHg';
        }
        break;
        
      case 'blood-pressure-diastolic':
        if (value && (value < 40 || value > 150)) {
          isValid = false;
          errorMessage = 'Diastolic blood pressure should be between 40 and 150 mmHg';
        }
        break;
        
      case 'heart-rate':
        if (value && (value < 30 || value > 200)) {
          isValid = false;
          errorMessage = 'Heart rate should be between 30 and 200 BPM';
        }
        break;
        
      case 'weight':
        if (value && (value < 20 || value > 1000)) {
          isValid = false;
          errorMessage = 'Please enter a valid weight';
        }
        break;
    }

    // Generic validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }

  showFieldValidation(field, isValid, errorMessage) {
    const fieldContainer = field.closest('.form-group') || field.parentElement;
    const errorContainer = fieldContainer.querySelector('.error-message') || 
                          this.createErrorContainer(fieldContainer);

    if (isValid) {
      field.setAttribute('aria-invalid', 'false');
      fieldContainer.classList.remove('error');
      errorContainer.classList.remove('show');
      errorContainer.textContent = '';
    } else {
      field.setAttribute('aria-invalid', 'true');
      fieldContainer.classList.add('error');
      errorContainer.classList.add('show');
      errorContainer.textContent = errorMessage;
      
      // Ensure error is associated with field
      if (!field.getAttribute('aria-describedby')?.includes(errorContainer.id)) {
        const describedBy = field.getAttribute('aria-describedby') || '';
        field.setAttribute('aria-describedby', `${describedBy} ${errorContainer.id}`.trim());
      }
    }
  }

  createErrorContainer(fieldContainer) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    errorContainer.setAttribute('role', 'alert');
    errorContainer.setAttribute('aria-live', 'polite');
    
    fieldContainer.appendChild(errorContainer);
    return errorContainer;
  }

  // <REDACTED_CREDENTIAL>==================================
  // CHART ACCESSIBILITY
  // <REDACTED_CREDENTIAL>==================================

  setupChartAccessibility() {
    const charts = document.querySelectorAll('.health-chart, [data-chart]');
    
    charts.forEach(chart => {
      this.makeChartAccessible(chart);
    });
  }

  makeChartAccessible(chartContainer) {
    // Add audio controls
    this.addAudioControls(chartContainer);
    
    // Create data table fallback
    this.createDataTableFallback(chartContainer);
    
    // Add keyboard navigation
    this.addChartKeyboardNavigation(chartContainer);
  }

  addAudioControls(chartContainer) {
    const audioControlsHTML = `
      <div class="audio-controls" role="group" aria-labelledby="audio-controls-title-${chartContainer.id}">
        <h3 id="audio-controls-title-${chartContainer.id}">Chart Audio Controls</h3>
        
        <button class="audio-control-button play-chart-audio" 
                aria-describedby="play-description-${chartContainer.id}">
          <span class="icon" aria-hidden="true">🔊</span>
          Play Chart Audio
        </button>
        <div id="play-description-${chartContainer.id}" class="help-text">
          Listen to your health data as musical tones. Higher tones represent higher values.
        </div>
        
        <div class="speed-control">
          <label for="chart-playback-speed-${chartContainer.id}">Playback Speed:</label>
          <input type="range" id="chart-playback-speed-${chartContainer.id}" 
                 min="0.5" max="2" step="0.1" value="1"
                 aria-describedby="chart-speed-description-${chartContainer.id}">
          <span class="speed-value">1.0x</span>
        </div>
        <div id="chart-speed-description-${chartContainer.id}" class="help-text">
          Adjust how fast the audio plays back
        </div>
        
        <button class="audio-control-button describe-chart" 
                aria-describedby="describe-description-${chartContainer.id}">
          <span class="icon" aria-hidden="true">📊</span>
          Describe Chart
        </button>
        <div id="describe-description-${chartContainer.id}" class="help-text">
          Get a text description of the chart data and trends
        </div>
      </div>
    `;

    chartContainer.insertAdjacentHTML('beforeend', audioControlsHTML);
    
    // Add event listeners
    const playButton = chartContainer.querySelector('.play-chart-audio');
    const describeButton = chartContainer.querySelector('.describe-chart');
    const speedControl = chartContainer.querySelector(`#chart-playback-speed-${chartContainer.id}`);
    
    playButton.addEventListener('click', () => {
      this.playChartAudio(chartContainer);
    });
    
    describeButton.addEventListener('click', () => {
      this.describeChart(chartContainer);
    });
    
    speedControl.addEventListener('input', (e) => {
      const speedValue = chartContainer.querySelector('.speed-value');
      speedValue.textContent = `${e.target.value}x`;
    });
  }

  playChartAudio(chartContainer) {
    // Get chart data (this would be customized based on your chart library)
    const chartData = this.extractChartData(chartContainer);
    
    if (!chartData || chartData.length === 0) {
      this.announceToUser('No chart data available for audio playback');
      return;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const speed = parseFloat(chartContainer.querySelector('[id*="playback-speed"]').value);
    
    // Convert data to audio frequencies
    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    const range = maxValue - minValue;
    
    chartData.forEach((dataPoint, index) => {
      const normalizedValue = (dataPoint.value - minValue) / range;
      const frequency = 220 + (normalizedValue * 660); // A3 to E5
      
      setTimeout(() => {
        this.playTone(audioContext, frequency, 0.3 / speed);
        this.announceDataPoint(dataPoint);
      }, index * (400 / speed));
    });
    
    this.announceToUser('Playing chart audio. Each tone represents a data point.');
  }

  playTone(audioContext, frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  // <REDACTED_CREDENTIAL>==================================
  // LIVE REGIONS AND ANNOUNCEMENTS
  // <REDACTED_CREDENTIAL>==================================

  setupLiveRegions() {
    // Create live regions for announcements
    const liveRegionsHTML = `
      <div id="polite-announcements" class="live-region" aria-live="polite" aria-atomic="true"></div>
      <div id="assertive-announcements" class="live-region" aria-live="assertive" aria-atomic="true"></div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', liveRegionsHTML);
  }

  announceToUser(message, priority = 'polite') {
    const liveRegion = document.getElementById(`${priority}-announcements`);
    
    // Clear previous announcement
    liveRegion.textContent = '';
    
    // Add new announcement after a brief delay to ensure it's announced
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
    
    // Clear announcement after it's been read
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 3000);
  }

  announceDataPoint(dataPoint) {
    const announcement = `${dataPoint.date || 'Data point'}: ${dataPoint.value} ${dataPoint.unit || ''}`;
    this.announceToUser(announcement);
  }

  // <REDACTED_CREDENTIAL>==================================
  // SCREEN READER SUPPORT
  // <REDACTED_CREDENTIAL>==================================

  setupScreenReaderSupport() {
    // Detect screen reader usage
    this.screenReaderDetected = this.detectScreenReader();
    
    if (this.screenReaderDetected) {
      document.body.classList.add('screen-reader-active');
      this.enhanceForScreenReaders();
    }
  }

  detectScreenReader() {
    // Various methods to detect screen reader usage
    return !!(
      navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack/i) ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]') ||
      localStorage.getItem('screen-reader-detected') === 'true'
    );
  }

  enhanceForScreenReaders() {
    // Add more descriptive labels
    this.addDescriptiveLabels();
    
    // Enhance table headers
    this.enhanceTableHeaders();
    
    // Add landmark roles
    this.addLandmarkRoles();
  }

  addDescriptiveLabels() {
    // Add descriptive labels to health data
    const healthValues = document.querySelectorAll('[data-health-value]');
    
    healthValues.forEach(element => {
      const value = element.textContent;
      const type = element.getAttribute('data-health-type');
      const unit = element.getAttribute('data-unit') || '';
      
      const description = this.getHealthValueDescription(type, value, unit);
      element.setAttribute('aria-label', description);
    });
  }

  getHealthValueDescription(type, value, unit) {
    const descriptions = {
      'blood-pressure-systolic': `Systolic blood pressure: ${value} ${unit}`,
      'blood-pressure-diastolic': `Diastolic blood pressure: ${value} ${unit}`,
      'heart-rate': `Heart rate: ${value} beats per minute`,
      'weight': `Weight: ${value} ${unit}`,
      'temperature': `Body temperature: ${value} degrees ${unit}`,
      'glucose': `Blood glucose: ${value} ${unit}`
    };
    
    return descriptions[type] || `${type}: ${value} ${unit}`;
  }

  // <REDACTED_CREDENTIAL>==================================
  // UTILITY METHODS
  // <REDACTED_CREDENTIAL>==================================

  focusElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  extractChartData(chartContainer) {
    // This would be customized based on your chart library
    // For now, return mock data
    return [
      { date: '2024-01-01', value: 120, unit: 'mmHg' },
      { date: '2024-02-01', value: 125, unit: 'mmHg' },
      { date: '2024-03-01', value: 118, unit: 'mmHg' },
      { date: '2024-04-01', value: 122, unit: 'mmHg' }
    ];
  }

  speak(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    const rate = document.getElementById('speech-rate')?.value || 0.8;
    
    utterance.rate = parseFloat(rate);
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    window.speechSynthesis.speak(utterance);
  }
}

// Initialize accessibility features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HealthcareAccessibility();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HealthcareAccessibility;
}
