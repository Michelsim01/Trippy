import { useState } from 'react';

const FilterPanel = ({ filters, onFiltersChange, isOpen, onClose, variant = "desktop" }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handlePriceChange = (field, value) => {
        const newFilters = {
            ...localFilters,
            priceRange: {
                ...localFilters.priceRange,
                [field]: parseInt(value) || 0
            }
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleDurationChange = (duration) => {
        const newFilters = {
            ...localFilters,
            duration: localFilters.duration === duration ? '' : duration
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleDateChange = (field, value) => {
        const newFilters = {
            ...localFilters,
            [field]: value
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleLikedToggle = () => {
        const newFilters = {
            ...localFilters,
            onlyLiked: !localFilters.onlyLiked
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleReviewScoreToggle = (score) => {
        const newFilters = {
            ...localFilters,
            reviewScores: localFilters.reviewScores.includes(score)
                ? localFilters.reviewScores.filter(s => s !== score)
                : [...localFilters.reviewScores, score]
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const clearAllFilters = () => {
        const newFilters = {
            priceRange: { min: 0, max: 2000 },
            duration: '',
            startDate: '',
            endDate: '',
            onlyLiked: false,
            reviewScores: []
        };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const durationOptions = [
        "1-3 hours",
        "Half day",
        "Full day",
        "Multi-day"
    ];

    if (variant === "mobile") {
        return (
            <>
                {/* Mobile Filter Overlay */}
                {isOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
                        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] max-h-[90vh] overflow-y-auto">
                            {/* Mobile Filter Header */}
                            <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                                <h2 className="text-[20px] font-bold text-neutrals-1">Filters</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center text-neutrals-4"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Mobile Filter Content */}
                            <div className="p-6 space-y-8">
                                {/* Price Range */}
                                <div>
                                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Price Range</h3>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[12px] text-neutrals-4 mb-2">Min</label>
                                            <input
                                                type="number"
                                                value={localFilters.priceRange.min}
                                                onChange={(e) => handlePriceChange('min', e.target.value)}
                                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[12px] text-neutrals-4 mb-2">Max</label>
                                            <input
                                                type="number"
                                                value={localFilters.priceRange.max}
                                                onChange={(e) => handlePriceChange('max', e.target.value)}
                                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                                                placeholder="2000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div>
                                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Duration</h3>
                                    <div className="space-y-3">
                                        {durationOptions.map((duration) => (
                                            <label key={duration} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={localFilters.duration === duration}
                                                    onChange={() => handleDurationChange(duration)}
                                                    className="mr-3 w-4 h-4 text-primary-1 border-neutrals-5 rounded focus:ring-primary-1"
                                                />
                                                <span className="text-[14px] text-neutrals-2">{duration}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Date Range</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[12px] text-neutrals-4 mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={localFilters.startDate}
                                                onChange={(e) => handleDateChange('startDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] text-neutrals-4 mb-2">End Date</label>
                                            <input
                                                type="date"
                                                value={localFilters.endDate}
                                                onChange={(e) => handleDateChange('endDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Liked Listings */}
                                <div>
                                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Preferences</h3>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={localFilters.onlyLiked}
                                            onChange={handleLikedToggle}
                                            className="mr-3 w-4 h-4 text-primary-1 border-neutrals-5 rounded focus:ring-primary-1"
                                        />
                                        <span className="text-[14px] text-neutrals-2">Show only liked listings</span>
                                    </label>
                                </div>

                                {/* Review Scores */}
                                <div>
                                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Review Scores</h3>
                                    <div className="space-y-3">
                                        {[5, 4, 3, 2, 1].map((score) => (
                                            <label key={score} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={localFilters.reviewScores.includes(score)}
                                                    onChange={() => handleReviewScoreToggle(score)}
                                                    className="mr-3 w-4 h-4 text-primary-1 border-neutrals-5 rounded focus:ring-primary-1"
                                                />
                                                <div className="flex items-center">
                                                    <span className="text-[14px] text-neutrals-2 mr-2">{score}</span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                                                    </svg>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Filter Actions */}
                            <div className="p-6 border-t border-neutrals-6">
                                <div className="flex gap-3">
                                    <button
                                        onClick={clearAllFilters}
                                        className="flex-1 py-3 border border-neutrals-6 rounded-lg text-[14px] font-semibold text-neutrals-2"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 bg-primary-1 rounded-lg text-[14px] font-semibold text-white"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Desktop version
    return (
        <div className="hidden lg:block w-80 bg-white border border-neutrals-6 rounded-[16px] h-fit p-6">
            {/* Desktop Filter Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-bold text-neutrals-1">Filters</h2>
                <button
                    onClick={clearAllFilters}
                    className="text-[14px] text-primary-1 font-medium hover:underline"
                >
                    Clear All
                </button>
            </div>

            <div className="space-y-8">
                {/* Price Range */}
                <div>
                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Price Range</h3>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[12px] text-neutrals-4 mb-2">Min</label>
                            <input
                                type="number"
                                value={localFilters.priceRange.min}
                                onChange={(e) => handlePriceChange('min', e.target.value)}
                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[12px] text-neutrals-4 mb-2">Max</label>
                            <input
                                type="number"
                                value={localFilters.priceRange.max}
                                onChange={(e) => handlePriceChange('max', e.target.value)}
                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                                placeholder="2000"
                            />
                        </div>
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Duration</h3>
                    <div className="space-y-3">
                        {durationOptions.map((duration) => (
                            <label key={duration} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={localFilters.duration === duration}
                                    onChange={() => handleDurationChange(duration)}
                                    className="mr-3 w-4 h-4 text-primary-1 border-neutrals-5 rounded focus:ring-primary-1"
                                />
                                <span className="text-[14px] text-neutrals-2">{duration}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Date Range */}
                <div>
                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Date Range</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[12px] text-neutrals-4 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={localFilters.startDate}
                                onChange={(e) => handleDateChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] text-neutrals-4 mb-2">End Date</label>
                            <input
                                type="date"
                                value={localFilters.endDate}
                                onChange={(e) => handleDateChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-neutrals-6 rounded-lg text-[14px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Liked Listings */}
                <div>
                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Preferences</h3>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={localFilters.onlyLiked}
                            onChange={handleLikedToggle}
                            className="mr-3 w-4 h-4 text-primary-1 border-neutrals-5 rounded focus:ring-primary-1"
                        />
                        <span className="text-[14px] text-neutrals-2">Show only liked listings</span>
                    </label>
                </div>

                {/* Review Scores */}
                <div>
                    <h3 className="text-[16px] font-semibold text-neutrals-1 mb-4">Review Scores</h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((score) => (
                            <label key={score} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={localFilters.reviewScores.includes(score)}
                                    onChange={() => handleReviewScoreToggle(score)}
                                    className="mr-3 w-4 h-4 text-primary-1 border-neutrals-5 rounded focus:ring-primary-1"
                                />
                                <div className="flex items-center">
                                    <span className="text-[14px] text-neutrals-2 mr-2">{score}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" />
                                    </svg>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;