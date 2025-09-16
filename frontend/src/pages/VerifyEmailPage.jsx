import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService'

const VerifyEmailPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [isSuccess, setIsSuccess] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [token, setToken] = useState(null)
    const [verificationAttempted, setVerificationAttempted] = useState(false)

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token')
        if (tokenFromUrl && !verificationAttempted) {
            setToken(tokenFromUrl)
            setVerificationAttempted(true)
            verifyEmail(tokenFromUrl) 
        } else if (!tokenFromUrl) {
            setError('Invalid verification link. No token provided.')
            setIsLoading(false)
        }
    }, [searchParams, verificationAttempted])

    const verifyEmail = async (verificationToken) => {
        try {
            const result = await authService.verifyEmail(verificationToken)

            if (result.success) {
                setIsSuccess(true)
                setMessage(result.data.message || 'Email verified successfully!')
                
                // No localStorage clearing needed since no tokens are stored during registration
            } else {
                setError(result.error || 'Verification failed. Please try again.')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = () => {
        navigate('/signup')
    }


    return (
        <div className="min-h-screen bg-neutrals-8 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isSuccess ? 'bg-green-100' : error ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                        {isLoading ? (
                            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isSuccess ? (
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-2">
                        {isLoading ? 'Verifying Email...' : isSuccess ? 'Email Verified!' : 'Verification Failed'}
                    </h1>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    {/* Status Messages */}
                    {isLoading && (
                        <div className="text-center">
                            <p className="text-neutrals-4 mb-4">
                                Please wait while we verify your email address...
                            </p>
                        </div>
                    )}

                    {isSuccess && (
                        <div className="text-center">
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-700">{message}</p>
                            </div>
                            <p className="text-neutrals-4 mb-4">
                                Please sign in with your verified account to access all features.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center">
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700">{error}</p>
                            </div>
                            <p className="text-neutrals-4 mb-4">
                                This verification link may be invalid or expired.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!isLoading && (
                        <div className="space-y-3">
                            {isSuccess ? (
                                <button
                                    onClick={() => navigate('/signin')}
                                    className="w-full bg-primary-1 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-1/90 transition-colors"
                                >
                                    Sign In to Your Account
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleResendVerification}
                                        className="w-full bg-primary-1 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-1/90 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/signup')}
                                        className="w-full bg-neutrals-6 text-neutrals-2 py-2 px-4 rounded-lg font-medium hover:bg-neutrals-5 transition-colors"
                                    >
                                        Back to Sign Up
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Help Section */}
                {error && (
                    <div className="bg-neutrals-7 rounded-lg p-4">
                        <h3 className="font-semibold text-neutrals-1 mb-2">Common Issues:</h3>
                        <ul className="text-sm text-neutrals-4 space-y-1">
                            <li>• Verification links expire after 24 hours</li>
                            <li>• Make sure you clicked the link from your most recent email</li>
                            <li>• Try requesting a new verification email</li>
                            <li>• Contact support if you continue having issues</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VerifyEmailPage
