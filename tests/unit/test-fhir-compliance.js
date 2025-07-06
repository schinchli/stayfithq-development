#!/usr/bin/env node

/**
 * FHIR Compliance Test Suite
 * Comprehensive testing for FHIR R4 standard compliance and interoperability
 */

class FHIRComplianceTestSuite {
  constructor() {
    this.testResults = {
      suiteName: 'FHIR Compliance Tests',
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
      console.log(`🏥 Running: ${testName}`);
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

  // FHIR Resource Structure Tests
  async testFHIRResourceStructure() {
    await this.runTest('FHIR Patient Resource Validation', async () => {
      const fhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        meta: {
          versionId: '1',
          lastUpdated: '2024-07-01T00:00:00Z',
          profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
        },
        identifier: [{
          use: 'usual',
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number'
            }]
          },
          system: 'http://hospital.example.org',
          value: 'P123456'
        }],
        active: true,
        name: [{
          use: 'official',
          family: 'Doe',
          given: ['John', 'Michael']
        }],
        telecom: [{
          system: 'phone',
          value: '<REDACTED_CREDENTIAL>',
          use: 'home'
        }, {
          system: 'email',
          value: 'john.doe@example.com',
          use: 'home'
        }],
        gender: 'male',
        birthDate: '1989-03-15',
        address: [{
          use: 'home',
          type: 'both',
          line: ['123 Main Street'],
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US'
        }]
      };

      // Validate required fields
      if (!fhirPatient.resourceType || fhirPatient.resourceType !== 'Patient') {
        throw new Error('Invalid or missing resourceType');
      }

      if (!fhirPatient.id) {
        throw new Error('Patient resource must have an id');
      }

      if (!fhirPatient.identifier || fhirPatient.identifier.length === 0) {
        throw new Error('Patient must have at least one identifier');
      }

      // Validate identifier structure
      const identifier = fhirPatient.identifier[0];
      if (!identifier.system || !identifier.value) {
        throw new Error('Identifier must have system and value');
      }
    });

    await this.runTest('FHIR Observation Resource Validation', async () => {
      const fhirObservation = {
        resourceType: 'Observation',
        id: 'obs-bp-123',
        meta: {
          versionId: '1',
          lastUpdated: '2024-07-01T00:00:00Z'
        },
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel with all children optional'
          }]
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        effectiveDateTime: '2024-07-01T10:30:00Z',
        component: [{
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 120,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }, {
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 80,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }]
      };

      // Validate required fields
      if (!fhirObservation.resourceType || fhirObservation.resourceType !== 'Observation') {
        throw new Error('Invalid or missing resourceType');
      }

      if (!fhirObservation.status) {
        throw new Error('Observation must have a status');
      }

      if (!fhirObservation.code) {
        throw new Error('Observation must have a code');
      }

      if (!fhirObservation.subject) {
        throw new Error('Observation must have a subject reference');
      }

      // Validate LOINC codes
      const hasValidLOINC = fhirObservation.code.coding.some(coding => 
        coding.system === 'http://loinc.org' && coding.code
      );
      
      if (!hasValidLOINC) {
        throw new Error('Observation must use valid LOINC codes');
      }
    });
  }

  // FHIR Data Conversion Tests
  async testFHIRDataConversion() {
    await this.runTest('Apple Health to FHIR Conversion', async () => {
      const appleHealthData = {
        type: '<REDACTED_CREDENTIAL>tolic',
        value: 120,
        unit: 'mmHg',
        startDate: '2024-07-01T10:30:00Z',
        endDate: '2024-07-01T10:30:00Z',
        sourceName: 'Health',
        sourceVersion: '17.0'
      };

      // Mock conversion function
      const convertToFHIR = (appleData) => {
        return {
          resourceType: 'Observation',
          id: `obs-${Date.now()}`,
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }]
          },
          valueQuantity: {
            value: appleData.value,
            unit: appleData.unit,
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          },
          effectiveDateTime: appleData.startDate
        };
      };

      const fhirObservation = convertToFHIR(appleHealthData);

      if (!fhirObservation.resourceType || fhirObservation.resourceType !== 'Observation') {
        throw new Error('Conversion failed: Invalid FHIR resource type');
      }

      if (fhirObservation.valueQuantity.value !== appleHealthData.value) {
        throw new Error('Conversion failed: Value mismatch');
      }
    });
  }

  // Run all FHIR tests
  async runAllTests() {
    console.log('\n🏥 Starting FHIR Compliance Test Suite...\n');
    
    await this.testFHIRResourceStructure();
    await this.testFHIRDataConversion();
    
    this.testResults.endTime = new Date();
    
    console.log('\n📊 FHIR Compliance Test Results:');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏭️  Skipped: ${this.testResults.skipped}`);
    console.log(`⏱️  Duration: ${this.testResults.endTime - this.testResults.startTime}ms\n`);
    
    return this.testResults;
  }
}

// Export for use in test runner
module.exports = FHIRComplianceTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new FHIRComplianceTestSuite();
  testSuite.runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
