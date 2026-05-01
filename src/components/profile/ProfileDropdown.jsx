import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import './ProfileDropdown.css'

const ProfileDropdown = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  if (!user) {
    return null
  }

  // Get user's initials as fallback for avatar
  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-dropdown__trigger"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="profile-dropdown__avatar">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={`${user.displayName || user.email}'s avatar`}
              className="profile-dropdown__avatar-image"
              onError={(e) => {
                // Hide broken image and show initials fallback
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className="profile-dropdown__avatar-fallback"
            style={{ display: user.photoURL ? 'none' : 'flex' }}
          >
            {getInitials(user.displayName || user.email)}
          </div>
        </div>
        <div className="profile-dropdown__info">
          <span className="profile-dropdown__name">
            {user.displayName || user.email?.split('@')[0] || 'User'}
          </span>
          <svg 
            className={`profile-dropdown__arrow ${isOpen ? 'profile-dropdown__arrow--open' : ''}`}
            width="12" 
            height="12" 
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M3 4.5L6 7.5L9 4.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown__menu">
          <div className="profile-dropdown__header">
            <div className="profile-dropdown__user-info">
              <strong className="profile-dropdown__user-name">
                {user.displayName || 'User'}
              </strong>
              <span className="profile-dropdown__user-email">
                {user.email}
              </span>
            </div>
          </div>
          
          <div className="profile-dropdown__divider"></div>
          
          <div className="profile-dropdown__actions">
            <button
              className="profile-dropdown__action"
              onClick={handleLogout}
            >
              <svg 
                className="profile-dropdown__action-icon"
                width="16" 
                height="16" 
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M10.6667 11.3333L14 8L10.6667 4.66667" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M14 8H6" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown