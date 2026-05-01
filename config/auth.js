/**
 * Authentication Provider Configuration
 * 
 * Extensible configuration for identity providers (IDPs).
 * Add new providers by extending the providers object.
 */

export const authConfig = {
  // Default provider (used when no specific provider is specified)
  defaultProvider: 'google',
  
  // Available authentication providers
  providers: {
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      enabled: true,
      scopes: ['profile', 'email'],
      customParameters: {},
      buttonConfig: {
        text: 'Continue with Google',
        iconUrl: 'https://developers.google.com/identity/images/g-logo.png',
        backgroundColor: '#4285f4',
        textColor: '#ffffff',
        hoverBackgroundColor: '#3367d6'
      }
    },
    
    // Template for future providers
    facebook: {
      id: 'facebook',
      name: 'Facebook',
      type: 'oauth',
      enabled: false, // Set to true when implementing
      scopes: ['email', 'public_profile'],
      customParameters: {},
      buttonConfig: {
        text: 'Continue with Facebook',
        iconUrl: null, // Add Facebook icon URL when implementing
        backgroundColor: '#1877f2',
        textColor: '#ffffff',
        hoverBackgroundColor: '#166fe5'
      }
    },
    
    github: {
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      enabled: false, // Set to true when implementing
      scopes: ['user:email'],
      customParameters: {},
      buttonConfig: {
        text: 'Continue with GitHub',
        iconUrl: null, // Add GitHub icon URL when implementing
        backgroundColor: '#24292e',
        textColor: '#ffffff',
        hoverBackgroundColor: '#1c2023'
      }
    },
    
    microsoft: {
      id: 'microsoft',
      name: 'Microsoft',
      type: 'oauth',
      enabled: false, // Set to true when implementing
      scopes: ['openid', 'profile', 'email'],
      customParameters: {},
      buttonConfig: {
        text: 'Continue with Microsoft',
        iconUrl: null, // Add Microsoft icon URL when implementing
        backgroundColor: '#0078d4',
        textColor: '#ffffff',
        hoverBackgroundColor: '#106ebe'
      }
    }
  },
  
  // UI Configuration
  ui: {
    showProviderIcons: true,
    allowMultipleProviders: false, // Set to true to show multiple login options
    redirectOnSuccess: '/dashboard',
    redirectOnFailure: '/',
    showLoadingSpinner: true
  },
  
  // Session Configuration
  session: {
    persistAuth: true,
    sessionTimeout: null, // null = no timeout, number = minutes
    rememberUser: true
  }
}

/**
 * Get configuration for a specific provider
 * @param {string} providerId - The provider ID (e.g., 'google', 'facebook')
 * @returns {object|null} Provider configuration or null if not found
 */
export const getProviderConfig = (providerId) => {
  return authConfig.providers[providerId] || null
}

/**
 * Get all enabled providers
 * @returns {array} Array of enabled provider configurations
 */
export const getEnabledProviders = () => {
  return Object.values(authConfig.providers).filter(provider => provider.enabled)
}

/**
 * Check if a provider is enabled
 * @param {string} providerId - The provider ID
 * @returns {boolean} True if enabled, false otherwise
 */
export const isProviderEnabled = (providerId) => {
  const provider = getProviderConfig(providerId)
  return provider ? provider.enabled : false
}