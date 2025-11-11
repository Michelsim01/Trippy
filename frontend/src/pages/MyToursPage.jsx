import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import ExperienceCard from '../components/ExperienceCard'
import ExperienceEarningsModal from '../components/ExperienceEarningsModal'
import ExperienceViewsModal from '../components/ExperienceViewsModal'

const MyToursPage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [tours, setTours] = useState([])
    const [schedules, setSchedules] = useState({}) // Store schedules by experience ID
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEarningsModalOpen, setIsEarningsModalOpen] = useState(false)
    const [selectedExperienceId, setSelectedExperienceId] = useState(null)
    const [selectedExperienceTitle, setSelectedExperienceTitle] = useState('')
    const [earnings, setEarnings] = useState(null)
    const [earningsLoading, setEarningsLoading] = useState(true)
    const [isViewsModalOpen, setIsViewsModalOpen] = useState(false)
    const [selectedViewsExperienceId, setSelectedViewsExperienceId] = useState(null)
    const [selectedViewsExperienceTitle, setSelectedViewsExperienceTitle] = useState('')

    useEffect(() => {
        const fetchTours = async () => {
            try {
                setLoading(true)
                console.log('MyToursPage - Fetching tours for user:', user?.id || user?.userId)

                const response = await fetch(`http://localhost:8080/api/experiences/guide/${user?.id || user?.userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                console.log('MyToursPage - Fetched tours data:', data)
                console.log('MyToursPage - Tours count:', data.length)

                // Transform the API data to match our component structure
                const transformedData = data.map(experience => ({
                    id: experience.experienceId,
                    experienceId: experience.experienceId,
                    title: experience.title,
                    location: experience.location,
                    price: experience.price,
                    originalPrice: experience.originalPrice,
                    discountPercentage: experience.discountPercentage,
                    lastPriceUpdate: experience.lastPriceUpdate,
                    averageRating: experience.averageRating || 0,
                    imageUrl: experience.coverPhotoUrl,
                    coverPhotoUrl: experience.coverPhotoUrl,
                    status: experience.status,
                    shortDescription: experience.shortDescription,
                    duration: experience.duration,
                    category: experience.category,
                    participantsAllowed: experience.participantsAllowed,
                    totalReviews: experience.totalReviews,
                    createdAt: experience.createdAt
                }))

                setTours(transformedData)

                // Fetch schedule data for all user's experiences
                const schedulePromises = data.map(experience =>
                    fetch(`http://localhost:8080/api/experiences/${experience.experienceId}/schedules`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => response.ok ? response.json() : [])
                        .catch(() => []) // If schedule fetch fails, use empty array
                )

                const schedulesData = await Promise.all(schedulePromises)

                // Create schedules object with experience ID as key
                const schedulesMap = {}
                data.forEach((experience, index) => {
                    schedulesMap[experience.experienceId] = schedulesData[index]
                })

                setSchedules(schedulesMap)
                setError(null)
            } catch (err) {
                console.error("Failed to fetch tours:", err)
                setError(err.message)
                setTours([]) // Clear tours on error
            } finally {
                setLoading(false)
            }
        }

        if (user?.id || user?.userId) {
            fetchTours()
        }
    }, [user?.id, user?.userId])

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                setEarningsLoading(true)
                const response = await fetch(`http://localhost:8080/api/earnings/guide/${user?.id || user?.userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                setEarnings(data)
            } catch (error) {
                console.error('Error fetching earnings:', error)
                setEarnings(null)
            } finally {
                setEarningsLoading(false)
            }
        }

        if (user?.id || user?.userId) {
            fetchEarnings()
        }
    }, [user?.id, user?.userId])

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setSidebarOpen(false)
    }

    const handleCreateTour = () => {
        navigate('/create-experience')
    }

    const handleEditTour = (tourId) => {
        navigate(`/edit-experience/${tourId}`)
    }

    const handleViewTour = (tourId) => {
        navigate(`/experience/${tourId}`)
    }

    const handleTourDeleted = (deletedTourId) => {
        // Remove the deleted tour from the tours list
        setTours(prevTours => prevTours.filter(tour => tour.experienceId !== deletedTourId))

        // Also remove from schedules state (JPA will handle DB cleanup)
        setSchedules(prevSchedules => {
            const newSchedules = { ...prevSchedules }
            delete newSchedules[deletedTourId]
            return newSchedules
        })
    }

    const handleEarningsClick = (experienceId) => {
        const experience = tours.find(tour => tour.experienceId === experienceId)
        setSelectedExperienceId(experienceId)
        setSelectedExperienceTitle(experience?.title || 'Unknown Experience')
        setIsEarningsModalOpen(true)
    }

    const handleCloseEarningsModal = () => {
        setIsEarningsModalOpen(false)
        setSelectedExperienceId(null)
        setSelectedExperienceTitle('')
    }

    const handleViewsClick = (experienceId) => {
        const experience = tours.find(tour => tour.experienceId === experienceId)
        setSelectedViewsExperienceId(experienceId)
        setSelectedViewsExperienceTitle(experience?.title || 'Unknown Experience')
        setIsViewsModalOpen(true)
    }

    const handleCloseViewsModal = () => {
        setIsViewsModalOpen(false)
        setSelectedViewsExperienceId(null)
        setSelectedViewsExperienceTitle('')
    }

    // Calculate stats for the quick stats section
    const totalBookings = tours.reduce((sum, tour) => {
        const tourSchedules = schedules[tour.experienceId] || []
        return sum + tourSchedules.reduce((scheduleSum, schedule) => scheduleSum + (schedule.bookedSpots || 0), 0)
    }, 0)

    const averageRating = tours.filter(t => t.averageRating > 0).length > 0
        ? (tours.reduce((sum, tour) => sum + tour.averageRating, 0) / tours.filter(t => t.averageRating > 0).length).toFixed(1)
        : '0.0'

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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-neutrals-1 mb-2">My Tours</h1>
                                    <p className="text-neutrals-4">Manage your experiences and bookings</p>
                                </div>
                                <button
                                    onClick={handleCreateTour}
                                    className="btn btn-primary btn-md mt-4 sm:mt-0"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Tour
                                </button>
                            </div>

                            {/* Earnings Summary */}
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-neutrals-1 mb-4">Your Earnings</h2>
                                {earningsLoading ? (
                                    <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                        <p className="text-neutrals-3">Loading earnings...</p>
                                    </div>
                                ) : earnings ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Total Earnings Card */}
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-neutrals-1">Total Earnings</h3>
                                                        <p className="text-sm text-neutrals-4">All time earnings</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                                ${earnings.totalEarnings.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-neutrals-4">
                                                {earnings.totalBookings} total bookings
                                            </div>
                                        </div>

                                        {/* Pending Payout Card */}
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-neutrals-1">Pending</h3>
                                                        <p className="text-sm text-neutrals-4">Available after completing tours</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-yellow-600 mb-2">
                                                ${earnings.pendingEarnings.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-neutrals-4">
                                                {earnings.pendingBookings} confirmed bookings
                                            </div>
                                        </div>

                                        {/* Paid Out Card */}
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-neutrals-1">Paid Out</h3>
                                                        <p className="text-sm text-neutrals-4">Released to guide for payout</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-green-600 mb-2">
                                                ${earnings.paidOutEarnings.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-neutrals-4">
                                                {earnings.completedBookings} completed bookings
                                            </div>
                                        </div>

                                        {/* Pending Deductions Card */}
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-neutrals-1">Deductions</h3>
                                                        <p className="text-sm text-neutrals-4">Cancellation fees to be deducted</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-red-600 mb-2">
                                                ${(earnings.pendingDeductions || 0).toFixed(2)}
                                            </div>
                                            <div className="text-sm text-neutrals-4">
                                                {earnings.cancelledBookings || 0} cancelled tours
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                        <p className="text-red-500">Failed to load earnings data</p>
                                    </div>
                                )}
                            </div>

                            {/* Net Available Summary - Desktop */}
                            {earnings && earnings.pendingEarnings && earnings.pendingEarnings > 0 && (
                                <div className="mb-6">
                                    {(() => {
                                        const netAvailable = earnings.pendingEarnings - earnings.pendingDeductions;
                                        const isPositive = netAvailable >= 0;

                                        return (
                                            <div className={`${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} p-6 rounded-lg border text-center`}>
                                                <div className="text-lg font-semibold text-neutrals-4 mb-2">Net Available</div>
                                                <div className={`text-3xl font-bold mb-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPositive ? '$' : '-$'}{Math.abs(netAvailable).toFixed(2)}
                                                </div>
                                                <div className={`text-sm ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                                                    {isPositive
                                                        ? 'Available for payout'
                                                        : 'Will be deducted from future earnings'
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {loading ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-neutrals-3 text-lg">Loading your tours...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <p className="text-red-500 text-lg mb-2">Error loading tours: {error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn btn-outline-primary btn-md"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : tours.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 text-neutrals-5">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-neutrals-2 mb-2">No tours created yet</h3>
                                    <p className="text-neutrals-4 mb-6">Start sharing your expertise by creating your first tour experience!</p>
                                    <button
                                        onClick={handleCreateTour}
                                        className="btn btn-primary btn-md"
                                    >
                                        Create Your First Tour
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {tours.map((tour) => (
                                            <ExperienceCard
                                                key={tour.id}
                                                experience={tour}
                                                showWishlistButton={false}
                                                showEditButton={true}
                                                showDeleteButton={true}
                                                showEarningsButton={true}
                                                showViewCountButton={true}
                                                onEarningsClick={handleEarningsClick}
                                                onViewsClick={handleViewsClick}
                                                onExperienceDeleted={handleTourDeleted}
                                                schedules={schedules[tour.experienceId] || []}
                                                showExplore={false}
                                            />
                                        ))}
                                    </div>
                                </>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-neutrals-1 mb-2">My Tours</h1>
                            <p className="text-neutrals-4">Manage your experiences and bookings</p>
                        </div>
                        <button
                            onClick={handleCreateTour}
                            className="btn btn-primary btn-md mt-4 sm:mt-0"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Tour
                        </button>
                    </div>

                    {/* Earnings Summary - Mobile */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-neutrals-1 mb-4">Your Earnings</h2>
                        {earningsLoading ? (
                            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                                <p className="text-neutrals-3">Loading earnings...</p>
                            </div>
                        ) : earnings ? (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Total Earnings Card */}
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6 shadow-sm">
                                    <div className="flex items-center mb-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-semibold text-neutrals-1">Total Earnings</h3>
                                            <p className="text-xs text-neutrals-4">All time earnings</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        ${earnings.totalEarnings.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-neutrals-4">
                                        {earnings.totalBookings} total bookings
                                    </div>
                                </div>

                                {/* Pending Payout Card */}
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6 shadow-sm">
                                    <div className="flex items-center mb-3">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-semibold text-neutrals-1">Pending</h3>
                                            <p className="text-xs text-neutrals-4">Available after completing tours</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                                        ${earnings.pendingEarnings.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-neutrals-4">
                                        {earnings.pendingBookings} confirmed bookings
                                    </div>
                                </div>

                                {/* Paid Out Card */}
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6 shadow-sm">
                                    <div className="flex items-center mb-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-semibold text-neutrals-1">Paid Out</h3>
                                            <p className="text-xs text-neutrals-4">Released to guide for payout</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        ${earnings.paidOutEarnings.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-neutrals-4">
                                        {earnings.completedBookings} completed tours
                                    </div>
                                </div>

                                {/* Pending Deductions Card */}
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6 shadow-sm">
                                    <div className="flex items-center mb-3">
                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-semibold text-neutrals-1">Deductions</h3>
                                            <p className="text-xs text-neutrals-4">Cancellation fees to be deducted</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-red-600 mb-1">
                                        ${(earnings.pendingDeductions || 0).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-neutrals-4">
                                        {earnings.cancelledBookings || 0} cancelled tours
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                                <p className="text-red-500">Failed to load earnings data</p>
                            </div>
                        )}
                    </div>

                    {/* Net Available Summary - Mobile */}
                    {earnings && earnings.pendingEarnings && earnings.pendingEarnings > 0 && (
                        <div className="mb-4">
                            {(() => {
                                const netAvailable = earnings.pendingEarnings - earnings.pendingDeductions;
                                const isPositive = netAvailable >= 0;

                                return (
                                    <div className={`${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} p-4 rounded-lg border text-center`}>
                                        <div className="text-md font-semibold text-neutrals-4 mb-2">Net Available</div>
                                        <div className={`text-2xl font-bold mb-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? '$' : '-$'}{Math.abs(netAvailable).toFixed(2)}
                                        </div>
                                        <div className={`text-xs ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                                            {isPositive
                                                ? 'Available for payout'
                                                : 'Will be deducted from future earnings'
                                            }
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {loading ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-neutrals-3">Loading your tours...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <p className="text-red-500 mb-2">Error loading tours: {error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-outline-primary btn-md"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : tours.length === 0 ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
                            <div className="w-20 h-20 mx-auto mb-4 text-neutrals-5">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">No tours created yet</h3>
                            <p className="text-neutrals-4 mb-6">Start sharing your expertise by creating your first tour experience!</p>
                            <button
                                onClick={handleCreateTour}
                                className="btn btn-primary btn-md"
                            >
                                Create Your First Tour
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tours.map((tour) => (
                                    <ExperienceCard
                                        key={tour.id}
                                        experience={tour}
                                        showWishlistButton={false}
                                        showEditButton={true}
                                        showDeleteButton={true}
                                        showEarningsButton={true}
                                        showViewCountButton={true}
                                        onEarningsClick={handleEarningsClick}
                                        onViewsClick={handleViewsClick}
                                        onExperienceDeleted={handleTourDeleted}
                                        schedules={schedules[tour.experienceId] || []}
                                        showExplore={false}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </main>
                <div className="h-px bg-neutrals-6 w-full" />
                <Footer />
            </div>

            {/* Earnings Modal */}
            <ExperienceEarningsModal
                isOpen={isEarningsModalOpen}
                onClose={handleCloseEarningsModal}
                experienceTitle={selectedExperienceTitle}
                experienceId={selectedExperienceId}
                userId={user?.id || user?.userId}
            />

            {/* Views Modal */}
            <ExperienceViewsModal
                isOpen={isViewsModalOpen}
                onClose={handleCloseViewsModal}
                experienceTitle={selectedViewsExperienceTitle}
                experienceId={selectedViewsExperienceId}
                guideId={user?.id || user?.userId}
            />
        </div>
    )
}

export default MyToursPage
