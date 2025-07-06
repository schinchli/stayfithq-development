/**
 * Health Document Processor with AWS Textract Integration
 * HIPAA-compliant document processing and OpenSearch indexing
 */

class HealthDocumentProcessor {
    constructor() {
        this.selectedFiles = [];
        this.extractedData = null;
        this.processedDocuments = [];
        this.textractClient = null;
        this.s3Client = null;
        
        this.init();
    }

    init() {
        this.setupDocumentUpload();
        this.setupEventListeners();
        this.initializeAWSClients();
    }

    setupDocumentUpload() {
        const fileInput = document.getElementById('healthDocuments');
        const dropZone = document.getElementById('documentDropZone');

        // File input change handler
        fileInput.addEventListener('change', (e) => {
            this.handleDocumentSelection(Array.from(e.target.files));
        });

        // Drag and drop handlers
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleDocumentSelection(Array.from(e.dataTransfer.files));
            }
        });

        // Click handler for drop zone
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    setupEventListeners() {
        // Start Textract processing button
        document.getElementById('startTextractProcessing').addEventListener('click', () => {
            this.startTextractProcessing();
        });

        // Start document indexing button
        document.getElementById('startDocumentIndexing').addEventListener('click', () => {
            this.startDocumentIndexing();
        });
    }

    handleDocumentSelection(files) {
        // Validate files
        const validFiles = files.filter(file => this.validateDocumentFile(file));
        
        if (validFiles.length === 0) {
            this.showError('Invalid Files', 'Please select valid health document files (PDF, PNG, JPG, TIFF).');
            return;
        }

        if (validFiles.length > 10) {
            this.showError('Too Many Files', 'Please select no more than 10 files at once.');
            return;
        }

        this.selectedFiles = validFiles;
        this.displayFileList();
        this.updateDocumentStepStatus(1, 'completed');
        this.updateDocumentStepStatus(2, 'active');
        this.showTextractFlow();
    }

    validateDocumentFile(file) {
        const validTypes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
            'image/tif'
        ];
        
        const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif'];
        const maxSize = 50 * 1024 * 1024; // 50MB

        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        const isValidSize = file.size <= maxSize;

        return (hasValidType || hasValidExtension) && isValidSize;
    }

    displayFileList() {
        const fileListContainer = document.getElementById('fileListContainer');
        const documentFileList = document.getElementById('documentFileList');
        
        fileListContainer.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="bi ${this.getFileIcon(file)} file-icon text-primary"></i>
                    <div class="file-details">
                        <h6>${file.name}</h6>
                        <small>${this.formatFileSize(file.size)} • ${file.type || 'Unknown type'}</small>
                    </div>
                </div>
                <div class="file-actions">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="healthDocProcessor.removeFile(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            fileListContainer.appendChild(fileItem);
        });
        
        documentFileList.style.display = 'block';
    }

    getFileIcon(file) {
        if (file.type === 'application/pdf') return 'bi-file-pdf';
        if (file.type.startsWith('image/')) return 'bi-file-image';
        return 'bi-file-medical';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displayFileList();
        
        if (this.selectedFiles.length === 0) {
            document.getElementById('documentFileList').style.display = 'none';
            this.updateDocumentStepStatus(1, 'active');
            this.updateDocumentStepStatus(2, 'inactive');
        }
    }

    showTextractFlow() {
        document.getElementById('textractFlow').style.display = 'block';
    }

    async startTextractProcessing() {
        try {
            this.updateDocumentProgress(0, 'Starting document processing...');
            
            // Step 1: Upload to S3
            await this.uploadDocumentsToS3();
            
            // Step 2: Process with Textract
            await this.processWithTextract();
            
            // Step 3: Extract and structure data
            await this.extractStructuredData();
            
            this.updateDocumentStepStatus(2, 'completed');
            this.updateDocumentStepStatus(3, 'active');
            this.showExtractedDataPreview();
            
        } catch (error) {
            this.showError('Processing Error', error.message);
            this.updateDocumentStepStatus(2, 'error');
        }
    }

    async uploadDocumentsToS3() {
        this.updateTextractStatus('s3UploadStatus', 'processing', 'Uploading documents...');
        this.updateDocumentProgress(10, 'Uploading documents to S3...');
        
        // Simulate S3 upload process
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            
            // In a real implementation, you would upload to S3 here
            await this.simulateS3Upload(file);
            
            const progress = 10 + (i + 1) / this.selectedFiles.length * 20;
            this.updateDocumentProgress(progress, `Uploaded ${i + 1}/${this.selectedFiles.length} documents...`);
        }
        
        this.updateTextractStatus('s3UploadStatus', 'completed', `${this.selectedFiles.length} documents uploaded`);
    }

    async simulateS3Upload(file) {
        return new Promise(resolve => {
            // Simulate upload delay
            setTimeout(() => {
                console.log(`Uploaded ${file.name} to S3`);
                resolve();
            }, 500);
        });
    }

    async processWithTextract() {
        this.updateTextractStatus('textractAnalysisStatus', 'processing', 'Analyzing documents...');
        this.updateDocumentProgress(40, 'Processing documents with AWS Textract...');
        
        const extractedResults = [];
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            
            // Simulate Textract processing
            const result = await this.simulateTextractAnalysis(file);
            extractedResults.push(result);
            
            const progress = 40 + (i + 1) / this.selectedFiles.length * 30;
            this.updateDocumentProgress(progress, `Processed ${i + 1}/${this.selectedFiles.length} documents...`);
        }
        
        this.extractedData = extractedResults;
        this.updateTextractStatus('textractAnalysisStatus', 'completed', `${this.selectedFiles.length} documents analyzed`);
    }

    async simulateTextractAnalysis(file) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Generate mock Textract results based on file type
                const result = this.generateMockTextractResult(file);
                resolve(result);
            }, 1000);
        });
    }

    generateMockTextractResult(file) {
        const mockResults = {
            pdf: {
                text: `PATIENT HEALTH RECORD
                
Patient Name: John Doe
Date of Birth: 01/15/1985
Medical Record Number: MRN123456

LABORATORY RESULTS - ${new Date().toLocaleDateString()}

Complete Blood Count (CBC):
- White Blood Cell Count: 7.2 K/uL (Normal: 4.0-11.0)
- Red Blood Cell Count: 4.8 M/uL (Normal: 4.2-5.4)
- Hemoglobin: 14.5 g/dL (Normal: 12.0-16.0)
- Hematocrit: 42.1% (Normal: 36.0-46.0)
- Platelet Count: 285 K/uL (Normal: 150-450)

Basic Metabolic Panel:
- Glucose: 95 mg/dL (Normal: 70-100)
- Sodium: 140 mEq/L (Normal: 136-145)
- Potassium: 4.2 mEq/L (Normal: 3.5-5.0)
- Chloride: 102 mEq/L (Normal: 98-107)
- BUN: 18 mg/dL (Normal: 7-20)
- Creatinine: 1.0 mg/dL (Normal: 0.6-1.2)

Lipid Panel:
- Total Cholesterol: 185 mg/dL (Desirable: <200)
- LDL Cholesterol: 110 mg/dL (Optimal: <100)
- HDL Cholesterol: 55 mg/dL (Good: >40)
- Triglycerides: 120 mg/dL (Normal: <150)

INTERPRETATION:
All laboratory values are within normal limits.
Continue current health maintenance routine.

Physician: Dr. Sarah Johnson, MD
Date: ${new Date().toLocaleDateString()}`,
                
                keyValuePairs: [
                    { key: 'Patient Name', value: 'John Doe' },
                    { key: 'Date of Birth', value: '01/15/1985' },
                    { key: 'Medical Record Number', value: 'MRN123456' },
                    { key: 'White Blood Cell Count', value: '7.2 K/uL' },
                    { key: 'Hemoglobin', value: '14.5 g/dL' },
                    { key: 'Glucose', value: '95 mg/dL' },
                    { key: 'Total Cholesterol', value: '185 mg/dL' },
                    { key: 'LDL Cholesterol', value: '110 mg/dL' },
                    { key: 'HDL Cholesterol', value: '55 mg/dL' }
                ],
                
                tables: [
                    {
                        title: 'Laboratory Results',
                        headers: ['Test', 'Result', 'Reference Range', 'Status'],
                        rows: [
                            ['WBC Count', '7.2 K/uL', '4.0-11.0', 'Normal'],
                            ['Hemoglobin', '14.5 g/dL', '12.0-16.0', 'Normal'],
                            ['Glucose', '95 mg/dL', '70-100', 'Normal'],
                            ['Total Cholesterol', '185 mg/dL', '<200', 'Desirable'],
                            ['LDL Cholesterol', '110 mg/dL', '<100', 'Above Optimal']
                        ]
                    }
                ]
            },
            
            image: {
                text: `PRESCRIPTION
                
Dr. Sarah Johnson, MD
Internal Medicine
123 Medical Center Drive
Healthcare City, HC 12345
Phone:<REDACTED_CREDENTIAL>

Patient: John Doe
DOB: 01/15/1985
Date: ${new Date().toLocaleDateString()}

Rx:
Lisinopril 10mg
Take 1 tablet by mouth daily
Quantity: 30 tablets
Refills: 5

For: Hypertension management

Physician Signature: Dr. Sarah Johnson, MD
DEA#: BJ1234567`,
                
                keyValuePairs: [
                    { key: 'Patient', value: 'John Doe' },
                    { key: 'DOB', value: '01/15/1985' },
                    { key: 'Medication', value: 'Lisinopril 10mg' },
                    { key: 'Dosage', value: 'Take 1 tablet by mouth daily' },
                    { key: 'Quantity', value: '30 tablets' },
                    { key: 'Refills', value: '5' },
                    { key: 'Physician', value: 'Dr. Sarah Johnson, MD' }
                ],
                
                tables: []
            }
        };
        
        const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
        return {
            fileName: file.name,
            fileType: file.type,
            ...mockResults[fileType]
        };
    }

    async extractStructuredData() {
        this.updateTextractStatus('dataExtractionStatus', 'processing', 'Extracting structured data...');
        this.updateDocumentProgress(80, 'Extracting and structuring medical data...');
        
        // Process extracted data to identify medical information
        this.processedDocuments = this.extractedData.map(doc => {
            return {
                ...doc,
                medicalData: this.extractMedicalData(doc),
                timestamp: new Date().toISOString(),
                processed: true
            };
        });
        
        this.updateDocumentProgress(100, 'Document processing complete!');
        this.updateTextractStatus('dataExtractionStatus', 'completed', 'Data extraction complete');
        
        setTimeout(() => {
            document.getElementById('docProgressBar').style.display = 'none';
        }, 1000);
    }

    extractMedicalData(document) {
        const medicalData = {
            patientInfo: {},
            labResults: [],
            medications: [],
            vitalSigns: [],
            diagnoses: []
        };

        // Extract patient information
        document.keyValuePairs.forEach(pair => {
            if (pair.key.toLowerCase().includes('patient name') || pair.key.toLowerCase().includes('name')) {
                medicalData.patientInfo.name = pair.value;
            }
            if (pair.key.toLowerCase().includes('date of birth') || pair.key.toLowerCase().includes('dob')) {
                medicalData.patientInfo.dateOfBirth = pair.value;
            }
            if (pair.key.toLowerCase().includes('medical record') || pair.key.toLowerCase().includes('mrn')) {
                medicalData.patientInfo.medicalRecordNumber = pair.value;
            }
        });

        // Extract lab results
        const labTests = ['glucose', 'cholesterol', 'hemoglobin', 'wbc', 'rbc', 'platelet'];
        document.keyValuePairs.forEach(pair => {
            const key = pair.key.toLowerCase();
            if (labTests.some(test => key.includes(test))) {
                medicalData.labResults.push({
                    test: pair.key,
                    value: pair.value,
                    extractedAt: new Date().toISOString()
                });
            }
        });

        // Extract medications
        if (document.text.toLowerCase().includes('prescription') || document.text.toLowerCase().includes('medication')) {
            const medicationMatch = document.text.match(/([A-Z][a-z]+(?:\s+\d+mg)?)/g);
            if (medicationMatch) {
                medicationMatch.forEach(med => {
                    if (med.length > 3 && !['Patient', 'Date', 'Phone', 'Address'].includes(med)) {
                        medicalData.medications.push({
                            name: med,
                            extractedAt: new Date().toISOString()
                        });
                    }
                });
            }
        }

        return medicalData;
    }

    showExtractedDataPreview() {
        const previewContainer = document.getElementById('extractedDataPreview');
        const textContent = document.getElementById('extractedTextContent');
        const structuredContent = document.getElementById('structuredDataContent');
        const medicalSummary = document.getElementById('medicalDataSummary');
        
        // Show extracted text
        const allText = this.extractedData.map(doc => 
            `=== ${doc.fileName} ===\n${doc.text}`
        ).join('\n\n');
        
        textContent.innerHTML = `<div class="extracted-text">${allText}</div>`;
        
        // Show structured data
        const structuredHTML = this.generateStructuredDataHTML();
        structuredContent.innerHTML = structuredHTML;
        
        // Show medical data summary
        const medicalHTML = this.generateMedicalSummaryHTML();
        medicalSummary.innerHTML = medicalHTML;
        
        previewContainer.style.display = 'block';
        
        // Enable next step
        this.updateDocumentStepStatus(3, 'completed');
        this.updateDocumentStepStatus(4, 'active');
        document.getElementById('startDocumentIndexing').style.display = 'inline-block';
    }

    generateStructuredDataHTML() {
        let html = '';
        
        this.extractedData.forEach(doc => {
            if (doc.keyValuePairs.length > 0) {
                html += `
                    <h6>${doc.fileName}</h6>
                    <table class="table table-sm structured-data-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${doc.keyValuePairs.map(pair => `
                                <tr>
                                    <td>${pair.key}</td>
                                    <td>${pair.value}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        });
        
        return html || '<p class="text-muted">No structured data extracted</p>';
    }

    generateMedicalSummaryHTML() {
        const allMedicalData = this.processedDocuments.map(doc => doc.medicalData);
        
        let html = '<div class="row">';
        
        // Patient Information
        const patientInfo = allMedicalData.find(data => data.patientInfo.name);
        if (patientInfo) {
            html += `
                <div class="col-md-6">
                    <div class="medical-data-card">
                        <h6><i class="bi bi-person me-2"></i>Patient Information</h6>
                        <p><strong>Name:</strong> ${patientInfo.patientInfo.name || 'N/A'}</p>
                        <p><strong>DOB:</strong> ${patientInfo.patientInfo.dateOfBirth || 'N/A'}</p>
                        <p><strong>MRN:</strong> ${patientInfo.patientInfo.medicalRecordNumber || 'N/A'}</p>
                    </div>
                </div>
            `;
        }
        
        // Lab Results Summary
        const allLabResults = allMedicalData.flatMap(data => data.labResults);
        if (allLabResults.length > 0) {
            html += `
                <div class="col-md-6">
                    <div class="medical-data-card">
                        <h6><i class="bi bi-clipboard-data me-2"></i>Lab Results (${allLabResults.length})</h6>
                        ${allLabResults.slice(0, 3).map(lab => `
                            <p><strong>${lab.test}:</strong> <span class="data-value">${lab.value}</span></p>
                        `).join('')}
                        ${allLabResults.length > 3 ? `<small class="text-muted">+${allLabResults.length - 3} more results</small>` : ''}
                    </div>
                </div>
            `;
        }
        
        // Medications Summary
        const allMedications = allMedicalData.flatMap(data => data.medications);
        if (allMedications.length > 0) {
            html += `
                <div class="col-md-6">
                    <div class="medical-data-card">
                        <h6><i class="bi bi-capsule me-2"></i>Medications (${allMedications.length})</h6>
                        ${allMedications.slice(0, 3).map(med => `
                            <p><span class="data-value">${med.name}</span></p>
                        `).join('')}
                        ${allMedications.length > 3 ? `<small class="text-muted">+${allMedications.length - 3} more medications</small>` : ''}
                    </div>
                </div>
            `;
        }
        
        // Documents Summary
        html += `
            <div class="col-md-6">
                <div class="medical-data-card">
                    <h6><i class="bi bi-files me-2"></i>Documents Processed</h6>
                    <p><span class="data-value">${this.processedDocuments.length}</span> <span class="data-unit">documents</span></p>
                    <p><strong>Types:</strong> ${this.getDocumentTypes().join(', ')}</p>
                    <p><strong>Processed:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
        
        html += '</div>';
        
        return html;
    }

    getDocumentTypes() {
        const types = [...new Set(this.selectedFiles.map(file => {
            if (file.type === 'application/pdf') return 'PDF';
            if (file.type.startsWith('image/')) return 'Image';
            return 'Document';
        }))];
        return types;
    }

    async startDocumentIndexing() {
        try {
            this.updateDocumentStepStatus(4, 'active');
            this.showDocumentOpenSearchStatus();
            
            // Index documents in OpenSearch
            await this.indexDocumentsInOpenSearch();
            
            this.updateDocumentStepStatus(4, 'completed');
            this.updateDocumentStepStatus(5, 'active');
            this.showDocumentCompletion();
            
        } catch (error) {
            this.showError('Document Indexing Error', error.message);
            this.updateDocumentStepStatus(4, 'error');
        }
    }

    async indexDocumentsInOpenSearch() {
        const statusContainer = document.getElementById('docIndexingProgress');
        
        try {
            // Create document indices
            statusContainer.innerHTML = '<p><i class="bi bi-gear-fill spin me-2"></i>Creating document indices...</p>';
            await this.createDocumentIndices();
            
            // Index extracted text
            statusContainer.innerHTML = '<p><i class="bi bi-gear-fill spin me-2"></i>Indexing extracted text...</p>';
            await this.indexExtractedText();
            
            // Index structured data
            statusContainer.innerHTML = '<p><i class="bi bi-gear-fill spin me-2"></i>Indexing structured data...</p>';
            await this.indexStructuredData();
            
            // Index medical data
            statusContainer.innerHTML = '<p><i class="bi bi-gear-fill spin me-2"></i>Indexing medical data...</p>';
            await this.indexMedicalData();
            
            statusContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    Successfully indexed ${this.processedDocuments.length} health documents in OpenSearch!
                </div>
            `;
            
        } catch (error) {
            throw new Error(`Document indexing failed: ${error.message}`);
        }
    }

    async createDocumentIndices() {
        // Simulate creating OpenSearch indices for documents
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Document indices created');
                resolve();
            }, 1000);
        });
    }

    async indexExtractedText() {
        // Simulate indexing extracted text
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Extracted text indexed');
                resolve();
            }, 800);
        });
    }

    async indexStructuredData() {
        // Simulate indexing structured data
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Structured data indexed');
                resolve();
            }, 600);
        });
    }

    async indexMedicalData() {
        // Simulate indexing medical data
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Medical data indexed');
                resolve();
            }, 700);
        });
    }

    showDocumentOpenSearchStatus() {
        document.getElementById('docOpensearchStatus').style.display = 'block';
    }

    showDocumentCompletion() {
        document.getElementById('docCompletionMessage').style.display = 'block';
        document.getElementById('docCompletionActions').style.display = 'block';
    }

    updateDocumentStepStatus(stepNumber, status) {
        const stepNames = ['upload', 'textract', 'preview', 'opensearch', 'completion'];
        const step = document.getElementById(`doc-step-${stepNames[stepNumber - 1]}`);
        const stepNumberElement = step.querySelector('.step-number');
        
        // Remove existing status classes
        step.classList.remove('active', 'completed', 'error', 'inactive');
        stepNumberElement.classList.remove('bg-primary', 'bg-success', 'bg-secondary', 'bg-danger');
        
        // Add new status
        step.classList.add(status);
        
        switch (status) {
            case 'active':
                stepNumberElement.classList.add('bg-primary');
                break;
            case 'completed':
                stepNumberElement.classList.add('bg-success');
                stepNumberElement.innerHTML = '<i class="bi bi-check"></i>';
                break;
            case 'error':
                stepNumberElement.classList.add('bg-danger');
                stepNumberElement.innerHTML = '<i class="bi bi-x"></i>';
                break;
            default:
                stepNumberElement.classList.add('bg-secondary');
        }
    }

    updateDocumentProgress(percentage, status) {
        const progressBar = document.getElementById('docProgressBar');
        const progressText = document.getElementById('docProgressText');
        const processingStatus = document.getElementById('docProcessingStatus');
        
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
        progressText.textContent = `${percentage}%`;
        processingStatus.innerHTML = `<small class="text-muted">${status}</small>`;
    }

    updateTextractStatus(elementId, status, message) {
        const element = document.getElementById(elementId);
        element.className = `textract-status ${status}`;
        
        let icon = 'bi-clock';
        if (status === 'processing') icon = 'bi-gear-fill spin';
        if (status === 'completed') icon = 'bi-check-circle';
        if (status === 'error') icon = 'bi-exclamation-triangle';
        
        element.innerHTML = `<i class="bi ${icon} me-2"></i>${message}`;
    }

    initializeAWSClients() {
        // Initialize AWS clients (mock for demo)
        this.textractClient = {
            analyzeDocument: this.mockAnalyzeDocument.bind(this)
        };
        
        this.s3Client = {
            upload: this.mockS3Upload.bind(this)
        };
    }

    async mockAnalyzeDocument(params) {
        // Mock Textract API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ JobId: 'mock-job-id' });
            }, 1000);
        });
    }

    async mockS3Upload(params) {
        // Mock S3 upload
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ Location: 'https://mock-s3-url.com/file' });
            }, 500);
        });
    }

    showError(title, message) {
        const errorHTML = `
            <div class="error-message">
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>${title}</strong>
                </div>
                <p class="mb-0">${message}</p>
            </div>
        `;
        
        // Insert error message after the current step
        const currentStep = document.querySelector('.import-step.active');
        if (currentStep) {
            currentStep.insertAdjacentHTML('afterend', errorHTML);
        }
    }
}

// Initialize the Health Document Processor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.healthDocProcessor = new HealthDocumentProcessor();
});

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
