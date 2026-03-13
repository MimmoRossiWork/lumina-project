import React, { useState, useContext } from 'react'
import './Questionnaire.css'
import './SiteExperienceSurvey.css'
import { AuthContext } from '../AuthContext'

const QUESTIONS = [
  'Penso che mi piacerebbe usare questo sistema frequentemente.',
  'Ho trovato il sistema inutilmente complesso.',
  'Ho pensato che il sistema fosse facile da usare.',
  "Penso che avrei bisogno del supporto di una persona tecnica per poter utilizzare questo sistema.",
  'Ho trovato che le varie funzioni di questo sistema erano ben integrate.',
  'Pensavo che ci fosse troppa incoerenza in questo sistema.',
  'Immagino che la maggior parte delle persone imparerebbe a usare questo sistema molto rapidamente.',
  'Ho trovato il sistema molto macchinoso da usare.',
  "Mi sono sentito molto sicuro nell'utilizzare il sistema.",
  'Ho dovuto imparare molte cose prima di poter iniziare a usare questo sistema.'
]

// Indici (0-based) delle domande con orientamento positivo
const POSITIVE_INDEXES = new Set([0, 2, 4, 6, 8])

export default function SiteExperienceSurvey({ onFinish = null }) {
  const { user, completeQuestionnaire } = useContext(AuthContext)
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null))
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleChange = (idx, val) => {
    const copy = [...answers]
    copy[idx] = Number(val)
    setAnswers(copy)
    setError(null)
  }

  const allAnswered = answers.every(a => a !== null)

  const normalizeResponses = () => {
    // For positive items keep value; for negative items reverse (6 - value)
    const normalized = {}
    answers.forEach((v, i) => {
      if (v === null) return
      normalized[`q${i + 1}`] = POSITIVE_INDEXES.has(i) ? Number(v) : (6 - Number(v))
    })
    return normalized
  }

  const API_BASE = import.meta.env.VITE_API_URL || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allAnswered) {
      setError('Per favore rispondi a tutte le domande.')
      return
    }
    const normalized = normalizeResponses()
    const values = Object.values(normalized).map(n => Number(n)).filter(n => !Number.isNaN(n))
    const mean = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null
    const score = mean !== null ? Math.round(25 * (mean - 1)) : null // 0..100

    const payload = {
      timestamp: new Date().toISOString(),
      answers: answers.slice(),
      responsesNormalized: normalized,
      mean,
      score
    }

    try {
      localStorage.setItem('site_experience_survey', JSON.stringify(payload))
    } catch (e) {
      // ignore storage errors
    }

    setResult(payload)

    // send to backend if user is logged in
    if (user && user.id) {
      const risposte = answers.map((v, i) => ({ id_domanda: i + 1, testo: QUESTIONS[i], voto: v }))
      const body = {
        userId: user.id,
        risposte,
        timestamp: new Date().toISOString()
      }

      try {
        const res = await fetch(`${API_BASE}/site-survey/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (res.ok) {
          const data = await res.json()
          // mark user as questionnaire completed in context/localStorage
          if (typeof completeQuestionnaire === 'function') {
            completeQuestionnaire({ totalScore: score })
          }
        } else {
          // Non-fatal: keep local result but report error
          console.warn('Could not send survey to backend', res.status)
        }
      } catch (err) {
        console.warn('Network error sending survey', err)
      }
    }

    if (typeof onFinish === 'function') onFinish(payload)
  }

  const handleClear = () => {
    setAnswers(Array(QUESTIONS.length).fill(null))
    setResult(null)
    setError(null)
    try { localStorage.removeItem('site_experience_survey') } catch (_) {}
  }

  return (
    <div className="questionnaire-root">
      <div className="questionnaire-box survey-box">
        <h1 className="questionnaire-title">Valuta la tua esperienza con il sito</h1>
        <p className="questionnaire-intro">Rispondi alle seguenti affermazioni indicando quanto sei d'accordo (1 = Fortemente in disaccordo, 5 = Fortemente d'accordo).</p>

        <form className="questionnaire-form" onSubmit={handleSubmit}>
          {QUESTIONS.map((q, i) => (
            <div className="form-row question-item" key={i}>
              <label className="question-label">{i + 1}. {q}</label>

              <div className="radio-row" role="radiogroup" aria-label={`Domanda ${i + 1}`}>
                {[1,2,3,4,5].map(v => (
                  <label
                    key={v}
                    className={`radio-option ${answers[i] === v ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={v}
                      checked={answers[i] === v}
                      onChange={() => handleChange(i, v)}
                    />
                    <span className="radio-label">{v}</span>
                  </label>
                ))}
              </div>

            </div>
          ))}

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleClear}>Cancella</button>
            <button type="submit" className="btn-primary">Invia</button>
          </div>
        </form>

        {result && (
          <div className="results-summary" style={{ marginTop: 18 }}>
            <h3>Risultato</h3>
            <div><strong>Punteggio (0-100):</strong> {result.score !== null ? result.score : 'N/D'}</div>
            <div style={{ marginTop: 8 }}><strong>Dettagli:</strong></div>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}