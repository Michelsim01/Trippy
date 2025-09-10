import React from 'react';

const ProfileSection = () => (
    <div id="profile" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Profile Settings</h2>
        </div>
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#FFBC99] rounded-full overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-neutrals-1">Profile Photo</h3>
                    <p className="text-sm text-neutrals-4">Update your profile picture</p>
                </div>
                <button className="px-4 py-2 border border-neutrals-6 rounded-lg text-sm font-medium hover:bg-neutrals-7 transition-colors">
                    Change
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="field-label" htmlFor="firstName">
                        First Name
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        className="input-field white"
                        defaultValue="John"
                    />
                </div>
                <div>
                    <label className="field-label" htmlFor="lastName">
                        Last Name
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        className="input-field white"
                        defaultValue="Doe"
                    />
                </div>
            </div>
            <div>
                <label className="field-label" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    className="input-field white"
                    defaultValue="john.doe@example.com"
                />
            </div>
            <div>
                <label className="field-label" htmlFor="bio">
                    Bio
                </label>
                <textarea
                    id="bio"
                    rows="3"
                    className="textarea-field"
                    placeholder="Tell us about yourself..."
                ></textarea>
            </div>
        </div>
    </div>
);

export default ProfileSection;
