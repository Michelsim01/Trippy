import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";
import { kycService } from "../services/kycService";

export default function KycSubmittedPage() {
    const navigate = useNavigate();
    const { user: authUser, isAuthenticated } = useAuth();
    const { user } = useUser();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [kycDetails, setKycDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currentUserId = authUser?.id || user?.id;

    useEffect(() => {
        const fetchKycDetails = async () => {
            if (!currentUserId) {
                setError('User ID not available');
                setLoading(false);
                return;
            }

            try {
                const details = await kycService.getKycStatus(currentUserId);
                setKycDetails(details);
            } catch (err) {
                console.error('Failed to fetch KYC details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchKycDetails();
    }, [currentUserId]);

    const handleRetrySubmission = () => {
        navigate('/kyc-verification');
    };

    const handleContactSupport = () => {
        window.location.href = 'mailto:support@trippy.com?subject=KYC Verification Assistance&body=Hello, I need assistance with my KYC verification. My user ID is: ' + currentUserId;
    };

    const handleCreateExperience = () => {
        navigate('/create-experience');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-1 border-t-transparent mx-auto mb-4"></div>
                    <span className="text-neutrals-4">Loading KYC status...</span>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (error) {
            return (
                <div className="bg-white shadow-lg rounded-xl p-10 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Status</h2>
                    <p className="text-neutrals-2 mb-6">{error}</p>
                    <button
                        onClick={handleContactSupport}
                        className="bg-primary-1 text-white font-bold py-3 px-8 rounded-xl text-lg shadow hover:bg-primary-1/90 transition-colors"
                    >
                        Contact Support
                    </button>
                </div>
            );
        }

        if (kycDetails?.kycStatus === 'APPROVED') {
            return (
                <div className="bg-white shadow-lg rounded-xl p-10 max-w-lg w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Verification Approved!</h2>
                    <p className="text-neutrals-2 mb-6">
                        Congratulations! Your identity has been verified. You can now create and list experiences as a guide.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleCreateExperience}
                            className="bg-primary-1 text-white font-bold py-3 px-6 rounded-xl text-lg shadow hover:bg-primary-1/90 transition-colors"
                        >
                            Create Experience
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="bg-neutrals-6 text-neutrals-2 font-bold py-3 px-6 rounded-xl text-lg shadow hover:bg-neutrals-5 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            );
        }

        if (kycDetails?.kycStatus === 'REJECTED') {
            return (
                <div className="bg-white shadow-lg rounded-xl p-10 max-w-2xl w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Rejected</h2>
                        <p className="text-neutrals-2 mb-6">
                            Your identity verification needs attention. Please review the details below and resubmit.
                        </p>
                    </div>

                    {/* Rejection Details */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-red-800 mb-3">Rejection Reason</h3>
                        <p className="text-red-700 mb-4">
                            {kycDetails.rejectionReason || 'No specific reason provided. Please contact support for more details.'}
                        </p>
                        {kycDetails.reviewedAt && (
                            <p className="text-sm text-red-600">
                                Reviewed on: {new Date(kycDetails.reviewedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    {/* Common Issues Help */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-blue-800 mb-3">Common Issues & Solutions</h3>
                        <ul className="text-blue-700 text-sm space-y-2">
                            <li>• <strong>Document unclear:</strong> Ensure good lighting and all text is readable</li>
                            <li>• <strong>Wrong document type:</strong> Use government-issued ID (passport, NRIC, etc.)</li>
                            <li>• <strong>Document expired:</strong> Upload a current, valid document</li>
                            <li>• <strong>Information mismatch:</strong> Ensure form details match your document exactly</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleRetrySubmission}
                            className="flex-1 bg-primary-1 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-1/90 transition-all"
                        >
                            Submit New Documents
                        </button>
                        <button
                            onClick={handleContactSupport}
                            className="flex-1 bg-neutrals-6 text-neutrals-2 font-bold py-3 px-6 rounded-lg hover:bg-neutrals-5 transition-colors"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            );
        }

        // Default: PENDING status
        return (
            <div className="bg-white shadow-lg rounded-xl p-10 max-w-lg w-full text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">Application Under Review</h2>
                <p className="text-neutrals-2 mb-6">
                    Thank you for verifying your identity! Our team will review your application and notify you once you're approved to create experiences.
                </p>
                {kycDetails?.submittedAt && (
                    <p className="text-sm text-neutrals-4 mb-6">
                        Submitted on: {new Date(kycDetails.submittedAt).toLocaleDateString()}
                    </p>
                )}
                <button
                    onClick={() => navigate('/home')}
                    className="bg-primary-1 text-white font-bold py-3 px-8 rounded-xl text-lg shadow hover:bg-primary-1/90 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
            <Navbar
                isAuthenticated={isAuthenticated}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setSidebarOpen(true)}
            />
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                variant="desktop"
                isAuthenticated={isAuthenticated}
            />
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                {renderContent()}
            </main>
        </div>
    );
}