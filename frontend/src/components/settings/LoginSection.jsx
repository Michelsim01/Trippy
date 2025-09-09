import React from 'react';

const LoginSection = () => (
    <div id="login" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Login</h2>
        </div>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-neutrals-4 mb-2 uppercase tracking-wider">
                    Password
                </label>
                <div className="relative">
                    <input
                        type="password"
                        className="w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1 text-lg tracking-widest"
                        defaultValue="**************"
                        readOnly
                    />
                </div>
                <p className="text-sm text-neutrals-4 mt-2">Last updated 1 month ago</p>
            </div>
            <button className="px-6 py-3 border border-neutrals-6 rounded-full text-neutrals-1 font-medium hover:bg-neutrals-7 transition-colors">
                Update password
            </button>
        </div>
    </div>
);

export default LoginSection;
