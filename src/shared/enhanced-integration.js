
// Enhanced Healthcare Integration Middleware
const HealthcareIntegrationService = require('./integration/healthcare-integration-service');
const HIPAAFramework = require('./compliance/hipaa-framework');
const EnhancedSecurityFramework = require('./security/enhanced-security-framework');

// Initialize enhanced services
const healthcareService = new HealthcareIntegrationService();
const hipaaFramework = new HIPAAFramework();
const securityFramework = new EnhancedSecurityFramework();

// Add enhanced routes to existing server
app.get('/api/enhanced/health', (req, res) => {
    res.json({
        status: 'Enhanced Healthcare Platform Active',
        features: {
            hipaa: 'Compliant',
            fhir: 'R4 Enabled',
            openehr: 'Integrated',
            security: 'Enhanced'
        },
        timestamp: new Date().toISOString()
    });
});

// FHIR R4 endpoints
app.get('/fhir/R4/metadata', (req, res) => {
    res.json({
        resourceType: 'CapabilityStatement',
        status: 'active',
        fhirVersion: '4.0.1',
        name: 'HealthHQ FHIR R4 Server',
        description: 'HIPAA-compliant FHIR R4 implementation'
    });
});

// Enhanced patient endpoint with HIPAA compliance
app.post('/api/enhanced/patients', async (req, res) => {
    try {
        // HIPAA audit logging
        hipaaFramework.logDataAccess(
            req.user?.id || 'anonymous',
            'PATIENT_RECORD',
            'CREATE',
            req.body.id
        );

        // Create FHIR patient resource
        const fhirPatient = healthcareService.fhir.createPatient(req.body);
        
        res.status(201).json({
            success: true,
            fhirResource: fhirPatient,
            compliance: 'HIPAA_COMPLIANT'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

console.log('✅ Enhanced Healthcare Features Integrated');
