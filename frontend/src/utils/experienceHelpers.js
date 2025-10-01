import { convertTo12Hr } from './scheduleGenerator';

export const parseImportantInfo = (text) => {
  if (!text) return [];

  const lines = text.split('\n').filter(line => line.trim());
  const elements = [];

  for (let line of lines) {
    const trimmed = line.trim();

    // Detect numbered lines (1. 2. 3. etc.) - these are bullet points
    if (trimmed.match(/^\d+[\.\)]\s/)) {
      const content = trimmed.replace(/^\d+[\.\)]\s/, '');
      elements.push({ type: 'bullet', content });
    }
    // All other non-empty lines are headers
    else if (trimmed.length > 0) {
      elements.push({ type: 'header', content: trimmed });
    }
  }

  return elements;
};

export const getCategoryDisplayName = (enumValue) => {
  const categoryDisplayMap = {
    'GUIDED_TOUR': 'Guided Tour',
    'DAYTRIP': 'Day Trip',
    'ADVENTURE': 'Adventure & Sports',
    'WORKSHOP': 'Workshop & Classes',
    'WATER_ACTIVITY': 'Water Activities',
    'OTHERS': 'Others'
  };
  return categoryDisplayMap[enumValue] || enumValue;
};

export const formatScheduleDisplay = (schedule) => {
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
        month: 'short',
        year: 'numeric'
      });
      const endDateStr = endDateTime.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
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
          month: 'long',
          year: 'numeric'
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
        month: 'long',
        year: 'numeric'
      }),
      timeText: `${convertTo12Hr(schedule.startTime)} - ${convertTo12Hr(schedule.endTime)}`
    };
  }

  return {
    dateText: 'Invalid Date',
    timeText: 'Invalid Time'
  };
};

export const getGuideInitials = (guide) => {
  if (!guide || !guide.firstName) return 'G';
  const firstName = guide.firstName || '';
  const lastName = guide.lastName || '';
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
};

export const getGuideFullName = (guide) => {
  if (!guide) return 'Guide';
  const firstName = guide.firstName || '';
  const lastName = guide.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'Guide';
};

/**
 * Calculate duration between two date-time strings (always returns hours)
 * @param {string} startDateTime - Start date-time in ISO format
 * @param {string} endDateTime - End date-time in ISO format
 * @returns {number} Duration in hours
 */
export const calculateDuration = (startDateTime, endDateTime) => {
  if (!startDateTime || !endDateTime) {
    return null;
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  // Calculate total hours between exact start and end times
  const durationMs = end.getTime() - start.getTime();
  const totalHours = durationMs / (1000 * 60 * 60);

  // Don't round - keep precise decimal hours for accurate minute calculation
  return totalHours;
};

/**
 * Format duration hours for display (like CreateExperienceBasicInfoPage)
 * @param {number} totalHours - Duration in hours
 * @returns {string} Formatted duration string
 */
export const formatDurationForDisplay = (totalHours) => {
  if (!totalHours || totalHours <= 0) {
    return '';
  }

  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  // Always show duration precisely
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};

export const formatDuration = (experienceData, schedulesData) => {
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