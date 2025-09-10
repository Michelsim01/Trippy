import React from 'react';

const PrivacySection = () => (
    <div id="privacy" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Privacy</h2>
        </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-neutrals-6">
                <div>
                    <h3 className="font-medium text-neutrals-1">Profile visibility</h3>
                    <p className="text-sm text-neutrals-4">Control who can see your profile</p>
                </div>
                <style>{`
                    .select-field.sm {
                        max-width: 180px;
                        min-width: 120px;
                        width: 100%;
                    }
                `}</style>
                <select className="select-field sm" defaultValue="Public">
                    <option>Public</option>
                    <option>Friends only</option>
                    <option>Private</option>
                </select>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutrals-6">
                <div>
                    <h3 className="font-medium text-neutrals-1">Show online status</h3>
                    <p className="text-sm text-neutrals-4">Let others see when you're online</p>
                </div>
                <label className="toggle-button">
                    <input type="checkbox" className="toggle-input" defaultChecked />
                    <span className="toggle-slider"></span>
                </label>
            </div>
            <div className="flex items-center justify-between py-3">
                <div>
                    <h3 className="font-medium text-neutrals-1">Data sharing</h3>
                    <p className="text-sm text-neutrals-4">Share anonymized data to improve our service</p>
                </div>
                <label className="toggle-button">
                    <input type="checkbox" className="toggle-input" />
                    <span className="toggle-slider"></span>
                </label>
            </div>
        </div>
    </div>
);

export default PrivacySection;
