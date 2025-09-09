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
                <select className="px-3 py-2 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1">
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
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutrals-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-1"></div>
                </label>
            </div>
            <div className="flex items-center justify-between py-3">
                <div>
                    <h3 className="font-medium text-neutrals-1">Data sharing</h3>
                    <p className="text-sm text-neutrals-4">Share anonymized data to improve our service</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutrals-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-1"></div>
                </label>
            </div>
        </div>
    </div>
);

export default PrivacySection;
