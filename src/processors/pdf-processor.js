/**
 * PDF Health Document Processor
 * Extracts health information from PDF documents using pattern matching and OCR
 */

const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class PDFProcessor {
  constructor() {
    this.supportedTypes = [
      'lab_report',
      'medical_record', 
      'prescription',
      'insurance_form',
      'discharge_summary',
      'imaging_report'
    ];
  }

  /**
   * Process PDF health document
   */
  async processPDFHealthDocument(filePath) {
    try {
      logger.info(`Processing PDF health document: ${filePath}`);

      // Get file info
      const fileStats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const documentType = this.identifyDocumentType(fileName);

      const result = {
        file_path: filePath,
        file_name: fileName,
        file_size: fileStats.size,
        document_type: documentType,
        processing_date: new Date().toISOString(),
        extracted_text: '',
        structured_data: {},
        health_insights: [],
        extraction_confidence: 0
      };

      // For now, simulate text extraction since we don't have actual PDF parsing
      // In a real implementation, this would use pdf-parse or similar library
      result.extracted_text = await this.simulateTextExtraction(filePath, documentType);
      
      // Extract structured health data
      result.structured_data = this.extractHealthPatterns(result.extracted_text, documentType);
      
      // Generate health insights
      result.health_insights = this.generateHealthInsights(result.structured_data, documentType);
      
      // Calculate extraction confidence
      result.extraction_confidence = this.calculateExtractionConfidence(result);

      logger.info(`PDF processing completed: ${fileName}, confidence: ${result.extraction_confidence}%`);
      return result;

    } catch (error) {
      logger.error(`Error processing PDF ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Identify document type based on filename and content patterns
   */
  identifyDocumentType(fileName) {
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.includes('lab') || lowerFileName.includes('blood') || lowerFileName.includes('test')) {
      return 'lab_report';
    }
    if (lowerFileName.includes('prescription') || lowerFileName.includes('rx') || lowerFileName.includes('medication')) {
      return 'prescription';
    }
    if (lowerFileName.includes('discharge') || lowerFileName.includes('summary')) {
      return 'discharge_summary';
    }
    if (lowerFileName.includes('imaging') || lowerFileName.includes('xray') || lowerFileName.includes('mri') || lowerFileName.includes('ct')) {
      return 'imaging_report';
    }
    if (lowerFileName.includes('insurance') || lowerFileName.includes('claim')) {
      return 'insurance_form';
    }

    return 'medical_record';
  }

  /**
   * Simulate text extraction from PDF (placeholder for actual OCR)
   */
  async simulateTextExtraction(filePath, documentType) {
    // In a real implementation, this would use libraries like:
    // - pdf-parse for text-based PDFs
    // - AWS Textract for OCR of scanned documents
    // - Tesseract.js for local OCR
    
    const simulatedContent = this.generateSimulatedContent(documentType, path.basename(filePath));
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return simulatedContent;
  }

  /**
   * Generate simulated content based on document type
   */
  generateSimulatedContent(documentType, fileName) {
    const currentDate = new Date().toLocaleDateString();
    
    switch (documentType) {
      case 'lab_report':
        return `
LABORATORY REPORT
Date: ${currentDate}
Patient: <PATIENT_NAME>
DOB: <DATE_OF_BIRTH>

COMPLETE BLOOD COUNT (CBC)
White Blood Cell Count: 7.2 K/uL (Normal: 4.0-11.0)
Red Blood Cell Count: 4.5 M/uL (Normal: 4.2-5.4)
Hemoglobin: 14.2 g/dL (Normal: 12.0-16.0)
Hematocrit: 42.1% (Normal: 36.0-46.0)
Platelet Count: 285 K/uL (Normal: 150-450)

BASIC METABOLIC PANEL
Glucose: 95 mg/dL (Normal: 70-100)
BUN: 18 mg/dL (Normal: 7-20)
Creatinine: 1.0 mg/dL (Normal: 0.6-1.2)
Sodium: 140 mEq/L (Normal: 136-145)
Potassium: 4.2 mEq/L (Normal: 3.5-5.0)
Chloride: 102 mEq/L (Normal: 98-107)

LIPID PANEL
Total Cholesterol: 185 mg/dL (Desirable: <200)
HDL Cholesterol: 55 mg/dL (Good: >40)
LDL Cholesterol: 110 mg/dL (Optimal: <100)
Triglycerides: 120 mg/dL (Normal: <150)

All values within normal limits.
        `;

      case 'prescription':
        return `
PRESCRIPTION
Date: ${currentDate}
Patient: <PATIENT_NAME>
DOB: <DATE_OF_BIRTH>

Rx: Lisinopril 10mg
Sig: Take 1 tablet by mouth daily
Qty: 30 tablets
Refills: 5

Rx: Metformin 500mg
Sig: Take 1 tablet by mouth twice daily with meals
Qty: 60 tablets
Refills: 3

Rx: Atorvastatin 20mg
Sig: Take 1 tablet by mouth at bedtime
Qty: 30 tablets
Refills: 5

Provider: Dr. <PROVIDER_NAME>
DEA: <DEA_NUMBER>
        `;

      case 'medical_record':
        return `
MEDICAL RECORD
Date: ${currentDate}
Patient: <PATIENT_NAME>
DOB: <DATE_OF_BIRTH>

CHIEF COMPLAINT: Annual physical examination

VITAL SIGNS:
Blood Pressure: 128/82 mmHg
Heart Rate: 72 bpm
Temperature: 98.6°F
Respiratory Rate: 16/min
Weight: 175 lbs
Height: 5'10"
BMI: 25.1

ASSESSMENT:
1. Hypertension, well controlled
2. Type 2 Diabetes Mellitus, well controlled
3. Hyperlipidemia, on treatment

PLAN:
- Continue current medications
- Follow up in 3 months
- Annual lab work recommended
- Increase physical activity to 150 minutes per week
- Maintain current diet modifications
        `;

      case 'discharge_summary':
        return `
DISCHARGE SUMMARY
Date: ${currentDate}
Patient: <PATIENT_NAME>
DOB: <DATE_OF_BIRTH>

ADMISSION DATE: ${new Date(Date.now() - 3*24*60*60*1000).toLocaleDateString()}
DISCHARGE DATE: ${currentDate}

PRINCIPAL DIAGNOSIS: Acute myocardial infarction

PROCEDURES PERFORMED:
- Cardiac catheterization
- Percutaneous coronary intervention

DISCHARGE MEDICATIONS:
- Aspirin 81mg daily
- Clopidogrel 75mg daily
- Metoprolol 50mg twice daily
- Atorvastatin 80mg daily

DISCHARGE INSTRUCTIONS:
- Follow up with cardiologist in 1 week
- Cardiac rehabilitation program
- No heavy lifting for 2 weeks
- Take medications as prescribed
        `;

      default:
        return `
HEALTH DOCUMENT
Date: ${currentDate}
Patient: <PATIENT_NAME>
Document Type: ${documentType}

This is a simulated health document for processing demonstration.
Contains various health-related information and medical data.
        `;
    }
  }

  /**
   * Extract health patterns from text using regex and keyword matching
   */
  extractHealthPatterns(text, documentType) {
    const structuredData = {
      vitals: {},
      lab_values: [],
      medications: [],
      diagnoses: [],
      procedures: [],
      recommendations: []
    };

    try {
      // Extract vital signs
      structuredData.vitals = this.extractVitalSigns(text);
      
      // Extract lab values
      structuredData.lab_values = this.extractLabValues(text);
      
      // Extract medications
      structuredData.medications = this.extractMedications(text);
      
      // Extract diagnoses
      structuredData.diagnoses = this.extractDiagnoses(text);
      
      // Extract procedures
      structuredData.procedures = this.extractProcedures(text);
      
      // Extract recommendations
      structuredData.recommendations = this.extractRecommendations(text);

    } catch (error) {
      logger.error('Error extracting health patterns:', error);
    }

    return structuredData;
  }

  /**
   * Extract vital signs from text
   */
  extractVitalSigns(text) {
    const vitals = {};

    try {
      // Blood pressure
      const bpMatch = text.match(/blood\s*pressure:?\s*(\d{2,3})\/(\d{2,3})\s*mmhg/i);
      if (bpMatch) {
        vitals.blood_pressure = {
          systolic: parseInt(bpMatch[1]),
          diastolic: parseInt(bpMatch[2]),
          unit: 'mmHg'
        };
      }

      // Heart rate
      const hrMatch = text.match(/heart\s*rate:?\s*(\d+)\s*bpm/i);
      if (hrMatch) {
        vitals.heart_rate = {
          value: parseInt(hrMatch[1]),
          unit: 'bpm'
        };
      }

      // Temperature
      const tempMatch = text.match(/temperature:?\s*(\d+\.?\d*)\s*°?f/i);
      if (tempMatch) {
        vitals.temperature = {
          value: parseFloat(tempMatch[1]),
          unit: 'F'
        };
      }

      // Weight
      const weightMatch = text.match(/weight:?\s*(\d+\.?\d*)\s*lbs?/i);
      if (weightMatch) {
        vitals.weight = {
          value: parseFloat(weightMatch[1]),
          unit: 'lbs'
        };
      }

      // Height
      const heightMatch = text.match(/height:?\s*(\d+)'(\d+)"/i);
      if (heightMatch) {
        vitals.height = {
          feet: parseInt(heightMatch[1]),
          inches: parseInt(heightMatch[2]),
          unit: 'ft/in'
        };
      }

      // BMI
      const bmiMatch = text.match(/bmi:?\s*(\d+\.?\d*)/i);
      if (bmiMatch) {
        vitals.bmi = {
          value: parseFloat(bmiMatch[1]),
          unit: 'kg/m²'
        };
      }

    } catch (error) {
      logger.error('Error extracting vital signs:', error);
    }

    return vitals;
  }

  /**
   * Extract lab values from text
   */
  extractLabValues(text) {
    const labValues = [];

    try {
      // Common lab value patterns
      const patterns = [
        /(\w+(?:\s+\w+)*):?\s*(\d+\.?\d*)\s*(\w+\/?\w*)\s*\(normal:?\s*([^)]+)\)/gi,
        /(\w+(?:\s+\w+)*):?\s*(\d+\.?\d*)\s*(\w+\/?\w*)/gi
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const labValue = {
            test_name: match[1].trim(),
            value: parseFloat(match[2]),
            unit: match[3] || '',
            normal_range: match[4] || null
          };

          // Skip if test name is too generic
          if (labValue.test_name.length > 3 && !labValue.test_name.match(/^(the|and|for|with)$/i)) {
            labValues.push(labValue);
          }
        }
      });

    } catch (error) {
      logger.error('Error extracting lab values:', error);
    }

    return labValues;
  }

  /**
   * Extract medications from text
   */
  extractMedications(text) {
    const medications = [];

    try {
      // Medication patterns
      const patterns = [
        /rx:?\s*(\w+)\s+(\d+)\s*mg/gi,
        /(\w+)\s+(\d+)\s*mg.*?take\s+(\d+).*?(daily|twice|three times)/gi,
        /(\w+)\s+(\d+)\s*mcg/gi
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const medication = {
            name: match[1],
            dosage: match[2],
            unit: match[0].includes('mcg') ? 'mcg' : 'mg',
            frequency: match[4] || 'as directed'
          };

          medications.push(medication);
        }
      });

    } catch (error) {
      logger.error('Error extracting medications:', error);
    }

    return medications;
  }

  /**
   * Extract diagnoses from text
   */
  extractDiagnoses(text) {
    const diagnoses = [];

    try {
      // Common diagnosis patterns
      const diagnosisKeywords = [
        'hypertension', 'diabetes', 'hyperlipidemia', 'obesity', 'depression',
        'anxiety', 'asthma', 'copd', 'arthritis', 'osteoporosis', 'anemia',
        'thyroid', 'cardiac', 'myocardial infarction', 'stroke', 'cancer'
      ];

      diagnosisKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(text)) {
          diagnoses.push({
            condition: keyword,
            mentioned: true
          });
        }
      });

      // Look for numbered diagnosis lists
      const diagnosisListMatch = text.match(/(?:assessment|diagnosis|diagnoses):?\s*((?:\d+\..*?(?=\d+\.|$))+)/gi);
      if (diagnosisListMatch) {
        diagnosisListMatch.forEach(match => {
          const items = match.split(/\d+\./).filter(item => item.trim());
          items.forEach(item => {
            if (item.trim().length > 5) {
              diagnoses.push({
                condition: item.trim(),
                from_list: true
              });
            }
          });
        });
      }

    } catch (error) {
      logger.error('Error extracting diagnoses:', error);
    }

    return diagnoses;
  }

  /**
   * Extract procedures from text
   */
  extractProcedures(text) {
    const procedures = [];

    try {
      // Common procedure keywords
      const procedureKeywords = [
        'catheterization', 'angioplasty', 'surgery', 'biopsy', 'endoscopy',
        'colonoscopy', 'mammography', 'ultrasound', 'ct scan', 'mri',
        'x-ray', 'ecg', 'ekg', 'stress test', 'blood draw'
      ];

      procedureKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(text)) {
          procedures.push({
            procedure: keyword,
            mentioned: true
          });
        }
      });

      // Look for procedure lists
      const procedureListMatch = text.match(/(?:procedures?|performed):?\s*((?:\d+\..*?(?=\d+\.|$))+)/gi);
      if (procedureListMatch) {
        procedureListMatch.forEach(match => {
          const items = match.split(/\d+\./).filter(item => item.trim());
          items.forEach(item => {
            if (item.trim().length > 5) {
              procedures.push({
                procedure: item.trim(),
                from_list: true
              });
            }
          });
        });
      }

    } catch (error) {
      logger.error('Error extracting procedures:', error);
    }

    return procedures;
  }

  /**
   * Extract recommendations from text
   */
  extractRecommendations(text) {
    const recommendations = [];

    try {
      // Look for recommendation sections
      const recommendationSections = [
        'plan', 'recommendations', 'instructions', 'follow up', 'discharge instructions'
      ];

      recommendationSections.forEach(section => {
        const regex = new RegExp(`${section}:?\\s*([^\\n]*(?:\\n(?!\\w+:)[^\\n]*)*)`, 'gi');
        const match = regex.exec(text);
        if (match && match[1]) {
          const content = match[1].trim();
          if (content.length > 10) {
            recommendations.push({
              type: section,
              content: content,
              source: 'document_section'
            });
          }
        }
      });

      // Look for specific recommendation patterns
      const recommendationPatterns = [
        /follow up.*?(\d+)\s*(week|month|day)/gi,
        /increase.*?activity/gi,
        /continue.*?medication/gi,
        /avoid.*?lifting/gi
      ];

      recommendationPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          recommendations.push({
            type: 'specific_instruction',
            content: match[0],
            source: 'pattern_match'
          });
        }
      });

    } catch (error) {
      logger.error('Error extracting recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Generate health insights from structured data
   */
  generateHealthInsights(structuredData, documentType) {
    const insights = [];

    try {
      // Vital signs insights
      if (structuredData.vitals.blood_pressure) {
        const bp = structuredData.vitals.blood_pressure;
        if (bp.systolic > 140 || bp.diastolic > 90) {
          insights.push({
            type: 'alert',
            category: 'blood_pressure',
            message: `Elevated blood pressure: ${bp.systolic}/${bp.diastolic} mmHg`,
            recommendation: 'Monitor blood pressure regularly and consult physician'
          });
        }
      }

      if (structuredData.vitals.bmi) {
        const bmi = structuredData.vitals.bmi.value;
        if (bmi > 30) {
          insights.push({
            type: 'alert',
            category: 'weight',
            message: `BMI indicates obesity: ${bmi}`,
            recommendation: 'Consider weight management program'
          });
        } else if (bmi > 25) {
          insights.push({
            type: 'recommendation',
            category: 'weight',
            message: `BMI indicates overweight: ${bmi}`,
            recommendation: 'Consider lifestyle modifications'
          });
        }
      }

      // Lab values insights
      structuredData.lab_values.forEach(lab => {
        if (lab.test_name.toLowerCase().includes('glucose') && lab.value > 100) {
          insights.push({
            type: 'alert',
            category: 'glucose',
            message: `Elevated glucose level: ${lab.value} ${lab.unit}`,
            recommendation: 'Monitor blood sugar and follow diabetic diet if applicable'
          });
        }

        if (lab.test_name.toLowerCase().includes('cholesterol') && lab.value > 200) {
          insights.push({
            type: 'recommendation',
            category: 'cholesterol',
            message: `Elevated cholesterol: ${lab.value} ${lab.unit}`,
            recommendation: 'Consider dietary changes and regular exercise'
          });
        }
      });

      // Medication insights
      if (structuredData.medications.length > 5) {
        insights.push({
          type: 'recommendation',
          category: 'medication_management',
          message: `Multiple medications prescribed: ${structuredData.medications.length}`,
          recommendation: 'Consider medication management system or app'
        });
      }

      // Diagnosis insights
      const chronicConditions = structuredData.diagnoses.filter(d => 
        ['hypertension', 'diabetes', 'hyperlipidemia'].includes(d.condition.toLowerCase())
      );

      if (chronicConditions.length > 0) {
        insights.push({
          type: 'recommendation',
          category: 'chronic_disease_management',
          message: `Chronic conditions identified: ${chronicConditions.map(c => c.condition).join(', ')}`,
          recommendation: 'Regular monitoring and lifestyle modifications recommended'
        });
      }

    } catch (error) {
      logger.error('Error generating health insights:', error);
    }

    return insights;
  }

  /**
   * Calculate extraction confidence based on data completeness
   */
  calculateExtractionConfidence(result) {
    let confidence = 0;
    let factors = 0;

    // Text extraction confidence
    if (result.extracted_text.length > 100) {
      confidence += 30;
    } else if (result.extracted_text.length > 50) {
      confidence += 15;
    }
    factors++;

    // Structured data confidence
    const structuredData = result.structured_data;
    
    if (Object.keys(structuredData.vitals).length > 0) {
      confidence += 20;
    }
    factors++;

    if (structuredData.lab_values.length > 0) {
      confidence += 20;
    }
    factors++;

    if (structuredData.medications.length > 0) {
      confidence += 15;
    }
    factors++;

    if (structuredData.diagnoses.length > 0) {
      confidence += 15;
    }
    factors++;

    // Normalize confidence score
    return Math.min(confidence, 100);
  }

  /**
   * Batch process multiple PDF files
   */
  async batchProcessPDFs(filePaths) {
    const results = [];
    const errors = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.processPDFHealthDocument(filePath);
        results.push(result);
      } catch (error) {
        errors.push({
          file: filePath,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      errors: errors,
      summary: {
        total_files: filePaths.length,
        successful_count: results.length,
        error_count: errors.length,
        success_rate: (results.length / filePaths.length) * 100
      }
    };
  }
}

module.exports = PDFProcessor;
