import React, { useState, useEffect, useCallback } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle } from 'lucide-react';

export default function StripeCardForm({ onTokenCreated, onValidationChange, loading = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  });
  const [cardholderName, setCardholderName] = useState('');

  // Stripe Elements styling to match your design
  const cardStyle = {
    style: {
      base: {
        fontSize: '18px',
        fontFamily: 'inherit',
        color: '#1a1a1a', // neutrals-1
        fontWeight: '500',
        '::placeholder': {
          color: '#9ca3af', // neutrals-4
        },
      },
      invalid: {
        color: '#ef4444', // red-500
      },
    },
  };

  // Handle card input changes
  const handleCardChange = (elementType) => (event) => {
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }

    // Update completion state for this element
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete
    }));
  };

  // Check overall validation state
  useEffect(() => {
    const allCardFieldsComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc;
    const isValid = allCardFieldsComplete && cardholderName.trim() !== '';
    onValidationChange?.(isValid);
  }, [cardComplete, cardholderName, onValidationChange]);

  // Handle cardholder name changes
  const handleNameChange = (e) => {
    setCardholderName(e.target.value);
  };

  // Create Stripe token using useCallback to ensure latest state access
  const createToken = useCallback(async () => {
    if (!stripe || !elements) {
      throw new Error('Stripe not initialized');
    }

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) {
      throw new Error('Card element not found');
    }

    const allCardFieldsComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc;

    if (!allCardFieldsComplete) {
      throw new Error('Please complete your card information');
    }

    if (!cardholderName.trim()) {
      throw new Error('Cardholder name is required');
    }

    // Create token with Stripe
    const { token, error } = await stripe.createToken(cardNumberElement, {
      name: cardholderName.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return token;
  }, [stripe, elements, cardComplete, cardholderName]);

  // Expose createToken function to parent only when Stripe is ready
  useEffect(() => {
    if (stripe && elements && onTokenCreated) {
      // Wrap function to prevent React from calling it immediately
      onTokenCreated(() => createToken);
    }
  }, [stripe, elements, createToken]);

  return (
    <div className="space-y-6">
      {/* Cardholder Name */}
      <div>
        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">
          Name on Card
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={handleNameChange}
          disabled={loading}
          className="w-full px-6 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors disabled:opacity-50"
          placeholder="Full name as on card"
        />
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">
          Card Number
        </label>
        <div className="w-full px-6 py-4 border-2 border-neutrals-5 rounded-xl focus-within:border-primary-1 transition-colors">
          {stripe && elements ? (
            <CardNumberElement
              options={cardStyle}
              onChange={handleCardChange('cardNumber')}
              disabled={loading}
            />
          ) : (
            <div className="text-gray-500">Loading payment form...</div>
          )}
        </div>
      </div>

      {/* Expiration Date and CVV */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">
            Expiration Date
          </label>
          <div className="w-full px-6 py-4 border-2 border-neutrals-5 rounded-xl focus-within:border-primary-1 transition-colors">
            {stripe && elements ? (
              <CardExpiryElement
                options={cardStyle}
                onChange={handleCardChange('cardExpiry')}
                disabled={loading}
              />
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">
            CVV
          </label>
          <div className="w-full px-6 py-4 border-2 border-neutrals-5 rounded-xl focus-within:border-primary-1 transition-colors">
            {stripe && elements ? (
              <CardCvcElement
                options={cardStyle}
                onChange={handleCardChange('cardCvc')}
                disabled={loading}
              />
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}