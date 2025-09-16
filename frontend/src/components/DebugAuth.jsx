import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
    const { user, isAuthenticated, isLoading, token } = useAuth();
    
    return (
        <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
            <h3 className="font-bold mb-2">Auth Debug Info:</h3>
            <div className="space-y-1">
                <div><strong>isLoading:</strong> {isLoading ? 'true' : 'false'}</div>
                <div><strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}</div>
                <div><strong>hasUser:</strong> {user ? 'true' : 'false'}</div>
                <div><strong>hasToken:</strong> {token ? 'true' : 'false'}</div>
                {user && (
                    <>
                        <div><strong>userId:</strong> {user.userId || user.id}</div>
                        <div><strong>emailVerified:</strong> {user.emailVerified ? 'true' : 'false'}</div>
                        <div><strong>email:</strong> {user.email}</div>
                    </>
                )}
                <div><strong>localStorage token:</strong> {localStorage.getItem('token') ? 'exists' : 'missing'}</div>
                <div><strong>localStorage user:</strong> {localStorage.getItem('user') ? 'exists' : 'missing'}</div>
            </div>
        </div>
    );
};

export default DebugAuth;
