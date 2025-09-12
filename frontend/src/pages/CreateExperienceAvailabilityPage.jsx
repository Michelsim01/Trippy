import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import { generateScheduleRecords } from '../utils/scheduleGenerator';
import { experienceApi } from '../services/experienceApi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function CreateExperienceAvailabilityPage() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData, getBackendPayload } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState(new Set(contextData?.availability?.selectedDates || []));
  const [blockedDates, setBlockedDates] = useState(new Set(contextData?.availability?.blockedDates || []));
  
  const [recurringSchedule, setRecurringSchedule] = useState({
    enabled: contextData?.availability?.recurringSchedule?.enabled || false,
    daysOfWeek: contextData?.availability?.recurringSchedule?.daysOfWeek || [],
    timeSlots: contextData?.availability?.recurringSchedule?.timeSlots || ['10:00'],
    maxGroupSize: contextData?.availability?.recurringSchedule?.maxGroupSize || 10
  });

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
    const dateStr = formatDate(day);
    const newSelected = new Set(selectedDates);
    const newBlocked = new Set(blockedDates);
    
    if (selectedDates.has(dateStr)) {
      newSelected.delete(dateStr);
      newBlocked.add(dateStr);
    } else if (blockedDates.has(dateStr)) {
      newBlocked.delete(dateStr);
    } else {
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

  const toggleDayOfWeek = (day) => {
    setRecurringSchedule(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) 
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const addTimeSlot = () => {
    setRecurringSchedule(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, '14:00']
    }));
  };

  const updateTimeSlot = (index, time) => {
    setRecurringSchedule(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((t, i) => i === index ? time : t)
    }));
  };

  const removeTimeSlot = (index) => {
    setRecurringSchedule(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleNext = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Prepare availability data
      const availabilityData = {
        selectedDates: Array.from(selectedDates),
        blockedDates: Array.from(blockedDates),
        recurringSchedule
      };
      
      // Generate schedule records (preventing duplicates)
      const schedules = generateScheduleRecords(
        availabilityData,
        contextData?.duration || 3, // Use experience duration from previous step, default 3 hours
        3 // Generate 3 months of schedules
      );
      
      // Update form data with both availability rules and generated schedules
      updateFormData({
        availability: availabilityData,
        schedules: schedules
      });
      
      console.log(`Generated ${schedules.length} schedule records`);
      
      // Get the complete backend payload
      const payload = getBackendPayload();
      console.log('Submitting payload to backend:', payload);
      
      // Call the API to create the experience
      const response = await experienceApi.createExperience(payload);
      console.log('Experience created successfully:', response);
      
      // Store the created experience data for the success page
      updateFormData({
        createdExperience: {
          experienceId: response.experienceId,
          success: response.success,
          message: response.message
        }
      });
      
      // Navigate to success page
      navigate('/create-experience/success');
      
    } catch (error) {
      console.error('Failed to create experience:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Create New Experience</h1>
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
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              <div className="lg:col-span-3">
                <div className="space-y-8">
                  {/* Recurring Schedule */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Recurring Schedule</label>
                    <div className="bg-white border-2 border-neutrals-6 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-neutrals-1">Set Recurring Schedule</h3>
                          <p className="text-sm text-neutrals-3 mt-1">Offer this experience on regular days</p>
                        </div>
                        <button
                          onClick={() => setRecurringSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={`w-14 h-7 rounded-full relative transition-colors ${
                            recurringSchedule.enabled ? 'bg-primary-1' : 'bg-neutrals-5'
                          }`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${
                            recurringSchedule.enabled ? 'translate-x-7' : 'translate-x-0.5'
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
                                  onClick={() => toggleDayOfWeek(index)}
                                  className={`text-sm font-medium py-3 rounded-lg transition-colors ${
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
                            <div className="space-y-3">
                              {recurringSchedule.timeSlots.map((time, index) => (
                                <div key={index} className="flex gap-3">
                                  <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => updateTimeSlot(index, e.target.value)}
                                    className="flex-1 px-4 py-3 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors"
                                    style={{padding: '6px'}}
                                  />
                                  {recurringSchedule.timeSlots.length > 1 && (
                                    <button
                                      onClick={() => removeTimeSlot(index)}
                                      className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={addTimeSlot}
                                className="flex items-center gap-2 text-primary-1 hover:text-primary-1/80 font-medium transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Add time slot
                              </button>
                            </div>
                          </div>
                          
                          {/* Max Group Size */}
                          <div>
                            <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Max Group Size</label>
                            <input
                              type="number"
                              value={recurringSchedule.maxGroupSize}
                              onChange={(e) => setRecurringSchedule(prev => ({
                                ...prev,
                                maxGroupSize: parseInt(e.target.value) || 1
                              }))}
                              min="1"
                              className="w-full px-4 py-3 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors"
                              style={{padding: '6px'}}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Specific Dates (Optional)</label>
                    <div className="bg-white border-2 border-neutrals-6 rounded-xl p-6">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-neutrals-3" />
                        </button>
                        <h3 className="text-lg font-semibold text-neutrals-1">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
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
                          
                          const dateStr = formatDate(day);
                          const isAvailable = selectedDates.has(dateStr);
                          const isBlocked = blockedDates.has(dateStr);
                          const isPast = isPastDate(day);
                          
                          return (
                            <button
                              key={day}
                              onClick={() => !isPast && toggleDate(day)}
                              disabled={isPast}
                              className={`
                                aspect-square rounded-lg text-sm font-medium relative transition-colors
                                ${isPast ? 'text-neutrals-5 cursor-not-allowed' : 'cursor-pointer'}
                                ${isAvailable ? 'bg-primary-1 text-white hover:bg-primary-1/90' : ''}
                                ${isBlocked ? 'bg-neutrals-5 text-white' : ''}
                                ${!isAvailable && !isBlocked && !isPast ? 'hover:bg-neutrals-7 text-neutrals-2' : ''}
                              `}
                            >
                              {day}
                              {isBlocked && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-full h-0.5 bg-white rotate-45"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
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
                      </div>
                      
                      <p className="text-sm text-neutrals-4 mt-4">
                        Click once to mark available, twice to block, three times to clear
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800 text-sm">
                      <strong>Error:</strong> {submitError}
                    </div>
                  </div>
                )}

                <div className="pt-8" style={{marginBottom: '50px'}}>
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={`w-full font-bold py-6 rounded-full transition-colors text-xl shadow-lg hover:shadow-xl ${
                      isSubmitting 
                        ? 'bg-neutrals-5 text-neutrals-3 cursor-not-allowed' 
                        : 'bg-primary-1 text-white hover:opacity-90'
                    }`}
                  >
                    {isSubmitting ? 'Creating Experience...' : 'Complete Experience'}
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
                          <p className="text-sm text-neutrals-3">
                            Max group size: {recurringSchedule.maxGroupSize}
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
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Create New Experience</h1>
              
              <div className="flex gap-4 items-center" style={{marginBottom: '20px'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-neutrals-2">
                  4
                </div>
                <span className="text-base font-medium text-neutrals-1">
                  Availability
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Recurring Schedule */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Recurring Schedule</label>
                <div className="bg-white border-2 border-neutrals-6 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-neutrals-1">Set Recurring Schedule</h3>
                      <p className="text-xs text-neutrals-3 mt-1">Offer on regular days</p>
                    </div>
                    <button
                      onClick={() => setRecurringSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        recurringSchedule.enabled ? 'bg-primary-1' : 'bg-neutrals-5'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        recurringSchedule.enabled ? 'translate-x-6' : 'translate-x-0.5'
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
                              onClick={() => toggleDayOfWeek(index)}
                              className={`text-xs font-medium py-2 rounded transition-colors ${
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
                        <div className="space-y-2">
                          {recurringSchedule.timeSlots.map((time, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="time"
                                value={time}
                                onChange={(e) => updateTimeSlot(index, e.target.value)}
                                className="flex-1 px-3 py-2 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors"
                                style={{padding: '6px'}}
                              />
                              {recurringSchedule.timeSlots.length > 1 && (
                                <button
                                  onClick={() => removeTimeSlot(index)}
                                  className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addTimeSlot}
                            className="flex items-center gap-2 text-primary-1 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Add time slot
                          </button>
                        </div>
                      </div>
                      
                      {/* Max Group Size */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">Max Group Size</label>
                        <input
                          type="number"
                          value={recurringSchedule.maxGroupSize}
                          onChange={(e) => setRecurringSchedule(prev => ({
                            ...prev,
                            maxGroupSize: parseInt(e.target.value) || 1
                          }))}
                          min="1"
                          className="w-full px-3 py-2 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors"
                          style={{padding: '6px'}}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Calendar */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Specific Dates (Optional)</label>
                <div className="bg-white border-2 border-neutrals-6 rounded-xl p-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-1 hover:bg-neutrals-7 rounded transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutrals-3" />
                    </button>
                    <h3 className="text-sm font-semibold text-neutrals-1">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
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
                      
                      const dateStr = formatDate(day);
                      const isAvailable = selectedDates.has(dateStr);
                      const isBlocked = blockedDates.has(dateStr);
                      const isPast = isPastDate(day);
                      
                      return (
                        <button
                          key={day}
                          onClick={() => !isPast && toggleDate(day)}
                          disabled={isPast}
                          className={`
                            aspect-square rounded text-xs font-medium relative transition-colors
                            ${isPast ? 'text-neutrals-5 cursor-not-allowed' : 'cursor-pointer'}
                            ${isAvailable ? 'bg-primary-1 text-white' : ''}
                            ${isBlocked ? 'bg-neutrals-5 text-white' : ''}
                            ${!isAvailable && !isBlocked && !isPast ? 'hover:bg-neutrals-7 text-neutrals-2' : ''}
                          `}
                        >
                          {day}
                          {isBlocked && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-0.5 bg-white rotate-45"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
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
                  </div>
                  
                  <p className="text-xs text-neutrals-4 mt-3">
                    Click once for available, twice to block, three times to clear
                  </p>
                </div>
              </div>
              
              {/* Error Message - Mobile */}
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-xs">
                    <strong>Error:</strong> {submitError}
                  </div>
                </div>
              )}

              <div style={{marginBottom: '15px'}}>
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 rounded-full transition-colors ${
                    isSubmitting 
                      ? 'bg-neutrals-5 text-neutrals-3 cursor-not-allowed' 
                      : 'bg-primary-1 text-white hover:opacity-90'
                  }`}
                >
                  {isSubmitting ? 'Creating Experience...' : 'Complete Experience'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}