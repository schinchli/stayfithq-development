/**
 * FHIR R4 Implementation
 * Fast Healthcare Interoperability Resources (FHIR) R4 Standard Implementation
 * Provides comprehensive healthcare data interoperability
 */

const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

class FHIRR4Implementation {
    constructor() {
        this.version = '4.0.1';
        this.baseUrl = process.env.FHIR_BASE_URL || 'https://api.healthhq.com/fhir/R4';
        
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/fhir-operations.log' })
            ]
        });

        // FHIR Resource Types
        this.resourceTypes = {
            PATIENT: 'Patient',
            PRACTITIONER: 'Practitioner',
            ORGANIZATION: 'Organization',
            OBSERVATION: 'Observation',
            CONDITION: 'Condition',
            MEDICATION_REQUEST: 'MedicationRequest',
            MEDICATION_STATEMENT: 'MedicationStatement',
            DIAGNOSTIC_REPORT: 'DiagnosticReport',
            ENCOUNTER: 'Encounter',
            PROCEDURE: 'Procedure',
            IMMUNIZATION: 'Immunization',
            ALLERGY_INTOLERANCE: 'AllergyIntolerance',
            CARE_PLAN: 'CarePlan',
            GOAL: 'Goal',
            DEVICE: 'Device',
            SPECIMEN: 'Specimen'
        };

        // FHIR Data Types
        this.dataTypes = {
            STRING: 'string',
            INTEGER: 'integer',
            DECIMAL: 'decimal',
            BOOLEAN: 'boolean',
            DATE: 'date',
            DATETIME: 'dateTime',
            TIME: 'time',
            CODE: 'code',
            URI: 'uri',
            CANONICAL: 'canonical',
            BASE64BINARY: 'base64Binary'
        };
    }

    /**
     * Patient Resource Management
     */
    createPatient(patientData) {
        const patient = {
            resourceType: this.resourceTypes.PATIENT,
            id: uuidv4(),
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient']
            },
            identifier: this.createIdentifiers(patientData.identifiers),
            active: patientData.active !== false,
            name: this.createHumanNames(patientData.names),
            telecom: this.createContactPoints(patientData.contacts),
            gender: this.validateGender(patientData.gender),
            birthDate: this.validateDate(patientData.birthDate),
            address: this.createAddresses(patientData.addresses),
            maritalStatus: this.createCodeableConcept(patientData.maritalStatus),
            communication: this.createCommunications(patientData.languages),
            generalPractitioner: this.createReferences(patientData.providers),
            managingOrganization: this.createReference(patientData.organization)
        };

        this.validateResource(patient);
        this.logFHIROperation('CREATE', this.resourceTypes.PATIENT, patient.id);
        
        return patient;
    }

    updatePatient(patientId, updateData) {
        const existingPatient = this.getPatient(patientId);
        if (!existingPatient) {
            throw new Error(`Patient with ID ${patientId} not found`);
        }

        const updatedPatient = {
            ...existingPatient,
            ...updateData,
            meta: {
                ...existingPatient.meta,
                versionId: (parseInt(existingPatient.meta.versionId) + 1).toString(),
                lastUpdated: new Date().toISOString()
            }
        };

        this.validateResource(updatedPatient);
        this.logFHIROperation('UPDATE', this.resourceTypes.PATIENT, patientId);
        
        return updatedPatient;
    }

    /**
     * Observation Resource Management
     */
    createObservation(observationData) {
        const observation = {
            resourceType: this.resourceTypes.OBSERVATION,
            id: uuidv4(),
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab']
            },
            status: this.validateObservationStatus(observationData.status),
            category: this.createCategories(observationData.categories),
            code: this.createCodeableConcept(observationData.code),
            subject: this.createReference(observationData.patient),
            encounter: observationData.encounter ? this.createReference(observationData.encounter) : undefined,
            effectiveDateTime: this.validateDateTime(observationData.effectiveDateTime),
            issued: new Date().toISOString(),
            performer: this.createReferences(observationData.performers),
            valueQuantity: observationData.valueQuantity ? this.createQuantity(observationData.valueQuantity) : undefined,
            valueCodeableConcept: observationData.valueCodeableConcept ? this.createCodeableConcept(observationData.valueCodeableConcept) : undefined,
            valueString: observationData.valueString,
            valueBoolean: observationData.valueBoolean,
            valueInteger: observationData.valueInteger,
            valueRange: observationData.valueRange ? this.createRange(observationData.valueRange) : undefined,
            dataAbsentReason: observationData.dataAbsentReason ? this.createCodeableConcept(observationData.dataAbsentReason) : undefined,
            interpretation: observationData.interpretation ? this.createCodeableConcepts(observationData.interpretation) : undefined,
            note: observationData.notes ? this.createAnnotations(observationData.notes) : undefined,
            referenceRange: observationData.referenceRanges ? this.createReferenceRanges(observationData.referenceRanges) : undefined,
            component: observationData.components ? this.createObservationComponents(observationData.components) : undefined
        };

        this.validateResource(observation);
        this.logFHIROperation('CREATE', this.resourceTypes.OBSERVATION, observation.id);
        
        return observation;
    }

    /**
     * Condition Resource Management
     */
    createCondition(conditionData) {
        const condition = {
            resourceType: this.resourceTypes.CONDITION,
            id: uuidv4(),
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition']
            },
            clinicalStatus: this.createCodeableConcept(conditionData.clinicalStatus),
            verificationStatus: this.createCodeableConcept(conditionData.verificationStatus),
            category: this.createCodeableConcepts(conditionData.categories),
            severity: conditionData.severity ? this.createCodeableConcept(conditionData.severity) : undefined,
            code: this.createCodeableConcept(conditionData.code),
            bodySite: conditionData.bodySites ? this.createCodeableConcepts(conditionData.bodySites) : undefined,
            subject: this.createReference(conditionData.patient),
            encounter: conditionData.encounter ? this.createReference(conditionData.encounter) : undefined,
            onsetDateTime: conditionData.onsetDateTime ? this.validateDateTime(conditionData.onsetDateTime) : undefined,
            onsetAge: conditionData.onsetAge ? this.createAge(conditionData.onsetAge) : undefined,
            onsetPeriod: conditionData.onsetPeriod ? this.createPeriod(conditionData.onsetPeriod) : undefined,
            onsetRange: conditionData.onsetRange ? this.createRange(conditionData.onsetRange) : undefined,
            onsetString: conditionData.onsetString,
            abatementDateTime: conditionData.abatementDateTime ? this.validateDateTime(conditionData.abatementDateTime) : undefined,
            abatementAge: conditionData.abatementAge ? this.createAge(conditionData.abatementAge) : undefined,
            abatementPeriod: conditionData.abatementPeriod ? this.createPeriod(conditionData.abatementPeriod) : undefined,
            abatementRange: conditionData.abatementRange ? this.createRange(conditionData.abatementRange) : undefined,
            abatementString: conditionData.abatementString,
            recordedDate: conditionData.recordedDate ? this.validateDateTime(conditionData.recordedDate) : new Date().toISOString(),
            recorder: conditionData.recorder ? this.createReference(conditionData.recorder) : undefined,
            asserter: conditionData.asserter ? this.createReference(conditionData.asserter) : undefined,
            stage: conditionData.stages ? this.createConditionStages(conditionData.stages) : undefined,
            evidence: conditionData.evidence ? this.createConditionEvidence(conditionData.evidence) : undefined,
            note: conditionData.notes ? this.createAnnotations(conditionData.notes) : undefined
        };

        this.validateResource(condition);
        this.logFHIROperation('CREATE', this.resourceTypes.CONDITION, condition.id);
        
        return condition;
    }

    /**
     * Medication Request Resource Management
     */
    createMedicationRequest(medicationData) {
        const medicationRequest = {
            resourceType: this.resourceTypes.MEDICATION_REQUEST,
            id: uuidv4(),
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest']
            },
            status: this.validateMedicationRequestStatus(medicationData.status),
            intent: this.validateMedicationRequestIntent(medicationData.intent),
            category: medicationData.categories ? this.createCodeableConcepts(medicationData.categories) : undefined,
            priority: medicationData.priority,
            doNotPerform: medicationData.doNotPerform,
            reportedBoolean: medicationData.reportedBoolean,
            reportedReference: medicationData.reportedReference ? this.createReference(medicationData.reportedReference) : undefined,
            medicationCodeableConcept: medicationData.medicationCode ? this.createCodeableConcept(medicationData.medicationCode) : undefined,
            medicationReference: medicationData.medicationReference ? this.createReference(medicationData.medicationReference) : undefined,
            subject: this.createReference(medicationData.patient),
            encounter: medicationData.encounter ? this.createReference(medicationData.encounter) : undefined,
            supportingInformation: medicationData.supportingInformation ? this.createReferences(medicationData.supportingInformation) : undefined,
            authoredOn: medicationData.authoredOn ? this.validateDateTime(medicationData.authoredOn) : new Date().toISOString(),
            requester: medicationData.requester ? this.createReference(medicationData.requester) : undefined,
            performer: medicationData.performer ? this.createReference(medicationData.performer) : undefined,
            performerType: medicationData.performerType ? this.createCodeableConcept(medicationData.performerType) : undefined,
            recorder: medicationData.recorder ? this.createReference(medicationData.recorder) : undefined,
            reasonCode: medicationData.reasonCodes ? this.createCodeableConcepts(medicationData.reasonCodes) : undefined,
            reasonReference: medicationData.reasonReferences ? this.createReferences(medicationData.reasonReferences) : undefined,
            instantiatesCanonical: medicationData.instantiatesCanonical,
            instantiatesUri: medicationData.instantiatesUri,
            basedOn: medicationData.basedOn ? this.createReferences(medicationData.basedOn) : undefined,
            groupIdentifier: medicationData.groupIdentifier ? this.createIdentifier(medicationData.groupIdentifier) : undefined,
            courseOfTherapyType: medicationData.courseOfTherapyType ? this.createCodeableConcept(medicationData.courseOfTherapyType) : undefined,
            insurance: medicationData.insurance ? this.createReferences(medicationData.insurance) : undefined,
            note: medicationData.notes ? this.createAnnotations(medicationData.notes) : undefined,
            dosageInstruction: medicationData.dosageInstructions ? this.createDosages(medicationData.dosageInstructions) : undefined,
            dispenseRequest: medicationData.dispenseRequest ? this.createDispenseRequest(medicationData.dispenseRequest) : undefined,
            substitution: medicationData.substitution ? this.createMedicationRequestSubstitution(medicationData.substitution) : undefined,
            priorPrescription: medicationData.priorPrescription ? this.createReference(medicationData.priorPrescription) : undefined,
            detectedIssue: medicationData.detectedIssues ? this.createReferences(medicationData.detectedIssues) : undefined,
            eventHistory: medicationData.eventHistory ? this.createReferences(medicationData.eventHistory) : undefined
        };

        this.validateResource(medicationRequest);
        this.logFHIROperation('CREATE', this.resourceTypes.MEDICATION_REQUEST, medicationRequest.id);
        
        return medicationRequest;
    }

    /**
     * Diagnostic Report Resource Management
     */
    createDiagnosticReport(reportData) {
        const diagnosticReport = {
            resourceType: this.resourceTypes.DIAGNOSTIC_REPORT,
            id: uuidv4(),
            meta: {
                versionId: '1',
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab']
            },
            identifier: reportData.identifiers ? this.createIdentifiers(reportData.identifiers) : undefined,
            basedOn: reportData.basedOn ? this.createReferences(reportData.basedOn) : undefined,
            status: this.validateDiagnosticReportStatus(reportData.status),
            category: this.createCodeableConcepts(reportData.categories),
            code: this.createCodeableConcept(reportData.code),
            subject: this.createReference(reportData.patient),
            encounter: reportData.encounter ? this.createReference(reportData.encounter) : undefined,
            effectiveDateTime: reportData.effectiveDateTime ? this.validateDateTime(reportData.effectiveDateTime) : undefined,
            effectivePeriod: reportData.effectivePeriod ? this.createPeriod(reportData.effectivePeriod) : undefined,
            issued: reportData.issued ? this.validateDateTime(reportData.issued) : new Date().toISOString(),
            performer: reportData.performers ? this.createReferences(reportData.performers) : undefined,
            resultsInterpreter: reportData.resultsInterpreters ? this.createReferences(reportData.resultsInterpreters) : undefined,
            specimen: reportData.specimens ? this.createReferences(reportData.specimens) : undefined,
            result: reportData.results ? this.createReferences(reportData.results) : undefined,
            imagingStudy: reportData.imagingStudies ? this.createReferences(reportData.imagingStudies) : undefined,
            media: reportData.media ? this.createDiagnosticReportMedia(reportData.media) : undefined,
            conclusion: reportData.conclusion,
            conclusionCode: reportData.conclusionCodes ? this.createCodeableConcepts(reportData.conclusionCodes) : undefined,
            presentedForm: reportData.presentedForms ? this.createAttachments(reportData.presentedForms) : undefined
        };

        this.validateResource(diagnosticReport);
        this.logFHIROperation('CREATE', this.resourceTypes.DIAGNOSTIC_REPORT, diagnosticReport.id);
        
        return diagnosticReport;
    }

    /**
     * FHIR Search Operations
     */
    searchResources(resourceType, searchParams) {
        const searchResults = {
            resourceType: 'Bundle',
            id: uuidv4(),
            meta: {
                lastUpdated: new Date().toISOString()
            },
            type: 'searchset',
            total: 0,
            link: [
                {
                    relation: 'self',
                    url: `${this.baseUrl}/${resourceType}?${this.buildSearchQuery(searchParams)}`
                }
            ],
            entry: []
        };

        this.logFHIROperation('SEARCH', resourceType, null, searchParams);
        return searchResults;
    }

    /**
     * FHIR Bundle Operations
     */
    createBundle(bundleType, entries) {
        const bundle = {
            resourceType: 'Bundle',
            id: uuidv4(),
            meta: {
                lastUpdated: new Date().toISOString()
            },
            type: bundleType, // 'document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection'
            timestamp: new Date().toISOString(),
            total: entries.length,
            entry: entries.map(entry => ({
                fullUrl: `${this.baseUrl}/${entry.resource.resourceType}/${entry.resource.id}`,
                resource: entry.resource,
                request: entry.request,
                response: entry.response
            }))
        };

        this.validateResource(bundle);
        this.logFHIROperation('CREATE', 'Bundle', bundle.id);
        
        return bundle;
    }

    /**
     * FHIR Data Type Creators
     */
    createIdentifier(identifierData) {
        return {
            use: identifierData.use, // 'usual', 'official', 'temp', 'secondary', 'old'
            type: identifierData.type ? this.createCodeableConcept(identifierData.type) : undefined,
            system: identifierData.system,
            value: identifierData.value,
            period: identifierData.period ? this.createPeriod(identifierData.period) : undefined,
            assigner: identifierData.assigner ? this.createReference(identifierData.assigner) : undefined
        };
    }

    createIdentifiers(identifiersData) {
        return identifiersData ? identifiersData.map(id => this.createIdentifier(id)) : undefined;
    }

    createHumanName(nameData) {
        return {
            use: nameData.use, // 'usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden'
            text: nameData.text,
            family: nameData.family,
            given: nameData.given,
            prefix: nameData.prefix,
            suffix: nameData.suffix,
            period: nameData.period ? this.createPeriod(nameData.period) : undefined
        };
    }

    createHumanNames(namesData) {
        return namesData ? namesData.map(name => this.createHumanName(name)) : undefined;
    }

    createContactPoint(contactData) {
        return {
            system: contactData.system, // 'phone', 'fax', 'email', 'pager', 'url', 'sms', 'other'
            value: contactData.value,
            use: contactData.use, // 'home', 'work', 'temp', 'old', 'mobile'
            rank: contactData.rank,
            period: contactData.period ? this.createPeriod(contactData.period) : undefined
        };
    }

    createContactPoints(contactsData) {
        return contactsData ? contactsData.map(contact => this.createContactPoint(contact)) : undefined;
    }

    createAddress(addressData) {
        return {
            use: addressData.use, // 'home', 'work', 'temp', 'old', 'billing'
            type: addressData.type, // 'postal', 'physical', 'both'
            text: addressData.text,
            line: addressData.line,
            city: addressData.city,
            district: addressData.district,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
            period: addressData.period ? this.createPeriod(addressData.period) : undefined
        };
    }

    createAddresses(addressesData) {
        return addressesData ? addressesData.map(address => this.createAddress(address)) : undefined;
    }

    createCodeableConcept(conceptData) {
        if (!conceptData) return undefined;
        
        return {
            coding: conceptData.coding ? conceptData.coding.map(coding => ({
                system: coding.system,
                version: coding.version,
                code: coding.code,
                display: coding.display,
                userSelected: coding.userSelected
            })) : undefined,
            text: conceptData.text
        };
    }

    createCodeableConcepts(conceptsData) {
        return conceptsData ? conceptsData.map(concept => this.createCodeableConcept(concept)) : undefined;
    }

    createReference(referenceData) {
        if (!referenceData) return undefined;
        
        return {
            reference: referenceData.reference,
            type: referenceData.type,
            identifier: referenceData.identifier ? this.createIdentifier(referenceData.identifier) : undefined,
            display: referenceData.display
        };
    }

    createReferences(referencesData) {
        return referencesData ? referencesData.map(ref => this.createReference(ref)) : undefined;
    }

    createQuantity(quantityData) {
        return {
            value: quantityData.value,
            comparator: quantityData.comparator, // '<', '<=', '>=', '>'
            unit: quantityData.unit,
            system: quantityData.system,
            code: quantityData.code
        };
    }

    createPeriod(periodData) {
        return {
            start: periodData.start ? this.validateDateTime(periodData.start) : undefined,
            end: periodData.end ? this.validateDateTime(periodData.end) : undefined
        };
    }

    createRange(rangeData) {
        return {
            low: rangeData.low ? this.createQuantity(rangeData.low) : undefined,
            high: rangeData.high ? this.createQuantity(rangeData.high) : undefined
        };
    }

    createAnnotation(annotationData) {
        return {
            authorReference: annotationData.authorReference ? this.createReference(annotationData.authorReference) : undefined,
            authorString: annotationData.authorString,
            time: annotationData.time ? this.validateDateTime(annotationData.time) : undefined,
            text: annotationData.text
        };
    }

    createAnnotations(annotationsData) {
        return annotationsData ? annotationsData.map(annotation => this.createAnnotation(annotation)) : undefined;
    }

    /**
     * Validation Methods
     */
    validateResource(resource) {
        if (!resource.resourceType) {
            throw new Error('Resource must have a resourceType');
        }
        
        if (!resource.id) {
            throw new Error('Resource must have an id');
        }
        
        // Additional validation logic would go here
        return true;
    }

    validateGender(gender) {
        const validGenders = ['male', 'female', 'other', 'unknown'];
        if (gender && !validGenders.includes(gender)) {
            throw new Error(`Invalid gender: ${gender}. Must be one of: ${validGenders.join(', ')}`);
        }
        return gender;
    }

    validateDate(dateString) {
        if (!dateString) return undefined;
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${dateString}`);
        }
        
        return dateString;
    }

    validateDateTime(dateTimeString) {
        if (!dateTimeString) return undefined;
        
        const dateTime = new Date(dateTimeString);
        if (isNaN(dateTime.getTime())) {
            throw new Error(`Invalid dateTime: ${dateTimeString}`);
        }
        
        return dateTimeString;
    }

    validateObservationStatus(status) {
        const validStatuses = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid observation status: ${status}`);
        }
        return status;
    }

    validateMedicationRequestStatus(status) {
        const validStatuses = ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid medication request status: ${status}`);
        }
        return status;
    }

    validateMedicationRequestIntent(intent) {
        const validIntents = ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'];
        if (!validIntents.includes(intent)) {
            throw new Error(`Invalid medication request intent: ${intent}`);
        }
        return intent;
    }

    validateDiagnosticReportStatus(status) {
        const validStatuses = ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'appended', 'cancelled', 'entered-in-error', 'unknown'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid diagnostic report status: ${status}`);
        }
        return status;
    }

    /**
     * Utility Methods
     */
    buildSearchQuery(searchParams) {
        return Object.entries(searchParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }

    logFHIROperation(operation, resourceType, resourceId, searchParams = null) {
        this.logger.info('FHIR Operation', {
            operation,
            resourceType,
            resourceId,
            searchParams,
            timestamp: new Date().toISOString(),
            fhirVersion: this.version
        });
    }

    // Placeholder methods for complex data types (would be fully implemented)
    createCategories(categoriesData) { return categoriesData; }
    createCommunications(languagesData) { return languagesData; }
    createAge(ageData) { return ageData; }
    createObservationComponents(componentsData) { return componentsData; }
    createReferenceRanges(rangesData) { return rangesData; }
    createConditionStages(stagesData) { return stagesData; }
    createConditionEvidence(evidenceData) { return evidenceData; }
    createDosages(dosagesData) { return dosagesData; }
    createDispenseRequest(requestData) { return requestData; }
    createMedicationRequestSubstitution(substitutionData) { return substitutionData; }
    createDiagnosticReportMedia(mediaData) { return mediaData; }
    createAttachments(attachmentsData) { return attachmentsData; }
}

module.exports = FHIRR4Implementation;
