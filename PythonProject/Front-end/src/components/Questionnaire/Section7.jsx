import React, { useState, useEffect, useContext } from 'react'
import ScaleSelector from './ScaleSelector'
import './Section1.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section7({ initial = {}, onChange = () => {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const eventsIt = [
    { id: 'e_loss', text: 'Perdita di una persona cara' },
    { id: 'e_separation', text: 'Separazione / fine di una relazione' },
    { id: 'e_jobloss', text: 'Perdita del lavoro / forte cambiamento lavorativo' },
    { id: 'e_move', text: 'Trasferimento o cambiamento importante di vita' },
    { id: 'e_birth', text: 'Nascita di un figlio' },
    { id: 'e_money', text: 'Problemi economici rilevanti' },
    { id: 'e_illness', text: 'Malattia propria o di un familiare' },
    { id: 'e_none', text: 'Nessuno di questi' },
    { id: 'e_pref_no', text: 'Preferisco non rispondere' },
  ]

  const eventsEn = [
    { id: 'e_loss', text: 'Loss of a loved one' },
    { id: 'e_separation', text: 'Separation/end of a relationship' },
    { id: 'e_jobloss', text: 'Loss of job/major job change' },
    { id: 'e_move', text: 'Relocation or major life change' },
    { id: 'e_birth', text: 'Birth of a child' },
    { id: 'e_money', text: 'Significant financial problems' },
    { id: 'e_illness', text: 'Illness of oneself or a family member' },
    { id: 'e_none', text: 'None of the above' },
    { id: 'e_pref_no', text: 'I prefer not to answer' },
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

  const lifeIt = [
    { id: 'l1', text: 'La mia vita è, in generale, molto vicina al mio ideale.' },
    { id: 'l2', text: 'Le condizioni della mia vita sono eccellenti.' },
    { id: 'l3', text: 'Finora ho ottenuto le cose importanti che desideravo nella vita.' },
    { id: 'l4', text: 'Se potessi rivivere la mia vita, non cambierei quasi nulla.' },
  ]

  const lifeEn = [
    { id: 'l1', text: 'My life is, in general, very close to my ideal.' },
    { id: 'l2', text: 'My living conditions are excellent.' },
    { id: 'l3', text: 'So far, I have achieved the important things I wanted in life.' },
    { id: 'l4', text: 'If I could live my life over again, I would change almost nothing.' },
  ]

  const qualityIt = [
    { id: 'q1', text: "Mi sento pieno/a di energia nella vita quotidiana." },
    { id: 'q2', text: 'Sono soddisfatto/a dell ambiente in cui vivo (casa, quartiere, sicurezza).' },
    { id: 'q3', text: 'Ho abbastanza tempo libero per dedicarmi ad attività che mi piacciono.' },
    { id: 'q4', text: "Mi sento in grado di affrontare le difficoltà quotidiane con equilibrio." },
    { id: 'q5', text: 'Mi sento generalmente felice e soddisfatto/a del mio modo di vivere.' },
  ]

  const qualityEn = [
    { id: 'q1', text: 'I feel full of energy in my daily life.' },
    { id: 'q2', text: 'I am satisfied with my living environment (home, neighborhood, safety).' },
    { id: 'q3', text: 'I have enough free time to devote to activities I enjoy.' },
    { id: 'q4', text: 'I feel able to cope with everyday difficulties in a balanced way.' },
    { id: 'q5', text: 'I generally feel happy and satisfied with my way of life.' },
  ]

  const events = language === 'en' ? eventsEn : eventsIt
  const scaleOptions = language === 'en' ? scaleEn : scaleIt
  const lifeSatisfactionQs = language === 'en' ? lifeEn : lifeIt
  const qualityQs = language === 'en' ? qualityEn : qualityIt

  const texts = {
    it: {
      title: 'Sezione 7 — LifeOmics',
      intro: 'Rilevazione di eventi di vita significativi recenti e misura della soddisfazione e realizzazione personale.',
      eventsQ: '1. Nell\u2019ultimo anno hai vissuto uno di questi eventi significativi? (seleziona tutte le opzioni)',
      socialQ: '2. Ti senti soddisfatto della tua vita sociale?',
      workQ: '3. Ti senti soddisfatto della tua situazione lavorativa o di studio?',
      purposeQ: '4. Senti di avere uno scopo o una direzione nella vita?',
      lifeTitle: 'Soddisfazione di vita',
      lifeHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      qualityTitle: 'Qualità della vita e significato personale',
      qualityHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      back: 'Torna nella sezione precedente',
      finish: 'Finisci il sondaggio!'
    },
    en: {
      title: 'Section 7 – LifeOmics',
      intro: 'Recording of recent significant life events and measurement of overall satisfaction and personal fulfilment.',
      eventsQ: '1. Have you experienced any of these significant events in the past year? (select all options)',
      socialQ: '2. Are you satisfied with your social life?',
      workQ: '3. Are you satisfied with your work or study situation?',
      purposeQ: '4. Do you feel you have a purpose or direction in life?',
      lifeTitle: 'Life satisfaction',
      lifeHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      qualityTitle: 'Quality of life and personal meaning',
      qualityHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      back: 'Return to previous section',
      finish: 'Finish the questionnaire!'
    }
  }

  const t = texts[language] || texts.it

  const [state, setState] = useState({
    events: initial.events || [],
    eventsOther: initial.eventsOther || '',
    socialSatisfaction: initial.socialSatisfaction || '',
    workSatisfaction: initial.workSatisfaction || '',
    purpose: initial.purpose || '',
    lifeSatisfaction: initial.lifeSatisfaction || {},
    quality: initial.quality || {},
    micro: initial.micro || {},
  })
  const [errors, setErrors] = useState({})
  const [inlineMessage, setInlineMessage] = useState('')
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedResult, setSavedResult] = useState(null)

  useEffect(() => { onChange(state) }, [state])

  // --- pagination state ---
  const PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const [resumeChunkIndex, setResumeChunkIndex] = useState(0)
  const [activeMicro, setActiveMicro] = useState(null)
  const [microQueue, setMicroQueue] = useState([])

  useEffect(() => { setChunkIndex(0); setActiveMicro(null); setMicroQueue([]) }, [])

  const toggleEvent = (id) => {
    setState(s => {
      const prev = s.events || []
      if (id === 'e_none') return { ...s, events: ['e_none'] }
      if (id === 'e_pref_no') return { ...s, events: ['e_pref_no'] }
      let next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      next = next.filter(x => x !== 'e_none' && x !== 'e_pref_no')
      return { ...s, events: next }
    })
  }

  const handleRadio = (name, value) => {
    setState(s => ({ ...s, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleScale = (id, val, group = 'lifeSatisfaction') => {
    setState(s => ({ ...s, [group]: { ...s[group], [id]: val } }))
  }

  // micro activations
  const hasEvent = (key) => state.events && state.events.includes(key)
  const microB = state.workSatisfaction === 'no'
  const microC = state.purpose === 'no' || state.purpose === 'unknown'
  const microD = hasEvent('e_loss') || hasEvent('e_separation') || hasEvent('e_illness') || hasEvent('e_money')
  const microE = hasEvent('e_money')
  const microF = hasEvent('e_birth') || hasEvent('e_illness')

  const microList = [
    { id: 'B', active: microB, size: 4, title: language === 'en' ? 'Micro B — Job dissatisfaction' : 'Micro B — Insoddisfazione lavorativa', labelsEn: ['Does work stress affect your quality of life?','Do you feel valued in your current role?','Do you have opportunities for growth or change?','Does work negatively affect your emotional well-being?'], labelsIt: ['Lo stress lavorativo influisce sulla tua qualità di vita?','Ti senti valorizzato/a nel tuo ruolo attuale?','Hai possibilità di crescita o cambiamento?','Il lavoro influisce negativamente sul tuo benessere emotivo?'] },
    { id: 'C', active: microC, size: 4, title: language === 'en' ? 'Micro C — Lack of meaning/direction' : 'Micro C — Mancanza di significato / direzione', labelsEn: ['Do you feel like you are living on autopilot, without direction?','Do you often feel unmotivated?','Do you have difficulty setting personal goals?','Do you feel that your life lacks coherence or direction?'], labelsIt: ['Senti di vivere in automatico, senza direzione?','Ti senti spesso demotivato/a?','Hai difficoltà a definire obiettivi personali?','Senti che la tua vita manca di coerenza o direzione?'] },
    { id: 'D', active: microD, size: 3, title: language === 'en' ? 'Micro D — Stressful events/life changes' : 'Micro D — Eventi stressanti / cambiamenti di vita', labelsEn: ['Has the event you experienced significantly affected your well-being?','Do you have resources or people who help you cope?','Do you feel able to recover?'], labelsIt: ['L’evento vissuto ha influenzato il tuo benessere in modo significativo?','Hai risorse o persone che ti aiutano ad affrontarlo?','Ti senti in grado di riprenderti?'] },
    { id: 'E', active: microE, size: 3, title: language === 'en' ? 'Micro E — Financial problems' : 'Micro E — Problemi economici', labelsEn: ['Does your financial situation cause you stress?','Does it affect your relationships or quality of life?','Do you feel in control of your financial situation?'], labelsIt: ['La tua situazione economica ti causa stress?','Influisce sulle tue relazioni o sulla qualità della vita?','Ti senti in controllo della tua situazione finanziaria?'] },
    { id: 'F', active: microF, size: 3, title: language === 'en' ? 'Micro F — Parenting / Family stress' : 'Micro F — Genitorialità / Stress familiare', labelsEn: ['Do you feel overwhelmed by family responsibilities?','Do you have support in managing your family?','Does the situation affect your sleep/energy levels?'], labelsIt: ['Ti senti sopraffatto/a dalle responsabilabilità familiari?','Hai supporto nella gestione familiare?','La situazione influenza il tuo sonno/energia?'] }
  ]

  const handleMicroScale = (group, qid, val) => {
    setState(s => ({ ...s, micro: { ...s.micro, [group]: { ...s.micro[group], [qid]: val } } }))
  }

  const isMicroComplete = (id) => {
    const cfg = microList.find(m => m.id === id)
    if (!cfg) return true
    const m = state.micro[id] || {}
    for (let i = 1; i <= cfg.size; i++) {
      if (!m[`${id}${i}`]) return false
    }
    return true
  }

  const validate = () => {
    const e = {}
    // basic required: radio questions and all life & quality scales
    if (!state.socialSatisfaction) e.socialSatisfaction = language === 'en' ? 'Answer the social satisfaction question' : 'Rispondi alla domanda sulla soddisfazione sociale'
    if (!state.workSatisfaction) e.workSatisfaction = language === 'en' ? 'Answer the work/study satisfaction question' : 'Rispondi alla domanda sulla soddisfazione lavorativa/studio'
    if (!state.purpose) e.purpose = language === 'en' ? 'Answer the purpose question' : 'Rispondi alla domanda sul senso di scopo'
    if (!state.events || state.events.length === 0) e.events = language === 'en' ? 'Select at least one event (or None/Prefer not to answer)' : 'Seleziona almeno un evento (o Nessuno/Preferisco non rispondere)'

    const missingLife = lifeSatisfactionQs.filter(q => !state.lifeSatisfaction[q.id])
    const missingQual = qualityQs.filter(q => !state.quality[q.id])
    if (missingLife.length) e.lifeSatisfaction = (language === 'en' ? `Answer the life satisfaction questions (${missingLife.length} missing)` : `Rispondi alle domande sulla soddisfazione di vita (${missingLife.length} mancanti)`)
    if (missingQual.length) e.quality = (language === 'en' ? `Answer the quality of life questions (${missingQual.length} missing)` : `Rispondi alle domande sulla qualità della vita (${missingQual.length} mancanti)`)

    // micro checks (light)
    if (microB) {
      const m = state.micro.B || {}
      if (!m.B1 || !m.B2 || !m.B3 || !m.B4) e.microB = language === 'en' ? 'Complete micro-survey B' : 'Completa il micro-survey B'
    }
    if (microC) {
      const m = state.micro.C || {}
      if (!m.C1 || !m.C2 || !m.C3 || !m.C4) e.microC = language === 'en' ? 'Complete micro-survey C' : 'Completa il micro-survey C'
    }
    if (microD) {
      const m = state.micro.D || {}
      if (!m.D1 || !m.D2 || !m.D3) e.microD = language === 'en' ? 'Complete micro-survey D' : 'Completa il micro-survey D'
    }
    if (microE) {
      const m = state.micro.E || {}
      if (!m.E1 || !m.E2 || !m.E3) e.microE = language === 'en' ? 'Complete micro-survey E' : 'Completa il micro-survey E'
    }
    if (microF) {
      const m = state.micro.F || {}
      if (!m.F1 || !m.F2 || !m.F3) e.microF = language === 'en' ? 'Complete micro-survey F' : 'Completa il micro-survey F'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isCurrentSliceComplete()) return
    if (!validate()) { setInlineMessage(language === 'en' ? 'Please answer all the required questions before continuing.' : 'Rispondi a tutte le domande obbligatorie prima di continuare.'); return }
    setInlineMessage('')
    const toSave = { ...state }
    try { localStorage.setItem('questionnaire_section7', JSON.stringify(toSave)) } catch {}
    setSavedResult(toSave)
    setShowOverlay(true)
  }

  // Build array of questions for pagination (non-micro)
  const buildCombined = () => {
    const arr = []
    // events checkbox list
    arr.push({ key: 'events', type: 'events' })

    // radio questions
    const radioOpts = {
      socialSatisfaction: [
        { value: 'yes', labelIt: 'Sì', labelEn: 'Yes' },
        { value: 'no', labelIt: 'No', labelEn: 'No' },
        { value: 'unknown', labelIt: 'Non so', labelEn: 'I am not sure' }
      ],
      workSatisfaction: [
        { value: 'yes', labelIt: 'Sì', labelEn: 'Yes' },
        { value: 'no', labelIt: 'No', labelEn: 'No' },
        { value: 'none', labelIt: 'Non applicabile', labelEn: 'Not applicable' }
      ],
      purpose: [
        { value: 'yes', labelIt: 'Sì', labelEn: 'Yes' },
        { value: 'no', labelIt: 'No', labelEn: 'No' },
        { value: 'unknown', labelIt: 'Non so', labelEn: 'I am not sure' }
      ]
    }

    arr.push({ key: 'social', type: 'radio', name: 'socialSatisfaction', label: t.socialQ, options: radioOpts.socialSatisfaction })
    arr.push({ key: 'work', type: 'radio', name: 'workSatisfaction', label: t.workQ, options: radioOpts.workSatisfaction })
    arr.push({ key: 'purpose', type: 'radio', name: 'purpose', label: t.purposeQ, options: radioOpts.purpose })

    // life satisfaction scales
    lifeSatisfactionQs.forEach(q => arr.push({ key: q.id, id: q.id, type: 'scale', source: 'life', name: 'lifeSatisfaction', label: q.text }))
    // quality scales
    qualityQs.forEach(q => arr.push({ key: q.id, id: q.id, type: 'scale', source: 'quality', name: 'quality', label: q.text, inverted: q.inverted }))

    return arr
  }

   // --- build question units array ---
   const combined = buildCombined()
   const total = combined.length
   const buildUnits = (items) => {
     const units = []
     let buffer = []
     const flush = () => {
       for (let i = 0; i < buffer.length; i += PAGE_SIZE) units.push(buffer.slice(i, i + PAGE_SIZE))
       buffer = []
     }
     let i = 0
     while (i < items.length) {
       const it = items[i]
       if (typeof it.type === 'string' && it.type.startsWith('micro')) {
         if (buffer.length) flush()
         units.push([it])
         i++
       } else {
         buffer.push(it)
         i++
       }
     }
     if (buffer.length) flush()
     return units
   }

   const units = buildUnits(combined)
   const totalChunks = Math.max(1, units.length)
   const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
   const slice = units[ci] || []

   const isCurrentSliceComplete = () => {
     const e = {}
     for (const q of slice) {
       if (q.type === 'events' && (!state.events || state.events.length === 0)) e.events = language === 'en' ? 'Select at least one event (or None/Prefer not to answer)' : 'Seleziona almeno un evento (o Nessuno / Preferisco non rispondere)'
       if (q.type === 'radio') {
         const val = state[q.name]
         if (!val) e[q.name] = language === 'en' ? 'Answer this question' : 'Rispondi a questa domanda'
       }
       if (q.type === 'scale') {
         const val = q.source === 'life' ? state.lifeSatisfaction[q.id] : state.quality[q.id]
         if (!val) e[q.source === 'life' ? 'lifeSatisfaction' : 'quality'] = q.source === 'life' ? t.lifeHint : t.qualityHint
       }
     }
     setErrors(prev => ({ ...prev, ...e }))
     if (Object.keys(e).length) {
       setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
       return false
     }
     setInlineMessage('')
     return true
   }

  // --- pagination controls ---
  const enqueueMicros = () => {
    const toStart = []
    const toResume = []
    if (microB && !isMicroComplete('B')) toStart.push('B')
    if (microC && !isMicroComplete('C')) toStart.push('C')
    if (microD && !isMicroComplete('D')) toStart.push('D')
    if (microE && !isMicroComplete('E')) toStart.push('E')
    if (microF && !isMicroComplete('F')) toStart.push('F')
    if (activeMicro && !isMicroComplete(activeMicro)) toResume.push(activeMicro)

    if (toStart.length) {
      setMicroQueue(toStart)
      setActiveMicro(toStart[0])
      setResumeChunkIndex(chunkIndex)
      setChunkIndex(0)
      return true
    }

    if (toResume.length) {
      setMicroQueue(toResume)
      setActiveMicro(toResume[0])
      return true
    }

    return false
  }

  const handleNextChunk = () => {
    if (enqueueMicros()) return
    setChunkIndex(ci => Math.min(totalChunks - 1, ci + 1))
  }

  const handleFinishMain = () => {
    if (enqueueMicros()) return
    handleSubmit({ preventDefault: () => {} })
  }

  const handleMicroBack = () => {
    setActiveMicro(null)
    setMicroQueue([])
    setChunkIndex(resumeChunkIndex)
  }

  const handleMicroNext = () => {
    if (!activeMicro) return
    const cfg = microList.find(m => m.id === activeMicro)
    if (cfg && !isMicroComplete(cfg.id)) { setErrors(prev => ({ ...prev, [`micro${cfg.id}`]: language === 'en' ? 'Complete this micro-survey' : 'Completa questo micro-questionario' })); setInlineMessage(language === 'en' ? 'Please complete this micro-survey before continuing.' : 'Completa questo micro-questionario prima di continuare.'); return }
    setInlineMessage('')
    const remaining = microQueue.slice(1)
    if (remaining.length) {
      setMicroQueue(remaining)
      setActiveMicro(remaining[0])
      return
    }
    setActiveMicro(null)
    setMicroQueue([])
    setChunkIndex(p => Math.min(totalChunks - 1, resumeChunkIndex + 1))
  }

  const renderMicro = (id) => {
    const cfg = microList.find(m => m.id === id)
    if (!cfg) return null
    const labels = language === 'en' ? cfg.labelsEn : cfg.labelsIt
    return (
      <div className="micro-survey" key={id}>
        <h5>{cfg.title}</h5>
        <p className="small-muted">{language === 'en' ? 'Answer each question with the scale below.' : 'Rispondi a ogni domanda usando la scala qui sotto.'}</p>
        {labels.map((label, idx) => {
          const qid = `${id}${idx + 1}`
          return (
            <div className="form-row" key={qid}>
              <label className="question-label">{label}</label>
              <ScaleSelector
                questionId={qid}
                value={state.micro?.[id]?.[qid]}
                onChange={(qidInner, val) => handleMicroScale(id, qidInner, val)}
                options={scaleOptions}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <form className="questionnaire-form section7" onSubmit={handleSubmit} noValidate>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {/* Render current chunk or micro */}
      {!activeMicro && slice.map((q, idx) => {
        if (q.type === 'events') {
          return (
            <div className="form-row" key={q.key}>
              <label>{t.eventsQ}</label>
              <div className="multi-grid">
                {events.map(opt => (
                  <label key={opt.id} className="checkbox-item">
                    <input type="checkbox" checked={state.events.includes(opt.id)} onChange={() => toggleEvent(opt.id)} />
                    <span className="checkbox-text">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        }

        if (q.type === 'radio' || q.type === 'scale') {
          return (
            <div className="form-row" key={q.key}>
              <label className="question-label">{q.label}</label>
              {q.type === 'radio' && (
                <div className="radio-row">
                  {q.options.map(opt => (
                    <div className="radio-item" key={opt.value}>
                      <input id={`${q.key}_${opt.value}`} className="radio-input" type="radio" name={q.name} checked={state[q.name] === opt.value} onChange={() => handleRadio(q.name, opt.value)} />
                      <label htmlFor={`${q.key}_${opt.value}`} className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? opt.labelEn : opt.labelIt}</span></label>
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'scale' && (
                <ScaleSelector questionId={q.key} value={state[q.name]?.[q.key]} onChange={(id, val) => handleScale(id, val, q.name)} options={scaleOptions} />
              )}
            </div>
          )
        }

        return null
      })}

      {activeMicro && renderMicro(activeMicro)}

      {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}

      {/* pager info and controls */}
      {!activeMicro && totalChunks > 1 && (
        <div className="section-pager" style={{ marginTop: 12 }}>
          <div className="pager-info">Pagina {ci + 1} di {totalChunks} — Elementi in pagina: {slice.length}</div>
          <div className="pager-controls">
            {ci > 0 ? <button type="button" className="pager-btn pager-back" onClick={() => setChunkIndex(ci - 1)}>Indietro</button> : <div style={{ width: 86 }} />}
            {ci < totalChunks - 1 ? (
              <button type="button" className="pager-btn" onClick={() => { if (!isCurrentSliceComplete()) return; if (enqueueMicros()) return; setChunkIndex(ci + 1) }}>Avanti</button>
            ) : (
              <button type="submit" className="btn-primary" onClick={(e) => { if (!isCurrentSliceComplete()) { e.preventDefault(); return } if (enqueueMicros()) { e.preventDefault(); return } }}>{t.finish}</button>
            )}
          </div>
        </div>
      )}

      {/* errors */}
      {errors.events && <div className="error">{errors.events}</div>}
      {errors.socialSatisfaction && <div className="error">{errors.socialSatisfaction}</div>}
      {errors.workSatisfaction && <div className="error">{errors.workSatisfaction}</div>}
      {errors.purpose && <div className="error">{errors.purpose}</div>}
      {(errors.lifeSatisfaction || errors.quality) && <div className="error">{errors.lifeSatisfaction || errors.quality}</div>}
      {activeMicro && (errors.microB || errors.microC || errors.microD || errors.microE || errors.microF) && (
        <div className="error">{errors.microB || errors.microC || errors.microD || errors.microE || errors.microF}</div>
      )}

      <div className="form-actions">
        {!activeMicro && <button type="button" className="btn-secondary btn-back-main" onClick={onPrev}>{t.back}</button>}
        {!activeMicro && total <= PAGE_SIZE && <button type="submit" className="btn-primary" onClick={(e) => { if (!isCurrentSliceComplete()) { e.preventDefault(); return } if (enqueueMicros()) { e.preventDefault(); return } }}>{t.finish}</button>}
        {activeMicro && (
          <>
            <button type="button" className="btn-secondary" onClick={handleMicroBack}>{language === 'en' ? 'Back' : 'Indietro'}</button>
            <button type="button" className="btn-primary" onClick={handleMicroNext}>{language === 'en' ? 'Continue' : 'Continua'}</button>
          </>
        )}
      </div>

      {/* Confirmation overlay */}
      {showOverlay && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-card" style={{ width: 'min(560px,90%)', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 12px', color: '#111' }}>{language === 'en' ? 'Great! Life section completed 🎉' : 'Fantastico! Sezione Life completata 🎉'}</h2>
            <p style={{ color: '#444', marginBottom: 18 }}>{language === 'en' ? 'You completed the Life section.' : 'Hai completato la Sezione Life.'}</p>
            <div className="modal-actions">
              <button type="button" onClick={() => { setShowOverlay(false); if (savedResult) onFinish(savedResult) }} className="modal-primary">{language === 'en' ? 'Go to results' : 'Vai ai risultati'}</button>
              <button type="button" onClick={() => setShowOverlay(false)} className="modal-secondary">{language === 'en' ? 'Close' : 'Chiudi'}</button>
            </div>
          </div>
        </div>
      )}

    </form>
  )
}
