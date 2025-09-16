import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar = ({
    isOpen,
    onClose,
    variant = 'desktop',
    isAuthenticated,
}) => {
    // Mock authentication for testing (remove when real auth is implemented)
    isAuthenticated = true;

    const navItems = isAuthenticated
        ? [
            { id: 'blog', label: 'Blog' },
            { id: 'create-experience', label: 'Create an Experience' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'about', label: 'About' },
            { id: 'contact', label: 'Contact' },
            { id: 'settings', label: 'Settings' },
            { id: 'logout', label: 'Log Out' },
        ]
        : [
            { id: 'blog', label: 'Blog' },
            { id: 'about', label: 'About' },
            { id: 'contact', label: 'Contact' },
        ];

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
                                    <Link
                                        to={`/${item.id}`}
                                        className="block text-white font-medium text-base leading-tight px-4 py-5 rounded-lg transition-all duration-200 hover:text-[color:#4AC63F] hover:bg-white"
                                        style={{
                                            fontFamily: 'var(--font-family-dm-sans)',
                                            letterSpacing: '0.02em'
                                        }}
                                        onClick={onClose}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Bottom Section with Settings, Logout, and Language */}
                    <div className="pb-8">
                        {/* Settings and Logout */}
                        <nav className="mb-8">
                            <ul className="space-y-6">
                                {navItems.slice(5).map(item => (
                                    <li key={item.id}>
                                        <Link
                                            to={`/${item.id}`}
                                            className="block text-white font-medium text-base leading-tight px-4 py-5 rounded-lg transition-all duration-200 hover:text-[color:#4AC63F] hover:bg-white hover:px-4"
                                            style={{
                                                fontFamily: 'var(--font-family-dm-sans)',
                                                letterSpacing: '0.02em'
                                            }}
                                            onClick={onClose}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {/* Language Selector */}
                        <div className="flex justify-center">
                            <button
                                className="bg-primary-1 border border-white border-opacity-30 flex items-center justify-center gap-2 px-5 py-3 rounded-full w-full max-w-[160px] hover:bg-white hover:bg-opacity-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30"
                                aria-label="Change Language"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" />
                                    <path d="m8 12c0 3.31 1.79 6 4 6s4-2.69 4-6-1.79-6-4-6-4 2.69-4 6z" strokeWidth="2" />
                                </svg>
                                <span
                                    className="text-white font-medium text-sm leading-tight"
                                    style={{
                                        fontFamily: 'var(--font-family-dm-sans)',
                                        letterSpacing: '0.03em'
                                    }}
                                >
                                    English
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;