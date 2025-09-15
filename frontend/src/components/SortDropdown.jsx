import { useState } from 'react';

const SortDropdown = ({ currentSort, onSortChange, variant = "desktop" }) => {
    const [isOpen, setIsOpen] = useState(false);

    const sortOptions = [
        { value: 'bestMatch', label: 'Best Match', description: 'Most relevant to your search' },
        { value: 'cheapest', label: 'Cheapest', description: 'Lowest price first' },
        { value: 'trustiest', label: 'Trustiest', description: 'Highest rated with most reviews' },
        { value: 'quickest', label: 'Shortest', description: 'Shortest duration first' },
        { value: 'timeOfDay', label: 'Time of Day', description: 'Morning, afternoon, evening' },
        { value: 'newest', label: 'Newest', description: 'Most recently listed' }
    ];

    const currentOption = sortOptions.find(option => option.value === currentSort) || sortOptions[0];

    const handleSortSelect = (sortValue) => {
        onSortChange(sortValue);
        setIsOpen(false);
    };

    if (variant === "mobile") {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-white border border-neutrals-6 rounded-lg text-left"
                >
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-3 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        <div>
                            <span className="text-[14px] font-medium text-neutrals-1">{currentOption.label}</span>
                            <p className="text-[12px] text-neutrals-4 mt-1">{currentOption.description}</p>
                        </div>
                    </div>
                    <svg 
                        className={`w-5 h-5 text-neutrals-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutrals-6 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSortSelect(option.value)}
                                className={`w-full px-4 py-3 text-left hover:bg-neutrals-8 transition-colors ${
                                    currentSort === option.value ? 'bg-primary-1 bg-opacity-10 border-l-4 border-primary-1' : ''
                                } first:rounded-t-lg last:rounded-b-lg`}
                            >
                                <div className="flex items-center">
                                    <div>
                                        <span className={`text-[14px] font-medium ${
                                            currentSort === option.value ? 'text-primary-1' : 'text-neutrals-1'
                                        }`}>
                                            {option.label}
                                        </span>
                                        <p className="text-[12px] text-neutrals-4 mt-1">{option.description}</p>
                                    </div>
                                    {currentSort === option.value && (
                                        <svg className="w-4 h-4 ml-auto text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Desktop version
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between min-w-[200px] px-4 py-2 bg-white border border-neutrals-6 rounded-lg text-left hover:border-neutrals-5 transition-colors"
            >
                <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="text-[14px] font-medium text-neutrals-1">{currentOption.label}</span>
                </div>
                <svg 
                    className={`w-4 h-4 text-neutrals-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutrals-6 rounded-lg shadow-lg z-50 min-w-[280px]">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSortSelect(option.value)}
                            className={`w-full px-4 py-3 text-left hover:bg-neutrals-8 transition-colors ${
                                currentSort === option.value ? 'bg-primary-1 bg-opacity-10 border-l-4 border-primary-1' : ''
                            } first:rounded-t-lg last:rounded-b-lg`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className={`text-[14px] font-medium ${
                                        currentSort === option.value ? 'text-primary-1' : 'text-neutrals-1'
                                    }`}>
                                        {option.label}
                                    </span>
                                    <p className="text-[12px] text-neutrals-4 mt-1">{option.description}</p>
                                </div>
                                {currentSort === option.value && (
                                    <svg className="w-4 h-4 text-primary-1 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default SortDropdown;