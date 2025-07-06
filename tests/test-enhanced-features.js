
/**
 * Enhanced Healthcare Features Test Suite
 */

const axios = require('axios');

class HealthcareFeaturesTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    async testEnhancedHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/enhanced/health`);
            console.log('✅ Enhanced Health Check:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Enhanced Health Check Failed:', error.message);
        }
    }

    async testFHIRMetadata() {
        try {
            const response = await axios.get(`${this.baseUrl}/fhir/R4/metadata`);
            console.log('✅ FHIR R4 Metadata:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ FHIR Metadata Failed:', error.message);
        }
    }

    async testPatientCreation() {
        try {
            const patientData = {
                id: 'test-patient-001',
                names: [{
                    use: 'official',
                    family: 'Doe',
                    given: ['John']
                }],
                gender: 'male',
                birthDate: '1990-01-01'
            };

            const response = await axios.post(`${this.baseUrl}/api/enhanced/patients`, patientData);
            console.log('✅ Enhanced Patient Creation:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Patient Creation Failed:', error.message);
        }
    }

    async runAllTests() {
        console.log('🧪 Running Enhanced Healthcare Features Tests...\n');
        
        await this.testEnhancedHealth();
        await this.testFHIRMetadata();
        await this.testPatientCreation();
        
        console.log('\n🏁 Test Suite Complete');
    }
}

// Export for use
module.exports = HealthcareFeaturesTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new HealthcareFeaturesTester();
    tester.runAllTests();
}
