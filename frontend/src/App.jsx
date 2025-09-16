import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import WelcomePage from './pages/WelcomePage'
import SignUpPage from './pages/SignUpPage'
import SignInPage from './pages/SignInPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import HomePage from './pages/HomePage'
import NotificationsPage from './pages/NotificationsPage'
import WishlistPage from './pages/WishlistPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import BlogPage from './pages/BlogPage'
import CreateExperienceBasicInfoPage from './pages/CreateExperienceBasicInfoPage'
import CreateExperienceDetailsPage from './pages/CreateExperienceDetailsPage'
import CreateExperiencePricingPage from './pages/CreateExperiencePricingPage'
import CreateExperienceAvailabilityPage from './pages/CreateExperienceAvailabilityPage'
import CreateExperienceSuccessPage from './pages/CreateExperienceSuccessPage'
import ExperienceDetailsPage from './pages/ExperienceDetailsPage'
import ExperienceDetailsPageTest from './pages/ExperienceDetailsPageTest'
import EditExperienceBasicInfoPage from './pages/EditExperienceBasicInfoPage'
import EditExperienceDetailsPage from './pages/EditExperienceDetailsPage'
import EditExperiencePricingPage from './pages/EditExperiencePricingPage'
import EditExperienceAvailabilityPage from './pages/EditExperienceAvailabilityPage'
import CalendarPage from './pages/CalendarPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import SettingsPage from './pages/SettingsPage'
import SearchResultsPage from './pages/SearchResultsPage'
import './App.css' 

// AppRoutes component that uses authentication context
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()


  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-4 font-poppins">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <WelcomePage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUpPage />}
      />
      <Route
        path="/signin"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <SignInPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <ResetPasswordPage />}
      />

      {/* Email verification routes - accessible when user has token but not verified */}
      <Route
        path="/email-verification"
        element={<EmailVerificationPage />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />

            {/* Protected routes */}
            <Route
              path="/home"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <HomePage />}
            />
            <Route
            path="/search"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <SearchResultsPage />}
          />
          <Route
              path="/notifications"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <NotificationsPage />}
            />
            <Route
              path="/wishlist"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <WishlistPage />}
            />
            <Route
              path="/messages"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <MessagesPage />}
            />
            <Route
              path="/profile/:id"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <ProfilePage />}
            />
            <Route
              path="/blog"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <BlogPage />}
            />
            
            {/* Create Experience Multi-Step Flow - Only BasicInfo for testing */}
            <Route
              path="/create-experience"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/create-experience/basic-info" replace />}
            />
            <Route
              path="/create-experience/basic-info"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateExperienceBasicInfoPage />}
            />
            <Route
              path="/create-experience/details"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateExperienceDetailsPage />}
            />
            <Route
              path="/create-experience/pricing"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateExperiencePricingPage />}
            />
            <Route
              path="/create-experience/availability"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateExperienceAvailabilityPage />}
            />
            <Route
              path="/create-experience/success"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateExperienceSuccessPage />}
            />
            <Route
              path="/experience-details"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <ExperienceDetailsPage />}
            />
            <Route
              path="/experience/:id"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <ExperienceDetailsPage />}
            />
            <Route
              path="/experience-details-test"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <ExperienceDetailsPageTest />}
            />
            
            {/* Edit Experience Flow */}
            <Route
              path="/edit-experience/:id"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="basic-info" replace />}
            />
            <Route
              path="/edit-experience/:id/basic-info"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <EditExperienceBasicInfoPage />}
            />
            <Route
              path="/edit-experience/:id/details"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <EditExperienceDetailsPage />}
            />
            <Route
              path="/edit-experience/:id/pricing"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <EditExperiencePricingPage />}
            />
            <Route
              path="/edit-experience/:id/availability"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <EditExperienceAvailabilityPage />}
            />
          <Route
              path="/calendar"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <CalendarPage />}
            />
            <Route
              path="/about"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <AboutPage />}
            />
            <Route
              path="/contact"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <ContactPage />}
            />
            <Route
              path="/settings"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <SettingsPage />}
            />
            <Route
              path="/logout"
              element={!isAuthenticated ? <Navigate to="/" replace /> : <LogoutPage />}
            />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  )
}