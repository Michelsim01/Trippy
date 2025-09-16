import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { kycService } from '../services/kycService';

const idTypes = [
    { value: "nric", label: "NRIC" },
    { value: "passport", label: "Passport" },
    { value: "other", label: "Other" }
];

export default function KycVerificationPage() {
    const navigate = useNavigate();
    const { user: authUser, isAuthenticated, isLoading: authLoading, token } = useAuth();
    
    // Get user ID from auth context
    const currentUserId = authUser?.id;

    function handleKycClick() {
        navigate('/kyc-verification');
    }

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        fullName: "",
        dob: "",
        nationality: "",
        idType: "",
        otherIdType: "",
        idNumber: "",
        email: "",
        mobileCountry: "",
        mobileNumber: "",
        declaration: false,
        consent: false,
        documentFile: null,
        documentFileUrl: null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploadingDocument, setUploadingDocument] = useState(false);

    // Handle authentication checks
    useEffect(() => {
        // Don't check auth if still loading
        if (authLoading) {
            return;
        }
        
        // If user is not authenticated, redirect to signin
        if (!isAuthenticated) {
            setError('You must be logged in to access KYC verification');
            setTimeout(() => {
                navigate('/signin');
            }, 2000);
            return;
        }
        
        // Clear any previous errors if authenticated
        if (isAuthenticated && currentUserId) {
            setError(null);
        }
    }, [isAuthenticated, authLoading, currentUserId, navigate]);

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => {
            const newForm = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };
            
            // If ID type changes and we already have a document, clear it so user uploads new one
            if (name === 'idType' && prev.documentFile) {
                newForm.documentFile = null;
                newForm.documentFileUrl = null;
                // Clear file input
                const fileInput = document.getElementById('documentFile');
                if (fileInput) fileInput.value = '';
            }
            
            return newForm;
        });

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    documentFile: 'Only JPG, PNG, and PDF files are allowed'
                }));
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    documentFile: 'File size must be less than 10MB'
                }));
                return;
            }

            setForm(prev => ({
                ...prev,
                documentFile: file
            }));

            // Clear any previous errors
            setErrors(prev => ({
                ...prev,
                documentFile: ''
            }));

            // Upload the file immediately
            uploadDocument(file);
        }
    }

    async function uploadDocument(file) {
        if (!currentUserId || !form.idType) {
            setErrors(prev => ({
                ...prev,
                documentFile: 'Please select ID type first'
            }));
            return;
        }

        setUploadingDocument(true);
        try {
            const docType = form.idType === 'other' ? form.otherIdType : form.idType;
            const response = await kycService.uploadDocument(currentUserId, file, docType);
            
            setForm(prev => ({
                ...prev,
                documentFileUrl: response.fileUrl
            }));

            setErrors(prev => ({
                ...prev,
                documentFile: ''
            }));
        } catch (error) {
            console.error('Document upload failed:', error);
            setErrors(prev => ({
                ...prev,
                documentFile: error.message
            }));
        } finally {
            setUploadingDocument(false);
        }
    }

    function validateStep1() {
        const newErrors = {};
        if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!form.dob) newErrors.dob = 'Date of birth is required';
        if (!form.nationality.trim()) newErrors.nationality = 'Nationality is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function validateStep2() {
        const newErrors = {};
        if (!form.idType) newErrors.idType = 'ID type is required';
        if (form.idType === "other" && !form.otherIdType.trim()) newErrors.otherIdType = 'Please specify your document type';
        if (!form.idNumber.trim()) newErrors.idNumber = 'ID number is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email is invalid';

        // Mobile is optional but if one is filled, require both
        if ((form.mobileCountry && !form.mobileNumber.trim()) || (!form.mobileCountry && form.mobileNumber.trim())) {
            newErrors.mobileNumber = 'Please provide both country code and number';
        }

        // Document upload is required
        if (!form.documentFile && !form.documentFileUrl) {
            newErrors.documentFile = 'Please upload your ID document';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleNext() {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    }

    function handleBack() {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigate("/kyc-onboarding");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.declaration || !form.consent) {
            alert(
                "Please confirm that the information is true and consent to data collection."
            );
            return;
        }

        if (!currentUserId || !isAuthenticated || !token) {
            setError('Authentication required to submit KYC verification');
            alert("Authentication required. Please log in again.");
            setTimeout(() => {
                navigate('/signin');
            }, 2000);
            return;
        }

        setSubmitting(true);
        setErrors({});
        setError(null);

        console.log('Submitting KYC with userId:', currentUserId, 'documentFileUrl:', form.documentFileUrl);

        try {
            if (form.documentFileUrl) {
                // If document was uploaded, use the new submission method with document
                await kycService.submitKycWithDocument(currentUserId, form, form.documentFileUrl);
            } else {
                // Fallback to original method if no document
                await kycService.submitKyc(currentUserId, form);
            }
            updateKycStatus('PENDING');
            alert("KYC submitted successfully! Your application is under review.");
            navigate("/kyc-submitted");
        } catch (error) {
            console.error('KYC submission failed:', error);
            
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                setError('Authentication required. Please log in again.');
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            } else {
                setErrors({ submit: error.message });
                setError(`Submission failed: ${error.message}`);
                alert(`Submission failed: ${error.message}`);
            }
        } finally {
            setSubmitting(false);
        }
    }

    const progressPercentage = (currentStep / 3) * 100;

    return (
        <div className="min-h-screen bg-neutrals-8">
            {/* Navbar */}
            <Navbar
                onToggleSidebar={() => setSidebarOpen(true)}
                isAuthenticated={isAuthenticated}
            />

            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                variant="mobile"
                isAuthenticated={isAuthenticated}
            />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'blur-sm' : ''} py-8`}>
                <div className="max-w-2xl mx-auto px-4">
                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-center">{error}</p>
                            {!isAuthenticated && (
                                <div className="mt-2 text-center">
                                    <button
                                        onClick={() => navigate('/signin')}
                                        className="px-4 py-2 bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Loading Display */}
                    {(authLoading || loading) && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-1 border-t-transparent mx-auto mb-4"></div>
                            <span className="text-neutrals-4">Loading...</span>
                        </div>
                    )}
                    
                    {/* Only show form if authenticated and not loading */}
                    {isAuthenticated && !authLoading && !error && (
                        <>
                            {/* Progress Header */}
                            <div className="text-center mb-8">
                                <h1
                                    className="text-3xl font-bold text-neutrals-1 mb-2"
                                    style={{ fontFamily: 'var(--font-family-poppins)' }}
                                >
                                    KYC Verification
                                </h1>
                                <p
                                    className="text-neutrals-4 text-lg"
                                    style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                >
                                    Help us verify your identity to become a trusted guide
                                </p>
                            </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${currentStep >= step
                                                ? 'bg-primary-1 text-white'
                                                : 'bg-neutrals-6 text-neutrals-4'
                                                }`}
                                        >
                                            {currentStep > step ? '✓' : step}
                                        </div>
                                        {step < 3 && (
                                            <div
                                                className={`w-16 h-1 mx-2 transition-all duration-300 ${currentStep > step ? 'bg-primary-1' : 'bg-neutrals-6'
                                                    }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-sm text-neutrals-4 mb-2">
                            Step {currentStep} of 3
                        </div>
                        <div className="w-full bg-neutrals-6 rounded-full h-2">
                            <div
                                className="bg-primary-1 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutrals-6 p-8">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Personal Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2
                                            className="text-xl font-semibold text-neutrals-1 mb-6"
                                            style={{ fontFamily: 'var(--font-family-poppins)' }}
                                        >
                                            Personal Information
                                        </h2>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label
                                                htmlFor="fullName"
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                Full Legal Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                id="fullName"
                                                value={form.fullName}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-neutrals-6'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                                placeholder="Enter your full legal name"
                                            />
                                            {errors.fullName && (
                                                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="dob"
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                Date of Birth *
                                            </label>
                                            <input
                                                type="date"
                                                name="dob"
                                                id="dob"
                                                value={form.dob}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent ${errors.dob ? 'border-red-500' : 'border-neutrals-6'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            />
                                            {errors.dob && (
                                                <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="nationality"
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                Nationality *
                                            </label>
                                            <input
                                                type="text"
                                                name="nationality"
                                                id="nationality"
                                                value={form.nationality}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent ${errors.nationality ? 'border-red-500' : 'border-neutrals-6'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                                placeholder="e.g., Singaporean, Malaysian"
                                            />
                                            {errors.nationality && (
                                                <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Identification */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2
                                            className="text-xl font-semibold text-neutrals-1 mb-6"
                                            style={{ fontFamily: 'var(--font-family-poppins)' }}
                                        >
                                            Identification & Contact
                                        </h2>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label
                                                htmlFor="idType"
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                ID Type *
                                            </label>
                                            <select
                                                name="idType"
                                                id="idType"
                                                value={form.idType}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent ${errors.idType ? 'border-red-500' : 'border-neutrals-6'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                <option value="">Select ID type...</option>
                                                {idTypes.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {errors.idType && (
                                                <p className="text-red-500 text-sm mt-1">{errors.idType}</p>
                                            )}
                                        </div>
                                        {/* Show extra box if "other" selected */}
                                        {form.idType === "other" && (
                                            <div>
                                                <label
                                                    htmlFor="otherIdType"
                                                    className="block text-sm font-medium text-neutrals-2 mb-2"
                                                >
                                                    Please specify your document type *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="otherIdType"
                                                    id="otherIdType"
                                                    value={form.otherIdType}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 border rounded-lg ${errors.otherIdType ? 'border-red-500' : 'border-neutrals-6'}`}
                                                    placeholder="e.g., Student Pass, Work Permit"
                                                />
                                                {errors.otherIdType && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.otherIdType}</p>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label
                                                htmlFor="idNumber"
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                ID Number *
                                            </label>
                                            <input
                                                type="text"
                                                name="idNumber"
                                                id="idNumber"
                                                value={form.idNumber}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent ${errors.idNumber ? 'border-red-500' : 'border-neutrals-6'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                                placeholder="Enter your ID number"
                                            />
                                            {errors.idNumber && (
                                                <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                            >
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-neutrals-6'
                                                    }`}
                                                style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                                placeholder="your.email@example.com"
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                className="block text-sm font-medium text-neutrals-2 mb-2"
                                            >
                                                Mobile Number <span className="text-neutrals-4">(Optional)</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="mobileCountry"
                                                    value={form.mobileCountry}
                                                    onChange={handleChange}
                                                    className="px-4 py-3 border border-neutrals-6 rounded-lg w-1/3"
                                                    placeholder="Country code (e.g. +65)"
                                                    maxLength={5}
                                                />
                                                <input
                                                    type="text"
                                                    name="mobileNumber"
                                                    value={form.mobileNumber}
                                                    onChange={handleChange}
                                                    className="px-4 py-3 border border-neutrals-6 rounded-lg w-2/3"
                                                    placeholder="Enter number"
                                                />
                                            </div>
                                            {errors.mobileNumber && (
                                                <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>
                                            )}
                                        </div>

                                        {/* ID Document Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                                ID Document Upload *
                                            </label>
                                            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                                form.documentFile ? 'border-green-400 bg-green-50' : 
                                                errors.documentFile ? 'border-red-400 bg-red-50' : 
                                                'border-neutrals-6 hover:border-neutrals-4'
                                            }`}>
                                                {uploadingDocument ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-1 border-t-transparent mb-2"></div>
                                                        <p className="text-sm text-neutrals-4">Uploading document...</p>
                                                    </div>
                                                ) : form.documentFile ? (
                                                    <div className="flex flex-col items-center">
                                                        <svg className="h-12 w-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                                                            <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <path d="M21 6H9a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                        <p className="text-sm text-green-600 font-medium mb-1">
                                                            Document uploaded successfully!
                                                        </p>
                                                        <p className="text-xs text-neutrals-4 mb-2">
                                                            {form.documentFile.name}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => document.getElementById('documentFile').click()}
                                                            className="text-xs text-primary-1 hover:underline"
                                                        >
                                                            Upload different file
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <svg className="mx-auto h-12 w-12 text-neutrals-4 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <p className="text-sm text-neutrals-4 mb-1">
                                                            Click to upload or drag and drop
                                                        </p>
                                                        <p className="text-xs text-neutrals-5 mb-2">
                                                            JPG, PNG, or PDF (max 10MB)
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => document.getElementById('documentFile').click()}
                                                            className="px-4 py-2 text-sm bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors"
                                                        >
                                                            Select File
                                                        </button>
                                                    </div>
                                                )}
                                                <input
                                                    id="documentFile"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </div>
                                            {errors.documentFile && (
                                                <p className="text-red-500 text-sm mt-1">{errors.documentFile}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Consent & Declaration */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2
                                            className="text-xl font-semibold text-neutrals-1 mb-6"
                                            style={{ fontFamily: 'var(--font-family-poppins)' }}
                                        >
                                            Final Steps
                                        </h2>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Summary Card */}
                                        <div className="bg-neutrals-7 rounded-xl p-6">
                                            <h3 className="font-medium text-neutrals-2 mb-4">Review Your Information</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Name:</span>
                                                    <span className="text-neutrals-2">{form.fullName || 'Not provided'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Date of Birth:</span>
                                                    <span className="text-neutrals-2">{form.dob || 'Not provided'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Nationality:</span>
                                                    <span className="text-neutrals-2">{form.nationality || 'Not provided'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">ID Type:</span>
                                                    <span className="text-neutrals-2">{form.idType ? idTypes.find(t => t.value === form.idType)?.label : 'Not provided'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Email:</span>
                                                    <span className="text-neutrals-2">{form.email || 'Not provided'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutrals-4">Document:</span>
                                                    <span className={`text-sm ${form.documentFile ? 'text-green-600' : 'text-red-500'}`}>
                                                        {form.documentFile ? '✓ Uploaded' : '✗ Not uploaded'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Consent Checkboxes */}
                                        <div className="space-y-4">
                                            <div className="flex items-start space-x-3">
                                                <input
                                                    type="checkbox"
                                                    name="declaration"
                                                    checked={form.declaration}
                                                    onChange={handleChange}
                                                    className="mt-1 w-4 h-4 text-primary-1 bg-neutrals-8 border-neutrals-6 rounded focus:ring-primary-1 focus:ring-2"
                                                />
                                                <label
                                                    className="text-sm text-neutrals-3 leading-relaxed"
                                                    style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                                >
                                                    I declare that the information I have provided is accurate, complete, and true. I understand that providing false information may result in the rejection of my application and/or removal from the platform.
                                                </label>
                                            </div>

                                            <div className="flex items-start space-x-3">
                                                <input
                                                    type="checkbox"
                                                    name="consent"
                                                    checked={form.consent}
                                                    onChange={handleChange}
                                                    className="mt-1 w-4 h-4 text-primary-1 bg-neutrals-8 border-neutrals-6 rounded focus:ring-primary-1 focus:ring-2"
                                                />
                                                <label
                                                    className="text-sm text-neutrals-3 leading-relaxed"
                                                    style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                                >
                                                    I consent to Trippy collecting and processing my personal data for verification purposes in accordance with our Privacy Policy.
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-neutrals-6">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-3 text-neutrals-4 font-medium rounded-lg hover:bg-neutrals-7 transition-colors duration-200"
                                    style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                >
                                    Back
                                </button>

                                {currentStep < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-8 py-3 bg-primary-1 text-white font-medium rounded-lg hover:bg-primary-1/90 transition-all duration-200 transform hover:scale-105"
                                        style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={submitting || !form.declaration || !form.consent}
                                        className="px-8 py-3 bg-primary-1 text-white font-medium rounded-lg hover:bg-primary-1/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                                        style={{ fontFamily: 'var(--font-family-dm-sans)' }}
                                    >
                                        {submitting ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </span>
                                        ) : 'Submit Application'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-neutrals-4">
                            Need help? Contact our support team at{' '}
                            <a href="mailto:support@trippy.com" className="text-primary-1 hover:underline">
                                support@trippy.com
                            </a>
                        </p>
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}