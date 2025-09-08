import React from 'react'
import { Link } from 'react-router-dom'

const Sidebar = ({ isOpen, onClose, variant = "mobile" }) => {
    const navItems = [
        { id: 'blog', label: 'Blog' },
        { id: 'create-experience', label: 'Create an Experience' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Contact' },
    ]

    const bottomItems = [
        { id: 'settings', label: 'Settings' },
        { id: 'logout', label: 'Log Out' },
    ]

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
                <div className="flex items-center justify-between px-6 py-[52px]">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                            <svg width="21" height="23" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4AC63F" />
                                <circle cx="12" cy="9" r="2.5" fill="white" />
                            </svg>
                        </div>
                        <span className="font-poppins font-semibold text-white text-[27px] leading-[27px]">Trippy</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:opacity-10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    <Link
                                        to={`/${item.id}`}
                                        className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors"
                                        onClick={onClose}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Bottom Section */}
                    <div className="flex flex-col gap-[13px]">
                        {/* Settings and Log Out */}
                        <div className="space-y-[13px]">
                            {bottomItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/${item.id}`}
                                    className="block font-dm-sans font-bold text-white text-[14px] leading-[16px] hover:text-opacity-80 transition-colors"
                                    onClick={onClose}
                                >
                                    {item.label}
                                </Link>
                            ))}
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
        </>
    )
}

export default Sidebar