#!/usr/bin/env node

/**
 * Settings Validation Test Suite
 * Testing form validation, data integrity, and user experience
 */

class SettingsValidationTestSuite {
  constructor() {
    this.testResults = {
      suiteName: 'Settings Validation Tests',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
      endTime: null
    };
  }

  // Test execution helper
  async runTest(testName, testFunction) {
    const startTime = Date.now();
    try {
      console.log(`⚙️ Running: ${testName}`);
      await testFunction();
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        error: null
      });
      this.testResults.passed++;
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.tests.push({
        name: testName,
        status: 'FAILED',
        duration: `${duration}ms`,
        error: error.message
      });
      this.testResults.failed++;
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
    }
  }

  // Form Validation Tests
  async testFormValidation() {
    await this.runTest('Required Field Validation', async () => {
      const requiredFields = [
        { id: 'patient-name', name: 'Full Name', value: '' },
        { id: 'date-of-birth', name: 'Date of Birth', value: '' },
        { id: 'gender', name: 'Gender', value: '' },
        { id: 'emergency-name', name: 'Emergency Contact Name', value: '' },
        { id: 'emergency-relationship', name: 'Emergency Contact Relationship', value: '' },
        { id: 'emergency-phone', name: 'Emergency Contact Phone', value: '' }
      ];

      const validateRequiredFields = (fields) => {
        const errors = [];
        fields.forEach(field => {
          if (!field.value || field.value.trim() === '') {
            errors.push(`${field.name} is required`);
          }
        });
        return errors;
      };

      const errors = validateRequiredFields(requiredFields);
      if (errors.length !== requiredFields.length) {
        throw new Error('Required field validation failed');
      }

      // Test with valid data
      const validFields = requiredFields.map(field => ({
        ...field,
        value: field.id === 'date-of-birth' ? '1990-01-01' : 
               field.id === 'gender' ? 'male' : 
               field.id === 'emergency-relationship' ? 'spouse' : 'Test Value'
      }));

      const validErrors = validateRequiredFields(validFields);
      if (validErrors.length > 0) {
        throw new Error('Valid fields incorrectly flagged as invalid');
      }
    });

    await this.runTest('Email Format Validation', async () => {
      const validEmails = [
        'user@example.com',
        'user@example.com',
        'user@example.com',
        'user@example.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user user@example.com',
        ''
      ];

      const validateEmail = (email) => {
        if (!email) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Test valid emails
      for (const email of validEmails) {
        if (!validateEmail(email)) {
          throw new Error(`Valid email rejected: ${email}`);
        }
      }

      // Test invalid emails
      for (const email of invalidEmails) {
        if (email && validateEmail(email)) {
          throw new Error(`Invalid email accepted: ${email}`);
        }
      }
    });

    await this.runTest('Phone Number Validation', async () => {
      const validPhones = [
        '<REDACTED_CREDENTIAL>',
        '+9<REDACTED_CREDENTIAL>',
        '<REDACTED_CREDENTIAL>',
        '<REDACTED_CREDENTIAL>',
        '<REDACTED_CREDENTIAL>'
      ];

      const invalidPhones = [
        '123', // Too short
        'abc-def-ghij', // Letters
        '<REDACTED_CREDENTIAL>89012', // Too long
        ''
      ];

      const validatePhone = (phone) => {
        if (!phone) return true; // Optional field
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
      };

      // Test valid phones
      for (const phone of validPhones) {
        if (!validatePhone(phone)) {
          throw new Error(`Valid phone rejected: ${phone}`);
        }
      }

      // Test invalid phones
      for (const phone of invalidPhones) {
        if (phone && validatePhone(phone)) {
          throw new Error(`Invalid phone accepted: ${phone}`);
        }
      }
    });

    await this.runTest('Date Validation', async () => {
      const validDates = [
        '1990-01-01',
        '2000-12-31',
        '1985-06-15'
      ];

      const invalidDates = [
        '2025-01-01', // Future date
        '1800-01-01', // Too old
        'invalid-date',
        '2024-13-01', // Invalid month
        '2024-01-32' // Invalid day
      ];

      const validateDate = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const minDate = new Date('1900-01-01');
        
        return date instanceof Date && 
               !isNaN(date) && 
               date <= now && 
               date >= minDate;
      };

      // Test valid dates
      for (const date of validDates) {
        if (!validateDate(date)) {
          throw new Error(`Valid date rejected: ${date}`);
        }
      }

      // Test invalid dates
      for (const date of invalidDates) {
        if (validateDate(date)) {
          throw new Error(`Invalid date accepted: ${date}`);
        }
      }
    });
  }

  // Data Integrity Tests
  async testDataIntegrity() {
    await this.runTest('Settings Data Structure Validation', async () => {
      const settingsData = {
        userId: 'user123',
        timestamp: new Date().toISOString(),
        profile: {
          name: 'John Doe',
          patientId: 'P123456',
          abhaId: 'YOUR_AWS_ACCOUNT_ID',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          bloodGroup: 'O+'
        },
        contact: {
          address: {
            line1: '123 Main St',
            city: 'Anytown',
            state: 'ST',
            postalCode: '12345',
            country: 'US'
          },
          phone: {
            primary: '<REDACTED_CREDENTIAL>'
          },
          email: {
            primary: 'john@example.com'
          },
          emergency: {
            name: 'Jane Doe',
            relationship: 'spouse',
            phone: '<REDACTED_CREDENTIAL>'
          }
        },
        insurance: {
          provider: 'Health Insurance Co',
          status: 'active'
        }
      };

      // Validate required top-level fields
      const requiredTopLevel = ['userId', 'timestamp', 'profile', 'contact'];
      for (const field of requiredTopLevel) {
        if (!settingsData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate profile structure
      const requiredProfile = ['name', 'dateOfBirth', 'gender'];
      for (const field of requiredProfile) {
        if (!settingsData.profile[field]) {
          throw new Error(`Missing required profile field: ${field}`);
        }
      }

      // Validate emergency contact
      const requiredEmergency = ['name', 'relationship', 'phone'];
      for (const field of requiredEmergency) {
        if (!settingsData.contact.emergency[field]) {
          throw new Error(`Missing required emergency contact field: ${field}`);
        }
      }
    });

    await this.runTest('Data Sanitization', async () => {
      const unsanitizedData = {
        name: '  John Doe  ',
        email: '  user@example.com  ',
        phone: ' <REDACTED_CREDENTIAL> ',
        notes: '<script>alert("xss")</script>Normal text'
      };

      const sanitizeData = (data) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            // Trim whitespace
            let clean = value.trim();
            
            // Convert email to lowercase
            if (key === 'email') {
              clean = clean.toLowerCase();
            }
            
            // Remove HTML tags for security
            clean = clean.replace(/<[^>]*>/g, '');
            
            sanitized[key] = clean;
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      const sanitizedData = sanitizeData(unsanitizedData);

      if (sanitizedData.name !== 'John Doe') {
        throw new Error('Name sanitization failed');
      }

      if (sanitizedData.email !== 'john@example.com') {
        throw new Error('Email sanitization failed');
      }

      if (sanitizedData.notes.includes('<script>')) {
        throw new Error('HTML tag removal failed');
      }
    });
  }

  // User Experience Tests
  async testUserExperience() {
    await this.runTest('Form Auto-Save Functionality', async () => {
      let autoSaveTriggered = false;
      let autoSaveData = null;

      // Mock auto-save function
      const autoSave = (data) => {
        autoSaveTriggered = true;
        autoSaveData = data;
        return Promise.resolve({ success: true });
      };

      // Mock debounce function
      const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      };

      const debouncedAutoSave = debounce(autoSave, 1000);

      // Simulate user input
      const testData = { name: 'John Doe', email: 'john@example.com' };
      debouncedAutoSave(testData);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 1100));

      if (!autoSaveTriggered) {
        throw new Error('Auto-save not triggered');
      }

      if (!autoSaveData || autoSaveData.name !== testData.name) {
        throw new Error('Auto-save data incorrect');
      }
    });

    await this.runTest('Save Button State Management', async () => {
      const buttonStates = {
        normal: 'Save All Settings',
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Save Failed - Retry'
      };

      let currentState = 'normal';
      let buttonText = buttonStates.normal;
      let buttonDisabled = false;

      // Mock save process
      const simulateSave = async (shouldSucceed = true) => {
        // Set saving state
        currentState = 'saving';
        buttonText = buttonStates.saving;
        buttonDisabled = true;

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));

        if (shouldSucceed) {
          // Set success state
          currentState = 'saved';
          buttonText = buttonStates.saved;
          
          // Reset after delay
          setTimeout(() => {
            currentState = 'normal';
            buttonText = buttonStates.normal;
            buttonDisabled = false;
          }, 2000);
        } else {
          // Set error state
          currentState = 'error';
          buttonText = buttonStates.error;
          
          // Reset after delay
          setTimeout(() => {
            currentState = 'normal';
            buttonText = buttonStates.normal;
            buttonDisabled = false;
          }, 3000);
        }
      };

      // Test successful save
      await simulateSave(true);
      if (currentState !== 'saved' || buttonText !== buttonStates.saved) {
        throw new Error('Save success state not set correctly');
      }

      // Reset for error test
      currentState = 'normal';
      buttonText = buttonStates.normal;
      buttonDisabled = false;

      // Test failed save
      await simulateSave(false);
      if (currentState !== 'error' || buttonText !== buttonStates.error) {
        throw new Error('Save error state not set correctly');
      }
    });

    await this.runTest('Field Validation Visual Feedback', async () => {
      const fieldStates = new Map();

      const setFieldState = (fieldId, isValid, errorMessage = null) => {
        fieldStates.set(fieldId, {
          isValid,
          errorMessage,
          cssClass: isValid ? 'is-valid' : 'is-invalid'
        });
      };

      const getFieldState = (fieldId) => {
        return fieldStates.get(fieldId) || { isValid: true, errorMessage: null, cssClass: '' };
      };

      // Test invalid field
      setFieldState('email', false, 'Invalid email format');
      const invalidState = getFieldState('email');
      
      if (invalidState.isValid || invalidState.cssClass !== 'is-invalid') {
        throw new Error('Invalid field state not set correctly');
      }

      // Test valid field
      setFieldState('email', true);
      const validState = getFieldState('email');
      
      if (!validState.isValid || validState.cssClass !== 'is-valid') {
        throw new Error('Valid field state not set correctly');
      }
    });
  }

  // Run all settings validation tests
  async runAllTests() {
    console.log('\n⚙️ Starting Settings Validation Test Suite...\n');
    
    await this.testFormValidation();
    await this.testDataIntegrity();
    await this.testUserExperience();
    
    this.testResults.endTime = new Date();
    
    console.log('\n📊 Settings Validation Test Results:');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
    console.log(`⏱️  Duration: ${this.testResults.endTime - this.testResults.startTime}ms\n`);
    
    return this.testResults;
  }
}

// Export for use in test runner
module.exports = SettingsValidationTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new SettingsValidationTestSuite();
  testSuite.runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
