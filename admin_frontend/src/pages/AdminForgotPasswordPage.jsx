import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: ''
  });

  const { forgotPassword } = useAuth();

  // Clear messages when component mounts
  useEffect(() => {
    setMessage('');
    setFieldErrors({ email: '' });
    setIsSuccess(false);
  }, []);

  const handleInputChange = (e) => {
    setEmail(e.target.value);

    // Clear field-specific error when user starts typing
    if (fieldErrors.email && e.target.value !== '') {
      setFieldErrors({
        ...fieldErrors,
        email: ''
      });
    }

    // Clear message when user starts typing
    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear field errors and messages
    setFieldErrors({ email: '' });
    setMessage('');

    // Validate form
    let hasErrors = false;
    const newFieldErrors = {};

    if (!email) {
      newFieldErrors.email = 'Please enter your email address';
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setIsSuccess(true);
        setMessage('Password reset instructions have been sent to your email address.');
      } else {
        const errorMessage = result.error || 'Failed to send reset instructions';
        // Set email field error for API errors
        setFieldErrors({ email: errorMessage });
      }
    } catch (error) {
      setFieldErrors({ email: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Dark Background with Logo and Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-8">
        <div className="text-center max-w-md">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-64 h-8 mb-8">
            <img src="/Logo.png" alt="Trippy Logo" className="w-64 h-64 object-contain" />
          </div>
          
          {/* Branding Text */}
          <h2 className="text-2xl font-semibold text-slate-300 mb-4">Admin Portal</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Access comprehensive analytics, user management, and content moderation tools
          </p>
        </div>
      </div>

      {/* Right Section - White Background with Forgot Password Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <img src="/Logo.png" alt="Trippy Logo" className="w-20 h-20 object-contain" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Admin Portal</h2>
          </div>

          {/* Back to Login Link */}
          <div className="mb-8">
            <Link 
              to="/admin/login" 
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h3>
            <p className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm">{message}</p>
                <p className="text-green-500 text-xs mt-2">
                  Check your email and follow the instructions to reset your password.
                </p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          {/* Additional Help */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/admin/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-xs text-gray-500">
              © 2024 Trippy Admin Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPasswordPage;
