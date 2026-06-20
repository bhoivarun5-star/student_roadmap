import { useState } from 'react'
import { supabase } from '../../supabaseClient'

/* ---- Constants ---- */
const STEPS = [
  { label: 'Basic' },
  { label: 'Education' },
  { label: 'Location' },
  { label: 'Career' },
  { label: 'Resume' },
]

const EDUCATION_LEVELS = [
  'School Student',
  '12th Pass',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
]

const CAREER_OPTIONS = [
  'Web Development',
  'Mobile App Development',
  'Data Science',
  'UI/UX Design',
  'Digital Marketing',
  'Cyber Security',
  'AI/ML',
  'Government Jobs',
  'Other',
]

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* Helper: friendly error messages */
const friendlyError = (msg) => {
  const m = msg?.toLowerCase() || ''
  if (m.includes('rate limit') || m.includes('email rate'))
    return '⚠️ Email rate limit reached. Please wait a few minutes, or use a different email address.'
  if (m.includes('already registered') || m.includes('user already'))
    return 'This email is already registered. Try signing in instead.'
  if (m.includes('invalid email'))
    return 'Please enter a valid email address.'
  if (m.includes('weak password') || m.includes('password should'))
    return 'Password is too weak. Use at least 6 characters.'
  return msg
}

/* ============================================================
   Register Component
   ============================================================ */
function Register({ onSwitch, triggerToast }) {
  const [step, setStep]           = useState(1)
  const [direction, setDirection] = useState('forward')
  const [loading, setLoading]     = useState(false)

  /* Page 1 */
  const [fullName,    setFullName]    = useState('')
  const [email,       setEmail]       = useState('')
  const [mobile,      setMobile]      = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [dob,         setDob]         = useState('')
  const [gender,      setGender]      = useState('')

  /* Page 2 */
  const [eduLevel,    setEduLevel]    = useState('')
  const [institution, setInstitution] = useState('')
  const [yearClass,   setYearClass]   = useState('')

  /* Page 3 */
  const [stateVal,    setStateVal]    = useState('')
  const [city,        setCity]        = useState('')

  /* Page 4 */
  const [interests,   setInterests]   = useState([])

  /* Page 5 */
  const [resumeFile,  setResumeFile]  = useState(null)

  /* ---- Validation per step ---- */
  const validate = () => {
    if (step === 1) {
      if (!fullName.trim())  { triggerToast('Full name is required.', 'error'); return false }
      if (!email.trim())     { triggerToast('Email address is required.', 'error'); return false }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { triggerToast('Enter a valid email.', 'error'); return false }
      if (!mobile.trim())    { triggerToast('Mobile number is required.', 'error'); return false }
      if (!password)         { triggerToast('Password is required.', 'error'); return false }
      if (password.length < 6) { triggerToast('Password must be at least 6 characters.', 'error'); return false }
      if (password !== confirmPwd) { triggerToast('Passwords do not match.', 'error'); return false }
      if (!dob)              { triggerToast('Date of birth is required.', 'error'); return false }
      if (!gender)           { triggerToast('Please select a gender.', 'error'); return false }
    }
    if (step === 2) {
      if (!eduLevel)          { triggerToast('Please select your education level.', 'error'); return false }
      if (!institution.trim()) { triggerToast('School/College name is required.', 'error'); return false }
      if (!yearClass.trim())  { triggerToast('Current year/class is required.', 'error'); return false }
    }
    if (step === 3) {
      if (!stateVal.trim())  { triggerToast('State is required.', 'error'); return false }
      if (!city.trim())      { triggerToast('City is required.', 'error'); return false }
    }
    if (step === 4) {
      if (interests.length === 0) { triggerToast('Select at least one career interest.', 'error'); return false }
    }
    return true
  }

  const goNext = () => {
    if (!validate()) return
    setDirection('forward')
    setStep(s => s + 1)
  }
  const goBack = () => {
    setDirection('back')
    setStep(s => s - 1)
  }

  const toggleInterest = (item) => {
    setInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  /* ---- Final Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      /* 1. Sign up — emailRedirectTo is set to suppress the confirmation email flow */
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          // Do NOT send confirmation email — works when "Confirm email" is OFF in Supabase dashboard
          emailRedirectTo: undefined,
        },
      })

      if (authErr) throw new Error(friendlyError(authErr.message))

      const userId = authData?.user?.id
      if (!userId) throw new Error('Registration succeeded but user ID is missing. Please try again.')

      /* 2. Upload resume (optional) */
      let resumeUrl = ''
      if (resumeFile) {
        const ext      = resumeFile.name.split('.').pop()
        const filePath = `${userId}/resume.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile, { upsert: true })
        if (!uploadErr) {
          const { data: pubData } = supabase.storage.from('resumes').getPublicUrl(filePath)
          resumeUrl = pubData?.publicUrl || ''
        } else {
          console.warn('Resume upload failed (storage bucket may not exist):', uploadErr.message)
        }
      }

      /* 3. Save profile to `profiles` table */
      const profilePayload = {
        id:                  userId,
        full_name:           fullName.trim(),
        email:               email.trim(),
        mobile_number:       mobile.trim(),
        date_of_birth:       dob,
        gender,
        education_level:     eduLevel,
        school_college_name: institution.trim(),
        current_year_class:  yearClass.trim(),
        state:               stateVal.trim(),
        city:                city.trim(),
        career_interests:    interests,
        resume_url:          resumeUrl,
      }

      const { error: dbErr } = await supabase.from('profiles').upsert([profilePayload])
      if (dbErr) {
        console.warn('DB upsert warning:', dbErr.message)
        localStorage.setItem(`profile_${userId}`, JSON.stringify(profilePayload))
      }

      triggerToast('Account created! Welcome aboard 🎉', 'success')

    } catch (err) {
      triggerToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ---- Render step content ---- */
  const stepClass = `step-container ${direction === 'back' ? 'going-back' : ''}`

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div key="step1" className={stepClass}>
            <div className="step-header">
              <div className="step-title">Basic Information</div>
              <div className="step-subtitle">Tell us who you are.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="reg-name" className="form-input" type="text" placeholder="Alex Rivera"
                value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input id="reg-email" className="form-input" type="email" placeholder="alex@university.edu"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input id="reg-mobile" className="form-input" type="tel" placeholder="+91 98765 43210"
                value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input id="reg-password" className="form-input" type="password" placeholder="Min 6 chars"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input id="reg-confirm" className="form-input" type="password" placeholder="Repeat password"
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input id="reg-dob" className="form-input" type="date"
                  value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select id="reg-gender" className="form-select"
                  value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div key="step2" className={stepClass}>
            <div className="step-header">
              <div className="step-title">Education Details</div>
              <div className="step-subtitle">Your current academic background.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Current Education Level</label>
              <select id="reg-edu" className="form-select"
                value={eduLevel} onChange={e => setEduLevel(e.target.value)}>
                <option value="">Select level…</option>
                {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">School / College Name</label>
              <input id="reg-institution" className="form-input" type="text"
                placeholder="e.g. NIT Surat"
                value={institution} onChange={e => setInstitution(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Year / Class</label>
              <input id="reg-year" className="form-input" type="text"
                placeholder="e.g. 3rd Year / Class 11"
                value={yearClass} onChange={e => setYearClass(e.target.value)} />
            </div>
          </div>
        )

      case 3:
        return (
          <div key="step3" className={stepClass}>
            <div className="step-header">
              <div className="step-title">Location</div>
              <div className="step-subtitle">Where are you based?</div>
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input id="reg-state" className="form-input" type="text"
                placeholder="e.g. Gujarat"
                value={stateVal} onChange={e => setStateVal(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input id="reg-city" className="form-input" type="text"
                placeholder="e.g. Surat"
                value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>
        )

      case 4:
        return (
          <div key="step4" className={stepClass}>
            <div className="step-header">
              <div className="step-title">Career Interests</div>
              <div className="step-subtitle">Select all that apply. ({interests.length} selected)</div>
            </div>
            <div className="interests-grid">
              {CAREER_OPTIONS.map(opt => (
                <label
                  key={opt}
                  id={`interest-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`interest-chip ${interests.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(opt)}
                >
                  <span className="interest-chip-check">
                    {interests.includes(opt) && <CheckIcon />}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div key="step5" className={stepClass}>
            <div className="step-header">
              <div className="step-title">Upload Resume &nbsp;<span className="optional-badge">Optional</span></div>
              <div className="step-subtitle">PDF or DOCX, up to 5 MB.</div>
            </div>
            {resumeFile ? (
              <div className="resume-selected">
                <span>📄</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>{resumeFile.name}</span>
                <button type="button" onClick={() => setResumeFile(null)}>✕</button>
              </div>
            ) : (
              <label className="resume-dropzone" htmlFor="resume-input">
                <div className="resume-icon">📂</div>
                <h4>Click or drag your resume here</h4>
                <p>Supported formats: PDF, DOC, DOCX</p>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  onChange={e => { if (e.target.files[0]) setResumeFile(e.target.files[0]) }}
                />
              </label>
            )}
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 12 }}>
              You can also skip this and add your resume later from your profile.
            </p>
          </div>
        )

      default: return null
    }
  }

  return (
    <div className="auth-card">
      <h2 className="auth-card-title">Create Account</h2>
      <p className="auth-card-subtitle">
        Step {step} of {STEPS.length} — set up your student profile.
      </p>

      {/* Progress bar */}
      <div className="register-progress">
        {STEPS.map((s, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'active' : ''
          return (
            <div key={n} className={`progress-step ${state}`}>
              <div className="step-circle">{n < step ? '✓' : n}</div>
              <span className="step-label">{s.label}</span>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {renderStep()}

        <div className="register-nav">
          {step > 1
            ? <button type="button" id="reg-back" className="btn btn-ghost" onClick={goBack}>← Back</button>
            : <div className="spacer" />
          }
          {step < STEPS.length
            ? <button type="button" id="reg-next" className="btn btn-primary" onClick={goNext}>Next →</button>
            : <button type="submit" id="reg-submit" className="btn btn-emerald" disabled={loading}>
                {loading ? 'Creating Account…' : 'Complete Registration ✓'}
              </button>
          }
        </div>
      </form>

      <p className="auth-switch-text">
        Already have an account?
        <button id="go-login" onClick={onSwitch}>Sign In</button>
      </p>
    </div>
  )
}

export default Register
