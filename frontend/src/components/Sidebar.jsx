import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import LogoutModal from './LogoutModal'
import { useFormData } from '../contexts/FormDataContext'

const Sidebar = ({ isOpen, onClose, variant = "mobile" }) => {
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const navigate = useNavigate();
    const { clearFormData } = useFormData();
    
    const navItems = [
        { id: 'blog', label: 'Blog' },
        { id: 'create-experience', label: 'Create an Experience' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Contact' },
    ]
    
    const handleCreateExperienceClick = () => {
        clearFormData(); // Clear any existing form data
        navigate('/create-experience');
        onClose(); // Close the sidebar
    };

    const handleLogout = () => {
        onClose() // Close sidebar first
        setIsLogoutModalOpen(true) // Open logout modal
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && variant === 'mobile' && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                    aria-label="Close sidebar"
                    tabIndex={0}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                        fixed top-0 left-0 h-screen w-[275px] bg-primary-1 flex flex-col z-50
                        ${variant === 'mobile'
                        ? `transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
                        : 'transition-transform duration-300 ease-in-out'
                    }
                        ${variant === 'desktop' && !isOpen ? '-translate-x-full' : ''}
                    `}
                aria-label="Sidebar Navigation"
            >
                {/* Header with Logo and Close Button */}
                <div className="flex items-center justify-between px-6 pt-12 pb-8">
                    <div className="flex items-center gap-3">
                        {/* Logo Icon */}
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <svg width="18" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                                    fill="var(--color-primary-1)"
                                />
                                <circle cx="12" cy="9" r="2.5" fill="white" />
                            </svg>
                        </div>
                        {/* Logo Text */}
                        <h1
                            className="text-white font-semibold text-2xl leading-none tracking-tight"
                            style={{ fontFamily: 'var(--font-family-poppins)' }}
                        >
                            Trippy
                        </h1>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-20"
                        aria-label="Close Sidebar"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Content */}
                <div className="flex flex-col flex-1 px-6">
                    {/* Main Navigation */}
                    <nav className="flex-1">
                        <ul className="space-y-6">
                            {navItems.slice(0, 5).map(item => (
                                <li key={item.id}>
                                    {item.id === 'create-experience' ? (
                                        <button
                                            onClick={handleCreateExperienceClick}
                                            className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors w-full text-left"
                                        >
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
                    </div>
                </div>
            </aside>
            
            {/* Logout Modal */}
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onLogout={handleLogout}
            />
        </>
    );
};

export default Sidebar;