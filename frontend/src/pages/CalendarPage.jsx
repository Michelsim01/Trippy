import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Ticket, Eye, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { calendarApi } from '../services/calendarApi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const CalendarPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState({
        participantEvents: [],
        guideEvents: []
    });
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [navigationLoading, setNavigationLoading] = useState(false);
    const [error, setError] = useState(null);

    // Determine if user is a tour guide (KYC approved and can create experiences)
    const isTourGuide = user?.kycStatus === 'APPROVED' && user?.canCreateExperiences === true;

    // Filter states - different defaults based on user type
    const [activeFilters, setActiveFilters] = useState({
        tourType: isTourGuide ? 'all' : null, // 'myTours', 'joinedTours', 'all' for guides, null for tourists
        timePeriod: 'all', // 'upcoming', 'past', 'all'
    });

    const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'day' (removed 'list')
    const [expandedDays, setExpandedDays] = useState(new Set()); // Track which days have expanded event lists

    useEffect(() => {
        if (user?.id || user?.userId) {
            fetchCalendarData();
        }
    }, [user?.id, user?.userId, currentDate]);

    useEffect(() => {
        applyFilters();
    }, [events, activeFilters]);

    // Reset filters when user role changes
    useEffect(() => {
        setActiveFilters(prev => ({
            ...prev,
            tourType: isTourGuide ? 'all' : null
        }));
    }, [isTourGuide]);

    const fetchCalendarData = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = user?.id;
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            // Fetch events for current month AND adjacent months to catch spanning events
            const currentMonthData = await calendarApi.getUserMonthlyEvents(userId, year, month);

            // Fetch previous month to catch events that end in current month
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const prevMonthData = await calendarApi.getUserMonthlyEvents(userId, prevYear, prevMonth);

            // Fetch next month to catch events that start in current month but end in next
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            const nextMonthData = await calendarApi.getUserMonthlyEvents(userId, nextYear, nextMonth);

            if (currentMonthData.success) {
                // Combine all events and filter for current month relevance
                const allParticipantEvents = [
                    ...(currentMonthData.participantEvents || []),
                    ...(prevMonthData.success ? prevMonthData.participantEvents || [] : []),
                    ...(nextMonthData.success ? nextMonthData.participantEvents || [] : [])
                ];

                const allGuideEvents = [
                    ...(currentMonthData.guideEvents || []),
                    ...(prevMonthData.success ? prevMonthData.guideEvents || [] : []),
                    ...(nextMonthData.success ? nextMonthData.guideEvents || [] : [])
                ];

                // Filter events that are relevant to current month
                const currentMonthStart = new Date(year, month - 1, 1);
                const currentMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);

                const relevantParticipantEvents = allParticipantEvents.filter(event => {
                    const eventStart = new Date(event.startDateTime);
                    const eventEnd = new Date(event.endDateTime);

                    // Include if event starts, ends, or spans through current month
                    return (eventStart <= currentMonthEnd && eventEnd >= currentMonthStart);
                });

                const relevantGuideEvents = allGuideEvents.filter(event => {
                    const eventStart = new Date(event.startDateTime);
                    const eventEnd = new Date(event.endDateTime);

                    // Include if event starts, ends, or spans through current month
                    return (eventStart <= currentMonthEnd && eventEnd >= currentMonthStart);
                });

                // Remove duplicates by event ID
                const uniqueParticipantEvents = relevantParticipantEvents.filter((event, index, self) =>
                    index === self.findIndex(e => e.id === event.id)
                );

                const uniqueGuideEvents = relevantGuideEvents.filter((event, index, self) =>
                    index === self.findIndex(e => e.id === event.id)
                );

                setEvents({
                    participantEvents: uniqueParticipantEvents,
                    guideEvents: uniqueGuideEvents
                });
            } else {
                setError(currentMonthData.error || 'Failed to fetch calendar data');
            }
        } catch (err) {
            console.error('Error fetching calendar data:', err);
            setError(err.message || 'An error occurred while loading calendar data');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {

        let allEvents = [];

        // Combine events based on filter and user role
        if (!isTourGuide) {
            // Tourists can only see events they're participating in
            allEvents = events.participantEvents.map(e => ({ ...e, userRole: 'participant' }));
        } else {
            // Tour guides can see both types based on filter
            if (activeFilters.tourType === 'all') {
                allEvents = [
                    ...events.participantEvents.map(e => ({ ...e, userRole: 'participant' })),
                    ...events.guideEvents.map(e => ({ ...e, userRole: 'guide' }))
                ];
            } else if (activeFilters.tourType === 'joinedTours') {
                allEvents = events.participantEvents.map(e => ({ ...e, userRole: 'participant' }));
            } else if (activeFilters.tourType === 'myTours') {
                allEvents = events.guideEvents.map(e => ({ ...e, userRole: 'guide' }));
            }
        }

        // Apply time period filter
        const filtered = calendarApi.filterEvents(allEvents, {
            timePeriod: activeFilters.timePeriod === 'all' ? null : activeFilters.timePeriod
        });

        // Sort by date with upcoming events first, then past events
        const now = new Date();
        filtered.sort((a, b) => {
            const dateA = new Date(a.startDateTime);
            const dateB = new Date(b.startDateTime);

            const isAUpcoming = dateA >= now;
            const isBUpcoming = dateB >= now;

            // If one is upcoming and one is past, prioritize upcoming
            if (isAUpcoming && !isBUpcoming) return -1;
            if (!isAUpcoming && isBUpcoming) return 1;

            // Both are upcoming or both are past, sort by date (earliest first)
            return dateA - dateB;
        });

        setFilteredEvents(filtered);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Helper functions for expanding/collapsing day events
    const toggleDayExpansion = (dayKey) => {
        setExpandedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayKey)) {
                newSet.delete(dayKey);
            } else {
                newSet.add(dayKey);
            }
            return newSet;
        });
    };

    const isDayExpanded = (dayKey) => {
        return expandedDays.has(dayKey);
    };

    // Enhanced formatting for multi-day events
    const formatEventTime = (startDateTime, endDateTime) => {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        const startTime = start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const endTime = end.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const startDate = start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        const endDate = end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    };

    // Utility function to check if event is cancelled
    const isEventCancelled = (event) => {
        return event.status === 'CANCELLED';
    };

    // Utility function to check if event spans multiple days
    const isMultiDayEvent = (event) => {
        const start = new Date(event.startDateTime);
        const end = new Date(event.endDateTime);
        return start.toDateString() !== end.toDateString();
    };

    // Get all dates that a multi-day event spans
    const getEventDateSpan = (event) => {
        const start = new Date(event.startDateTime);
        const end = new Date(event.endDateTime);
        const dates = [];

        const currentDate = new Date(start);
        currentDate.setHours(0, 0, 0, 0);

        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    };

    // Detect overlapping events for day view positioning
    const detectOverlappingEvents = (events) => {
        // Sort events by start time, then by id for consistent ordering of identical times
        const sortedEvents = [...events].sort((a, b) => {
            const startComparison = new Date(a.startDateTime) - new Date(b.startDateTime);
            if (startComparison !== 0) return startComparison;
            // For events with identical start times, sort by id for consistency
            return a.id.toString().localeCompare(b.id.toString());
        });

        return sortedEvents.map((event, index) => {
            const eventStart = new Date(event.startDateTime);
            const eventEnd = new Date(event.endDateTime);

            // Find overlapping events (including events with identical times)
            const overlapping = sortedEvents.filter((other, otherIndex) => {
                if (otherIndex === index) return false;

                const otherStart = new Date(other.startDateTime);
                const otherEnd = new Date(other.endDateTime);

                // Check for overlap - events overlap if they share any time period
                // This includes events with exactly the same start and end times
                return eventStart < otherEnd && eventEnd > otherStart;
            });

            // Calculate position based on overlap
            const overlapCount = overlapping.length + 1;

            // For positioning, count how many overlapping events come before this one
            // in our sorted order (by start time, then by id)
            const eventPosition = overlapping.filter((other) => {
                const otherStart = new Date(other.startDateTime);
                const eventStartTime = eventStart.getTime();
                const otherStartTime = otherStart.getTime();

                // If other event starts before this one, it gets a lower position
                if (otherStartTime < eventStartTime) return true;

                // If they have the same start time, use id comparison for consistent ordering
                if (otherStartTime === eventStartTime) {
                    return other.id.toString().localeCompare(event.id.toString()) < 0;
                }

                return false;
            }).length;

            return {
                ...event,
                overlapCount,
                overlapPosition: eventPosition,
                hasOverlap: overlapCount > 1
            };
        });
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Only show current month days, no adjacent month dates
        const days = [];
        const eventsByDate = {};

        // Process events for multi-day support
        filteredEvents.forEach(event => {
            if (isMultiDayEvent(event)) {
                const spanDates = getEventDateSpan(event);
                spanDates.forEach((date, index) => {
                    // Only include dates that belong to current month
                    if (date.getMonth() === month && date.getFullYear() === year) {
                        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];

                        // Add metadata for multi-day display
                        const eventWithMeta = {
                            ...event,
                            isMultiDay: true,
                            isFirstDay: index === 0,
                            isLastDay: index === spanDates.length - 1,
                            dayIndex: index,
                            totalDays: spanDates.length,
                            spanId: `${event.id}-span-${index}`,
                            // Add flags to indicate if event continues beyond visible month
                            continuesFromPrevMonth: index === 0 && date > new Date(event.startDateTime),
                            continuesToNextMonth: index === spanDates.length - 1 && date < new Date(event.endDateTime)
                        };
                        eventsByDate[dateKey].push(eventWithMeta);
                    }
                });
            } else {
                const eventDate = new Date(event.startDateTime);
                // Only include events that belong to current month
                if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
                    const dateKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
                    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
                    eventsByDate[dateKey].push({ ...event, isMultiDay: false });
                }
            }
        });

        // Calculate how many days we need to show for a clean grid
        const totalDaysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({
                date: null,
                day: null,
                isCurrentMonth: false,
                isToday: false,
                events: [],
                isEmpty: true
            });
        }

        // Add all days of current month
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = date.toDateString() === new Date().toDateString();

            days.push({
                date: date,
                day: day,
                isCurrentMonth: true,
                isToday,
                events: dayEvents,
                isEmpty: false
            });
        }

        // Add empty cells to complete the grid (make it 6 weeks = 42 cells)
        const remainingCells = 42 - days.length;
        for (let i = 0; i < remainingCells; i++) {
            days.push({
                date: null,
                day: null,
                isCurrentMonth: false,
                isToday: false,
                events: [],
                isEmpty: true
            });
        }

        return days;
    };

    const generateWeekDays = () => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(currentDate.getDate() - day);

        const days = [];
        const eventsByDate = {};

        // Process events for multi-day support
        filteredEvents.forEach(event => {
            if (isMultiDayEvent(event)) {
                const spanDates = getEventDateSpan(event);
                spanDates.forEach((date, index) => {
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];

                    const eventWithMeta = {
                        ...event,
                        isMultiDay: true,
                        isFirstDay: index === 0,
                        isLastDay: index === spanDates.length - 1,
                        dayIndex: index,
                        totalDays: spanDates.length,
                        spanId: `${event.id}-span-${index}`
                    };
                    eventsByDate[dateKey].push(eventWithMeta);
                });
            } else {
                const eventDate = new Date(event.startDateTime);
                const dateKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
                if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
                eventsByDate[dateKey].push({ ...event, isMultiDay: false });
            }
        });

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);

            const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = day.toDateString() === new Date().toDateString();

            days.push({
                date: day,
                day: day.getDate(),
                events: dayEvents,
                isToday
            });
        }

        return days;
    };

    const getCurrentDayEvents = () => {
        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const eventsForDay = [];

        filteredEvents.forEach(event => {
            const eventStart = new Date(event.startDateTime);
            const eventEnd = new Date(event.endDateTime);
            const currentDateOnly = new Date(currentDate);
            currentDateOnly.setHours(0, 0, 0, 0);

            // Check if event occurs on current date
            if (eventStart.toDateString() === currentDate.toDateString() ||
                eventEnd.toDateString() === currentDate.toDateString() ||
                (eventStart < currentDateOnly && eventEnd > currentDateOnly)) {

                if (isMultiDayEvent(event)) {
                    const spanDates = getEventDateSpan(event);
                    const dayIndex = spanDates.findIndex(date =>
                        date.toDateString() === currentDate.toDateString()
                    );

                    if (dayIndex !== -1) {
                        eventsForDay.push({
                            ...event,
                            isMultiDay: true,
                            isFirstDay: dayIndex === 0,
                            isLastDay: dayIndex === spanDates.length - 1,
                            dayIndex,
                            totalDays: spanDates.length,
                            continuesFromPrevious: dayIndex > 0,
                            continuesToNext: dayIndex < spanDates.length - 1
                        });
                    }
                } else {
                    eventsForDay.push({ ...event, isMultiDay: false });
                }
            }
        });

        // Apply overlap detection for positioning
        return detectOverlappingEvents(eventsForDay);
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            slots.push({
                hour,
                time: new Date(0, 0, 0, hour).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    hour12: true
                }),
                displayTime: hour === 0 ? '12 AM' :
                    hour < 12 ? `${hour} AM` :
                        hour === 12 ? '12 PM' :
                            `${hour - 12} PM`
            });
        }
        return slots;
    };

    const getEventPosition = (event) => {
        const startTime = new Date(event.startDateTime);
        const endTime = new Date(event.endDateTime);

        // For multi-day events, adjust times based on the current day
        let displayStartTime = startTime;
        let displayEndTime = endTime;

        if (event.isMultiDay) {
            const currentDateStart = new Date(currentDate);
            currentDateStart.setHours(0, 0, 0, 0);
            const currentDateEnd = new Date(currentDate);
            currentDateEnd.setHours(23, 59, 59, 999);

            // If event continues from previous day, start from beginning of day
            if (event.continuesFromPrevious) {
                displayStartTime = currentDateStart;
            }

            // If event continues to next day, end at end of day
            if (event.continuesToNext) {
                displayEndTime = currentDateEnd;
            }
        }

        const startHour = displayStartTime.getHours();
        const startMinutes = displayStartTime.getMinutes();
        const endHour = displayEndTime.getHours();
        const endMinutes = displayEndTime.getMinutes();

        // Calculate position as percentage from start of day (64px per hour for h-16)
        const startPosition = (startHour * 60) + startMinutes; // minutes from start of day
        const duration = ((endHour * 60) + endMinutes) - startPosition; // duration in minutes

        // Calculate overlap positioning
        const overlapWidth = event.hasOverlap ? `${100 / event.overlapCount}%` : '100%';
        const overlapLeft = event.hasOverlap ? `${(event.overlapPosition * 100) / event.overlapCount}%` : '0%';

        return {
            top: (startPosition / 60) * 64, // 64px per hour (h-16)
            height: Math.max((duration / 60) * 64, 32), // minimum 32px height, 64px per hour
            width: overlapWidth,
            left: overlapLeft,
            startTime: displayStartTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            endTime: displayEndTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            isMultiDay: event.isMultiDay || false,
            continuesFromPrevious: event.continuesFromPrevious || false,
            continuesToNext: event.continuesToNext || false
        };
    };

    const navigateTime = (direction, viewType = 'month') => {
        if (navigationLoading) return;

        setNavigationLoading(true);
        const newDate = new Date(currentDate);

        if (viewType === 'day') {
            newDate.setDate(currentDate.getDate() + direction);
        } else if (viewType === 'week') {
            newDate.setDate(currentDate.getDate() + (direction * 7));
        } else {
            newDate.setMonth(currentDate.getMonth() + direction);
        }

        setCurrentDate(newDate);
        // Clear expanded days when navigating to prevent stale expansions
        setExpandedDays(new Set());
        setTimeout(() => setNavigationLoading(false), 300);
    };

    const monthName = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const getViewHeaderText = () => {
        if (calendarView === 'day') {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (calendarView === 'week') {
            const weekDays = generateWeekDays();
            const startDate = weekDays[0].date;
            const endDate = weekDays[6].date;

            if (startDate.getMonth() === endDate.getMonth()) {
                return `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
            } else {
                return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            }
        } else {
            return monthName;
        }
    };

    // Get events for the left panel based on current view
    const getLeftPanelEvents = () => {
        if (calendarView === 'day') {
            return getCurrentDayEvents();
        } else if (calendarView === 'week') {
            const weekDays = generateWeekDays();
            const startDate = weekDays[0].date;
            const endDate = new Date(weekDays[6].date);
            endDate.setHours(23, 59, 59, 999); // Set to end of day

            return filteredEvents.filter(event => {
                const eventStart = new Date(event.startDateTime);
                const eventEnd = new Date(event.endDateTime);

                // Include if event starts, ends, or spans through the week period
                return eventStart <= endDate && eventEnd >= startDate;
            });
        } else {
            // Month view - get all events that overlap with the current month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

            return filteredEvents.filter(event => {
                const eventStart = new Date(event.startDateTime);
                const eventEnd = new Date(event.endDateTime);

                // Include if event starts, ends, or spans through the current month
                return eventStart <= monthEnd && eventEnd >= monthStart;
            });
        }
    };

    // Get color based on event type and state
    const getEventColor = (userRole, isPast, isCancelled = false) => {
        if (isCancelled) return 'var(--color-neutrals-5)'; // Gray for cancelled events
        if (isPast) return 'var(--color-neutrals-4)';
        return userRole === 'guide' ? 'var(--color-primary-4)' : 'var(--color-primary-1)';
    };

    // Get icon for event type
    const getEventIcon = (userRole) => {
        return userRole === 'guide' ? Crown : Ticket;
    };

    // Handle click on event to navigate to experience details or booking details
    const handleEventClick = (event) => {
        // If user is participating in the event, navigate to booking details
        if (event.userRole === 'participant' && event.bookingId) {
            navigate(`/booking/${event.bookingId}`);
        } else if (event.experienceId) {
            // Otherwise, navigate to experience details
            navigate(`/experience/${event.experienceId}`);
        }
    };

    const FilterButton = ({ value, label, currentValue, onChange }) => (
        <button
            onClick={() => onChange(value)}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${currentValue === value
                ? 'bg-primary-1 text-white border-primary-1'
                : 'bg-white text-neutrals-3 border-neutrals-6 hover:border-primary-1'
                }`}
        >
            {label}
        </button>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto mb-4"></div>
                    <p className="text-neutrals-3">Loading calendar...</p>
                </div>
            </div>
        );
    }

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
                    <main className="w-full p-4 lg:p-8 pb-24 overflow-hidden min-w-0">
                        <div className="max-w-full mx-auto min-w-0">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl font-bold text-neutrals-1">Calendar</h1>
                                        <span className={`px-3 py-1 text-sm rounded-full border ${isTourGuide
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            {isTourGuide ? 'Tour Guide' : 'Tourist'}
                                        </span>
                                    </div>
                                    <p className="text-lg text-neutrals-3">
                                        {isTourGuide
                                            ? "Manage your tours and track experiences you're participating in."
                                            : "Keep track of your booked travel experiences and upcoming adventures."
                                        }
                                    </p>
                                </div>

                                {/* View Toggle Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => setCalendarView('month')}
                                        className={`px-3 lg:px-4 py-2 text-sm rounded-lg transition-colors ${calendarView === 'month'
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white text-neutrals-3 border border-neutrals-6 hover:bg-neutrals-8'
                                            }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setCalendarView('week')}
                                        className={`px-3 lg:px-4 py-2 text-sm rounded-lg transition-colors ${calendarView === 'week'
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white text-neutrals-3 border border-neutrals-6 hover:bg-neutrals-8'
                                            }`}
                                    >
                                        Week
                                    </button>
                                    <button
                                        onClick={() => setCalendarView('day')}
                                        className={`px-3 lg:px-4 py-2 text-sm rounded-lg transition-colors ${calendarView === 'day'
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white text-neutrals-3 border border-neutrals-6 hover:bg-neutrals-8'
                                            }`}
                                    >
                                        Day
                                    </button>
                                </div>
                            </div>

                            {/* Split Layout: Left Panel + Calendar */}
                            <div className={`flex flex-col xl:flex-row gap-4 lg:gap-6 ${calendarView === 'day' ? 'h-auto min-h-[800px]' : 'min-h-[800px]'} overflow-hidden`}>
                                {/* Left Panel */}
                                <div className="w-full xl:w-[350px] xl:flex-shrink-0 bg-white rounded-lg shadow-sm flex flex-col max-h-[800px]">
                                    {/* Filters Section */}
                                    <div className="p-6 border-b border-neutrals-6">
                                        <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Filters</h3>

                                        {/* Tour Type Filters (only for tour guides) */}
                                        {isTourGuide && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-neutrals-2 mb-2">Tour Type</label>
                                                <div className="flex gap-2">
                                                    <FilterButton
                                                        value="myTours"
                                                        label="My Tours"
                                                        currentValue={activeFilters.tourType}
                                                        onChange={(value) => setActiveFilters(prev => ({ ...prev, tourType: value }))}
                                                    />
                                                    <FilterButton
                                                        value="joinedTours"
                                                        label="Joined Tours"
                                                        currentValue={activeFilters.tourType}
                                                        onChange={(value) => setActiveFilters(prev => ({ ...prev, tourType: value }))}
                                                    />
                                                    <FilterButton
                                                        value="all"
                                                        label="All"
                                                        currentValue={activeFilters.tourType}
                                                        onChange={(value) => setActiveFilters(prev => ({ ...prev, tourType: value }))}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Time Period Filters */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutrals-2 mb-2">Time Period</label>
                                            <div className="flex gap-2">
                                                <FilterButton
                                                    value="upcoming"
                                                    label="Upcoming"
                                                    currentValue={activeFilters.timePeriod}
                                                    onChange={(value) => setActiveFilters(prev => ({ ...prev, timePeriod: value }))}
                                                />
                                                <FilterButton
                                                    value="past"
                                                    label="Past"
                                                    currentValue={activeFilters.timePeriod}
                                                    onChange={(value) => setActiveFilters(prev => ({ ...prev, timePeriod: value }))}
                                                />
                                                <FilterButton
                                                    value="all"
                                                    label="All"
                                                    currentValue={activeFilters.timePeriod}
                                                    onChange={(value) => setActiveFilters(prev => ({ ...prev, timePeriod: value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Events List Section */}
                                    <div className="flex-1 overflow-hidden">
                                        <div className="p-4 border-b border-neutrals-6">
                                            <h4 className="text-md font-medium text-neutrals-1">
                                                {calendarView === 'day' ? 'Today\'s Activities' :
                                                    calendarView === 'week' ? 'This Week\'s Activities' :
                                                        'This Month\'s Activities'}
                                                <span className="ml-2 text-sm text-neutrals-4">
                                                    ({getLeftPanelEvents().length})
                                                </span>
                                            </h4>
                                        </div>

                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                                {getLeftPanelEvents().length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <p className="text-neutrals-4">No activities found for this period.</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {getLeftPanelEvents().map((event) => {
                                                            const EventIcon = getEventIcon(event.userRole);
                                                            const isCancelled = isEventCancelled(event);
                                                            const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                            return (
                                                                <div
                                                                    key={event.id}
                                                                    onClick={() => handleEventClick(event)}
                                                                    className={`border border-neutrals-6 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${isCancelled ? 'opacity-70' : ''
                                                                        }`}
                                                                    style={{
                                                                        borderLeftWidth: '4px',
                                                                        borderLeftColor: eventColor
                                                                    }}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {event.coverPhotoUrl ? (
                                                                            <img
                                                                                src={event.coverPhotoUrl}
                                                                                alt={event.title}
                                                                                className={`w-12 h-12 rounded-lg object-cover flex-shrink-0 ${isCancelled ? 'grayscale' : ''
                                                                                    }`}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-12 h-12 rounded-lg bg-neutrals-7 flex items-center justify-center flex-shrink-0">
                                                                                <EventIcon
                                                                                    size={20}
                                                                                    style={{ color: eventColor }}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <EventIcon
                                                                                    size={16}
                                                                                    className="flex-shrink-0"
                                                                                    style={{ color: eventColor, minWidth: 16, minHeight: 16 }}
                                                                                />
                                                                                <h5 className={`font-semibold text-sm text-neutrals-1 leading-tight ${isCancelled ? 'line-through' : ''
                                                                                    }`} style={{
                                                                                        wordBreak: 'break-word',
                                                                                        overflowWrap: 'break-word',
                                                                                        whiteSpace: 'normal',
                                                                                        lineHeight: '1.3'
                                                                                    }}>
                                                                                    {event.title}
                                                                                </h5>
                                                                                {isCancelled && (
                                                                                    <span className="text-xs text-red-600 font-medium">CANCELLED</span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-neutrals-4 mb-1">
                                                                                {event.isMultiDay && (
                                                                                    <span className="text-blue-600">Multi-day</span>
                                                                                )}
                                                                            </p>
                                                                            <p className="text-xs text-neutrals-4 mb-1">
                                                                                {formatEventTime(event.startDateTime, event.endDateTime)}
                                                                            </p>
                                                                            <p className="text-xs text-neutrals-4">
                                                                                📍 {event.location}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="h-8" />
                                                    </>
                                                )}
                                            </div>
                                        </div>


                                    </div>
                                </div>

                                {/* Calendar Section */}
                                <div className="flex-1 min-w-0 bg-white rounded-lg shadow-sm overflow-hidden">
                                    {calendarView === 'month' && (
                                        <div className="h-full rounded-lg">
                                            {/* Calendar header */}
                                            <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => navigateTime(-1, calendarView === 'day' ? 'day' : calendarView === 'week' ? 'week' : 'month')}
                                                        disabled={navigationLoading}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                                            ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                                            : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                                            }`}
                                                    >
                                                        {navigationLoading ? (
                                                            <div className="w-5 h-5 animate-spin">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <h2 className="text-2xl font-semibold text-neutrals-1 transition-opacity duration-200">{getViewHeaderText()}</h2>
                                                    <button
                                                        onClick={() => navigateTime(1, calendarView === 'day' ? 'day' : calendarView === 'week' ? 'week' : 'month')}
                                                        disabled={navigationLoading}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                                            ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                                            : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                                            }`}
                                                    >
                                                        {navigationLoading ? (
                                                            <div className="w-5 h-5 animate-spin">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="text-sm text-neutrals-4">
                                                    {filteredEvents.length} events found
                                                </div>
                                            </div>

                                            {/* Calendar grid */}
                                            <div className={`p-4 lg:p-6 transition-opacity duration-300 overflow-hidden ${navigationLoading ? 'opacity-70' : 'opacity-100'}`}>
                                                {/* Days of week */}
                                                <div className="grid grid-cols-7 gap-1 mb-4">
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                        <div key={day} className="p-2 lg:p-3 text-center text-xs lg:text-sm font-medium text-neutrals-4">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Calendar days */}
                                                <div className="grid grid-cols-7 gap-1 transition-all duration-300 min-w-0">
                                                    {generateCalendarDays().map((dayInfo, i) => {
                                                        // Handle empty cells
                                                        if (dayInfo.isEmpty) {
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="min-h-[100px] lg:min-h-[140px] p-1 lg:p-2 bg-neutrals-8"
                                                                >
                                                                    {/* Empty cell */}
                                                                </div>
                                                            );
                                                        }

                                                        const dayKey = `${dayInfo.date.getFullYear()}-${dayInfo.date.getMonth()}-${dayInfo.date.getDate()}`;
                                                        const isExpanded = isDayExpanded(dayKey);
                                                        const eventsToShow = isExpanded ? dayInfo.events : dayInfo.events.slice(0, 2);

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`min-h-[100px] lg:min-h-[140px] p-1 lg:p-2 border border-neutrals-7 transition-all duration-200 overflow-hidden bg-white hover:bg-neutrals-8 ${dayInfo.isToday ? 'bg-green-50 ring-2 ring-green-500 border-green-500' : ''} ${isExpanded ? 'min-h-auto' : ''}`}
                                                            >
                                                                <div className={`text-sm mb-1 text-neutrals-1 ${dayInfo.isToday ? 'font-bold text-green-700' : ''}`}>
                                                                    {dayInfo.day}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {eventsToShow.map((event) => {
                                                                        const EventIcon = getEventIcon(event.userRole);
                                                                        const isCancelled = isEventCancelled(event);
                                                                        const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                                        return (
                                                                            <div
                                                                                key={event.spanId || event.id}
                                                                                onClick={() => handleEventClick(event)}
                                                                                className={`text-xs p-1 rounded leading-tight overflow-hidden flex items-center gap-1 cursor-pointer transition-all duration-200 ease-in-out ${event.isMultiDay ? (
                                                                                    event.continuesFromPrevMonth ? 'rounded-l-none border-l-2 border-dashed' :
                                                                                        event.continuesToNextMonth ? 'rounded-r-none border-r-2 border-dashed' :
                                                                                            event.isFirstDay ? 'rounded-r-none' :
                                                                                                event.isLastDay ? 'rounded-l-none' :
                                                                                                    'rounded-none'
                                                                                ) : ''
                                                                                    }`}
                                                                                title={`${event.title} - ${event.userRole === 'guide' ? 'Leading' : 'Participating'}${isCancelled ? ' (Cancelled)' : ''
                                                                                    }${event.isMultiDay ? ` (Day ${event.dayIndex + 1}/${event.totalDays})` : ''}`}
                                                                                style={{
                                                                                    fontSize: '10px',
                                                                                    lineHeight: '1.2',
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    whiteSpace: 'normal',
                                                                                    backgroundColor: `${eventColor}20`,
                                                                                    borderLeft: (event.isFirstDay || !event.isMultiDay) && !event.continuesFromPrevMonth ? `3px solid ${eventColor}` : 'none',
                                                                                    borderRight: (event.isLastDay || !event.isMultiDay) && !event.continuesToNextMonth ? 'none' : `1px solid ${eventColor}`,
                                                                                    color: '#000000',
                                                                                    textDecoration: isCancelled ? 'line-through' : 'none',
                                                                                    opacity: isCancelled ? 0.7 : 1,
                                                                                    marginLeft: event.isMultiDay && !event.isFirstDay && !event.continuesFromPrevMonth ? '-1px' : '0',
                                                                                    marginRight: event.isMultiDay && !event.isLastDay && !event.continuesToNextMonth ? '-1px' : '0'
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    // Highlight all parts of multi-day event on hover
                                                                                    if (event.isMultiDay) {
                                                                                        const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                                        allSpans.forEach(span => {
                                                                                            span.style.transform = 'translateY(-1px)';
                                                                                            span.style.boxShadow = '0 3px 8px rgba(0,0,0,0.15)';
                                                                                            span.style.backgroundColor = `${eventColor}40`;
                                                                                            span.style.zIndex = '10';
                                                                                        });
                                                                                    } else {
                                                                                        e.currentTarget.style.transform = 'translateX(2px)';
                                                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                                        e.currentTarget.style.backgroundColor = `${eventColor}40`;
                                                                                    }
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    if (event.isMultiDay) {
                                                                                        const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                                        allSpans.forEach(span => {
                                                                                            span.style.transform = 'translateY(0)';
                                                                                            span.style.boxShadow = 'none';
                                                                                            span.style.backgroundColor = `${eventColor}20`;
                                                                                            span.style.zIndex = 'auto';
                                                                                        });
                                                                                    } else {
                                                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                                        e.currentTarget.style.backgroundColor = `${eventColor}20`;
                                                                                    }
                                                                                }}
                                                                                data-event-id={event.id}
                                                                            >
                                                                                {((event.isFirstDay || !event.isMultiDay) && !event.continuesFromPrevMonth) && (
                                                                                    <EventIcon size={10} className="flex-shrink-0 mt-0.5" color={eventColor} />
                                                                                )}
                                                                                {event.continuesFromPrevMonth && (
                                                                                    <span className="text-xs opacity-60">...</span>
                                                                                )}
                                                                                <span className={`${isCancelled ? 'line-through' : ''}`} style={{
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    whiteSpace: 'normal',
                                                                                    lineHeight: '1.2'
                                                                                }}>
                                                                                    {event.isMultiDay ?
                                                                                        `${event.title} (Day ${event.dayIndex + 1}/${event.totalDays})` :
                                                                                        event.title
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {dayInfo.events.length > 2 && !isExpanded && (
                                                                        <div
                                                                            className="text-xs text-neutrals-4 px-1 cursor-pointer transition-opacity duration-200 hover:bg-gray-100 rounded"
                                                                            title={`View all ${dayInfo.events.length} events`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleDayExpansion(dayKey);
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.opacity = '0.8';
                                                                                e.currentTarget.style.fontWeight = '500';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.opacity = '1';
                                                                                e.currentTarget.style.fontWeight = 'normal';
                                                                            }}
                                                                        >
                                                                            +{dayInfo.events.length - 2} more
                                                                        </div>
                                                                    )}
                                                                    {isExpanded && dayInfo.events.length > 2 && (
                                                                        <div
                                                                            className="text-xs text-blue-600 px-1 cursor-pointer transition-opacity duration-200 hover:bg-blue-50 rounded font-medium"
                                                                            title="Show less"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleDayExpansion(dayKey);
                                                                            }}
                                                                        >
                                                                            Show less
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {calendarView === 'week' && (
                                        <div className="bg-white rounded-lg shadow-sm">
                                            {/* Week view header */}
                                            <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => navigateTime(-1, 'week')}
                                                        disabled={navigationLoading}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                                            ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                                            : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                                            }`}
                                                    >
                                                        {navigationLoading ? (
                                                            <div className="w-5 h-5 animate-spin">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <h2 className="text-2xl font-semibold text-neutrals-1 transition-opacity duration-200">{getViewHeaderText()}</h2>
                                                    <button
                                                        onClick={() => navigateTime(1, 'week')}
                                                        disabled={navigationLoading}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                                            ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                                            : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                                            }`}
                                                    >
                                                        {navigationLoading ? (
                                                            <div className="w-5 h-5 animate-spin">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="text-sm text-neutrals-4">
                                                    {filteredEvents.length} events found
                                                </div>
                                            </div>

                                            {/* Week view grid */}
                                            <div className={`p-4 lg:p-6 transition-opacity duration-300 overflow-hidden ${navigationLoading ? 'opacity-70' : 'opacity-100'}`}>
                                                <div className="grid grid-cols-7 gap-1 lg:gap-4">
                                                    {generateWeekDays().map((dayInfo, i) => (
                                                        <div key={i} className="min-h-[280px] lg:min-h-[350px] border border-neutrals-7 rounded-lg overflow-hidden">
                                                            <div className={`p-2 lg:p-3 text-center border-b border-neutrals-7 ${dayInfo.isToday ? 'bg-primary-1 text-white' : 'bg-neutrals-8'
                                                                }`}>
                                                                <div className="text-xs font-medium">
                                                                    {dayInfo.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                                </div>
                                                                <div className="text-sm lg:text-lg font-semibold">
                                                                    {dayInfo.day}
                                                                </div>
                                                            </div>
                                                            <div className="p-1 lg:p-2 space-y-1 overflow-hidden">
                                                                {dayInfo.events.map((event) => {
                                                                    const EventIcon = getEventIcon(event.userRole);
                                                                    const isCancelled = isEventCancelled(event);
                                                                    const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                                    return (
                                                                        <div
                                                                            key={event.spanId || event.id}
                                                                            className={`p-2 rounded text-xs flex items-start gap-1 cursor-pointer transition-all duration-200 ease-in-out ${event.isMultiDay ? (
                                                                                event.isFirstDay ? 'rounded-r-none' :
                                                                                    event.isLastDay ? 'rounded-l-none' :
                                                                                        'rounded-none'
                                                                            ) : ''
                                                                                }`}
                                                                            onClick={() => handleEventClick(event)}
                                                                            style={{
                                                                                backgroundColor: `${eventColor}20`,
                                                                                borderLeft: event.isFirstDay || !event.isMultiDay ? `3px solid ${eventColor}` : 'none',
                                                                                borderRight: event.isLastDay || !event.isMultiDay ? 'none' : `1px solid ${eventColor}`,
                                                                                color: '#000000',
                                                                                textDecoration: isCancelled ? 'line-through' : 'none',
                                                                                opacity: isCancelled ? 0.7 : 1,
                                                                                marginLeft: event.isMultiDay && !event.isFirstDay ? '-1px' : '0',
                                                                                marginRight: event.isMultiDay && !event.isLastDay ? '-1px' : '0'
                                                                            }}
                                                                            title={`${event.title} - ${event.userRole === 'guide' ? 'Leading' : 'Participating'}${isCancelled ? ' (Cancelled)' : ''
                                                                                }${event.isMultiDay ? ` (Day ${event.dayIndex + 1}/${event.totalDays})` : ''}`}
                                                                            onMouseEnter={(e) => {
                                                                                if (event.isMultiDay) {
                                                                                    const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                                    allSpans.forEach(span => {
                                                                                        span.style.transform = 'translateY(-2px) scale(1.02)';
                                                                                        span.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                                                                                        span.style.backgroundColor = `${eventColor}35`;
                                                                                        span.style.zIndex = '10';
                                                                                    });
                                                                                } else {
                                                                                    e.currentTarget.style.transform = 'translateX(3px) scale(1.02)';
                                                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
                                                                                    e.currentTarget.style.backgroundColor = `${eventColor}30`;
                                                                                    e.currentTarget.style.zIndex = '10';
                                                                                }
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                if (event.isMultiDay) {
                                                                                    const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                                    allSpans.forEach(span => {
                                                                                        span.style.transform = 'translateY(0) scale(1)';
                                                                                        span.style.boxShadow = 'none';
                                                                                        span.style.backgroundColor = `${eventColor}20`;
                                                                                        span.style.zIndex = 'auto';
                                                                                    });
                                                                                } else {
                                                                                    e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                                    e.currentTarget.style.backgroundColor = `${eventColor}20`;
                                                                                    e.currentTarget.style.zIndex = 'auto';
                                                                                }
                                                                            }}
                                                                            data-event-id={event.id}
                                                                        >
                                                                            {(event.isFirstDay || !event.isMultiDay) ? (
                                                                                <EventIcon
                                                                                    size={10}
                                                                                    className="flex-shrink-0 mt-0.5 transition-transform duration-200"
                                                                                    color={eventColor}
                                                                                />
                                                                            ) : (
                                                                                <EventIcon size={10} className="flex-shrink-0 mt-0.5" color={eventColor} />
                                                                            )}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`font-medium leading-tight transition-colors duration-200 ${isCancelled ? 'line-through' : ''}`} style={{
                                                                                    fontSize: '10px',
                                                                                    lineHeight: '1.2',
                                                                                    wordBreak: 'break-word',
                                                                                    overflowWrap: 'break-word',
                                                                                    whiteSpace: 'normal',
                                                                                    color: '#000000'
                                                                                }}>
                                                                                    {event.isMultiDay ?
                                                                                        `${event.title} (Day ${event.dayIndex + 1}/${event.totalDays})` :
                                                                                        event.title
                                                                                    }
                                                                                </div>
                                                                                <div className="opacity-75 mt-1 transition-opacity duration-200" style={{ fontSize: '8px', color: '#000000' }}>
                                                                                    {formatEventTime(event.startDateTime, event.endDateTime)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {calendarView === 'day' && (
                                        <div className="bg-white rounded-lg shadow-sm">
                                            {/* Day view header */}
                                            <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => navigateTime(-1, 'day')}
                                                        disabled={navigationLoading}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                                            ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                                            : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                                            }`}
                                                    >
                                                        {navigationLoading ? (
                                                            <div className="w-5 h-5 animate-spin">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <h2 className={`text-2xl font-semibold transition-opacity duration-200 ${currentDate.toDateString() === new Date().toDateString()
                                                        ? 'text-green-700 font-bold'
                                                        : 'text-neutrals-1'
                                                        }`}>{getViewHeaderText()}</h2>
                                                    <button
                                                        onClick={() => navigateTime(1, 'day')}
                                                        disabled={navigationLoading}
                                                        className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                                            ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                                            : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                                            }`}
                                                    >
                                                        {navigationLoading ? (
                                                            <div className="w-5 h-5 animate-spin">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="text-sm text-neutrals-4">
                                                    {getCurrentDayEvents().length} events scheduled
                                                </div>
                                            </div>

                                            {/* Day view content - Schedule Layout */}
                                            <div className={`transition-opacity duration-300 ${navigationLoading ? 'opacity-70' : 'opacity-100'} overflow-auto max-h-[calc(100vh-200px)] p-4 lg:p-0`}>
                                                {getCurrentDayEvents().length === 0 ? (
                                                    <div className="p-12 text-center">
                                                        <p className="text-neutrals-4 text-lg">No events scheduled for this day.</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex min-h-full">
                                                        {/* Time column */}
                                                        <div className="w-20 border-r border-neutrals-7 flex-shrink-0">
                                                            {generateTimeSlots().map((slot) => (
                                                                <div key={slot.hour} className="h-16 border-b border-neutrals-8 flex items-start justify-end pr-3 pt-2">
                                                                    <span className="text-xs text-neutrals-4 font-medium">
                                                                        {slot.displayTime}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Events column */}
                                                        <div className="flex-1 relative min-h-full">
                                                            {/* Hour grid lines */}
                                                            {generateTimeSlots().map((slot) => (
                                                                <div key={slot.hour} className="h-16 border-b border-neutrals-8"></div>
                                                            ))}

                                                            {/* Events positioned absolutely with overlap support */}
                                                            {getCurrentDayEvents().map((event) => {
                                                                const position = getEventPosition(event);
                                                                const EventIcon = getEventIcon(event.userRole);
                                                                const isCancelled = isEventCancelled(event);
                                                                const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                                return (
                                                                    <div
                                                                        key={event.id}
                                                                        className="absolute rounded-lg p-3 border-l-4 shadow-sm transition-all duration-300 ease-out cursor-pointer group"
                                                                        style={{
                                                                            top: `${position.top}px`,
                                                                            height: `${position.height}px`,
                                                                            width: event.hasOverlap ? position.width : `calc(${position.width} - 16px)`,
                                                                            left: event.hasOverlap ? `calc(${position.left} + 8px)` : '8px',
                                                                            minHeight: '60px',
                                                                            backgroundColor: '#ffffff',
                                                                            borderLeftColor: eventColor,
                                                                            color: '#000000',
                                                                            transform: 'translateY(0) scale(1)',
                                                                            zIndex: event.hasOverlap ? `${2 + event.overlapPosition}` : '1',
                                                                            textDecoration: isCancelled ? 'line-through' : 'none',
                                                                            opacity: isCancelled ? 0.7 : 1
                                                                        }}
                                                                        title={`${event.title}${isCancelled ? ' (Cancelled)' : ''}${event.isMultiDay ? ` (Multi-day)` : ''
                                                                            }${event.hasOverlap ? ` (${event.overlapPosition + 1} of ${event.overlapCount})` : ''}`}
                                                                        onClick={() => handleEventClick(event)}
                                                                        onMouseEnter={(e) => {
                                                                            if (event.hasOverlap) {
                                                                                // Highlight all overlapping events
                                                                                const allOverlapping = document.querySelectorAll(`[data-overlap-group="${event.id}"]`);
                                                                                allOverlapping.forEach(el => {
                                                                                    el.style.transform = 'translateY(-2px) scale(1.02)';
                                                                                    el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)';
                                                                                    el.style.zIndex = '20';
                                                                                });
                                                                            } else {
                                                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)';
                                                                                e.currentTarget.style.zIndex = '10';
                                                                            }
                                                                            e.currentTarget.style.borderLeftWidth = '6px';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (event.hasOverlap) {
                                                                                const allOverlapping = document.querySelectorAll(`[data-overlap-group="${event.id}"]`);
                                                                                allOverlapping.forEach(el => {
                                                                                    el.style.transform = 'translateY(0) scale(1)';
                                                                                    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                                                                    el.style.zIndex = `${2 + parseInt(el.dataset.overlapPosition)}`;
                                                                                });
                                                                            } else {
                                                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                                                                e.currentTarget.style.zIndex = '1';
                                                                            }
                                                                            e.currentTarget.style.borderLeftWidth = '4px';
                                                                        }}
                                                                        data-overlap-group={event.hasOverlap ? event.id : null}
                                                                        data-overlap-position={event.overlapPosition}
                                                                    >
                                                                        <div className="flex items-start justify-between h-full">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <EventIcon
                                                                                        size={14}
                                                                                        color={eventColor}
                                                                                        className="transition-transform duration-300 group-hover:scale-125"
                                                                                    />
                                                                                    <h4 className={`font-semibold text-sm leading-tight transition-all duration-300 group-hover:text-blue-800 ${isCancelled ? 'line-through' : ''}`} style={{
                                                                                        wordBreak: 'break-word',
                                                                                        overflowWrap: 'break-word',
                                                                                        whiteSpace: 'normal',
                                                                                        lineHeight: '1.3',
                                                                                        color: '#000000'
                                                                                    }}>
                                                                                        {event.title}
                                                                                    </h4>
                                                                                </div>
                                                                                <p className="text-xs opacity-90 mb-1 transition-opacity duration-300 group-hover:opacity-100" style={{ color: '#000000' }}>
                                                                                    {position.startTime} - {position.endTime}
                                                                                    {position.isMultiDay && (
                                                                                        <span className="ml-2 text-xs text-blue-600">
                                                                                            Multi-day
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                                {position.height > 90 && (
                                                                                    <>
                                                                                        <p className="text-xs opacity-75 mb-1 transition-opacity duration-300 group-hover:opacity-100" style={{ color: '#000000' }}>
                                                                                            📍 {event.location}
                                                                                        </p>
                                                                                    </>
                                                                                )}
                                                                                {isCancelled && (
                                                                                    <p className="text-xs text-red-600 opacity-80 mt-1">
                                                                                        ❌ Cancelled
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden w-full">
                <Navbar
                    isAuthenticated={true}
                    variant="mobile"
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                <main className="w-full p-4 pb-24 overflow-hidden min-w-0">
                    <div className="max-w-6xl mx-auto min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-neutrals-1">Calendar</h1>
                            <span className={`px-2 py-1 text-xs rounded-full border ${isTourGuide
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                {isTourGuide ? 'Tour Guide' : 'Tourist'}
                            </span>
                        </div>
                        <p className="text-base text-neutrals-3 mb-6">
                            {isTourGuide
                                ? "Manage your tours and track experiences you're participating in."
                                : "Keep track of your booked travel experiences and upcoming adventures."
                            }
                        </p>

                        {/* Calendar Navigation */}
                        <div className="bg-white rounded-lg shadow-sm mb-4">
                            {/* View Toggle Buttons */}
                            <div className="flex items-center justify-center gap-1 p-4 border-b border-neutrals-6">
                                <button
                                    onClick={() => setCalendarView('month')}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${calendarView === 'month'
                                        ? 'bg-primary-1 text-white'
                                        : 'bg-neutrals-8 text-neutrals-3 border border-neutrals-6'
                                        }`}
                                >
                                    Month
                                </button>
                                <button
                                    onClick={() => setCalendarView('week')}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${calendarView === 'week'
                                        ? 'bg-primary-1 text-white'
                                        : 'bg-neutrals-8 text-neutrals-3 border border-neutrals-6'
                                        }`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setCalendarView('day')}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${calendarView === 'day'
                                        ? 'bg-primary-1 text-white'
                                        : 'bg-neutrals-8 text-neutrals-3 border border-neutrals-6'
                                        }`}
                                >
                                    Day
                                </button>
                            </div>

                            {/* Calendar Header with Navigation */}
                            <div className="flex items-center justify-between p-4 border-b border-neutrals-6">
                                <button
                                    onClick={() => navigateTime(-1, calendarView === 'day' ? 'day' : calendarView === 'week' ? 'week' : 'month')}
                                    disabled={navigationLoading}
                                    className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                        ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                        : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className={`text-xl font-semibold transition-opacity duration-200 ${calendarView === 'day' && currentDate.toDateString() === new Date().toDateString()
                                    ? 'text-green-700 font-bold'
                                    : 'text-neutrals-1'
                                    }`}>{getViewHeaderText()}</h2>
                                <button
                                    onClick={() => navigateTime(1, calendarView === 'day' ? 'day' : calendarView === 'week' ? 'week' : 'month')}
                                    disabled={navigationLoading}
                                    className={`p-2 rounded-lg transition-all duration-200 ${navigationLoading
                                        ? 'bg-neutrals-7 text-neutrals-5 cursor-not-allowed'
                                        : 'hover:bg-neutrals-7 text-neutrals-3 hover:text-neutrals-2'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Compact Calendar Display */}
                            <div className={`p-4 transition-opacity duration-300 ${navigationLoading ? 'opacity-70' : 'opacity-100'}`}>
                                {calendarView === 'month' && (
                                    <div>
                                        {/* Day headers */}
                                        <div className="grid grid-cols-7 gap-1 mb-2">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                <div key={day} className="p-2 text-center text-xs font-medium text-neutrals-4">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Calendar grid */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {generateCalendarDays().map((dayInfo, i) => (
                                                <div
                                                    key={i}
                                                    className={`min-h-[80px] p-1 border border-neutrals-7 rounded transition-all duration-200 ${dayInfo.isCurrentMonth ? 'bg-white' : 'bg-neutrals-8'
                                                        } ${dayInfo.isToday ? 'bg-green-50 ring-1 ring-green-500 border-green-500' : ''}`}
                                                >
                                                    <div className={`text-xs mb-1 text-center ${dayInfo.isCurrentMonth ? 'text-neutrals-1' : 'text-neutrals-5'
                                                        } ${dayInfo.isToday ? 'font-bold text-green-700' : ''}`}>
                                                        {dayInfo.day}
                                                    </div>
                                                    <div className="flex flex-wrap gap-0.5 justify-center">
                                                        {dayInfo.events.slice(0, 4).map((event) => {
                                                            const isCancelled = isEventCancelled(event);
                                                            const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                            return (
                                                                <div
                                                                    key={event.spanId || event.id}
                                                                    onClick={() => handleEventClick(event)}
                                                                    className={`cursor-pointer transition-all duration-200 hover:scale-125 hover:shadow-lg ${event.isMultiDay ? 'rounded-none' : 'rounded-full'
                                                                        } ${isCancelled ? 'opacity-60' : ''}`}
                                                                    style={{
                                                                        backgroundColor: eventColor,
                                                                        width: event.isMultiDay ? '12px' : '6px',
                                                                        height: '6px',
                                                                        borderRadius: event.isMultiDay ? (
                                                                            event.isFirstDay ? '3px 0 0 3px' :
                                                                                event.isLastDay ? '0 3px 3px 0' :
                                                                                    '0'
                                                                        ) : '50%'
                                                                    }}
                                                                    title={`${event.title}${isCancelled ? ' (Cancelled)' : ''}${event.isMultiDay ? ` (Day ${event.dayIndex + 1}/${event.totalDays})` : ''
                                                                        }`}
                                                                    onMouseEnter={(e) => {
                                                                        if (event.isMultiDay) {
                                                                            const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                            allSpans.forEach(span => {
                                                                                span.style.transform = 'scaleY(1.5)';
                                                                                span.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                                                                                span.style.zIndex = '10';
                                                                            });
                                                                        } else {
                                                                            e.currentTarget.style.transform = 'scale(1.4)';
                                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                                                            e.currentTarget.style.zIndex = '10';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (event.isMultiDay) {
                                                                            const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                            allSpans.forEach(span => {
                                                                                span.style.transform = 'scaleY(1)';
                                                                                span.style.boxShadow = 'none';
                                                                                span.style.zIndex = 'auto';
                                                                            });
                                                                        } else {
                                                                            e.currentTarget.style.transform = 'scale(1)';
                                                                            e.currentTarget.style.boxShadow = 'none';
                                                                            e.currentTarget.style.zIndex = 'auto';
                                                                        }
                                                                    }}
                                                                    data-event-id={event.id}
                                                                />
                                                            );
                                                        })}
                                                        {/* No "+X more" annotation for mobile month view */}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {calendarView === 'week' && (
                                    <div className="grid grid-cols-7 gap-1">
                                        {generateWeekDays().map((dayInfo, i) => (
                                            <div key={i} className="min-h-[120px] border border-neutrals-7 rounded-lg">
                                                <div className={`p-1.5 text-center border-b border-neutrals-7 ${dayInfo.isToday ? 'bg-primary-1 text-white' : 'bg-neutrals-8'
                                                    }`}>
                                                    <div className="text-xs font-medium">
                                                        {dayInfo.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className="text-sm font-semibold">
                                                        {dayInfo.day}
                                                    </div>
                                                </div>
                                                <div className="p-2 flex flex-wrap gap-1 justify-center">
                                                    {dayInfo.events.slice(0, 6).map((event) => {
                                                        const isCancelled = isEventCancelled(event);
                                                        const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                        return (
                                                            <div
                                                                key={event.spanId || event.id}
                                                                onClick={() => handleEventClick(event)}
                                                                className={`w-2 h-2 cursor-pointer transition-all duration-200 hover:scale-125 hover:shadow-lg ${event.isMultiDay ? 'rounded-none' : 'rounded-full'
                                                                    } ${isCancelled ? 'opacity-60' : ''}`}
                                                                style={{
                                                                    backgroundColor: eventColor,
                                                                    width: event.isMultiDay ? '16px' : '8px',
                                                                    height: '8px',
                                                                    borderRadius: event.isMultiDay ? (
                                                                        event.isFirstDay ? '4px 0 0 4px' :
                                                                            event.isLastDay ? '0 4px 4px 0' :
                                                                                '0'
                                                                    ) : '50%'
                                                                }}
                                                                title={`${event.title}${isCancelled ? ' (Cancelled)' : ''}${event.isMultiDay ? ` (Day ${event.dayIndex + 1}/${event.totalDays})` : ''
                                                                    } - ${formatEventTime(event.startDateTime, event.endDateTime)}`}
                                                                onMouseEnter={(e) => {
                                                                    if (event.isMultiDay) {
                                                                        const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                        allSpans.forEach(span => {
                                                                            span.style.transform = 'scaleY(1.5)';
                                                                            span.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                                                                            span.style.zIndex = '10';
                                                                        });
                                                                    } else {
                                                                        e.currentTarget.style.transform = 'scale(1.4)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                                                        e.currentTarget.style.zIndex = '10';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (event.isMultiDay) {
                                                                        const allSpans = document.querySelectorAll(`[data-event-id="${event.id}"]`);
                                                                        allSpans.forEach(span => {
                                                                            span.style.transform = 'scaleY(1)';
                                                                            span.style.boxShadow = 'none';
                                                                            span.style.zIndex = 'auto';
                                                                        });
                                                                    } else {
                                                                        e.currentTarget.style.transform = 'scale(1)';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                        e.currentTarget.style.zIndex = 'auto';
                                                                    }
                                                                }}
                                                                data-event-id={event.id}
                                                            />
                                                        );
                                                    })}
                                                    {/* No "+X more" annotation for mobile week view */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {calendarView === 'day' && (
                                    <div>
                                        {getCurrentDayEvents().length === 0 ? (
                                            <div className="p-8 text-center">
                                                <p className="text-neutrals-4">No events scheduled for this day.</p>
                                            </div>
                                        ) : (
                                            <div className="flex min-h-[400px] max-h-[500px] overflow-y-auto">
                                                {/* Time column */}
                                                <div className="w-16 border-r border-neutrals-7 flex-shrink-0 bg-neutrals-8 sticky left-0 z-10">
                                                    {generateTimeSlots().map((slot) => (
                                                        <div key={slot.hour} className="h-12 border-b border-neutrals-7 flex items-start justify-end pr-2 pt-1">
                                                            <span className="text-xs text-neutrals-4 font-medium" style={{ fontSize: '10px' }}>
                                                                {slot.displayTime}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Events column */}
                                                <div className="flex-1 relative min-h-full">
                                                    {/* Hour grid lines */}
                                                    {generateTimeSlots().map((slot) => (
                                                        <div key={slot.hour} className="h-12 border-b border-neutrals-8"></div>
                                                    ))}

                                                    {/* Events positioned absolutely */}
                                                    {getCurrentDayEvents().map((event) => {
                                                        const position = getEventPosition(event);
                                                        const EventIcon = getEventIcon(event.userRole);
                                                        // Scale position for mobile (12px per hour instead of 16px)
                                                        const mobileTop = position.top * 0.75;
                                                        const mobileHeight = Math.max(position.height * 0.75, 36);

                                                        const isCancelled = isEventCancelled(event);
                                                        const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className={`absolute rounded-lg p-2 border-l-2 shadow-sm transition-all duration-200 cursor-pointer group ${isCancelled ? 'opacity-70' : ''
                                                                    }`}
                                                                style={{
                                                                    top: `${mobileTop}px`,
                                                                    height: `${mobileHeight}px`,
                                                                    width: event.hasOverlap ? position.width : `calc(${position.width} - 8px)`,
                                                                    left: event.hasOverlap ? `calc(${position.left} + 4px)` : '4px',
                                                                    minHeight: '36px',
                                                                    backgroundColor: '#ffffff',
                                                                    borderLeftColor: eventColor,
                                                                    transform: 'translateY(0) scale(1)',
                                                                    zIndex: event.hasOverlap ? `${2 + event.overlapPosition}` : '1',
                                                                    textDecoration: isCancelled ? 'line-through' : 'none'
                                                                }}
                                                                onClick={() => handleEventClick(event)}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                                                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)';
                                                                    e.currentTarget.style.zIndex = '10';
                                                                    e.currentTarget.style.borderLeftWidth = '4px';
                                                                    e.currentTarget.style.marginLeft = '-2px';
                                                                    e.currentTarget.style.marginRight = '-2px';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                                                    e.currentTarget.style.zIndex = '1';
                                                                    e.currentTarget.style.borderLeftWidth = '2px';
                                                                    e.currentTarget.style.marginLeft = '0';
                                                                    e.currentTarget.style.marginRight = '0';
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-1 h-full">
                                                                    <EventIcon
                                                                        size={10}
                                                                        color={eventColor}
                                                                        className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className={`font-medium text-neutrals-1 leading-tight transition-colors duration-200 group-hover:text-blue-800 ${isCancelled ? 'line-through' : ''
                                                                            }`} style={{
                                                                                fontSize: '11px',
                                                                                lineHeight: '1.2',
                                                                                wordBreak: 'break-word',
                                                                                overflowWrap: 'break-word',
                                                                                whiteSpace: 'normal'
                                                                            }}>
                                                                            {event.title}
                                                                        </h4>
                                                                        <p className="text-neutrals-4 mt-0.5 transition-opacity duration-200 group-hover:opacity-100" style={{ fontSize: '9px' }}>
                                                                            {position.startTime} - {position.endTime}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                            <h3 className="text-sm font-semibold text-neutrals-1 mb-3">Filters</h3>
                            <div className="space-y-3">
                                {/* Tour Type Filters (only for tour guides) */}
                                {isTourGuide && (
                                    <div>
                                        <span className="text-sm font-medium text-neutrals-2 block mb-2">Tour Type:</span>
                                        <div className="flex gap-1 flex-wrap">
                                            <FilterButton
                                                value="myTours"
                                                label="My Tours"
                                                currentValue={activeFilters.tourType}
                                                onChange={(value) => setActiveFilters(prev => ({ ...prev, tourType: value }))}
                                            />
                                            <FilterButton
                                                value="joinedTours"
                                                label="Joined Tours"
                                                currentValue={activeFilters.tourType}
                                                onChange={(value) => setActiveFilters(prev => ({ ...prev, tourType: value }))}
                                            />
                                            <FilterButton
                                                value="all"
                                                label="All"
                                                currentValue={activeFilters.tourType}
                                                onChange={(value) => setActiveFilters(prev => ({ ...prev, tourType: value }))}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Time Period Filters */}
                                <div>
                                    <span className="text-sm font-medium text-neutrals-2 block mb-2">Time Period:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        <FilterButton
                                            value="upcoming"
                                            label="Upcoming"
                                            currentValue={activeFilters.timePeriod}
                                            onChange={(value) => setActiveFilters(prev => ({ ...prev, timePeriod: value }))}
                                        />
                                        <FilterButton
                                            value="past"
                                            label="Past"
                                            currentValue={activeFilters.timePeriod}
                                            onChange={(value) => setActiveFilters(prev => ({ ...prev, timePeriod: value }))}
                                        />
                                        <FilterButton
                                            value="all"
                                            label="All"
                                            currentValue={activeFilters.timePeriod}
                                            onChange={(value) => setActiveFilters(prev => ({ ...prev, timePeriod: value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activities List */}
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-4 border-b border-neutrals-6">
                                <h3 className="text-sm font-semibold text-neutrals-1">
                                    {calendarView === 'day' ? 'Today\'s Activities' :
                                        calendarView === 'week' ? 'This Week\'s Activities' :
                                            'This Month\'s Activities'}
                                    <span className="ml-2 text-xs text-neutrals-4">
                                        ({getLeftPanelEvents().length})
                                    </span>
                                </h3>
                            </div>

                            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                {getLeftPanelEvents().length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-neutrals-4">No activities found for this period.</p>
                                    </div>
                                ) : (
                                    getLeftPanelEvents().map((event) => {
                                        const EventIcon = getEventIcon(event.userRole);
                                        const isCancelled = isEventCancelled(event);
                                        const eventColor = getEventColor(event.userRole, event.isPast, isCancelled);

                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => handleEventClick(event)}
                                                className={`flex items-start gap-3 p-3 rounded-lg border border-neutrals-6 hover:border-primary-1 cursor-pointer transition-all duration-200 ${isCancelled ? 'opacity-70' : ''
                                                    }`}
                                            >
                                                {event.coverPhotoUrl && (
                                                    <img
                                                        src={event.coverPhotoUrl}
                                                        alt={event.title}
                                                        className={`w-12 h-12 rounded-lg object-cover flex-shrink-0 ${isCancelled ? 'grayscale' : ''
                                                            }`}
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <EventIcon size={16} className="flex-shrink-0 mt-0.5" style={{ color: eventColor }} />
                                                        <h3 className={`font-medium text-neutrals-1 text-sm leading-tight flex-1 ${isCancelled ? 'line-through' : ''
                                                            }`} style={{
                                                                wordBreak: 'break-word',
                                                                overflowWrap: 'break-word',
                                                                whiteSpace: 'normal',
                                                                lineHeight: '1.3'
                                                            }}>
                                                            {event.title}
                                                        </h3>
                                                        {isCancelled && (
                                                            <span className="text-xs text-red-600 font-medium">CANCELLED</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-neutrals-4 mb-1">
                                                        {event.isMultiDay && (
                                                            <span className="ml-2 text-blue-600">Multi-day</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-neutrals-4">
                                                        {formatEventTime(event.startDateTime, event.endDateTime)}
                                                    </p>
                                                    {event.location && (
                                                        <p className="text-xs text-neutrals-4 mt-1">
                                                            📍 {event.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default CalendarPage;