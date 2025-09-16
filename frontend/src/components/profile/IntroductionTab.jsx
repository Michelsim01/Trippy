import React from 'react';

const IntroductionTab = ({ userData, userName, isTourGuide }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">
                    {isTourGuide ? `About ${userName}` : `Hi, I'm ${userName}`}
                </h3>
                <p className="text-neutrals-3 leading-relaxed">
                    {userData?.bio || `Meet ${userName}, a passionate tour guide with a knack for storytelling and a deep love for history. With ${userName}, every tour is an unforgettable journey, filled with fascinating insights and hidden gems.`}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isTourGuide && (
                    <div>
                        <h4 className="font-semibold text-neutrals-2 mb-2">Background & Experience</h4>
                        <p className="text-neutrals-3 text-sm">{userData?.background || 'Master of Tourism'}</p>
                    </div>
                )}
                {isTourGuide && (
                    <div>
                        <h4 className="font-semibold text-neutrals-2 mb-2">Specialization</h4>
                        <p className="text-neutrals-3 text-sm">{userData?.specialization || 'Historical tours, Cultural tours, Adventure tours'}</p>
                    </div>
                )}
                <div>
                    <h4 className="font-semibold text-neutrals-2 mb-2">Language skills</h4>
                    <p className="text-neutrals-3 text-sm">{userData?.languages || 'English, Chinese, Japanese'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-neutrals-2 mb-2">Personal Interests</h4>
                    <p className="text-neutrals-3 text-sm">{userData?.interests || 'Literature and Music'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-neutrals-2 mb-2">Tour Style</h4>
                    <p className="text-neutrals-3 text-sm">{userData?.tourStyle || 'Detailed historical facts, interactive experiences'}</p>
                </div>
            </div>
        </div>
    );
};

export default IntroductionTab;
