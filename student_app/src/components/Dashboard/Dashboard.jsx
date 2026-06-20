import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import Profile from '../Profile/Profile'
import Assessment, { AssessmentNavButton } from '../Assessment/Assessment'

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

function Dashboard({ session, triggerToast, theme, toggleTheme }) {
  const [activeTab,   setActiveTab]   = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = session.user

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      triggerToast(error.message, 'error')
    } else {
      triggerToast('Signed out. See you soon!', 'success')
    }
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <div className="dashboard-shell">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">S</div>
          <span className="navbar-name">Student Skill Portal</span>
        </div>

        {/* Desktop tabs */}
        <div className="navbar-tabs">
          <button
            id="tab-home"
            className={`navbar-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => switchTab('home')}
          >
            <HomeIcon /> Home
          </button>
          <button
            id="tab-profile"
            className={`navbar-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => switchTab('profile')}
          >
            <UserIcon /> My Profile
          </button>
          <AssessmentNavButton activeTab={activeTab} onSelectTab={switchTab} userEmail={user.email} />
        </div>

        <div className="navbar-right">
          <span className="navbar-user-email">{user.email}</span>

          {/* Theme toggle */}
          <button
            id="theme-toggle"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Sign out — desktop */}
          <button id="logout-btn" className="btn btn-ghost btn-sm desktop-only" onClick={handleLogout}>
            <LogoutIcon /> Sign Out
          </button>

          {/* Hamburger — mobile */}
          <button
            id="mobile-menu-btn"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button className={`mobile-menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => switchTab('home')}>
            <HomeIcon /> Home
          </button>
          <button className={`mobile-menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => switchTab('profile')}>
            <UserIcon /> My Profile
          </button>
          
          <div className="mobile-menu-label" style={{ padding: '8px 16px 4px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessments</div>
          <button className={`mobile-menu-item ${activeTab === 'aptitude' ? 'active' : ''}`} onClick={() => switchTab('aptitude')}>
            🧠 Aptitude Tests
          </button>
          <button className={`mobile-menu-item ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => switchTab('technical')}>
            💻 Technical Skill Tests
          </button>
          <button className={`mobile-menu-item ${activeTab === 'communication' ? 'active' : ''}`} onClick={() => switchTab('communication')}>
            🗣️ Communication Assessment
          </button>
          <button className={`mobile-menu-item ${activeTab === 'personality' ? 'active' : ''}`} onClick={() => switchTab('personality')}>
            🌟 Personality Assessment
          </button>
          <button className={`mobile-menu-item ${activeTab === 'scores' ? 'active' : ''}`} onClick={() => switchTab('scores')}>
            📊 Score Reports
          </button>

          <hr className="mobile-menu-divider" />
          <button className="mobile-menu-item danger" onClick={handleLogout}>
            <LogoutIcon /> Sign Out
          </button>
        </div>
      )}

      {/* Page content */}
      <div className="dashboard-page">
        {activeTab === 'home' && (
          <div>
            <div className="dashboard-welcome">
              <h2>Hello, {user.email.split('@')[0]} 👋</h2>
              <p>
                Welcome to your Student Skill Portal dashboard. Track your academic profile,
                career interests, and manage your resume — all in one place.
              </p>
              <button
                id="view-profile-btn"
                className="btn btn-primary"
                onClick={() => switchTab('profile')}
              >
                View My Profile →
              </button>
            </div>

            <div className="dashboard-cards">
              <div className="info-card">
                <div className="info-card-icon">🔐</div>
                <h4>Auth Status</h4>
                <p><span className="status-live">Session Active</span></p>
              </div>
              <div className="info-card">
                <div className="info-card-icon">🆔</div>
                <h4>User ID</h4>
                <p style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--text-2)' }}>{user.id}</p>
              </div>
              <div className="info-card">
                <div className="info-card-icon">📋</div>
                <h4>Profile</h4>
                <p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => switchTab('profile')}
                    style={{ marginTop: 8 }}
                  >
                    Open Profile
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <Profile user={user} triggerToast={triggerToast} />
        )}

        {['aptitude', 'technical', 'communication', 'personality', 'scores'].includes(activeTab) && (
          <Assessment userId={user.id} triggerToast={triggerToast} activeTab={activeTab} userEmail={user.email} />
        )}
      </div>
    </div>
  )
}

export default Dashboard
