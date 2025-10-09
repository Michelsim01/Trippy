import React from 'react';
import { Bell } from 'lucide-react';

const TopNavigation = () => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Page title */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Portal</h1>
        </div>

        {/* Right side - Notifications */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
