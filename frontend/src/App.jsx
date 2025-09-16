import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import WelcomePage from './pages/WelcomePage'
import SignUpPage from './pages/SignUpPage'
import SignInPage from './pages/SignInPage'
import HomePage from './pages/HomePage'
import NotificationsPage from './pages/NotificationsPage'
import WishlistPage from './pages/WishlistPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import BlogPage from './pages/BlogPage'
import CreateExperiencePage from './pages/CreateExperiencePage'
import CalendarPage from './pages/CalendarPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import SettingsPage from './pages/SettingsPage'
import LogoutPage from './pages/LogoutPage'
import KycOnboardingPage from './pages/KycOnboardingPage'
import KycVerificationPage from './pages/KycVerificationPage'
import KycSubmittedPage from './pages/KycSubmittedPage'
import './App.css'

// Mock authentication state - in real app this would come from context/redux
const isAuthenticated = true

export default function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
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

          {/* Protected routes */}
          <Route
            path="/home"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <HomePage />}
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
            path="/profile"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <ProfilePage />}
          />
          <Route
            path="/blog"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <BlogPage />}
          />
          <Route
            path="/create-experience"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateExperiencePage />}
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

          <Route
            path="/kyc-onboarding"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <KycOnboardingPage />}
          />

          <Route
            path="/kyc-verification"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <KycVerificationPage />}
          />

          <Route
            path="/kyc-submitted"
            element={!isAuthenticated ? <Navigate to="/" replace /> : <KycSubmittedPage />}
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      </Router>
    </UserProvider>
  )
}
