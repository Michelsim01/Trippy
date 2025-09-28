class UnreadCountManager {
  constructor() {
    this.listeners = [];
  }
  
  // Subscribe to unread count changes
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  // Notify all listeners that unread count has changed
  notifyCountChanged() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in unread count listener:', error);
      }
    });
  }
  
  // Get current listener count (for debugging)
  getListenerCount() {
    return this.listeners.length;
  }
}

// Create singleton instance
export const unreadCountManager = new UnreadCountManager();