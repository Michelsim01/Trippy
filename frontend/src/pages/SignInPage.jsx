import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Placeholder image for background
const backgroundImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"

const SignInPage = () => {
    const navigate = useNavigate()
    const { login, isLoading } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        
        // Validate form
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields')
            return
        }
        
        // Call login function from auth context
        const result = await login(formData.email, formData.password)
        
        if (!result.success) {
            setError(result.error || 'Login failed')
        }
        // If successful, the login function will handle navigation
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
                            Sign in
                        </h1>
                        <p className="font-poppins text-base text-neutrals-4">
                            Welcome back to Trippy!
                        </p>
                    </div>

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
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                className="w-full h-12 px-6 py-2 border-2 border-neutrals-6 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:border-primary-1 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                className="w-full h-12 px-6 py-2 pr-12 border-2 border-neutrals-6 rounded-[40px] font-poppins font-medium text-sm text-neutrals-2 placeholder-neutrals-4 focus:border-primary-1 focus:outline-none transition-colors"
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

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <button
                                type="button"
                                className="font-poppins text-sm text-primary-1 hover:text-primary-1/80 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-[120px] bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-sm px-4 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors mx-auto block disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-neutrals-8 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>

                        {/* Sign Up Link */}
                        <div className="text-center pt-4">
                            <p className="font-poppins text-xs text-neutrals-3">
                                Don't have an account?{' '}
                                <Link
                                    to="/signup"
                                    className="font-poppins font-semibold text-primary-1 hover:text-primary-1/80 transition-colors"
                                >
                                    Sign up
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

export default SignInPage
