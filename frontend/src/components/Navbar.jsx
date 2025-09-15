import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchSuggestions from './SearchSuggestions'
import SearchModal from './SearchModal'
import useSearchSuggestions from '../hooks/useSearchSuggestions'

// Placeholder images - in a real app these would come from your asset pipeline
const userAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"

const Navbar = ({
    isAuthenticated = false,
    isSidebarOpen = false,
    onToggleSidebar = () => { },
    onSignIn = () => { },
    onSignUp = () => { }
}) => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [showMobileSearchModal, setShowMobileSearchModal] = useState(false)
    const { suggestions, loading, isOpen: suggestionsOpen, searchWithDebounce, clearSuggestions, setIsOpen } = useSearchSuggestions()

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        
        if (value.length >= 2) {
            setIsOpen(true) // Open dropdown immediately for visual feedback
        }
        
        searchWithDebounce(value)
    }

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
            clearSuggestions()
        } else if (e.key === 'Escape') {
            clearSuggestions()
        }
    }

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.type === 'experience' && suggestion.experienceId) {
            // Navigate to specific experience page if it exists
            navigate(`/experience/${suggestion.experienceId}`)
        } else {
            // Navigate to search results with the suggestion text
            navigate(`/search?q=${encodeURIComponent(suggestion.text)}`)
        }
        setSearchQuery('')
        clearSuggestions()
    }

    const handleSearchFocus = () => {
        if (searchQuery.length >= 2) {
            setIsOpen(true)
            // Re-trigger search to refresh suggestions
            searchWithDebounce(searchQuery)
        }
    }

    const handleMobileSearchClick = () => {
        setShowMobileSearchModal(true)
    }
    return (
        <nav className="bg-neutrals-8 border-b border-neutrals-6 relative z-30 w-full">
            {/* Desktop Navbar */}
            <div className="hidden lg:block w-full">
                <div className="h-[88px] flex items-center w-full">
                    <div className="flex items-center justify-between w-full px-4">
                        {/* Left section */}
                        <div className="flex items-center gap-6">
                            {/* Hamburger menu - show only when sidebar is closed */}
                            {isAuthenticated && !isSidebarOpen && (
                                <button
                                    onClick={onToggleSidebar}
                                    className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors relative z-50"
                                >
                                    <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            )}

                            {/* Logo */}
                            <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-primary-1 rounded-full flex items-center justify-center">
                                    <span className="text-neutrals-8 font-bold text-lg">T</span>
                                </div>
                                <span className="font-poppins font-semibold text-neutrals-2 text-[27px]">Trippy</span>
                            </Link>

                            {/* Search bar - Only when authenticated */}
                            {isAuthenticated && (
                                <div className="relative w-[446px] h-14">
                                    <div
                                        className="w-full h-full relative rounded-full"
                                        style={{
                                            outline: '2px #E6E8EC solid',
                                            outlineOffset: '-2px'
                                        }}
                                    >
                                        {/* Search Icon */}
                                        <div className="w-6 h-6 absolute top-4" style={{ left: '20px' }}>
                                            <svg className="w-5 h-5 absolute left-0.5 top-0.5" fill="none" stroke="#777E90" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>

                                        {/* Search Input */}
                                        <input
                                            type="text"
                                            placeholder="Search everything"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            onKeyDown={handleSearchKeyDown}
                                            onFocus={handleSearchFocus}
                                            className="input-field white"
                                            style={{
                                                paddingLeft: '50px',
                                                paddingRight: '24px',
                                                fontSize: '14px',
                                                lineHeight: '24px',
                                                borderRadius: '9999px',
                                                height: '56px'
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Search Suggestions Dropdown */}
                                    <SearchSuggestions
                                        isOpen={suggestionsOpen}
                                        suggestions={suggestions}
                                        onSuggestionClick={handleSuggestionClick}
                                        onClose={clearSuggestions}
                                        loading={loading}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right section */}
                        <div className="flex items-center gap-4">
                            {!isAuthenticated ? (
                                /* Unauthenticated state */
                                <>
                                    <button
                                        onClick={onSignIn}
                                        className="border-2 border-neutrals-6 text-neutrals-2 font-dm-sans font-bold text-sm leading-4 px-4 py-3 rounded-[90px] hover:bg-neutrals-7 transition-colors"
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={onSignUp}
                                        className="bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-sm leading-4 px-4 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors"
                                    >
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                /* Authenticated state */
                                <>
                                    {/* Notifications */}
                                    <Link to="/notifications" className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors">
                                        <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    </Link>

                                    {/* Wishlist */}
                                    <Link to="/wishlist" className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors">
                                        <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </Link>

                                    {/* Messages */}
                                    <Link to="/messages" className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors">
                                        <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </Link>

                                    {/* Profile */}
                                    <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-[#FFBC99] border-2 border-transparent hover:border-primary-1 transition-colors">
                                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navbar */}
            <div className="lg:hidden w-full">
                <div className="h-[88px] flex items-center justify-between px-4 w-full">
                    {/* Left section */}
                    <div className="flex items-center gap-4">
                        {isAuthenticated && (
                            <button
                                onClick={onToggleSidebar}
                                className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors relative z-50"
                            >
                                <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}

                        {/* Logo */}
                        <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-primary-1 rounded-full flex items-center justify-center">
                                <span className="text-neutrals-8 font-bold text-lg">T</span>
                            </div>
                            {!isAuthenticated && (
                                <span className="font-poppins font-semibold text-neutrals-2 text-[27px]">Trippy</span>
                            )}
                        </Link>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-4">
                        {!isAuthenticated ? (
                            /* Unauthenticated state */
                            <>
                                <button
                                    onClick={onSignIn}
                                    className="border-2 border-neutrals-6 text-neutrals-2 font-dm-sans font-bold text-sm leading-4 px-4 py-3 rounded-[90px] hover:bg-neutrals-7 transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={onSignUp}
                                    className="bg-primary-1 text-neutrals-8 font-dm-sans font-bold text-sm leading-4 px-4 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors"
                                >
                                    Sign up
                                </button>
                            </>
                        ) : (
                            /* Authenticated state */
                            <>
                                {/* Search icon */}
                                <button 
                                    onClick={handleMobileSearchClick}
                                    className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>

                                {/* Notifications */}
                                <Link to="/notifications" className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors">
                                    <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                </Link>

                                {/* Wishlist */}
                                <Link to="/wishlist" className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors">
                                    <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </Link>

                                {/* Messages */}
                                <Link to="/messages" className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors">
                                    <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </Link>

                                {/* Profile */}
                                <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden bg-[#FFBC99] border-2 border-transparent hover:border-primary-1 transition-colors">
                                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Search Modal */}
            <SearchModal 
                isOpen={showMobileSearchModal} 
                onClose={() => setShowMobileSearchModal(false)} 
            />
        </nav>
    )
}

export default Navbar
