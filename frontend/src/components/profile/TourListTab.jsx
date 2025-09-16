import React from 'react';
import ExperienceCard from '../ExperienceCard';

const TourListTab = ({ tourData }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-neutrals-1 mb-6">
                Tour list
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tourData.map((tour) => (
                    <ExperienceCard key={tour.id || tour.experienceId} experience={tour} showEditButton={true} />
                ))}
            </div>
        </div>
    );
};

export default TourListTab;
