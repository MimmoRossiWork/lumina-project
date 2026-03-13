import React, { useState, useContext } from 'react'
import { LanguageContext } from '../../LanguageContext'

export default function Section5Borderline({ initial = {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const qsIt = [
    { id: 'b1', text: 'Sento che la mia energia non è sufficiente durante il giorno.' },
    { id: 'b2', text: 'Ho dovuto rinunciare a hobby o uscite piacevoli a causa di fastidi fisici' },
    { id: 'b3', text: 'Ho dolore o fastidi ricorrenti.' },
    { id: 'b4', text: 'Non mi sveglio riposato/a al mattino.' },
    { id: 'b5', text: 'Il mio stato fisico è peggiorato negli ultimi mesi' },
  ]

  const qsEn = [
    { id: 'b1', text: "I feel I don't have enough energy during the day." },
    { id: 'b2', text: "I've had to give up hobbies or enjoyable outings because of physical discomfort" },
    { id: 'b3', text: 'I have recurring pain or discomfort.' },
    { id: 'b4', text: "I don't wake up feeling rested in the morning." },
    { id: 'b5', text: 'My physical condition has worsened in recent months' },
  ]

  const qs = language === 'en' ? qsEn : qsIt

  const [state, setState] = useState(() => ({ ...(initial.responses || {}) }))
  const [error, setError] = useState(null)

  const handleChange = (id, val) => setState(s => ({ ...s, [id]: val }))

  const validate = () => {
    const missing = qs.filter(q => !state[q.id])
    if (missing.length) {
      setError(language === 'en' ? 'Answer all Borderline module questions' : 'Rispondi a tutte le domande del modulo Borderline')
      return false
    }
    setError(null)
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = { module: 'section5Borderline', responses: { ...state } }
    try { localStorage.setItem('questionnaire_section5Borderline', JSON.stringify(payload)) } catch (err) { console.warn('Could not save section5Borderline', err) }
    onFinish(payload)
  }

  return (
    <form className="micro-survey" onSubmit={handleSubmit}>
      <h5>{language === 'en' ? 'HealthOmics Borderline' : 'HealthOmics Borderline'}</h5>
      <p className="small-muted">{language === 'en' ? 'Answer Yes / No' : 'Rispondi Sì / No'}</p>
      {qs.map(q => (
        <label key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1 }}>{q.text}</span>
          <select value={state[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)}>
            <option value="">{language === 'en' ? 'Select' : 'Seleziona'}</option>
            <option value="yes">{language === 'en' ? 'Yes' : 'Sì'}</option>
            <option value="no">{language === 'en' ? 'No' : 'No'}</option>
          </select>
        </label>
      ))}

      {error && <div className="error">{error}</div>}

      <div className="form-actions" style={{ marginTop: 10 }}>
        <button type="button" className="btn-secondary" onClick={onPrev}>{language === 'en' ? 'Back' : 'Torna indietro'}</button>
        <button type="submit" className="btn-primary">{language === 'en' ? 'Continue' : 'Continua'}</button>
      </div>
    </form>
  )
}
