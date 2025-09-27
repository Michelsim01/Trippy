import React from 'react';
import ExperienceCard from '../ExperienceCard';
import { Link } from 'react-router-dom';

const TourListTab = ({ tourData, loading = false, isOwnProfile, wishlistExperienceIds = [], onTourDeleted = null }) => {
    console.log('TourListTab props:', { 
        tourData: tourData?.length || 0, 
        loading, 
        isOwnProfile, 
        wishlistExperienceIds: wishlistExperienceIds?.length || 0,
        wishlistIds: wishlistExperienceIds 
    });
    if (loading) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-neutrals-1 mb-6">
                    Tour list
                </h3>
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1 mx-auto mb-4"></div>
                        <p className="text-neutrals-3">Loading experiences...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!tourData || tourData.length === 0) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-neutrals-1 mb-6">
                    Tour list
                </h3>
                <div className="text-center py-8">
                    <p className="text-neutrals-3 mb-4">
                        {isOwnProfile 
                            ? "You haven't created any experiences yet." 
                            : "This user hasn't created any experiences yet."
                        }
                    </p>
                    {isOwnProfile && (
                        <Link to="/create-experience/basic-info" className="btn btn-primary">
                            Create Your First Experience
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-semibold text-neutrals-1 mb-6">
                Tour list ({tourData.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tourData.map((tour) => {
                    const experienceId = tour.experienceId || tour.id;
                    // Convert both to strings for comparison to handle number vs string mismatch
                    const isInWishlist = wishlistExperienceIds.some(wishlistId => 
                        String(wishlistId) === String(experienceId)
                    );
                    console.log(`TourListTab - Tour ${experienceId} (type: ${typeof experienceId}): isInWishlist=${isInWishlist}`);
                    console.log(`TourListTab - Wishlist contains: ${JSON.stringify(wishlistExperienceIds)} (types: ${wishlistExperienceIds.map(id => typeof id).join(', ')})`);
                    return (
                        <ExperienceCard
                            key={experienceId}
                            experience={tour}
                            showEditButton={isOwnProfile}
                            showDeleteButton={isOwnProfile}
                            onExperienceDeleted={onTourDeleted}
                            showWishlistButton={!isOwnProfile}
                            isInWishlist={isInWishlist}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default TourListTab;
