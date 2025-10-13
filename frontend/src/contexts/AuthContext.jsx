import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { userSurveyService } from '../services/userSurveyService'

// Create the AuthContext
const AuthContext = createContext()

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider component
export const AuthProvider = ({ children }) => { 
  const navigate = useNavigate()
  
  // Authentication state
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [hasSurveyCompleted, setHasSurveyCompleted] = useState(false)
  const [isSurveyLoading, setIsSurveyLoading] = useState(false)

  // Check if user is authenticated on app startup
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Check survey completion status
  const checkSurveyCompletion = async (userId) => {
    if (!userId) return false
    
    try {
      setIsSurveyLoading(true)
      const surveyResponse = await userSurveyService.checkUserSurveyExists(userId)
      const completed = surveyResponse.success && surveyResponse.data.exists
      setHasSurveyCompleted(completed)
      return completed
    } catch (error) {
      console.error('Error checking survey completion:', error)
      setHasSurveyCompleted(false)
      return false
    } finally {
      setIsSurveyLoading(false)
    }
  }

  // Check authentication status
  const checkAuthStatus = async () => {
    try { 
      setIsLoading(true)
      const storedToken = localStorage.getItem('token')
      
      if (storedToken) {
        // For now, just check if token exists and is not expired
        // TODO: Implement proper token validation with backend
        try {
          // Simple JWT token validation (check if it's not expired)
          const payload = JSON.parse(atob(storedToken.split('.')[1]))
          const currentTime = Date.now() / 1000
          
          if (payload.exp && payload.exp > currentTime) {
            // Token is valid, check if user email is verified
            setToken(storedToken)
            
            // Try to get user data from localStorage
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser)
                setUser(user)
                
                // Only set authenticated if email is verified
                if (user.emailVerified) {
                  setIsAuthenticated(true)
                  // Check survey completion for authenticated user
                  await checkSurveyCompletion(user.id)
                } else {
                  setIsAuthenticated(false)
                }
              } catch (error) {
                console.error('Error parsing stored user data:', error)
                // Clear invalid user data
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                setIsAuthenticated(false)
                setUser(null)
                setToken(null)
              }
            } else {
              // No user data, not authenticated
              setIsAuthenticated(false)
              setUser(null)
            }
          } else {
            // Token is expired, clear everything
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setIsAuthenticated(false)
            setUser(null)
            setToken(null)
          }
        } catch (tokenError) { 
          // Token is malformed, clear everything
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
          setUser(null)
          setToken(null)
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
        setToken(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      // If there's an error, clear everything
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsAuthenticated(false)
      setUser(null)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      // Call backend API
      const response = await authService.login(email, password)
      
      // Check for account suspension error
      if (!response.success && response.errorType === 'ACCOUNT_SUSPENDED') {
        // Return suspension error for UI to handle
        return { success: false, error: response.error, errorType: 'ACCOUNT_SUSPENDED' }
      }
      
      // If login is successful, extract the data and check if email is verified
      if (response.success) {
        // Destructure the response data
        const { token, username, email: userEmail, roles, emailVerified, userId } = response.data
        
        // Store token in localStorage
        localStorage.setItem('token', token)
        
        // Fetch complete user data including canCreateExperiences and kycStatus
        try {
          const userResponse = await userService.getUserById(userId)
          
          if (userResponse.success) {
            // Create user object with complete data from backend
            const user = {
              id: userId,
              firstName: userResponse.data.firstName || username.split(' ')[0] || '',
              lastName: userResponse.data.lastName || username.split(' ').slice(1).join(' ') || '',
              email: userEmail,
              roles: roles,
              emailVerified: emailVerified,
              canCreateExperiences: userResponse.data.canCreateExperiences || false,
              kycStatus: userResponse.data.kycStatus || 'PENDING'
            }
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(user))
            
            // Update state
            setToken(token)
            setUser(user)
            
            // Only set authenticated if email is verified
            if (user.emailVerified) {
              setIsAuthenticated(true)
              
              // Check if user has completed survey before redirecting
              const surveyCompleted = await checkSurveyCompletion(userId)
              if (surveyCompleted) {
                // User has completed survey, go to home
                navigate('/home')
              } else {
                // User hasn't completed survey, go to survey page
                navigate('/survey')
              }
            } else {
              setIsAuthenticated(false)
              navigate('/email-verification')
            }
          } else {
            // If fetching complete user data fails, fall back to basic user data
            console.warn('Failed to fetch complete user data, using basic data')
            const user = {
              id: userId,
              firstName: username.split(' ')[0] || '',
              lastName: username.split(' ').slice(1).join(' ') || '',
              email: userEmail,
              roles: roles,
              emailVerified: emailVerified,
              canCreateExperiences: false, // Default to false if we can't fetch
              kycStatus: 'PENDING' // Default to pending if we can't fetch
            }
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(user))
            
            // Update state
            setToken(token)
            setUser(user)
            
            // Only set authenticated if email is verified
            if (user.emailVerified) {
              setIsAuthenticated(true)
              
              // Check if user has completed survey before redirecting
              try {
                const surveyResponse = await userSurveyService.checkUserSurveyExists(userId)
                if (surveyResponse.success && surveyResponse.data.exists) {
                  // User has completed survey, go to home
                  navigate('/home')
                } else {
                  // User hasn't completed survey, go to survey page
                  navigate('/survey')
                }
              } catch (surveyError) {
                console.error('Error checking user survey:', surveyError)
                // If survey check fails, default to home page
                navigate('/home')
              }
            } else {
              setIsAuthenticated(false)
              navigate('/email-verification')
            }
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError)
          // Fall back to basic user data if userService fails
          const user = {
            id: userId,
            firstName: username.split(' ')[0] || '',
            lastName: username.split(' ').slice(1).join(' ') || '',
            email: userEmail,
            roles: roles,
            emailVerified: emailVerified,
            canCreateExperiences: false, // Default to false if we can't fetch
            kycStatus: 'PENDING' // Default to pending if we can't fetch
          }
          
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(user))
          
          // Update state
          setToken(token)
          setUser(user)
          
          // Only set authenticated if email is verified
          if (user.emailVerified) {
            setIsAuthenticated(true)
            
            // Check if user has completed survey before redirecting
            const surveyCompleted = await checkSurveyCompletion(userId)
            if (surveyCompleted) {
              // User has completed survey, go to home
              navigate('/home')
            } else {
              // User hasn't completed survey, go to survey page
              navigate('/survey')
            }
          } else {
            setIsAuthenticated(false)
            navigate('/email-verification')
          }
        }
        
        return { success: true }
      } else {
        // Return error from authService
        return { 
          success: false, 
          error: response.error 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      // Call backend API
      const response = await authService.register(userData)
      
      if (response.success) {
        // No token or user data to store - just navigate to verification page
        // Pass email through navigation state for the verification page
        navigate('/email-verification', { 
          state: { 
            email: response.data.email,
            message: response.data.message 
          }
        })
        
        return { success: true }
      } else {
        return { 
          success: false, 
          error: response.error 
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Call backend logout endpoint
      await authService.logout()
      
      // Clear token and user data from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear state
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      setHasSurveyCompleted(false)
      setIsSurveyLoading(false)
      
      // Navigate to welcome page
      navigate('/')
      
    } catch (error) {
      console.error('Logout error:', error)
      // Even if backend logout fails, clear local data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      navigate('/')
    }
  }

  // Context value
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    token,
    hasSurveyCompleted,
    isSurveyLoading,
    
    // Functions
    login,
    register,
    logout,
    checkAuthStatus,
    checkSurveyCompletion
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
