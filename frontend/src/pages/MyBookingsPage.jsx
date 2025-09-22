import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import BookingCard from '../components/BookingCard'

const MyBookingsPage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Mock booking data for testing
    const mockBookings = [
        {
            bookingId: 1,
            confirmationCode: 'TRV001',
            status: 'CONFIRMED',
            numberOfParticipants: 2,
            totalAmount: 178,
            bookingDate: '2024-03-15T10:00:00',
            experience: {
                title: 'Amazing City Food Tour',
                country: 'Singapore',
                coverPhotoUrl: '/api/placeholder/400/300'
            },
            experienceSchedule: {
                startDateTime: '2024-03-25T10:00:00',
                endDateTime: '2024-03-25T15:30:00'
            }
        },
        {
            bookingId: 2,
            confirmationCode: 'TRV002',
            status: 'PENDING',
            numberOfParticipants: 4,
            totalAmount: 356,
            bookingDate: '2024-03-10T14:30:00',
            experience: {
                title: 'Cultural Heritage Walking Tour',
                country: 'Singapore',
                coverPhotoUrl: '/api/placeholder/400/300'
            },
            experienceSchedule: {
                startDateTime: '2024-03-28T09:00:00',
                endDateTime: '2024-03-28T12:00:00'
            }
        },
        {
            bookingId: 3,
            confirmationCode: 'TRV003',
            status: 'COMPLETED',
            numberOfParticipants: 1,
            totalAmount: 89,
            bookingDate: '2024-02-20T16:15:00',
            experience: {
                title: 'Gardens by the Bay Night Tour',
                country: 'Singapore',
                coverPhotoUrl: '/api/placeholder/400/300'
            },
            experienceSchedule: {
                startDateTime: '2024-03-05T19:00:00',
                endDateTime: '2024-03-05T21:00:00'
            }
        },
        {
            bookingId: 4,
            confirmationCode: 'TRV004',
            status: 'CANCELLED',
            numberOfParticipants: 3,
            totalAmount: 267,
            bookingDate: '2024-03-01T11:20:00',
            cancellationReason: 'Change of plans',
            cancelledAt: '2024-03-08T09:30:00',
            experience: {
                title: 'Sentosa Island Adventure',
                country: 'Singapore',
                coverPhotoUrl: '/api/placeholder/400/300'
            },
            experienceSchedule: {
                startDateTime: '2024-03-22T08:00:00',
                endDateTime: '2024-03-22T17:00:00'
            }
        },
        {
            bookingId: 5,
            confirmationCode: 'TRV005',
            status: 'CONFIRMED',
            numberOfParticipants: 2,
            totalAmount: 1250,
            bookingDate: '2024-03-12T13:45:00',
            experience: {
                title: '3-Day Southeast Asia Cultural Adventure',
                country: 'Malaysia & Indonesia',
                coverPhotoUrl: '/api/placeholder/400/300'
            },
            experienceSchedule: {
                startDateTime: '2024-04-15T09:00:00',
                endDateTime: '2024-04-17T18:00:00'
            }
        }
    ];

    return (
        <div className="min-h-screen bg-neutrals-8 flex flex-col">
            <Navbar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                variant="desktop"
            />

            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-2">My Bookings</h1>
                        <p className="text-neutrals-3">Manage your travel experiences and bookings</p>
                    </div>

                    {/* Bookings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {mockBookings.map((booking) => (
                            <BookingCard
                                key={booking.bookingId}
                                booking={booking}
                            />
                        ))}
                    </div>

                    {/* Empty State (hidden when we have bookings) */}
                    {mockBookings.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-neutrals-4 mb-4">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0l-.5 5a2 2 0 002 2h5a2 2 0 002-2L16 7m-8 0h8" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">No bookings yet</h3>
                            <p className="text-neutrals-4 mb-6">Start exploring amazing experiences to make your first booking!</p>
                            <button
                                className="btn-primary"
                                onClick={() => navigate('/')}
                            >
                                Explore Experiences
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default MyBookingsPage
