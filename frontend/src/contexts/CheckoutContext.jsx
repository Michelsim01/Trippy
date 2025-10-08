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
    experiencePrice: 0,
    trippointsDiscount: 0
  },

  // Trippoints redemption state
  trippoints: {
    isRedemptionActive: false,
    discountAmount: 0
  },

  // Contact information
  contactInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
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

  // Experience and booking data
  SET_EXPERIENCE_DATA: 'SET_EXPERIENCE_DATA',
  SET_SCHEDULE_DATA: 'SET_SCHEDULE_DATA',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  SET_PRICING: 'SET_PRICING',

  // Contact information
  SET_CONTACT_INFO: 'SET_CONTACT_INFO',
  UPDATE_CONTACT_FIELD: 'UPDATE_CONTACT_FIELD',


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

  // Trippoints
  TOGGLE_TRIPPOINTS_REDEMPTION: 'TOGGLE_TRIPPOINTS_REDEMPTION',
  SET_TRIPPOINTS_DISCOUNT: 'SET_TRIPPOINTS_DISCOUNT',

  // Reset
  RESET_CHECKOUT: 'RESET_CHECKOUT'
}

// Checkout reducer function
function checkoutReducer(state, action) {
  switch (action.type) {
    case CHECKOUT_ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload }


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


    case CHECKOUT_ACTIONS.UPDATE_VALIDATION:
      return {
        ...state,
        validation: { ...state.validation, [action.payload.field]: action.payload.value }
      }

    case CHECKOUT_ACTIONS.TOGGLE_TRIPPOINTS_REDEMPTION:
      const isActive = !state.trippoints.isRedemptionActive
      const discountAmount = isActive ? action.payload.discountAmount : 0
      const newTotalAmount = state.pricing.baseAmount + state.pricing.serviceFee - discountAmount

      return {
        ...state,
        trippoints: {
          ...state.trippoints,
          isRedemptionActive: isActive,
          discountAmount
        },
        pricing: {
          ...state.pricing,
          trippointsDiscount: discountAmount,
          totalAmount: parseFloat(newTotalAmount.toFixed(2))
        }
      }

    case CHECKOUT_ACTIONS.SET_TRIPPOINTS_DISCOUNT:
      const newTotal = state.pricing.baseAmount + state.pricing.serviceFee - action.payload
      return {
        ...state,
        trippoints: {
          ...state.trippoints,
          discountAmount: action.payload
        },
        pricing: {
          ...state.pricing,
          trippointsDiscount: action.payload,
          totalAmount: parseFloat(newTotal.toFixed(2))
        }
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


    // Booking and transaction
    setBooking: (booking) => dispatch({ type: CHECKOUT_ACTIONS.SET_BOOKING, payload: booking }),
    setTransaction: (transaction) => dispatch({ type: CHECKOUT_ACTIONS.SET_TRANSACTION, payload: transaction }),

    // UI state
    setLoading: (loading) => dispatch({ type: CHECKOUT_ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: CHECKOUT_ACTIONS.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: CHECKOUT_ACTIONS.CLEAR_ERROR }),

    // Validation
    updateValidation: (field, value) => dispatch({
      type: CHECKOUT_ACTIONS.UPDATE_VALIDATION,
      payload: { field, value }
    }),

    // Trippoints
    toggleTrippointsRedemption: (discountAmount) => dispatch({
      type: CHECKOUT_ACTIONS.TOGGLE_TRIPPOINTS_REDEMPTION,
      payload: { discountAmount }
    }),
    setTrippointsDiscount: (discountAmount) => dispatch({
      type: CHECKOUT_ACTIONS.SET_TRIPPOINTS_DISCOUNT,
      payload: discountAmount
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