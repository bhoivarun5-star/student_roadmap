import { useState, useEffect, useMemo } from 'react'
import { api } from '../../api'
import CreateAssessment from '../Assessment/CreateAssessment'
import './AdminPanel.css'

/* ── SVG Icons ── */
const TestIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15h6"/><path d="M9 11h6"/><path d="M9 19h3"/>
  </svg>
)

const StudentsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const ScoreIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="12" y2="12"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const ExitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export default function AdminPanel({ onExit, triggerToast }) {
  const [activeTab, setActiveTab] = useState('tests') // 'tests' | 'students' | 'scores'
  const [viewState, setViewState] = useState('dashboard') // 'dashboard' | 'create' | 'edit'
  
  const [assessments, setAssessments] = useState([])
  const [students, setStudents] = useState([])
  const [attempts, setAttempts] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load all dashboard statistics & data
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [testsData, studentsData, attemptsData] = await Promise.all([
        api.getAllAssessments(),
        api.getStudents(),
        api.getGlobalAttempts()
      ])
      setAssessments(testsData || [])
      setStudents(studentsData || [])
      setAttempts(attemptsData || [])
    } catch (err) {
      triggerToast('Failed to load admin dashboard data: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (viewState === 'dashboard') {
      loadDashboardData()
    }
  }, [viewState])

  // Compute key stats for dashboard cards
  const stats = useMemo(() => {
    const totalTests = assessments.length
    const totalStudents = students.length
    const totalAttempts = attempts.length
    
    // Average score calculation across all completed attempts
    const validAttempts = attempts.filter(a => typeof a.percentage === 'number')
    const avgPercentage = validAttempts.length 
      ? Math.round(validAttempts.reduce((sum, item) => sum + item.percentage, 0) / validAttempts.length)
      : 0
      
    return { totalTests, totalStudents, totalAttempts, avgPercentage }
  }, [assessments, students, attempts])

  // Filter elements by search query
  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [assessments, searchQuery])

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [students, searchQuery])

  const filteredAttempts = useMemo(() => {
    return attempts.filter(a => 
      a.assessment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.supabase_user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assessment_category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [attempts, searchQuery])

  // Delete Assessment Handler
  const handleDeleteAssessment = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the test "${title}"? This action cannot be undone.`)) {
      try {
        await api.deleteAssessment(id)
        triggerToast('Test deleted successfully! 🗑️', 'success')
        // Refresh local items
        setAssessments(prev => prev.filter(item => item.id !== id))
      } catch (err) {
        triggerToast('Failed to delete test: ' + err.message, 'error')
      }
    }
  }

  // Clear search query when changing tabs
  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    setSearchQuery('')
  }

  // Main CRUD redirects to form manager
  if (viewState === 'create') {
    return (
      <div className="admin-shell">
        <nav className="admin-navbar">
          <div className="admin-brand">
            <div className="admin-logo">A</div>
            <div className="admin-title-wrap">
              <h1>Admin Panel</h1>
              <span className="admin-badge">Assessment Wizard</span>
            </div>
          </div>
        </nav>
        <div className="admin-container">
          <CreateAssessment
            onBack={() => setViewState('dashboard')}
            triggerToast={triggerToast}
          />
        </div>
      </div>
    )
  }

  if (viewState === 'edit' && editingId) {
    return (
      <div className="admin-shell">
        <nav className="admin-navbar">
          <div className="admin-brand">
            <div className="admin-logo">A</div>
            <div className="admin-title-wrap">
              <h1>Admin Panel</h1>
              <span className="admin-badge">Edit Assessment</span>
            </div>
          </div>
        </nav>
        <div className="admin-container">
          <CreateAssessment
            existingAssessmentId={editingId}
            onBack={() => {
              setViewState('dashboard')
              setEditingId(null)
            }}
            triggerToast={triggerToast}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      {/* Navigation Top bar */}
      <nav className="admin-navbar">
        <div className="admin-brand">
          <div className="admin-logo">A</div>
          <div className="admin-title-wrap">
            <h1>Admin Control Panel</h1>
            <span className="admin-badge">Student Skill Portal</span>
          </div>
        </div>
        <div className="admin-nav-actions">
          <button className="btn-exit-admin" onClick={onExit}>
            <ExitIcon /> Back to Student Portal
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="admin-container">
        {/* Intro */}
        <div className="admin-header-row">
          <div className="admin-intro">
            <h2>Portal Administration Dashboard</h2>
            <p>Monitor portal activity, manage skills tests, audit submissions, and view students details.</p>
          </div>
          
          {/* Tabs */}
          <div className="admin-tabs">
            <button 
              className={`admin-tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => handleTabChange('tests')}
            >
              <TestIcon /> Manage Tests
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => handleTabChange('students')}
            >
              <StudentsIcon /> Student Directory
            </button>
            <button 
              className={`admin-tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
              onClick={() => handleTabChange('scores')}
            >
              <ScoreIcon /> Score Audits
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card stat-tests">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <h3>Created Tests</h3>
              <div className="stat-value">{loading ? '...' : stats.totalTests}</div>
            </div>
          </div>
          <div className="admin-stat-card stat-students">
            <div className="stat-icon">🎓</div>
            <div className="stat-info">
              <h3>Registered Students</h3>
              <div className="stat-value">{loading ? '...' : stats.totalStudents}</div>
            </div>
          </div>
          <div className="admin-stat-card stat-attempts">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <h3>Total Attempts</h3>
              <div className="stat-value">{loading ? '...' : stats.totalAttempts}</div>
            </div>
          </div>
          <div className="admin-stat-card stat-avg">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>Average Score</h3>
              <div className="stat-value">{loading ? '...' : `${stats.avgPercentage}%`}</div>
            </div>
          </div>
        </div>

        {/* Main Panel Content */}
        <div className="admin-panel-content">
          {loading ? (
            <div className="admin-loading-wrapper">
              <div className="spinner" />
              <p>Fetching data sheets from central database...</p>
            </div>
          ) : (
            <>
              {/* Tab Panel 1: Manage Tests */}
              {activeTab === 'tests' && (
                <div>
                  <div className="panel-action-bar">
                    <div className="search-input-wrapper">
                      <span className="search-icon"><SearchIcon /></span>
                      <input 
                        type="text" 
                        className="form-input search-input" 
                        placeholder="Search tests by title or type..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={() => setViewState('create')}>
                      <PlusIcon /> Add New Test
                    </button>
                  </div>

                  {filteredAssessments.length === 0 ? (
                    <div className="admin-empty-wrapper">
                      <span className="empty-icon">📭</span>
                      <h3>No Tests Found</h3>
                      <p>Try searching for a different query or add a brand new skills test to the portal.</p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Test Title</th>
                            <th>Section Category</th>
                            <th>Difficulty</th>
                            <th>Duration</th>
                            <th>Questions</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssessments.map(a => (
                            <tr key={a.id}>
                              <td className="table-main-text">{a.title}</td>
                              <td>
                                <span className={`category-badge cat-${a.category}`}>
                                  {a.category === 'aptitude' ? '🧠 Aptitude' :
                                   a.category === 'technical' ? '💻 Technical' :
                                   a.category === 'communication' ? '🗣️ Communication' : '🌟 Personality'}
                                </span>
                              </td>
                              <td>
                                <span className={`difficulty-badge diff-${a.difficulty}`}>
                                  {a.difficulty}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-2)' }}>{a.duration_minutes} min</td>
                              <td style={{ fontWeight: 600 }}>{a.question_count} qs</td>
                              <td>
                                <div className="action-btns-group">
                                  <button 
                                    className="btn-table-action edit-action"
                                    onClick={() => {
                                      setEditingId(a.id)
                                      setViewState('edit')
                                    }}
                                    title="Edit Test"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    className="btn-table-action delete-action"
                                    onClick={() => handleDeleteAssessment(a.id, a.title)}
                                    title="Delete Test"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Panel 2: Student Directory */}
              {activeTab === 'students' && (
                <div>
                  <div className="panel-action-bar">
                    <div className="search-input-wrapper">
                      <span className="search-icon"><SearchIcon /></span>
                      <input 
                        type="text" 
                        className="form-input search-input" 
                        placeholder="Search by name, email, roll no..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="admin-empty-wrapper">
                      <span className="empty-icon">👥</span>
                      <h3>No Students Registered</h3>
                      <p>Try searching for a different name, email address, or department key.</p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Student Detail</th>
                            <th>Roll Number</th>
                            <th>Department</th>
                            <th>Documented Skills</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map(s => (
                            <tr key={s.id}>
                              <td>
                                <div className="table-main-text">{s.name}</div>
                                <div className="table-sub-text">{s.email}</div>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.roll_number}</td>
                              <td>{s.department}</td>
                              <td>
                                {s.skills && s.skills.length > 0 ? (
                                  <div className="skills-tags-wrap">
                                    {s.skills.map((skill, index) => (
                                      <span 
                                        key={index} 
                                        className={`skill-tag ${['Advanced', 'Expert'].includes(skill.proficiency) ? 'advanced' : ''}`}
                                        title={`${skill.proficiency} · ${skill.years_of_experience} yrs`}
                                      >
                                        {skill.name} ({skill.proficiency.substring(0,3)})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No skills documented</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Panel 3: Score Audits */}
              {activeTab === 'scores' && (
                <div>
                  <div className="panel-action-bar">
                    <div className="search-input-wrapper">
                      <span className="search-icon"><SearchIcon /></span>
                      <input 
                        type="text" 
                        className="form-input search-input" 
                        placeholder="Search by test, category or ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredAttempts.length === 0 ? (
                    <div className="admin-empty-wrapper">
                      <span className="empty-icon">📊</span>
                      <h3>No Performance Logs</h3>
                      <p>Try searching for another query, or wait for students to complete assessments.</p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Student User ID</th>
                            <th>Assessment Title</th>
                            <th>Section</th>
                            <th>Scoring</th>
                            <th>Percentage</th>
                            <th>Completed At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttempts.map(a => (
                            <tr key={a.id}>
                              <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.supabase_user_id}>
                                {a.supabase_user_id}
                              </td>
                              <td className="table-main-text">{a.assessment_title}</td>
                              <td>
                                <span className={`category-badge cat-${a.assessment_category}`}>
                                  {a.assessment_category}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{a.score} / {a.total_marks}</td>
                              <td>
                                <strong style={{ color: a.percentage >= 60 ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                                  {a.percentage}%
                                </strong>
                              </td>
                              <td style={{ color: 'var(--text-2)' }}>
                                {a.completed_at ? new Date(a.completed_at).toLocaleString('en-IN') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
