import { useState } from 'react'
import { supabase } from '../../supabaseClient'

function Login({ onSwitch, triggerToast }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      triggerToast('Please enter your email and password.', 'error')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        triggerToast('Please confirm your email first, or ask admin to disable email confirmation.', 'error')
      } else {
        triggerToast(error.message, 'error')
      }
    } else {
      triggerToast('Welcome back! Redirecting…', 'success')
    }
    setLoading(false)
  }

  return (
    <div className="auth-card">
      <h2 className="auth-card-title">Sign In</h2>
      <p className="auth-card-subtitle">
        Enter your credentials to access your dashboard.
      </p>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            id="login-email"
            className="form-input"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            id="login-password"
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          id="login-submit"
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? 'Signing In…' : 'Sign In →'}
        </button>
      </form>

      <p className="auth-switch-text">
        Don't have an account?
        <button id="go-register" onClick={onSwitch}>Create one</button>
      </p>
    </div>
  )
}

export default Login
