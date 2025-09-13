import React from 'react';
import { Heart, Star } from 'lucide-react';

const TourListTab = ({ tourData }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-neutrals-1 mb-6">
                Tour list
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tourData.map((tour) => (
                    <div key={tour.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative">
                            <img 
                                src={tour.image} 
                                alt={tour.title}
                                className="w-full h-48 object-cover"
                            />
                            <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Heart className="w-4 h-4 text-neutrals-4" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-neutrals-4 uppercase tracking-wider">
                                    {tour.subtitle}
                                </span>
                                <span className="text-lg font-bold text-primary-1">{tour.price}</span>
                            </div>
                            <h4 className="font-semibold text-neutrals-1 mb-2">{tour.title}</h4>
                            <div className="flex items-center justify-between text-sm text-neutrals-4">
                                <span>{tour.duration}</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-primary-2 fill-current" />
                                    <span>{tour.rating}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TourListTab;
