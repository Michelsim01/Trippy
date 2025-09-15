import { useState } from 'react';

const AdditionalSortDropdown = ({ currentSort, onSortChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const additionalSortOptions = [
        { value: 'bestMatch', label: 'Best Match', description: 'Most relevant to your search' },
        { value: 'timeOfDay', label: 'Time of Day', description: 'Morning, afternoon, evening' },
        { value: 'newest', label: 'Recency of Listing', description: 'Newest first' }
    ];

    // Check if current sort is one of the additional options
    const isAdditionalSort = additionalSortOptions.some(option => option.value === currentSort);
    const currentOption = additionalSortOptions.find(option => option.value === currentSort);
    
    const displayLabel = isAdditionalSort ? currentOption.label : 'More options';

    const handleSortSelect = (sortValue) => {
        onSortChange(sortValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    isAdditionalSort 
                        ? "bg-neutrals-1 text-white" 
                        : "border border-neutrals-6 bg-white text-neutrals-2 hover:border-neutrals-5"
                }`}
            >
                <span className="text-[14px] font-bold whitespace-nowrap">
                    {displayLabel}
                </span>
                <svg 
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
                        isAdditionalSort ? 'text-white' : 'text-neutrals-4'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutrals-6 rounded-lg shadow-lg z-50 min-w-[200px]">
                        {additionalSortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSortSelect(option.value)}
                                className={`w-full px-4 py-3 text-left hover:bg-neutrals-8 transition-colors ${
                                    currentSort === option.value ? 'border-l-4 border-primary-1' : ''
                                } first:rounded-t-lg last:rounded-b-lg`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className={`text-[14px] font-medium ${
                                            currentSort === option.value ? 'text-neutrals-1' : 'text-neutrals-1'
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
                    
                    {/* Click outside to close */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                </>
            )}
        </div>
    );
};

export default AdditionalSortDropdown;