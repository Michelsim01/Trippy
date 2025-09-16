import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSearchSuggestions from '../hooks/useSearchSuggestions';

const SearchModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef(null);
    const { suggestions, loading, isOpen: suggestionsOpen, searchWithDebounce, clearSuggestions } = useSearchSuggestions();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        setSearchQuery('');
        clearSuggestions();
        onClose();
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        searchWithDebounce(value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            handleClose();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.type === 'experience' && suggestion.experienceId) {
            // Navigate to specific experience page if it exists
            navigate(`/experience/${suggestion.experienceId}`);
        } else {
            // Navigate to search results with the suggestion text
            navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
        }
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 p-4 border-b border-neutrals-6">
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-neutrals-7 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-neutrals-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="flex-1">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search everything"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-12 pr-4 py-3 border border-neutrals-6 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent"
                            />
                        </div>
                    </form>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1 mx-auto mb-4"></div>
                            <p className="text-neutrals-4">Searching...</p>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="py-2">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full px-6 py-4 text-left hover:bg-neutrals-7 transition-colors flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 bg-neutrals-6 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {suggestion.type === 'location' ? (
                                            <svg className="w-6 h-6 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-base font-medium text-neutrals-1 truncate">
                                            {suggestion.text}
                                        </div>
                                        <div className="text-sm text-neutrals-4 truncate">
                                            {suggestion.subtitle}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 ? (
                        <div className="p-8 text-center">
                            <svg className="w-16 h-16 text-neutrals-5 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-neutrals-4">No suggestions found</p>
                            <p className="text-sm text-neutrals-5 mt-2">
                                Press Enter to search for "{searchQuery}"
                            </p>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <svg className="w-16 h-16 text-neutrals-5 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">Start typing to search</h3>
                            <p className="text-neutrals-4">
                                Search for experiences, locations, and more
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;