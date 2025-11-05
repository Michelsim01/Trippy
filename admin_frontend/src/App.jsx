import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSignupPage from './pages/AdminSignupPage';
import AdminForgotPasswordPage from './pages/AdminForgotPasswordPage';
import AdminResetPasswordPage from './pages/AdminResetPasswordPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ExperienceManagementPage from './pages/ExperienceManagementPage';
import BookingManagementPage from './pages/BookingManagementPage';
import TransactionManagementPage from './pages/TransactionManagementPage';
import KYCManagementPage from './pages/KYCManagementPage';
import TicketResolutionPage from './pages/TicketResolutionPage';
import ReportResolutionPage from './pages/ReportResolutionPage';
import AdminReferralPage from './pages/AdminReferralPage';

// Placeholder components for other pages

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
        path="/admin/forgot-password" 
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminForgotPasswordPage />} 
      />
      <Route 
        path="/admin/reset-password" 
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminResetPasswordPage />} 
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
            <BookingManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/transactions" 
        element={
          <ProtectedRoute>
            <TransactionManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/kyc" 
        element={
          <ProtectedRoute>
            <KYCManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/tickets" 
        element={
          <ProtectedRoute>
            <TicketResolutionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute>
            <ReportResolutionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/referrals" 
        element={
          <ProtectedRoute>
            <AdminReferralPage />
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
