import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

const MyBookingsPage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

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
                    <h1 className="text-3xl font-bold text-neutrals-1 mb-6">My Bookings</h1>
                    <p className="text-neutrals-3">This is where your bookings will be displayed.</p>
                    {/* Future implementation: List of bookings */}
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default MyBookingsPage
