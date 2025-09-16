import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchSuggestions = ({ isOpen, suggestions, onSuggestionClick, onClose, loading }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-white border border-neutrals-6 rounded-lg shadow-lg mt-2 z-50 max-h-80 overflow-y-auto"
        >
            {loading ? (
                <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-1 mx-auto mb-2"></div>
                    <p className="text-sm text-neutrals-4">Searching...</p>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="py-2">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-neutrals-7 transition-colors flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-neutrals-6 rounded-lg flex items-center justify-center flex-shrink-0">
                                {suggestion.type === 'location' ? (
                                    <svg className="w-5 h-5 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-neutrals-1 truncate">
                                    {suggestion.text}
                                </div>
                                <div className="text-xs text-neutrals-4 truncate">
                                    {suggestion.subtitle}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-4 text-center">
                    <svg className="w-12 h-12 text-neutrals-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-neutrals-4">No suggestions found</p>
                </div>
            )}
        </div>
    );
};

export default SearchSuggestions;