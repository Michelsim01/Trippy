import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { FormDataProvider } from './contexts/FormDataContext'
import useChatNotifications from './hooks/useChatNotifications'
import { unreadCountManager } from './utils/unreadCountManager'
import { UserProvider } from './contexts/UserContext'
import { CheckoutProvider } from './contexts/CheckoutContext'
import { TripPointsProvider } from './contexts/TripPointsContext'
import { ReviewProvider } from './contexts/ReviewContext'
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
import MyBookingsPage from './pages/MyBookingsPage'
import BookingDetailPage from './pages/BookingDetailPage'
import MyToursPage from './pages/MyToursPage'
import ProfilePage from './pages/ProfilePage'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import CreateBlogPage from './pages/CreateBlogPage'
import CreateExperienceBasicInfoPage from './pages/CreateExperienceBasicInfoPage'
import CreateExperienceDetailsPage from './pages/CreateExperienceDetailsPage'
import CreateExperiencePricingPage from './pages/CreateExperiencePricingPage'
import CreateExperienceAvailabilityPage from './pages/CreateExperienceAvailabilityPage'
import CreateExperienceSuccessPage from './pages/CreateExperienceSuccessPage'
import ExperienceDetailsPage from './pages/ExperienceDetailsPage'
import EditExperienceBasicInfoPage from './pages/EditExperienceBasicInfoPage'
import EditExperienceDetailsPage from './pages/EditExperienceDetailsPage'
import EditExperiencePricingPage from './pages/EditExperiencePricingPage'
import EditExperienceAvailabilityPage from './pages/EditExperienceAvailabilityPage'
import CalendarPage from './pages/CalendarPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import SettingsPage from './pages/SettingsPage'
import SearchResultsPage from './pages/SearchResultsPage'
import KycOnboardingPage from './pages/KycOnboardingPage'
import KycVerificationPage from './pages/KycVerificationPage'
import KycSubmittedPage from './pages/KycSubmittedPage'
import SupportPage from './pages/SupportPage'
import CheckoutContactPage from './pages/CheckoutContactPage'
import CheckoutPaymentPage from './pages/CheckoutPaymentPage'
import CheckoutCompletePage from './pages/CheckoutCompletePage'
import WriteReviewPage from './pages/WriteReviewPage'
import SurveyPage from './pages/SurveyPage'
import NotFoundPage from './pages/NotFoundPage'
import ServerErrorPage from './pages/ServerErrorPage'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// AppRoutes component that uses authentication context
function AppRoutes() {
  const { isAuthenticated, isLoading, user, hasSurveyCompleted, isSurveyLoading } = useAuth()
  
  // Global chat notifications for navbar badge updates on all pages
  const { chatNotifications, clearChatNotifications } = useChatNotifications(user?.id || user?.userId)

  // Handle global chat notifications for navbar badge updates
  useEffect(() => {
    if (chatNotifications.length > 0) {
      chatNotifications.forEach(notification => {
        if (notification.type === 'NEW_MESSAGE') {
          // Notify navbar to update unread count
          unreadCountManager.notifyCountChanged();
        }
      });
      
      // Clear processed notifications
      clearChatNotifications();
    }
  }, [chatNotifications, clearChatNotifications]);

  // Show loading spinner while checking authentication
  if (isLoading || isSurveyLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-4 font-poppins">Loading...</p>
        </div>
      </div>
    )
  }

  // Helper function to check if user needs to complete survey
  const requiresSurveyCompletion = (component) => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />
    }
    if (!hasSurveyCompleted) {
      return <Navigate to="/survey" replace />
    }
    return component
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={isAuthenticated ? (hasSurveyCompleted ? <Navigate to="/home" replace /> : <Navigate to="/survey" replace />) : <WelcomePage />}
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

      {/* Email verification routes */}
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
        path="/support"
        element={<SupportPage />}
      />
      <Route
        path="/home"
        element={requiresSurveyCompletion(<HomePage />)}
      />
      <Route
        path="/search"
        element={requiresSurveyCompletion(<SearchResultsPage />)}
      />
      <Route
        path="/notifications"
        element={requiresSurveyCompletion(<NotificationsPage />)}
      />
      <Route
        path="/wishlist"
        element={requiresSurveyCompletion(<WishlistPage />)}
      />
      <Route
        path="/messages"
        element={requiresSurveyCompletion(<MessagesPage />)}
      />
      <Route
        path="/my-bookings"
        element={requiresSurveyCompletion(<MyBookingsPage />)}
      />
      <Route
        path="/booking/:bookingId"
        element={requiresSurveyCompletion(<BookingDetailPage />)}
      />
      <Route
        path="/my-tours"
        element={requiresSurveyCompletion(<MyToursPage />)}
      />
      <Route
        path="/profile/:id"
        element={requiresSurveyCompletion(<ProfilePage />)}
      />
      <Route
        path="/blog"
        element={requiresSurveyCompletion(<BlogPage />)}
      />
      <Route
        path="/blog/:id"
        element={!isAuthenticated ? <Navigate to="/" replace /> : <BlogDetailPage />}
      />
      <Route
        path="/create-blog"
        element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateBlogPage />}
      />
      <Route
        path="/create-blog/basic-info"
        element={!isAuthenticated ? <Navigate to="/" replace /> : <CreateBlogPage />}
      />

      {/*create experience*/}
      <Route
        path="/create-experience"
        element={requiresSurveyCompletion(<Navigate to="/create-experience/basic-info" replace />)}
      />
      <Route
        path="/create-experience/basic-info"
        element={requiresSurveyCompletion(<CreateExperienceBasicInfoPage />)}
      />
      <Route
        path="/create-experience/details"
        element={requiresSurveyCompletion(<CreateExperienceDetailsPage />)}
      />
      <Route
        path="/create-experience/pricing"
        element={requiresSurveyCompletion(<CreateExperiencePricingPage />)}
      />
      <Route
        path="/create-experience/availability"
        element={requiresSurveyCompletion(<CreateExperienceAvailabilityPage />)}
      />
      <Route
        path="/create-experience/success"
        element={requiresSurveyCompletion(<CreateExperienceSuccessPage />)}
      />
      <Route
        path="/experience/:id"
        element={requiresSurveyCompletion(<ExperienceDetailsPage />)}
      />

      {/* Edit Experience Flow */}
      <Route
        path="/edit-experience/:id"
        element={requiresSurveyCompletion(<Navigate to="basic-info" replace />)}
      />
      <Route
        path="/edit-experience/:id/basic-info"
        element={requiresSurveyCompletion(<EditExperienceBasicInfoPage />)}
      />
      <Route
        path="/edit-experience/:id/details"
        element={requiresSurveyCompletion(<EditExperienceDetailsPage />)}
      />
      <Route
        path="/edit-experience/:id/pricing"
        element={requiresSurveyCompletion(<EditExperiencePricingPage />)}
      />
      <Route
        path="/edit-experience/:id/availability"
        element={requiresSurveyCompletion(<EditExperienceAvailabilityPage />)}
      />
      <Route
        path="/calendar"
        element={requiresSurveyCompletion(<CalendarPage />)}
      />
      <Route
        path="/about"
        element={requiresSurveyCompletion(<AboutPage />)}
      />
      <Route
        path="/contact"
        element={requiresSurveyCompletion(<ContactPage />)}
      />
      <Route
        path="/settings"
        element={requiresSurveyCompletion(<SettingsPage />)}
      />
      <Route
        path="/survey"
        element={!isAuthenticated ? <Navigate to="/" replace /> : (hasSurveyCompleted ? <Navigate to="/home" replace /> : <SurveyPage />)}
      />
      <Route
        path="/kyc-onboarding"
        element={requiresSurveyCompletion(<KycOnboardingPage />)}
      />

      <Route
        path="/kyc-verification"
        element={requiresSurveyCompletion(<KycVerificationPage />)}
      />

      <Route
        path="/kyc-submitted"
        element={requiresSurveyCompletion(<KycSubmittedPage />)}
      />

      {/* Checkout Flow */}
      <Route
        path="/checkout/*"
        element={requiresSurveyCompletion(
          <CheckoutProvider>
            <Routes>
              <Route path="contact" element={<CheckoutContactPage />} />
              <Route path="payment" element={<CheckoutPaymentPage />} />
              <Route path="complete" element={<CheckoutCompletePage />} />
            </Routes>
          </CheckoutProvider>
        )}
      />

          {/* Write Review Page */}
          <Route
            path="/write-review/:bookingId"
            element={requiresSurveyCompletion(<WriteReviewPage />)}
          />

      {/* Error Pages */}
      <Route
        path="/404"
        element={<NotFoundPage />}
      />

      <Route
        path="/500"
        element={<ServerErrorPage />}
      />

      {/* Catch all route - redirect to 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <UserProvider>
            <FormDataProvider>
              <TripPointsProvider>
                <ReviewProvider>
                  <Elements stripe={stripePromise}>
                    <div className="App">
                      <AppRoutes />
                    </div>
                  </Elements>
                </ReviewProvider>
              </TripPointsProvider>
            </FormDataProvider>
          </UserProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  )
} 