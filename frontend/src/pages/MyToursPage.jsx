import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import ExperienceCard from '../components/ExperienceCard'

const MyToursPage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [tours, setTours] = useState([])
    const [schedules, setSchedules] = useState({}) // Store schedules by experience ID
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
                    rating: experience.averageRating || 0,
                    imageUrl: experience.coverPhotoUrl,
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

    // Calculate stats for the quick stats section
    const totalBookings = tours.reduce((sum, tour) => {
        const tourSchedules = schedules[tour.experienceId] || []
        return sum + tourSchedules.reduce((scheduleSum, schedule) => scheduleSum + (schedule.bookedSpots || 0), 0)
    }, 0)

    const averageRating = tours.filter(t => t.rating > 0).length > 0 
        ? (tours.reduce((sum, tour) => sum + tour.rating, 0) / tours.filter(t => t.rating > 0).length).toFixed(1)
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
                                    {/* Quick Stats */}
                                    <div className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6">
                                            <div className="text-2xl font-bold text-primary-1 mb-1">
                                                {tours.length}
                                            </div>
                                            <div className="text-neutrals-4 text-sm">Total Tours</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6">
                                            <div className="text-2xl font-bold text-green-600 mb-1">
                                                {tours.filter(t => t.status === 'ACTIVE').length}
                                            </div>
                                            <div className="text-neutrals-4 text-sm">Active Tours</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6">
                                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                                {totalBookings}
                                            </div>
                                            <div className="text-neutrals-4 text-sm">Total Bookings</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg border border-neutrals-6">
                                            <div className="text-2xl font-bold text-yellow-600 mb-1">
                                                {averageRating}
                                            </div>
                                            <div className="text-neutrals-4 text-sm">Average Rating</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {tours.map((tour) => (
                                            <ExperienceCard
                                                key={tour.id}
                                                experience={tour}
                                                showWishlistButton={false}
                                                showEditButton={true}
                                                showDeleteButton={true}
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
                            {/* Quick Stats - Mobile */}
                            <div className="mb-8 grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6">
                                    <div className="text-xl font-bold text-primary-1 mb-1">
                                        {tours.length}
                                    </div>
                                    <div className="text-neutrals-4 text-xs">Total Tours</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6">
                                    <div className="text-xl font-bold text-green-600 mb-1">
                                        {tours.filter(t => t.status === 'ACTIVE').length}
                                    </div>
                                    <div className="text-neutrals-4 text-xs">Active Tours</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6">
                                    <div className="text-xl font-bold text-blue-600 mb-1">
                                        {totalBookings}
                                    </div>
                                    <div className="text-neutrals-4 text-xs">Total Bookings</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-neutrals-6">
                                    <div className="text-xl font-bold text-yellow-600 mb-1">
                                        {averageRating}
                                    </div>
                                    <div className="text-neutrals-4 text-xs">Average Rating</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tours.map((tour) => (
                                    <ExperienceCard
                                        key={tour.id}
                                        experience={tour}
                                        showWishlistButton={false}
                                        showEditButton={true}
                                        showDeleteButton={true}
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
        </div>
    )
}

export default MyToursPage
