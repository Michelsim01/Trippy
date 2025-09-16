import { useState, useEffect } from 'react';
import { Star, Check, Flag, Edit, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

const UserRole = {
    TOURIST: 'tourist',
    TOUR_GUIDE: 'guide'
};

const ProfileCard = ({ 
    userId, 
    userData: propUserData,
    className = "" 
}) => {
    const { isAuthenticated, token, user: currentUser } = useAuth();
    const [userData, setUserData] = useState(propUserData || null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(!propUserData);
    const [error, setError] = useState(null);
    console.log('Current User:', currentUser.id);
    console.log('Profile User ID:', userId);
    const isCurrentUserProfile = (
        currentUser && userId && String(currentUser.id) === String(userId)
    );

    useEffect(() => {
        if (propUserData) {
            setUserData(propUserData);
            setLoading(false);
        }
    }, [propUserData]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Check if user is authenticated
                if (!isAuthenticated || !token) {
                    setError('Authentication required');
                    setLoading(false);
                    return;
                }

                // Only fetch user data if not provided as prop
                if (!propUserData) {
                    const userResponse = await userService.getUserById(userId);
                    if (userResponse.success) {
                        setUserData(userResponse.data);
                    } else {
                        setError(userResponse.error || 'Failed to fetch user data');
                        setLoading(false);
                        return;
                    }
                }

                // Always fetch stats
                const statsResponse = await userService.getUserStats(userId);
                if (statsResponse.success) {
                    setUserStats(statsResponse.data);
                } else {
                    console.warn('Failed to fetch user stats:', statsResponse.error);
                    // Don't set error for stats failure, it's not critical
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (userId && isAuthenticated) {
        fetchUserData();
        }
    }, [userId, isAuthenticated, token, propUserData]);

    const getUserRole = (user) => {
        if (!user) return UserRole.TOURIST;
        return user.canCreateExperiences && user.kycStatus === 'APPROVED'
            ? UserRole.TOUR_GUIDE
            : UserRole.TOURIST;
    };

    if (loading) {
        return (
            <div className={`profile-card ${className}`}>
                <div className="flex items-center justify-center h-64">
                    <div className="btn loading">Loading...</div>
                </div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className={`profile-card ${className}`}>
                <div className="text-center p-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    {error.includes('Authentication') ? (
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                                // Redirect to sign in or refresh auth
                                window.location.href = '/signin';
                            }}
                        >
                            Sign In
                        </button>
                    ) : (
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                    )}
                </div>
            </div>
        );
    }

    const role = getUserRole(userData);
    const isTourGuide = role === UserRole.TOUR_GUIDE;
    const isTourist = role === UserRole.TOURIST;
    const stats = userStats;
    const memberSince = new Date(userData.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
    });

    console.log('User Data:', userData);

    return (
        <div className={`profile-card ${className}`}>
            {/* Header Section */}
            <div className="text-center mb-6">
                {/* Verified Badge for Tour Guides */}
                {isTourGuide && userData.kycStatus === 'APPROVED' && (
                    <div className="mb-4">
                        <span className="status-badge">
                            <Check className="w-4 h-4" />
                            Verified Tour Guide
                        </span>
                    </div>
                )}

                {/* Profile Photo */}
                <div className="profile-photo">
                    <div className={`profile-photo-ring ${isTourist ? 'tourist' : ''}`}>
                        <img
                            src={userData.profileImageUrl || `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=random`}
                            alt={`${userData.firstName} ${userData.lastName}`}
                            className="w-full h-full rounded-full object-cover bg-white"
                        />
                    </div>
                    {userData.isEmailVerified && isTourGuide && (
                        <div className="verified-badge">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Name and Edit Icon */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {userData.firstName} {userData.lastName}
                    </h2>
                </div>

                {/* Rating or Member Status */}
                {isTourGuide && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-lg font-semibold text-gray-900">
                            {stats ? (stats.rating || 'N/A') : '...'}
                        </span>
                        <span className="text-gray-500">
                            ({stats ? (stats.reviewCount || 0) : 0} reviews)
                        </span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mb-6">
                {isCurrentUserProfile ? (
                    <button 
                        className="btn btn-primary btn-md gap-2"
                        onClick={() => {
                            // TODO: Implement profile editing functionality
                            console.log('Edit Profile clicked');
                        }}
                    >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                    </button>
                ) : (
                <button className="btn btn-outline-primary btn-md gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Contact
                </button>
                )}
            </div>

            {/* User Status Indicators */}
            <div className="mb-4 space-y-2">
                {!userData.isActive && (
                    <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">
                            Account Inactive
                        </span>
                    </div>
                )}

                {isTourGuide && userData.kycStatus !== 'APPROVED' && (
                    <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm">
                            KYC {userData.kycStatus.replace('_', ' ').toLowerCase()}
                        </span>
                    </div>
                )}

                {userData.isEmailVerified && (
                    <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                            Email Verified
                        </span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-4 mb-4"></div>

            {/* Footer */}
            <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">Member since {memberSince}</p>
                {!isCurrentUserProfile && (
                <button className="flex items-center justify-center gap-2 text-gray-500 hover:text-red-500 transition-colors mx-auto text-sm">
                    <Flag className="w-4 h-4" />
                    <span>Report this user</span>
                </button>
                )}
            </div>
        </div>
    );
};

export { UserRole };
export default ProfileCard;