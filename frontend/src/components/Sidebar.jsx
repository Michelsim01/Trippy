import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoutModal from './LogoutModal'
import { useFormData } from '../contexts/FormDataContext'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, onClose, variant = "mobile" }) => {
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const navigate = useNavigate();
    const { clearFormData } = useFormData();
    const { user } = useAuth();
    console.log('Sidebar - User Object:', user);
    const isKycApproved = user?.kycStatus === 'APPROVED';
    const navItems = [
        { id: 'blog', label: 'Blog' },
        { id: 'my-bookings', label: 'My Bookings' },
        ...(user?.canCreateExperiences && isKycApproved 
            ? [{ id: 'my-tours', label: 'My Tours' }]
            : []
        ),
        // Conditionally include create-experience or kyc based on KYC status
        ...(isKycApproved 
            ? [{ id: 'create-experience', label: 'Create an Experience' }]
            : [{ id: 'kyc-onboarding', label: 'Complete KYC to Create' }]
        ),
        { id: 'calendar', label: 'Calendar' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Contact' },
    ]
    
    const handleCreateExperienceClick = () => {
        clearFormData(); // Clear any existing form data
        navigate('/create-experience');
        onClose(); // Close the sidebar
    };

    const handleKycClick = () => {
        navigate('/kyc-onboarding');
        onClose(); // Close the sidebar
    };

    const handleLogout = () => {
        onClose() // Close sidebar first
        setIsLogoutModalOpen(true) // Open logout modal
    }

    return (
        <>
            {/* Mobile Overlay - only show on mobile when sidebar is open */}
            {isOpen && variant === "mobile" && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    ${variant === "desktop"
                        ? "fixed top-0 left-0 h-screen w-[275px] bg-primary-1 flex flex-col z-30 transition-transform duration-300"
                        : `fixed lg:fixed top-0 left-0 h-full w-[275px] bg-primary-1 flex flex-col
                           transform transition-transform duration-300 z-50
                           ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
                    }
                    ${variant === "desktop" && !isOpen ? '-translate-x-full' : ''}
                `}
            >

                {/* Header with Logo and Close Button */}
                <div className="flex items-center justify-between px-4 py-6">
                    <div className="flex items-center gap-2">
                        <div className="w-40 h-15 flex items-center justify-center">
                            <img src="/Logo.png" alt="Logo" className="w-50 h-50 object-contain" />
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:opacity-10 transition-colors"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                </div>

                {/* Navigation - Flex container for spacing */}
                <div className="flex flex-col justify-between flex-1 px-6 pb-6">
                    {/* Main Navigation */}
                    <nav className="pt-4">
                        <ul className="space-y-[22px]">
                            {navItems.map((item) => (
                                <li key={item.id}>
                                    {item.id === 'create-experience' ? (
                                        <button
                                            onClick={handleCreateExperienceClick}
                                            className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors w-full text-left"
                                        >
                                            {item.label}
                                        </button>
                                    ) : item.id === 'kyc-onboarding' ? (
                                        <button
                                            onClick={handleKycClick}
                                            className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors w-full text-left flex items-center gap-2"
                                        >
                                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                            {item.label}
                                        </button>
                                    ) : (
                                        <Link
                                            to={`/${item.id}`}
                                            className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors"
                                            onClick={onClose}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Bottom Section */}
                    <div className="flex flex-col gap-[13px]">
                        {/* Settings and Log Out */}
                        <div className="space-y-[13px]">
                            <Link
                                to="/settings"
                                className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors"
                                onClick={onClose}
                            >
                                Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors"
                            >
                                Log Out
                            </button>
                        </div>

                        {/* Language Button */}
                        <button className="bg-primary-1 border border-white border-opacity-20 flex items-center justify-center gap-3 px-4 py-3 rounded-[90px] w-full hover:bg-white hover:opacity-10 transition-colors">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="m8 12c0 3.31 1.79 6 4 6s4-2.69 4-6-1.79-6-4-6-4 2.69-4 6z" />
                            </svg>
                            <span className="font-dm-sans font-bold text-white text-[14px] leading-[16px]">English</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Logout Modal */}
            <LogoutModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
            />
        </>
    )
}

export default Sidebar