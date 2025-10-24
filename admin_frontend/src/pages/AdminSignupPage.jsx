import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminSignupPage = () => {
  const [searchParams] = useSearchParams();
  const referralToken = searchParams.get('referral');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralToken: referralToken || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [referralInfo, setReferralInfo] = useState(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Validate referral token on component mount
  useEffect(() => {
    if (referralToken) {
      validateReferralToken();
    } else {
      setError('Invalid admin invitation link. Please contact an existing admin for an invitation.');
    }
  }, [referralToken]);

  const validateReferralToken = async () => {
    setIsValidatingReferral(true);
    try {
      const response = await fetch(`http://localhost:8080/api/public/referrals/validate/${referralToken}`);
      const data = await response.json();
      
      if (data.valid) {
        setReferralInfo(data);
        setFormData(prev => ({ ...prev, email: data.referredEmail }));
      } else {
        setError(data.error || 'Invalid or expired referral token');
      }
    } catch (error) {
      console.error('Error validating referral token:', error);
      setError('Failed to validate referral token. Please try again.');
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.referralToken.trim()) {
      setError('Invalid referral token');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await signup(formData);
    
    if (result.success) {
      if (result.requiresVerification) {
        // Show success modal instead of alert
        setSuccessMessage(result.message);
        setShowSuccessModal(true);
        setError(''); // Clear any previous errors
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
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
            Create your admin account to access comprehensive analytics, and content management tools
          </p>
        </div>
      </div>

      {/* Right Section - White Background with Signup Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <img src="/Logo.png" alt="Trippy Logo" className="w-20 h-20 object-contain" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Admin Portal</h2>
          </div>

          {/* Signup Form */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Accept Admin Invitation</h3>
              <p className="text-gray-600">Complete your admin account setup</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                  {error.includes('already exists') && (
                    <p className="text-red-500 text-xs mt-1">
                      Already have an account? <Link to="/admin/login" className="underline hover:text-red-700">Sign in here</Link>
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Referral Information */}
              {referralInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Valid Admin Invitation</h3>
                      <p className="text-sm text-green-700 mt-1">
                        You've been invited by <strong>{referralInfo.referrerName}</strong> to join as an administrator.
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This invitation expires on {new Date(referralInfo.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state for referral validation */}
              {isValidatingReferral && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5 mr-3"></div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">Validating Invitation</h3>
                      <p className="text-sm text-blue-700 mt-1">Please wait while we verify your admin invitation...</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isValidatingReferral || !referralInfo}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Admin Account'}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an admin account?{' '}
                <Link to="/admin/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              © 2024 Trippy Admin Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/admin/login');
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate('/admin/login');
        }}
        title="Registration Successful!"
        message={successMessage}
        confirmText="OK"
        cancelText=""
        type="success"
        showTextArea={false}
      />
    </div>
  );
};

export default AdminSignupPage;
