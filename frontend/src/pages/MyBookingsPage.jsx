import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import BookingCard from '../components/BookingCard'
import Button from '../components/Button'

const MyBookingsPage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true)
                console.log('MyBookingsPage - Fetching bookings for user:', user?.email)

                const response = await fetch(`http://localhost:8080/api/bookings/user/${user?.email}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                console.log('MyBookingsPage - Fetched bookings data:', data)
                console.log('MyBookingsPage - Bookings count:', data.length)

                // Transform the API data to match our component structure
                const transformedData = data.map(booking => ({
                    bookingId: booking.bookingId,
                    confirmationCode: booking.confirmationCode,
                    status: booking.status,
                    numberOfParticipants: booking.numberOfParticipants,
                    totalAmount: booking.totalAmount,
                    bookingDate: booking.bookingDate,
                    cancellationReason: booking.cancellationReason,
                    cancelledAt: booking.cancelledAt,
                    experience: {
                        title: booking.experienceTitle,
                        coverPhotoUrl: booking.experienceCoverPhotoUrl,
                        country: booking.experienceCountry
                    },
                    experienceSchedule: {
                        startDateTime: booking.startDateTime,
                        endDateTime: booking.endDateTime
                    }
                }))

                setBookings(transformedData)
                setError(null)
            } catch (err) {
                console.error("Failed to fetch bookings:", err)
                setError(err.message)
                setBookings([]) // Clear bookings on error
            } finally {
                setLoading(false)
            }
        }

        if (user?.id || user?.userId) {
            fetchBookings()
        }
    }, [user?.id, user?.userId])

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setSidebarOpen(false)
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
                        <div className="max-w-6xl mx-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-neutrals-1 mb-2">My Bookings</h1>
                                <p className="text-neutrals-4">Manage your travel experiences and bookings</p>
                            </div>

                            {loading ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-neutrals-3 text-lg">Loading your bookings...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-red-500 text-lg mb-2">Error loading bookings: {error}</p>
                                    <Button
                                        onClick={() => window.location.reload()}
                                        variant="outline"
                                        size="md"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 text-neutrals-5">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0l-.5 5a2 2 0 002 2h5a2 2 0 002-2L16 7m-8 0h8" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-neutrals-2 mb-2">No bookings yet</h3>
                                    <p className="text-neutrals-4 mb-6">Start exploring amazing experiences to make your first booking!</p>
                                    <Button
                                        onClick={() => navigate('/home')}
                                        variant="primary"
                                        size="md"
                                    >
                                        Explore Experiences
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {bookings.map((booking) => (
                                        <BookingCard
                                            key={booking.bookingId}
                                            booking={booking}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                    <div className="h-px bg-neutrals-6 w-full" />
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
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-neutrals-1 mb-2">My Bookings</h1>
                        <p className="text-neutrals-4">Manage your travel experiences and bookings</p>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-neutrals-3">Loading your bookings...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-red-500 mb-2">Error loading bookings: {error}</p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                size="md"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <div className="w-20 h-20 mx-auto mb-4 text-neutrals-5">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0l-.5 5a2 2 0 002 2h5a2 2 0 002-2L16 7m-8 0h8" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">No bookings yet</h3>
                            <p className="text-neutrals-4 mb-6">Start exploring amazing experiences to make your first booking!</p>
                            <Button
                                onClick={() => navigate('/home')}
                                variant="primary"
                                size="md"
                            >
                                Explore Experiences
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {bookings.map((booking) => (
                                <BookingCard
                                    key={booking.bookingId}
                                    booking={booking}
                                />
                            ))}
                        </div>
                    )}
                </main>
                <div className="h-px bg-neutrals-6 w-full" />
                <Footer />
            </div>
        </div>
    )
}

export default MyBookingsPage
