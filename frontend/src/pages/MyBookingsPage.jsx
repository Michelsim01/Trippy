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
    const [filteredBookings, setFilteredBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [sortBy, setSortBy] = useState('NEWEST')

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

                // Filter out pending bookings
                const filteredBookings = transformedData.filter(booking => booking.status !== 'PENDING')

                setBookings(filteredBookings)
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

    // Filter and sort bookings whenever bookings, statusFilter, or sortBy changes
    useEffect(() => {
        let filtered = [...bookings]

        // Apply status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(booking => booking.status === statusFilter)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aDate = new Date(a.experienceSchedule.startDateTime)
            const bDate = new Date(b.experienceSchedule.startDateTime)
            
            if (sortBy === 'NEWEST') {
                return bDate - aDate // Newest first
            } else if (sortBy === 'OLDEST') {
                return aDate - bDate // Oldest first
            }
            return 0
        })

        setFilteredBookings(filtered)
    }, [bookings, statusFilter, sortBy])

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

                            {/* Filters and Sort */}
                            {!loading && !error && bookings.length > 0 && (
                                <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Status Filter */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-neutrals-3">Status:</label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="px-3 py-2 border border-neutrals-6 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-1"
                                                >
                                                    <option value="ALL">All Bookings</option>
                                                    <option value="CONFIRMED">Confirmed</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                    <option value="COMPLETED">Completed</option>
                                                </select>
                                            </div>

                                            {/* Sort */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium text-neutrals-3">Sort by:</label>
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="px-3 py-2 border border-neutrals-6 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-1"
                                                >
                                                    <option value="NEWEST">Newest to Oldest</option>
                                                    <option value="OLDEST">Oldest to Newest</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Results count */}
                                        <div className="text-sm text-neutrals-4">
                                            Showing {filteredBookings.length} of {bookings.length} bookings
                                        </div>
                                    </div>
                                </div>
                            )}

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
                            ) : filteredBookings.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 text-neutrals-5">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-neutrals-2 mb-2">No bookings match your filters</h3>
                                    <p className="text-neutrals-4 mb-6">Try adjusting your filters to see more results.</p>
                                    <Button
                                        onClick={() => {
                                            setStatusFilter('ALL')
                                            setSortBy('NEWEST')
                                        }}
                                        variant="outline"
                                        size="md"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredBookings.map((booking) => (
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

                    {/* Mobile Filters and Sort */}
                    {!loading && !error && bookings.length > 0 && (
                        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex flex-col gap-3">
                                    {/* Status Filter */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-neutrals-3 w-16">Status:</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-neutrals-6 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-1"
                                        >
                                            <option value="ALL">All Bookings</option>
                                            <option value="CONFIRMED">Confirmed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>

                                    {/* Sort */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-neutrals-3 w-16">Sort:</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-neutrals-6 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-1"
                                        >
                                            <option value="NEWEST">Newest to Oldest</option>
                                            <option value="OLDEST">Oldest to Newest</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Results count */}
                                <div className="text-xs text-neutrals-4 text-center pt-2 border-t border-neutrals-7">
                                    Showing {filteredBookings.length} of {bookings.length} bookings
                                </div>
                            </div>
                        </div>
                    )}

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
                    ) : filteredBookings.length === 0 ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <div className="w-20 h-20 mx-auto mb-4 text-neutrals-5">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">No bookings match your filters</h3>
                            <p className="text-neutrals-4 mb-4">Try adjusting your filters to see more results.</p>
                            <Button
                                onClick={() => {
                                    setStatusFilter('ALL')
                                    setSortBy('NEWEST')
                                }}
                                variant="outline"
                                size="md"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredBookings.map((booking) => (
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
