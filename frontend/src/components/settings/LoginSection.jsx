import React from 'react';

const LoginSection = () => (
    <div id="login" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Login</h2>
        </div>
        <div className="space-y-4">
            <div>
                <label className="field-label" htmlFor="password">
                    Password
                </label>
                <div className="input-container">
                    <input
                        id="password"
                        type="password"
                        className="input-field white tracking-widest"
                        defaultValue="**************"
                        readOnly
                    />
                </div>
                <p className="text-sm text-neutrals-4 mt-2">Last updated 1 month ago</p>
            </div>
            <button
                className="btn btn-outline-primary btn-md"
                type="button"
            >
                Update password
            </button>
        </div>
    </div>
);

export default LoginSection;
