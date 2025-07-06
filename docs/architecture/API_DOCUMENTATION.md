# 🔗 StayFit Health Companion - API Documentation

> **Comprehensive API documentation for HIPAA-compliant healthcare platform with MCP & OpenSearch integration**

## 📋 Table of Contents

- [Authentication](#authentication)
- [Enhanced Health API](#enhanced-health-api)
- [FHIR R4 API](#fhir-r4-api)
- [MCP Integration API](#mcp-integration-api)
- [OpenSearch API](#opensearch-api)
- [HIPAA Compliance API](#hipaa-compliance-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All API endpoints require authentication using JWT tokens with optional MFA.

### Authentication Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
User-Agent: HealthHQ-Client/1.0
```

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "mfaCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_jwt_token_placeholder.",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "roles": ["healthcare_provider"],
    "permissions": ["read_patient_data", "write_patient_data"]
  }
}
```

---

## 🏥 Enhanced Health API

### GET /api/enhanced/health
Get comprehensive platform health status.

**Response:**
```json
{
  "status": "Enhanced Healthcare Platform Active",
  "features": {
    "hipaa": "Compliant",
    "fhir": "R4 Available",
    "openehr": "Integrated",
    "security": "Enhanced",
    "mcp": "CONNECTED",
    "opensearch": "Production Connected"
  },
  "environment": "production",
  "timestamp": "2025-06-30T17:00:00.000Z",
  "version": "2.0.0-production"
}
```

### GET /api/enhanced/test-all
Comprehensive system test endpoint.

**Response:**
```json
{
  "timestamp": "2025-06-30T17:00:00.000Z",
  "integration": "ACTIVE",
  "tests": {
    "hipaaFramework": true,
    "healthcareService": true,
    "fhirEndpoint": true,
    "openehrEndpoint": true,
    "patientCreation": true,
    "securityFeatures": true
  },
  "features": {
    "HIPAA Compliance": "Active",
    "FHIR R4 Standards": "Implemented",
    "openEHR Integration": "Available",
    "Enhanced Security": "Enabled",
    "Scalable Architecture": "Ready"
  },
  "status": "FULLY_INTEGRATED"
}
```

---

## 📋 FHIR R4 API

### GET /fhir/R4/metadata
Get FHIR server capability statement.

**Response:**
```json
{
  "resourceType": "CapabilityStatement",
  "id": "healthhq-fhir-production",
  "status": "active",
  "date": "2025-06-30T17:00:00.000Z",
  "publisher": "HealthHQ Production Platform",
  "description": "Production HIPAA-compliant FHIR R4 server with MCP and OpenSearch integration",
  "fhirVersion": "4.0.1",
  "format": ["json"],
  "rest": [{
    "mode": "server",
    "security": {
      "cors": true,
      "description": "Production HIPAA-compliant security with enhanced authentication"
    },
    "resource": [
      {
        "type": "Patient",
        "interaction": [
          {"code": "read"},
          {"code": "create"},
          {"code": "search-type"}
        ]
      },
      {
        "type": "Observation",
        "interaction": [
          {"code": "read"},
          {"code": "create"},
          {"code": "search-type"}
        ]
      }
    ]
  }],
  "integration": {
    "mcp": "PRODUCTION_CONNECTED",
    "opensearch": "AWS_SERVICE_CONNECTED",
    "environment": "production"
  }
}
```

### POST /fhir/R4/Patient
Create a new FHIR R4 Patient resource.

**Request:**
```json
{
  "resourceType": "Patient",
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["John"]
  }],
  "gender": "male",
  "birthDate": "1990-01-01",
  "telecom": [{
    "system": "phone",
    "value": "<REDACTED_CREDENTIAL>",
    "use": "home"
  }],
  "address": [{
    "use": "home",
    "line": ["123 Main St"],
    "city": "Anytown",
    "state": "CA",
    "postalCode": "12345",
    "country": "US"
  }]
}
```

**Response:**
```json
{
  "resourceType": "Patient",
  "id": "patient-12345",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2025-06-30T17:00:00.000Z"
  },
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["John"]
  }],
  "gender": "male",
  "birthDate": "1990-01-01",
  "compliance": "HIPAA_COMPLIANT",
  "standards": ["FHIR_R4"]
}
```

### GET /fhir/R4/Patient/{id}
Retrieve a specific Patient resource.

**Response:**
```json
{
  "resourceType": "Patient",
  "id": "patient-12345",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2025-06-30T17:00:00.000Z"
  },
  "active": true,
  "name": [{
    "use": "official",
    "family": "Doe",
    "given": ["John"]
  }],
  "gender": "male",
  "birthDate": "1990-01-01"
}
```

### GET /fhir/R4/Patient
Search for Patient resources.

**Query Parameters:**
- `name`: Patient name
- `gender`: Patient gender
- `birthdate`: Patient birth date
- `identifier`: Patient identifier
- `_count`: Number of results to return
- `_offset`: Offset for pagination

**Response:**
```json
{
  "resourceType": "Bundle",
  "id": "search-results",
  "type": "searchset",
  "total": 1,
  "entry": [{
    "resource": {
      "resourceType": "Patient",
      "id": "patient-12345",
      "name": [{
        "use": "official",
        "family": "Doe",
        "given": ["John"]
      }],
      "gender": "male",
      "birthDate": "1990-01-01"
    }
  }]
}
```

---

## 🔗 MCP Integration API

### GET /api/mcp/health
Get MCP integration health status.

**Response:**
```json
{
  "status": "MCP Integration Active - Production",
  "opensearch": {
    "status": "green",
    "cluster": "production-healthcare-cluster",
    "type": "AWS OpenSearch Service",
    "endpoint": "https://your-service.amazonaws.com",
    "connected": true
  },
  "mcp": {
    "enabled": true,
    "environment": "production",
    "server": "Enhanced MCP Server - Production",
    "tools": [
      "search_healthcare_data",
      "create_fhir_patient",
      "search_fhir_resources",
      "create_openehr_composition",
      "audit_data_access",
      "analyze_clinical_data",
      "generate_compliance_report"
    ]
  },
  "integration": "PRODUCTION_CONNECTED",
  "timestamp": "2025-06-30T17:00:00.000Z"
}
```

### GET /api/mcp/search
Search healthcare data using MCP integration.

**Query Parameters:**
- `query`: Search query string (required)
- `type`: Data type filter (patient, observation, medication, condition)
- `patientId`: Filter by specific patient ID
- `dateRange`: Date range filter

**Example Request:**
```http
GET /api/mcp/search?query=blood+pressure&type=observation&patientId=patient-123
```

**Response:**
```json
{
  "success": true,
  "query": "blood pressure",
  "type": "observation",
  "patientId": "patient-123",
  "totalHits": 5,
  "results": [{
    "id": "obs-001",
    "type": "Observation",
    "data": {
      "resourceType": "Observation",
      "id": "obs-001",
      "patient": {"id": "patient-123"},
      "code": {"text": "Blood Pressure"},
      "valueQuantity": {"value": 120, "unit": "mmHg"},
      "compliance": "HIPAA_COMPLIANT"
    },
    "score": 1.0,
    "compliance": "HIPAA_LOGGED"
  }],
  "mcp": {
    "enabled": true,
    "environment": "production",
    "searchEngine": "AWS OpenSearch Service",
    "integration": "PRODUCTION_CONNECTED"
  },
  "timestamp": "2025-06-30T17:00:00.000Z"
}
```

### POST /api/mcp/patients
Create patient with MCP integration.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "gender": "female",
  "birthDate": "1985-05-15",
  "email": "jane.smith@example.com",
  "phone": "<REDACTED_CREDENTIAL>"
}
```

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": "patient-67890",
    "resourceType": "Patient",
    "active": true,
    "name": [{
      "family": "Smith",
      "given": ["Jane"]
    }],
    "gender": "female",
    "birthDate": "1985-05-15",
    "created": "2025-06-30T17:00:00.000Z",
    "compliance": "HIPAA_COMPLIANT",
    "standards": ["FHIR_R4", "openEHR"],
    "integration": "SUCCESS"
  },
  "indexed": true,
  "documentId": "patient-67890",
  "mcp": {
    "enabled": true,
    "environment": "production",
    "searchable": true,
    "integration": "PRODUCTION_CONNECTED"
  },
  "message": "Patient created in production with MCP integration",
  "compliance": "HIPAA_COMPLIANT"
}
```

### POST /api/mcp/analyze
Analyze clinical data using MCP.

**Request:**
```json
{
  "patientId": "patient-123",
  "analysisType": "comprehensive",
  "dataTypes": ["observation", "medication", "condition"]
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "patientId": "patient-123",
    "analysisType": "comprehensive",
    "environment": "production",
    "dataFound": 15,
    "records": [{
      "type": "Observation",
      "id": "obs-001",
      "summary": "Blood Pressure: 120/80 mmHg"
    }],
    "insights": [
      "Production MCP integration fully operational",
      "OpenSearch indexing and search functional",
      "HIPAA compliance logging active",
      "Real-time clinical data analysis available"
    ],
    "recommendations": [
      "Continue monitoring patient data",
      "Regular health check-ups recommended",
      "Data quality is good for analysis"
    ],
    "mcp": {
      "enabled": true,
      "environment": "production",
      "integration": "PRODUCTION_CONNECTED",
      "compliance": "HIPAA_COMPLIANT"
    }
  },
  "timestamp": "2025-06-30T17:00:00.000Z"
}
```

---

## 🔍 OpenSearch API

### POST /api/opensearch/index
Index healthcare document in OpenSearch.

**Request:**
```json
{
  "index": "healthcare-patients",
  "document": {
    "resourceType": "Patient",
    "id": "patient-123",
    "name": [{"family": "Doe", "given": ["John"]}],
    "gender": "male",
    "birthDate": "1990-01-01",
    "compliance": "HIPAA_COMPLIANT"
  },
  "documentId": "patient-123"
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "patient-123",
  "indexed": true,
  "index": "healthcare-patients",
  "timestamp": "2025-06-30T17:00:00.000Z"
}
```

### POST /api/opensearch/search
Advanced healthcare data search.

**Request:**
```json
{
  "index": "healthcare-*",
  "query": {
    "bool": {
      "must": [
        {"match": {"resourceType": "Patient"}},
        {"range": {"birthDate": {"gte": "1980-01-01"}}}
      ]
    }
  },
  "size": 10,
  "from": 0
}
```

**Response:**
```json
{
  "success": true,
  "totalHits": 25,
  "results": [{
    "id": "patient-123",
    "source": {
      "resourceType": "Patient",
      "id": "patient-123",
      "name": [{"family": "Doe", "given": ["John"]}],
      "gender": "male",
      "birthDate": "1990-01-01"
    },
    "score": 1.0
  }],
  "aggregations": {},
  "took": 15,
  "timestamp": "2025-06-30T17:00:00.000Z"
}
```

---

## 🔒 HIPAA Compliance API

### POST /api/hipaa/audit
Log HIPAA-compliant data access.

**Request:**
```json
{
  "userId": "user-123",
  "dataType": "PATIENT_RECORD",
  "operation": "READ",
  "patientId": "patient-456",
  "purpose": "TREATMENT",
  "location": "192.168.X.X"
}
```

**Response:**
```json
{
  "success": true,
  "auditId": "audit-789",
  "logged": true,
  "timestamp": "2025-06-30T17:00:00.000Z",
  "compliance": "HIPAA_COMPLIANT"
}
```

### GET /api/hipaa/compliance-report
Generate HIPAA compliance report.

**Query Parameters:**
- `startDate`: Report start date (required)
- `endDate`: Report end date (required)
- `reportType`: Type of report (access, security, audit)
- `userId`: Filter by specific user
- `patientId`: Filter by specific patient

**Response:**
```json
{
  "success": true,
  "reportPeriod": {
    "startDate": "2025-06-01",
    "endDate": "2025-06-30"
  },
  "totalEvents": 1250,
  "summary": {
    "dataAccess": 1000,
    "securityEvents": 25,
    "auditTrail": 1250
  },
  "aggregations": {
    "by_user": [
      {"key": "user-123", "doc_count": 150},
      {"key": "user-456", "doc_count": 125}
    ],
    "by_data_type": [
      {"key": "PATIENT_RECORD", "doc_count": 800},
      {"key": "CLINICAL_DATA", "doc_count": 450}
    ]
  },
  "compliance": "HIPAA_COMPLIANT",
  "timestamp": "2025-06-30T17:00:00.000Z"
}
```

---

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient data provided",
    "details": {
      "field": "birthDate",
      "issue": "Invalid date format"
    },
    "timestamp": "2025-06-30T17:00:00.000Z",
    "requestId": "req-123456"
  },
  "compliance": "HIPAA_COMPLIANT_ERROR_HANDLING"
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Authentication token required
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `INTERNAL_SERVER_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `HIPAA_VIOLATION`: HIPAA compliance violation detected

---

## 🚦 Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset:<REDACTED_CREDENTIAL>
X-RateLimit-Window: 900
```

### Rate Limits by Endpoint Type
- **Authentication**: 10 requests per minute
- **FHIR Resources**: 1000 requests per 15 minutes
- **MCP Search**: 500 requests per 15 minutes
- **OpenSearch**: 200 requests per 15 minutes
- **HIPAA Audit**: 100 requests per 15 minutes

### Rate Limit Exceeded Response
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 300,
    "limit": 1000,
    "window": 900
  }
}
```

---

## 📚 Additional Resources

### OpenAPI Specification
- **Swagger UI**: Available at `/api/docs`
- **OpenAPI JSON**: Available at `/api/docs/openapi.json`

### SDKs and Libraries
- **JavaScript SDK**: Available for frontend integration
- **Python SDK**: Available for backend integration
- **FHIR Client Libraries**: Standard FHIR client libraries supported

### Testing
- **Postman Collection**: Available for API testing
- **Test Environment**: Sandbox environment available
- **Mock Data**: Sample healthcare data for testing

---

**Built with ❤️ for Healthcare Excellence by Shashank Chinchli, Solutions Architect, AWS**

*HIPAA-Compliant • FHIR R4 • openEHR • MCP Connected • OpenSearch Ready • Enterprise Security*
