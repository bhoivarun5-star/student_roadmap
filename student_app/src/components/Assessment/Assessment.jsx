import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../api'
import CreateAssessment from './CreateAssessment'
import './Assessment.css'

/* ── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'aptitude',      label: 'Aptitude Tests',          icon: '🧠', desc: 'Logic, reasoning & numerical ability' },
  { key: 'technical',     label: 'Technical Skill Tests',   icon: '💻', desc: 'Programming, web, and tech knowledge' },
  { key: 'communication', label: 'Communication Assessment', icon: '🗣️', desc: 'Grammar, vocabulary & comprehension' },
  { key: 'personality',   label: 'Personality Assessment',  icon: '🌟', desc: 'Discover your work style & strengths' },
]

const LETTERS = ['A', 'B', 'C', 'D', 'E']

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
function getGrade(pct) {
  if (pct >= 80) return { label: 'Excellent 🎉', cls: 'tag-excellent' }
  if (pct >= 60) return { label: 'Good 👍',      cls: 'tag-good' }
  if (pct >= 40) return { label: 'Average',       cls: 'tag-average' }
  return              { label: 'Needs Practice', cls: 'tag-needs-work' }
}

/* ══════════════════════════════════════════════════════════════════════════
   SCORE REPORTS
══════════════════════════════════════════════════════════════════════════ */
function ScoreReports({ userId }) {
  const [scores,  setScores]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!userId) return
    api.getUserScores(userId)
      .then(setScores)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="assessment-loading"><div className="spinner" /><span>Loading scores…</span></div>
  )

  return (
    <div className="score-reports-page">
      <div className="score-report-header">
        <h2>📊 Score Reports</h2>
        <p>All your completed assessments and results.</p>
      </div>

      {error ? (
        <div className="scores-empty">
          <span style={{ fontSize: 32 }}>⚠️</span>
          <span>Could not load scores: {error}</span>
          <small>Make sure the Django server is running on port 8000.</small>
        </div>
      ) : scores.length === 0 ? (
        <div className="scores-empty">
          <span style={{ fontSize: 40 }}>📋</span>
          <strong>No completed assessments yet.</strong>
          <span>Take a test to see your results here!</span>
        </div>
      ) : (
        <div className="scores-table-wrap">
          <table className="scores-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Category</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map(s => {
                const grade = getGrade(s.percentage ?? 0)
                return (
                  <tr key={s.id}>
                    <td><strong>{s.assessment_title}</strong></td>
                    <td>
                      <span className={`category-pill cat-${s.assessment_category}`}>
                        {s.assessment_category}
                      </span>
                    </td>
                    <td>{s.score} / {s.total_marks}</td>
                    <td>
                      <strong style={{ color: s.percentage >= 60 ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                        {s.percentage}%
                      </strong>
                    </td>
                    <td><span className={`results-tag ${grade.cls}`}>{grade.label}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   RESULTS VIEW
══════════════════════════════════════════════════════════════════════════ */
function ResultsView({ result, assessment, onBack, onRetake }) {
  const isPersonality = assessment.category === 'personality'
  const grade = getGrade(result.percentage)

  return (
    <div className="results-page">
      <button className="test-back-btn" onClick={onBack}>← Back to Assessments</button>

      <div className="results-hero" style={{ marginTop: 20 }}>
        <div className="results-score-ring">
          <span className="score-number">{result.score}</span>
          <span className="score-total">/ {result.total_marks}</span>
        </div>
        <h3>{assessment.title}</h3>
        {!isPersonality && (
          <>
            <div className="results-pct">{result.percentage}%</div>
            <span className={`results-tag ${grade.cls}`}>{grade.label}</span>
          </>
        )}
        {isPersonality && (
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-2)' }}>
            Personality assessments don't have a score — see your responses below.
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button className="test-back-btn" onClick={onRetake}>↩ Retake</button>
          <button className="test-back-btn" onClick={onBack}>← All Tests</button>
        </div>
      </div>

      {isPersonality ? (
        <div className="personality-result-note">
          🌟 Thank you for completing the Personality Assessment!<br />
          Your answers give insight into your work style. A detailed report will appear here once HR reviews your profile.
        </div>
      ) : (
        <div className="results-breakdown">
          {result.results.map((r, i) => (
            <div key={i} className="result-item">
              <div className="result-item-header">
                <div className="result-item-q">
                  <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 700 }}>Q{i + 1}. </span>
                  {r.question_text}
                </div>
                <span className={`result-badge ${r.is_correct === true ? 'badge-correct' : r.is_correct === false ? 'badge-wrong' : 'badge-skipped'}`}>
                  {r.is_correct === true ? '✓ Correct' : r.is_correct === false ? '✗ Wrong' : 'Skipped'}
                </span>
              </div>
              <div className="result-answer-row">
                {r.your_choice_text && (
                  <span className="your-answer">Your answer: <strong>{r.your_choice_text}</strong></span>
                )}
                {r.is_correct === false && r.correct_choice_text && (
                  <span className="correct-answer">✓ Correct: <strong>{r.correct_choice_text}</strong></span>
                )}
              </div>
              {r.explanation && (
                <div className="explanation-text">💡 {r.explanation}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TEST TAKING VIEW
══════════════════════════════════════════════════════════════════════════ */
function TestView({ assessment, userId, onBack, onComplete, triggerToast }) {
  const [currentQ,  setCurrentQ]  = useState(0)
  const [answers,   setAnswers]   = useState({})   // {questionId: choiceId}
  const [timeLeft,  setTimeLeft]  = useState(assessment.duration_minutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  const questions = assessment.questions || []

  /* Timer */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const selectChoice = (questionId, choiceId) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
  }

  const handleSubmit = useCallback(async () => {
    clearInterval(timerRef.current)
    setSubmitting(true)
    const payload = {
      supabase_user_id: userId,
      assessment_id: assessment.id,
      answers: questions.map(q => ({
        question_id: q.id,
        choice_id: answers[q.id] || null,
        text_answer: '',
      })),
    }
    try {
      const result = await api.submitAttempt(payload)
      onComplete(result)
    } catch (e) {
      triggerToast('Failed to submit: ' + e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }, [answers, assessment.id, questions, userId])

  const q = questions[currentQ]
  const answered = Object.keys(answers).length
  const progress = questions.length ? (answered / questions.length) * 100 : 0

  return (
    <div className="test-shell">
      {/* Top bar */}
      <div className="test-topbar">
        <button className="test-back-btn" onClick={onBack}>← Exit</button>
        <div className="test-title-block">
          <h3>{assessment.title}</h3>
          <p>Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className={`test-timer ${timeLeft < 60 ? 'urgent' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="test-progress-bar-wrap">
        <div className="test-progress-label">
          <span>Progress</span>
          <span>{answered}/{questions.length} answered</span>
        </div>
        <div className="test-progress-track">
          <div className="test-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      {q && (
        <div className="question-card">
          <div className="question-number">Question {currentQ + 1} · {q.marks} mark{q.marks !== 1 ? 's' : ''}</div>
          <div className="question-text">{q.text}</div>
          <div className="choices-list">
            {q.choices.map((c, i) => (
              <button
                key={c.id}
                className={`choice-option ${answers[q.id] === c.id ? 'selected' : ''}`}
                onClick={() => selectChoice(q.id, c.id)}
              >
                <span className="choice-letter">{LETTERS[i]}</span>
                {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="test-nav">
        <button
          className="test-back-btn"
          onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
          disabled={currentQ === 0}
        >← Prev</button>

        <div className="question-dots">
          {questions.map((_, i) => (
            <button
              key={i}
              className={`q-dot ${answers[questions[i]?.id] ? 'answered' : ''} ${i === currentQ ? 'current' : ''}`}
              onClick={() => setCurrentQ(i)}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>

        {currentQ < questions.length - 1 ? (
          <button className="test-back-btn" onClick={() => setCurrentQ(q => q + 1)}>Next →</button>
        ) : (
          <button className="test-submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : '✓ Submit Test'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ASSESSMENT LIST VIEW (for a given category)
══════════════════════════════════════════════════════════════════════════ */
function AssessmentList({ category, onSelect, onEditSelect, onCreateClick, isAdmin }) {
  const [assessments, setAssessments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const catInfo = CATEGORIES.find(c => c.key === category)

  useEffect(() => {
    setLoading(true); setError(null)
    api.getAssessments(category)
      .then(setAssessments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [category])

  if (loading) return (
    <div className="assessment-loading"><div className="spinner" /><span>Loading tests…</span></div>
  )
  if (error) return (
    <div className="assessment-empty">
      <div className="empty-icon">⚠️</div>
      <h3>Could not load tests</h3>
      <p>{error}</p>
      <small>Make sure the Django server is running on port 8000.</small>
    </div>
  )

  return (
    <div className="assessment-page">
      <div className="assessment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h2>{catInfo?.icon} {catInfo?.label}</h2>
          <p>{catInfo?.desc} · {assessments.length} test{assessments.length !== 1 ? 's' : ''} available</p>
        </div>
        {isAdmin && (
          <button
            className="test-back-btn"
            onClick={onCreateClick}
            style={{ background: 'var(--purple-500)', color: '#fff', border: 'none' }}
          >
            🛠️ Create Test
          </button>
        )}
      </div>
      {assessments.length === 0 ? (
        <div className="assessment-empty">
          <div className="empty-icon">📭</div>
          <h3>No tests yet</h3>
          <p>Add them via the <strong>Django Admin</strong> panel at <code>http://127.0.0.1:8000/admin</code></p>
        </div>
      ) : (
        <div className="assessment-grid">
          {assessments.map(a => (
            <div
              key={a.id}
              className="assessment-card"
              data-category={a.category}
            >
              <div className="card-icon-row">
                <div className="card-category-icon">{catInfo?.icon}</div>
                <span className={`card-difficulty diff-${a.difficulty}`}>{a.difficulty}</span>
              </div>
              <div className="card-title">{a.title}</div>
              {a.description && <div className="card-desc">{a.description}</div>}
              <div className="card-meta">
                <span>📝 {a.question_count} questions</span>
                <span>⏱ {a.duration_minutes} min</span>
              </div>
              {isAdmin ? (
                <div className="card-actions">
                  <button className="card-start-btn-flex" onClick={() => onSelect(a.id)}>
                    Start Test →
                  </button>
                  <button
                    className="card-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditSelect(a.id)
                    }}
                  >
                    ✏️ Edit
                  </button>
                </div>
              ) : (
                <button className="card-start-btn" onClick={() => onSelect(a.id)}>
                  Start Test →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN ASSESSMENT COMPONENT
══════════════════════════════════════════════════════════════════════════ */
function Assessment({ userId, triggerToast, activeTab, userEmail }) {
  /* view: 'list' | 'loading-test' | 'test' | 'results' | 'scores' | 'edit' */
  const [view,                 setView]                 = useState('list')
  const [category,             setCategory]             = useState('aptitude')
  const [assessment,           setAssessment]           = useState(null)
  const [result,               setResult]               = useState(null)
  const [loadingTest,          setLoadingTest]          = useState(false)
  const [editingAssessmentId,  setEditingAssessmentId]  = useState(null)

  const isAdmin = userEmail === 'admin@example.com' || userEmail === 'admin@university.edu'

  useEffect(() => {
    if (activeTab === 'scores') {
      setView('scores')
    } else if (activeTab === 'create') {
      if (isAdmin) {
        setView('create')
        setEditingAssessmentId(null)
      } else {
        setView('list')
      }
    } else if (['aptitude', 'technical', 'communication', 'personality'].includes(activeTab)) {
      setCategory(activeTab)
      setView('list')
      setAssessment(null)
      setResult(null)
      setEditingAssessmentId(null)
    }
  }, [activeTab, isAdmin])

  const openTest = async (assessmentId) => {
    setLoadingTest(true)
    try {
      const data = await api.getAssessment(assessmentId)
      setAssessment(data)
      setView('test')
    } catch (e) {
      triggerToast('Failed to load test: ' + e.message, 'error')
    } finally {
      setLoadingTest(false)
    }
  }

  const handleComplete = (result) => {
    setResult(result)
    setView('results')
  }

  if (loadingTest) return (
    <div className="assessment-loading" style={{ padding: '100px 0' }}>
      <div className="spinner" /><span>Loading test…</span>
    </div>
  )

  if (view === 'test' && assessment) return (
    <TestView
      assessment={assessment}
      userId={userId}
      onBack={() => { setView('list'); setAssessment(null) }}
      onComplete={handleComplete}
      triggerToast={triggerToast}
    />
  )

  if (view === 'results' && result) return (
    <ResultsView
      result={result}
      assessment={assessment}
      onBack={() => { setView('list'); setAssessment(null); setResult(null) }}
      onRetake={() => openTest(assessment.id)}
    />
  )

  if (view === 'scores') return (
    <ScoreReports userId={userId} />
  )

  if (view === 'create') return (
    <CreateAssessment
      onBack={() => setView('list')}
      triggerToast={triggerToast}
    />
  )

  if (view === 'edit') return (
    <CreateAssessment
      existingAssessmentId={editingAssessmentId}
      onBack={() => { setView('list'); setEditingAssessmentId(null) }}
      triggerToast={triggerToast}
    />
  )

  /* Default: list view */
  return (
    <AssessmentList
      category={category}
      onSelect={openTest}
      onEditSelect={(id) => {
        if (isAdmin) {
          setEditingAssessmentId(id)
          setView('edit')
        }
      }}
      onCreateClick={() => setView('create')}
      isAdmin={isAdmin}
    />
  )
}

/* ── Exported: Navbar dropdown + Assessment page combined ─────────────────── */
export function AssessmentNavButton({ activeTab, onSelectTab, userEmail }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const isAdmin = userEmail === 'admin@example.com' || userEmail === 'admin@university.edu'

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (key) => {
    onSelectTab(key)
    setOpen(false)
  }

  const isActive = activeTab === 'scores' || activeTab === 'create' || CATEGORIES.some(c => c.key === activeTab)

  return (
    <div className="assessment-nav-wrapper" ref={ref}>
      <button
        id="assessment-nav-btn"
        className={`assessment-nav-btn ${open ? 'open' : ''} ${isActive ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>Assessments</span>
        <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="assessment-dropdown">
          <div className="dropdown-label">Tests</div>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              id={`dropdown-${c.key}`}
              className={`dropdown-item ${activeTab === c.key ? 'active' : ''}`}
              onClick={() => select(c.key)}
            >
              <span className="dropdown-item-icon">{c.icon}</span>
              {c.label}
            </button>
          ))}
          <div className="dropdown-divider" />
          <button
            id="dropdown-scores"
            className={`dropdown-item ${activeTab === 'scores' ? 'active' : ''}`}
            onClick={() => select('scores')}
          >
            <span className="dropdown-item-icon">📊</span>
            Score Reports
          </button>
          {isAdmin && (
            <button
              id="dropdown-create"
              className={`dropdown-item ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => select('create')}
            >
              <span className="dropdown-item-icon">🛠️</span>
              Create Test Form
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* Default export: the Assessment page content */
export default Assessment
