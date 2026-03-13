import React, { useState, useContext, useRef, useEffect } from 'react'
import './Section6Borderline.css'
import ScaleSelector from './ScaleSelector'
import { LanguageContext } from '../../LanguageContext'

export default function Section6Borderline({ initial = {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const qsIt = [
    { id: 'b1', text: 'Sento di non avere abbastanza tempo o occasioni per socializzare.' },
    { id: 'b2', text: 'Mi capita di sentirmi “emotivamente distante” dalle persone vicine.' },
    { id: 'b3', text: 'Sento che potrei avere più supporto di quello che ho attualmente.' },
    { id: 'b4', text: 'Faccio fatica a chiedere aiuto quando ne avrei bisogno.' },
    { id: 'b5', text: 'Mi sento meno connesso/a agli altri rispetto al passato.' },
  ]

  const qsEn = [
    { id: 'b1', text: "I feel I don't have enough time or opportunities to socialize." },
    { id: 'b2', text: 'I sometimes feel "emotionally distant" from those close to me.' },
    { id: 'b3', text: 'I feel that I could have more support than I currently have.' },
    { id: 'b4', text: "I find it difficult to ask for help when I need it." },
    { id: 'b5', text: 'I feel less connected to others than in the past.' },
  ]

  const scaleOptions = [
    { value: 1, label: language === 'en' ? 'Never' : 'Mai' },
    { value: 2, label: language === 'en' ? 'Rarely' : 'Raramente' },
    { value: 3, label: language === 'en' ? 'Sometimes' : 'Qualche volta' },
    { value: 4, label: language === 'en' ? 'Often' : 'Spesso' },
    { value: 5, label: language === 'en' ? 'Always' : 'Sempre' },
  ]

  const qs = language === 'en' ? qsEn : qsIt

  // pagination setup
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const formRef = useRef(null)

  // build uniform units
  const buildUnits = (items) => {
    const units = []
    for (let i = 0; i < items.length; i += SECTION_PAGE_SIZE) units.push(items.slice(i, i + SECTION_PAGE_SIZE))
    return units
  }

  const units = buildUnits(qs)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  const [state, setState] = useState(initial.answers || {})
  const [error, setError] = useState(null)
  const [inlineMessage, setInlineMessage] = useState('')

  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const handle = (id, val) => setState(s => ({ ...s, [id]: val }))

  const validate = () => {
    const missing = qs.filter(q => !state[q.id])
    if (missing.length) {
      setError(language === 'en' ? `Answer all questions (${missing.length} missing)` : `Rispondi a tutte le domande (${missing.length} mancanti)`)
      return false
    }
    setError(null)
    return true
  }

  const compute = () => {
    const vals = Object.values(state).map(v => Number(v))
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
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
    const outcome = rounded >= 60 ? 'borderline-stabile' : (rounded < 40 ? 'rischio-isolamento' : 'passare-completo')
    const payload = { answers: state, score: rounded, outcome }
    try { localStorage.setItem('questionnaire_section6_borderline', JSON.stringify(payload)) } catch {}
    onFinish(payload)
  }

  const isSliceComplete = () => {
    const missing = slice.filter(q => !state[q.id])
    if (missing.length) {
      setError(language === 'en' ? `Answer all questions (${missing.length} missing)` : `Rispondi a tutte le domande (${missing.length} mancanti)`)
      setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
      return false
    }
    setInlineMessage('')
    return true
  }

  return (
    <form className="section6-borderline" onSubmit={handleSubmit} ref={formRef}>
      <h3>{language === 'en' ? 'Section 6.1 — SocioCulturalOmics (Borderline)' : 'Sezione 6.1 — SocioCulturalOmics (Borderline)'}</h3>
      <p className="section-intro">{language === 'en' ? 'Brief follow-up to distinguish temporary loneliness from structural isolation.' : 'Breve approfondimento per distinguere solitudine transitoria da isolamento strutturale.'}</p>

      {slice.map(q => (
        <div className="form-row" key={q.id}>
          <label className="question-label">{q.text}</label>
          <ScaleSelector questionId={q.id} value={state[q.id]} onChange={(id, val) => handle(id, val)} options={scaleOptions} />
        </div>
      ))}
      {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}
      {error && <div className="error">{error}</div>}

      {/* pager info and controls when multiple chunks */}
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

      {/* fallback actions when only one chunk */}
      {totalChunks === 1 && (
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onPrev}>{language === 'en' ? 'Back' : 'Torna indietro'}</button>
          <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{language === 'en' ? 'Continue' : 'Continua'}</button>
        </div>
      )}
    </form>
  )
}
