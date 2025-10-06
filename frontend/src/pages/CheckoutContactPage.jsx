import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../contexts/CheckoutContext';
import { checkoutService, validateContactInfo, createBookingRequest } from '../services/checkoutService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FormField from '../components/create-experience/FormField';
import CheckoutProgressSteps from '../components/checkout/CheckoutProgressSteps';
import OrderSummary from '../components/checkout/OrderSummary';

export default function CheckoutContactPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const {
    contactInfo,
    updateContactField,
    experienceData,
    scheduleData,
    numberOfParticipants,
    setParticipants,
    pricing,
    loading,
    error,
    setLoading,
    setError,
    clearError,
    setExperienceData,
    setScheduleData,
    setBooking,
    updateValidation
  } = useCheckout();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const countries = [
    'Singapore (+65)',
    'Malaysia (+60)',
    'United States (+1)',
    'United Kingdom (+44)',
    'Australia (+61)'
  ];

  // Initialize experience data from URL params and fetch if needed
  useEffect(() => {
    const experienceId = searchParams.get('experienceId');
    const scheduleId = searchParams.get('scheduleId');
    const participants = searchParams.get('participants');

    if (participants) {
      setParticipants(parseInt(participants));
    }

    // Fetch experience and schedule data if not already in context
    if (experienceId && scheduleId && (!experienceData || !scheduleData)) {
      fetchExperienceAndScheduleData(experienceId, scheduleId);
    }
  }, [searchParams, experienceData, scheduleData]);

  // Fetch experience and schedule data from backend
  const fetchExperienceAndScheduleData = async (experienceId, scheduleId) => {
    setLoading(true);
    clearError();

    try {
      // Fetch both experience and schedule data in parallel
      const [experienceResult, scheduleResult] = await Promise.all([
        checkoutService.getExperienceById(experienceId),
        checkoutService.getScheduleById(scheduleId)
      ]);

      if (!experienceResult.success) {
        setError(`Failed to load experience: ${experienceResult.error}`);
        return;
      }

      if (!scheduleResult.success) {
        setError(`Failed to load schedule: ${scheduleResult.error}`);
        return;
      }

      // Store the data in checkout context
      setExperienceData(experienceResult.data);
      setScheduleData(scheduleResult.data);

    } catch (error) {
      console.error('Error fetching experience/schedule data:', error);
      setError('Failed to load booking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-populate contact info from authenticated user
  useEffect(() => {
    if (user && !contactInfo.firstName) {
      updateContactField('firstName', user.firstName || '');
      updateContactField('lastName', user.lastName || '');
      updateContactField('email', user.email || '');
      // Phone is not available in user profile, user needs to enter it
    }
  }, [user, contactInfo.firstName]);

  // Validate contact info in real-time
  useEffect(() => {
    const validation = validateContactInfo(contactInfo);
    setValidationErrors(validation.errors);
    updateValidation('contactValid', validation.isValid);
  }, [contactInfo]);

  const handleInputChange = (field, value) => {
    updateContactField(field, value);
    // Clear specific field error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCountrySelect = (country) => {
    // Extract country code for phone validation
    updateContactField('country', country);
    setDropdownOpen(false);
  };

  const handleNext = async () => {
    try {
      // Clear any existing errors
      clearError();
      setIsValidating(true);

      // Validate contact information
      const validation = validateContactInfo(contactInfo);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Please correct the errors below');
        return;
      }

      // Ensure we have experience and pricing data
      if (!experienceData || !scheduleData || !pricing.totalAmount) {
        setError('Missing booking information. Please return to the experience page and try again.');
        return;
      }

      // Create booking request
      const bookingRequest = createBookingRequest({
        experienceScheduleId: scheduleData.scheduleId,
        numberOfParticipants,
        contactFirstName: contactInfo.firstName,
        contactLastName: contactInfo.lastName,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone,
        baseAmount: pricing.baseAmount,
        serviceFee: pricing.serviceFee,
        totalAmount: pricing.totalAmount,
        trippointsDiscount: pricing.trippointsDiscount || 0
      });

      // Validate booking with backend
      setIsValidating(true);
      const validationResult = await checkoutService.validateBooking(bookingRequest);

      if (!validationResult.success) {
        setError(validationResult.error);
        return;
      }

      // Create the booking
      setIsCreatingBooking(true);
      const bookingResult = await checkoutService.createBooking(bookingRequest);

      if (!bookingResult.success) {
        setError(bookingResult.error);
        return;
      }

      // Store booking in context
      setBooking(bookingResult.data);
      updateValidation('bookingValidated', true);

      // Navigate to payment page
      navigate('/checkout/payment');

    } catch (error) {
      setError(`Checkout error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
    } finally {
      setIsValidating(false);
      setIsCreatingBooking(false);
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Show loading state while fetching initial data
  if (loading && (!experienceData || !scheduleData)) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-4 font-poppins">Loading booking information...</p>
        </div>
      </div>
    );
  }

  // Redirect if missing required data
  const experienceId = searchParams.get('experienceId');
  const scheduleId = searchParams.get('scheduleId');
  if (!experienceId || !scheduleId) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Missing Booking Information</h2>
          </div>
          <p className="text-neutrals-4 mb-4">
            Please return to the experience page and select a date to book.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={isAuthenticated}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto py-16 px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-neutrals-1 mb-8">Confirm & Pay</h1>
              <CheckoutProgressSteps currentStep={1} />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column - Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-neutrals-1 mb-6">Contact Information</h2>

                  {/* Error Display */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <FormField
                      label="First Name"
                      value={contactInfo.firstName}
                      onChange={(value) => handleInputChange('firstName', value)}
                      placeholder="Enter your first name"
                      error={validationErrors.firstName}
                    />

                    <FormField
                      label="Last Name"
                      value={contactInfo.lastName}
                      onChange={(value) => handleInputChange('lastName', value)}
                      placeholder="Enter your last name"
                      error={validationErrors.lastName}
                    />

                    <FormField
                      label="Email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(value) => handleInputChange('email', value)}
                      placeholder="Enter your email"
                      error={validationErrors.email}
                    />

                    <div style={{ marginBottom: '24px' }}>
                      <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Country</label>
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors flex items-center justify-between"
                        >
                          <span>{contactInfo.country}</span>
                          <ChevronDown className="w-6 h-6 text-neutrals-4" />
                        </button>
                        {dropdownOpen && (
                          <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
                            {countries.map(country => (
                              <button
                                key={country}
                                onClick={() => handleCountrySelect(country)}
                                className="w-full px-6 py-4 text-left hover:bg-neutrals-7 text-lg font-medium first:rounded-t-xl last:rounded-b-xl transition-colors"
                              >
                                {country}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      label="Phone Number"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      placeholder="Enter your phone number"
                      error={validationErrors.phone}
                    />
                  </div>

                  {/* Continue Button */}
                  <div className="mt-8">
                    <button
                      onClick={handleNext}
                      disabled={loading || isValidating || isCreatingBooking || Object.keys(validationErrors).length > 0}
                      className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isValidating && isCreatingBooking && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {(isValidating  || isCreatingBooking) ? 'Creating Booking...' : 'Go to Payment'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary isMobile={false} />
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={isAuthenticated}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />

        <main className="w-full">
          <div className="py-6 px-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-6">Confirm & Pay</h1>
              <CheckoutProgressSteps currentStep={1} isMobile={true} />
            </div>

            {/* Order Summary */}
            <OrderSummary isMobile={true} />

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-4">
              <h2 className="text-lg font-bold text-neutrals-1 mb-4">Contact Information</h2>

              {/* Error Display - Mobile */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700">{error}</div>
                </div>
              )}

              <div className="space-y-4">
                <FormField
                  label="First Name"
                  value={contactInfo.firstName}
                  onChange={(value) => handleInputChange('firstName', value)}
                  placeholder="Enter your first name"
                  error={validationErrors.firstName}
                  isMobile={true}
                />

                <FormField
                  label="Last Name"
                  value={contactInfo.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  placeholder="Enter your last name"
                  error={validationErrors.lastName}
                  isMobile={true}
                />

                <FormField
                  label="Email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                  error={validationErrors.email}
                  isMobile={true}
                />

                <div style={{ marginBottom: '16px' }}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Country</label>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors flex items-center justify-between"
                    >
                      <span>{contactInfo.country}</span>
                      <ChevronDown className="w-4 h-4 text-neutrals-4" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
                        {countries.map(country => (
                          <button
                            key={country}
                            onClick={() => handleCountrySelect(country)}
                            className="w-full px-4 py-3 text-left hover:bg-neutrals-7 text-sm font-medium first:rounded-t-xl last:rounded-b-xl transition-colors"
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  label="Phone Number"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter your phone number"
                  error={validationErrors.phone}
                  isMobile={true}
                />
              </div>

              {/* Continue Button - Mobile */}
              <div className="mt-6">
                <button
                  onClick={handleNext}
                  disabled={loading || isValidating || isCreatingBooking || Object.keys(validationErrors).length > 0}
                  className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isValidating && isCreatingBooking && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {(isValidating || isCreatingBooking) ? 'Creating Booking...' : 'Go to Payment'}
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}