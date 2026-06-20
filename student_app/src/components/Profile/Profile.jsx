import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function Profile({ user, triggerToast }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!user?.id) return
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)

    const { data, error: dbErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbErr || !data) {
      const local = localStorage.getItem(`profile_${user.id}`)
      if (local) {
        setProfile(JSON.parse(local))
      } else {
        setError('Profile not found. Please complete registration first.')
      }
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  const fmt = (val) => val || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Not provided</span>

  if (loading) {
    return (
      <div className="profile-skeleton">
        <div className="spinner" />
        <p>Loading profile…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-skeleton">
        <p style={{ color: 'var(--rose-400)' }}>{error}</p>
      </div>
    )
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="profile-page">
      <h2 className="profile-page-title">My Profile</h2>

      <div className="profile-grid">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">{profile?.full_name || 'N/A'}</div>
          <div className="profile-email-chip">{profile?.email || user.email}</div>
          <div className="profile-stat-row">
            <div className="profile-stat-item">
              <span className="stat-key">Gender</span>
              <span className="stat-val">{profile?.gender || '—'}</span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-key">DOB</span>
              <span className="stat-val">
                {profile?.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-key">Mobile</span>
              <span className="stat-val">{profile?.mobile_number || '—'}</span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-key">Location</span>
              <span className="stat-val">
                {profile?.city ? `${profile.city}, ${profile.state || ''}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Sections */}
        <div className="profile-sections">
          <div className="profile-section">
            <div className="profile-section-title">Contact Information</div>
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{fmt(profile?.full_name)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{fmt(profile?.email)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Mobile</span>
                <span className="detail-value">{fmt(profile?.mobile_number)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-value">
                  {profile?.date_of_birth
                    ? new Date(profile.date_of_birth).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                    : fmt(null)}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Gender</span>
                <span className="detail-value">{fmt(profile?.gender)}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Education</div>
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="detail-label">Level</span>
                <span className="detail-value">{fmt(profile?.education_level)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Institution</span>
                <span className="detail-value">{fmt(profile?.school_college_name)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Current Year / Class</span>
                <span className="detail-value">{fmt(profile?.current_year_class)}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Location</div>
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="detail-label">State</span>
                <span className="detail-value">{fmt(profile?.state)}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">City</span>
                <span className="detail-value">{fmt(profile?.city)}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Career Interests</div>
            {profile?.career_interests?.length > 0 ? (
              <div className="interests-display">
                {profile.career_interests.map(i => (
                  <span key={i} className="interest-tag">{i}</span>
                ))}
              </div>
            ) : (
              <span className="resume-none">No interests saved.</span>
            )}
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Resume</div>
            {profile?.resume_url ? (
              <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="resume-link">
                📄 View / Download Resume
              </a>
            ) : (
              <span className="resume-none">No resume uploaded.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
