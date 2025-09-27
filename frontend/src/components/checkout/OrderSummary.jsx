import React from 'react';
import { Clock, Users } from 'lucide-react';
import { useCheckout } from '../../contexts/CheckoutContext';

export default function OrderSummary({ isMobile = false }) {
  const {
    experienceData,
    scheduleData,
    numberOfParticipants,
    pricing,
    loading
  } = useCheckout();

  // Show loading state if data is still being fetched
  if (loading && !experienceData) {
    return (
      <div className={`${isMobile
        ? "bg-white rounded-xl p-4 mb-6 border border-neutrals-6"
        : "bg-white rounded-xl p-6 border border-neutrals-6 sticky top-6"
        } flex items-center justify-center min-h-[300px]`}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-neutrals-4 text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }
  // Format schedule date and time for display
  const formatScheduleDateTime = (schedule) => {
    if (!schedule?.startDateTime || !schedule?.endDateTime) {
      return "Date and time to be confirmed";
    }

    const startDateTime = new Date(schedule.startDateTime);
    const endDateTime = new Date(schedule.endDateTime);

    const dateText = startDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const startTime = startDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const endTime = endDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${dateText} at ${startTime} - ${endTime}`;
  };

  // Constants
  const DEFAULT_COVER_IMAGE = '/images/default-experience-cover.jpg';

  // Use real data from checkout context with fallbacks
  const displayExperience = experienceData || {
    title: "Experience Title Loading...",
    coverPhotoUrl: DEFAULT_COVER_IMAGE,
    averageRating: 0,
    totalReviews: 0,
    price: 0
  };

  const formattedDateTime = formatScheduleDateTime(scheduleData);
  const guests = numberOfParticipants || 1;

  // Use pricing from checkout context (calculated automatically)
  const baseAmount = pricing.baseAmount || 0;
  const serviceFee = pricing.serviceFee || 0;
  const total = pricing.totalAmount || 0;

  const containerClasses = isMobile
    ? "bg-white rounded-xl p-4 mb-6 border border-neutrals-6"
    : "bg-white rounded-xl p-6 border border-neutrals-6 sticky top-6";

  return (
    <div className={containerClasses}>
      <h3 className={`font-bold text-neutrals-1 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
        Order Summary
      </h3>

      {/* Experience Info */}
      <div className="flex gap-3 mb-4">
        <img
          src={displayExperience.coverPhotoUrl}
          alt={displayExperience.title}
          className={`object-cover rounded-lg ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
        />
        <div className="flex-1">
          <h4 className={`font-semibold text-neutrals-1 mb-2 ${isMobile ? 'text-sm leading-tight' : 'text-base'}`}>
            {displayExperience.title}
          </h4>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className={`font-medium text-neutrals-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {displayExperience.averageRating?.toFixed(1) || '0.0'} ({displayExperience.totalReviews || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className={`text-neutrals-4 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <span className={`text-neutrals-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {formattedDateTime}
        </span>
      </div>

      {/* Guests */}
      <div className="flex items-center gap-2 mb-6">
        <Users className={`text-neutrals-4 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <span className={`text-neutrals-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {guests} Guest{guests > 1 ? 's' : ''}
        </span>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className={`text-neutrals-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
            ${displayExperience.price || 0} x {guests} Guest{guests > 1 ? 's' : ''}
          </span>
          <span className={`font-medium text-neutrals-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
            ${baseAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-neutrals-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
            Service fee
          </span>
          <span className={`font-medium text-neutrals-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
            ${serviceFee.toFixed(2)}
          </span>
        </div>
      </div>

      <hr className="border-neutrals-6 mb-4" />

      {/* Total */}
      <div className="flex justify-between items-center mb-4">
        <span className={`font-bold text-neutrals-1 ${isMobile ? 'text-base' : 'text-lg'}`}>
          Total
        </span>
        <span className={`font-bold text-neutrals-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Promo Code Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter promo, credit or gift code"
          className={`w-full px-3 py-2 border border-neutrals-5 rounded-lg focus:outline-none focus:border-primary-1 transition-colors ${isMobile ? 'text-sm' : 'text-base'
            }`}
        />
      </div>

      {/* Free Cancellation */}
      <div className="flex items-start gap-2">
        <div className={`text-neutrals-4 mt-0.5 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}>
          ⓘ
        </div>
        <span className={`text-neutrals-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          Free cancellation until 24 hours before experience start
        </span>
      </div>
    </div>
  );
}