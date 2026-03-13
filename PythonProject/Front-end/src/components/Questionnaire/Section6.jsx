import React, { useState, useEffect, useContext } from 'react'
import ScaleSelector from './ScaleSelector'
import './Section6.css'
import './Section1.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section6({ initial = {}, onChange = () => {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const supportIt = [
    { id: 's1', text: 'Ho persone su cui posso contare quando ho bisogno di aiuto.' },
    { id: 's2', text: 'Posso contare su qualcuno che mi ascolta quando ho bisogno di parlare.' },
    { id: 's3', text: 'Ho amici o familiari che mi fanno sentire apprezzato/a.' },
    { id: 's4', text: 'Ho qualcuno che mi incoraggia o mi dà supporto nei momenti difficili.' },
    { id: 's5', text: 'Posso contare su qualcuno per aiutarmi in compiti pratici (es. spesa, commissioni).' },
    { id: 's6', text: 'Mi sento parte di una comunità o gruppo sociale.' },
    { id: 's7', text: 'Ho relazioni sociali che mi fanno sentire connesso e sostenuto' },
    { id: 's8', text: 'In generale, mi sento soddisfatto/a del mio livello di supporto sociale.' },
    { id: 's9', text: 'Sento che il supporto che ricevo è reciproco (do e ricevo allo stesso modo).' },
    { id: 's10', text: 'Sento che, se avessi un’emergenza, qualcuno sarebbe effettivamente presente.' },
  ]

  const supportEn = [
    { id: 's1', text: 'I have people I can count on when I need help.' },
    { id: 's2', text: 'I can count on someone to listen to me when I need to talk.' },
    { id: 's3', text: 'I have friends or family members who make me feel appreciated.' },
    { id: 's4', text: 'I have someone who encourages me or supports me in difficult times.' },
    { id: 's5', text: 'I can count on someone to help me with practical tasks (e.g., shopping, errands).' },
    { id: 's6', text: 'I feel part of a community or social group.' },
    { id: 's7', text: 'I have social relationships that make me feel connected and supported' },
    { id: 's8', text: 'In general, I feel satisfied with my level of social support.' },
    { id: 's9', text: 'I feel that the support I receive is reciprocal (I give and receive equally).' },
    { id: 's10', text: 'I feel that if I had an emergency, someone would actually be there for me.' },
  ]

  const participationIt = [
    { id: 'p1', text: 'Participo regolarmente ad attività di gruppo, associazioni o iniziative comunitarie' },
    { id: 'p2', text: 'Ho contatti regolari (di persona, telefono o online) con amici o familiari.' },
    { id: 'p3', text: "Mi sento spesso solo/a o isolato/a", inverted: true },
    { id: 'p4', text: 'Mi sento coinvolto/a nella vita della mia comunità' },
  ]

  const participationEn = [
    { id: 'p1', text: 'I regularly participate in group activities, associations, or community initiatives' },
    { id: 'p2', text: 'I have regular contact (in person, by phone, or online) with friends or family members.' },
    { id: 'p3', text: 'I often feel lonely or isolated (Reverse response)', inverted: true },
    { id: 'p4', text: 'I feel involved in the life of my community' },
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

  const supportQs = language === 'en' ? supportEn : supportIt
  const participationQs = language === 'en' ? participationEn : participationIt
  const scaleOptions = language === 'en' ? scaleEn : scaleIt

  const texts = {
    it: {
      title: 'Sezione 6 — SocioCulturalOmics',
      intro: "Valutazione del supporto sociale percepito, delle relazioni interpersonali e della partecipazione nella comunità.",
      supportTitle: 'Supporto sociale percepito',
      supportHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      participationTitle: 'Partecipazione sociale e connessione',
      participationHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      back: 'Torna nella sezione precedente',
      continue: 'Continua',
      errors: {
        support: 'Rispondi a tutte le domande sul supporto sociale',
        participation: 'Rispondi a tutte le domande sulla partecipazione sociale'
      }
    },
    en: {
      title: 'Section 6 – SocioCulturalOmics',
      intro: 'Assessment of the quality and quantity of perceived social support, interpersonal relationships, and level of integration into the community.',
      supportTitle: 'Perceived social support',
      supportHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      participationTitle: 'Social participation and connection',
      participationHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      back: 'Return to previous section',
      continue: 'Continue',
      errors: {
        support: 'Answer all social support questions',
        participation: 'Answer all participation questions'
      }
    }
  }

  const t = texts[language] || texts.it

  const [state, setState] = useState({ support: initial.support || {}, participation: initial.participation || {} })
  const [errors, setErrors] = useState({})
  const [inlineMessage, setInlineMessage] = useState('')
  // pagination and overlay state
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedResult, setSavedResult] = useState(null)
  const formRef = React.useRef(null)

  useEffect(() => { onChange(state) }, [state])

  // smooth scroll into view when changing chunk
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const handleScale = (id, val, group = 'support') => {
    setState(s => ({ ...s, [group]: { ...s[group], [id]: val } }))
    setErrors(prev => ({ ...prev, [group]: undefined }))
  }

  const validate = () => {
    const e = {}
    const missingSupport = supportQs.filter(q => !state.support[q.id])
    const missingPart = participationQs.filter(q => !state.participation[q.id])
    if (missingSupport.length) e.support = `${t.errors.support} (${missingSupport.length} ${language === 'en' ? 'missing' : 'mancanti'})`
    if (missingPart.length) e.participation = `${t.errors.participation} (${missingPart.length} ${language === 'en' ? 'missing' : 'mancanti'})`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const normalize = (orig, list) => {
    const norm = { ...orig }
    list.forEach(q => { if (q.inverted && norm[q.id]) norm[q.id] = 6 - norm[q.id] })
    return norm
  }

  // compute mean and score helper
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
    const supportOrig = { ...state.support }
    const participationOrig = { ...state.participation }
    const supportNorm = normalize(supportOrig, supportQs)
    const participationNorm = normalize(participationOrig, participationQs)

    // combine all normalized answers for a single section score
    const combined = { ...supportNorm, ...participationNorm }
    const computed = computeScoreFrom(combined)
    const sectionScore = computed && computed.score != null ? Math.round(computed.score) : null

    // decide if borderline (40-59 inclusive) or critical (<40)
    const activateBorderline = sectionScore != null && sectionScore >= 40 && sectionScore <= 59
    const activateCritical = sectionScore != null && sectionScore < 40

    const toSave = { ...state, supportOrig, participationOrig, supportNorm, participationNorm, sectionScore, activateBorderline, activateCritical }
    try { localStorage.setItem('questionnaire_section6', JSON.stringify(toSave)) } catch {}

    // DEBUG
    console.log('[DEBUG][Section6] computed:', { mean: computed ? computed.mean : null, rawScore: computed ? computed.score : null, roundedScore: sectionScore, activateBorderline, activateCritical })

    // store result and show animated overlay; call onFinish only when user clicks proceed
    setSavedResult(toSave)
    setShowOverlay(true)
  }

  const handleProceed = () => {
    setShowOverlay(false)
    if (savedResult) onFinish(savedResult)
  }

  // Build combined and paginate into units
  const buildCombined = () => {
    const combined = []
    supportQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'support' }))
    participationQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'participation' }))
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
        const val = q.source === 'support' ? state.support[q.id] : state.participation[q.id]
        if (!val) missing[q.source] = q.source === 'support' ? t.errors.support : t.errors.participation
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
    <form className="questionnaire-form section6" onSubmit={handleSubmit} noValidate ref={formRef}>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {/* Render only current chunk */}
      {slice.map((q, idx) => {
        const prev = idx > 0 ? slice[idx - 1] : null
        const showSupportHeader = q.source === 'support' && (!prev || prev.source !== 'support')
        const showParticipationHeader = q.source === 'participation' && (!prev || prev.source !== 'participation')
        return (
          <React.Fragment key={q.id}>
            {showSupportHeader && <><h4>{t.supportTitle}</h4><p className="small-muted">{t.supportHint}</p></>}
            {showParticipationHeader && <><h4>{t.participationTitle}</h4><p className="small-muted">{t.participationHint}</p></>}
            {q.type === 'scale' && (
              <div className="form-row" key={q.id}>
                <label className="question-label">{q.text}{q.inverted ? ` (${language === 'en' ? 'Reverse response' : ' (risposta inversa)'})` : ''}</label>
                <ScaleSelector questionId={q.id} value={q.source === 'support' ? state.support[q.id] : state.participation[q.id]} onChange={(id, val) => handleScale(id, val, q.source === 'support' ? 'support' : 'participation')} options={scaleOptions} />
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

      {errors.support && <div className="error">{errors.support}</div>}
      {errors.participation && <div className="error">{errors.participation}</div>}

      <div className="form-actions">
        <button type="button" className="btn-secondary btn-back-main" onClick={onPrev}>{t.back}</button>
        {/* fallback submit when everything fits in one chunk */}
        { total <= SECTION_PAGE_SIZE && <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{t.continue}</button> }
      </div>

      {/* Confirmation overlay */}
      {showOverlay && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-card" style={{ width: 'min(560px,90%)', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 12px', color: '#111' }}>{language === 'en' ? 'Great! Social section completed ✅' : 'Fantastico! Sezione Sociale completata ✅'}</h2>
            <p style={{ color: '#444', marginBottom: 18 }}>{language === 'en' ? 'You completed the SocioCultural section.' : 'Hai completato la Sezione SocioCulturale.'}</p>
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
