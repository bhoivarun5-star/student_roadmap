import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login    from './components/Auth/Login'
import Register from './components/Auth/Register'
import Dashboard from './components/Dashboard/Dashboard'
import AdminPanel from './components/AdminPanel/AdminPanel'
import './App.css'

function App() {
  const [session,  setSession]  = useState(undefined)
  const [authView, setAuthView] = useState('login')
  const [toast,    setToast]    = useState(null)
  const [theme,    setTheme]    = useState(() => localStorage.getItem('ssp-theme') || 'dark')
  
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname
    const hash = window.location.hash
    if (path.includes('admin-panel') || hash.includes('admin-panel')) {
      return 'admin-panel'
    }
    return 'portal'
  })

  /* ---- Apply theme to <html> ---- */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ssp-theme', theme)
  }, [theme])

  /* ---- Routing location sync ---- */
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname
      const hash = window.location.hash
      if (path.includes('admin-panel') || hash.includes('admin-panel')) {
        setCurrentRoute('admin-panel')
      } else {
        setCurrentRoute('portal')
      }
    }
    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    // Run initial check
    handleLocationChange()
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  /* ---- Auth listener ---- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  /* ---- Toast helper ---- */
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  /* ---- Admin Panel Bypass ---- */
  if (currentRoute === 'admin-panel') {
    return (
      <div className="app">
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-dot" />
            {toast.message}
          </div>
        )}
        <AdminPanel 
          onExit={() => {
            window.history.pushState({}, '', '/')
            setCurrentRoute('portal')
          }} 
          triggerToast={triggerToast} 
        />
      </div>
    )
  }

  /* ---- Loading splash ---- */
  if (session === undefined) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading portal…</p>
      </div>
    )
  }

  /* ---- Authenticated → Dashboard ---- */
  if (session) {
    return (
      <div className="app">
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-dot" />
            {toast.message}
          </div>
        )}
        <Dashboard session={session} triggerToast={triggerToast} theme={theme} toggleTheme={toggleTheme} />
      </div>
    )
  }

  /* ---- Unauthenticated → Auth page ---- */
  return (
    <div className="app">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-dot" />
          {toast.message}
        </div>
      )}

      <div className="auth-layout">
        {/* Left branding panel */}
        <div className="auth-panel">
          <div className="auth-brand">
            <div className="auth-brand-logo">S</div>
            <h1>Student Skill Portal</h1>
            <p>
              Your gateway to documenting skills, academic background, and career goals —
              built for the modern student.
            </p>
            <div className="auth-features">
              <div className="auth-feature-item"><span className="dot" /> Secure user authentication</div>
              <div className="auth-feature-item"><span className="dot" /> 5-step guided registration</div>
              <div className="auth-feature-item"><span className="dot" /> Comprehensive profile dashboard</div>
              <div className="auth-feature-item"><span className="dot" /> Resume storage &amp; tracking</div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          {/* Theme toggle on auth page */}
          <button
            id="auth-theme-toggle"
            className="theme-toggle-fab"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {authView === 'login' ? (
            <Login onSwitch={() => setAuthView('register')} triggerToast={triggerToast} />
          ) : (
            <Register onSwitch={() => setAuthView('login')} triggerToast={triggerToast} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
