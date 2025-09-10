import React from 'react';

const AccountSection = () => (
    <div id="account" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Account</h2>
        </div>
        <div className="space-y-4">
            <div className="pt-4 border-t border-neutrals-6">
                <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-neutrals-4 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn btn-accent btn-lg" type="button">
                    Delete Account
                </button>
            </div>
        </div>
    </div>
);

export default AccountSection;
