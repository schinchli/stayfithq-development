#!/usr/bin/env node

/**
 * Quick Integration Test for Enhanced Healthcare Features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testIntegration() {
    console.log('🧪 Testing Enhanced Healthcare Integration...\n');

    try {
        // Test 1: Enhanced Health Check
        console.log('1️⃣ Testing Enhanced Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/api/enhanced/health`);
        console.log('✅ Enhanced Health Check:', healthResponse.data.status);
        console.log('   Features:', Object.keys(healthResponse.data.features).join(', '));

        // Test 2: FHIR R4 Metadata
        console.log('\n2️⃣ Testing FHIR R4 Metadata...');
        const fhirResponse = await axios.get(`${BASE_URL}/fhir/R4/metadata`);
        console.log('✅ FHIR R4 Metadata:', fhirResponse.data.resourceType);
        console.log('   Version:', fhirResponse.data.fhirVersion);

        // Test 3: Enhanced Patient Creation
        console.log('\n3️⃣ Testing Enhanced Patient Creation...');
        const patientData = {
            firstName: 'John',
            lastName: 'Doe',
            gender: 'male',
            birthDate: '1990-01-01'
        };

        const patientResponse = await axios.post(`${BASE_URL}/api/enhanced/patients`, patientData);
        console.log('✅ Enhanced Patient Created:', patientResponse.data.patient.id);
        console.log('   Compliance:', patientResponse.data.patient.compliance);

        // Test 4: Original App Still Works
        console.log('\n4️⃣ Testing Original App Compatibility...');
        const originalResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Original Health Check:', originalResponse.data.status);

        console.log('\n🎉 All Integration Tests Passed!');
        console.log('\n📋 Your Enhanced Features Are Ready:');
        console.log('   🔗 Enhanced Health: http://localhost:3000/api/enhanced/health');
        console.log('   🔗 FHIR R4 Metadata: http://localhost:3000/fhir/R4/metadata');
        console.log('   🔗 Original App: http://localhost:3000');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server not running. Please start your server first:');
            console.log('   npm start');
        } else {
            console.error('❌ Test failed:', error.response?.data || error.message);
        }
    }
}

// Run tests
testIntegration();
