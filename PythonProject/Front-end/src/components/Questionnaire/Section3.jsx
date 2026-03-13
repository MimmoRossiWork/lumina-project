import React, { useState, useEffect, useContext } from 'react'
import ScaleSelector from './ScaleSelector'
import './Section1.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section3({ initial = {}, onChange = () => {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const sectionAOptionsIt = [
    { id: 'a_artrosi', text: 'Artrosi / artrite' },
    { id: 'a_mal_schiena', text: 'Mal di schiena cronico / dolore muscolo-scheletrico' },
    { id: 'a_fibromialgia', text: 'Fibromialgia' },
    { id: 'a_osteoporosi', text: 'Osteoporosi avanzata' },
    { id: 'a_asma', text: 'Asma / BPCO' },
    { id: 'a_insuff_card', text: 'Insufficienza cardiaca' },
    { id: 'a_ipertensione', text: 'Ipertensione non controllata' },
    { id: 'a_obesita', text: 'Obesità severa' },
    { id: 'a_diabete', text: 'Diabete non controllato' },
    { id: 'a_neuropatia', text: 'Neuropatia periferica' },
    { id: 'a_sclerosi', text: 'Sclerosi multipla / patologie neurologiche' },
    { id: 'a_infortunio', text: 'Infortunio recente (es. fratture, distorsioni, post-intervento)' },
    { id: 'a_gravidanza', text: 'Gravidanza' },
    { id: 'a_none', text: 'Nessuna di queste' },
  ]

  const sectionAOptionsEn = [
    { id: 'a_artrosi', text: 'Osteoarthritis / Arthritis' },
    { id: 'a_mal_schiena', text: 'Chronic back pain / musculoskeletal pain' },
    { id: 'a_fibromialgia', text: 'Fibromyalgia' },
    { id: 'a_osteoporosi', text: 'Advanced osteoporosis' },
    { id: 'a_asma', text: 'Asthma / COPD' },
    { id: 'a_insuff_card', text: 'Heart failure' },
    { id: 'a_ipertensione', text: 'Uncontrolled hypertension' },
    { id: 'a_obesita', text: 'Severe obesity' },
    { id: 'a_diabete', text: 'Uncontrolled diabetes' },
    { id: 'a_neuropatia', text: 'Peripheral neuropathy' },
    { id: 'a_sclerosi', text: 'Multiple sclerosis / neurological disorders' },
    { id: 'a_infortunio', text: 'Recent injury (e.g., fractures, sprains, post-surgery)' },
    { id: 'a_gravidanza', text: 'Pregnancy' },
    { id: 'a_none', text: 'None of the above' },
  ]

  const sectionBOptionsIt = [
    { id: 'b_insonnia', text: 'Insonnia cronica' },
    { id: 'b_apnea', text: 'Apnea notturna / russamento importante' },
    { id: 'b_sindrome_gambe', text: 'Sindrome delle gambe senza riposo' },
    { id: 'b_ritmo', text: 'Disturbi del ritmo circadiano (turni di notte, jet-lag cronico)' },
    { id: 'b_bruxismo', text: 'Bruxismo notturno' },
    { id: 'b_risvegli', text: 'Risvegli frequenti / sonno frammentato' },
    { id: 'b_parasonnie', text: 'Parasonnie (es. sonnambulismo, incubi ricorrenti)' },
    { id: 'b_none', text: 'Nessuno di questi' },
  ]

  const sectionBOptionsEn = [
    { id: 'b_insonnia', text: 'Chronic insomnia' },
    { id: 'b_apnea', text: 'Sleep apnea / severe snoring' },
    { id: 'b_sindrome_gambe', text: 'Restless legs syndrome' },
    { id: 'b_ritmo', text: 'Circadian rhythm disorders (night shifts, chronic jet lag)' },
    { id: 'b_bruxismo', text: 'Nocturnal bruxism' },
    { id: 'b_risvegli', text: 'Frequent awakenings / fragmented sleep' },
    { id: 'b_parasonnie', text: 'Parasomnias (e.g., sleepwalking, recurring nightmares)' },
    { id: 'b_none', text: 'None of the above' },
  ]

  const activityQsIt = [
    { id: 'act1', text: 'Svolgo attività fisica VIGOROSA (es. corsa, nuoto veloce, carichi pesanti).' },
    { id: 'act2', text: 'Svolgo attività fisica MODERATA (es. bicicletta, pulizie pesanti).' },
    { id: 'act3', text: 'Cammino per almeno 10 minuti consecutivi.' },
    { id: 'act4', text: 'Mi sento fisicamente attivo/a durante la mia settimana tipica.' },
    { id: 'act5', text: 'Trascorro gran parte della giornata seduto/a o sdraiato/a (es. lavoro, auto, TV).', inverted: true },
  ]

  const activityQsEn = [
    { id: 'act1', text: 'I engage in VIGOROUS physical activity (which makes me breathe heavily, e.g., running, fast swimming, heavy lifting).' },
    { id: 'act2', text: 'I engage in MODERATE physical activity (which makes me breathe faster but allows me to talk, e.g., cycling, heavy cleaning).' },
    { id: 'act3', text: 'I walk for at least 10 minutes at a time (to get around or for pleasure).' },
    { id: 'act4', text: 'I feel physically active during my typical week.' },
    { id: 'act5', text: 'I spend most of the day sitting or lying down (e.g., at work, in the car, in front of the TV).', inverted: true },
  ]

  const sleepQsIt = [
    { id: 'sleep1', text: 'Sono soddisfatto/a della qualità del mio sonno.' },
    { id: 'sleep2', text: 'Impiego molto tempo ad addormentarmi (più di 30 minuti).', inverted: true },
    { id: 'sleep3', text: 'Dormo un numero di ore sufficiente a sentirmi riposato/a.' },
    { id: 'sleep4', text: 'Mi capita di svegliarmi durante la notte o troppo presto al mattino.', inverted: true },
    { id: 'sleep5', text: 'Ho difficoltà a rimanere sveglio/a o attivo/a durante le attività diurne.', inverted: true },
  ]

  const sleepQsEn = [
    { id: 'sleep1', text: 'I am satisfied with the quality of my sleep.' },
    { id: 'sleep2', text: 'It takes me a long time to fall asleep (more than 30 minutes).', inverted: true },
    { id: 'sleep3', text: 'I sleep enough hours to feel rested (e.g., 7-8 hours).' },
    { id: 'sleep4', text: 'I wake up during the night or too early in the morning.', inverted: true },
    { id: 'sleep5', text: 'I have difficulty staying awake or active during daytime activities (e.g., driving, eating, socializing).', inverted: true },
  ]

  const scaleOptionsIt = [
    { value: 1, label: 'Mai' },
    { value: 2, label: 'Raramente' },
    { value: 3, label: 'Qualche volta' },
    { value: 4, label: 'Spesso' },
    { value: 5, label: 'Sempre' },
  ]

  const scaleOptionsEn = [
    { value: 1, label: 'Never' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Often' },
    { value: 5, label: 'Always' },
  ]

  const sectionAOptions = language === 'en' ? sectionAOptionsEn : sectionAOptionsIt
  const sectionBOptions = language === 'en' ? sectionBOptionsEn : sectionBOptionsIt
  const activityQs = language === 'en' ? activityQsEn : activityQsIt
  const sleepQs = language === 'en' ? sleepQsEn : sleepQsIt
  const scaleOptions = language === 'en' ? scaleOptionsEn : scaleOptionsIt

  const texts = {
    it: {
      title: 'Sezione 3 — PhysioOmics (Attività fisica e sonno)',
      intro: 'Valutazione dei livelli di attività motoria quotidiana e della qualità del sonno.',
      sectionALabel: 'Sezione A — Condizioni mediche (puoi selezionare più opzioni)',
      sectionBLabel: 'Sezione B — Disturbi del sonno (puoi selezionare più opzioni)',
      activitiesTitle: 'Attività fisica',
      activitiesHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      sleepTitle: 'Qualità del sonno',
      sleepHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      microLimitationsTitle: 'Micro-Survey — Limitazioni Fisiche',
      microSleepTitle: 'Micro-Survey — Disturbi del Sonno',
      microYesNoHint: 'Rispondere Sì / No',
      selectPlaceholder: 'Seleziona',
      microQ1: '1. La sua condizione fisica limita la sua capacità di svolgere movimenti quotidiani?',
      microQ2: '2. Il dolore o la fatica limitano in modo significativo la sua attività fisica?',
      microQ3: '3. Segue un programma personalizzato di attività fisica consigliato da un professionista sanitario?',
      microSleepQ1: '1. Il disturbo del sonno influisce negativamente sul suo benessere diurno?',
      microSleepQ2: '2. Utilizza strumenti, terapie o integratori per gestire il disturbo?',
      back: 'Torna nella sezione precedente',
      continue: 'Continua',
      successTitle: 'Fantastico! Sezione PhysioOmics completata 🩺',
      proceed: 'Passa alla sezione successiva',
      errors: {
        activities: 'Rispondi a tutte le domande sull\'attività',
        sleep: 'Rispondi a tutte le domande sul sonno',
        microLimitations: 'Completa il micro-survey sulle limitazioni fisiche',
        microSleep: 'Completa il micro-survey sui disturbi del sonno'
      }
    },
    en: {
      title: 'Section 3 – PhysioOmics (Physical activity and sleep)',
      intro: 'Assessment of daily physical activity levels, quality of sleep and presence of any physical limitations.',
      sectionALabel: 'SECTION A — (You may select more than one option)',
      sectionBLabel: 'SECTION B — (You can select multiple options)',
      activitiesTitle: 'Physical activity',
      activitiesHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      sleepTitle: 'Sleep quality',
      sleepHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      microLimitationsTitle: 'Micro-Survey — Physical Limitations',
      microSleepTitle: 'Micro-Survey — Sleep Disorders',
      microYesNoHint: 'Answer Yes / No',
      selectPlaceholder: 'Select',
      microQ1: '1. Does your physical condition limit your ability to perform daily movements (e.g., getting dressed, shopping)?',
      microQ2: '2. Does pain or fatigue significantly limit your physical activity?',
      microQ3: '3. Do you follow a personalized physical activity program recommended by a healthcare professional? Yes / No',
      microSleepQ1: '1. Does your sleep disorder negatively affect your daytime well-being (e.g., mood, concentration)?',
      microSleepQ2: '2. Do you use tools, therapies, or supplements (e.g., CPAP, melatonin, medication) to manage the disorder? Yes / No.',
      back: 'Return to previous section',
      continue: 'Continue',
      successTitle: 'Great! PhysioOmics section completed 🩺',
      proceed: 'Go to next section',
      errors: {
        activities: 'Answer all activity questions',
        sleep: 'Answer all sleep questions',
        microLimitations: 'Complete the micro-survey on physical limitations',
        microSleep: 'Complete the micro-survey on sleep disorders'
      }
    }
  }

  const t = texts[language] || texts.it

  const [state, setState] = useState({
    sectionA: initial.sectionA || [],
    sectionB: initial.sectionB || [],
    activities: initial.activities || {},
    sleep: initial.sleep || {},
    microLimitations: initial.microLimitations || { q1: '', q2: '', q3: '' },
    microSleep: initial.microSleep || { q1: '', q2: '' },
  })
  const [errors, setErrors] = useState({})
  const [inlineMessage, setInlineMessage] = useState('')
  const [chunkIndex, setChunkIndex] = useState(0)
  const SECTION_PAGE_SIZE = 5
  const FIRST_CHUNK_SIZE = 2
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedResult, setSavedResult] = useState(null)
  const formRef = React.useRef(null)
  const [activeMicro, setActiveMicro] = useState(null)
  const [microQueue, setMicroQueue] = useState([])
  const [resumeChunkIndex, setResumeChunkIndex] = useState(0)

  useEffect(() => { onChange(state) }, [state])
  useEffect(() => { setChunkIndex(0); setActiveMicro(null); setMicroQueue([]) }, [])

  const toggleMulti = (group, id) => {
    setState(s => {
      const prev = s[group] || []
      // if selecting 'none', clear others
      if (id.endsWith('_none')) {
        return { ...s, [group]: [id] }
      }
      const noneId = `${group === 'sectionA' ? 'a_none' : 'b_none'}`
      let next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      // remove none if other selected
      next = next.filter(x => x !== noneId)
      return { ...s, [group]: next }
    })
  }

  // scroll into view on chunk change
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex, activeMicro])

  const handleScale = (id, val, group = 'activities') => {
    if (group === 'activities') setState(s => ({ ...s, activities: { ...s.activities, [id]: val } }))
    else setState(s => ({ ...s, sleep: { ...s.sleep, [id]: val } }))
    setErrors(e => ({ ...e, responses: undefined }))
  }

  const handleMicro = (group, name, value) => {
    setState(s => ({ ...s, [group]: { ...s[group], [name]: value } }))
  }

  const isMicroLimitationsActive = state.sectionA.length > 0 && !state.sectionA.includes('a_none')
  const isMicroSleepActive = state.sectionB.length > 0 && !state.sectionB.includes('b_none')

  const isMicroComplete = (id) => {
    if (id === 'microLimitations') {
      const m = state.microLimitations || {}
      return m.q1 !== '' && m.q2 !== '' && m.q3 !== ''
    }
    if (id === 'microSleep') {
      const m = state.microSleep || {}
      return m.q1 !== '' && m.q2 !== ''
    }
    return true
  }

  const validate = () => {
    const e = {}
    const missingAct = activityQs.filter(q => !state.activities[q.id])
    const missingSleep = sleepQs.filter(q => !state.sleep[q.id])
    if (missingAct.length) e.activities = `${t.errors.activities} (${missingAct.length} ${language === 'en' ? 'missing' : 'mancanti'})`
    if (missingSleep.length) e.sleep = `${t.errors.sleep} (${missingSleep.length} ${language === 'en' ? 'missing' : 'mancanti'})`

    if (isMicroLimitationsActive) {
      const m = state.microLimitations
      if (m.q1 === '' || m.q2 === '' || m.q3 === '') e.microLimitations = t.errors.microLimitations
    }
    if (isMicroSleepActive) {
      const m = state.microSleep
      if (m.q1 === '' || m.q2 === '') e.microSleep = t.errors.microSleep
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const normalizeResponses = () => {
    const actOrig = { ...state.activities }
    const sleepOrig = { ...state.sleep }
    const actNorm = { ...actOrig }
    const sleepNorm = { ...sleepOrig }
    activityQs.forEach(q => { if (q.inverted && actNorm[q.id]) actNorm[q.id] = 6 - actNorm[q.id] })
    sleepQs.forEach(q => { if (q.inverted && sleepNorm[q.id]) sleepNorm[q.id] = 6 - sleepNorm[q.id] })
    return { actOrig, actNorm, sleepOrig, sleepNorm }
  }

  const computeSectionScores = (actNorm, sleepNorm) => {
    const actVals = activityQs.map(q => Number(actNorm[q.id] || 0)).filter(n => n >= 1 && n <= 5)
    const sleepVals = sleepQs.map(q => Number(sleepNorm[q.id] || 0)).filter(n => n >= 1 && n <= 5)
    const meanAct = actVals.length ? (actVals.reduce((a,b) => a + b, 0) / actVals.length) : null
    const meanSleep = sleepVals.length ? (sleepVals.reduce((a,b) => a + b, 0) / sleepVals.length) : null
    let scoreAct = null
    let scoreSleep = null
    if (meanAct !== null) scoreAct = Math.round(25 * (meanAct - 1))
    if (meanSleep !== null) scoreSleep = Math.round(25 * (meanSleep - 1))
    if (scoreAct !== null) { if (scoreAct < 0) scoreAct = 0; if (scoreAct > 100) scoreAct = 100 }
    if (scoreSleep !== null) { if (scoreSleep < 0) scoreSleep = 0; if (scoreSleep > 100) scoreSleep = 100 }
    const sectionTotal = (scoreAct !== null && scoreSleep !== null) ? Math.round((scoreAct + scoreSleep) / 2) : (scoreAct !== null ? scoreAct : scoreSleep)
    return { meanAct, meanSleep, scoreAct, scoreSleep, sectionTotal }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) { setInlineMessage(language === 'en' ? 'Please answer all the required questions before continuing.' : 'Rispondi a tutte le domande obbligatorie prima di continuare.'); return }
    setInlineMessage('')
    const normalized = normalizeResponses()
    const scores = computeSectionScores(normalized.actNorm, normalized.sleepNorm)
    const toSaveBase = { ...state, ...normalized, activityScore: scores.scoreAct, sleepScore: scores.scoreSleep, section3Total: scores.sectionTotal }
    try { localStorage.setItem('questionnaire_section3', JSON.stringify(toSaveBase)) } catch {}
    setSavedResult(toSaveBase)
    setShowOverlay(true)
  }

  // Build combined array and paginate (standard only)
  const buildCombined = () => {
    const combined = []
    combined.push({ id: 'sectionA', type: 'multiselect' })
    combined.push({ id: 'sectionB', type: 'multiselect' })
    activityQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'activities' }))
    sleepQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'sleep' }))
    return combined
  }

  const combined = buildCombined()
  const total = combined.length

  const buildUnits = (items) => {
    const units = []
    const firstSlice = items.slice(0, FIRST_CHUNK_SIZE)
    units.push(firstSlice)
    const rest = items.slice(FIRST_CHUNK_SIZE)
    for (let i = 0; i < rest.length; i += SECTION_PAGE_SIZE) units.push(rest.slice(i, i + SECTION_PAGE_SIZE))
    return units
  }

  const units = buildUnits(combined)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  const enqueueMicros = () => {
    const queue = []
    if (isMicroLimitationsActive) queue.push('microLimitations')
    if (isMicroSleepActive) queue.push('microSleep')
    if (queue.length) {
      setResumeChunkIndex(ci)
      setMicroQueue(queue)
      setActiveMicro(queue[0])
      return true
    }
    return false
  }

  const handleNextChunk = () => {
    if (!isSliceComplete()) return
    if (enqueueMicros()) return
    setChunkIndex(p => Math.min(totalChunks - 1, p + 1))
  }

  const handleFinishMain = () => {
    if (!isSliceComplete()) return
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
    const e = {}
    if (!isMicroComplete(activeMicro)) e[activeMicro] = activeMicro === 'microLimitations' ? t.errors.microLimitations : t.errors.microSleep
    if (Object.keys(e).length) { setErrors(prev => ({ ...prev, ...e })); setInlineMessage(language === 'en' ? 'Please complete this micro-survey before continuing.' : 'Completa questo micro-questionario prima di continuare.'); return }
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

  const handleProceed = () => {
    setShowOverlay(false)
    if (savedResult) onFinish(savedResult)
  }

  const renderMicro = (id) => {
    if (id === 'microLimitations') {
      return (
        <div className="micro-survey" key={id}>
          <h5>{t.microLimitationsTitle}</h5>
          <p className="small-muted">{t.microYesNoHint}</p>
          <label>{t.microQ1}
            <select value={state.microLimitations.q1} onChange={e => handleMicro('microLimitations', 'q1', e.target.value)}>
              <option value="">{t.selectPlaceholder}</option>
              <option value="yes">{language === 'en' ? 'Yes' : 'Sì'}</option>
              <option value="no">{language === 'en' ? 'No' : 'No'}</option>
            </select>
          </label>
          <label>{t.microQ2}
            <select value={state.microLimitations.q2} onChange={e => handleMicro('microLimitations', 'q2', e.target.value)}>
              <option value="">{t.selectPlaceholder}</option>
              <option value="yes">{language === 'en' ? 'Yes' : 'Sì'}</option>
              <option value="no">{language === 'en' ? 'No' : 'No'}</option>
            </select>
          </label>
          <label>{t.microQ3}
            <select value={state.microLimitations.q3} onChange={e => handleMicro('microLimitations', 'q3', e.target.value)}>
              <option value="">{t.selectPlaceholder}</option>
              <option value="yes">{language === 'en' ? 'Yes' : 'Sì'}</option>
              <option value="no">{language === 'en' ? 'No' : 'No'}</option>
            </select>
          </label>
          {errors.microLimitations && <div className="error">{errors.microLimitations}</div>}
        </div>
      )
    }
    if (id === 'microSleep') {
      return (
        <div className="micro-survey" key={id}>
          <h5>{t.microSleepTitle}</h5>
          <p className="small-muted">{t.microYesNoHint}</p>
          <label>{t.microSleepQ1}
            <select value={state.microSleep.q1} onChange={e => handleMicro('microSleep', 'q1', e.target.value)}>
              <option value="">{t.selectPlaceholder}</option>
              <option value="yes">{language === 'en' ? 'Yes' : 'Sì'}</option>
              <option value="no">{language === 'en' ? 'No' : 'No'}</option>
            </select>
          </label>
          <label>{t.microSleepQ2}
            <select value={state.microSleep.q2} onChange={e => handleMicro('microSleep', 'q2', e.target.value)}>
              <option value="">{t.selectPlaceholder}</option>
              <option value="yes">{language === 'en' ? 'Yes' : 'Sì'}</option>
              <option value="no">{language === 'en' ? 'No' : 'No'}</option>
            </select>
          </label>
          {errors.microSleep && <div className="error">{errors.microSleep}</div>}
        </div>
      )
    }
    return null
  }

  const isSliceComplete = () => {
    const missing = {}
    slice.forEach(q => {
      if (q.type === 'multiselect') {
        const sel = q.id === 'sectionA' ? state.sectionA : state.sectionB
        if (!sel || sel.length === 0) {
          missing[q.id] = language === 'en' ? 'Select at least one option (or None of the above).' : 'Seleziona almeno un’opzione (o Nessuna di queste).'
        }
      }
      if (q.type === 'scale') {
        const groupVal = q.source === 'activities' ? state.activities[q.id] : state.sleep[q.id]
        if (!groupVal) missing.responses = q.source === 'activities' ? t.errors.activities : t.errors.sleep
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
    <form className="questionnaire-form" onSubmit={handleSubmit} noValidate ref={formRef}>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {!activeMicro && slice.map((q, idx) => {
        if (q.type === 'multiselect') {
          const label = q.id === 'sectionA' ? t.sectionALabel : t.sectionBLabel
          const opts = q.id === 'sectionA' ? sectionAOptions : sectionBOptions
          return (
            <div className="form-row" key={q.id}>
              <label>{label}</label>
              <div className="multi-grid">
                {opts.map(opt => (
                  <label key={opt.id} className="checkbox-item">
                    <input type="checkbox" checked={(q.id === 'sectionA' ? state.sectionA : state.sectionB).includes(opt.id)} onChange={() => toggleMulti(q.id === 'sectionA' ? 'sectionA' : 'sectionB', opt.id)} />
                    <span className="checkbox-text">{opt.text}</span>
                  </label>
                ))}
            </div>
            </div>
          )
        }

        if (q.type === 'scale') {
          const isActivity = q.source === 'activities'
          const group = isActivity ? 'activities' : 'sleep'
          const showHeader = (isActivity && q.id === activityQs[0].id) || (!isActivity && q.id === sleepQs[0].id)
          return (
            <div className="form-row" key={q.id}>
              {showHeader && <><h4>{isActivity ? t.activitiesTitle : t.sleepTitle}</h4><p className="small-muted">{isActivity ? t.activitiesHint : t.sleepHint}</p></>}
              <label className="question-label">{q.text}{q.inverted ? ` (${language === 'en' ? 'reverse-scored' : 'risposta inversa'})` : ''}</label>
              <ScaleSelector questionId={q.id} value={group === 'activities' ? state.activities[q.id] : state.sleep[q.id]} onChange={(id, val) => handleScale(id, val, group)} options={scaleOptions} />
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
              <button type="button" className="pager-btn" onClick={handleNextChunk}>Avanti</button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleFinishMain}>{t.continue}</button>
            )}
          </div>
        </div>
      )}

      {/* show errors for activities/sleep */}
      {errors.activities && <div className="error">{errors.activities}</div>}
      {errors.sleep && <div className="error">{errors.sleep}</div>}
      {activeMicro && (errors.microLimitations || errors.microSleep) && (
        <div className="error">{errors.microLimitations || errors.microSleep}</div>
      )}

      <div className="form-actions">
        {!activeMicro && <button type="button" className="btn-secondary btn-back-main" onClick={onPrev}>{t.back}</button>}
        {!activeMicro && total <= SECTION_PAGE_SIZE && <button type="button" className="btn-primary" onClick={handleFinishMain}>{t.continue}</button>}
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
            <h2 style={{ margin: '0 0 12px', color: '#111' }}>{t.successTitle}</h2>
            <p style={{ color: '#444', marginBottom: 18 }}>{language === 'en' ? 'You completed the Physio section.' : 'Hai completato la Sezione PhysioOmics.'}</p>
            <div className="modal-actions">
              <button type="button" onClick={handleProceed} className="modal-primary">{t.proceed}</button>
              <button type="button" onClick={() => setShowOverlay(false)} className="modal-secondary">{language === 'en' ? 'Close' : 'Chiudi'}</button>
            </div>
          </div>
        </div>
      )}

    </form>
  )
}
