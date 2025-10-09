import React from 'react';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-screen w-64 z-10">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-64">
          {/* Top Navigation */}
          <TopNavigation />

          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;