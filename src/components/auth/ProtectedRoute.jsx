import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

/**
 * ProtectedRoute component that redirects unauthenticated users to the landing page
 * 
 * @param {React.ReactNode} children - The components to render if authenticated
 * @param {string} redirectTo - Where to redirect if not authenticated (default: '/')
 * @param {React.ReactNode} fallback - Loading component while checking auth state
 */
const ProtectedRoute = ({ 
  children, 
  redirectTo = '/', 
  fallback = <ProtectedRouteLoading /> 
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (loading) {
    return fallback
  }

  // Redirect to login if not authenticated
  // Preserve the intended destination in state so we can redirect back after login
  if (!user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Render protected content
  return children
}

/**
 * Default loading component for protected routes
 */
const ProtectedRouteLoading = () => (
  <div className="protected-route-loading">
    <div className="protected-route-loading__spinner"></div>
    <p className="protected-route-loading__text">Loading...</p>
    
    <style jsx>{`
      .protected-route-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: 16px;
      }

      .protected-route-loading__spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #4285f4;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .protected-route-loading__text {
        margin: 0;
        color: #666;
        font-size: 14px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

export default ProtectedRoute