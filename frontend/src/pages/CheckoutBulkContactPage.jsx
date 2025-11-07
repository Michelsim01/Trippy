import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ChevronDown, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCheckout } from '../contexts/CheckoutContext'
import { useTripPoints } from '../contexts/TripPointsContext'
import { checkoutService, validateContactInfo, createBulkBookingRequest } from '../services/checkoutService'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import FormField from '../components/create-experience/FormField'
import CheckoutProgressSteps from '../components/checkout/CheckoutProgressSteps'

export default function CheckoutBulkContactPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { cartItems, refreshCart } = useCart()
  const { currentBalance } = useTripPoints()
  const {
    contactInfo,
    updateContactField,
    bulkCheckout,
    setBulkCartItemIds,
    setBulkCartItems,
    setBulkBookings,
    setBulkPricing,
    toggleBulkTrippoints,
    loading,
    error,
    setLoading,
    setError,
    clearError
  } = useCheckout()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [isCreatingBookings, setIsCreatingBookings] = useState(false)
  const [selectedCartItems, setSelectedCartItems] = useState([])

  // Refresh cart when component mounts to ensure we have latest cart data
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart()
    }
  }, [isAuthenticated, refreshCart])

  const countries = [
    'Singapore (+65)',
    'Malaysia (+60)',
    'United States (+1)',
    'United Kingdom (+44)',
    'Australia (+61)'
  ]

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

  // Parse cart item IDs from URL
  useEffect(() => {
    const cartItemIdsParam = searchParams.get('cartItemIds')

    // Wait for cart items to load before filtering
    if (cartItemIdsParam && cartItems.length > 0) {
      const ids = cartItemIdsParam.split(',').map(id => parseInt(id))
      setBulkCartItemIds(ids)

      // Filter cart items by IDs
      const items = cartItems.filter(item => ids.includes(item.cartItemId))

      // Only update if we found all the items we're looking for
      if (items.length === ids.length) {
        setSelectedCartItems(items)
        setBulkCartItems(items)
        calculatePricing(items)
      }
    }
  }, [searchParams, cartItems])

  // Pre-populate contact info from user
  useEffect(() => {
    if (user && !contactInfo.firstName) {
      updateContactField('firstName', user.firstName || '')
      updateContactField('lastName', user.lastName || '')
      updateContactField('email', user.email || '')
    }
  }, [user, contactInfo.firstName])

  // Validate contact info in real-time
  useEffect(() => {
    const validation = validateContactInfo(contactInfo)
    setValidationErrors(validation.errors)
  }, [contactInfo])

  // Calculate pricing for all selected items
  const calculatePricing = (items) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.priceAtTimeOfAdd) * Number(item.numberOfParticipants))
    }, 0)

    const serviceFee = subtotal * 0.04
    const grandTotal = subtotal + serviceFee

    setBulkPricing({
      subtotal: parseFloat(subtotal.toFixed(2)),
      serviceFee: parseFloat(serviceFee.toFixed(2)),
      trippointsDiscount: 0,
      grandTotal: parseFloat(grandTotal.toFixed(2))
    })
  }

  // Trippoints logic
  const subtotal = bulkCheckout.pricing.subtotal + bulkCheckout.pricing.serviceFee
  const maxRedeemablePoints = Math.min(Math.floor(currentBalance / 100), Math.floor(subtotal))
  const maxDiscountAmount = maxRedeemablePoints
  const hasEligibleBalance = currentBalance >= 100
  const canRedeem = hasEligibleBalance && maxRedeemablePoints > 0

  const handleTrippointsToggle = () => {
    if (canRedeem) {
      toggleBulkTrippoints(maxDiscountAmount)
    }
  }

  const handleInputChange = (field, value) => {
    updateContactField(field, value)
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCountrySelect = (country) => {
    updateContactField('country', country)
    setDropdownOpen(false)
  }

  const handleNext = async () => {
    try {
      clearError()
      setIsCreatingBookings(true)

      // Validate contact information
      const validation = validateContactInfo(contactInfo)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setError('Please correct the errors below')
        return
      }

      // Ensure we have cart items
      if (selectedCartItems.length === 0) {
        setError('No items selected for checkout')
        return
      }

      // Create bulk booking request
      const bulkBookingRequest = createBulkBookingRequest({
        cartItemIds: bulkCheckout.cartItemIds,
        contactFirstName: contactInfo.firstName,
        contactLastName: contactInfo.lastName,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone,
        trippointsDiscount: bulkCheckout.pricing.trippointsDiscount || 0
      })

      // Validate bulk booking with backend
      const validationResult = await checkoutService.validateBulkBooking(bulkBookingRequest)

      if (!validationResult.success || !validationResult.data.valid) {
        const errors = validationResult.data?.errors || [validationResult.error]
        setError('Validation failed: ' + errors.join(', '))
        return
      }

      // Create bulk bookings
      const bookingResult = await checkoutService.createBulkBookings(bulkBookingRequest)

      if (!bookingResult.success) {
        setError(bookingResult.error)
        return
      }

      // Store bookings in context (needed for payment page)
      setBulkBookings(bookingResult.data)

      // Navigate to payment page
      navigate('/checkout/bulk/payment')

    } catch (error) {
      setError(`Checkout error: ${error.message || 'An unexpected error occurred'}`)
    } finally {
      setIsCreatingBookings(false)
      setLoading(false)
    }
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  // Show loading state while fetching cart data
  if (loading && selectedCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-4 font-poppins">Loading cart information...</p>
        </div>
      </div>
    )
  }

  // Redirect if missing cart item IDs
  const cartItemIdsParam = searchParams.get('cartItemIds')
  if (!cartItemIdsParam) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-neutrals-2 mb-2">Missing Cart Items</h2>
          <p className="text-neutrals-4 mb-4">Please select items from your cart to checkout.</p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90"
          >
            Go to Cart
          </button>
        </div>
      </div>
    )
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
                          <span>{contactInfo.country || 'Singapore (+65)'}</span>
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
                      disabled={loading || isCreatingBookings || Object.keys(validationErrors).length > 0}
                      className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreatingBookings && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {isCreatingBookings ? 'Creating Bookings...' : 'Go to Payment'}
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
                    {selectedCartItems.map((item) => (
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
                              ${(item.priceAtTimeOfAdd * item.numberOfParticipants).toFixed(2)}
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
                        Subtotal ({selectedCartItems.length} item{selectedCartItems.length > 1 ? 's' : ''})
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

                  {/* Trippoints Redemption Section */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-medium text-sm">🏆</span>
                        <span className="font-medium text-blue-900 text-base">Trippoints</span>
                      </div>
                      <span className="text-blue-700 font-medium text-base">
                        {currentBalance} points
                      </span>
                    </div>

                    <p className="text-blue-700 mb-3 text-sm">
                      100 points = $1 • {hasEligibleBalance ? `You can save up to $${maxDiscountAmount}` : 'Need 100+ points to redeem'}
                    </p>

                    {canRedeem ? (
                      <button
                        onClick={handleTrippointsToggle}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-base ${
                          bulkCheckout.trippoints.isRedemptionActive
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {bulkCheckout.trippoints.isRedemptionActive
                          ? `Remove $${maxDiscountAmount} discount`
                          : `Redeem $${maxDiscountAmount} off with Trippoints`
                        }
                      </button>
                    ) : (
                      <div className="text-center py-2 text-blue-600 text-sm">
                        {currentBalance < 100
                          ? `Need ${100 - currentBalance} more points to redeem`
                          : 'No discount available for this order'
                        }
                      </div>
                    )}

                    {bulkCheckout.trippoints.isRedemptionActive && (
                      <p className="text-orange-600 mt-2 text-sm">
                        ⚠️ Trippoints will not be refunded if booking is cancelled
                      </p>
                    )}
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

            {/* Mobile Order Summary */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-neutrals-6">
              <h3 className="font-bold text-neutrals-1 mb-4 text-lg">Order Summary</h3>
              <div className="space-y-2 mb-3">
                {selectedCartItems.map((item) => (
                  <div key={item.cartItemId} className="p-2 bg-neutrals-8 rounded">
                    <div className="flex gap-2 mb-2">
                      <img src={item.coverPhotoUrl || '/placeholder.jpg'} alt="" className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutrals-1 truncate">{item.experienceTitle}</p>
                        <p className="text-xs text-neutrals-3">{item.numberOfParticipants} x ${item.priceAtTimeOfAdd}</p>
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

            {/* Mobile Contact Form */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <FormField
                  label="First Name"
                  value={contactInfo.firstName}
                  onChange={(value) => handleInputChange('firstName', value)}
                  error={validationErrors.firstName}
                  required
                />
                <FormField
                  label="Last Name"
                  value={contactInfo.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  error={validationErrors.lastName}
                  required
                />
                <FormField
                  label="Email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(value) => handleInputChange('email', value)}
                  error={validationErrors.email}
                  required
                />
                <FormField
                  label="Phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  error={validationErrors.phone}
                  required
                />
              </div>

              <button
                onClick={handleNext}
                disabled={isCreatingBookings || Object.keys(validationErrors).length > 0}
                className="w-full mt-6 py-3 bg-primary-1 text-white rounded-full font-bold hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingBookings ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
