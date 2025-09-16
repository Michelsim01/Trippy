import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Placeholder image for background
const backgroundImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"

const SignUpPage = () => {
    const navigate = useNavigate()
    const { register } = useAuth()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)
    const [displayError, setDisplayError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    // Clear any previous signup errors when component mounts
    useEffect(() => {
        localStorage.removeItem('signupError')
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
        
        // Clear field-specific error when user starts typing
        if (fieldErrors[name] && value !== '') {
            setFieldErrors({
                ...fieldErrors,
                [name]: ''
            })
        }
        
        // Clear global error when user starts typing
        if ((error || displayError) && value !== '') {
            setError('')
            setDisplayError('')
            localStorage.removeItem('signupError')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Clear previous success message and errors
        setShowSuccessMessage(false)
        setError('')
        setDisplayError('')
        setFieldErrors({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        })
        
        let hasErrors = false
        const newFieldErrors = {}
        
        // Validate required fields
        if (!formData.firstName.trim()) {
            newFieldErrors.firstName = 'First name is required'
            hasErrors = true
        }
        
        if (!formData.lastName.trim()) {
            newFieldErrors.lastName = 'Last name is required'
            hasErrors = true
        }
        
        if (!formData.email.trim()) {
            newFieldErrors.email = 'Email is required'
            hasErrors = true
        } else {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                newFieldErrors.email = 'Please enter a valid email address'
                hasErrors = true
            }
        }
        
        if (!formData.password) {
            newFieldErrors.password = 'Password is required'
            hasErrors = true
        } else {
            // Password length validation
            if (formData.password.length < 8) {
                newFieldErrors.password = 'Password must be at least 8 characters long'
                hasErrors = true
            } else {
                // Password complexity validation
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
                if (!passwordRegex.test(formData.password)) {
                    newFieldErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
                    hasErrors = true
                }
            }
        }
        
        if (!formData.confirmPassword) {
            newFieldErrors.confirmPassword = 'Please confirm your password'
            hasErrors = true
        } else if (formData.password !== formData.confirmPassword) {
            newFieldErrors.confirmPassword = 'Passwords do not match'
            hasErrors = true
        }
        
        // If there are validation errors, set them and return
        if (hasErrors) {
            setFieldErrors(newFieldErrors)
            return
        }
        
        // Set local loading state for button
        setIsSubmitting(true)
        
        try {
            // Call register function from auth context
            const result = await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password
            })
            
            if (result.success) {
                setError('') // Clear any previous errors
                // Don't show success message since user will be navigated away immediately
                // The register function will handle navigation to email verification page
            } else {
                const errorMessage = result.error || 'Registration failed'
                setError(errorMessage)
                setDisplayError(errorMessage)
                // Also store in localStorage as backup
                localStorage.setItem('signupError', errorMessage)
            }
        } catch (error) {
            const errorMessage = 'Registration failed. Please try again.'
            setError(errorMessage)
            setDisplayError(errorMessage)
            localStorage.setItem('signupError', errorMessage)
        } finally {
            setIsSubmitting(false)
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
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-primary-1 rounded-full flex items-center justify-center">
                            <span className="text-neutrals-8 font-bold text-lg">T</span>
                        </div>
                        <span className="font-poppins font-semibold text-neutrals-8 text-[27px]">Trippy</span>
                    </Link>
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
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <div className="w-9 h-9 bg-primary-1 rounded-full flex items-center justify-center mr-2">
                                <span className="text-neutrals-8 font-bold text-lg">T</span>
                            </div>
                            <span className="font-poppins font-semibold text-neutrals-2 text-[27px]">Trippy</span>
                        </Link>
                    </div>

                    {/* Logo Icon (Desktop) */}
                    <div className="hidden lg:flex justify-center mb-8">
                        <Link to="/" className="hover:opacity-80 transition-opacity">
                            <div className="w-20 h-20 bg-primary-1 rounded-full flex items-center justify-center">
                                <span className="text-neutrals-8 font-bold text-3xl">T</span>
                            </div>
                        </Link>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                            Sign up
                        </h1>
                        <p className="font-poppins text-base text-neutrals-4">
                            Create your Trippy account now!
                        </p>
                    </div>

                    {/* Success Message */}
                    {showSuccessMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <div>
                                    <p className="text-green-800 font-poppins text-sm font-medium">
                                        Registration successful!
                                    </p>
                                    <p className="text-green-700 font-poppins text-xs mt-1">
                                        Please check your email for verification instructions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Global Error Message (for backend errors only) */}
                    {(displayError || localStorage.getItem('signupError')) && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 font-poppins text-sm">{displayError || localStorage.getItem('signupError')}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        {/* First Name Input */}
                        <div className="relative">
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="First Name"
                                className={`w-full h-12 px-6 py-2 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                    fieldErrors.firstName 
                                        ? 'border-red-500 focus:border-red-500' 
                                        : 'border-neutrals-6 focus:border-primary-1'
                                }`}
                            />
                            <div className="h-5 mt-1">
                                {fieldErrors.firstName && (
                                    <p className="text-red-500 text-xs font-poppins">{fieldErrors.firstName}</p>
                                )}
                            </div>
                        </div>

                        {/* Last Name Input */}
                        <div className="relative">
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Last Name"
                                className={`w-full h-12 px-6 py-2 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                    fieldErrors.lastName 
                                        ? 'border-red-500 focus:border-red-500' 
                                        : 'border-neutrals-6 focus:border-primary-1'
                                }`}
                            />
                            <div className="h-5 mt-1">
                                {fieldErrors.lastName && (
                                    <p className="text-red-500 text-xs font-poppins">{fieldErrors.lastName}</p>
                                )}
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="relative">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                className={`w-full h-12 px-6 py-2 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                    fieldErrors.email 
                                        ? 'border-red-500 focus:border-red-500' 
                                        : 'border-neutrals-6 focus:border-primary-1'
                                }`}
                            />
                            <div className="h-5 mt-1">
                                {fieldErrors.email && (
                                    <p className="text-red-500 text-xs font-poppins">{fieldErrors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Password"
                                    className={`w-full h-12 px-6 py-2 pr-12 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                        fieldErrors.password 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-neutrals-6 focus:border-primary-1'
                                    }`}
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
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm Password"
                                    className={`w-full h-12 px-6 py-2 pr-12 border-2 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:outline-none transition-colors ${
                                        fieldErrors.confirmPassword 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-neutrals-6 focus:border-primary-1'
                                    }`}
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

                        {/* Sign Up Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-sm px-4 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-neutrals-8 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Sign up'
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center pt-4">
                            <p className="font-poppins text-xs text-neutrals-3">
                                Already have an account?{' '}
                                <Link
                                    to="/signin"
                                    className="font-poppins font-semibold text-primary-1 hover:text-primary-1/80 transition-colors"
                                >
                                    Login
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

export default SignUpPage
