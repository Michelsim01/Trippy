import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LogoutModal = ({ isOpen, onClose }) => {
    const { logout, isLoading } = useAuth();

    const handleLogout = async () => {
        await logout();
        onClose(); // Close modal after logout
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - Using bg-black/30 for 30% opacity */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="relative bg-white rounded-lg p-8 shadow-xl max-w-md w-full mx-4 pointer-events-auto">
                    <div className="text-center">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-neutrals-1 mb-4">Log Out</h1>
                        
                        {/* Message */}
                        <p className="text-neutrals-4 mb-8">
                            Are you sure you want to log out of your account?
                        </p>

                        {/* Buttons */}
                        <div className="space-y-4">
                            <button 
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Logging out...
                                    </div>
                                ) : (
                                    'Yes, Log Out'
                                )}
                            </button>
                            
                            <button 
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full border border-neutrals-6 text-neutrals-2 px-6 py-3 rounded-lg font-medium hover:bg-neutrals-7 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogoutModal;