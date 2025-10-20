import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    password: '',
    confirmPassword: '',
    general: ''
  });

  const { resetPassword, validateResetToken } = useAuth();

  // Get token from URL parameters
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Validate token on component mount
      validateToken(tokenFromUrl);
    } else {
      setFieldErrors({
        password: '',
        confirmPassword: '',
        general: 'Invalid reset link. Please request a new password reset.'
      });
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate) => {
    try {
      const result = await validateResetToken(tokenToValidate);
      if (!result.success) {
        setFieldErrors({
          password: '',
          confirmPassword: '',
          general: 'Invalid or expired reset link. Please request a new password reset.'
        });
      }
    } catch (error) {
      setFieldErrors({
        password: '',
        confirmPassword: '',
        general: 'Invalid or expired reset link. Please request a new password reset.'
      });
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'password') {
      setPassword(value);
      if (fieldErrors.password) {
        setFieldErrors({ ...fieldErrors, password: '' });
      }
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value);
      if (fieldErrors.confirmPassword) {
        setFieldErrors({ ...fieldErrors, confirmPassword: '' });
      }
    }

    // Clear general error when user starts typing
    if (fieldErrors.general) {
      setFieldErrors({ ...fieldErrors, general: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear field errors and messages
    setFieldErrors({ password: '', confirmPassword: '', general: '' });
    setMessage('');

    // Validate form
    let hasErrors = false;
    const newFieldErrors = { password: '', confirmPassword: '', general: '' };

    if (!password) {
      newFieldErrors.password = 'Please enter a new password';
      hasErrors = true;
    } else if (password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters long';
      hasErrors = true;
    }

    if (!confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);

      if (result.success) {
        setIsSuccess(true);
        setMessage('Password has been reset successfully! You can now sign in with your new password.');

        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      } else {
        const errorMessage = result.error || 'Failed to reset password';
        // Set general error for API errors
        setFieldErrors({ password: '', confirmPassword: '', general: errorMessage });
      }
    } catch (error) {
      setFieldErrors({ password: '', confirmPassword: '', general: 'Network error. Please try again.' });
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

      {/* Right Section - White Background with Reset Password Form */}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm">{message}</p>
                <p className="text-green-500 text-xs mt-2">
                  Redirecting to sign in page...
                </p>
              </div>
            )}

            {/* General Error */}
            {fieldErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{fieldErrors.general}</p>
                {fieldErrors.general.includes('Invalid') && (
                  <p className="text-red-500 text-xs mt-1">
                    <Link to="/admin/forgot-password" className="underline hover:text-red-700">
                      Request a new password reset
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !token || fieldErrors.general.includes('Invalid')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
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

export default AdminResetPasswordPage;
