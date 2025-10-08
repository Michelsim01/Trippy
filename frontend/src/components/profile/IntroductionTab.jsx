import React, { useState } from 'react';
import { 
    User, 
    Heart, 
    MapPin,
    Users,
    DollarSign,
    Sparkles,
    Globe,
    Edit
} from 'lucide-react';
import EditSurveyModal from './EditSurveyModal';

const IntroductionTab = ({ userData, userName, isTourGuide, isOwnProfile, surveyData, surveyLoading, onSurveyUpdate }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentSurveyData, setCurrentSurveyData] = useState(surveyData);

    // Update local survey data when prop changes
    React.useEffect(() => {
        setCurrentSurveyData(surveyData);
    }, [surveyData]);

    const handleSurveyUpdate = (updatedData) => {
        setCurrentSurveyData(updatedData);
        // Call parent callback if provided
        if (onSurveyUpdate) {
            onSurveyUpdate(updatedData);
        }
    };
    // Interest options mapping with Lucide icons
    const interestLabels = {
        'culture': { label: 'Culture & History', icon: () => <span role="img" aria-label="Culture">🏛️</span> },
        'food': { label: 'Food Culture', icon: () => <span role="img" aria-label="Food">🍜</span> },
        'adventure': { label: 'Adventure', icon: () => <span role="img" aria-label="Adventure">🏔️</span> },
        'art': { label: 'Art & Museums', icon: () => <span role="img" aria-label="Art">🎨</span> },
        'beach': { label: 'Beach & Relaxation', icon: () => <span role="img" aria-label="Beach">🏖️</span> },
        'nightlife': { label: 'Nightlife', icon: () => <span role="img" aria-label="Nightlife">🌃</span> },
        'wildlife': { label: 'Wildlife & Nature', icon: () => <span role="img" aria-label="Wildlife">🦁</span> },
        'photography': { label: 'Photography', icon: () => <span role="img" aria-label="Photography">📷</span> },
        'shopping': { label: 'Shopping', icon: () => <span role="img" aria-label="Shopping">🛍️</span> },
        'wellness': { label: 'Wellness & Spa', icon: () => <span role="img" aria-label="Wellness">🧘</span> },
        'sports': { label: 'Sports & Fitness', icon: () => <span role="img" aria-label="Sports">⚽</span> },
        'entertainment': { label: 'Entertainment', icon: () => <span role="img" aria-label="Entertainment">🎬</span> }
    };

    // Travel style mapping with icons
    const travelStyleLabels = {
        'social': { label: 'Social Explorer', icon: () => <span role="img" aria-label="Social">🎒</span> },
        'business': { label: 'Business + Leisure', icon: () => <span role="img" aria-label="Business">💼</span> },
        'family': { label: 'Family Traveler', icon: () => <span role="img" aria-label="Family">👨‍👩‍👧‍👦</span> },
        'romantic': { label: 'Romantic Getaway', icon: () => <span role="img" aria-label="Romantic">💑</span> }
    };

    // Budget categories with icons
    const budgetIcons = {
        'Budget-Friendly': () => <span role="img" aria-label="Budget-Friendly">💵</span>,
        'Moderate': () => <span role="img" aria-label="Moderate">💳</span>,
        'Premium': () => <span role="img" aria-label="Premium">💎</span>,
        'Luxury': () => <span role="img" aria-label="Luxury">👑</span>
    };

    const budgetRanges = {
        'Budget-Friendly': '$0 - $50',
        'Moderate': '$51 - $150',
        'Premium': '$151 - $300',
        'Luxury': '$301+'
    };

    return (
        <div className="space-y-8">
            {/* Personal Introduction Section */}
            <div className="relative">
                {/* Background decoration */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-primary-1/10 to-primary-2/10 rounded-full blur-xl"></div>
                <div className="relative">
                    <div className="flex items-center mb-6">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-3 bg-gradient-to-br from-primary-1 to-primary-2 rounded-full text-white shadow-lg">
                                <User className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                            </div>
                            <h3 className="text-2xl font-bold text-neutrals-1 bg-gradient-to-r from-neutrals-1 to-neutrals-2 bg-clip-text">
                                {isTourGuide ? `About ${userName}` : `Hi, I'm ${userName}`}
                            </h3>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="ml-auto p-3 bg-primary-1/10 hover:bg-primary-1/20 rounded-xl transition-colors group/edit"
                                title="Edit travel preferences"
                            >
                                <Edit className="w-5 h-5 text-primary-1 group-hover/edit:scale-110 transition-transform duration-200" />
                            </button>
                        )}
                    </div>
                    
                    {/* Survey introduction with special styling */}
                    {currentSurveyData?.introduction && (
                        <div className="mb-6 relative">
                            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary-1 to-primary-2 rounded-full"></div>
                            <div className="pl-6 py-4 bg-gradient-to-r from-primary-1/10 to-transparent rounded-r-lg border-l-4 border-primary-1/20">
                                <div className="flex items-start gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-primary-1 mt-1 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-primary-1 uppercase tracking-wide">Introduction</span>
                                </div>
                                <p className="text-neutrals-2 leading-relaxed font-medium text-lg">
                                    {currentSurveyData.introduction}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Survey Data Section */}
            {currentSurveyData && (
                <div className="relative group">
                    {/* Decorative background elements */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary-1/10 via-primary-2/10 to-primary-3/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-700"></div>
                    <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-1/10">
                        {/* Section header with icon and edit button */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-primary-1 to-primary-2 rounded-xl text-white shadow-lg">
                                    <Globe className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-neutrals-1">Travel Preferences</h4>
                                    <p className="text-neutrals-3 text-sm">Discover their travel personality</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Travel Interests */}
                            {currentSurveyData.interests && currentSurveyData.interests.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-primary-1" />
                                        <h5 className="font-bold text-neutrals-1 text-lg">Travel Interests</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {currentSurveyData.interests.map((interest, index) => {
                                            const InterestIcon = interestLabels[interest]?.icon || MapPin;
                                            return (
                                                <div 
                                                    key={index}
                                                    className="group/tag flex items-center gap-2 
                                                               bg-gradient-to-r from-primary-1/20 to-primary-2/20 
                                                               text-neutrals-1 text-sm px-4 py-2 rounded-full 
                                                               border border-primary-1/30 shadow-sm"
                                                >
                                                    <InterestIcon className="w-4 h-4 text-primary-1 group-hover/tag:scale-110 transition-transform duration-200" />
                                                    <span className="font-medium">
                                                        {interestLabels[interest]?.label || interest}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Travel Style */}
                            {currentSurveyData.travelStyle && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-primary-2" />
                                        <h5 className="font-bold text-neutrals-1 text-lg">Travel Style</h5>
                                    </div>
                                    <div className="group/style">
                                        {(() => {
                                            const StyleIcon = travelStyleLabels[currentSurveyData.travelStyle]?.icon || Users;
                                            return (
                                                <div className="flex items-center gap-4 
                                                                bg-gradient-to-r from-primary-2/20 to-primary-3/20 
                                                                text-neutrals-1 p-4 rounded-xl 
                                                                border border-primary-2/30 shadow-sm">
                                                    <div className="p-2 bg-primary-2/10 rounded-lg group-hover/style:scale-110 transition-transform duration-200">
                                                        <StyleIcon className="w-6 h-6 text-primary-2" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-lg">
                                                            {travelStyleLabels[currentSurveyData.travelStyle]?.label || currentSurveyData.travelStyle}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Budget Preference */}
                            {currentSurveyData.experienceBudget && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-5 h-5 text-primary-3" />
                                        <h5 className="font-bold text-neutrals-1 text-lg">Budget Preference</h5>
                                    </div>
                                    <div className="group/budget">
                                        {(() => {
                                            const BudgetIcon = budgetIcons[currentSurveyData.experienceBudget] || DollarSign;
                                            return (
                                                <div className="flex items-center gap-4 
                                                                bg-gradient-to-r from-primary-3/20 to-primary-4/20 
                                                                text-neutrals-1 p-4 rounded-xl 
                                                                border border-primary-3/30 shadow-sm">
                                                    <div className="p-2 bg-primary-3/10 rounded-lg group-hover/budget:scale-110 transition-transform duration-200">
                                                        <BudgetIcon className="w-6 h-6 text-primary-3" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-lg block">
                                                            {currentSurveyData.experienceBudget}
                                                        </span>
                                                        <span className="text-sm text-neutrals-3">
                                                            {budgetRanges[currentSurveyData.experienceBudget] || 'Custom range'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state for survey data */}
            {surveyLoading && (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-1/10 to-primary-2/10 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-primary-1/20">
                        <div className="flex items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-8 h-8 border-4 border-primary-1/20 border-t-primary-1 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-primary-2 rounded-full animate-spin animate-reverse" style={{animationDelay: '0.5s'}}></div>
                            </div>
                            <div className="text-center">
                                <span className="text-neutrals-2 font-medium text-lg">Loading travel preferences</span>
                                <div className="flex gap-1 mt-2 justify-center">
                                    <div className="w-2 h-2 bg-primary-1 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-primary-2 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-primary-3 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Survey Modal */}
            <EditSurveyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                surveyData={currentSurveyData}
                onSurveyUpdate={handleSurveyUpdate}
            />
        </div>
    );
};

export default IntroductionTab;