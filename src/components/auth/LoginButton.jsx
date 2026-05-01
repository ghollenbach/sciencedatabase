import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getProviderConfig } from '../../../config/auth.js'
import './LoginButton.css'

const LoginButton = ({ providerId = 'google', variant = 'primary' }) => {
  const { login, loading, error } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  
  const providerConfig = getProviderConfig(providerId)
  
  if (!providerConfig || !providerConfig.enabled) {
    return null
  }

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      await login(providerId)
      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  const { buttonConfig } = providerConfig
  const isButtonLoading = loading || isLoading

  return (
    <div className="login-button-container">
      <button
        className={`login-button login-button--${variant} login-button--${providerId}`}
        onClick={handleLogin}
        disabled={isButtonLoading}
        style={{
          backgroundColor: buttonConfig.backgroundColor,
          color: buttonConfig.textColor,
        }}
      >
        {isButtonLoading ? (
          <div className="login-button__loading">
            <div className="login-button__spinner"></div>
            <span>Signing in...</span>
          </div>
        ) : (
          <div className="login-button__content">
            {buttonConfig.iconUrl && (
              <img 
                src={buttonConfig.iconUrl} 
                alt={`${providerConfig.name} icon`}
                className="login-button__icon"
              />
            )}
            <span className="login-button__text">{buttonConfig.text}</span>
          </div>
        )}
      </button>
      
      {error && (
        <div className="login-button__error">
          <span className="login-button__error-text">{error}</span>
        </div>
      )}
    </div>
  )
}

export default LoginButton