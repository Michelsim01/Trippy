import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../contexts/CheckoutContext';
import { checkoutService } from '../services/checkoutService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import CheckoutProgressSteps from '../components/checkout/CheckoutProgressSteps';
import OrderSummary from '../components/checkout/OrderSummary';
import StripeCardForm from '../components/checkout/StripeCardForm';

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const {
    experienceData,
    scheduleData,
    booking,
    error,
    loading,
    setError,
    clearError,
    setLoading,
    setTransaction,
  } = useCheckout();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Stripe-specific state
  const [createStripeToken, setCreateStripeToken] = useState(null);
  const [isPaymentValid, setIsPaymentValid] = useState(false);

  // Check if we have required checkout data on mount
  useEffect(() => {
    if (!experienceData || !scheduleData || !booking) {
      setError('Missing checkout information. Please return to the contact page.');
    }
  }, [experienceData, scheduleData, booking, setError]);

  const successfulPaymentNotification = async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        console.log('No user ID available for notification');
        return;
      }
      const notificationPayload = {
        title: 'Booking Confirmed',
        message: `Your payment for ${experienceData?.title} has been processed successfully. Your booking is confirmed. Confirmation Code: ${booking?.confirmationCode}.`,
        userId: userId,
        type: 'BOOKING_CONFIRMATION',
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment notification error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Payment notification sent successfully:', data);
    }
    catch (error) {
      console.error('Error sending payment notification:', error);
    }
  };

  const handlePayment = async () => {
    try {
      clearError();
      setLoading(true);

      // Check if payment form is valid
      if (!isPaymentValid) {
        setError('Please complete your payment information');
        return;
      }

      // Check if we have the token creation function
      if (!createStripeToken) {
        setError('Payment system not ready. Please refresh and try again.');
        return;
      }

      // Check if booking exists and has bookingId
      if (!booking) {
        setError('No booking information found. Please return to the contact page.');
        return;
      }

      if (!booking.bookingId) {
        setError('Invalid booking information. Please return to the contact page.');
        return;
      }

      // Create Stripe token
      const stripeToken = await createStripeToken();

      // Process payment via backend using real Stripe token
      const paymentResult = await checkoutService.processPayment(
        booking.bookingId,
        stripeToken.id
      );

      if (!paymentResult.success) {
        setError(paymentResult.error || 'Payment processing failed');
        return;
      }

      // Store successful transaction
      setTransaction(paymentResult.data);

      await successfulPaymentNotification();

      navigate('/checkout/complete');
    } catch (e) {
      setError(e.message || 'An unexpected error occurred during payment processing');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Use window width to determine if we should show desktop or mobile layout
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Show error state if missing required data
  if (!experienceData || !scheduleData || !booking) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Missing Checkout Information</h2>
          </div>
          <p className="text-neutrals-4 mb-4">
            Please complete the contact information step first.
          </p>
          <button
            onClick={() => navigate('/checkout/contact')}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
          >
            Go to Contact Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {!isMobile ? (
        /* Desktop Layout */
        <div className="flex">
        <div
          className={`transition-all duration-300 ${
            isSidebarOpen ? 'w-[275px]' : 'w-0'
          } overflow-hidden`}
        >
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
              <CheckoutProgressSteps currentStep={2} />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column - Payment Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-8">
                  {/* Error Display */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}

                  {/* Payment Method (single option for now) */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutrals-1 mb-6">Pay with</h2>

                    <div className="flex gap-4 mb-6">
                      <button className="px-6 py-3 rounded-lg font-medium bg-neutrals-1 text-white cursor-default">
                        Credit Card
                      </button>
                    </div>
                  </div>

                  {/* Credit Card Form */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-neutrals-1 mb-6">Credit Card</h3>

                    {/* Card Logos */}
                    <div className="flex gap-4 mb-6">
                      <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div className="w-12 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full opacity-80"></div>
                        <div className="w-6 h-6 bg-yellow-500 rounded-full -ml-3 opacity-80"></div>
                      </div>
                    </div>

                    <StripeCardForm
                      onTokenCreated={setCreateStripeToken}
                      onValidationChange={setIsPaymentValid}
                      loading={loading}
                    />
                  </div>

                  {/* Pay Button */}
                  <div className="mt-8">
                    <button
                      onClick={handlePayment}
                      disabled={loading || !isPaymentValid}
                      className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {loading ? 'Processing Payment...' : 'Pay Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <OrderSummary />
              </div>
            </div>
          </div>

          <Footer />
        </div>
        </div>
      ) : (
        /* Mobile Layout */
        <div className="w-full">
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
              <CheckoutProgressSteps currentStep={2} isMobile={true} />
            </div>

            {/* Order Summary */}
            <OrderSummary isMobile={true} />

            {/* Payment Form */}
            <div className="bg-white rounded-xl p-4">
              {/* Error Display - Mobile */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700">{error}</div>
                </div>
              )}

              {/* Payment Method (single option for now) */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-neutrals-1 mb-4">Pay with</h2>

                <div className="flex gap-3 mb-4">
                  <button className="px-4 py-2 rounded-lg font-medium text-sm bg-neutrals-1 text-white cursor-default">
                    Credit Card
                  </button>
                </div>
              </div>

              {/* Credit Card Form */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-neutrals-1 mb-4">Credit Card</h3>

                {/* Card Logos */}
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full opacity-80"></div>
                    <div className="w-4 h-4 bg-yellow-500 rounded-full -ml-2 opacity-80"></div>
                  </div>
                </div>

                <StripeCardForm
                  onTokenCreated={setCreateStripeToken}
                  onValidationChange={setIsPaymentValid}
                  loading={loading}
                />
              </div>

              {/* Pay Button */}
              <div className="mt-6">
                <button
                  onClick={handlePayment}
                  disabled={loading || !isPaymentValid}
                  className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        </div>
      )}
    </div>
  );
}
