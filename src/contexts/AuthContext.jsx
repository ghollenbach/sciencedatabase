import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '../firebase.js'
import { authConfig, getProviderConfig } from '../../config/auth.js'

// Create the AuthContext
const AuthContext = createContext({})

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Transform Firebase user to our user format
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          providerId: firebaseUser.providerData[0]?.providerId || 'unknown',
          emailVerified: firebaseUser.emailVerified
        }
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  // Login function - supports different providers
  const login = async (providerId = authConfig.defaultProvider) => {
    try {
      setLoading(true)
      setError(null)

      const providerConfig = getProviderConfig(providerId)
      if (!providerConfig || !providerConfig.enabled) {
        throw new Error(`Provider ${providerId} is not enabled or configured`)
      }

      let provider
      switch (providerId) {
        case 'google':
          provider = new GoogleAuthProvider()
          // Add scopes
          providerConfig.scopes?.forEach(scope => provider.addScope(scope))
          // Add custom parameters
          if (providerConfig.customParameters) {
            provider.setCustomParameters(providerConfig.customParameters)
          }
          break
        
        // Add cases for other providers here when implemented
        case 'facebook':
          throw new Error('Facebook provider not yet implemented')
        case 'github':
          throw new Error('GitHub provider not yet implemented')
        case 'microsoft':
          throw new Error('Microsoft provider not yet implemented')
        
        default:
          throw new Error(`Unsupported provider: ${providerId}`)
      }

      const result = await signInWithPopup(auth, provider)
      
      // Optional: Store additional provider-specific data
      if (result.credential) {
        // You can access provider-specific tokens here if needed
        // const accessToken = GoogleAuthProvider.credentialFromResult(result).accessToken
      }

      return result.user
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setLoading(true)
      setError(null)
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Clear error function
  const clearError = () => {
    setError(null)
  }

  // Value provided to consumers
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
    isLoading: loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Additional custom hooks for specific use cases
export const useAuthUser = () => {
  const { user } = useAuth()
  return user
}

export const useAuthState = () => {
  const { user, loading, isAuthenticated } = useAuth()
  return { user, loading, isAuthenticated }
}

export const useAuthActions = () => {
  const { login, logout, clearError } = useAuth()
  return { login, logout, clearError }
}