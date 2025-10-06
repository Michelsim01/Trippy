import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userSurveyService } from '../services/userSurveyService'

// Placeholder image for background
const backgroundImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"

const SurveyPage = () => {
    const navigate = useNavigate()
    const { user, checkSurveyCompletion } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userData, setUserData] = useState({
        name: '',
        interests: [],
        travelStyle: '',
        budget: 25
    })

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
    ]

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
    ]

    // Budget categories
    const budgetCategories = [
        { label: 'Budget-Friendly', range: '$0 - $50', min: 0, max: 50, icon: '💵' },
        { label: 'Moderate', range: '$51 - $150', min: 51, max: 150, icon: '💳' },
        { label: 'Premium', range: '$151 - $300', min: 151, max: 300, icon: '💎' },
        { label: 'Luxury', range: '$301+', min: 301, max: 500, icon: '👑' }
    ]

    const handleInterestToggle = (interestId) => {
        if (userData.interests.includes(interestId)) {
            setUserData({
                ...userData,
                interests: userData.interests.filter(id => id !== interestId)
            })
        } else if (userData.interests.length < 5) {
            setUserData({
                ...userData,
                interests: [...userData.interests, interestId]
            })
        }
    }

    const handleTravelStyleSelect = (styleId) => {
        setUserData({
            ...userData,
            travelStyle: styleId
        })
    }

    const handleBudgetChange = (e) => {
        setUserData({
            ...userData,
            budget: parseInt(e.target.value)
        })
    }

    const getCurrentBudgetCategory = () => {
        const budget = userData.budget
        if (budget <= 50) return budgetCategories[0]
        if (budget <= 150) return budgetCategories[1]
        if (budget <= 300) return budgetCategories[2]
        return budgetCategories[3]
    }

    const handleStepNavigation = (stepNumber) => {
        // Validate that previous steps are completed before allowing navigation
        if (stepNumber > 1 && !userData.name.trim()) {
            return // Can't go past step 1 without introduction
        }
        if (stepNumber > 2 && userData.interests.length !== 5) {
            return // Can't go past step 2 without 5 interests
        }
        if (stepNumber > 3 && !userData.travelStyle) {
            return // Can't go past step 3 without travel style
        }
        setCurrentStep(stepNumber)
    }

    const isStepAccessible = (stepNumber) => {
        if (stepNumber === 1) return true
        if (stepNumber === 2) return userData.name.trim().length > 0
        if (stepNumber === 3) return userData.name.trim().length > 0 && userData.interests.length === 5
        if (stepNumber === 4) return userData.name.trim().length > 0 && userData.interests.length === 5 && userData.travelStyle !== ''
        return false
    }

    const handleContinue = async () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        } else {
            // Complete onboarding and save survey data
            if (!user) {
                console.error('No user found')
                return
            }

            setIsSubmitting(true)
            
            try {
                // Convert budget to appropriate range string
                const getBudgetCategory = () => {
                    if (userData.budget <= 50) return 'Budget-Friendly'
                    if (userData.budget <= 150) return 'Moderate'
                    if (userData.budget <= 300) return 'Premium'
                    return 'Luxury'
                }

                // Prepare survey data for backend
                const surveyData = {
                    user: { id: user.id },
                    introduction: userData.name.trim(),
                    interests: userData.interests,
                    travelStyle: userData.travelStyle,
                    experienceBudget: getBudgetCategory(),
                    completedAt: new Date().toISOString()
                }

                const response = await userSurveyService.createUserSurvey(surveyData)
                
                if (response.success) {
                    console.log('Survey saved successfully:', response.data)
                    // Update survey completion status in AuthContext
                    await checkSurveyCompletion(user.id)
                    navigate('/home')
                } else {
                    console.error('Failed to save survey:', response.error)
                    // Still navigate to home even if survey save fails
                    navigate('/home')
                }
            } catch (error) {
                console.error('Error saving survey:', error)
                // Still navigate to home even if survey save fails
                navigate('/home')
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const handleSkip = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const canContinue = () => {
        switch (currentStep) {
            case 1:
                return userData.name.trim().length > 0
            case 2:
                return userData.name.trim().length > 0 && userData.interests.length === 5
            case 3:
                return userData.name.trim().length > 0 && userData.interests.length === 5 && userData.travelStyle !== ''
            case 4:
                return userData.name.trim().length > 0 && userData.interests.length === 5 && userData.travelStyle !== ''
            default:
                return false
        }
    }

    return (
        <div className="min-h-screen bg-neutrals-8 lg:flex">
            {/* Left Section - Image (Desktop only) */}
            <div className="hidden lg:block lg:w-[448px] relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                {/* Left Panel Content */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-xs">
                        <h3 className="font-dm-sans font-bold text-xl mb-6">
                            Discover authentic local experiences
                        </h3>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => handleStepNavigation(1)}
                                className={`flex items-start space-x-4 w-full text-left p-2 rounded-lg transition-colors ${
                                    currentStep === 1 ? 'bg-white/10' : isStepAccessible(1) ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(1)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? 'bg-primary-1' : 'bg-white/20'}`}>
                                    1
                                </div>
                                <div>
                                    <div className="font-poppins font-semibold">Your Introduction</div>
                                    <div className="font-poppins text-sm opacity-80">Tell us about yourself</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleStepNavigation(2)}
                                className={`flex items-start space-x-4 w-full text-left p-2 rounded-lg transition-colors ${
                                    currentStep === 2 ? 'bg-white/10' : isStepAccessible(2) ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(2)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? 'bg-primary-1' : 'bg-white/20'}`}>
                                    2
                                </div>
                                <div>
                                    <div className="font-poppins font-semibold">Your Interests</div>
                                    <div className="font-poppins text-sm opacity-80">What excites you most?</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleStepNavigation(3)}
                                className={`flex items-start space-x-4 w-full text-left p-2 rounded-lg transition-colors ${
                                    currentStep === 3 ? 'bg-white/10' : isStepAccessible(3) ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(3)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 3 ? 'bg-primary-1' : 'bg-white/20'}`}>
                                    3
                                </div>
                                <div>
                                    <div className="font-poppins font-semibold">Travel Style</div>
                                    <div className="font-poppins text-sm opacity-80">How do you explore?</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleStepNavigation(4)}
                                className={`flex items-start space-x-4 w-full text-left p-2 rounded-lg transition-colors ${
                                    currentStep === 4 ? 'bg-white/10' : isStepAccessible(4) ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isStepAccessible(4)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 4 ? 'bg-primary-1' : 'bg-white/20'}`}>
                                    4
                                </div>
                                <div>
                                    <div className="font-poppins font-semibold">Budget Range</div>
                                    <div className="font-poppins text-sm opacity-80">Your comfort zone</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-3 h-3 bg-primary-3 rounded transform rotate-45"></div>
                <div className="absolute top-40 right-32 w-4 h-4 bg-primary-1 rounded transform rotate-45"></div>
                <div className="absolute top-60 right-24 w-2 h-2 bg-primary-3 rounded transform rotate-45"></div>
                <div className="absolute bottom-40 right-16 w-5 h-5 bg-primary-2 rounded transform rotate-45"></div>
            </div>

            {/* Right Section - Content */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-0 relative">
                <div className="w-full max-w-[640px]">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <div className="w-40 h-15 flex items-center justify-center">
                                <img src="/Logo.png" alt="Trippy Logo" className="w-50 h-50 object-contain" />
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Logo */}
                    <div className="hidden lg:flex justify-center mb-8">
                        <Link to="/" className="hover:opacity-80 transition-opacity">
                            <div className="w-40 h-15 flex items-center justify-center">
                                <img src="/Logo.png" alt="Trippy Logo" className="w-50 h-50 object-contain" />
                            </div>
                        </Link>
                    </div>

                    {/* Step 1: Introduction */}
                    {currentStep === 1 && (
                        <div className="text-center mb-8">
                            <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                                Welcome to Trippy!
                            </h1>
                            <p className="font-poppins text-base text-neutrals-4 mb-8">
                                Let's get to know you better
                            </p>

                            <div className="max-w-md mx-auto">
                                <textarea
                                    rows={5}
                                    value={userData.name}
                                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                    placeholder="Give a short introduction of yourself"
                                    className="w-full px-8 py-4 border-2 border-neutrals-6 rounded-[40px] font-poppins font-medium text-lg text-neutrals-2 placeholder-neutrals-4 focus:outline-none focus:border-primary-1 transition-colors resize-none"
                                    maxLength={1000}
                                    style={{ fontSize: '1rem', minHeight: '80px' }}
                                />
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div>
                            <div className="text-center mb-8">
                                <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                                    What sparks your wanderlust?
                                </h1>
                                <p className="font-poppins text-base text-neutrals-4">
                                    Pick your top 5 interests ({userData.interests.length}/5 selected)
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {interests.map((interest) => (
                                    <button
                                        key={interest.id}
                                        onClick={() => handleInterestToggle(interest.id)}
                                        className={`p-6 rounded-2xl border-2 transition-all ${
                                            userData.interests.includes(interest.id)
                                                ? 'border-primary-1 bg-primary-1/10'
                                                : 'border-neutrals-6 bg-white hover:border-neutrals-5'
                                        }`}
                                    >
                                        <div className="text-4xl mb-2">{interest.icon}</div>
                                        <div className="font-poppins text-sm text-neutrals-3">
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
                            <div className="text-center mb-8">
                                <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                                    Your travel style?
                                </h1>
                                <p className="font-poppins text-base text-neutrals-4">
                                    How do you like to explore?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {travelStyles.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => handleTravelStyleSelect(style.id)}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all ${
                                            userData.travelStyle === style.id
                                                ? 'border-primary-1 bg-primary-1/10'
                                                : 'border-neutrals-6 bg-white hover:border-neutrals-5'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="text-4xl">{style.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-poppins font-semibold text-lg text-neutrals-2 mb-1">
                                                    {style.title}
                                                </div>
                                                <div className="font-poppins text-sm text-neutrals-4">
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
                            <div className="text-center mb-8">
                                <h1 className="font-dm-sans font-bold text-[40px] leading-[48px] tracking-[-0.4px] text-neutrals-2 mb-3">
                                    Experience budget?
                                </h1>
                                <p className="font-poppins text-base text-neutrals-4">
                                    Per experience you're comfortable with
                                </p>
                            </div>

                            <div className="max-w-lg mx-auto mb-8">
                                <div className="grid grid-cols-4 gap-4 mb-8">
                                    {budgetCategories.map((category, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-2xl text-center transition-all ${
                                                userData.budget >= category.min && userData.budget <= category.max
                                                    ? 'bg-primary-1 text-white'
                                                    : 'bg-white border-2 border-neutrals-6'
                                            }`}
                                        >
                                            <div className="text-3xl mb-2">{category.icon}</div>
                                            <div className="font-poppins font-semibold text-sm mb-1">
                                                {category.label}
                                            </div>
                                            <div className="font-poppins text-xs opacity-80">
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
                                        value={userData.budget}
                                        onChange={handleBudgetChange}
                                        className="w-full h-2 bg-neutrals-6 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${(userData.budget / 500) * 100}%, #E5E5E5 ${(userData.budget / 500) * 100}%, #E5E5E5 100%)`
                                        }}
                                    />
                                </div>

                                <div className="text-center">
                                    <div className="font-dm-sans font-bold text-5xl text-primary-1 mb-2">
                                        ${userData.budget}
                                    </div>
                                    <p className="font-poppins text-sm text-neutrals-4">
                                        Adjust the slider to set your preferred budget
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Continue Button */}
                    <div className="pt-6 text-center">
                        <button
                            onClick={handleContinue}
                            disabled={!canContinue() || isSubmitting}
                            className="bg-primary-1 text-white font-dm-sans font-bold text-sm px-12 py-3 rounded-[90px] hover:bg-primary-1/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving...
                                </div>
                            ) : (
                                currentStep === 4 ? 'Complete Setup' : 'Continue'
                            )}
                        </button>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="hidden lg:block absolute top-20 right-32 w-2 h-2 bg-primary-4 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute top-32 right-20 w-4 h-4 bg-primary-1 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute top-52 right-28 w-2 h-2 bg-primary-3 rounded transform rotate-45"></div>
                <div className="hidden lg:block absolute bottom-40 left-1/2 w-5 h-5 bg-primary-2 rounded transform rotate-45"></div>
            </div>
        </div>
    )
}

export default SurveyPage;