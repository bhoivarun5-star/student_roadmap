const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'


async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  /** List assessments, optionally filtered by category */
  getAssessments: (category) =>
    apiFetch(`/assessments/${category ? `?category=${category}` : ''}`),

  /** Get all assessments including inactive ones */
  getAllAssessments: () =>
    apiFetch('/assessments/?all=true'),

  /** Get full assessment with questions */
  getAssessment: (id) => apiFetch(`/assessments/${id}/`),

  /** Submit answers and get score */
  submitAttempt: (payload) =>
    apiFetch('/assessments/submit/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Get all past scores for a user */
  getUserScores: (supabaseUserId) =>
    apiFetch(`/assessments/scores/${supabaseUserId}/`),

  /** Create a new assessment with questions and choices */
  createAssessment: (payload) =>
    apiFetch('/assessments/create/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Get full assessment with correct answers (for editing) */
  getAssessmentWithAnswers: (id) => apiFetch(`/assessments/${id}/with-answers/`),

  /** Update an existing assessment */
  updateAssessment: (id, payload) =>
    apiFetch(`/assessments/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  /** Delete an existing assessment */
  deleteAssessment: (id) =>
    apiFetch(`/assessments/${id}/delete/`, {
      method: 'DELETE',
    }),

  /** List all registered students */
  getStudents: () =>
    apiFetch('/students/'),

  /** Get all student attempts globally */
  getGlobalAttempts: () =>
    apiFetch('/assessments/global-scores/'),
}
