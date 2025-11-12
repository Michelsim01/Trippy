import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCheckout } from '../contexts/CheckoutContext'
import { checkoutService } from '../services/checkoutService'
import { cartService } from '../services/cartService'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import CheckoutProgressSteps from '../components/checkout/CheckoutProgressSteps'
import StripeCardForm from '../components/checkout/StripeCardForm'

export default function CheckoutBulkPaymentPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { refreshCart } = useCart()
  const {
    bulkCheckout,
    setBulkBookings,
    loading,
    error,
    setError,
    clearError,
    setLoading
  } = useCheckout()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [createStripeToken, setCreateStripeToken] = useState(null)
  const [isPaymentValid, setIsPaymentValid] = useState(false)
  const [bookings, setBookings] = useState([])

  // Format date and time for display
  const formatDateTime = (startDateTime, endDateTime) => {
    if (!startDateTime || !endDateTime) return "Date TBD"

    try {
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)

      const dateText = start.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })

      const startTime = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      const endTime = end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      return `${dateText} • ${startTime} - ${endTime}`
    } catch (error) {
      return "Date TBD"
    }
  }

  // Fetch bookings on mount (created from contact page)
  useEffect(() => {
    // In a real scenario, bookings would be passed through navigation state
    // or fetched from the backend using the cart item IDs
    // For now, we'll create them on the contact page and store in context
    if (!bulkCheckout.cartItemIds || bulkCheckout.cartItemIds.length === 0) {
      setError('No bookings found. Please return to contact page.')
      return
    }

    // Create bookings if not already created
    if (bulkCheckout.bookings && bulkCheckout.bookings.length > 0) {
      setBookings(bulkCheckout.bookings)
    } else {
      // Bookings should have been created on contact page
      createPendingBookings()
    }
  }, [bulkCheckout.cartItemIds])

  const createPendingBookings = async () => {
    try {
      setLoading(true)
      // This should have been done on contact page
      // If we reach here, redirect back
      setError('Bookings not created. Returning to contact page...')
      setTimeout(() => navigate('/checkout/bulk/contact'), 2000)
    } catch (err) {
      setError('Failed to create bookings')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      clearError()
      setLoading(true)

      if (!isPaymentValid) {
        setError('Please complete your payment information')
        return
      }

      if (!createStripeToken) {
        setError('Payment system not ready. Please refresh and try again.')
        return
      }

      if (!bulkCheckout.cartItemIds || bulkCheckout.cartItemIds.length === 0) {
        setError('No bookings found. Please return to contact page.')
        return
      }

      // Get booking IDs from bulkCheckout
      const bookingIds = bulkCheckout.bookings?.map(b => b.bookingId) || []

      if (bookingIds.length === 0) {
        setError('No booking IDs found. Please return to contact page.')
        return
      }

      // Create Stripe token
      const stripeToken = await createStripeToken()

      // Process bulk payment via backend
      const paymentResult = await checkoutService.processBulkPayment(bookingIds, stripeToken.id)

      if (!paymentResult.success) {
        setError(paymentResult.error || 'Payment processing failed')
        return
      }

      // Store confirmed bookings
      setBulkBookings(paymentResult.data)

      // Remove cart items after successful payment
      if (user?.id && bulkCheckout.cartItemIds.length > 0) {
        await cartService.removeMultipleCartItems(bulkCheckout.cartItemIds, user.id)
        await refreshCart()
      }

      // Send notifications for all bookings
      await sendBulkPaymentNotifications(paymentResult.data)

      // Navigate to complete page
      navigate('/checkout/bulk/complete')

    } catch (e) {
      setError(e.message || 'An unexpected error occurred during payment processing')
    } finally {
      setLoading(false)
    }
  }

  const sendBulkPaymentNotifications = async (confirmedBookings) => {
    try {
      const userId = user?.id
      if (!userId) {
        console.log('No user ID available for notification')
        return
      }

      const token = localStorage.getItem('token')
      const bookingCount = confirmedBookings.length

      const notificationPayload = {
        title: 'Bookings Confirmed',
        message: `Your payment for ${bookingCount} experience${bookingCount > 1 ? 's' : ''} has been processed successfully. All bookings are confirmed.`,
        userId: userId,
        type: 'BOOKING_CONFIRMATION',
      }

      const response = await fetch(`http://localhost:8080/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notificationPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Bulk payment notification error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log('Bulk payment notification sent successfully:', data)
    } catch (error) {
      console.error('Error sending bulk payment notification:', error)
    }
  }

  const toggleSidebar = () => setIsSidebarOpen((v) => !v)
  const closeSidebar = () => setIsSidebarOpen(false)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Show error if missing bookings
  if (!bulkCheckout.cartItems || bulkCheckout.cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-neutrals-2 mb-2">Missing Checkout Information</h2>
          <p className="text-neutrals-4 mb-4">Please complete the contact information step first.</p>
          <button
            onClick={() => navigate('/checkout/bulk/contact')}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90"
          >
            Go to Contact Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {!isMobile ? (
        /* Desktop Layout */
        <div className="flex">
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
                  <div className="bg-white rounded-xl p-6 border border-neutrals-6 sticky top-6">
                    <h3 className="font-bold text-neutrals-1 mb-4 text-xl">Order Summary</h3>

                    {/* Items List */}
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {bulkCheckout.cartItems.map((item) => (
                        <div key={item.cartItemId} className="p-3 bg-neutrals-8 rounded-lg">
                          <div className="flex gap-3 mb-2">
                            <img
                              src={item.coverPhotoUrl || '/placeholder.jpg'}
                              alt={item.experienceTitle}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-neutrals-1 truncate">{item.experienceTitle}</h4>
                              <p className="text-xs text-neutrals-3">{item.numberOfParticipants} guest{item.numberOfParticipants > 1 ? 's' : ''}</p>
                              <p className="text-sm font-medium text-neutrals-1 mt-1">
                                ${(item.currentPrice * item.numberOfParticipants).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-neutrals-4" />
                            <span className="text-xs text-neutrals-3">
                              {formatDateTime(item.startDateTime, item.endDateTime)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr className="border-neutrals-6 mb-4" />

                    {/* Pricing Breakdown */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-neutrals-3 text-base">
                          Subtotal ({bulkCheckout.cartItems.length} item{bulkCheckout.cartItems.length > 1 ? 's' : ''})
                        </span>
                        <span className="font-medium text-neutrals-1 text-base">
                          ${bulkCheckout.pricing.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutrals-3 text-base">Service fee</span>
                        <span className="font-medium text-neutrals-1 text-base">
                          ${bulkCheckout.pricing.serviceFee.toFixed(2)}
                        </span>
                      </div>
                      {bulkCheckout.pricing.trippointsDiscount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 text-base">Trippoints discount</span>
                          <span className="font-medium text-green-600 text-base">
                            -${bulkCheckout.pricing.trippointsDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <hr className="border-neutrals-6 mb-4" />

                    {/* Total */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-neutrals-1 text-lg">Total</span>
                      <span className="font-bold text-neutrals-1 text-2xl">
                        ${bulkCheckout.pricing.grandTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Promo Code Input */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Enter promo, credit or gift code"
                        className="w-full px-3 py-2 border border-neutrals-5 rounded-lg focus:outline-none focus:border-primary-1 transition-colors text-base"
                      />
                    </div>

                    {/* Free Cancellation */}
                    <div className="flex items-start gap-2">
                      <div className="text-neutrals-4 mt-0.5 w-5 h-5">ⓘ</div>
                      <span className="text-neutrals-4 text-sm">
                        Free cancellation until 24 hours before experience start
                      </span>
                    </div>
                  </div>
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

              {/* Mobile Order Summary */}
              <div className="bg-white rounded-xl p-4 mb-6 border border-neutrals-6">
                <h3 className="font-bold text-neutrals-1 mb-4 text-lg">Order Summary</h3>
                <div className="space-y-2 mb-3">
                  {bulkCheckout.cartItems.map((item) => (
                    <div key={item.cartItemId} className="p-2 bg-neutrals-8 rounded">
                      <div className="flex gap-2 mb-2">
                        <img src={item.coverPhotoUrl || '/placeholder.jpg'} alt="" className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutrals-1 truncate">{item.experienceTitle}</p>
                          <p className="text-xs text-neutrals-3">{item.numberOfParticipants} x ${item.currentPrice}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-neutrals-4" />
                        <span className="text-xs text-neutrals-3">
                          {formatDateTime(item.startDateTime, item.endDateTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xl font-bold text-neutrals-1 mt-4">
                  Total: ${bulkCheckout.pricing.grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Mobile Payment Form */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800">{error}</p>
                  </div>
                )}

                <StripeCardForm
                  onTokenCreated={setCreateStripeToken}
                  onValidationChange={setIsPaymentValid}
                />

                <button
                  onClick={handlePayment}
                  disabled={!isPaymentValid || loading}
                  className="w-full mt-6 py-3 bg-primary-1 text-white rounded-full font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay $${bulkCheckout.pricing.grandTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      )}
    </div>
  )
}
