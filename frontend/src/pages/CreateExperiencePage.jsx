import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const CreateExperiencePage = () => {
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
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Create an Experience</h1>
                            <p className="text-lg text-neutrals-3 mb-8">
                                Share your unique travel experience with other travelers.
                            </p>

                            {/* Experience creation form placeholder */}
                            <div className="bg-white rounded-lg p-8 shadow-sm">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                            Experience Title
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                            placeholder="Enter your experience title"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                            placeholder="Where did this experience take place?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            rows="6"
                                            className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                            placeholder="Describe your experience in detail..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                            Photos
                                        </label>
                                        <div className="border-2 border-dashed border-neutrals-6 rounded-lg p-8 text-center">
                                            <div className="text-neutrals-4">
                                                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Click to upload or drag and drop
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button className="bg-primary-1 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-colors">
                                            Publish Experience
                                        </button>
                                        <button className="border border-neutrals-6 text-neutrals-2 px-6 py-3 rounded-lg font-medium hover:bg-neutrals-7 transition-colors">
                                            Save Draft
                                        </button>
                                    </div>
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
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Create an Experience</h1>
                        <p className="text-base text-neutrals-3 mb-8">
                            Share your unique travel experience with other travelers.
                        </p>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                        Experience Title
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                        placeholder="Enter your experience title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                        placeholder="Where did this experience take place?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1"
                                        placeholder="Describe your experience..."
                                    ></textarea>
                                </div>

                                <button className="w-full bg-primary-1 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-colors">
                                    Publish Experience
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateExperiencePage;
