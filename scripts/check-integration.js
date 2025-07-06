#!/usr/bin/env node

/**
 * Integration Verification Script
 * Checks if enhanced healthcare features are properly integrated with existing application
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;

class IntegrationChecker {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = {
            fileStructure: {},
            serverIntegration: {},
            apiEndpoints: {},
            dependencies: {},
            overall: 'UNKNOWN'
        };
    }

    // Check if enhanced files exist
    checkFileStructure() {
        console.log('🔍 Checking Enhanced File Structure...\n');
        
        const requiredFiles = [
            'src/compliance/hipaa-framework.js',
            'src/standards/fhir-r4-implementation.js', 
            'src/standards/openehr-implementation.js',
            'src/security/enhanced-security-framework.js',
            'src/architecture/scalable-architecture.js',
            'src/integration/healthcare-integration-service.js',
            'config/enhanced-config.json',
            'ENHANCED_FEATURES.md'
        ];

        const optionalFiles = [
            'src/enhanced-server.js',
            'deploy-enhanced.sh',
            'test-integration.js'
        ];

        requiredFiles.forEach(file => {
            const exists = fs.existsSync(path.join(__dirname, file));
            this.results.fileStructure[file] = exists;
            console.log(`${exists ? '✅' : '❌'} ${file}`);
        });

        console.log('\n📋 Optional Files:');
        optionalFiles.forEach(file => {
            const exists = fs.existsSync(path.join(__dirname, file));
            console.log(`${exists ? '✅' : '⚪'} ${file}`);
        });
    }

    // Check if server.js has been modified with enhanced features
    checkServerIntegration() {
        console.log('\n🔍 Checking Server Integration...\n');
        
        try {
            const serverContent = fs.readFileSync(path.join(__dirname, 'src/server.js'), 'utf8');
            
            const integrationChecks = {
                'Enhanced Healthcare Integration': serverContent.includes('Enhanced Healthcare Integration'),
                'HIPAA Framework Import': serverContent.includes('hipaa-framework') || serverContent.includes('HIPAAFramework'),
                'Enhanced Health Endpoint': serverContent.includes('/api/enhanced/health'),
                'FHIR R4 Metadata Endpoint': serverContent.includes('/fhir/R4/metadata'),
                'Enhanced Patient Endpoint': serverContent.includes('/api/enhanced/patients'),
                'Healthcare Service Integration': serverContent.includes('healthcareService') || serverContent.includes('HealthcareIntegrationService')
            };

            Object.entries(integrationChecks).forEach(([check, passed]) => {
                this.results.serverIntegration[check] = passed;
                console.log(`${passed ? '✅' : '❌'} ${check}`);
            });

        } catch (error) {
            console.log('❌ Could not read server.js file');
            this.results.serverIntegration['Server File Access'] = false;
        }
    }

    // Check package.json dependencies
    checkDependencies() {
        console.log('\n🔍 Checking Dependencies...\n');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            
            const requiredDeps = {
                'jsonwebtoken': 'JWT Authentication',
                'bcrypt': 'Password Hashing', 
                'express-rate-limit': 'Rate Limiting',
                'joi': 'Input Validation',
                'axios': 'HTTP Client for Testing'
            };

            const existingDeps = {
                'express': 'Web Framework',
                'helmet': 'Security Headers',
                'cors': 'Cross-Origin Requests',
                'winston': 'Logging',
                'uuid': 'Unique Identifiers'
            };

            console.log('📦 Required Enhanced Dependencies:');
            Object.entries(requiredDeps).forEach(([dep, description]) => {
                const exists = packageJson.dependencies && packageJson.dependencies[dep];
                this.results.dependencies[dep] = !!exists;
                console.log(`${exists ? '✅' : '❌'} ${dep} (${description})`);
            });

            console.log('\n📦 Existing Dependencies:');
            Object.entries(existingDeps).forEach(([dep, description]) => {
                const exists = packageJson.dependencies && packageJson.dependencies[dep];
                console.log(`${exists ? '✅' : '❌'} ${dep} (${description})`);
            });

        } catch (error) {
            console.log('❌ Could not read package.json');
        }
    }

    // Test API endpoints
    async checkApiEndpoints() {
        console.log('\n🔍 Checking API Endpoints...\n');
        
        const endpoints = [
            { url: '/api/health', name: 'Original Health Check', required: true },
            { url: '/api/enhanced/health', name: 'Enhanced Health Check', required: false },
            { url: '/fhir/R4/metadata', name: 'FHIR R4 Metadata', required: false },
            { url: '/', name: 'Main Application', required: true }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${this.baseUrl}${endpoint.url}`, { timeout: 5000 });
                this.results.apiEndpoints[endpoint.name] = {
                    status: 'SUCCESS',
                    statusCode: response.status,
                    hasData: !!response.data
                };
                console.log(`✅ ${endpoint.name} (${response.status})`);
                
                // Show some response data for enhanced endpoints
                if (endpoint.url.includes('enhanced') || endpoint.url.includes('fhir')) {
                    console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
                }
                
            } catch (error) {
                const status = error.code === 'ECONNREFUSED' ? 'SERVER_DOWN' : 'ERROR';
                this.results.apiEndpoints[endpoint.name] = {
                    status,
                    error: error.message
                };
                
                if (endpoint.required) {
                    console.log(`❌ ${endpoint.name} - ${error.message}`);
                } else {
                    console.log(`⚪ ${endpoint.name} - ${error.message} (Optional)`);
                }
            }
        }
    }

    // Test enhanced patient creation
    async testEnhancedPatientCreation() {
        console.log('\n🔍 Testing Enhanced Patient Creation...\n');
        
        try {
            const patientData = {
                firstName: 'Test',
                lastName: 'Patient',
                gender: 'other',
                birthDate: '1990-01-01'
            };

            const response = await axios.post(`${this.baseUrl}/api/enhanced/patients`, patientData, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('✅ Enhanced Patient Creation Successful');
            console.log(`   📄 Patient ID: ${response.data.patient?.id}`);
            console.log(`   🔒 Compliance: ${response.data.patient?.compliance}`);
            console.log(`   📋 Standards: ${response.data.patient?.standards?.join(', ')}`);
            
            this.results.apiEndpoints['Enhanced Patient Creation'] = {
                status: 'SUCCESS',
                patientId: response.data.patient?.id,
                compliance: response.data.patient?.compliance
            };

        } catch (error) {
            console.log(`⚪ Enhanced Patient Creation - ${error.message} (Optional)`);
            this.results.apiEndpoints['Enhanced Patient Creation'] = {
                status: 'ERROR',
                error: error.message
            };
        }
    }

    // Generate overall integration status
    generateOverallStatus() {
        console.log('\n📊 Integration Status Summary...\n');
        
        // Check critical components
        const criticalFiles = Object.values(this.results.fileStructure).filter(Boolean).length;
        const totalFiles = Object.keys(this.results.fileStructure).length;
        const serverIntegration = Object.values(this.results.serverIntegration).filter(Boolean).length;
        const totalServerChecks = Object.keys(this.results.serverIntegration).length;
        const workingEndpoints = Object.values(this.results.apiEndpoints)
            .filter(result => result.status === 'SUCCESS').length;

        console.log(`📁 Enhanced Files: ${criticalFiles}/${totalFiles} present`);
        console.log(`🔧 Server Integration: ${serverIntegration}/${totalServerChecks} checks passed`);
        console.log(`🌐 Working Endpoints: ${workingEndpoints} functional`);

        // Determine overall status
        if (criticalFiles >= totalFiles * 0.8 && serverIntegration >= totalServerChecks * 0.6) {
            if (workingEndpoints >= 2) {
                this.results.overall = 'FULLY_INTEGRATED';
                console.log('\n🎉 Status: FULLY INTEGRATED');
                console.log('✅ Enhanced healthcare features are properly integrated!');
            } else {
                this.results.overall = 'PARTIALLY_INTEGRATED';
                console.log('\n⚠️  Status: PARTIALLY INTEGRATED');
                console.log('🔧 Files are present but server may not be running or endpoints not working');
            }
        } else if (criticalFiles > 0) {
            this.results.overall = 'FILES_ONLY';
            console.log('\n📁 Status: FILES ONLY');
            console.log('⚠️  Enhanced files exist but not integrated into server');
        } else {
            this.results.overall = 'NOT_INTEGRATED';
            console.log('\n❌ Status: NOT INTEGRATED');
            console.log('❌ Enhanced healthcare features are not present');
        }
    }

    // Provide recommendations
    provideRecommendations() {
        console.log('\n💡 Recommendations:\n');

        switch (this.results.overall) {
            case 'FULLY_INTEGRATED':
                console.log('✅ Your enhanced healthcare platform is ready!');
                console.log('🚀 Next steps:');
                console.log('   - Deploy to production: ./deploy-enhanced.sh');
                console.log('   - Configure AWS resources');
                console.log('   - Set up monitoring dashboards');
                break;

            case 'PARTIALLY_INTEGRATED':
                console.log('🔧 Integration is partial. To complete:');
                console.log('   1. Start your server: npm start');
                console.log('   2. Check server logs for errors');
                console.log('   3. Verify all dependencies: npm install');
                break;

            case 'FILES_ONLY':
                console.log('📁 Files exist but need server integration:');
                console.log('   1. Check if server.js has enhanced endpoints');
                console.log('   2. Restart server: npm start');
                console.log('   3. Run integration again');
                break;

            case 'NOT_INTEGRATED':
                console.log('❌ Enhanced features need to be added:');
                console.log('   1. Run: node integrate-enhanced-features.js');
                console.log('   2. Install dependencies: npm install');
                console.log('   3. Start server: npm start');
                break;
        }

        console.log('\n🔗 Test URLs (when server is running):');
        console.log('   - Enhanced Health: http://localhost:3000/api/enhanced/health');
        console.log('   - FHIR Metadata: http://localhost:3000/fhir/R4/metadata');
        console.log('   - Original App: http://localhost:3000');
    }

    // Run all checks
    async runAllChecks() {
        console.log('🏥 Enhanced Healthcare Integration Checker\n');
        console.log('=' .repeat(50));
        
        this.checkFileStructure();
        this.checkServerIntegration();
        this.checkDependencies();
        await this.checkApiEndpoints();
        await this.testEnhancedPatientCreation();
        this.generateOverallStatus();
        this.provideRecommendations();
        
        console.log('\n' + '='.repeat(50));
        console.log('🏁 Integration Check Complete');
        
        return this.results;
    }
}

// Run the integration checker
if (require.main === module) {
    const checker = new IntegrationChecker();
    checker.runAllChecks().catch(console.error);
}

module.exports = IntegrationChecker;
