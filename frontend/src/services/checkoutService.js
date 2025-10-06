import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

// Checkout API Service Functions
export const checkoutService = {
  // ================================
  // EXPERIENCE & SCHEDULE DATA
  // ================================

  /**
   * Get experience details by experience ID
   * GET /api/experiences/{experienceId}
   */
  async getExperienceById(experienceId) {
    try {
      const response = await api.get(`/api/experiences/${experienceId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get experience details',
        data: error.response?.data
      }
    }
  },

  /**
   * Get experience schedules by experience ID
   * GET /api/experiences/{experienceId}/schedules
   */
  async getExperienceSchedules(experienceId) {
    try {
      const response = await api.get(`/api/experiences/${experienceId}/schedules`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get experience schedules',
        data: error.response?.data
      }
    }
  },

  /**
   * Get specific schedule details by schedule ID
   * GET /api/experience-schedules/{scheduleId}
   */
  async getScheduleById(scheduleId) {
    try {
      const response = await api.get(`/api/experience-schedules/${scheduleId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get schedule details',
        data: error.response?.data
      }
    }
  },

  // ================================
  // BOOKING VALIDATION & CREATION
  // ================================

  /**
   * Validate a booking request before creation
   * POST /api/bookings/validate
   */
  async validateBooking(bookingRequest) {
    try {
      const response = await api.post('/api/bookings/validate', bookingRequest)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Booking validation failed',
        data: error.response?.data
      }
    }
  },

  /**
   * Create a new booking in PENDING status
   * POST /api/bookings/create
   */
  async createBooking(bookingRequest) {
    try {
      const response = await api.post('/api/bookings/create', bookingRequest)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create booking',
        data: error.response?.data
      }
    }
  },

  /**
   * Get booking details by booking ID
   * GET /api/bookings/{bookingId}
   */
  async getBookingById(bookingId) {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get booking details',
        data: error.response?.data
      }
    }
  },

  // ================================
  // PRICING CALCULATIONS
  // ================================

  /**
   * Calculate pricing for a booking
   * GET /api/bookings/calculate-pricing
   */
  async calculatePricing(experienceScheduleId, numberOfParticipants) {
    try {
      const response = await api.get('/api/bookings/calculate-pricing', {
        params: {
          experienceScheduleId,
          numberOfParticipants
        }
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to calculate pricing',
        data: error.response?.data
      }
    }
  },

  /**
   * Calculate service fee for a given base amount
   * GET /api/bookings/calculate-fee
   */
  async calculateServiceFee(baseAmount) {
    try {
      const response = await api.get('/api/bookings/calculate-fee', {
        params: { baseAmount }
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to calculate service fee',
        data: error.response?.data
      }
    }
  },

  /**
   * Calculate total amount including service fee
   * GET /api/bookings/calculate-total
   */
  async calculateTotalAmount(baseAmount) {
    try {
      const response = await api.get('/api/bookings/calculate-total', {
        params: { baseAmount }
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to calculate total amount',
        data: error.response?.data
      }
    }
  },

  // ================================
  // PAYMENT PROCESSING
  // ================================

  /**
   * Process payment for an existing booking
   * POST /api/bookings/{bookingId}/process-payment
   */
  async processPayment(bookingId, paymentToken) {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/process-payment`, null, {
        params: { paymentToken }
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Payment processing failed',
        data: error.response?.data
      }
    }
  },

  /**
   * Process a refund for a booking transaction
   * POST /api/bookings/{bookingId}/refund/{transactionId}
   */
  async processRefund(bookingId, transactionId, refundAmount = null, reason = null) {
    try {
      const params = {}
      if (refundAmount) params.refundAmount = refundAmount
      if (reason) params.reason = reason

      const response = await api.post(`/api/bookings/${bookingId}/refund/${transactionId}`, null, {
        params
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Refund processing failed',
        data: error.response?.data
      }
    }
  },

  // ================================
  // TRANSACTION MANAGEMENT
  // ================================

  /**
   * Get all transactions for a specific booking
   * GET /api/bookings/{bookingId}/transactions
   */
  async getTransactionsByBooking(bookingId) {
    try {
      const response = await api.get(`/api/bookings/${bookingId}/transactions`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get transactions',
        data: error.response?.data
      }
    }
  },

  /**
   * Get transaction details by transaction ID
   * GET /api/transactions/{transactionId}
   */
  async getTransactionById(transactionId) {
    try {
      const response = await api.get(`/api/transactions/${transactionId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get transaction details',
        data: error.response?.data
      }
    }
  },

  // ================================
  // BOOKING MANAGEMENT
  // ================================

  /**
   * Cancel an existing booking
   * POST /api/bookings/{bookingId}/cancel
   */
  async cancelBooking(bookingId, reason) {
    try {
      const response = await api.post(`/api/bookings/${bookingId}/cancel`, null, {
        params: { reason }
      })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel booking',
        data: error.response?.data
      }
    }
  },

  /**
   * Get all bookings for a user by email
   * GET /api/bookings/user/{email}
   */
  async getUserBookings(email) {
    try {
      const response = await api.get(`/api/bookings/user/${email}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get user bookings',
        data: error.response?.data
      }
    }
  }
}

// Helper function to create booking request DTO
export const createBookingRequest = ({
  experienceScheduleId,
  numberOfParticipants,
  contactFirstName,
  contactLastName,
  contactEmail,
  contactPhone,
  baseAmount,
  serviceFee,
  totalAmount,
  trippointsDiscount = 0
}) => {
  return {
    experienceScheduleId,
    numberOfParticipants,
    contactFirstName,
    contactLastName,
    contactEmail,
    contactPhone,
    baseAmount,
    serviceFee,
    totalAmount,
    trippointsDiscount
  }
}

// Helper function to validate contact information
export const validateContactInfo = (contactInfo) => {
  const errors = {}

  if (!contactInfo.firstName?.trim()) {
    errors.firstName = 'First name is required'
  }

  if (!contactInfo.lastName?.trim()) {
    errors.lastName = 'Last name is required'
  }

  if (!contactInfo.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!contactInfo.phone?.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(contactInfo.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid phone number'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export default checkoutService