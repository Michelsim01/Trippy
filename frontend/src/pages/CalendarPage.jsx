import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Ticket, Eye } from 'lucide-react';
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


            // Debug: Check user's created experiences
            if (isTourGuide && userId) {
                try {
                    const expResponse = await fetch(`http://localhost:8080/api/experiences/guide/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const experiences = await expResponse.json();
                } catch (expError) {
                }
            }

            const data = await calendarApi.getUserMonthlyEvents(userId, year, month);


            if (data.success) {
                setEvents({
                    participantEvents: data.participantEvents || [],
                    guideEvents: data.guideEvents || []
                });
            } else {
                setError(data.error || 'Failed to fetch calendar data');
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


        // Sort by date
        filtered.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

        setFilteredEvents(filtered);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

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

        return `${startTime} - ${endTime}`;
    };

    const formatEventDate = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const formatDuration = (duration) => {
        if (duration >= 24) {
            const days = Math.floor(duration / 24);
            const hours = duration % 24;
            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
        }
        return `${duration}h`;
    };

    const getEventTypeColor = (userRole, isPast) => {
        if (isPast) {
            return 'bg-neutrals-6 text-neutrals-4';
        }

        return userRole === 'guide'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-green-100 text-green-800 border-green-200';
    };

    const getEventTypeBadge = (userRole) => {
        return userRole === 'guide' ? 'Leading' : 'Participating';
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const eventsByDate = calendarApi.groupEventsByDate(filteredEvents);

        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);

            const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateKey] || [];
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();

            days.push({
                date: day,
                day: day.getDate(),
                isCurrentMonth,
                isToday,
                events: dayEvents
            });
        }

        return days;
    };

    const generateWeekDays = () => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(currentDate.getDate() - day);

        const days = [];
        const eventsByDate = calendarApi.groupEventsByDate(filteredEvents);

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
        const eventsByDate = calendarApi.groupEventsByDate(filteredEvents);
        return eventsByDate[dateKey] || [];
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

        const startHour = startTime.getHours();
        const startMinutes = startTime.getMinutes();
        const endHour = endTime.getHours();
        const endMinutes = endTime.getMinutes();

        // Calculate position as percentage from start of day (64px per hour for h-16)
        const startPosition = (startHour * 60) + startMinutes; // minutes from start of day
        const duration = ((endHour * 60) + endMinutes) - startPosition; // duration in minutes

        return {
            top: (startPosition / 60) * 64, // 64px per hour (h-16)
            height: Math.max((duration / 60) * 64, 32), // minimum 32px height, 64px per hour
            startTime: startTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            endTime: endTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
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
            const endDate = weekDays[6].date;

            return filteredEvents.filter(event => {
                const eventDate = new Date(event.startDateTime);
                return eventDate >= startDate && eventDate <= endDate;
            });
        } else {
            // Month view - get all events for the current month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            return filteredEvents.filter(event => {
                const eventDate = new Date(event.startDateTime);
                return eventDate >= firstDay && eventDate <= lastDay;
            });
        }
    };

    // Get color based on event type and state
    const getEventColor = (userRole, isPast) => {
        if (isPast) return 'var(--color-neutrals-4)';
        return userRole === 'guide' ? 'var(--color-primary-4)' : 'var(--color-primary-1)';
    };

    // Get icon for event type
    const getEventIcon = (userRole) => {
        return userRole === 'guide' ? Crown : Ticket;
    };

    // Handle click on event to navigate to experience details
    const handleEventClick = (event) => {
        if (event.experienceId) {
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
                    <main className="w-full p-8">
                        <div className="max-w-full mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCalendarView('month')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${calendarView === 'month'
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white text-neutrals-3 border border-neutrals-6 hover:bg-neutrals-8'
                                            }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setCalendarView('week')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${calendarView === 'week'
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white text-neutrals-3 border border-neutrals-6 hover:bg-neutrals-8'
                                            }`}
                                    >
                                        Week
                                    </button>
                                    <button
                                        onClick={() => setCalendarView('day')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${calendarView === 'day'
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white text-neutrals-3 border border-neutrals-6 hover:bg-neutrals-8'
                                            }`}
                                    >
                                        Day
                                    </button>
                                </div>
                            </div>

                            {/* Split Layout: Left Panel (30%) + Calendar (70%) */}
                            <div className={`flex gap-6 ${calendarView === 'day' ? 'h-auto min-h-[800px]' : 'h-[800px]'}`}>
                                {/* Left Panel */}
                                <div className="w-[30%] bg-white rounded-lg shadow-sm flex flex-col">
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
                                                            return (
                                                                <div
                                                                    key={event.id}
                                                                    onClick={() => handleEventClick(event)}
                                                                    className="border border-neutrals-6 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                                    style={{
                                                                        borderLeftWidth: '4px',
                                                                        borderLeftColor: getEventColor(event.userRole, event.isPast)
                                                                    }}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {event.coverPhotoUrl ? (
                                                                            <img
                                                                                src={event.coverPhotoUrl}
                                                                                alt={event.title}
                                                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-12 h-12 rounded-lg bg-neutrals-7 flex items-center justify-center flex-shrink-0">
                                                                                <EventIcon
                                                                                    size={20}
                                                                                    style={{ color: getEventColor(event.userRole, event.isPast) }}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <h5 className="font-semibold text-sm text-neutrals-1 leading-tight">{event.title}</h5>
                                                                                <EventIcon
                                                                                    size={14}
                                                                                    style={{ color: getEventColor(event.userRole, event.isPast) }}
                                                                                />
                                                                            </div>
                                                                            <p className="text-xs text-neutrals-4 mb-1">
                                                                                {formatEventDate(event.startDateTime)}
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
                                                        {/* 👇 Spacer div to ensure last item isn’t flush with bottom */}
                                                        <div className="h-8" />
                                                    </>
                                                )}
                                            </div>
                                        </div>


                                    </div>
                                </div>

                                {/* Calendar Section (70%) */}
                                <div className="w-[70%] bg-white rounded-lg shadow-sm">
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
                                            <div className={`p-6 transition-opacity duration-300 ${navigationLoading ? 'opacity-70' : 'opacity-100'}`}>
                                                {/* Days of week */}
                                                <div className="grid grid-cols-7 gap-1 mb-4">
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                        <div key={day} className="p-3 text-center text-sm font-medium text-neutrals-4">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Calendar days */}
                                                <div className="grid grid-cols-7 gap-1 transition-all duration-300">
                                                    {generateCalendarDays().map((dayInfo, i) => (
                                                        <div
                                                            key={i}
                                                            className={`min-h-[100px] p-2 border border-neutrals-7 transition-all duration-200 ${dayInfo.isCurrentMonth ? 'bg-white hover:bg-neutrals-8' : 'bg-neutrals-8'
                                                                } ${dayInfo.isToday ? 'bg-green-50 ring-2 ring-green-500 border-green-500' : ''}`}
                                                        >
                                                            <div className={`text-sm mb-1 ${dayInfo.isCurrentMonth ? 'text-neutrals-1' : 'text-neutrals-5'
                                                                } ${dayInfo.isToday ? 'font-bold text-green-700' : ''}`}>
                                                                {dayInfo.day}
                                                            </div>
                                                            <div className="space-y-1">
                                                                {dayInfo.events.slice(0, 2).map((event) => {
                                                                    const EventIcon = getEventIcon(event.userRole);
                                                                    return (
                                                                        <div
                                                                            key={event.id}
                                                                            onClick={() => handleEventClick(event)}
                                                                            className="text-xs p-1 rounded leading-tight overflow-hidden flex items-center gap-1 cursor-pointer transition-all duration-200 ease-in-out"
                                                                            title={`${event.title} - ${event.userRole === 'guide' ? 'Leading' : 'Participating'}`}
                                                                            style={{
                                                                                fontSize: '10px',
                                                                                lineHeight: '1.2',
                                                                                wordBreak: 'break-word',
                                                                                display: '-webkit-box',
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient: 'vertical',
                                                                                backgroundColor: `${getEventColor(event.userRole, event.isPast)}20`,
                                                                                borderLeft: `3px solid ${getEventColor(event.userRole, event.isPast)}`,
                                                                                color: '#000000'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.transform = 'translateX(2px)';
                                                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                                e.currentTarget.style.backgroundColor = `${getEventColor(event.userRole, event.isPast)}40`;
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.transform = 'translateX(0)';
                                                                                e.currentTarget.style.boxShadow = 'none';
                                                                                e.currentTarget.style.backgroundColor = `${getEventColor(event.userRole, event.isPast)}20`;
                                                                            }}
                                                                        >
                                                                            <EventIcon size={8} color={`${getEventColor(event.userRole, event.isPast)}`} />
                                                                            <span className="truncate">{event.title}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {dayInfo.events.length > 2 && (
                                                                    <div
                                                                        className="text-xs text-neutrals-4 px-1 cursor-pointer transition-opacity duration-200"
                                                                        title={`View all ${dayInfo.events.length} events`}
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
                                                            </div>
                                                        </div>
                                                    ))}
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
                                            <div className={`p-6 transition-opacity duration-300 ${navigationLoading ? 'opacity-70' : 'opacity-100'}`}>
                                                <div className="grid grid-cols-7 gap-4">
                                                    {generateWeekDays().map((dayInfo, i) => (
                                                        <div key={i} className="min-h-[300px] border border-neutrals-7 rounded-lg">
                                                            <div className={`p-3 text-center border-b border-neutrals-7 ${dayInfo.isToday ? 'bg-primary-1 text-white' : 'bg-neutrals-8'
                                                                }`}>
                                                                <div className="text-xs font-medium">
                                                                    {dayInfo.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                                </div>
                                                                <div className="text-lg font-semibold">
                                                                    {dayInfo.day}
                                                                </div>
                                                            </div>
                                                            <div className="p-2 space-y-1">
                                                                {dayInfo.events.map((event) => {
                                                                    const EventIcon = getEventIcon(event.userRole);
                                                                    return (
                                                                        <div className="p-2 space-y-1">
                                                                            {dayInfo.events.map((event) => {
                                                                                const EventIcon = getEventIcon(event.userRole);
                                                                                return (
                                                                                    <div
                                                                                        key={event.id}
                                                                                        className="p-2 rounded text-xs flex items-start gap-1 cursor-pointer transition-all duration-200 ease-in-out"
                                                                                        onClick={() => handleEventClick(event)}
                                                                                        style={{
                                                                                            backgroundColor: `${getEventColor(event.userRole, event.isPast)}20`,
                                                                                            borderLeft: `3px solid ${getEventColor(event.userRole, event.isPast)}`,
                                                                                            color: '#000000'
                                                                                        }}
                                                                                        title={`${event.title} - ${event.userRole === 'guide' ? 'Leading' : 'Participating'}`}
                                                                                        onMouseEnter={(e) => {
                                                                                            e.currentTarget.style.transform = 'translateX(3px) scale(1.02)';
                                                                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
                                                                                            e.currentTarget.style.backgroundColor = `${getEventColor(event.userRole, event.isPast)}30`;
                                                                                            e.currentTarget.style.zIndex = '10';
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                                                                            e.currentTarget.style.boxShadow = 'none';
                                                                                            e.currentTarget.style.backgroundColor = `${getEventColor(event.userRole, event.isPast)}20`;
                                                                                            e.currentTarget.style.zIndex = 'auto';
                                                                                        }}
                                                                                    >
                                                                                        <EventIcon
                                                                                            size={10}
                                                                                            className="flex-shrink-0 mt-0.5 transition-transform duration-200"
                                                                                            color={`${getEventColor(event.userRole, event.isPast)}`}
                                                                                            onMouseEnter={(e) => {
                                                                                                e.currentTarget.style.transform = 'scale(1.2)';
                                                                                            }}
                                                                                            onMouseLeave={(e) => {
                                                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                                            }}
                                                                                        />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="font-medium leading-tight transition-colors duration-200" style={{
                                                                                                fontSize: '10px',
                                                                                                lineHeight: '1.2',
                                                                                                wordBreak: 'break-word',
                                                                                                overflowWrap: 'break-word',
                                                                                                display: '-webkit-box',
                                                                                                WebkitLineClamp: 3,
                                                                                                WebkitBoxOrient: 'vertical',
                                                                                                overflow: 'hidden',
                                                                                                color: '#000000'
                                                                                            }}>
                                                                                                {event.title}
                                                                                            </div>
                                                                                            <div className="opacity-75 mt-1 transition-opacity duration-200 " style={{ fontSize: '8px', color: '#000000' }}>
                                                                                                {formatEventTime(event.startDateTime, event.endDateTime)}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
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
                                            <div className={`transition-opacity duration-300 ${navigationLoading ? 'opacity-70' : 'opacity-100'} overflow-auto max-h-[calc(100vh-200px)]`}>
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

                                                            {/* Events positioned absolutely */}
                                                            {getCurrentDayEvents().map((event) => {
                                                                const position = getEventPosition(event);
                                                                const EventIcon = getEventIcon(event.userRole);
                                                                return (
                                                                    <div
                                                                        key={event.id}
                                                                        className="absolute left-2 right-2 rounded-lg p-3 border-l-4 shadow-sm transition-all duration-300 ease-out cursor-pointer group"
                                                                        style={{
                                                                            top: `${position.top}px`,
                                                                            height: `${position.height}px`,
                                                                            minHeight: '60px',
                                                                            backgroundColor: '#ffffff',
                                                                            borderLeftColor: getEventColor(event.userRole, event.isPast),
                                                                            color: '#000000',
                                                                            transform: 'translateY(0) scale(1)',
                                                                            zIndex: '1'
                                                                        }}
                                                                        onClick={() => handleEventClick(event)}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)';
                                                                            e.currentTarget.style.zIndex = '10';
                                                                            e.currentTarget.style.borderLeftWidth = '6px';
                                                                            e.currentTarget.style.marginLeft = '-2px';
                                                                            e.currentTarget.style.marginRight = '-2px';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                                                                            e.currentTarget.style.zIndex = '1';
                                                                            e.currentTarget.style.borderLeftWidth = '4px';
                                                                            e.currentTarget.style.marginLeft = '0';
                                                                            e.currentTarget.style.marginRight = '0';
                                                                        }}
                                                                    >
                                                                        <div className="flex items-start justify-between h-full">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <EventIcon
                                                                                        size={14}
                                                                                        color={getEventColor(event.userRole, event.isPast)}
                                                                                        className="transition-transform duration-300 group-hover:scale-125"
                                                                                    />
                                                                                    <h4 className="font-semibold text-sm leading-tight transition-all duration-300 group-hover:text-blue-800" style={{
                                                                                        display: '-webkit-box',
                                                                                        WebkitLineClamp: 2,
                                                                                        WebkitBoxOrient: 'vertical',
                                                                                        overflow: 'hidden',
                                                                                        color: '#000000'
                                                                                    }}>
                                                                                        {event.title}
                                                                                    </h4>
                                                                                </div>
                                                                                <p className="text-xs opacity-90 mb-1 transition-opacity duration-300 group-hover:opacity-100" style={{ color: '#000000' }}>
                                                                                    {position.startTime} - {position.endTime}
                                                                                </p>
                                                                                {position.height > 90 && (
                                                                                    <>
                                                                                        <p className="text-xs opacity-75 mb-1 transition-opacity duration-300 group-hover:opacity-100" style={{ color: '#000000' }}>
                                                                                            📍 {event.location}
                                                                                        </p>
                                                                                        {position.height > 120 && (
                                                                                            <p className="text-xs opacity-75 transition-opacity duration-300 group-hover:opacity-100" style={{ color: '#000000' }}>
                                                                                                💲 {formatPrice(event.price)}
                                                                                            </p>
                                                                                        )}
                                                                                    </>
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
                <main className="w-full p-4">
                    <div className="max-w-6xl mx-auto">
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
                                                    className={`min-h-[60px] p-1 border border-neutrals-7 rounded transition-all duration-200 ${dayInfo.isCurrentMonth ? 'bg-white' : 'bg-neutrals-8'
                                                        } ${dayInfo.isToday ? 'bg-green-50 ring-1 ring-green-500 border-green-500' : ''}`}
                                                >
                                                    <div className={`text-xs mb-1 text-center ${dayInfo.isCurrentMonth ? 'text-neutrals-1' : 'text-neutrals-5'
                                                        } ${dayInfo.isToday ? 'font-bold text-green-700' : ''}`}>
                                                        {dayInfo.day}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {dayInfo.events.slice(0, 1).map((event) => (
                                                            <div
                                                                key={event.id}
                                                                onClick={() => handleEventClick(event)}
                                                                className="w-2 h-2 rounded-full mx-auto cursor-pointer transition-all duration-200 hover:scale-125 hover:shadow-lg"
                                                                style={{ backgroundColor: getEventColor(event.userRole, event.isPast) }}
                                                                title={event.title}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.transform = 'scale(1.4)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                                                    e.currentTarget.style.zIndex = '10';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = 'scale(1)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                    e.currentTarget.style.zIndex = 'auto';
                                                                }}
                                                            />
                                                        ))}
                                                        {dayInfo.events.length > 1 && (
                                                            <div className="text-xs text-neutrals-4 text-center">
                                                                +{dayInfo.events.length - 1}
                                                            </div>
                                                        )}
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
                                                <div className="p-1 space-y-0.5">
                                                    {dayInfo.events.slice(0, 3).map((event) => {
                                                        const EventIcon = getEventIcon(event.userRole);
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                onClick={() => handleEventClick(event)}
                                                                className="p-1 rounded cursor-pointer transition-all duration-200 hover:shadow-md border-l-2"
                                                                style={{ 
                                                                    backgroundColor: `${getEventColor(event.userRole, event.isPast)}15`,
                                                                    borderLeftColor: getEventColor(event.userRole, event.isPast)
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.transform = 'translateX(2px) scale(1.02)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                                                    e.currentTarget.style.backgroundColor = `${getEventColor(event.userRole, event.isPast)}25`;
                                                                    e.currentTarget.style.zIndex = '10';
                                                                    e.currentTarget.style.borderLeftWidth = '3px';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                    e.currentTarget.style.backgroundColor = `${getEventColor(event.userRole, event.isPast)}15`;
                                                                    e.currentTarget.style.zIndex = 'auto';
                                                                    e.currentTarget.style.borderLeftWidth = '2px';
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-1">
                                                                    <EventIcon 
                                                                        size={8} 
                                                                        className="flex-shrink-0 mt-0.5 transition-transform duration-200" 
                                                                        color={getEventColor(event.userRole, event.isPast)}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1.2)';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.transform = 'scale(1)';
                                                                        }}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs font-medium leading-tight text-neutrals-1" style={{
                                                                            fontSize: '10px',
                                                                            lineHeight: '1.2',
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 2,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            {event.title}
                                                                        </div>
                                                                        <div className="text-xs text-neutrals-4 mt-0.5" style={{ fontSize: '8px' }}>
                                                                            {formatEventTime(event.startDateTime, event.endDateTime)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayInfo.events.length > 3 && (
                                                        <div className="text-xs text-neutrals-4 px-1 text-center" style={{ fontSize: '9px' }}>
                                                            +{dayInfo.events.length - 3} more
                                                        </div>
                                                    )}
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
                                                        
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className="absolute left-1 right-1 rounded-lg p-2 border-l-2 shadow-sm transition-all duration-200 cursor-pointer group"
                                                                style={{
                                                                    top: `${mobileTop}px`,
                                                                    height: `${mobileHeight}px`,
                                                                    minHeight: '36px',
                                                                    backgroundColor: '#ffffff',
                                                                    borderLeftColor: getEventColor(event.userRole, event.isPast),
                                                                    transform: 'translateY(0) scale(1)',
                                                                    zIndex: '1'
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
                                                                        color={getEventColor(event.userRole, event.isPast)}
                                                                        className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-medium text-neutrals-1 leading-tight transition-colors duration-200 group-hover:text-blue-800" style={{
                                                                            fontSize: '11px',
                                                                            lineHeight: '1.2',
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: mobileHeight > 50 ? 2 : 1,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            {event.title}
                                                                        </h4>
                                                                        <p className="text-neutrals-4 mt-0.5 transition-opacity duration-200 group-hover:opacity-100" style={{ fontSize: '9px' }}>
                                                                            {position.startTime} - {position.endTime}
                                                                        </p>
                                                                        {mobileHeight > 60 && event.price && (
                                                                            <p className="text-neutrals-3 mt-1 transition-opacity duration-200 group-hover:opacity-100" style={{ fontSize: '9px' }}>
                                                                                {formatPrice(event.price)}
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
                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => handleEventClick(event)}
                                                className="flex items-start gap-3 p-3 rounded-lg border border-neutrals-6 hover:border-primary-1 cursor-pointer transition-all duration-200"
                                            >
                                                {event.coverPhotoUrl && (
                                                    <img
                                                        src={event.coverPhotoUrl}
                                                        alt={event.title}
                                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <EventIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: getEventColor(event.userRole, event.isPast) }} />
                                                        <h3 className="font-medium text-neutrals-1 text-sm leading-tight flex-1" style={{
                                                            wordBreak: 'break-word',
                                                            overflowWrap: 'break-word'
                                                        }}>{event.title}</h3>
                                                    </div>
                                                    <p className="text-xs text-neutrals-4 mb-1">
                                                        {formatEventDate(event.startDateTime)}
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