import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

// Placeholder image for background
const backgroundImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"

const ForgotPasswordPage = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    // Clear messages when component mounts
    useEffect(() => {
        setMessage('')
        setError('')
        setIsSuccess(false)
    }, [])

    const handleInputChange = (e) => {
        setEmail(e.target.value)
        
        // Clear messages when user starts typing
        if (message || error) {
            setMessage('')
            setError('')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        setError('')
        setMessage('')
        
        // Validate email
        if (!email) {
            setError('Please enter your email address')
            return
        }
        
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address')
            return
        }
        
        setIsLoading(true)
        
        try {
            const result = await authService.forgotPassword(email)
            
            if (result.success) {
                setIsSuccess(true)
                setMessage('Password reset instructions have been sent to your email address.')
            } else {
                setError(result.error || 'Failed to send reset instructions')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutrals-8 lg:flex">
            {/* Left Section - Image (Desktop only) */}
            <div className="hidden lg:block lg:w-[448px] relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                {/* Logo on image */}
                <div className="relative z-10 p-10">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-primary-1 rounded-full flex items-center justify-center">
                            <span className="text-neutrals-8 font-bold text-lg">T</span>
                        </div>
                        <span className="font-poppins font-semibold text-neutrals-8 text-[27px]">Trippy</span>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-3 h-3 bg-primary-3 rounded transform rotate-45"></div>
                <div className="absolute top-40 right-32 w-4 h-4 bg-primary-1 rounded transform rotate-45"></div>
                <div className="absolute top-60 right-24 w-2 h-2 bg-primary-3 rounded transform rotate-45"></div>
                <div className="absolute bottom-40 right-16 w-5 h-5 bg-primary-2 rounded transform rotate-45"></div>
            </div>

            {/* Right Section - Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-0">
                <div className="w-full max-w-[352px]">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <div className="w-9 h-9 bg-primary-1 rounded-full flex items-center justify-center mr-2">
                            <span className="text-neutrals-8 font-bold text-lg">T</span>
                        </div>
                        <span className="font-poppins font-semibold text-neutrals-2 text-[27px]">Trippy</span>
                    </div>

                    {/* Logo Icon (Desktop) */}
                    <div className="hidden lg:flex justify-center mb-8">
                        <div className="w-20 h-20 bg-primary-1 rounded-full flex items-center justify-center">
                            <span className="text-neutrals-8 font-bold text-3xl">T</span>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                            Forgot Password?
                        </h1>
                        <p className="font-poppins text-base text-neutrals-4">
                            No worries! Enter your email and we'll send you reset instructions.
                        </p>
                    </div>

                    {/* Success Message */}
                    {isSuccess && message && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-600 font-poppins text-sm">{message}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 font-poppins text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                className="w-full h-12 px-6 py-2 border-2 border-neutrals-6 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:border-primary-1 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-sm px-4 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-neutrals-8 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Send Reset Instructions'
                                )}
                            </button>
                        </div>

                        {/* Back to Sign In Link */}
                        <div className="text-center pt-4">
                            <p className="font-poppins text-xs text-neutrals-3">
                                Remember your password?{' '}
                                <Link
                                    to="/signin"
                                    className="font-poppins font-semibold text-primary-1 hover:text-primary-1/80 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>

                    {/* Decorative elements for mobile */}
                    <div className="lg:hidden absolute top-10 right-10 w-2 h-2 bg-primary-3 rounded transform rotate-45"></div>
                    <div className="lg:hidden absolute top-20 right-16 w-3 h-3 bg-primary-1 rounded transform rotate-45"></div>
                </div>

                {/* Decorative elements for desktop */}
                <div className="hidden lg:block absolute top-20 right-32 w-2 h-2 bg-primary-4 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute top-32 right-20 w-4 h-4 bg-primary-1 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute top-52 right-28 w-2 h-2 bg-primary-3 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute bottom-40 left-1/2 w-5 h-5 bg-primary-2 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute top-40 left-1/3 w-3 h-3 bg-primary-4 rounded transform rotate-45 opacity-50"></div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
