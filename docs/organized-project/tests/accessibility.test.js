/**
 * Healthcare Platform - Accessibility Testing Suite
 * WCAG 2.1 AA Compliance Testing
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Custom axe configuration for healthcare applications
const healthcareAxeConfig = {
  rules: {
    // Enhanced color contrast for medical data
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    
    // Keyboard navigation requirements
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: true },
    
    // Screen reader compatibility
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    
    // Form accessibility
    'label': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    
    // Healthcare-specific rules
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
};

test.describe('Healthcare Platform Accessibility', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.goto('/');
    
    // Enable accessibility features
    await page.evaluate(() => {
      localStorage.setItem('accessibility-testing', 'true');
      localStorage.setItem('screen-reader-detected', 'true');
    });
  });

  test('Dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .configure(healthcareAxeConfig)
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Health forms are keyboard accessible', async ({ page }) => {
    await page.goto('/health-data-entry');
    
    // Test Tab navigation through form
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(focusedElement);
    
    // Test form completion with keyboard only
    await page.fill('input[data-health-type="blood-pressure-systolic"]', '120');
    await page.keyboard.press('Tab');
    await page.fill('input[data-health-type="blood-pressure-diastolic"]', '80');
    
    // Test form submission
    await page.keyboard.press('Enter');
    
    // Verify no accessibility violations
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Health charts have audio alternatives', async ({ page }) => {
    await page.goto('/health-reports');
    
    // Check for audio controls
    const audioControls = await page.locator('.audio-controls').first();
    await expect(audioControls).toBeVisible();
    
    // Test play chart audio button
    const playButton = await page.locator('.play-chart-audio').first();
    await expect(playButton).toBeVisible();
    await expect(playButton).toHaveAttribute('aria-describedby');
    
    // Test describe chart button
    const describeButton = await page.locator('.describe-chart').first();
    await expect(describeButton).toBeVisible();
    
    // Verify audio controls are keyboard accessible
    await playButton.focus();
    await page.keyboard.press('Enter');
    
    // Check for data table fallback
    const dataTable = await page.locator('.health-data-table').first();
    await expect(dataTable).toBeVisible();
  });

  test('Voice commands work correctly', async ({ page }) => {
    await page.goto('/ai-assistant');
    
    // Check voice controls are present
    const voiceControls = await page.locator('.voice-controls');
    await expect(voiceControls).toBeVisible();
    
    // Test voice toggle button
    const voiceToggle = await page.locator('#toggle-voice');
    await expect(voiceToggle).toHaveAttribute('aria-pressed');
    
    // Test voice input button
    const voiceInput = await page.locator('#start-voice-input');
    await expect(voiceInput).toBeVisible();
    await expect(voiceInput).toHaveAttribute('aria-describedby');
    
    // Test speech rate control
    const speechRate = await page.locator('#speech-rate');
    await expect(speechRate).toBeVisible();
    await expect(speechRate).toHaveAttribute('aria-describedby');
  });

  test('Error messages are accessible', async ({ page }) => {
    await page.goto('/health-data-entry');
    
    // Trigger validation error
    await page.fill('input[data-health-type="blood-pressure-systolic"]', '300');
    await page.keyboard.press('Tab');
    
    // Check error message appears
    const errorMessage = await page.locator('.error-message.show').first();
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    
    // Check field is marked as invalid
    const invalidField = await page.locator('input[aria-invalid="true"]').first();
    await expect(invalidField).toBeVisible();
    
    // Check field is associated with error message
    const describedBy = await invalidField.getAttribute('aria-describedby');
    expect(describedBy).toContain('error-');
  });

  test('Skip links work correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test skip to main content
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('.skip-link:focus').first();
    await expect(skipLink).toBeVisible();
    
    await page.keyboard.press('Enter');
    const mainContent = await page.locator('#main-content:focus');
    await expect(mainContent).toBeFocused();
  });

  test('Reduced motion preferences are respected', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');
    
    // Check that animations are disabled
    const animatedElements = await page.locator('.health-chart-animation');
    for (const element of await animatedElements.all()) {
      const animationDuration = await element.evaluate(el => 
        getComputedStyle(el).animationDuration
      );
      expect(animationDuration).toBe('0.01ms');
    }
    
    // Test motion toggle control
    const motionToggle = await page.locator('#reduce-motion');
    await expect(motionToggle).toBeVisible();
    await motionToggle.check();
    
    // Verify body class is applied
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('reduce-motion');
  });

  test('High contrast mode works correctly', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
    await page.goto('/dashboard');
    
    // Check high contrast styles are applied
    const healthCard = await page.locator('.vital-signs-card').first();
    const borderColor = await healthCard.evaluate(el => 
      getComputedStyle(el).borderColor
    );
    
    // Should have visible border in high contrast mode
    expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('Screen reader announcements work', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check live regions exist
    const politeRegion = await page.locator('#polite-announcements');
    await expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    
    const assertiveRegion = await page.locator('#assertive-announcements');
    await expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    
    // Test announcement functionality
    await page.evaluate(() => {
      window.healthcareAccessibility?.announceToUser('Test announcement');
    });
    
    // Check announcement appears in live region
    await expect(politeRegion).toHaveText('Test announcement');
  });

  test('Medical terms have explanations', async ({ page }) => {
    await page.goto('/health-reports');
    
    // Check medical terms have tooltips
    const medicalTerms = await page.locator('.medical-term');
    
    for (const term of await medicalTerms.all()) {
      await expect(term).toHaveAttribute('title');
      
      // Test keyboard access to tooltip
      await term.focus();
      const tooltip = await term.locator('.tooltip');
      await expect(tooltip).toBeVisible();
    }
  });

  test('Form validation provides clear guidance', async ({ page }) => {
    await page.goto('/health-data-entry');
    
    // Test real-time validation guidance
    const bpInput = await page.locator('input[data-health-type="blood-pressure-systolic"]');
    await bpInput.fill('250');
    
    // Check guidance appears
    const guidance = await page.locator('[id*="guidance"]').first();
    await expect(guidance).toBeVisible();
    await expect(guidance).toHaveAttribute('role', 'status');
    
    // Check field is associated with guidance
    const describedBy = await bpInput.getAttribute('aria-describedby');
    expect(describedBy).toContain('guidance');
  });

  test('Keyboard shortcuts work correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test Alt+H for health dashboard
    await page.keyboard.press('Alt+h');
    const healthDashboard = await page.locator('#health-dashboard:focus');
    await expect(healthDashboard).toBeFocused();
    
    // Test Alt+A for AI assistant
    await page.keyboard.press('Alt+a');
    const aiAssistant = await page.locator('#ai-assistant:focus');
    await expect(aiAssistant).toBeFocused();
  });

  test('Color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast', 'color-contrast-enhanced'])
      .analyze();
    
    expect(contrastResults.violations).toEqual([]);
    
    // Test specific health data elements
    const vitalSigns = await page.locator('.vital-signs-value');
    for (const element of await vitalSigns.all()) {
      const styles = await element.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Verify contrast ratio (this would need a contrast calculation function)
      expect(styles.color).not.toBe(styles.backgroundColor);
    }
  });

  test('Touch targets meet minimum size requirements', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test button sizes (minimum 44x44px)
    const buttons = await page.locator('button, .health-button');
    
    for (const button of await buttons.all()) {
      const boundingBox = await button.boundingBox();
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Page structure is semantic and logical', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const currentLevel = parseInt(tagName.charAt(1));
      
      // Heading levels should not skip (e.g., h1 -> h3)
      expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = currentLevel;
    }
    
    // Check landmark roles
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    
    // Check page has main heading
    await expect(page.locator('h1')).toBeVisible();
  });

});

// Performance testing for accessibility features
test.describe('Accessibility Performance', () => {
  
  test('Accessibility features do not impact performance', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Measure performance with accessibility features
    const performanceMetrics = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation')[0]);
    });
    
    const metrics = JSON.parse(performanceMetrics);
    
    // Page should load within reasonable time even with accessibility features
    expect(metrics.loadEventEnd - metrics.navigationStart).toBeLessThan(5000);
  });

  test('Voice recognition does not block UI', async ({ page }) => {
    await page.goto('/ai-assistant');
    
    // Start voice recognition
    await page.click('#start-voice-input');
    
    // UI should remain responsive
    await page.click('#toggle-voice');
    const toggleState = await page.getAttribute('#toggle-voice', 'aria-pressed');
    expect(['true', 'false']).toContain(toggleState);
  });

});

// Mobile accessibility testing
test.describe('Mobile Accessibility', () => {
  
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('Mobile interface is accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check touch targets are large enough on mobile
    const touchTargets = await page.locator('button, a, input[type="checkbox"], input[type="radio"]').all();
    
    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      expect(boundingBox.width).toBeGreaterThanOrEqual(48); // Larger for mobile
      expect(boundingBox.height).toBeGreaterThanOrEqual(48);
    }
    
    // Test mobile-specific accessibility features
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

});

module.exports = {
  healthcareAxeConfig
};
