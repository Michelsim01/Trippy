import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'

const EmailVerificationPage = () => {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isResending, setIsResending] = useState(false)
    
    // Get email and message from navigation state (from registration)
    const email = location.state?.email
    const registrationMessage = location.state?.message

    // Check authentication status and email availability
    useEffect(() => {
        // If user is authenticated, redirect to home
        if (isAuthenticated) {
            navigate('/home')
            return
        }
        
        // If no email in state, redirect to signup
        if (!email) {
            navigate('/signup')
            return
        }
    }, [isAuthenticated, navigate, email])

    const handleResendVerification = async () => {
        setIsResending(true)
        setError('')
        setMessage('')

        try {
            const result = await authService.sendVerificationEmail(email)

            if (result.success) {
                setMessage('Verification email sent successfully! Please check your inbox.')
            } else {
                setError(result.error || 'Failed to send verification email')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsResending(false)
        }
    }

    const handleCheckVerification = async () => {
        setIsLoading(true)
        setError('')
        setMessage('')

        try {
            const result = await authService.checkEmailVerification(email)

            if (result.success) {
                if (result.data.emailVerified) {
                    setMessage('Your email is verified! Please sign in to access your account.')
                    
                    // Redirect to sign in after a short delay
                    setTimeout(() => {
                        navigate('/signin')
                    }, 2000)
                } else {
                    setMessage('Your email is not yet verified. Please check your inbox for the verification email.')
                }
            } else {
                setError(result.error || 'Failed to check verification status')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackToSignUp = () => {
        navigate('/signup')
    }

    // Don't render if no email is available
    if (!email) {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen bg-neutrals-8 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-1 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-2">Check Your Email</h1>
                    <p className="text-neutrals-4">
                        {registrationMessage || `We've sent a verification link to ${email}`}
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    {/* Instructions */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-neutrals-1 mb-3">Next Steps:</h2>
                        <ol className="list-decimal list-inside space-y-2 text-neutrals-4">
                            <li>Check your email inbox for a message from Trippy</li>
                            <li>Click the "Verify Email Address" button in the email</li>
                            <li>You'll be redirected to complete verification</li>
                            <li>Sign in with your credentials to access your account</li>
                        </ol>
                    </div>

                    {/* Status Messages */}
                    {message && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm">{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="w-full bg-primary-1 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResending ? 'Sending...' : 'Resend Verification Email'}
                        </button>

                        <button
                            onClick={handleCheckVerification}
                            disabled={isLoading}
                            className="w-full bg-neutrals-6 text-neutrals-2 py-2 px-4 rounded-lg font-medium hover:bg-neutrals-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Checking...' : 'Check Verification Status'}
                        </button>

                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-neutrals-7 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-neutrals-1 mb-2">Need Help?</h3>
                    <ul className="text-sm text-neutrals-4 space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure the email address is correct: <strong>{email}</strong></li>
                        <li>• Verification links expire after 24 hours</li>
                        <li>• Contact support if you continue having issues</li>
                    </ul>
                </div>

                {/* Navigation */}
                <div className="text-center">
                    <button
                        onClick={handleBackToSignUp}
                        className="text-primary-1 hover:text-primary-1/80 transition-colors font-medium bg-transparent border-none cursor-pointer"
                    >
                        ← Back to Sign Up
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EmailVerificationPage
