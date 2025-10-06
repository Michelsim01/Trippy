import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import swal from 'sweetalert2';
import { userSurveyService } from '../../services/userSurveyService';
import { useAuth } from '../../contexts/AuthContext';

const EditSurveyModal = ({ isOpen, onClose, surveyData, onSurveyUpdate }) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        introduction: '',
        interests: [],
        travelStyle: '',
        budget: 25
    });

    // Interest options
    const interests = [
        { id: 'culture', label: 'Culture & History', icon: '🏛️' },
        { id: 'food', label: 'Food Culture', icon: '🍜' },
        { id: 'adventure', label: 'Adventure', icon: '🏔️' },
        { id: 'art', label: 'Art & Museums', icon: '🎨' },
        { id: 'beach', label: 'Beach & Relaxation', icon: '🏖️' },
        { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
        { id: 'wildlife', label: 'Wildlife & Nature', icon: '🦁' },
        { id: 'photography', label: 'Photography', icon: '📷' },
        { id: 'shopping', label: 'Shopping', icon: '🛍️' },
        { id: 'wellness', label: 'Wellness & Spa', icon: '🧘' },
        { id: 'sports', label: 'Sports & Fitness', icon: '⚽' },
        { id: 'entertainment', label: 'Entertainment', icon: '🎬' }
    ];

    // Travel style options
    const travelStyles = [
        {
            id: 'social',
            title: 'Social Explorer',
            icon: '🎒',
            description: 'Love meeting new people, group activities, and shared experiences'
        },
        {
            id: 'business',
            title: 'Business + Leisure',
            icon: '💼',
            description: 'Looking to mix work with local experiences'
        },
        {
            id: 'family',
            title: 'Family Traveler',
            icon: '👨‍👩‍👧‍👦',
            description: 'Looking for family-friendly experiences suitable for all ages'
        },
        {
            id: 'romantic',
            title: 'Romantic Getaway',
            icon: '💑',
            description: 'Seeking intimate experiences perfect for couples'
        }
    ];

    // Budget categories
    const budgetCategories = [
        { label: 'Budget-Friendly', range: '$0 - $50', min: 0, max: 50, icon: '💵' },
        { label: 'Moderate', range: '$51 - $150', min: 51, max: 150, icon: '💳' },
        { label: 'Premium', range: '$151 - $300', min: 151, max: 300, icon: '💎' },
        { label: 'Luxury', range: '$301+', min: 301, max: 500, icon: '👑' }
    ];

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && surveyData) {
            // Convert budget category back to numeric value
            const getBudgetValue = (category) => {
                switch (category) {
                    case 'Budget-Friendly': return 25;
                    case 'Moderate': return 100;
                    case 'Premium': return 225;
                    case 'Luxury': return 400;
                    default: return 25;
                }
            };

            setFormData({
                introduction: surveyData.introduction || '',
                interests: surveyData.interests || [],
                travelStyle: surveyData.travelStyle || '',
                budget: getBudgetValue(surveyData.experienceBudget)
            });
            setCurrentStep(1);
        }
    }, [isOpen, surveyData]);

    const handleInterestToggle = (interestId) => {
        if (formData.interests.includes(interestId)) {
            setFormData({
                ...formData,
                interests: formData.interests.filter(id => id !== interestId)
            });
        } else if (formData.interests.length < 5) {
            setFormData({
                ...formData,
                interests: [...formData.interests, interestId]
            });
        }
    };

    const handleTravelStyleSelect = (styleId) => {
        setFormData({
            ...formData,
            travelStyle: styleId
        });
    };

    const handleBudgetChange = (e) => {
        setFormData({
            ...formData,
            budget: parseInt(e.target.value)
        });
    };

    const handleStepNavigation = (stepNumber) => {
        // Validate that previous steps are completed before allowing navigation
        if (stepNumber > 1 && !formData.introduction.trim()) {
            return;
        }
        if (stepNumber > 2 && formData.interests.length !== 5) {
            return;
        }
        if (stepNumber > 3 && !formData.travelStyle) {
            return;
        }
        setCurrentStep(stepNumber);
    };

    const isStepAccessible = (stepNumber) => {
        if (stepNumber === 1) return true;
        if (stepNumber === 2) return formData.introduction.trim().length > 0;
        if (stepNumber === 3) return formData.introduction.trim().length > 0 && formData.interests.length === 5;
        if (stepNumber === 4) return formData.introduction.trim().length > 0 && formData.interests.length === 5 && formData.travelStyle !== '';
        return false;
    };

    const handleSave = async () => {
        if (!user) {
            console.error('No user found');
            swal.fire({ icon: 'error', title: 'Authentication Error', text: 'Please log in again.' });
            return;
        }

        if (!surveyData?.surveyId) {
            console.error('No survey ID found');
            swal.fire({ icon: 'error', title: 'Survey ID Not Found', text: 'Please try refreshing the page.' });
            return;
        }

        // Validate form data
        if (!formData.introduction.trim()) {
            swal.fire({ icon: 'warning', title: 'Missing Introduction', text: 'Please provide an introduction.' });
            return;
        }

        if (formData.interests.length !== 5) {
            swal.fire({ icon: 'warning', title: 'Invalid Interests', text: 'Please select exactly 5 interests.' });
            return;
        }

        if (!formData.travelStyle) {
            swal.fire({ icon: 'warning', title: 'Missing Travel Style', text: 'Please select a travel style.' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert budget to appropriate range string
            const getBudgetCategory = () => {
                if (formData.budget <= 50) return 'Budget-Friendly';
                if (formData.budget <= 150) return 'Moderate';
                if (formData.budget <= 300) return 'Premium';
                return 'Luxury';
            };

            // Prepare updated survey data for backend
            const updatedSurveyData = {
                userId: user.id, // Add userId as required by backend
                introduction: formData.introduction.trim(),
                interests: formData.interests,
                travelStyle: formData.travelStyle,
                experienceBudget: getBudgetCategory()
            };

            const response = await userSurveyService.updateUserSurvey(surveyData.surveyId, updatedSurveyData);

            if (response.success) {
                // Call the callback to update the parent component
                onSurveyUpdate(response.data);
                swal.fire({ icon: 'success', title: 'Update Successful', text: 'Details updated successfully.', timer: 3000, showConfirmButton: false });
                onClose();
            } else {
                swal.fire({ icon: 'error', title: 'Update Failed', text: `Failed to update details: ${response.error}` });
            }
        } catch (error) {
            swal.fire({ icon: 'error', title: 'Update Failed', text: 'Failed to update details. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return formData.introduction.trim().length > 0;
            case 2:
                return formData.introduction.trim().length > 0 && formData.interests.length === 5;
            case 3:
                return formData.introduction.trim().length > 0 && formData.interests.length === 5 && formData.travelStyle !== '';
            case 4:
                return formData.introduction.trim().length > 0 && formData.interests.length === 5 && formData.travelStyle !== '';
            default:
                return false;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                    <h2 className="text-2xl font-bold text-neutrals-1">Edit Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutrals-7 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-neutrals-3" />
                    </button>
                </div>

                <div className="flex">
                    {/* Sidebar Navigation */}
                    <div className="w-80 bg-neutrals-8 p-6 border-r border-neutrals-6">
                        <div className="space-y-4">
                            <button 
                                onClick={() => handleStepNavigation(1)}
                                className={`flex items-start space-x-4 w-full text-left p-3 rounded-lg transition-colors ${
                                    currentStep === 1 ? 'bg-primary-1/10 border border-primary-1/20' : isStepAccessible(1) ? 'hover:bg-neutrals-7' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(1)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 1 ? 'bg-primary-1 text-white' : 'bg-neutrals-6 text-neutrals-3'}`}>
                                    1
                                </div>
                                <div>
                                    <div className="font-semibold text-neutrals-1">Introduction</div>
                                    <div className="text-sm text-neutrals-3">Tell us about yourself</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleStepNavigation(2)}
                                className={`flex items-start space-x-4 w-full text-left p-3 rounded-lg transition-colors ${
                                    currentStep === 2 ? 'bg-primary-1/10 border border-primary-1/20' : isStepAccessible(2) ? 'hover:bg-neutrals-7' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(2)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 2 ? 'bg-primary-1 text-white' : 'bg-neutrals-6 text-neutrals-3'}`}>
                                    2
                                </div>
                                <div>
                                    <div className="font-semibold text-neutrals-1">Interests</div>
                                    <div className="text-sm text-neutrals-3">What excites you?</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleStepNavigation(3)}
                                className={`flex items-start space-x-4 w-full text-left p-3 rounded-lg transition-colors ${
                                    currentStep === 3 ? 'bg-primary-1/10 border border-primary-1/20' : isStepAccessible(3) ? 'hover:bg-neutrals-7' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(3)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 3 ? 'bg-primary-1 text-white' : 'bg-neutrals-6 text-neutrals-3'}`}>
                                    3
                                </div>
                                <div>
                                    <div className="font-semibold text-neutrals-1">Travel Style</div>
                                    <div className="text-sm text-neutrals-3">How do you explore?</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleStepNavigation(4)}
                                className={`flex items-start space-x-4 w-full text-left p-3 rounded-lg transition-colors ${
                                    currentStep === 4 ? 'bg-primary-1/10 border border-primary-1/20' : isStepAccessible(4) ? 'hover:bg-neutrals-7' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(4)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 4 ? 'bg-primary-1 text-white' : 'bg-neutrals-6 text-neutrals-3'}`}>
                                    4
                                </div>
                                <div>
                                    <div className="font-semibold text-neutrals-1">Budget</div>
                                    <div className="text-sm text-neutrals-3">Your comfort zone</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* Step 1: Introduction */}
                        {currentStep === 1 && (
                            <div className="max-w-2xl">
                                <div className="mb-8">
                                    <h3 className="text-3xl font-bold text-neutrals-1 mb-3">
                                        Your Introduction
                                    </h3>
                                    <p className="text-neutrals-3">
                                        Tell us about yourself 
                                    </p>
                                </div>

                                <div>
                                    <textarea
                                        rows={5}
                                        value={formData.introduction}
                                        onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                                        placeholder="Give a short introduction of yourself"
                                        className="w-full px-6 py-4 border-2 border-neutrals-6 rounded-xl font-medium text-lg text-neutrals-2 placeholder-neutrals-4 focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                        maxLength={1000}
                                    />
                                    <div className="text-right text-sm text-neutrals-4 mt-2">
                                        {formData.introduction.length}/1000 characters
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Interests */}
                        {currentStep === 2 && (
                            <div>
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-neutrals-1 mb-2">
                                        Your Travel Interests
                                    </h3>
                                    <p className="text-sm text-neutrals-3">
                                        Pick your top 5 interests ({formData.interests.length}/5 selected)
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {interests.map((interest) => (
                                        <button
                                            key={interest.id}
                                            onClick={() => handleInterestToggle(interest.id)}
                                            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                                                formData.interests.includes(interest.id)
                                                    ? 'border-primary-1 bg-primary-1/10'
                                                    : 'border-neutrals-6 bg-white hover:border-neutrals-5'
                                            }`}
                                        >
                                            <div className="text-2xl mb-2">{interest.icon}</div>
                                            <div className="font-medium text-xs text-neutrals-3">
                                                {interest.label}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Step 3: Travel Style */}
                        {currentStep === 3 && (
                            <div>
                                <div className="mb-8">
                                    <h3 className="text-3xl font-bold text-neutrals-1 mb-3">
                                        Your Travel Style
                                    </h3>
                                    <p className="text-neutrals-3">
                                        How do you like to explore and experience new places?
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {travelStyles.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => handleTravelStyleSelect(style.id)}
                                            className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                                                formData.travelStyle === style.id
                                                    ? 'border-primary-1 bg-primary-1/10'
                                                    : 'border-neutrals-6 bg-white hover:border-neutrals-5'
                                            }`}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="text-4xl">{style.icon}</div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-lg text-neutrals-2 mb-2">
                                                        {style.title}
                                                    </div>
                                                    <div className="text-sm text-neutrals-4">
                                                        {style.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Budget */}
                        {currentStep === 4 && (
                            <div>
                                <div className="mb-8">
                                    <h3 className="text-3xl font-bold text-neutrals-1 mb-3">
                                        Experience Budget
                                    </h3>
                                    <p className="text-neutrals-3">
                                        How much are you comfortable spending per experience?
                                    </p>
                                </div>

                                <div className="max-w-lg">
                                    <div className="grid grid-cols-4 gap-4 mb-8">
                                        {budgetCategories.map((category, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-xl text-center transition-all ${
                                                    formData.budget >= category.min && formData.budget <= category.max
                                                        ? 'bg-primary-1 text-white'
                                                        : 'bg-white border-2 border-neutrals-6'
                                                }`}
                                            >
                                                <div className="text-3xl mb-2">{category.icon}</div>
                                                <div className="font-semibold text-sm mb-1">
                                                    {category.label}
                                                </div>
                                                <div className="text-xs opacity-80">
                                                    {category.range}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-6">
                                        <input
                                            type="range"
                                            min="0"
                                            max="500"
                                            step="5"
                                            value={formData.budget}
                                            onChange={handleBudgetChange}
                                            className="w-full h-2 bg-neutrals-6 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${(formData.budget / 500) * 100}%, #E5E5E5 ${(formData.budget / 500) * 100}%, #E5E5E5 100%)`
                                            }}
                                        />
                                    </div>

                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-primary-1 mb-2">
                                            ${formData.budget}
                                        </div>
                                        <p className="text-sm text-neutrals-4">
                                            Adjust the slider to set your preferred budget
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-8 mt-8 border-t border-neutrals-6">
                            <div className="flex space-x-2">
                                {currentStep > 1 && (
                                    <button
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        className="px-3 py-2 text-neutrals-3 hover:text-neutrals-1 transition-colors rounded-full"
                                        aria-label="Previous"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div className="flex space-x-4">
                                {currentStep < 4 ? (
                                    <button
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        disabled={!canContinue()}
                                        className="px-3 py-2 text-neutrals-3 hover:text-neutrals-1 transition-colors rounded-full"
                                        aria-label="Next"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={!canContinue() || isSubmitting}
                                        className="bg-primary-1 text-white px-6 py-2 rounded-lg hover:bg-primary-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditSurveyModal;