import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const CalendarPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

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
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Calendar</h1>
                            <p className="text-lg text-neutrals-3 mb-8">
                                Keep track of your travel plans and upcoming experiences.
                            </p>

                            {/* Calendar placeholder */}
                            <div className="bg-white rounded-lg shadow-sm">
                                {/* Calendar header */}
                                <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                                    <div className="flex items-center gap-4">
                                        <button className="p-2 hover:bg-neutrals-7 rounded-lg">
                                            <svg className="w-5 h-5 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h2 className="text-2xl font-semibold text-neutrals-1">January 2024</h2>
                                        <button className="p-2 hover:bg-neutrals-7 rounded-lg">
                                            <svg className="w-5 h-5 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button className="bg-primary-1 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-colors">
                                        Add Event
                                    </button>
                                </div>

                                {/* Calendar grid */}
                                <div className="p-6">
                                    {/* Days of week */}
                                    <div className="grid grid-cols-7 gap-1 mb-4">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                            <div key={day} className="p-3 text-center text-sm font-medium text-neutrals-4">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar days */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: 35 }, (_, i) => {
                                            const day = i - 6; // Start from previous month
                                            const isCurrentMonth = day > 0 && day <= 31;
                                            const hasEvent = [5, 12, 18, 25].includes(day);

                                            return (
                                                <div key={i} className={`aspect-square p-2 ${isCurrentMonth ? 'hover:bg-neutrals-7 cursor-pointer' : ''} rounded-lg`}>
                                                    <div className={`text-sm ${isCurrentMonth ? 'text-neutrals-1' : 'text-neutrals-5'} mb-1`}>
                                                        {isCurrentMonth ? day : ''}
                                                    </div>
                                                    {hasEvent && isCurrentMonth && (
                                                        <div className="w-2 h-2 bg-primary-1 rounded-full"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming events */}
                            <div className="mt-8">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Upcoming Events</h3>
                                <div className="space-y-3">
                                    {[
                                        { date: 'Jan 5', title: 'Flight to Tokyo', time: '2:30 PM' },
                                        { date: 'Jan 12', title: 'Mountain Hiking Experience', time: '9:00 AM' },
                                        { date: 'Jan 18', title: 'Local Food Tour', time: '6:00 PM' },
                                        { date: 'Jan 25', title: 'Return Flight', time: '11:45 AM' }
                                    ].map((event, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary-1 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                                {event.date.split(' ')[1]}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-neutrals-1">{event.title}</h4>
                                                <p className="text-sm text-neutrals-4">{event.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
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
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Calendar</h1>

                        {/* Mobile calendar view - simplified */}
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-neutrals-1">January 2024</h2>
                                <button className="bg-primary-1 text-white px-3 py-1 rounded text-sm">
                                    Add
                                </button>
                            </div>
                            <div className="text-center text-neutrals-4 py-8">
                                Tap to view full calendar
                            </div>
                        </div>

                        {/* Upcoming events */}
                        <div>
                            <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Upcoming Events</h3>
                            <div className="space-y-3">
                                {[
                                    { date: 'Jan 5', title: 'Flight to Tokyo', time: '2:30 PM' },
                                    { date: 'Jan 12', title: 'Mountain Hiking Experience', time: '9:00 AM' }
                                ].map((event, index) => (
                                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-1 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                                                {event.date.split(' ')[1]}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-neutrals-1 text-sm">{event.title}</h4>
                                                <p className="text-xs text-neutrals-4">{event.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CalendarPage;
