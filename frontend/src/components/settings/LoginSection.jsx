import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import swal from 'sweetalert2';

const LoginSection = ({ userData: propUserData, onUserDataUpdate }) => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(!propUserData);
    const [error, setError] = useState(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [updating, setUpdating] = useState(false);
    const [currentPasswordError, setCurrentPasswordError] = useState('');

    const userId = user?.id;

    const fetchUserData = async () => {
        if (!userId) {
            setError('User ID not available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await userService.getUserById(userId);
            
            if (response.success) {
                // We don't need to store userData locally since it's passed via props
                // but we can use it for validation if needed
                setError(null);
            } else {
                setError(response.error || 'Failed to load user data');
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const successfulUpdateNotification = async () => {
        try {
            console.log('Sending notification for userId:', userId);
            const notificationPayload = {
                title: 'Password Updated',
                message: 'Your password has been updated successfully.',
                userId: userId,
                type: 'PASSWORD_RESET',
            };
            console.log('Notification payload:', notificationPayload);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(notificationPayload),
            });
            
            console.log('Notification response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Notification error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Notification sent successfully:', data);
        }
        catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const validateCurrentPassword = async () => {
        try {
            const response = await userService.verifyPassword(userId, passwordData.currentPassword);
            return response.success && response.data.isValid;
        } catch (error) {
            console.error('Error validating current password:', error);
            return false;
        }
    };

    const passwordMeetsRequirements = (password) => {
        // At least 1 uppercase, 1 lowercase, 1 number, and 8+ characters
        return /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /[0-9]/.test(password) &&
               password.length >= 8;
    };

    const updatePassword = async () => {
        setCurrentPasswordError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setCurrentPasswordError('New passwords do not match');
            return;
        }

        if (!passwordMeetsRequirements(passwordData.newPassword)) {
            setCurrentPasswordError('New password must be at least 8 characters long and containing at least 1 uppercase letter, 1 lowercase letter, and 1 number');
            return;
        }

        if (!passwordData.currentPassword) {
            setCurrentPasswordError('Current password is required');
            return;
        }

        try {
            setUpdating(true);
            const isCurrentPasswordValid = await validateCurrentPassword();
            
            if (!isCurrentPasswordValid) {
                setCurrentPasswordError('Current password is incorrect');
                return;
            }
            const response = await userService.changePassword(userId, passwordData.newPassword);

            if (!response.success) {
                throw new Error(response.error || 'Failed to change password');
            }
            await successfulUpdateNotification();

            swal.fire({
                icon: 'success',
                title: 'Password Updated Successfully',
                text: 'Your password has been updated. For security purposes, you will be logged out and need to sign in again with your new password.',
                showConfirmButton: true,
                confirmButtonText: 'Understand',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                logout();
            });

            setShowPasswordForm(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setCurrentPasswordError('');
        } catch (err) {
            console.error('Error updating password:', err);
            swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.message || 'Failed to update password. Please try again.',
            });
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'currentPassword') {
            setCurrentPasswordError('');
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        updatePassword();
    };

    // Initialize with prop data if available
    useEffect(() => {
        if (propUserData) {
            setLoading(false);
            setError(null);
        }
    }, [propUserData]);

    // Fetch data if not provided via props
    useEffect(() => {
        if (!propUserData && userId) {
            fetchUserData();
        }
    }, [userId, propUserData]);

    if (loading) {
        return (
            <div id="login" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div id="login" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={fetchUserData} className="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id="login" className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
                <h2 className="text-xl font-semibold text-neutrals-1">Login</h2>
            </div>
            
            {!showPasswordForm ? (
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
                                value="********"
                                readOnly
                            />
                        </div>
                    </div>
                    <button
                        className="btn btn-outline-primary btn-md"
                        type="button"
                        onClick={() => setShowPasswordForm(true)}
                    >
                        Update password
                    </button>
                </div>
            ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="field-label" htmlFor="currentPassword">
                            Current Password
                        </label>
                        <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            className={`input-field white ${(currentPasswordError == 'Current password is required' ||  currentPasswordError == 'Current password is incorrect') ? 'error' : ''}`}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            required
                        />
                        {(currentPasswordError == 'Current password is required' ||  currentPasswordError == 'Current password is incorrect') && (
                            <div className="error-message">{currentPasswordError}</div>
                        )}
                    </div>
                    <div>
                        <label className="field-label" htmlFor="newPassword">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            className={`input-field white ${currentPasswordError == 'New passwords do not match' || currentPasswordError.startsWith('New password must') ? 'error' : ''}`}
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            minLength="8"
                            required
                        />
                        <p className="text-sm text-neutrals-4 mt-1">
                            Password must be at least 8 characters, contain 1 uppercase, 1 lowercase, and 1 number
                        </p>
                    </div>
                    <div>
                        <label className="field-label" htmlFor="confirmPassword">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className={`input-field white ${currentPasswordError == 'New passwords do not match' || currentPasswordError.startsWith('New password must') ? 'error' : ''}`}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            required
                        />
                        {(currentPasswordError == 'New passwords do not match' || currentPasswordError.startsWith('New password must')) && (
                            <div className="error-message">{currentPasswordError}</div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                                setShowPasswordForm(false);
                                setPasswordData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: ''
                                });
                                setCurrentPasswordError('');
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updating}
                            className="btn btn-outline-primary btn-md"
                        >
                            {updating ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default LoginSection;