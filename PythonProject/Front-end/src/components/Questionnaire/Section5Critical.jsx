import React, { useState, useContext, useRef, useEffect } from 'react'
import ScaleSelector from './ScaleSelector'
import { LanguageContext } from '../../LanguageContext'

export default function Section5Critical({ initial = {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)
  // questions organized by domain as requested; 'inverted' marks reverse-scored items
  const groups = [
    {
      title: language === 'en' ? 'Functionality and limitations' : 'Funzionalità e limitazioni',
      qs: [
        { id: 'f1', text: 'Evito alcune attività per paura del dolore.', inverted: true },
        { id: 'f2', text: "Ho episodi di dolore intenso durante la giornata.", inverted: true },
      ]
    },
    {
      title: language === 'en' ? 'Recurring physical symptoms' : 'Sintomi fisici ricorrenti',
      qs: [
        { id: 's1', text: 'Provo affanno (mancanza di fiato) facendo piccoli sforzi (es. una rampa di scale, portare la spesa).', inverted: true },
        { id: 's2', text: 'Mi sento fisicamente esausto/a anche dopo riposo.', inverted: true },
        { id: 's3', text: 'Ho capogiri, instabilità o sensazioni di svenimento.', inverted: true },
      ]
    },
    {
      title: language === 'en' ? 'Self-management and control' : 'Autogestione e controllo',
      qs: [
        { id: 'a1', text: 'So cosa fare per gestire i miei sintomi.', inverted: false },
        { id: 'a2', text: 'Sto evitando visite mediche anche se credo mi servirebbero.', inverted: true },
      ]
    },
    {
      title: language === 'en' ? 'Sleep and recovery' : 'Sonno e recupero',
      qs: [
        { id: 'r1', text: 'Il mio riposo notturno non è ristoratore.', inverted: true },
        { id: 'r2', text: 'Il mio stato fisico peggiora nelle giornate più impegnative.', inverted: true },
        { id: 'r3', text: 'Mi è difficile recuperare da sforzi fisici anche lievi.', inverted: true },
      ]
    },
    {
      title: language === 'en' ? 'Psychophysical state' : 'Stato psicofisico',
      qs: [
        { id: 'p1', text: 'Il mio stato fisico influenza il mio umore.', inverted: true },
        { id: 'p2', text: 'Sento che la mia salute sta peggiorando.', inverted: true },
      ]
    }
  ]

  const scaleOptions = [
    { value: 1, label: language === 'en' ? 'Never' : 'Mai' },
    { value: 2, label: language === 'en' ? 'Rarely' : 'Raramente' },
    { value: 3, label: language === 'en' ? 'Sometimes' : 'Qualche volta' },
    { value: 4, label: language === 'en' ? 'Often' : 'Spesso' },
    { value: 5, label: language === 'en' ? 'Always' : 'Sempre' },
  ]

  const [state, setState] = useState(() => ({ ...initial }))
  const [errors, setErrors] = useState(null)
  const [inlineMessage, setInlineMessage] = useState('')

  const handleChange = (id, val) => setState(s => ({ ...s, [id]: val }))

  // pagination setup
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const formRef = useRef(null)

  // build flat list of questions preserving group titles
  const flatQs = []
  groups.forEach(group => {
    group.qs.forEach(q => flatQs.push({ ...q, groupTitle: group.title }))
  })

  const buildUnits = (items) => {
    const units = []
    for (let i = 0; i < items.length; i += SECTION_PAGE_SIZE) units.push(items.slice(i, i + SECTION_PAGE_SIZE))
    return units
  }

  const units = buildUnits(flatQs)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  // scroll into view on chunk change
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const validateAll = () => {
    // require all questions answered (global validation)
    const missing = []
    flatQs.forEach(q => { if (!state[q.id] && state[q.id] !== 0) missing.push(q.id) })
    if (missing.length) {
      setErrors(language === 'en' ? 'Answer all questions in the module' : 'Rispondi a tutte le domande del modulo')
      return false
    }
    setErrors(null)
    return true
  }

  const normalize = () => {
    // build normalized responses 1..5; invert where needed
    const normalized = {}
    flatQs.forEach(q => {
      const raw = Number(state[q.id])
      if (Number.isNaN(raw)) return
      normalized[q.id] = q.inverted ? (6 - raw) : raw
    })
    return normalized
  }

  const computeScore = (norm) => {
    const vals = Object.values(norm).map(v => Number(v)).filter(n => !Number.isNaN(n) && n >= 1 && n <= 5)
    if (vals.length === 0) return null
    const mean = vals.reduce((a,b) => a + b, 0) / vals.length
    let score = Math.round(25 * (mean - 1))
    if (score < 0) score = 0
    if (score > 100) score = 100
    return { mean, score }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isSliceComplete()) { return }
    if (!validateAll()) return
    setInlineMessage('')
    const norm = normalize()
    const summary = computeScore(norm)
    const payload = { module: 'section5Critical', responses: { ...state }, responsesNormalized: norm, summary }
    try { localStorage.setItem('questionnaire_section5_critical', JSON.stringify(payload)) } catch (err) { console.warn('Could not save section5 critical', err) }
    onFinish(payload)
  }

  const isSliceComplete = () => {
    const missing = slice.filter(q => state[q.id] === undefined || state[q.id] === null)
    if (missing.length) {
      setErrors(language === 'en' ? 'Answer all questions on this page' : 'Rispondi a tutte le domande di questa pagina')
      setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
      return false
    }
    setInlineMessage('')
    return true
  }

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit} ref={formRef}>
      <h3>{language === 'en' ? 'Module — Functionality, symptoms and recovery' : 'Modulo — Funzionalità, sintomi e recupero'}</h3>
      <p className="small-muted">{language === 'en' ? 'Answer the scale for each statement (Never → Always). Some questions are reverse-scored (indicated).' : 'Rispondi alla scala per ogni affermazione (Mai → Sempre). Alcune domande sono reverse-scored (indicate).'}</p>

      {/* Render only current chunk */}
      {slice.map((q, idx) => {
        const prev = idx > 0 ? slice[idx - 1] : null
        const showGroupHeader = !prev || prev.groupTitle !== q.groupTitle
        return (
          <React.Fragment key={q.id}>
            {showGroupHeader && <><h4 style={{ marginBottom: 8 }}>{q.groupTitle}</h4></>}
            <div className="form-row" key={q.id}>
              <label className="question-label">{q.text} {q.inverted ? <small style={{ color: 'rgba(255,255,255,0.6)' }}>(inverso)</small> : null}</label>
              <ScaleSelector questionId={q.id} value={state[q.id]} onChange={handleChange} options={scaleOptions} />
            </div>
          </React.Fragment>
        )
      })}

      {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}
       {errors && <div className="error">{errors}</div>}

      {/* pager info and controls */}
      {totalChunks > 1 && (
        <div className="section-pager" style={{ marginTop: 12 }}>
          <div className="pager-info">Pagina {ci + 1} di {totalChunks} — Elementi in pagina: {slice.length}</div>
          <div className="pager-controls">
            {ci > 0 ? <button type="button" className="pager-btn" onClick={() => setChunkIndex(ci - 1)}>Indietro</button> : <div style={{ width: 86 }} />}
            {ci < totalChunks - 1 ? (
              <button type="button" className="pager-btn" onClick={() => { if (isSliceComplete()) setChunkIndex(ci + 1) }}>Avanti</button>
            ) : (
              <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{language === 'en' ? 'Continue' : 'Continua'}</button>
            )}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onPrev}>{language === 'en' ? 'Back' : 'Torna indietro'}</button>
        { flatQs.length <= SECTION_PAGE_SIZE && <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{language === 'en' ? 'Continue' : 'Continua'}</button> }
      </div>
    </form>
  )
}
