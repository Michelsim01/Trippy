import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService'

// Placeholder image for background
const backgroundImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"

const ResetPasswordPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [token, setToken] = useState('')
    const [fieldErrors, setFieldErrors] = useState({
        password: '',
        confirmPassword: '',
        general: ''
    })

    // Get token from URL parameters
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token') 
        if (tokenFromUrl) {
            setToken(tokenFromUrl)
            // Validate token on component mount
            validateToken(tokenFromUrl)
        } else {
            setFieldErrors({
                password: '',
                confirmPassword: '',
                general: 'Invalid reset link. Please request a new password reset.'
            })
        }
    }, [searchParams])

    const validateToken = async (tokenToValidate) => {
        try {
            const result = await authService.validateResetToken(tokenToValidate)
            
            if (!result.success) {
                setFieldErrors({
                    password: '',
                    confirmPassword: '',
                    general: 'Invalid or expired reset link. Please request a new password reset.'
                })
            }
        } catch (error) {
            setFieldErrors({
                password: '',
                confirmPassword: '',
                general: 'Network error. Please try again.'
            })
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        
        if (name === 'password') {
            setPassword(value)
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value)
        }
        
        // Clear field-specific error when user starts typing
        if (fieldErrors[name] && value !== '') {
            setFieldErrors({
                ...fieldErrors,
                [name]: ''
            })
        }
        
        // Clear general error and message when user starts typing
        if (message || fieldErrors.general) {
            setMessage('')
            setFieldErrors({
                ...fieldErrors,
                general: ''
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Clear field errors and messages
        setFieldErrors({ password: '', confirmPassword: '', general: '' })
        setMessage('')
        
        // Validate form
        let hasErrors = false
        const newFieldErrors = {}
        
        if (!password) {
            newFieldErrors.password = 'Password is required'
            hasErrors = true
        } else if (password.length < 8) {
            newFieldErrors.password = 'Password must be at least 8 characters long'
            hasErrors = true
        }
        
        if (!confirmPassword) {
            newFieldErrors.confirmPassword = 'Please confirm your password'
            hasErrors = true
        } else if (password && confirmPassword && password !== confirmPassword) {
            newFieldErrors.confirmPassword = 'Passwords do not match'
            hasErrors = true
        }
        
        if (!token) {
            newFieldErrors.general = 'Invalid reset link. Please request a new password reset.'
            hasErrors = true
        }
        
        if (hasErrors) {
            setFieldErrors(newFieldErrors)
            return
        }
        
        setIsLoading(true)
        
        try {
            const result = await authService.resetPassword(token, password)
            
            if (result.success) {
                setIsSuccess(true)
                setMessage('Password has been reset successfully! You can now sign in with your new password.')
                
                // Redirect to sign in page after 3 seconds
                setTimeout(() => {
                    navigate('/signin')
                }, 3000)
            } else {
                const errorMessage = result.error || 'Failed to reset password'
                // Set general error for API errors
                setFieldErrors({ password: '', confirmPassword: '', general: errorMessage })
            }
        } catch (error) {
            setFieldErrors({ password: '', confirmPassword: '', general: 'Network error. Please try again.' })
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
                        <div className="w-40 h-15 flex items-center justify-center bg-white rounded-lg shadow-lg">
                            <img src="/Logo.png" alt="Logo" className="w-50 h-50 object-contain" />
                        </div>
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
                        <div className="w-40 h-15 flex items-center justify-center">
                            <img src="/Logo.png" alt="Logo" className="w-50 h-50 object-contain" />
                        </div>
                    </div>

                    {/* Logo Icon (Desktop) */}
                    <div className="hidden lg:flex justify-center mb-8">
                        <div className="w-40 h-15 flex items-center justify-center">
                            <img src="/Logo.png" alt="Logo" className="w-50 h-50 object-contain" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                            Reset Password
                        </h1>
                        <p className="font-poppins text-base text-neutrals-4">
                            Enter your new password below.
                        </p>
                    </div>

                    {/* Success Message */}
                    {isSuccess && message && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-600 font-poppins text-sm">{message}</p>
                        </div>
                    )}

                    {/* General Error Message */}
                    {fieldErrors.general && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 font-poppins text-sm">{fieldErrors.general}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password Input */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={handleInputChange}
                                    placeholder="New password"
                                    className={`w-full h-12 px-6 py-2 pr-12 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                        fieldErrors.password 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-neutrals-6 focus:border-primary-1'
                                    }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-neutrals-7 transition-colors"
                                >
                                    <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                            <div className="h-5 mt-1">
                                {fieldErrors.password && (
                                    <p className="text-red-500 text-xs font-poppins">{fieldErrors.password}</p>
                                )}
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm new password"
                                    className={`w-full h-12 px-6 py-2 pr-12 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                        fieldErrors.confirmPassword 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-neutrals-6 focus:border-primary-1'
                                    }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-neutrals-7 transition-colors"
                                >
                                    <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showConfirmPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                            <div className="h-5 mt-1">
                                {fieldErrors.confirmPassword && (
                                    <p className="text-red-500 text-xs font-poppins">{fieldErrors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="w-full bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-sm px-4 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-neutrals-8 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Resetting...
                                    </div>
                                ) : (
                                    'Reset Password'
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

export default ResetPasswordPage
