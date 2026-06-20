import { useState, useEffect } from 'react'
import { api } from '../../api'
import './Assessment.css' // Reuse and expand assessment styles

const CATEGORIES = [
  { key: 'aptitude',      label: 'Aptitude Test' },
  { key: 'technical',     label: 'Technical Skill Test' },
  { key: 'communication', label: 'Communication Assessment' },
  { key: 'personality',   label: 'Personality Assessment' },
]

const DIFFICULTIES = [
  { key: 'easy',   label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard',   label: 'Hard' },
]

export default function CreateAssessment({ onBack, triggerToast, existingAssessmentId }) {
  const [title,           setTitle]           = useState('')
  const [description,     setDescription]     = useState('')
  const [category,        setCategory]        = useState('aptitude')
  const [difficulty,      setDifficulty]      = useState('medium')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [submitting,      setSubmitting]      = useState(false)
  const [loading,         setLoading]         = useState(false)

  // Question structure: { text: '', question_type: 'mcq', marks: 1, explanation: '', choices: [{ text: '', is_correct: false }] }
  const [questions, setQuestions] = useState([
    {
      text: '',
      question_type: 'mcq',
      marks: 1,
      explanation: '',
      choices: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ]
    }
  ])

  useEffect(() => {
    if (existingAssessmentId) {
      setLoading(true)
      api.getAssessmentWithAnswers(existingAssessmentId)
        .then(data => {
          setTitle(data.title || '')
          setDescription(data.description || '')
          setCategory(data.category || 'aptitude')
          setDifficulty(data.difficulty || 'medium')
          setDurationMinutes(data.duration_minutes || 30)
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions.map(q => ({
              id: q.id,
              text: q.text || '',
              question_type: q.question_type || 'mcq',
              marks: q.marks || 1,
              explanation: q.explanation || '',
              choices: q.choices ? q.choices.map(c => ({
                id: c.id,
                text: c.text || '',
                is_correct: c.is_correct || false,
                order: c.order || 0
              })) : []
            })))
          } else {
            setQuestions([])
          }
        })
        .catch(err => {
          triggerToast('Failed to load assessment details: ' + err.message, 'error')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [existingAssessmentId])

  /* ---- Question Handlers ---- */
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        text: '',
        question_type: 'mcq',
        marks: 1,
        explanation: '',
        choices: [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ]
      }
    ])
  }

  const removeQuestion = (qIdx) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== qIdx))
  }

  const updateQuestion = (qIdx, field, value) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q
      return { ...q, [field]: value }
    }))
  }

  /* ---- Choice Handlers ---- */
  const addChoice = (qIdx) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q
      return {
        ...q,
        choices: [...q.choices, { text: '', is_correct: false }]
      }
    }))
  }

  const removeChoice = (qIdx, cIdx) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q
      return {
        ...q,
        choices: q.choices.filter((_, choiceIdx) => choiceIdx !== cIdx)
      }
    }))
  }

  const updateChoice = (qIdx, cIdx, field, value) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q
      const updatedChoices = q.choices.map((c, choiceIdx) => {
        if (choiceIdx !== cIdx) return c
        return { ...c, [field]: value }
      })
      return { ...q, choices: updatedChoices }
    }))
  }

  const handleCorrectChoiceToggle = (qIdx, cIdx, type) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIdx) return q
      const updatedChoices = q.choices.map((c, choiceIdx) => {
        if (type === 'mcq') {
          // MCQ only allows one correct answer
          return { ...c, is_correct: choiceIdx === cIdx }
        } else {
          // Multi-select allows multiple correct answers
          if (choiceIdx === cIdx) {
            return { ...c, is_correct: !c.is_correct }
          }
          return c
        }
      })
      return { ...q, choices: updatedChoices }
    }))
  }

  /* ---- Form Submission ---- */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validations
    if (!title.trim()) {
      triggerToast('Assessment Title is required.', 'error')
      return
    }
    if (questions.length === 0) {
      triggerToast('Please add at least one question.', 'error')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        triggerToast(`Question ${i + 1} text cannot be empty.`, 'error')
        return
      }

      if (q.question_type !== 'text') {
        if (q.choices.length < 2) {
          triggerToast(`Question ${i + 1} must have at least 2 choices.`, 'error')
          return
        }

        const emptyChoice = q.choices.some(c => !c.text.trim())
        if (emptyChoice) {
          triggerToast(`All choices for Question ${i + 1} must have text.`, 'error')
          return
        }

        // Personality test doesn't require "correct" choice, but MCQ/multi does
        if (category !== 'personality') {
          const hasCorrect = q.choices.some(c => c.is_correct)
          if (!hasCorrect) {
            triggerToast(`Question ${i + 1} must have at least one correct choice selected.`, 'error')
            return
          }
        }
      }
    }

    setSubmitting(true)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      duration_minutes: Number(durationMinutes),
      questions: questions.map((q, idx) => ({
        id: q.id,
        text: q.text.trim(),
        question_type: q.question_type,
        marks: Number(q.marks),
        order: idx + 1,
        explanation: q.explanation.trim(),
        choices: q.question_type === 'text' ? [] : q.choices.map((c, cIdx) => ({
          id: c.id,
          text: c.text.trim(),
          is_correct: category === 'personality' ? false : c.is_correct,
          order: cIdx
        }))
      }))
    }

    try {
      if (existingAssessmentId) {
        await api.updateAssessment(existingAssessmentId, payload)
        triggerToast('Assessment updated successfully! 🎉', 'success')
      } else {
        await api.createAssessment(payload)
        triggerToast('Assessment created successfully! 🎉', 'success')
      }
      onBack()
    } catch (err) {
      triggerToast('Failed to save assessment: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="create-assessment-page">
        <div className="assessment-loading" style={{ padding: '100px 0' }}>
          <div className="spinner" /><span>Loading assessment details…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="create-assessment-page">
      <div className="create-assessment-header">
        <button className="test-back-btn" onClick={onBack}>← Back to Assessments</button>
        <h2>{existingAssessmentId ? '🛠️ Edit Assessment Form' : '🛠️ Create Assessment Form'}</h2>
        <p>{existingAssessmentId ? 'Modify and update custom tests in the portal.' : 'Build and add custom tests manually to the portal.'}</p>
      </div>

      <form className="create-assessment-form" onSubmit={handleSubmit}>
        <div className="assessment-meta-card">
          <h3>📋 Test Settings</h3>
          <div className="form-group">
            <label className="form-label">Test Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Intermediate React Patterns"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Describe what skills this test measures…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Test Type / Section</label>
              <select
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map(diff => (
                  <option key={diff.key} value={diff.key}>{diff.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="questions-editor-section">
          <h3>📝 Questions List ({questions.length})</h3>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="question-edit-card">
              <div className="question-edit-header">
                <h4>Question #{qIdx + 1}</h4>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeQuestion(qIdx)}
                  title="Remove Question"
                >
                  ✕ Remove
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Type the question here…"
                  value={q.text}
                  onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                  rows="2"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Question Type</label>
                  <select
                    className="form-select"
                    value={q.question_type}
                    onChange={e => updateQuestion(qIdx, 'question_type', e.target.value)}
                  >
                    <option value="mcq">Single Selection (MCQ)</option>
                    <option value="multi">Multiple Selection</option>
                    <option value="text">Written Answer (Text)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={q.marks}
                    onChange={e => updateQuestion(qIdx, 'marks', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Choices section for MCQ / Multi Select */}
              {q.question_type !== 'text' && (
                <div className="choices-edit-section">
                  <div className="choices-edit-header">
                    <h5>Options / Choices</h5>
                    <button
                      type="button"
                      className="add-choice-btn"
                      onClick={() => addChoice(qIdx)}
                    >
                      ➕ Add Option
                    </button>
                  </div>

                  {q.choices.map((c, cIdx) => (
                    <div key={cIdx} className="choice-edit-row">
                      {category !== 'personality' ? (
                        <input
                          type={q.question_type === 'mcq' ? 'radio' : 'checkbox'}
                          name={`correct-answer-${qIdx}`}
                          className="choice-correct-check"
                          checked={c.is_correct}
                          onChange={() => handleCorrectChoiceToggle(qIdx, cIdx, q.question_type)}
                          title="Mark as correct answer"
                        />
                      ) : (
                        <span className="choice-bullet">•</span>
                      )}

                      <input
                        type="text"
                        className="form-input choice-text-input"
                        placeholder={`Option ${cIdx + 1}`}
                        value={c.text}
                        onChange={e => updateChoice(qIdx, cIdx, 'text', e.target.value)}
                        required
                      />

                      {q.choices.length > 2 && (
                        <button
                          type="button"
                          className="choice-remove-btn"
                          onClick={() => removeChoice(qIdx, cIdx)}
                          title="Delete option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Explanation (Optional)</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Explanation shown after user submits their answers…"
                  value={q.explanation}
                  onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
                  rows="2"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-ghost add-question-btn-big"
            onClick={addQuestion}
          >
            ➕ Add Another Question
          </button>
        </div>

        <div className="form-submit-row">
          <button
            type="submit"
            className="btn btn-emerald submit-test-btn"
            disabled={submitting}
          >
            {submitting 
              ? (existingAssessmentId ? 'Updating Assessment…' : 'Creating Assessment…') 
              : (existingAssessmentId ? '✓ Update and Publish Test' : '✓ Save and Publish Test')}
          </button>
        </div>
      </form>
    </div>
  )
}
