import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSignupPage from './pages/AdminSignupPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';

// Placeholder components for other pages
const ExperienceManagementPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Experience Management</h1>
    <p className="text-gray-600">Manage tours and experiences</p>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <p className="text-gray-500">Experience management features coming soon...</p>
    </div>
  </div>
);

const BookingsPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
    <p className="text-gray-600">Manage all bookings</p>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <p className="text-gray-500">Booking management features coming soon...</p>
    </div>
  </div>
);

const TransactionsPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
    <p className="text-gray-600">View all financial transactions</p>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <p className="text-gray-500">Transaction management features coming soon...</p>
    </div>
  </div>
);

const DisputeResolutionPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
    <p className="text-gray-600">Handle user disputes and complaints</p>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <p className="text-gray-500">Dispute resolution features coming soon...</p>
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
    <p className="text-gray-600">Configure admin portal settings</p>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <p className="text-gray-500">Settings features coming soon...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/admin/login" 
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />} 
      />
      <Route 
        path="/admin/signup" 
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminSignupPage />} 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/experiences" 
        element={
          <ProtectedRoute>
            <ExperienceManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/bookings" 
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/transactions" 
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/disputes" 
        element={
          <ProtectedRoute>
            <DisputeResolutionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
