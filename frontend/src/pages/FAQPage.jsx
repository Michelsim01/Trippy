import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { faqService } from '../services/faqService';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const FAQPage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const pageSize = 10;

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchFAQs(currentPage, selectedCategory);
    }, [currentPage, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const cats = await faqService.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Don't show error, just continue without filters
        }
    };

    const fetchFAQs = async (page, category) => {
        try {
            setLoading(true);
            setError(null);
            const response = await faqService.getFAQs(page, pageSize, category);
            setFaqs(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            setError('Failed to load FAQs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryFilter = (category) => {
        if (selectedCategory === category) {
            // Deselect if clicking the same category
            setSelectedCategory(null);
        } else {
            setSelectedCategory(category);
        }
        setCurrentPage(0); // Reset to first page when filter changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePageClick = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const parseFAQContent = (content) => {
        if (!content) return { question: null, answer: null };
        
        // Try to split on question marks, periods, or exclamation marks
        const sentences = content.split(/[.!?]+/);
        
        if (sentences.length >= 2) {
            let question = sentences[0].trim();
            let answer = sentences.slice(1).join('.').trim();
            
            // Clean up question mark
            if (question.endsWith('?')) {
                question = question.substring(0, question.length - 1).trim();
            }
            
            return { question, answer };
        } else if (sentences.length === 1) {
            // Try to find question mark
            const questionMarkIndex = content.indexOf('?');
            if (questionMarkIndex > 0 && questionMarkIndex < content.length - 1) {
                const question = content.substring(0, questionMarkIndex).trim();
                const answer = content.substring(questionMarkIndex + 1).trim();
                return { question, answer };
            }
            // No clear question, return as answer only
            return { question: null, answer: content.trim() };
        }
        
        return { question: null, answer: content.trim() };
    };

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-8">
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0 || loading}
                    className="p-2 border border-neutrals-6 rounded-lg hover:bg-neutrals-7 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {startPage > 0 && (
                    <>
                        <button
                            onClick={() => handlePageClick(0)}
                            className="px-3 py-2 border border-neutrals-6 rounded-lg hover:bg-neutrals-7 transition-colors"
                        >
                            1
                        </button>
                        {startPage > 1 && <span className="px-2 text-neutrals-4">...</span>}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-3 py-2 border rounded-lg transition-colors ${
                            page === currentPage
                                ? 'bg-primary-1 text-white border-primary-1'
                                : 'border-neutrals-6 hover:bg-neutrals-7'
                        }`}
                    >
                        {page + 1}
                    </button>
                ))}

                {endPage < totalPages - 1 && (
                    <>
                        {endPage < totalPages - 2 && <span className="px-2 text-neutrals-4">...</span>}
                        <button
                            onClick={() => handlePageClick(totalPages - 1)}
                            className="px-3 py-2 border border-neutrals-6 rounded-lg hover:bg-neutrals-7 transition-colors"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="p-2 border border-neutrals-6 rounded-lg hover:bg-neutrals-7 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
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
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Frequently Asked Questions</h1>

                            {/* Category Filters */}
                            {categories.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-sm font-semibold text-neutrals-2 mr-2">Filter by:</span>
                                        <button
                                            onClick={() => handleCategoryFilter(null)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                selectedCategory === null
                                                    ? 'bg-primary-1 text-white'
                                                    : 'bg-neutrals-7 text-neutrals-2 hover:bg-neutrals-6'
                                            }`}
                                        >
                                            All
                                        </button>
                                        {categories.map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => handleCategoryFilter(category)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    selectedCategory === category
                                                        ? 'bg-primary-1 text-white'
                                                        : 'bg-neutrals-7 text-neutrals-2 hover:bg-neutrals-6'
                                                }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedCategory && (
                                        <p className="text-sm text-neutrals-4 mt-2">
                                            Showing FAQs in category: <span className="font-semibold">{selectedCategory}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary-1" />
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                                    {error}
                                </div>
                            ) : faqs.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 text-center text-neutrals-4">
                                    <p>No FAQs available at the moment.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-8">
                                        {faqs.map((faq) => {
                                            const { question, answer } = parseFAQContent(faq.content);
                                            return (
                                                <div
                                                    key={faq.knowledgeId}
                                                    className="bg-white rounded-lg p-6 shadow-sm border border-neutrals-6"
                                                >
                                                    {faq.category && (
                                                        <span className="inline-block px-3 py-1 bg-primary-1/10 text-primary-1 text-xs font-semibold rounded-full mb-3">
                                                            {faq.category}
                                                        </span>
                                                    )}
                                                    {question && (
                                                        <div className="mb-3">
                                                            <h3 className="text-lg font-semibold text-neutrals-1 mb-2">
                                                                Question:
                                                            </h3>
                                                            <p className="text-neutrals-1">{question}</p>
                                                        </div>
                                                    )}
                                                    {answer && (
                                                        <div>
                                                            <h4 className="text-md font-semibold text-neutrals-2 mb-2">
                                                                Answer:
                                                            </h4>
                                                            <p className="text-neutrals-3 whitespace-pre-wrap">{answer}</p>
                                                        </div>
                                                    )}
                                                    {!question && !answer && (
                                                        <div className="text-neutrals-1 whitespace-pre-wrap">
                                                            {faq.content}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {renderPagination()}

                                    <div className="text-center text-neutrals-4 text-sm mt-4">
                                        Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} FAQs
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
                <Navbar
                    isAuthenticated={true}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={toggleSidebar}
                />
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
                <main className="w-full p-4">
                    <h1 className="text-2xl font-bold text-neutrals-1 mb-4">Frequently Asked Questions</h1>

                    {/* Category Filters - Mobile */}
                    {categories.length > 0 && (
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-neutrals-2 mr-2">Filter:</span>
                                <button
                                    onClick={() => handleCategoryFilter(null)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        selectedCategory === null
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-neutrals-7 text-neutrals-2 hover:bg-neutrals-6'
                                    }`}
                                >
                                    All
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryFilter(category)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            selectedCategory === category
                                                ? 'bg-primary-1 text-white'
                                                : 'bg-neutrals-7 text-neutrals-2 hover:bg-neutrals-6'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                            {selectedCategory && (
                                <p className="text-xs text-neutrals-4 mt-2">
                                    Category: <span className="font-semibold">{selectedCategory}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-1" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            {error}
                        </div>
                    ) : faqs.length === 0 ? (
                        <div className="bg-white rounded-lg p-8 text-center text-neutrals-4">
                            <p>No FAQs available at the moment.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-8">
                                {faqs.map((faq) => {
                                    const { question, answer } = parseFAQContent(faq.content);
                                    return (
                                        <div
                                            key={faq.knowledgeId}
                                            className="bg-white rounded-lg p-4 shadow-sm border border-neutrals-6"
                                        >
                                            {faq.category && (
                                                <span className="inline-block px-3 py-1 bg-primary-1/10 text-primary-1 text-xs font-semibold rounded-full mb-3">
                                                    {faq.category}
                                                </span>
                                            )}
                                            {question && (
                                                <div className="mb-3">
                                                    <h3 className="text-base font-semibold text-neutrals-1 mb-1">
                                                        Question:
                                                    </h3>
                                                    <p className="text-neutrals-1 text-sm">{question}</p>
                                                </div>
                                            )}
                                            {answer && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-neutrals-2 mb-1">
                                                        Answer:
                                                    </h4>
                                                    <p className="text-neutrals-3 text-sm whitespace-pre-wrap">{answer}</p>
                                                </div>
                                            )}
                                            {!question && !answer && (
                                                <div className="text-neutrals-1 whitespace-pre-wrap text-sm">
                                                    {faq.content}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {renderPagination()}

                            <div className="text-center text-neutrals-4 text-xs mt-4">
                                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} FAQs
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default FAQPage;

