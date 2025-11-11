import React, { useState, useEffect } from 'react';
import { MapPin, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { blogService } from '../services/blogService';

const RecommendedTours = ({ blogId }) => {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (blogId) {
            fetchRecommendedExperiences();
        }
    }, [blogId]);

    const fetchRecommendedExperiences = async () => {
        try {
            setLoading(true);
            const data = await blogService.getRecommendedExperiences(blogId);
            setExperiences(data);
        } catch (error) {
            console.error('Error fetching recommended experiences:', error);
            setExperiences([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExperienceClick = (experienceId) => {
        navigate(`/experience/${experienceId}`);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Recommended Tours</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="animate-pulse">
                            <div className="bg-neutrals-7 h-20 rounded-lg mb-2"></div>
                            <div className="bg-neutrals-7 h-4 rounded mb-1"></div>
                            <div className="bg-neutrals-7 h-3 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!experiences || experiences.length === 0) {
        return null; // Don't show section if no recommendations
    }

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Recommended Tours</h3>
            <div className="space-y-4">
                {experiences.map((experience) => (
                    <div
                        key={experience.experienceId}
                        onClick={() => handleExperienceClick(experience.experienceId)}
                        className="cursor-pointer group"
                    >
                        <div className="flex gap-3">
                            {/* Image */}
                            <div className="w-20 h-20 bg-neutrals-6 rounded-lg overflow-hidden flex-shrink-0">
                                {experience.coverPhotoUrl ? (
                                    <img
                                        src={experience.coverPhotoUrl}
                                        alt={experience.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-neutrals-6 flex items-center justify-center">
                                        <MapPin className="w-8 h-8 text-neutrals-4" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-neutrals-1 group-hover:text-primary-1 transition-colors line-clamp-2 text-sm">
                                    {experience.title}
                                </h4>

                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="w-3 h-3 text-neutrals-4" />
                                    <span className="text-xs text-neutrals-4 truncate">
                                        {experience.location || experience.country}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span className="text-xs text-neutrals-3">
                                            {experience.averageRating?.toFixed(1) || '5.0'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-primary-1">
                                        ${experience.price || '0'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-neutrals-7">
                <button
                    onClick={() => navigate('/experiences')}
                    className="text-sm text-primary-1 hover:text-primary-2 font-medium"
                >
                    View all experiences →
                </button>
            </div>
        </div>
    );
};

export default RecommendedTours;