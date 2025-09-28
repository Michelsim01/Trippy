import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { unreadCountManager } from '../utils/unreadCountManager';

const useUnreadMessagesCount = () => {
    const { user, isAuthenticated } = useAuth();
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = async () => {
        if (!isAuthenticated || !user?.id) {
            setTotalUnreadCount(0);
            return;
        }

        try {
            setLoading(true);
            const userId = user.id || user.userId;
            const response = await fetch(`http://localhost:8080/api/personal-chats/user/${userId}/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const count = await response.json();
                setTotalUnreadCount(count || 0);
            } else {
                console.error('Failed to fetch unread count');
                setTotalUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
            setTotalUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when auth state changes
    useEffect(() => {
        fetchUnreadCount();
    }, [isAuthenticated, user?.id]);

    // Listen for unread count change events
    useEffect(() => {
        const unsubscribe = unreadCountManager.subscribe(() => {
            fetchUnreadCount();
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    return {
        totalUnreadCount,
        loading,
        refetchUnreadCount: fetchUnreadCount
    };
};

export default useUnreadMessagesCount;