import React, { useState, useEffect, useContext } from 'react'
import ScaleSelector from './ScaleSelector'
import './Section5.css'
import './Section1.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section5({ initial = {}, onChange = () => {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const healthQsIt = [
    { id: 'h1', text: 'Mi sento in buona salute fisica.' },
    { id: 'h2', text: 'Riesco a muovermi (camminare, salire le scale) senza difficoltà.' },
    { id: 'h3', text: 'Riesco a prendermi cura di me stesso/a senza aiuto (lavarmi, vestirmi, ecc.).' },
    { id: 'h4', text: 'Riesco a svolgere le mie attività quotidiane (lavoro, studio, hobby) senza limitazioni fisiche.' },
    { id: 'h5', text: 'Ho dolore o fastidi fisici che limitano le mie attività.', inverted: true },
    { id: 'h6', text: 'Mi sento stanco/a o affaticato/a durante la giornata.', inverted: true },
    { id: 'h7', text: 'Mi sento libero/a da sintomi o disturbi fisici fastidiosi.' },
    { id: 'h8', text: 'Mi sento sereno/a rispetto al mio stato di salute generale.' },
    { id: 'h9', text: 'Provo spesso mancanza di energie', inverted: true },
    { id: 'h10', text: 'Ho difficoltà a concentrarmi a causa del mio stato fisico.', inverted: true },
  ]

  const healthQsEn = [
    { id: 'h1', text: 'I feel physically healthy.' },
    { id: 'h2', text: 'I can move around (walk, climb stairs) without difficulty.' },
    { id: 'h3', text: 'I am able to take care of myself without help (washing, dressing, etc.).' },
    { id: 'h4', text: 'I can carry out my daily activities (work, study, hobbies) without physical limitations.' },
    { id: 'h5', text: 'I have physical pain or discomfort that limits my activities.', inverted: true },
    { id: 'h6', text: 'I feel tired or fatigued during the day.', inverted: true },
    { id: 'h7', text: 'I feel free from annoying physical symptoms or disorders.' },
    { id: 'h8', text: 'I feel calm about my general state of health.' },
    { id: 'h9', text: 'I often feel a lack of energy', inverted: true },
    { id: 'h10', text: 'I have difficulty concentrating due to my physical condition.', inverted: true },
  ]

  const chronicIt = [
    { id: 'c1', text: 'So gestire bene eventuali problemi o condizioni di salute che ho.' },
    { id: 'c2', text: 'Mi capita di dover rinunciare ad attività per motivi di salute.', inverted: true },
    { id: 'c3', text: 'Il mio stato fisico interferisce con le mie attività sociali.', inverted: true },
    { id: 'c4', text: 'Mi sembra di ammalarmi più facilmente rispetto alle altre persone.', inverted: true },
    { id: 'c5', text: 'Ritengo di avere un buon equilibrio tra riposo e attività fisica' },
    { id: 'c6', text: 'Mi riprendo facilmente quando svolgo attività impegnative.' },
  ]

  const chronicEn = [
    { id: 'c1', text: 'I am able to manage any health problems or conditions I have well.' },
    { id: 'c2', text: 'I sometimes have to give up activities for health reasons.', inverted: true },
    { id: 'c3', text: 'My physical condition interferes with my social activities.', inverted: true },
    { id: 'c4', text: 'I seem to get sick more easily than other people.', inverted: true },
    { id: 'c5', text: 'I believe I have a good balance between rest and physical activity' },
    { id: 'c6', text: 'I recover easily when I do strenuous activities.' },
  ]

  const scaleIt = [
    { value: 1, label: 'Mai' },
    { value: 2, label: 'Raramente' },
    { value: 3, label: 'Qualche volta' },
    { value: 4, label: 'Spesso' },
    { value: 5, label: 'Sempre' },
  ]
  const scaleEn = [
    { value: 1, label: 'Never' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Often' },
    { value: 5, label: 'Always' },
  ]

  const healthQs = language === 'en' ? healthQsEn : healthQsIt
  const chronicQs = language === 'en' ? chronicEn : chronicIt
  const scaleOptions = language === 'en' ? scaleEn : scaleIt

  const texts = {
    it: {
      title: 'Sezione 5 — HealthOmics (Salute percepita)',
      intro: "Analisi della percezione soggettiva del proprio stato di salute, dell'energia vitale e della capacità di gestione di eventuali condizioni croniche.",
      healthTitle: 'Stato di salute percepito',
      healthHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      chronicTitle: 'Condizioni croniche e gestione personale',
      chronicHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      back: 'Torna nella sezione precedente',
      continue: 'Continua',
      errors: {
        health: 'Rispondi a tutte le domande sullo stato di salute percepito',
        chronic: 'Rispondi a tutte le domande sulle condizioni croniche'
      }
    },
    en: {
      title: 'Section 5 – HealthOmics (Perceived Health)',
      intro: "Analysis of the subjective perception of one's state of health, vital energy and ability to manage any chronic conditions.",
      healthTitle: 'Perceived health statu',
      healthHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      chronicTitle: 'Chronic conditions and personal management',
      chronicHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      back: 'Return to previous section',
      continue: 'Continue',
      errors: {
        health: 'Answer all perceived health questions',
        chronic: 'Answer all chronic conditions questions'
      }
    }
  }

  const t = texts[language] || texts.it

  const [state, setState] = useState({
    health: initial.health || {},
    chronic: initial.chronic || {},
  })
  const [errors, setErrors] = useState({})
  const [inlineMessage, setInlineMessage] = useState('')
  // pagination and overlay state
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedResult, setSavedResult] = useState(null)
  const formRef = React.useRef(null)

  useEffect(() => { onChange(state) }, [state])

  // scroll into view when chunk changes
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const handleScale = (id, val, group = 'health') => {
    setState(s => ({ ...s, [group]: { ...s[group], [id]: val } }))
    setErrors(prev => ({ ...prev, [group]: undefined }))
  }

  const validate = () => {
    const e = {}
    const missingHealth = healthQs.filter(q => !state.health[q.id])
    const missingChronic = chronicQs.filter(q => !state.chronic[q.id])
    if (missingHealth.length) e.health = `${t.errors.health} (${missingHealth.length} ${language === 'en' ? 'missing' : 'mancanti'})`
    if (missingChronic.length) e.chronic = `${t.errors.chronic} (${missingChronic.length} ${language === 'en' ? 'missing' : 'mancanti'})`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const normalize = (orig, list) => {
    const norm = { ...orig }
    list.forEach(q => {
      if (q.inverted && norm[q.id]) norm[q.id] = 6 - norm[q.id]
    })
    return norm
  }

  const computeScoreFrom = (normObj) => {
    const vals = Object.values(normObj).map(v => Number(v)).filter(v => !Number.isNaN(v))
    if (!vals.length) return null
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const score = 25 * (mean - 1)
    return { mean, score }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) { setInlineMessage(language === 'en' ? 'Please answer all the required questions before continuing.' : 'Rispondi a tutte le domande obbligatorie prima di continuare.'); return }
    setInlineMessage('')
    const healthOrig = { ...state.health }
    const chronicOrig = { ...state.chronic }
    const healthNorm = normalize(healthOrig, healthQs)
    const chronicNorm = normalize(chronicOrig, chronicQs)

    // combine normalized responses to compute a section-level score
    const combined = { ...healthNorm, ...chronicNorm }
    const computed = computeScoreFrom(combined)
    let sectionScore = computed && computed.score != null ? Math.round(computed.score) : null
    if (sectionScore != null) {
      if (sectionScore < 0) sectionScore = 0
      if (sectionScore > 100) sectionScore = 100
    }

    const activateBorderline = sectionScore != null && sectionScore >= 40 && sectionScore <= 59
    const activateCritical = sectionScore != null && sectionScore < 40

    const toSave = { ...state, healthOrig, chronicOrig, healthNorm, chronicNorm, sectionScore, activateBorderline, activateCritical }
    try { localStorage.setItem('questionnaire_section5', JSON.stringify(toSave)) } catch {}

    // store result and show animated overlay; call onFinish only when user clicks proceed
    setSavedResult(toSave)
    setShowOverlay(true)
  }

  const handleProceed = () => {
    setShowOverlay(false)
    if (savedResult) onFinish(savedResult)
  }

  // Build combined questions array and paginate into units
  const buildCombined = () => {
    const combined = []
    healthQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'health' }))
    chronicQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'chronic' }))
    return combined
  }

  const combined = buildCombined()
  const total = combined.length
  const buildUnits = (items) => {
    const units = []
    let buffer = []
    const flush = () => {
      for (let i = 0; i < buffer.length; i += SECTION_PAGE_SIZE) units.push(buffer.slice(i, i + SECTION_PAGE_SIZE))
      buffer = []
    }
    let i = 0
    while (i < items.length) {
      const it = items[i]
      // no micro blocks in this section, but keep the same logic for consistency
      buffer.push(it)
      i++
    }
    if (buffer.length) flush()
    return units
  }

  const units = buildUnits(combined)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  const isSliceComplete = () => {
    const missing = {}
    slice.forEach(q => {
      if (q.type === 'scale') {
        const val = q.source === 'health' ? state.health[q.id] : state.chronic[q.id]
        if (!val) missing[q.source] = q.source === 'health' ? t.errors.health : t.errors.chronic
      }
    })
    if (Object.keys(missing).length) {
      setErrors(prev => ({ ...prev, ...missing }))
      setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
      return false
    }
    setInlineMessage('')
    return true
  }

  return (
    <form className="questionnaire-form section5" onSubmit={handleSubmit} noValidate ref={formRef}>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {/* Render only current chunk */}
      {slice.map((q, idx) => {
        const prev = idx > 0 ? slice[idx - 1] : null
        const showHealthHeader = q.source === 'health' && (!prev || prev.source !== 'health')
        const showChronicHeader = q.source === 'chronic' && (!prev || prev.source !== 'chronic')
        return (
          <React.Fragment key={q.id}>
            {showHealthHeader && <><h4>{t.healthTitle}</h4><p className="small-muted">{t.healthHint}</p></>}
            {showChronicHeader && <><h4>{t.chronicTitle}</h4><p className="small-muted">{t.chronicHint}</p></>}
            {q.type === 'scale' && (
              <div className="form-row" key={q.id}>
                <label className="question-label">{q.text}{q.inverted ? ` (${language === 'en' ? 'reverse-scored' : 'risposta inversa'})` : ''}</label>
                <ScaleSelector questionId={q.id} value={q.source === 'health' ? state.health[q.id] : state.chronic[q.id]} onChange={(id, val) => handleScale(id, val, q.source === 'health' ? 'health' : 'chronic')} options={scaleOptions} />
              </div>
            )}
          </React.Fragment>
        )
      })}

      {/* pager info and controls */}
      {totalChunks > 1 && (
        <div className="section-pager" style={{ marginTop: 12 }}>
          <div className="pager-info">Pagina {ci + 1} di {totalChunks} — Elementi in pagina: {slice.length}</div>
          <div className="pager-controls">
            {ci > 0 ? <button type="button" className="pager-btn pager-back" onClick={() => setChunkIndex(ci - 1)}>Indietro</button> : <div style={{ width: 86 }} />}
            {ci < totalChunks - 1 ? (
              <button type="button" className="pager-btn" onClick={() => { if (isSliceComplete()) setChunkIndex(ci + 1) }}>Avanti</button>
            ) : (
              <button type="submit" className="btn-primary">{t.continue}</button>
            )}
          </div>
        </div>
      )}

      {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}

      {errors.health && <div className="error">{errors.health}</div>}
      {errors.chronic && <div className="error">{errors.chronic}</div>}

      <div className="form-actions">
        <button type="button" className="btn-secondary btn-back-main" onClick={onPrev}>{t.back}</button>
        {/* fallback submit when everything fits in one chunk */}
        { total <= SECTION_PAGE_SIZE && <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{t.continue}</button> }
      </div>

      {/* Confirmation overlay */}
      {showOverlay && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-card" style={{ width: 'min(560px,90%)', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 12px', color: '#111' }}>{language === 'en' ? 'Great! Health section completed ✅' : 'Fantastico! Sezione Health completata ✅'}</h2>
            <p style={{ color: '#444', marginBottom: 18 }}>{language === 'en' ? 'You completed the Health section.' : 'Hai completato la Sezione Health.'}</p>
            <div className="modal-actions">
              <button type="button" onClick={handleProceed} className="modal-primary">{language === 'en' ? 'Go to next section' : 'Passa alla sezione successiva'}</button>
              <button type="button" onClick={() => setShowOverlay(false)} className="modal-secondary">{language === 'en' ? 'Close' : 'Chiudi'}</button>
            </div>
          </div>
        </div>
      )}

    </form>
  )
}
