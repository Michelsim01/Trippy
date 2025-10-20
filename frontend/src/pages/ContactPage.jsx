import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const ContactPage = () => {
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
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Contact Us</h1>
                            <p className="text-lg text-neutrals-3 mb-8">
                                Have a question or need help? We'd love to hear from you.
                            </p>

                            <div className="max-w-2xl mx-auto space-y-6">
                                {/* Contact details */}
                                <div className="bg-white rounded-lg p-8 shadow-sm">
                                    <h3 className="text-2xl font-semibold text-neutrals-1 mb-6">Get in touch</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 text-primary-1 mt-1">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutrals-1 text-lg">Email</p>
                                                <p className="text-neutrals-4 text-lg">hello@trippy.com</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 text-primary-1 mt-1">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutrals-1 text-lg">Phone</p>
                                                <p className="text-neutrals-4 text-lg">+1 (555) 123-4567</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 text-primary-1 mt-1">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutrals-1 text-lg">Office</p>
                                                <p className="text-neutrals-4 text-lg">123 Travel Street<br />San Francisco, CA 94102</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Office hours */}
                                <div className="bg-white rounded-lg p-8 shadow-sm">
                                    <h3 className="text-2xl font-semibold text-neutrals-1 mb-6">Office Hours</h3>
                                    <div className="space-y-4 text-lg">
                                        <div className="flex justify-between">
                                            <span className="text-neutrals-2">Monday - Friday</span>
                                            <span className="text-neutrals-4">9:00 AM - 6:00 PM</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutrals-2">Saturday</span>
                                            <span className="text-neutrals-4">10:00 AM - 4:00 PM</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutrals-2">Sunday</span>
                                            <span className="text-neutrals-4">Closed</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Support ticket link */}
                                <div className="bg-primary-1 opacity-10 rounded-lg p-8">
                                    <h3 className="text-2xl font-semibold text-neutrals-1 mb-4">Need Support?</h3>
                                    <p className="text-neutrals-4 mb-6 text-lg">
                                        For technical issues or detailed inquiries, please submit a support ticket.
                                    </p>
                                    <button className="text-primary-1 font-medium hover:underline text-lg">
                                        Submit Support Ticket →
                                    </button>
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
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Contact Us</h1>
                        <p className="text-lg text-neutrals-3 mb-8">
                            Have a question or need help? We'd love to hear from you.
                        </p>

                        <div className="space-y-6">
                            {/* Contact details */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Get in touch</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 text-primary-1 mt-1">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutrals-1">Email</p>
                                            <p className="text-neutrals-4">hello@trippy.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 text-primary-1 mt-1">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutrals-1">Phone</p>
                                            <p className="text-neutrals-4">+1 (555) 123-4567</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 text-primary-1 mt-1">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutrals-1">Office</p>
                                            <p className="text-neutrals-4">123 Travel Street<br />San Francisco, CA 94102</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Office hours */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">Office Hours</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-neutrals-2">Monday - Friday</span>
                                        <span className="text-neutrals-4">9:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutrals-2">Saturday</span>
                                        <span className="text-neutrals-4">10:00 AM - 4:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutrals-2">Sunday</span>
                                        <span className="text-neutrals-4">Closed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Support ticket link */}
                            <div className="bg-primary-1 opacity-10 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-neutrals-1 mb-2">Need Support?</h3>
                                <p className="text-neutrals-4 mb-4">
                                    For technical issues or detailed inquiries, please submit a support ticket.
                                </p>
                                <button className="text-primary-1 font-medium hover:underline">
                                    Submit Support Ticket →
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ContactPage;
