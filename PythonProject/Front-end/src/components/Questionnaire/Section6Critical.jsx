import React, { useState, useContext, useRef, useEffect } from 'react'
import ScaleSelector from './ScaleSelector'
import './Section6Critical.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section6Critical({ initial = {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)
  // pagination setup
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const formRef = useRef(null)

  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const questions = [
    // Qualità del supporto
    { id: 'q1', text: "Ho difficoltà a trovare qualcuno con cui parlare quando sto male." , inverted: true},
    { id: 'q2', text: "Mi sento spesso non capito/a dagli altri.", inverted: true },
    { id: 'q3', text: "Ho poche persone di cui mi fido davvero.", inverted: true },
    // Rete sociale
    { id: 'q4', text: "Il numero di persone con cui ho un rapporto stretto è molto limitato.", inverted: true },
    { id: 'q5', text: "Mi sento tagliato fuori dalle attività del mio gruppo sociale.", inverted: true },
    { id: 'q6', text: "Ho poche persone da poter chiamare in caso di bisogno.", inverted: true },
    // Solitudine emotiva
    { id: 'q7', text: "Mi sento spesso 'solo/a anche in mezzo alla gente'.", inverted: true },
    { id: 'q8', text: "Mi manca la presenza di qualcuno con cui condividere la mia vita.", inverted: true },
    { id: 'q9', text: "Ho spesso la sensazione che gli altri siano distanti da me.", inverted: true },
    // Partecipazione sociale
    { id: 'q10', text: "Mi capita raramente di partecipare ad attività sociali.", inverted: true },
    { id: 'q11', text: "Evito iniziative perché non mi sento a mio agio.", inverted: true },
    { id: 'q12', text: "Ho difficoltà a creare legami nuovi.", inverted: true },
    // Percezione di reciprocità
    { id: 'q13', text: "Sento di dare molto ma di ricevere poco.", inverted: true },
    { id: 'q14', text: "Sento che gli altri non si interessano davvero a come sto.", inverted: true },
    { id: 'q15', text: "Ho rapporti poco equilibrati o poco soddisfacenti.", inverted: true },
  ]

  const scaleOptions = [
    { value: 1, label: language === 'en' ? 'Never' : 'Mai' },
    { value: 2, label: language === 'en' ? 'Rarely' : 'Raramente' },
    { value: 3, label: language === 'en' ? 'Sometimes' : 'Qualche volta' },
    { value: 4, label: language === 'en' ? 'Often' : 'Spesso' },
    { value: 5, label: language === 'en' ? 'Always' : 'Sempre' },
  ]

  // build uniform units
  const buildUnits = (items) => {
    const units = []
    for (let i = 0; i < items.length; i += SECTION_PAGE_SIZE) units.push(items.slice(i, i + SECTION_PAGE_SIZE))
    return units
  }

  const units = buildUnits(questions)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  const [answers, setAnswers] = useState(initial.answers || {})
  const [error, setError] = useState(null)
  const [inlineMessage, setInlineMessage] = useState('')

  const handle = (id, val) => setAnswers(a => ({ ...a, [id]: val }))

  const validate = () => {
    const missing = questions.filter(q => !answers[q.id])
    if (missing.length) { setError(language === 'en' ? `Answer all questions (${missing.length} missing)` : `Rispondi a tutte le domande (${missing.length} mancanti)`); return false }
    setError(null); return true
  }

  const isSliceComplete = () => {
    const missing = slice.filter(q => !answers[q.id])
    if (missing.length) {
      setError(language === 'en' ? `Answer all questions (${missing.length} missing)` : `Rispondi a tutte le domande (${missing.length} mancanti)`)
      setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
      return false
    }
    setInlineMessage('')
    return true
  }

  const compute = () => {
    // all items inverted: convert v -> 6 - v
    const vals = questions.map(q => {
      const v = Number(answers[q.id])
      const inv = 6 - v
      return inv
    })
    const mean = vals.reduce((a,b) => a + b, 0) / vals.length
    const score = 25 * (mean - 1)
    return { mean, score }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isSliceComplete()) return
    if (!validate()) return
    setInlineMessage('')
    const result = compute()
    const rounded = Math.round(result.score)
    let outcome = 'moderato'
    if (rounded >= 60) outcome = 'criticita-situazionale'
    else if (rounded >= 40) outcome = 'rischio-moderato'
    else outcome = 'rischio-significativo'

    const payload = { answers, mean: result.mean, score: rounded, outcome }
    try { localStorage.setItem('questionnaire_section6_critical', JSON.stringify(payload)) } catch {}
    onFinish(payload)
  }

  return (
    <form className="section6-critical" onSubmit={handleSubmit} ref={formRef}>
      <h3>{language === 'en' ? 'Section 6.1 — SocioCulturalOmics (Critical)' : 'Sezione 6.1 — SocioCulturalOmics (Critico)'}</h3>
      <p className="section-intro">{language === 'en' ? 'This module is activated in presence of confirmed risk of isolation.' : 'Questo modulo si attiva in presenza di rischio confermato di isolamento.'}</p>

      {slice.map(q => (
        <div className="form-row" key={q.id}>
          <label className="question-label">{q.text}</label>
          <ScaleSelector questionId={q.id} value={answers[q.id]} onChange={(id, val) => handle(id, val)} options={scaleOptions} />
        </div>
      ))}
      {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}
       {error && <div className="error">{error}</div>}

      {/* pager info and controls */}
      {totalChunks > 1 && (
        <div className="section-pager" style={{ marginTop: 12 }}>
          <div className="pager-info">Pagina {ci + 1} di {totalChunks} — Elementi in pagina: {slice.length}</div>
          <div className="pager-controls">
            {ci > 0 ? (
              <button type="button" className="pager-btn" onClick={() => setChunkIndex(ci - 1)}>{language === 'en' ? 'Back' : 'Indietro'}</button>
            ) : <div style={{ width: 86 }} />}

            {ci < totalChunks - 1 ? (
              <button type="button" className="pager-btn" onClick={() => { if (isSliceComplete()) setChunkIndex(ci + 1) }}>{language === 'en' ? 'Next' : 'Avanti'}</button>
             ) : (
              <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{language === 'en' ? 'Continue' : 'Continua'}</button>
             )}
          </div>
        </div>
      )}

      {/* fallback actions */}
      {totalChunks === 1 && (
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onPrev}>{language === 'en' ? 'Back' : 'Torna indietro'}</button>
          <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{language === 'en' ? 'Continue' : 'Continua'}</button>
         </div>
       )}
    </form>
  )
}
