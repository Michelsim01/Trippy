import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSmartSuggestions } from '../services/guideAnalyticsService';

const SmartSuggestionsModal = ({ experienceId, experienceName, isOpen, onClose }) => {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && experienceId) {
            fetchSuggestions();
        }
    }, [isOpen, experienceId]);

    const fetchSuggestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSmartSuggestions(experienceId);  // call backend api to get smart suggestions
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditExperience = () => {
        // Navigate to edit experience page
        window.open(`/edit-experience/${experienceId}/basic-info`, '_blank');
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'MEDIUM':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'LOW':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'PRICING':
                return (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                );
            case 'CONVERSION':
                return (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            case 'CONTENT':
                return (
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                );
            case 'PERFORMANCE':
                return (
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
            case 'DURATION':
                return (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            {/* BACKDROP (gray, translucent) */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] transition-opacity duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* MODAL PANEL */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Smart Suggestions for Improvement</h2>
                                <p className="text-sm text-gray-600">{experienceName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600">Analyzing your experience...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.96-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-red-600 font-medium mb-2">Unable to load suggestions</p>
                                <p className="text-gray-600 text-sm mb-4">{error}</p>
                                <button
                                    onClick={fetchSuggestions}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : suggestions?.suggestions?.length > 0 ? (
                            <div className="space-y-4">
                                {suggestions.suggestions.map((suggestion, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getTypeIcon(suggestion.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                                                        {suggestion.priority}
                                                    </span>
                                                    {suggestion.impact_estimate && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                            +{suggestion.impact_estimate}% impact
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-700 text-sm leading-relaxed">{suggestion.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <p className="text-gray-600 font-medium mb-2">No suggestions available</p>
                                <p className="text-gray-500 text-sm">
                                    {suggestions?.has_similar_experiences
                                        ? 'Your experience is already performing well!'
                                        : 'Not enough data to generate suggestions yet.'}
                                </p>
                            </div>
                        )}

                        {/* Analysis Base */}
                        {suggestions?.analysis_base && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500 text-center">
                                    {suggestions.analysis_base}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-center p-6 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={handleEditExperience}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Edit Experience
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );

};

export default SmartSuggestionsModal;