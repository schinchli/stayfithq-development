/**
 * ABHA (Ayushman Bharat Health Account) Integration System
 * Integrates with India's National Digital Health Mission (NDHM)
 */

class ABHAIntegration {
    constructor() {
        this.baseURL = 'https://healthidsbx.abdm.gov.in'; // Sandbox URL
        this.prodURL = 'https://healthidsbx.ndhm.gov.in'; // Production URL
        this.clientId = process.env.ABHA_CLIENT_ID || 'your-client-id';
        this.clientSecret = process.env.ABHA_CLIENT_SECRET || 'your-client-secret';
        this.isProduction = false; // Set to true for production
    }

    /**
     * Generate ABHA ID using Aadhaar
     */
    async generateABHAWithAadhaar(aadhaarNumber, mobile) {
        try {
            const response = await fetch(`${this.getBaseURL()}/api/v1/registration/aadhaar/generateOtp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                },
                body: JSON.stringify({
                    aadhaar: aadhaarNumber,
                    mobile: mobile
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    txnId: result.txnId,
                    message: 'OTP sent successfully to registered mobile number'
                };
            } else {
                throw new Error(result.message || 'Failed to generate OTP');
            }
        } catch (error) {
            console.error('ABHA Generation Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify OTP and complete ABHA registration
     */
    async verifyOTPAndCreateABHA(txnId, otp, password) {
        try {
            const response = await fetch(`${this.getBaseURL()}/api/v1/registration/aadhaar/verifyOTP`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                },
                body: JSON.stringify({
                    txnId: txnId,
                    otp: otp,
                    password: password
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    healthId: result.healthId,
                    healthIdNumber: result.healthIdNumber,
                    authToken: result.token,
                    profile: result.profile
                };
            } else {
                throw new Error(result.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('ABHA Verification Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search and verify existing ABHA ID
     */
    async searchABHA(healthId) {
        try {
            const response = await fetch(`${this.getBaseURL()}/api/v1/search/searchByHealthId`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                },
                body: JSON.stringify({
                    healthId: healthId
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    exists: true,
                    profile: result
                };
            } else {
                return {
                    success: true,
                    exists: false,
                    message: 'ABHA ID not found'
                };
            }
        } catch (error) {
            console.error('ABHA Search Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get ABHA profile details
     */
    async getABHAProfile(healthId, authToken) {
        try {
            const response = await fetch(`${this.getBaseURL()}/api/v1/account/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-HIP-ID': healthId
                }
            });

            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    profile: {
                        healthId: result.healthId,
                        healthIdNumber: result.healthIdNumber,
                        name: result.name,
                        gender: result.gender,
                        yearOfBirth: result.yearOfBirth,
                        dayOfBirth: result.dayOfBirth,
                        monthOfBirth: result.monthOfBirth,
                        email: result.email,
                        mobile: result.mobile,
                        address: result.address,
                        districtName: result.districtName,
                        stateName: result.stateName,
                        pincode: result.pincode
                    }
                };
            } else {
                throw new Error(result.message || 'Failed to fetch profile');
            }
        } catch (error) {
            console.error('ABHA Profile Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Link ABHA with healthcare facility
     */
    async linkWithFacility(healthId, facilityId, authToken) {
        try {
            const response = await fetch(`${this.getBaseURL()}/api/v1/patients/profile/on-share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    healthId: healthId,
                    hipId: facilityId,
                    purpose: 'CAREPROVISION'
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    linkReference: result.linkRefNumber,
                    message: 'Successfully linked with healthcare facility'
                };
            } else {
                throw new Error(result.message || 'Failed to link with facility');
            }
        } catch (error) {
            console.error('ABHA Facility Link Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get access token for ABHA API
     */
    async getAccessToken() {
        try {
            const response = await fetch(`${this.getBaseURL()}/api/v1/auth/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: this.clientId,
                    clientSecret: this.clientSecret
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                return result.accessToken;
            } else {
                throw new Error('Failed to get access token');
            }
        } catch (error) {
            console.error('ABHA Auth Error:', error);
            throw error;
        }
    }

    /**
     * Validate ABHA ID format
     */
    validateABHAFormat(abhaId) {
        // ABHA ID is 14 digits
        const abhaRegex = /^\d{14}$/;
        return {
            isValid: abhaRegex.test(abhaId),
            message: abhaRegex.test(abhaId) ? 'Valid ABHA ID format' : 'ABHA ID must be 14 digits'
        };
    }

    /**
     * Get base URL based on environment
     */
    getBaseURL() {
        return this.isProduction ? this.prodURL : this.baseURL;
    }

    /**
     * Format ABHA ID for display (XX-XXXX-XXXX-XXXX)
     */
    formatABHAForDisplay(abhaId) {
        if (!abhaId || abhaId.length !== 14) return abhaId;
        return `${abhaId.slice(0, 2)}-${abhaId.slice(2, 6)}-${abhaId.slice(6, 10)}-${abhaId.slice(10, 14)}`;
    }

    /**
     * Auto-populate profile from ABHA data
     */
    populateProfileFromABHA(abhaProfile) {
        return {
            name: abhaProfile.name,
            gender: abhaProfile.gender?.toLowerCase(),
            dateOfBirth: this.constructDateOfBirth(abhaProfile),
            email: abhaProfile.email,
            phone: abhaProfile.mobile,
            address: {
                line1: abhaProfile.address,
                city: abhaProfile.districtName,
                state: abhaProfile.stateName,
                postalCode: abhaProfile.pincode,
                country: 'IN'
            }
        };
    }

    /**
     * Construct date of birth from ABHA profile
     */
    constructDateOfBirth(abhaProfile) {
        if (abhaProfile.yearOfBirth && abhaProfile.monthOfBirth && abhaProfile.dayOfBirth) {
            const year = abhaProfile.yearOfBirth;
            const month = String(abhaProfile.monthOfBirth).padStart(2, '0');
            const day = String(abhaProfile.dayOfBirth).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return '';
    }
}

// Export for use in other modules
window.ABHAIntegration = ABHAIntegration;

// Initialize ABHA integration
const abhaService = new ABHAIntegration();
window.abhaService = abhaService;
