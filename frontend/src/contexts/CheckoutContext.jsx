import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Initial state for checkout process
const initialState = {
  // Current step in checkout process
  currentStep: 'contact', // 'contact' | 'payment' | 'complete'

  // Experience and booking details
  experienceData: null,
  scheduleData: null,
  numberOfParticipants: 1,

  // Pricing information
  pricing: {
    baseAmount: 0,
    serviceFee: 0,
    totalAmount: 0,
    experiencePrice: 0
  },

  // Contact information
  contactInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },

  // Payment information
  paymentInfo: {
    cardholderName: '',
    lastFourDigits: '',
    cardBrand: ''
  },

  // Booking and transaction data
  booking: null,
  transaction: null,

  // UI state
  loading: false,
  error: null,

  // Validation state
  validation: {
    contactValid: false,
    paymentValid: false,
    bookingValidated: false
  }
}

// Action types for checkout reducer
const CHECKOUT_ACTIONS = {
  // Step management
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  GO_TO_NEXT_STEP: 'GO_TO_NEXT_STEP',
  GO_TO_PREVIOUS_STEP: 'GO_TO_PREVIOUS_STEP',

  // Experience and booking data
  SET_EXPERIENCE_DATA: 'SET_EXPERIENCE_DATA',
  SET_SCHEDULE_DATA: 'SET_SCHEDULE_DATA',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  SET_PRICING: 'SET_PRICING',

  // Contact information
  SET_CONTACT_INFO: 'SET_CONTACT_INFO',
  UPDATE_CONTACT_FIELD: 'UPDATE_CONTACT_FIELD',

  // Payment information
  SET_PAYMENT_INFO: 'SET_PAYMENT_INFO',
  UPDATE_PAYMENT_FIELD: 'UPDATE_PAYMENT_FIELD',

  // Booking and transaction
  SET_BOOKING: 'SET_BOOKING',
  SET_TRANSACTION: 'SET_TRANSACTION',

  // UI state
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Validation
  SET_VALIDATION: 'SET_VALIDATION',
  UPDATE_VALIDATION: 'UPDATE_VALIDATION',

  // Reset
  RESET_CHECKOUT: 'RESET_CHECKOUT'
}

// Checkout reducer function
function checkoutReducer(state, action) {
  switch (action.type) {
    case CHECKOUT_ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload }

    case CHECKOUT_ACTIONS.GO_TO_NEXT_STEP:
      const stepOrder = ['contact', 'payment', 'complete']
      const currentIndex = stepOrder.indexOf(state.currentStep)
      const nextStep = currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : state.currentStep
      return { ...state, currentStep: nextStep }

    case CHECKOUT_ACTIONS.GO_TO_PREVIOUS_STEP:
      const stepOrderBack = ['contact', 'payment', 'complete']
      const currentIndexBack = stepOrderBack.indexOf(state.currentStep)
      const prevStep = currentIndexBack > 0 ? stepOrderBack[currentIndexBack - 1] : state.currentStep
      return { ...state, currentStep: prevStep }

    case CHECKOUT_ACTIONS.SET_EXPERIENCE_DATA:
      return { ...state, experienceData: action.payload }

    case CHECKOUT_ACTIONS.SET_SCHEDULE_DATA:
      return { ...state, scheduleData: action.payload }

    case CHECKOUT_ACTIONS.SET_PARTICIPANTS:
      return { ...state, numberOfParticipants: action.payload }

    case CHECKOUT_ACTIONS.SET_PRICING:
      return { ...state, pricing: { ...state.pricing, ...action.payload } }

    case CHECKOUT_ACTIONS.SET_CONTACT_INFO:
      return { ...state, contactInfo: { ...state.contactInfo, ...action.payload } }

    case CHECKOUT_ACTIONS.UPDATE_CONTACT_FIELD:
      return {
        ...state,
        contactInfo: { ...state.contactInfo, [action.payload.field]: action.payload.value }
      }

    case CHECKOUT_ACTIONS.SET_PAYMENT_INFO:
      return { ...state, paymentInfo: { ...state.paymentInfo, ...action.payload } }

    case CHECKOUT_ACTIONS.UPDATE_PAYMENT_FIELD:
      return {
        ...state,
        paymentInfo: { ...state.paymentInfo, [action.payload.field]: action.payload.value }
      }

    case CHECKOUT_ACTIONS.SET_BOOKING:
      return { ...state, booking: action.payload }

    case CHECKOUT_ACTIONS.SET_TRANSACTION:
      return { ...state, transaction: action.payload }

    case CHECKOUT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }

    case CHECKOUT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }

    case CHECKOUT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }

    case CHECKOUT_ACTIONS.SET_VALIDATION:
      return { ...state, validation: { ...state.validation, ...action.payload } }

    case CHECKOUT_ACTIONS.UPDATE_VALIDATION:
      return {
        ...state,
        validation: { ...state.validation, [action.payload.field]: action.payload.value }
      }

    case CHECKOUT_ACTIONS.RESET_CHECKOUT:
      return { ...initialState, experienceData: state.experienceData, scheduleData: state.scheduleData }

    default:
      return state
  }
}

// Create checkout context
const CheckoutContext = createContext()

// Checkout provider component
export function CheckoutProvider({ children }) {
  const [state, dispatch] = useReducer(checkoutReducer, initialState)

  // Action creators for easier use
  const actions = {
    // Step management
    setCurrentStep: (step) => dispatch({ type: CHECKOUT_ACTIONS.SET_CURRENT_STEP, payload: step }),
    goToNextStep: () => dispatch({ type: CHECKOUT_ACTIONS.GO_TO_NEXT_STEP }),
    goToPreviousStep: () => dispatch({ type: CHECKOUT_ACTIONS.GO_TO_PREVIOUS_STEP }),

    // Experience and booking data
    setExperienceData: (data) => dispatch({ type: CHECKOUT_ACTIONS.SET_EXPERIENCE_DATA, payload: data }),
    setScheduleData: (data) => dispatch({ type: CHECKOUT_ACTIONS.SET_SCHEDULE_DATA, payload: data }),
    setParticipants: (count) => dispatch({ type: CHECKOUT_ACTIONS.SET_PARTICIPANTS, payload: count }),
    setPricing: (pricing) => dispatch({ type: CHECKOUT_ACTIONS.SET_PRICING, payload: pricing }),

    // Contact information
    setContactInfo: (info) => dispatch({ type: CHECKOUT_ACTIONS.SET_CONTACT_INFO, payload: info }),
    updateContactField: (field, value) => dispatch({
      type: CHECKOUT_ACTIONS.UPDATE_CONTACT_FIELD,
      payload: { field, value }
    }),

    // Payment information
    setPaymentInfo: (info) => dispatch({ type: CHECKOUT_ACTIONS.SET_PAYMENT_INFO, payload: info }),
    updatePaymentField: (field, value) => dispatch({
      type: CHECKOUT_ACTIONS.UPDATE_PAYMENT_FIELD,
      payload: { field, value }
    }),

    // Booking and transaction
    setBooking: (booking) => dispatch({ type: CHECKOUT_ACTIONS.SET_BOOKING, payload: booking }),
    setTransaction: (transaction) => dispatch({ type: CHECKOUT_ACTIONS.SET_TRANSACTION, payload: transaction }),

    // UI state
    setLoading: (loading) => dispatch({ type: CHECKOUT_ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: CHECKOUT_ACTIONS.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: CHECKOUT_ACTIONS.CLEAR_ERROR }),

    // Validation
    setValidation: (validation) => dispatch({ type: CHECKOUT_ACTIONS.SET_VALIDATION, payload: validation }),
    updateValidation: (field, value) => dispatch({
      type: CHECKOUT_ACTIONS.UPDATE_VALIDATION,
      payload: { field, value }
    }),

    // Reset
    resetCheckout: () => dispatch({ type: CHECKOUT_ACTIONS.RESET_CHECKOUT })
  }

  // Calculate pricing when participants or experience price changes
  useEffect(() => {
    if (state.experienceData?.price && state.numberOfParticipants) {
      const baseAmount = state.experienceData.price * state.numberOfParticipants
      const serviceFee = baseAmount * 0.04 // 4% service fee (matches backend)
      const totalAmount = baseAmount + serviceFee

      dispatch({
        type: CHECKOUT_ACTIONS.SET_PRICING,
        payload: {
          baseAmount: parseFloat(baseAmount.toFixed(2)),
          serviceFee: parseFloat(serviceFee.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          experiencePrice: state.experienceData.price
        }
      })
    }
  }, [state.experienceData?.price, state.numberOfParticipants])

  // Auto-populate contact info from user context if available
  useEffect(() => {
    // This could be enhanced to pull from user context
    // For now, it's a placeholder for future integration
  }, [])

  // Context value
  const contextValue = {
    // State
    ...state,

    // Actions
    ...actions,

    // Computed values
    canProceedToPayment: state.validation.contactValid && state.validation.bookingValidated,
    canCompletePayment: state.validation.paymentValid && state.booking,
    isFirstStep: state.currentStep === 'contact',
    isLastStep: state.currentStep === 'complete',

    // Helper functions
    getStepIndex: () => ['contact', 'payment', 'complete'].indexOf(state.currentStep),
    getTotalSteps: () => 3,
    getProgressPercentage: () => {
      const stepIndex = ['contact', 'payment', 'complete'].indexOf(state.currentStep)
      return ((stepIndex + 1) / 3) * 100
    }
  }

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  )
}

// Custom hook to use checkout context
export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}

// Export action types for external use if needed
export { CHECKOUT_ACTIONS }