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
  if (!time12h) {
    return '10:00'; // Default fallback
  }
  
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
  if (!time24h) {
    return '12:00 AM'; // Default fallback
  }
  
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
 * Check if an experience is a multi-day tour
 * @param {string} startDateTime - Start date-time string (ISO format)
 * @param {string} endDateTime - End date-time string (ISO format)
 * @returns {boolean} True if tour spans multiple days
 */
export const isMultiDayTour = (startDateTime, endDateTime) => {
  if (!startDateTime || !endDateTime) return false;
  
  const startDate = new Date(startDateTime).toDateString();
  const endDate = new Date(endDateTime).toDateString();
  
  return startDate !== endDate;
};

/**
 * Calculate tour duration in days
 * @param {string} startDateTime - Start date-time string (ISO format)
 * @param {string} endDateTime - End date-time string (ISO format)
 * @returns {number} Number of days the tour spans
 */
export const getTourDurationInDays = (startDateTime, endDateTime) => {
  if (!startDateTime || !endDateTime) return 1;
  
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  
  // Get date-only versions (ignore time)
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  // Calculate difference in days and add 1 to include both start and end days
  const timeDiff = endDateOnly.getTime() - startDateOnly.getTime();
  const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
  
  return Math.max(1, dayDiff);
};

/**
 * Get array of blocked dates for a multi-day tour starting on given date
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {number} durationDays - Number of days the tour spans
 * @returns {Array<string>} Array of blocked dates in YYYY-MM-DD format
 */
export const getBlockedDatesForTour = (startDate, durationDays) => {
  const blockedDates = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < durationDays; i++) {
    blockedDates.push(formatDate(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return blockedDates;
};

/**
 * Generate schedule records from availability rules with multi-day tour support
 * @param {Object} availability - Availability configuration
 * @param {Array} availability.selectedDates - Manually selected dates
 * @param {Array} availability.blockedDates - Blocked dates
 * @param {Object} availability.recurringSchedule - Recurring schedule configuration
 * @param {number} experienceDuration - Experience duration in hours
 * @param {number} monthsAhead - How many months ahead to generate (default 3)
 * @param {Object} experienceInfo - Experience information for multi-day detection
 * @param {string} experienceInfo.startDateTime - Experience start date-time (ISO format)
 * @param {string} experienceInfo.endDateTime - Experience end date-time (ISO format)
 * @returns {Array} Array of schedule objects matching ExperienceSchedule entity
 */
export const generateScheduleRecords = (availability, experienceDuration = 3, monthsAhead = 3, experienceInfo = {}) => {
  console.log('🚀 SCHEDULE GENERATOR CALLED!');
  console.log('Input parameters:', {
    availability,
    experienceDuration,
    monthsAhead,
    experienceInfo
  });
  
  const scheduleMap = new Map();
  
  // Use experience start date as the earliest date, or today if no experience start date
  const experienceStartDate = experienceInfo.startDateTime ? new Date(experienceInfo.startDateTime) : new Date();
  const startDate = new Date(Math.max(experienceStartDate.getTime(), new Date().getTime()));

  // Calculate start date for recurring schedules (day after primary schedule)
  const recurringStartDate = new Date(experienceStartDate);
  recurringStartDate.setDate(recurringStartDate.getDate() + 1);
  // Ensure recurring schedules don't start before today
  const recurringStartDateFinal = new Date(Math.max(recurringStartDate.getTime(), new Date().getTime()));

  // Extract the experience's actual start time for single-day tours
  const experienceStartTime = experienceInfo.startDateTime
    ? new Date(experienceInfo.startDateTime).toTimeString().slice(0, 5) // Format: "HH:MM"
    : '10:00';

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  console.log('Schedule generation range:', startDate.toDateString(), 'to', endDate.toDateString());
  console.log('Recurring schedule start date:', recurringStartDateFinal.toDateString());
  
  // Check if this is a multi-day tour
  const isMultiDay = isMultiDayTour(experienceInfo.startDateTime, experienceInfo.endDateTime);
  const tourDurationDays = isMultiDay ? getTourDurationInDays(experienceInfo.startDateTime, experienceInfo.endDateTime) : 1;
  
  console.log('Multi-day tour:', isMultiDay, 'Duration:', tourDurationDays, 'days');
  
  // Track blocked dates from multi-day tours
  const allBlockedDates = new Set(availability.blockedDates || []);
  console.log('Initial blocked dates:', Array.from(allBlockedDates));
  
  // Note: We don't block the experience's own date range here because it should generate its own schedule
  // The conflict detection in manual date processing will handle overlaps properly
  
  // Step 1: Process recurring schedules (disabled for multi-day tours)
  console.log('Recurring schedule check:', {
    enabled: availability.recurringSchedule?.enabled,
    daysOfWeekLength: availability.recurringSchedule?.daysOfWeek?.length,
    isMultiDay: isMultiDay
  });
  
  if (availability.recurringSchedule?.enabled && availability.recurringSchedule?.daysOfWeek?.length > 0 && !isMultiDay) {
    const { daysOfWeek } = availability.recurringSchedule;
    // For single-day tours, use the experience's start time or the configured time slots
    const timeSlots = availability.recurringSchedule?.timeSlots?.length > 0 
      ? availability.recurringSchedule.timeSlots 
      : [experienceStartTime]; // Use experience's actual start time as default
    const maxGroupSize = experienceInfo.participantsAllowed || 10;
    console.log('Processing recurring schedule:', { daysOfWeek, timeSlots, maxGroupSize, experienceStartTime });
    
    let daysProcessed = 0;
    let schedulesCreated = 0;
    
    // Iterate through each day in the range (starting from day after primary schedule)
    for (let currentDate = new Date(recurringStartDateFinal); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
      daysProcessed++;
      
      console.log(`Day ${daysProcessed}: ${formatDate(currentDate)} (${dayName}, ${dayOfWeek})`);
      
      // Check if this day of week is selected (support both numeric and string format)
      if (daysOfWeek.includes(dayOfWeek) || daysOfWeek.includes(dayName)) {
        const dateStr = formatDate(currentDate);
        console.log(`  - Day matches selected days of week`);
        
        // Skip if this date is blocked
        if (availability.blockedDates?.includes(dateStr)) {
          console.log(`  - Date ${dateStr} is blocked, skipping`);
          continue;
        }
        
        // Create schedule for each time slot
        for (const startTime of timeSlots) {
          const key = `${dateStr}_${convertTo24Hr(startTime)}`;
          console.log(`  - Creating schedule: ${key}`);

          // Create full datetime objects for startDateTime and endDateTime
          // Use UTC to preserve the intended local time when converting to ISO
          const [year, month, day] = dateStr.split('-').map(Number);
          const startTime24 = convertTo24Hr(startTime);
          const [startHour, startMinute] = startTime24.split(':').map(Number);

          const scheduleDate = new Date(Date.UTC(year, month - 1, day, startHour, startMinute));
          let scheduleEndDateTime;

          if (experienceInfo.endDateTime) {
            // For single-day tours: use same date with experience end time
            // For multi-day tours: this should not be used (handled in manual dates section)
            const experienceEndTime = new Date(experienceInfo.endDateTime).toTimeString().slice(0, 5);
            const [endHour, endMinute] = experienceEndTime.split(':').map(Number);
            scheduleEndDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));
          } else {
            // Fallback: calculate based on duration
            const endTime24 = calculateEndTime(startTime, experienceDuration);
            const [endHour, endMinute] = endTime24.split(':').map(Number);
            scheduleEndDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));
          }

          scheduleMap.set(key, {
            startDateTime: scheduleDate.toISOString(),
            endDateTime: scheduleEndDateTime.toISOString(),
            availableSpots: maxGroupSize,
            isAvailable: true
          });
          schedulesCreated++;
        }
      } else {
        console.log(`  - Day does not match selected days (selected: ${daysOfWeek})`);
      }
    }
    
    console.log(`Recurring schedule processing complete: ${schedulesCreated} schedules created from ${daysProcessed} days`);
  }
  
  // Step 2: Process manually selected dates with multi-day blocking
  console.log('Processing manually selected dates:', availability.selectedDates?.length || 0, 'dates');
  
  // Always include the experience's start date if not in selectedDates (for both single-day and multi-day)
  let datesToProcess = [...(availability.selectedDates || [])];
  if (experienceInfo.startDateTime) {
    const experienceStartDate = formatDate(new Date(experienceInfo.startDateTime));
    if (!datesToProcess.includes(experienceStartDate)) {
      datesToProcess.unshift(experienceStartDate); // Add to beginning
      console.log(`Automatically added experience start date: ${experienceStartDate}`);
    }
  }
  
  if (datesToProcess.length > 0) {
    let manualSchedulesCreated = 0;
    
    for (const dateStr of datesToProcess) {
      console.log(`Processing manual date: ${dateStr}`);
      
      // Skip if this date is blocked (blocked takes priority over selected)
      if (allBlockedDates.has(dateStr)) {
        console.log(`  - Date ${dateStr} is in blocked dates, skipping`);
        continue;
      }
      
      // For multi-day tours, check if this start date would conflict with existing tours
      if (isMultiDay) {
        const blockedDatesForThisTour = getBlockedDatesForTour(dateStr, tourDurationDays);
        console.log(`  - Multi-day tour would block dates:`, blockedDatesForThisTour);
        
        // Check if any of the dates this tour would block are already blocked
        const hasConflict = blockedDatesForThisTour.some(date => allBlockedDates.has(date));
        if (hasConflict) {
          console.log(`  - Conflict detected, skipping date ${dateStr}`);
          continue; // Skip this start date due to conflict
        }
        
        // Add all dates this tour would block to our blocked dates set
        blockedDatesForThisTour.forEach(date => allBlockedDates.add(date));
        console.log(`  - Added blocked dates for this tour`);
      }
      
      // Use time slots from recurring schedule or experience's start time
      const timeSlots = availability.recurringSchedule?.timeSlots?.length > 0
        ? availability.recurringSchedule.timeSlots
        : [experienceStartTime]; // Use experience's actual start time as default
      const maxGroupSize = experienceInfo.participantsAllowed || 10;
      console.log(`  - Using time slots:`, timeSlots, `Max group size: ${maxGroupSize}`);
      
      for (const startTime of timeSlots) {
        const key = `${dateStr}_${convertTo24Hr(startTime)}`;
        console.log(`  - Creating manual schedule: ${key}`);

        // Create full datetime objects for startDateTime and endDateTime
        // Use UTC to preserve the intended local time when converting to ISO
        const [year, month, day] = dateStr.split('-').map(Number);
        const startTime24 = convertTo24Hr(startTime);
        const [startHour, startMinute] = startTime24.split(':').map(Number);

        const scheduleStartDateTime = new Date(Date.UTC(year, month - 1, day, startHour, startMinute));
        let scheduleEndDateTime;

        if (isMultiDay && experienceInfo.endDateTime) {
          // For multi-day tours: calculate end date based on tour duration from this start date
          const experienceStart = new Date(experienceInfo.startDateTime);
          const experienceEnd = new Date(experienceInfo.endDateTime);

          // Calculate the duration of the original experience in milliseconds
          const tourDurationMs = experienceEnd.getTime() - experienceStart.getTime();

          // Add the same duration to this schedule's start date
          scheduleEndDateTime = new Date(scheduleStartDateTime.getTime() + tourDurationMs);
        } else if (experienceInfo.endDateTime) {
          // For single-day tours: use same date with experience end time
          const experienceEndTime = new Date(experienceInfo.endDateTime).toTimeString().slice(0, 5);
          const [endHour, endMinute] = experienceEndTime.split(':').map(Number);
          scheduleEndDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));
        } else {
          // Fallback: calculate based on duration
          const endTime24 = calculateEndTime(startTime, experienceDuration);
          const [endHour, endMinute] = endTime24.split(':').map(Number);
          scheduleEndDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));
        }

        // This will override recurring schedule if duplicate, or add new if unique
        scheduleMap.set(key, {
          startDateTime: scheduleStartDateTime.toISOString(),
          endDateTime: scheduleEndDateTime.toISOString(),
          availableSpots: maxGroupSize,
          isAvailable: true,
          isMultiDay: isMultiDay,
          tourDurationDays: isMultiDay ? tourDurationDays : 1
        });
        manualSchedulesCreated++;
      }
    }
    
    console.log(`Manual date processing complete: ${manualSchedulesCreated} schedules created`);
  }
  
  // Step 3: Convert to array and sort by startDateTime
  const schedules = Array.from(scheduleMap.values()).sort((a, b) => {
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });

  console.log(`Final schedule generation complete: ${schedules.length} total schedules created`);
  console.log('Generated schedules:', schedules.map(s => {
    const start = new Date(s.startDateTime);
    const end = new Date(s.endDateTime);
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString()} - ${end.toLocaleDateString()} ${end.toLocaleTimeString()}`;
  }));
  
  if (schedules.length === 0) {
    console.error('❌ NO SCHEDULES GENERATED! Check the conditions above.');
  } else {
    console.log('✅ Schedule generation successful!');
  }
  
  return schedules;
};

/**
 * Check if a manual date selection would conflict with multi-day tour blocking
 * @param {string} selectedDate - Date being selected (YYYY-MM-DD)
 * @param {Object} experienceInfo - Experience information
 * @param {Array} existingSelectedDates - Already selected dates
 * @param {Array} existingBlockedDates - Already blocked dates
 * @returns {Object} Validation result with isValid and conflictReason
 */
export const validateManualDateSelection = (selectedDate, experienceInfo, existingSelectedDates = [], existingBlockedDates = []) => {
  // Check if this is a multi-day tour
  const isMultiDay = isMultiDayTour(experienceInfo.startDateTime, experienceInfo.endDateTime);
  
  if (!isMultiDay) {
    // For single-day tours, just check if date is in blocked dates
    if (existingBlockedDates.includes(selectedDate)) {
      return {
        isValid: false,
        conflictReason: 'This date is blocked and not available for selection.'
      };
    }
    return { isValid: true };
  }
  
  const tourDurationDays = getTourDurationInDays(experienceInfo.startDateTime, experienceInfo.endDateTime);
  
  // Build the complete blocked dates set
  const allBlockedDates = new Set(existingBlockedDates);
  
  // Add experience's own date range to blocked dates
  if (experienceInfo.startDateTime) {
    const experienceStartDate = formatDate(new Date(experienceInfo.startDateTime));
    const experienceBlockedDates = getBlockedDatesForTour(experienceStartDate, tourDurationDays);
    experienceBlockedDates.forEach(date => allBlockedDates.add(date));
  }
  
  // Add blocked dates from existing selected dates
  existingSelectedDates.forEach(dateStr => {
    const blockedDatesForThisTour = getBlockedDatesForTour(dateStr, tourDurationDays);
    blockedDatesForThisTour.forEach(date => allBlockedDates.add(date));
  });
  
  // Check if the selected date is directly blocked
  if (allBlockedDates.has(selectedDate)) {
    return {
      isValid: false,
      conflictReason: `This date conflicts with existing ${tourDurationDays}-day tour dates. Tours cannot overlap.`
    };
  }
  
  // Check if this date's tour range would conflict with blocked dates
  const newTourBlockedDates = getBlockedDatesForTour(selectedDate, tourDurationDays);
  const conflictingDates = newTourBlockedDates.filter(date => allBlockedDates.has(date));
  
  if (conflictingDates.length > 0) {
    return {
      isValid: false,
      conflictReason: `Starting a ${tourDurationDays}-day tour on ${selectedDate} would conflict with existing tour dates: ${conflictingDates.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Check if a schedule already exists (for duplicate prevention)
 * @param {Array} schedules - Existing schedules
 * @param {string} startDateTime - Start datetime to check (ISO string)
 * @returns {boolean} True if schedule exists
 */
export const scheduleExists = (schedules, startDateTime) => {
  return schedules.some(s => s.startDateTime === startDateTime);
};

/**
 * Validate schedule data before sending to backend
 * @param {Object} schedule - Schedule object to validate
 * @returns {boolean} True if valid
 */
export const validateSchedule = (schedule) => {
  if (!schedule.startDateTime || !schedule.endDateTime) {
    return false;
  }

  // Validate startDateTime and endDateTime are valid ISO strings
  try {
    const startDate = new Date(schedule.startDateTime);
    const endDate = new Date(schedule.endDateTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    // Validate that endDateTime is after startDateTime
    if (endDate <= startDate) {
      return false;
    }
  } catch (error) {
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
  validateSchedule,
  validateManualDateSelection,
  isMultiDayTour,
  getTourDurationInDays,
  getBlockedDatesForTour
};