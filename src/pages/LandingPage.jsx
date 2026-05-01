import React from 'react'
import LoginButton from '../components/auth/LoginButton.jsx'
import './LandingPage.css'

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <header className="landing-header">
          <h1 className="landing-title">Science Department Inventory</h1>
          <p className="landing-subtitle">
            Manage your science department's inventory efficiently and securely
          </p>
        </header>

        <main className="landing-main">
          <div className="landing-content">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6"/>
                  </svg>
                </div>
                <h3>Inventory Tracking</h3>
                <p>Keep track of all your science equipment, chemicals, and supplies in real-time</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6M23 11h-6"/>
                  </svg>
                </div>
                <h3>Collaborative</h3>
                <p>Multiple teachers can request, order, and manage items together seamlessly</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <h3>Smart Reports</h3>
                <p>Generate detailed reports and export data for budget planning and audits</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3>Secure Access</h3>
                <p>Secure authentication ensures only authorized personnel can access inventory data</p>
              </div>
            </div>

            <div className="login-section">
              <h2>Ready to get started?</h2>
              <p>Sign in with your Google account to access the inventory system</p>
              <LoginButton providerId="google" variant="primary" />
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <p>&copy; 2026 Science Department Inventory System</p>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage