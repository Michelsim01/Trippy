/**
 * Schedule Generator Utility
 * Generates ExperienceSchedule records from availability rules
 * Prevents duplicates and aligns with backend ExperienceSchedule entity
 */

/**
 * Convert 12-hour time to 24-hour format
 * @param {string} time12h - Time in 12-hour format (e.g., "10:00 AM", "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "10:00", "14:30")
 */
export const convertTo24Hr = (time12h) => {
  // Handle various input formats
  const timeStr = time12h.trim();
  
  // If already in 24hr format (no AM/PM)
  if (!timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
    // Ensure it has proper format HH:MM
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const hour = parts[0].padStart(2, '0');
      const minute = parts[1].padStart(2, '0');
      return `${hour}:${minute}`;
    }
    return timeStr;
  }
  
  const [time, period] = timeStr.split(/\s+/);
  const [hours, minutes = '00'] = time.split(':');
  let hour = parseInt(hours);
  
  if (period?.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12;
  } else if (period?.toLowerCase() === 'am' && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

/**
 * Convert 24-hour time to 12-hour format
 * @param {string} time24h - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export const convertTo12Hr = (time24h) => {
  const [hours, minutes] = time24h.split(':');
  let hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  
  return `${hour}:${minutes} ${period}`;
};

/**
 * Calculate end time based on start time and duration
 * @param {string} startTime - Start time in any format
 * @param {number} durationHours - Duration in hours
 * @returns {string} End time in 24-hour format
 */
export const calculateEndTime = (startTime, durationHours = 3) => {
  const time24 = convertTo24Hr(startTime);
  const [hours, minutes] = time24.split(':').map(Number);
  
  // Create a date object to handle time calculation
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setHours(date.getHours() + Math.floor(durationHours));
  date.setMinutes(date.getMinutes() + (durationHours % 1) * 60);
  
  const endHours = date.getHours().toString().padStart(2, '0');
  const endMinutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${endHours}:${endMinutes}`;
};

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate schedule records from availability rules
 * @param {Object} availability - Availability configuration
 * @param {Array} availability.selectedDates - Manually selected dates
 * @param {Array} availability.blockedDates - Blocked dates
 * @param {Object} availability.recurringSchedule - Recurring schedule configuration
 * @param {number} experienceDuration - Experience duration in hours
 * @param {number} monthsAhead - How many months ahead to generate (default 3)
 * @returns {Array} Array of schedule objects matching ExperienceSchedule entity
 */
export const generateScheduleRecords = (availability, experienceDuration = 3, monthsAhead = 3) => {
  const scheduleMap = new Map();
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + monthsAhead);
  
  // Step 1: Process recurring schedules
  if (availability.recurringSchedule?.enabled && availability.recurringSchedule?.daysOfWeek?.length > 0) {
    const { daysOfWeek, timeSlots = ['10:00'], maxGroupSize = 10 } = availability.recurringSchedule;
    
    // Iterate through each day in the range
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
      
      // Check if this day of week is selected (support both numeric and string format)
      if (daysOfWeek.includes(dayOfWeek) || daysOfWeek.includes(dayName)) {
        const dateStr = formatDate(currentDate);
        
        // Skip if this date is blocked
        if (availability.blockedDates?.includes(dateStr)) {
          continue;
        }
        
        // Create schedule for each time slot
        for (const startTime of timeSlots) {
          const key = `${dateStr}_${convertTo24Hr(startTime)}`;
          
          scheduleMap.set(key, {
            date: dateStr,
            startTime: convertTo24Hr(startTime),
            endTime: calculateEndTime(startTime, experienceDuration),
            availableSpots: maxGroupSize,
            isAvailable: true
          });
        }
      }
    }
  }
  
  // Step 2: Process manually selected dates (can override recurring or add new)
  if (availability.selectedDates && availability.selectedDates.length > 0) {
    for (const dateStr of availability.selectedDates) {
      // Skip if this date is blocked (blocked takes priority over selected)
      if (availability.blockedDates?.includes(dateStr)) {
        continue;
      }
      
      // Use time slots from recurring schedule or default
      const timeSlots = availability.recurringSchedule?.timeSlots || ['10:00'];
      const maxGroupSize = availability.recurringSchedule?.maxGroupSize || 10;
      
      for (const startTime of timeSlots) {
        const key = `${dateStr}_${convertTo24Hr(startTime)}`;
        
        // This will override recurring schedule if duplicate, or add new if unique
        scheduleMap.set(key, {
          date: dateStr,
          startTime: convertTo24Hr(startTime),
          endTime: calculateEndTime(startTime, experienceDuration),
          availableSpots: maxGroupSize,
          isAvailable: true
        });
      }
    }
  }
  
  // Step 3: Convert to array and sort by date and time
  const schedules = Array.from(scheduleMap.values()).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
  
  return schedules;
};

/**
 * Check if a schedule already exists (for duplicate prevention)
 * @param {Array} schedules - Existing schedules
 * @param {string} date - Date to check
 * @param {string} startTime - Start time to check
 * @returns {boolean} True if schedule exists
 */
export const scheduleExists = (schedules, date, startTime) => {
  const time24 = convertTo24Hr(startTime);
  return schedules.some(s => s.date === date && s.startTime === time24);
};

/**
 * Validate schedule data before sending to backend
 * @param {Object} schedule - Schedule object to validate
 * @returns {boolean} True if valid
 */
export const validateSchedule = (schedule) => {
  if (!schedule.date || !schedule.startTime || !schedule.endTime) {
    return false;
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(schedule.date)) {
    return false;
  }
  
  // Validate time format (HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
    return false;
  }
  
  // Validate availableSpots is positive integer
  if (!Number.isInteger(schedule.availableSpots) || schedule.availableSpots <= 0) {
    return false;
  }
  
  return true;
};

// Export all functions as default object as well
export default {
  generateScheduleRecords,
  convertTo24Hr,
  convertTo12Hr,
  calculateEndTime,
  formatDate,
  scheduleExists,
  validateSchedule
};