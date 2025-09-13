import { useState } from 'react';

const TimeDropdown = ({ currentTimeOfDay, onTimeOfDayChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const timeOptions = [
        { value: '', label: 'Any time' },
        { value: 'morning', label: 'Morning' },
        { value: 'afternoon', label: 'Afternoon' },
        { value: 'evening', label: 'Evening' }
    ];

    const currentOption = timeOptions.find(option => option.value === currentTimeOfDay) || timeOptions[0];

    const handleTimeSelect = (timeValue) => {
        onTimeOfDayChange(timeValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-neutrals-6 rounded-full bg-white hover:border-neutrals-5 transition-colors"
            >
                <span className="text-[14px] font-bold text-neutrals-2 whitespace-nowrap">
                    {currentOption.label}
                </span>
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
                <>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutrals-6 rounded-lg shadow-lg z-50 min-w-[140px]">
                        {timeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleTimeSelect(option.value)}
                                className={`w-full px-4 py-3 text-left hover:bg-neutrals-8 transition-colors ${
                                    currentTimeOfDay === option.value ? 'bg-primary-1 bg-opacity-10 text-primary-1' : 'text-neutrals-2'
                                } first:rounded-t-lg last:rounded-b-lg`}
                            >
                                <span className="text-[14px] font-medium">
                                    {option.label}
                                </span>
                                {currentTimeOfDay === option.value && (
                                    <svg className="w-4 h-4 float-right mt-0.5 text-primary-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
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

export default TimeDropdown;