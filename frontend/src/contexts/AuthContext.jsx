import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

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

  // Check if user is authenticated on app startup
  useEffect(() => {
    checkAuthStatus()
  }, [])

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
            // Token is valid, set authenticated state
            setToken(storedToken)
            setIsAuthenticated(true)
            
            // Try to get user data from localStorage
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser)
                setUser(user)
              } catch (error) {
                console.error('Error parsing stored user data:', error)
                // Clear invalid user data
                localStorage.removeItem('user')
              }
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
      setIsLoading(true)
      
      // Call backend API
      const response = await authService.login(email, password)
      
      if (response.success) {
        const { token, username, email: userEmail, roles } = response.data
        
        // Store token in localStorage
        localStorage.setItem('token', token)
        
        // Create user object from backend response
        const user = {
          firstName: username.split(' ')[0] || '',
          lastName: username.split(' ').slice(1).join(' ') || '',
          email: userEmail,
          roles: roles
        }
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user))
        
        // Update state
        setToken(token)
        setUser(user)
        setIsAuthenticated(true)
        
        // Navigate to home page
        navigate('/home')
        
        return { success: true }
      } else {
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
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true)
      
      // Call backend API
      const response = await authService.register(userData)
      
      if (response.success) {
        const { token, username, email, roles } = response.data
        
        // Store token in localStorage
        localStorage.setItem('token', token)
        
        // Create user object from backend response
        const user = {
          firstName: username.split(' ')[0] || '',
          lastName: username.split(' ').slice(1).join(' ') || '',
          email: email,
          roles: roles
        }
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user))
        
        // Update state
        setToken(token)
        setUser(user)
        setIsAuthenticated(true)
        
        // Navigate to home page
        navigate('/home')
        
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
    } finally {
      setIsLoading(false)
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
    
    // Functions
    login,
    register,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
