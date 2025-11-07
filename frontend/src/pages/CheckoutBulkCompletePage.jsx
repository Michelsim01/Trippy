import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, MapPin, DollarSign, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCheckout } from '../contexts/CheckoutContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function CheckoutBulkCompletePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { bulkCheckout, clearBulkCheckout } = useCheckout()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Check if we have booking data
  useEffect(() => {
    if (!bulkCheckout.bookings || bulkCheckout.bookings.length === 0) {
      // No bookings, redirect to cart
      navigate('/cart')
    }
  }, [bulkCheckout.bookings, navigate])

  const formatDate = (dateTimeString) => {
    try {
      if (!dateTimeString) return 'Date TBD'
      const date = new Date(dateTimeString)
      if (isNaN(date.getTime())) return dateTimeString

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return dateTimeString
    }
  }

  const formatTime = (startDateTimeString, endDateTimeString) => {
    try {
      if (!startDateTimeString || !endDateTimeString) return 'Time TBD'
      const startDate = new Date(startDateTimeString)
      const endDate = new Date(endDateTimeString)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return `${startDateTimeString} - ${endDateTimeString}`
      }

      const formatTime = (date) => date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      return `${formatTime(startDate)} - ${formatTime(endDate)}`
    } catch (error) {
      return `${startDateTimeString} - ${endDateTimeString}`
    }
  }

  const handleViewBookings = () => {
    clearBulkCheckout()
    navigate('/my-bookings')
  }

  const handleBrowseExperiences = () => {
    clearBulkCheckout()
    navigate('/home')
  }

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const bookingCount = bulkCheckout.bookings?.length || 0

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={isAuthenticated}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          {/* Main Content */}
          <div className="max-w-4xl mx-auto py-16 px-8">
            <div className="bg-white rounded-2xl p-12">
              {/* Success Message */}
              <div className="text-left mb-8">
                {/* Celebration Icon */}
                <div className="w-20 h-20 mb-8">
                  <div className="text-6xl">🎉</div>
                </div>

                <div className="mb-6">
                  <p className="text-lg text-neutrals-4 mb-2">Thank you!</p>
                  <h1 className="text-4xl font-bold text-neutrals-1 leading-tight">
                    Your order has<br />been received
                  </h1>
                </div>

              </div>

              {/* Booking Details */}
              <div className="mb-8">

                <div className="space-y-6">
                  {bulkCheckout.bookings?.map((booking, index) => (
                    <div key={booking.bookingId} className="bg-neutrals-8 rounded-xl p-6">
                      <div className="flex gap-6">
                        {/* Left side - Title and Details */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-neutrals-1 mb-6">
                            {booking.experienceTitle || `Experience ${index + 1}`}
                          </h3>

                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Calendar className="w-6 h-6 text-neutrals-4" />
                              <div>
                                <p className="text-sm font-medium text-neutrals-5 uppercase">Date</p>
                                <p className="text-lg font-semibold text-neutrals-1">
                                  {formatDate(booking.startDateTime)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <Clock className="w-6 h-6 text-neutrals-4" />
                              <div>
                                <p className="text-sm font-medium text-neutrals-5 uppercase">Time</p>
                                <p className="text-lg font-semibold text-neutrals-1">
                                  {formatTime(booking.startDateTime, booking.endDateTime)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <Users className="w-6 h-6 text-neutrals-4" />
                              <div>
                                <p className="text-sm font-medium text-neutrals-5 uppercase">Guests</p>
                                <p className="text-lg font-semibold text-neutrals-1">{booking.numberOfParticipants}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <DollarSign className="w-6 h-6 text-neutrals-4" />
                              <div>
                                <p className="text-sm font-medium text-neutrals-5 uppercase">Amount</p>
                                <p className="text-lg font-semibold text-neutrals-1">{formatCurrency(booking.totalAmount)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Experience Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={booking.experienceCoverPhotoUrl || '/images/default-experience-cover.jpg'}
                            alt={booking.experienceTitle}
                            className="w-80 h-64 object-cover rounded-xl shadow-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-neutrals-8 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-neutrals-1 mb-4">Payment Summary</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-neutrals-3">
                    <span>Subtotal ({bookingCount} experience{bookingCount > 1 ? 's' : ''}):</span>
                    <span className="font-semibold">{formatCurrency(bulkCheckout.pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutrals-3">
                    <span>Service fee:</span>
                    <span className="font-semibold">{formatCurrency(bulkCheckout.pricing.serviceFee)}</span>
                  </div>
                  {bulkCheckout.pricing.trippointsDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Trippoints discount:</span>
                      <span className="font-semibold">-{formatCurrency(bulkCheckout.pricing.trippointsDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutrals-6 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-neutrals-1">Total Paid:</span>
                    <span className="text-2xl font-bold text-neutrals-1">
                      {formatCurrency(bulkCheckout.pricing.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Your Trip Section */}
              <div className="bg-neutrals-8 rounded-xl p-6">
                <h3 className="text-lg font-bold text-neutrals-1 mb-4 text-center">Your trips</h3>
                <button
                  onClick={handleViewBookings}
                  className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors text-lg shadow-lg hover:shadow-xl mb-3"
                >
                  View My Bookings
                </button>
                <button
                  onClick={handleBrowseExperiences}
                  className="w-full border-2 border-primary-1 text-primary-1 font-bold py-4 rounded-full hover:bg-primary-1 hover:text-white transition-colors text-lg"
                >
                  Browse More Experiences
                </button>
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
            <div className="bg-white rounded-xl p-6">
              {/* Celebration Icon */}
              <div className="mb-6">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-base text-neutrals-4 mb-2">Thank you!</p>
                <h1 className="text-2xl font-bold text-neutrals-1 leading-tight">
                  Your order has<br />been received
                </h1>
              </div>

              {/* Booking Details */}
              <div className="mb-6">

                <div className="space-y-4">
                  {bulkCheckout.bookings?.map((booking, index) => (
                    <div key={booking.bookingId} className="bg-neutrals-8 rounded-xl p-4">
                      {/* Experience Image */}
                      <img
                        src={booking.experienceCoverPhotoUrl || '/images/default-experience-cover.jpg'}
                        alt={booking.experienceTitle}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />

                      {/* Title */}
                      <h3 className="text-lg font-bold text-neutrals-1 mb-4">
                        {booking.experienceTitle || `Experience ${index + 1}`}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-neutrals-4" />
                          <div>
                            <p className="text-xs font-medium text-neutrals-5 uppercase">Date</p>
                            <p className="text-sm font-semibold text-neutrals-1">
                              {formatDate(booking.startDateTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-neutrals-4" />
                          <div>
                            <p className="text-xs font-medium text-neutrals-5 uppercase">Time</p>
                            <p className="text-sm font-semibold text-neutrals-1">
                              {formatTime(booking.startDateTime, booking.endDateTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-neutrals-4" />
                          <div>
                            <p className="text-xs font-medium text-neutrals-5 uppercase">Guests</p>
                            <p className="text-sm font-semibold text-neutrals-1">{booking.numberOfParticipants}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-neutrals-4" />
                          <div>
                            <p className="text-xs font-medium text-neutrals-5 uppercase">Amount</p>
                            <p className="text-sm font-semibold text-neutrals-1">{formatCurrency(booking.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-neutrals-8 rounded-xl p-4 mb-6">
                <h3 className="text-base font-bold text-neutrals-1 mb-3">Payment Summary</h3>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm text-neutrals-3">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(bulkCheckout.pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutrals-3">
                    <span>Service fee:</span>
                    <span className="font-semibold">{formatCurrency(bulkCheckout.pricing.serviceFee)}</span>
                  </div>
                  {bulkCheckout.pricing.trippointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Trippoints discount:</span>
                      <span className="font-semibold">-{formatCurrency(bulkCheckout.pricing.trippointsDiscount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutrals-6 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-neutrals-1">Total Paid:</span>
                    <span className="text-xl font-bold text-neutrals-1">
                      {formatCurrency(bulkCheckout.pricing.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Your Trip Section */}
              <div className="bg-neutrals-8 rounded-xl p-4">
                <h3 className="text-base font-bold text-neutrals-1 mb-4 text-center">Your trips</h3>
                <button
                  onClick={handleViewBookings}
                  className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors shadow-lg hover:shadow-xl mb-3"
                >
                  View My Bookings
                </button>
                <button
                  onClick={handleBrowseExperiences}
                  className="w-full border-2 border-primary-1 text-primary-1 font-bold py-4 rounded-full hover:bg-primary-1 hover:text-white transition-colors"
                >
                  Browse More Experiences
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
