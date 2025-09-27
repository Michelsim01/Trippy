import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { convertTo12Hr } from '../../utils/scheduleGenerator';

// Helper function to format schedule display
const formatScheduleDisplay = (schedule) => {
  if (!schedule) {
    return {
      dateText: 'Invalid Date',
      timeText: 'Invalid Time'
    };
  }

  // Use the schedule's startDateTime and endDateTime for formatting
  if (schedule.startDateTime && schedule.endDateTime) {
    const startDateTime = new Date(schedule.startDateTime);
    const endDateTime = new Date(schedule.endDateTime);

    // Check if it's a multi-day schedule (different days)
    const isMultiDay = startDateTime.toDateString() !== endDateTime.toDateString();

    if (isMultiDay) {
      const startDateStr = startDateTime.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
      });
      const endDateStr = endDateTime.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short'
      });

      return {
        dateText: `${startDateStr} - ${endDateStr}`,
        timeText: `${startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      };
    } else {
      return {
        dateText: startDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }),
        timeText: `${startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      };
    }
  }

  // Fallback to old format if startDateTime/endDateTime not available but date/startTime/endTime are
  if (schedule.date && schedule.startTime && schedule.endTime) {
    return {
      dateText: new Date(schedule.date).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }),
      timeText: `${convertTo12Hr(schedule.startTime)} - ${convertTo12Hr(schedule.endTime)}`
    };
  }

  return {
    dateText: 'Invalid Date',
    timeText: 'Invalid Time'
  };
};

// Helper function to format duration display using experience duration or schedules
const formatDuration = (experienceData, schedulesData) => {
  // First try to use the experience duration field if available
  if (experienceData && experienceData.duration) {
    const hours = parseFloat(experienceData.duration);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} Day${days > 1 ? 's' : ''}`;
    } else if (hours === Math.floor(hours)) {
      return `${hours} Hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} Hours`;
    }
  }

  // Fallback: calculate from schedules if available
  if (schedulesData && schedulesData.length > 0) {
    const firstSchedule = schedulesData[0];
    const lastSchedule = schedulesData[schedulesData.length - 1];

    if (firstSchedule.startDateTime && lastSchedule.endDateTime) {
      const start = new Date(firstSchedule.startDateTime);
      const end = new Date(lastSchedule.endDateTime);
      const durationMs = end - start;
      const hours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days} Day${days > 1 ? 's' : ''}`;
      } else if (hours === Math.floor(hours)) {
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} Hours`;
      }
    }
  }

  // Default fallback
  return null;
};

const BookingWidget = ({
  displayData,
  schedulesData,
  selectedSchedule,
  setSelectedSchedule,
  guests,
  setGuests,
  setShowAllSchedules,
  averageRating = 0,
  totalReviews = 0,
  isMobile = false,
  onChatWithGuide
}) => {
  const navigate = useNavigate();

  // Helper function to get maximum allowed guests based on selected schedule
  const getMaxAllowedGuests = () => {
    if (selectedSchedule !== null && schedulesData && schedulesData[selectedSchedule]) {
      const schedule = schedulesData[selectedSchedule];
      return Math.min(
        schedule.availableSpots || 1,
        displayData.participantsAllowed || 8
      );
    }
    return displayData.participantsAllowed || 8;
  };

  const handleBookNow = () => {
    // Ensure a schedule is selected
    if (selectedSchedule === null) {
      alert('Please select a date and time to continue booking.');
      return;
    }

    // Get the selected schedule data
    let selectedScheduleData;
    if (schedulesData && schedulesData.length > 0) {
      selectedScheduleData = schedulesData[selectedSchedule];

      // Additional validation: Check if the selected schedule is still available
      if (!selectedScheduleData || selectedScheduleData.availableSpots <= 0 || selectedScheduleData.isAvailable === false) {
        alert('The selected schedule is no longer available. Please choose another date.');
        setSelectedSchedule(null); // Clear the invalid selection
        return;
      }

      // Check if there are enough spots for the requested number of guests
      if (guests > selectedScheduleData.availableSpots) {
        alert(`Only ${selectedScheduleData.availableSpots} spot${selectedScheduleData.availableSpots !== 1 ? 's' : ''} available for this schedule. Please reduce the number of guests or choose another date.`);
        return;
      }
    } else {
      // Fallback to demo data if no real schedules
      console.warn('No real schedule data available, using demo data');
      return;
    }

    // Navigate to checkout contact page with data
    const searchParams = new URLSearchParams({
      experienceId: displayData.experienceId || displayData.id,
      scheduleId: selectedScheduleData.scheduleId || selectedScheduleData.id,
      participants: guests.toString()
    });

    navigate(`/checkout/contact?${searchParams.toString()}`);
  };
  return (
    <div className={`bg-white border border-neutrals-6 rounded-2xl shadow-lg ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Price Section */}
      <div className={isMobile ? 'mb-4' : 'mb-6'}>
        <div className={`flex items-baseline gap-${isMobile ? '2' : '3'} mb-2`}>
          <span className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-neutrals-2`}>
            ${displayData.price || '89'}
          </span>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-4`}>/person</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-neutrals-2`}>
            {averageRating > 0 ? Number(averageRating).toFixed(1) : (displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '0.0')}
          </span>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-4`}>
            ({totalReviews > 0 ? totalReviews : (displayData.totalReviews || 0)} review{(totalReviews > 0 ? totalReviews : (displayData.totalReviews || 0)) !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Duration Display */}
        {formatDuration(displayData, schedulesData) && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-neutrals-4" />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-4`}>
              {formatDuration(displayData, schedulesData)}
            </span>
          </div>
        )}
      </div>

      {/* Available Schedules */}
      <div className={`space-y-${isMobile ? '2' : '3'} mb-4`}>
        {schedulesData && schedulesData.length > 0 ? (() => {
          // Filter available schedules
          const availableSchedules = schedulesData.filter(schedule => {
            // Filter out schedules with no available spots or not available
            return schedule.availableSpots > 0 && schedule.isAvailable !== false;
          });

          // Check if there are any available schedules
          if (availableSchedules.length === 0) {
            return (
              <div className="text-center py-6 text-neutrals-4">
                <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2`}>
                  No Available Dates
                </div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                  All schedules for this experience are currently full. Please check back later or contact the host.
                </div>
              </div>
            );
          }

          // Display available schedules
          return availableSchedules
            .slice(0, isMobile ? 3 : 5)
            .map((schedule, index) => {
              // Get the original index in the full schedulesData array for proper state tracking
              const originalIndex = schedulesData.findIndex(s => s.scheduleId === schedule.scheduleId);

              return (
                <div
                  key={schedule.scheduleId || index}
                  className={`border-2 rounded-lg p-3 transition-colors cursor-pointer relative ${selectedSchedule === originalIndex
                    ? 'border-primary-1 bg-primary-1'
                    : 'border-neutrals-6 hover:border-primary-1'
                    }`}
                  onClick={() => setSelectedSchedule(isMobile && selectedSchedule === originalIndex ? null : originalIndex)}
                >
                  {isMobile && selectedSchedule === originalIndex && (
                    <div className="absolute inset-0 bg-primary-1 rounded-lg"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      {(() => {
                        const formattedSchedule = formatScheduleDisplay(schedule);
                        return (
                          <>
                            <div className={`font-semibold ${isMobile ? 'text-xs' : ''} ${selectedSchedule === originalIndex ? 'text-white' : 'text-neutrals-2'}`}>
                              {formattedSchedule.dateText}
                            </div>
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'} ${selectedSchedule === originalIndex ? 'text-white opacity-90' : 'text-neutrals-4'}`}>
                              {formattedSchedule.timeText}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} ${selectedSchedule === originalIndex ? 'text-white opacity-90' : 'text-neutrals-4'}`}>
                      {schedule.availableSpots} spot{schedule.availableSpots !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </div>
              );
            });
        })() : (
          // No schedule data available
          <div className={`text-center py-6 text-neutrals-4`}>
            <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium mb-2`}>
              No Schedule Data
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
              Schedule information is currently unavailable. Please contact the host for booking details.
            </div>
          </div>
        )}

        {/* Show All Dates Link - Only show if there are available schedules */}
        {schedulesData && schedulesData.length > 0 &&
          schedulesData.filter(schedule => schedule.availableSpots > 0 && schedule.isAvailable !== false).length > 0 && (
            <button
              className={`w-full text-center text-neutrals-4 hover:text-primary-1 transition-colors py-2 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}
              onClick={() => setShowAllSchedules(true)}
            >
              Show all dates
            </button>
          )}
      </div>

      {/* Guest Selection */}
      {isMobile ? (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-neutrals-2 mb-2">Guests</label>
          <div className="flex items-center justify-between border border-neutrals-6 rounded-lg px-3 py-2">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-6 h-6 rounded-full border border-neutrals-5 flex items-center justify-center hover:bg-neutrals-7 transition-colors"
            >
              <span className="text-neutrals-3">-</span>
            </button>
            <span className="text-sm font-medium text-neutrals-2">{guests} guests</span>
            <button
              onClick={() => setGuests(Math.min(getMaxAllowedGuests(), guests + 1))}
              className="w-6 h-6 rounded-full border border-neutrals-5 flex items-center justify-center hover:bg-neutrals-7 transition-colors"
              disabled={guests >= getMaxAllowedGuests()}
            >
              <span className="text-neutrals-3">+</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 border-t border-neutrals-6 pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-neutrals-2">Guests</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-8 h-8 rounded-full border border-neutrals-6 flex items-center justify-center hover:bg-neutrals-7 disabled:opacity-50"
                disabled={guests <= 1}
              >
                <span className="text-neutrals-2">-</span>
              </button>
              <span className="text-neutrals-2 min-w-[2rem] text-center">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(getMaxAllowedGuests(), guests + 1))}
                className="w-8 h-8 rounded-full border border-neutrals-6 flex items-center justify-center hover:bg-neutrals-7 disabled:opacity-50"
                disabled={guests >= getMaxAllowedGuests()}
              >
                <span className="text-neutrals-2">+</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      {isMobile && (
        <div className="mb-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutrals-4">${displayData.price || '89'} x {guests} guests</span>
              <span className="text-neutrals-2">${((displayData.price || 89) * guests)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutrals-4">Service fee</span>
              <span className="text-neutrals-2">${Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
            </div>
            <div className="border-t border-neutrals-6 pt-2 flex justify-between font-semibold">
              <span className="text-neutrals-2">Total</span>
              <span className="text-neutrals-2">${((displayData.price || 89) * guests) + Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Book Now Button */}
      <button
        onClick={handleBookNow}
        className={`w-full py-3 rounded-${isMobile ? 'lg' : 'full'} font-bold transition-colors ${isMobile ? 'text-sm' : ''} ${selectedSchedule === null
          ? 'bg-neutrals-5 text-neutrals-4 cursor-not-allowed'
          : 'bg-primary-1 text-white hover:bg-opacity-90'
          } ${isMobile ? 'mb-0' : 'mb-4'}`}
        disabled={selectedSchedule === null}
        style={!isMobile ? { fontFamily: 'DM Sans' } : {}}
      >
        {selectedSchedule === null ? 'Select a date to book' : 'Book Now'}
      </button>

      {/* Chat with Guide Button */}
      <button
        onClick={onChatWithGuide}
        className={`w-full py-3 rounded-${isMobile ? 'lg' : 'full'} font-bold transition-colors ${isMobile ? 'text-sm' : ''} border-2 border-primary-1 text-primary-1 hover:bg-primary-1 hover:text-white ${isMobile ? 'mb-0' : 'mb-4'}`}
        style={!isMobile ? { fontFamily: 'DM Sans' } : {}}
      >
        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat with Guide
      </button>

      {/* Standardized Cancellation Policy - Desktop only */}
      {!isMobile && (
        <div className="text-center text-xs text-neutrals-4 mb-4">
          <div className="space-y-1">
            <p><strong>Free Cancellation:</strong> 24 hours after purchase</p>
            <p><strong>7+ days before:</strong> Full refund (minus service fee)</p>
            <p><strong>3-6 days before:</strong> 50% refund</p>
            <p><strong>Less than 48 hours:</strong> Non-refundable</p>
          </div>
        </div>
      )}

      {/* Price Breakdown - Desktop only */}
      {!isMobile && (
        <div className="border-t border-neutrals-6 pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutrals-4">${displayData.price || '89'} x {guests} guests</span>
              <span className="text-neutrals-2">${((displayData.price || 89) * guests)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutrals-4">Service fee</span>
              <span className="text-neutrals-2">${Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
            </div>
            <div className="border-t border-neutrals-6 pt-2 flex justify-between font-semibold">
              <span className="text-neutrals-2">Total</span>
              <span className="text-neutrals-2">${((displayData.price || 89) * guests) + Math.round(((displayData.price || 89) * guests) * 0.1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingWidget;