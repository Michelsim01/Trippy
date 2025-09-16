import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import { generateScheduleRecords, isMultiDayTour, getTourDurationInDays, validateManualDateSelection } from '../utils/scheduleGenerator';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function EditExperienceAvailabilityPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    formData: contextData,
    updateFormData,
    isEditMode,
    experienceId,
    hasBookings,
    toggleBookings,
    isFieldRestricted,
    saveCurrentChanges,
    loadExistingExperience
  } = useFormData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dateValidationError, setDateValidationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState(new Set(contextData?.availability?.selectedDates || []));
  const [blockedDates, setBlockedDates] = useState(new Set(contextData?.availability?.blockedDates || []));

  // Initialize form data for direct page access
  useEffect(() => {
    const initializeData = async () => {
      if (id && (!isEditMode || experienceId !== id)) {
        try {
          await loadExistingExperience(id);
        } catch (error) {
          console.error('Failed to load experience data:', error);
        }
      }
      setIsLoading(false);
    };

    initializeData();
  }, [id, isEditMode, experienceId, loadExistingExperience]);

  // Extract the experience's start time if available (in 24-hour format for time input)
  const getDefaultTimeSlot = () => {
    // Check if we have a valid startDateTime (not empty string)
    if (contextData?.startDateTime && contextData.startDateTime !== '') {
      try {
        const startTime = new Date(contextData.startDateTime);

        // Check if the date is valid
        if (!isNaN(startTime.getTime())) {
          const hours = startTime.getHours();
          const minutes = startTime.getMinutes();
          // Return in 24-hour format (HH:MM) for HTML time input
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

          return formattedTime;
        }
      } catch (error) {
        console.error('Error parsing start time:', error);
      }
    }

    return '10:00'; // 10:00 in 24-hour format
  };

  // Initialize recurring schedule with proper defaults
  const initializeTimeSlots = () => {
    // If we have saved time slots, validate and use them
    if (contextData?.availability?.recurringSchedule?.timeSlots?.length > 0) {
      // Convert any 12-hour format slots to 24-hour format for the time input
      const convertedSlots = contextData.availability.recurringSchedule.timeSlots.map(slot => {
        // If already in 24-hour format (HH:mm), keep it
        if (slot && slot.match(/^\d{2}:\d{2}$/)) {
          return slot;
        }
        // If in 12-hour format with AM/PM, convert to 24-hour
        if (slot && (slot.includes('AM') || slot.includes('PM'))) {
          const [time, period] = slot.split(' ');
          const [hours, minutes] = time.split(':');
          let hour = parseInt(hours);

          if (period === 'PM' && hour !== 12) {
            hour += 12;
          } else if (period === 'AM' && hour === 12) {
            hour = 0;
          }

          return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        return null;
      }).filter(slot => slot !== null);

      if (convertedSlots.length > 0) {
        return convertedSlots;
      }
    }

    // Otherwise use the default from experience start time
    return [getDefaultTimeSlot()];
  };

  const [recurringSchedule, setRecurringSchedule] = useState({
    enabled: contextData?.availability?.recurringSchedule?.enabled || false,
    daysOfWeek: contextData?.availability?.recurringSchedule?.daysOfWeek || [],
    timeSlots: initializeTimeSlots()
  });

  // Check if this is a multi-day tour
  const isMultiDay = isMultiDayTour(contextData?.startDateTime, contextData?.endDateTime);
  const tourDurationDays = isMultiDay ? getTourDurationInDays(contextData?.startDateTime, contextData?.endDateTime) : 1;

  // Disable recurring schedule for multi-day tours
  useEffect(() => {
    if (isMultiDay && recurringSchedule.enabled) {
      setRecurringSchedule(prev => ({
        ...prev,
        enabled: false
      }));
    }
  }, [isMultiDay]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const toggleDate = (day) => {
    if (isFieldRestricted('availability')) {
      return;
    }

    const dateStr = formatDate(day);
    const newSelected = new Set(selectedDates);
    const newBlocked = new Set(blockedDates);

    // Clear any previous validation error
    setDateValidationError(null);

    if (selectedDates.has(dateStr)) {
      // Removing a selected date - allow this
      newSelected.delete(dateStr);
      newBlocked.add(dateStr);
    } else if (blockedDates.has(dateStr)) {
      // Removing from blocked dates - allow this
      newBlocked.delete(dateStr);
    } else {
      // Adding a new selected date - validate for multi-day tours
      if (isMultiDay) {
        const validation = validateManualDateSelection(
          dateStr,
          {
            startDateTime: contextData?.startDateTime,
            endDateTime: contextData?.endDateTime
          },
          Array.from(selectedDates),
          Array.from(blockedDates)
        );

        if (!validation.isValid) {
          setDateValidationError(validation.conflictReason);
          return; // Don't add the date if validation fails
        }
      }

      newSelected.add(dateStr);
    }

    setSelectedDates(newSelected);
    setBlockedDates(newBlocked);
  };

  const isPastDate = (day) => {
    const today = new Date();
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate < today;
  };

  const getDateStatus = (day) => {
    const dateStr = formatDate(day);
    const isAvailable = selectedDates.has(dateStr);
    const isBlocked = blockedDates.has(dateStr);
    const isPast = isPastDate(day);

    // For multi-day tours, check if this date would conflict
    let wouldConflict = false;
    let conflictReason = '';

    if (isMultiDay && !isAvailable && !isBlocked && !isPast) {
      const validation = validateManualDateSelection(
        dateStr,
        {
          startDateTime: contextData?.startDateTime,
          endDateTime: contextData?.endDateTime
        },
        Array.from(selectedDates),
        Array.from(blockedDates)
      );

      if (!validation.isValid) {
        wouldConflict = true;
        conflictReason = validation.conflictReason;
      }
    }

    return {
      isAvailable,
      isBlocked,
      isPast,
      wouldConflict,
      conflictReason
    };
  };

  const toggleDayOfWeek = (day) => {
    if (isFieldRestricted('availability')) {
      return;
    }

    setRecurringSchedule(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const addTimeSlot = () => {
    if (isFieldRestricted('availability')) {
      return;
    }

    // Add a default afternoon slot (14:00 in 24-hour format)
    setRecurringSchedule(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, '14:00']
    }));
  };

  const updateTimeSlot = (index, time) => {
    if (isFieldRestricted('availability')) {
      return;
    }

    // Validate the time input
    if (time && time !== '') {
      setRecurringSchedule(prev => ({
        ...prev,
        timeSlots: prev.timeSlots.map((t, i) => i === index ? time : t)
      }));
    }
  };

  const removeTimeSlot = (index) => {
    if (isFieldRestricted('availability')) {
      return;
    }

    setRecurringSchedule(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleSaveChanges = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Auto-enable recurring schedule if user has selected days and times
      const shouldEnableRecurring = recurringSchedule.daysOfWeek.length > 0 && recurringSchedule.timeSlots.length > 0;

      // Prepare availability data
      const availabilityData = {
        selectedDates: Array.from(selectedDates),
        blockedDates: Array.from(blockedDates),
        recurringSchedule: {
          ...recurringSchedule,
          enabled: shouldEnableRecurring // Auto-enable if user has configured recurring schedule
        }
      };

      console.log('Availability data being used for schedule generation:', availabilityData);

      // Generate schedule records (preventing duplicates)
      const schedules = generateScheduleRecords(
        availabilityData,
        contextData?.duration || 3, // Use experience duration from previous step, default 3 hours
        3, // Generate 3 months of schedules
        {
          startDateTime: contextData?.startDateTime,
          endDateTime: contextData?.endDateTime,
          participantsAllowed: parseInt(contextData?.participantsAllowed) || 10
        } // Pass experience info for multi-day detection and max participants
      );

      // Prepare complete data including availability and schedules
      const completeData = {
        ...contextData,
        availability: availabilityData,
        schedules: schedules
      };

      console.log(`Generated ${schedules.length} schedule records`);
      console.log('Sample schedules:', schedules.slice(0, 3));
      console.log('Saving availability changes:', completeData);

      await saveCurrentChanges(completeData);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save availability changes:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/edit-experience/${id}/pricing`);
  };

  const handleNext = () => {
    // For edit mode, this could navigate to a summary page or back to experience details
    navigate(`/experience/${id}`);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Show loading screen for direct page access
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
          <p className="text-neutrals-3">Loading experience data...</p>
        </div>
      </div>
    );
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
          <div className="max-w-7xl mx-auto py-16" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div className="mb-16">
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Edit Experience</h1>
              <div className="flex items-start gap-16" style={{marginBottom: '30px'}}>
                {[
                  { step: 1, label: "Basic Info", active: false },
                  { step: 2, label: "Details", active: false },
                  { step: 3, label: "Pricing", active: false },
                  { step: 4, label: "Availability", active: true }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col">
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        item.active ? 'bg-neutrals-1' : 'bg-neutrals-5'
                      }`}>
                        {item.step}
                      </div>
                      <span className={`text-lg font-semibold ${
                        item.active ? 'text-neutrals-1' : 'text-neutrals-5'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: item.active ? '#000' : '#d1d5db',
                        width: '240px',
                        height: item.active ? '4px' : '2px',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                ))}
              </div>

            {/* Booking Toggle Section */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-neutrals-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutrals-1 mb-2">Booking Status</h3>
                  <p className="text-sm text-neutrals-3">
                    Toggle this to simulate whether this experience has existing bookings.
                    When enabled, certain fields will be restricted to prevent conflicts with existing bookings.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${hasBookings ? 'text-neutrals-3' : 'text-neutrals-1 font-medium'}`}>
                    No Bookings
                  </span>
                  <button
                    onClick={toggleBookings}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-1 focus:ring-offset-2 ${
                      hasBookings ? 'bg-primary-1' : 'bg-neutrals-6'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasBookings ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${hasBookings ? 'text-neutrals-1 font-medium' : 'text-neutrals-3'}`}>
                    Has Bookings
                  </span>
                </div>
              </div>
              {hasBookings && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    <strong>Booking restrictions active:</strong> Some fields cannot be modified due to existing bookings
                  </p>
                </div>
              )}
            </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              <div className="lg:col-span-3">
                <div className="space-y-8">
                  {/* Recurring Schedule */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Recurring Schedule</label>
                    <div className={`bg-white border-2 rounded-xl p-6 ${
                      isFieldRestricted('availability') ? 'border-orange-300 bg-orange-50' : 'border-neutrals-6'
                    }`}>
                      {isFieldRestricted('availability') && (
                        <div className="mb-4 p-4 bg-orange-100 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-700 font-medium mb-2">
                            🔒 Availability settings cannot be modified due to existing bookings
                          </p>
                          <p className="text-xs text-orange-600">
                            To change availability: Create a new experience with your desired schedule, then archive this one after existing bookings are completed.
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-neutrals-1">Set Recurring Schedule</h3>
                          {isMultiDay ? (
                            <p className="text-sm text-orange-600 mt-1">
                              Recurring schedules disabled for multi-day tours ({tourDurationDays} days). Use manual date selection below.
                            </p>
                          ) : (
                            <p className="text-sm text-neutrals-3 mt-1">Offer this experience on regular days</p>
                          )}
                        </div>
                        <button
                          onClick={() => !isMultiDay && !isFieldRestricted('availability') && setRecurringSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                          disabled={isMultiDay || isFieldRestricted('availability')}
                          className={`w-14 h-7 rounded-full relative transition-colors ${
                            isMultiDay || isFieldRestricted('availability') ? 'bg-neutrals-6 cursor-not-allowed' :
                            recurringSchedule.enabled ? 'bg-primary-1' : 'bg-neutrals-5'
                          }`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${
                            recurringSchedule.enabled && !isMultiDay && !isFieldRestricted('availability') ? 'translate-x-7' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {recurringSchedule.enabled && (
                        <div className="space-y-6">
                          {/* Days of Week */}
                          <div>
                            <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Available Days</label>
                            <div className="grid grid-cols-7 gap-2">
                              {daysOfWeek.map((day, index) => (
                                <button
                                  key={day}
                                  onClick={() => !isFieldRestricted('availability') && toggleDayOfWeek(index)}
                                  disabled={isFieldRestricted('availability')}
                                  className={`text-sm font-medium py-3 rounded-lg transition-colors ${
                                    isFieldRestricted('availability') ? 'cursor-not-allowed opacity-50' : ''
                                  } ${
                                    recurringSchedule.daysOfWeek.includes(index)
                                      ? 'bg-primary-1 text-white'
                                      : 'bg-neutrals-7 text-neutrals-3 hover:bg-neutrals-6'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Time Slots */}
                          <div>
                            <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Time Slots</label>
                            {!isMultiDay && (
                              <p className="text-xs text-neutrals-3 mb-2">Each time slot creates a separate booking option for the selected days</p>
                            )}
                            <div className="space-y-3">
                              {recurringSchedule.timeSlots.map((time, index) => (
                                <div key={index} className="flex gap-3">
                                  <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => updateTimeSlot(index, e.target.value)}
                                    disabled={isFieldRestricted('availability')}
                                    className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none text-lg font-medium transition-colors ${
                                      isFieldRestricted('availability')
                                        ? 'border-orange-300 bg-orange-50 text-orange-700 cursor-not-allowed'
                                        : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                                    }`}
                                    style={{padding: '6px'}}
                                  />
                                  {recurringSchedule.timeSlots.length > 1 && (
                                    <button
                                      onClick={() => !isFieldRestricted('availability') && removeTimeSlot(index)}
                                      disabled={isFieldRestricted('availability')}
                                      className={`w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors ${
                                        isFieldRestricted('availability') ? 'cursor-not-allowed opacity-50' : ''
                                      }`}
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={addTimeSlot}
                                disabled={isFieldRestricted('availability')}
                                className={`flex items-center gap-2 font-medium transition-colors ${
                                  isFieldRestricted('availability')
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-primary-1 hover:text-primary-1/80'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                Add time slot
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Specific Dates (Optional)</label>
                    <div className={`bg-white border-2 rounded-xl p-6 ${
                      isFieldRestricted('availability') ? 'border-orange-300 bg-orange-50' : 'border-neutrals-6'
                    }`}>
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <button
                          onClick={() => {
                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
                            setDateValidationError(null);
                          }}
                          className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-neutrals-3" />
                        </button>
                        <h3 className="text-lg font-semibold text-neutrals-1">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <button
                          onClick={() => {
                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
                            setDateValidationError(null);
                          }}
                          className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-neutrals-3" />
                        </button>
                      </div>

                      {/* Days of Week Header */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {daysOfWeek.map(day => (
                          <div key={day} className="text-center text-sm font-medium text-neutrals-4 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {getDaysInMonth(currentMonth).map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} className="aspect-square" />;

                          const status = getDateStatus(day);

                          return (
                            <button
                              key={day}
                              onClick={() => !status.isPast && !isFieldRestricted('availability') && toggleDate(day)}
                              disabled={status.isPast || status.wouldConflict || isFieldRestricted('availability')}
                              title={status.wouldConflict ? status.conflictReason : isFieldRestricted('availability') ? 'Blocked due to existing bookings' : undefined}
                              className={`
                                aspect-square rounded-lg text-sm font-medium relative transition-colors
                                ${status.isPast || isFieldRestricted('availability') ? 'cursor-not-allowed' : 'cursor-pointer'}
                                ${isFieldRestricted('availability') ? 'opacity-50' : ''}
                                ${status.isAvailable ? 'bg-primary-1 text-white hover:bg-primary-1/90' : ''}
                                ${status.isBlocked ? 'bg-neutrals-5 text-white' : ''}
                                ${status.wouldConflict ? 'bg-red-100 text-red-600 cursor-not-allowed border border-red-300' : ''}
                                ${!status.isAvailable && !status.isBlocked && !status.isPast && !status.wouldConflict && !isFieldRestricted('availability') ? 'hover:bg-neutrals-7 text-neutrals-2' : ''}
                                ${status.isPast ? 'text-neutrals-5' : ''}
                              `}
                            >
                              {day}
                              {status.isBlocked && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-full h-0.5 bg-white rotate-45"></div>
                                </div>
                              )}
                              {status.wouldConflict && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-red-500 text-xs">⚠</div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Date Validation Error */}
                      {dateValidationError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">
                            ⚠️ {dateValidationError}
                          </p>
                        </div>
                      )}

                      {/* Legend */}
                      <div className="flex gap-6 mt-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-primary-1 rounded"></div>
                          <span className="text-neutrals-2">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-neutrals-5 rounded relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-0.5 bg-white rotate-45"></div>
                            </div>
                          </div>
                          <span className="text-neutrals-2">Blocked</span>
                        </div>
                        {isMultiDay && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-red-500 text-xs">⚠</div>
                              </div>
                            </div>
                            <span className="text-neutrals-2">Conflicts</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-neutrals-4 mt-4">
                        {isFieldRestricted('availability')
                          ? 'Calendar interactions disabled due to existing bookings'
                          : 'Click once to mark available, twice to block, three times to clear'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {saveSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-green-800 text-sm font-medium">
                      ✅ Availability changes saved successfully!
                    </div>
                  </div>
                )}

                {saveError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800 text-sm">
                      <strong>Error:</strong> {saveError}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex gap-4" style={{marginBottom: '50px'}}>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex-1 bg-white border-2 border-primary-1 text-primary-1 font-bold py-6 rounded-full hover:bg-primary-1 hover:text-white transition-colors text-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleBack}
                    disabled={isSaving}
                    className="w-1/4 border-2 border-neutrals-5 text-neutrals-2 font-bold py-6 rounded-full hover:bg-neutrals-7 transition-colors text-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isSaving}
                    className="w-1/4 bg-primary-1 text-white font-bold py-6 rounded-full hover:opacity-90 transition-colors text-xl shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div className="bg-white border-2 border-neutrals-6 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Availability Summary</h3>
                    <div className="space-y-4">
                      {recurringSchedule.enabled && (
                        <div>
                          <h4 className="font-medium text-neutrals-2 mb-2">Recurring Schedule</h4>
                          <p className="text-sm text-neutrals-3">
                            {recurringSchedule.daysOfWeek.length > 0
                              ? `${recurringSchedule.daysOfWeek.map(d => daysOfWeek[d]).join(', ')} at ${recurringSchedule.timeSlots.join(', ')}`
                              : 'No recurring schedule set'
                            }
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-neutrals-2 mb-2">Specific Dates</h4>
                        <p className="text-sm text-neutrals-3">
                          {selectedDates.size} available dates selected
                        </p>
                        <p className="text-sm text-neutrals-3">
                          {blockedDates.size} dates blocked
                        </p>
                      </div>
                    </div>
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
          isAuthenticated={true}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />

        <main className="w-full">
          <div className="py-10" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Edit Experience</h1>

              <div className="flex gap-4 items-center" style={{marginBottom: '20px'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-neutrals-2">
                  4
                </div>
                <span className="text-base font-medium text-neutrals-1">
                  Availability
                </span>
              </div>

            {/* Booking Toggle Section */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-neutrals-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutrals-1 mb-2">Booking Status</h3>
                  <p className="text-xs text-neutrals-3">
                    Toggle to simulate whether this experience has existing bookings.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${hasBookings ? 'text-neutrals-3' : 'text-neutrals-1 font-medium'}`}>
                    No Bookings
                  </span>
                  <button
                    onClick={toggleBookings}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-1 focus:ring-offset-2 ${
                      hasBookings ? 'bg-primary-1' : 'bg-neutrals-6'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        hasBookings ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs ${hasBookings ? 'text-neutrals-1 font-medium' : 'text-neutrals-3'}`}>
                    Has Bookings
                  </span>
                </div>
              </div>
              {hasBookings && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-xs text-orange-700">
                    <strong>Booking restrictions active:</strong> Some fields cannot be modified due to existing bookings
                  </p>
                </div>
              )}
            </div>

            </div>

            <div className="space-y-6">
              {/* Recurring Schedule */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Recurring Schedule</label>
                <div className={`bg-white border-2 rounded-xl p-4 ${
                  isFieldRestricted('availability') ? 'border-orange-300 bg-orange-50' : 'border-neutrals-6'
                }`}>
                  {isFieldRestricted('availability') && (
                    <div className="mb-3 p-3 bg-orange-100 border border-orange-200 rounded">
                      <p className="text-xs text-orange-700 font-medium mb-1">
                        🔒 Blocked due to existing bookings
                      </p>
                      <p className="text-xs text-orange-600">
                        Create a new experience instead to change availability.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-neutrals-1">Set Recurring Schedule</h3>
                      {isMultiDay ? (
                        <p className="text-xs text-orange-600 mt-1">
                          Disabled for {tourDurationDays}-day tours. Use manual dates.
                        </p>
                      ) : (
                        <p className="text-xs text-neutrals-3 mt-1">Offer on regular days</p>
                      )}
                    </div>
                    <button
                      onClick={() => !isMultiDay && !isFieldRestricted('availability') && setRecurringSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                      disabled={isMultiDay || isFieldRestricted('availability')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        isMultiDay || isFieldRestricted('availability') ? 'bg-neutrals-6 cursor-not-allowed' :
                        recurringSchedule.enabled ? 'bg-primary-1' : 'bg-neutrals-5'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        recurringSchedule.enabled && !isMultiDay && !isFieldRestricted('availability') ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {recurringSchedule.enabled && (
                    <div className="space-y-4">
                      {/* Days of Week */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">Available Days</label>
                        <div className="grid grid-cols-7 gap-1">
                          {daysOfWeek.map((day, index) => (
                            <button
                              key={day}
                              onClick={() => !isFieldRestricted('availability') && toggleDayOfWeek(index)}
                              disabled={isFieldRestricted('availability')}
                              className={`text-xs font-medium py-2 rounded transition-colors ${
                                isFieldRestricted('availability') ? 'cursor-not-allowed opacity-50' : ''
                              } ${
                                recurringSchedule.daysOfWeek.includes(index)
                                  ? 'bg-primary-1 text-white'
                                  : 'bg-neutrals-7 text-neutrals-3'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">Time Slots</label>
                        {!isMultiDay && (
                          <p className="text-xs text-neutrals-3 mb-1">Each time slot creates a separate booking option</p>
                        )}
                        <div className="space-y-2">
                          {recurringSchedule.timeSlots.map((time, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="time"
                                value={time}
                                onChange={(e) => updateTimeSlot(index, e.target.value)}
                                disabled={isFieldRestricted('availability')}
                                className={`flex-1 px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-medium transition-colors ${
                                  isFieldRestricted('availability')
                                    ? 'border-orange-300 bg-orange-50 text-orange-700 cursor-not-allowed'
                                    : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                                }`}
                                style={{padding: '6px'}}
                              />
                              {recurringSchedule.timeSlots.length > 1 && (
                                <button
                                  onClick={() => !isFieldRestricted('availability') && removeTimeSlot(index)}
                                  disabled={isFieldRestricted('availability')}
                                  className={`w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors ${
                                    isFieldRestricted('availability') ? 'cursor-not-allowed opacity-50' : ''
                                  }`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addTimeSlot}
                            disabled={isFieldRestricted('availability')}
                            className={`flex items-center gap-2 text-sm font-medium ${
                              isFieldRestricted('availability')
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-primary-1'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            Add time slot
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Calendar */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Specific Dates (Optional)</label>
                <div className={`bg-white border-2 rounded-xl p-4 ${
                  isFieldRestricted('availability') ? 'border-orange-300 bg-orange-50' : 'border-neutrals-6'
                }`}>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
                        setDateValidationError(null);
                      }}
                      className="p-1 hover:bg-neutrals-7 rounded transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutrals-3" />
                    </button>
                    <h3 className="text-sm font-semibold text-neutrals-1">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                      onClick={() => {
                        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
                        setDateValidationError(null);
                      }}
                      className="p-1 hover:bg-neutrals-7 rounded transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-neutrals-3" />
                    </button>
                  </div>

                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-neutrals-4 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, index) => {
                      if (!day) return <div key={`empty-${index}`} className="aspect-square" />;

                      const status = getDateStatus(day);

                      return (
                        <button
                          key={day}
                          onClick={() => !status.isPast && !isFieldRestricted('availability') && toggleDate(day)}
                          disabled={status.isPast || status.wouldConflict || isFieldRestricted('availability')}
                          title={status.wouldConflict ? status.conflictReason : isFieldRestricted('availability') ? 'Blocked due to bookings' : undefined}
                          className={`
                            aspect-square rounded text-xs font-medium relative transition-colors
                            ${status.isPast || isFieldRestricted('availability') ? 'cursor-not-allowed' : 'cursor-pointer'}
                            ${isFieldRestricted('availability') ? 'opacity-50' : ''}
                            ${status.isAvailable ? 'bg-primary-1 text-white' : ''}
                            ${status.isBlocked ? 'bg-neutrals-5 text-white' : ''}
                            ${status.wouldConflict ? 'bg-red-100 text-red-600 cursor-not-allowed border border-red-300' : ''}
                            ${!status.isAvailable && !status.isBlocked && !status.isPast && !status.wouldConflict && !isFieldRestricted('availability') ? 'hover:bg-neutrals-7 text-neutrals-2' : ''}
                            ${status.isPast ? 'text-neutrals-5' : ''}
                          `}
                        >
                          {day}
                          {status.isBlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-0.5 bg-white rotate-45"></div>
                            </div>
                          )}
                          {status.wouldConflict && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-red-500" style={{fontSize: '8px'}}>⚠</div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Date Validation Error */}
                  {dateValidationError && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700 font-medium">
                        ⚠️ {dateValidationError}
                      </p>
                    </div>
                  )}

                  {/* Legend */}
                  <div className="flex gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-primary-1 rounded"></div>
                      <span className="text-neutrals-2">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-neutrals-5 rounded relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-white rotate-45"></div>
                        </div>
                      </div>
                      <span className="text-neutrals-2">Blocked</span>
                    </div>
                    {isMultiDay && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-red-500" style={{fontSize: '8px'}}>⚠</div>
                          </div>
                        </div>
                        <span className="text-neutrals-2">Conflicts</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutrals-4 mt-3">
                    {isFieldRestricted('availability')
                      ? 'Calendar disabled due to existing bookings'
                      : 'Click once for available, twice to block, three times to clear'
                    }
                  </p>
                </div>
              </div>

              {/* Success/Error Messages - Mobile */}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-800 text-xs font-medium">
                    ✅ Changes saved successfully!
                  </div>
                </div>
              )}

              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-xs">
                    <strong>Error:</strong> {saveError}
                  </div>
                </div>
              )}

              <div className="flex gap-3" style={{marginBottom: '15px'}}>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex-1 bg-white border-2 border-primary-1 text-primary-1 font-bold py-4 rounded-full hover:bg-primary-1 hover:text-white transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleBack}
                  disabled={isSaving}
                  className="w-1/4 border-2 border-neutrals-5 text-neutrals-2 font-bold py-4 rounded-full hover:bg-neutrals-7 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="w-1/4 bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}