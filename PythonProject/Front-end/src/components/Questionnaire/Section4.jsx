import React, { useState, useEffect, useContext } from 'react'
import ScaleSelector from './ScaleSelector'
import './Section1.css'
import { LanguageContext } from '../../LanguageContext'

export default function Section4({ initial = {}, onChange = () => {}, onPrev = () => {}, onFinish = () => {} }) {
  const { language } = useContext(LanguageContext)

  const prelimIt = [
    { id: 'p_depressione', text: 'Depressione / disturbi dell\'umore' },
    { id: 'p_bipolare', text: 'Disturbo bipolare' },
    { id: 'p_ansia', text: 'Ansia generalizzata' },
    { id: 'p_panico', text: 'Attacchi di panico' },
    { id: 'p_fobie', text: 'Fobie significative' },
    { id: 'p_doc', text: 'Disturbo ossessivo-compulsivo (DOC)' },
    { id: 'p_ptsd', text: 'PTSD / trauma' },
    { id: 'p_burnout', text: 'Disturbo da stress lavoro-correlato / burnout' },
    { id: 'p_dipendenze', text: 'Disturbi da uso di sostanze / dipendenza' },
    { id: 'p_sleep_psy', text: 'Disturbi del sonno legati a psicopatologia' },
    { id: 'p_adhd', text: 'ADHD' },
    { id: 'p_autismo', text: 'Disturbi dello spettro autistico' },
    { id: 'p_personalita', text: 'Disturbi della personalità' },
    { id: 'p_altro', text: 'Altro' },
    { id: 'p_none', text: 'Nessuna di queste' },
    { id: 'p_pref_no', text: 'Preferisco non rispondere' },
  ]

  const prelimEn = [
    { id: 'p_depressione', text: 'Depression / mood disorders' },
    { id: 'p_bipolare', text: 'Bipolar disorder' },
    { id: 'p_ansia', text: 'Generalized anxiety' },
    { id: 'p_panico', text: 'Panic attacks' },
    { id: 'p_fobie', text: 'Significant phobias' },
    { id: 'p_doc', text: 'Obsessive-compulsive disorder (OCD)' },
    { id: 'p_ptsd', text: 'PTSD / trauma' },
    { id: 'p_burnout', text: 'Work-related stress disorder / burnout' },
    { id: 'p_dipendenze', text: 'Substance use disorders / addiction' },
    { id: 'p_sleep_psy', text: 'Sleep disorders related to psychopathology' },
    { id: 'p_adhd', text: 'ADHD' },
    { id: 'p_autismo', text: 'Autism spectrum disorders' },
    { id: 'p_personalita', text: 'Personality disorders' },
    { id: 'p_altro', text: 'Other' },
    { id: 'p_none', text: 'None of these' },
    { id: 'p_pref_no', text: "I prefer not to answer" },
  ]

  const treatmentOptionsIt = [
    { value: 'no', label: 'No' },
    { value: 'psicoterapia', label: 'Sì, psicoterapia' },
    { value: 'psichiatria', label: 'Sì, psichiatria / terapia farmacologica' },
    { value: 'both', label: 'Sì, entrambi' },
  ]
  const treatmentOptionsEn = [
    { value: 'no', label: 'No' },
    { value: 'psicoterapia', label: 'Yes, psychotherapy' },
    { value: 'psichiatria', label: 'Yes, psychiatry / drug therapy' },
    { value: 'both', label: 'Yes, both' },
  ]

  const wellbeingIt = [
    { id: 'psy1', text: 'Mi sento ottimista riguardo al futuro.' },
    { id: 'psy2', text: 'Mi sento utile e capace di contribuire agli altri.' },
    { id: 'psy3', text: 'Mi sento rilassato/a e in pace.' },
    { id: 'psy4', text: 'Mi sento pieno/a di energia' },
    { id: 'psy5', text: 'Mi sento sicuro/a di me stesso/a.' },
    { id: 'psy6', text: 'Mi sento vicino/a alle persone che mi circondano.' },
    { id: 'psy7', text: 'Mi sento in grado di gestire bene i problemi della vita quotidiana.' },
  ]

  const wellbeingEn = [
    { id: 'psy1', text: 'I feel optimistic about the future.' },
    { id: 'psy2', text: 'I feel useful and able to contribute to others.' },
    { id: 'psy3', text: 'I feel relaxed and at peace.' },
    { id: 'psy4', text: 'I feel full of energy.' },
    { id: 'psy5', text: 'I feel confident.' },
    { id: 'psy6', text: 'I feel close to the people around me.' },
    { id: 'psy7', text: 'I feel able to handle everyday problems well.' },
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

  const sectionAOptions = language === 'en' ? prelimEn : prelimIt
  const treatmentOptions = language === 'en' ? treatmentOptionsEn : treatmentOptionsIt
  const wellbeingQs = language === 'en' ? wellbeingEn : wellbeingIt
  const scaleOptions = language === 'en' ? scaleOptionsEn : scaleOptionsIt

  const microCIt = ['Soffri di ricorrenti intrusioni o flashback relativi all\'evento?','Eviti luoghi, persone o situazioni che ricordano l\'evento?','Hai ipervigilanza o reazioni di startle esagerate?','Quanto questi sintomi limitano la vita quotidiana?']
  const microCEn = ['Do you suffer recurring intrusions or flashbacks related to the event?','Do you avoid places, people, or situations that remind you of the event?','Do you have hypervigilance or exaggerated startle reactions?','How much do these symptoms limit your daily life?']

  const microDIt = ['Ti senti emotivamente esaurito/a per la maggior parte del tempo?','Ti senti cinico/a o distaccato/a rispetto al lavoro?','Hai ridotta efficacia o produttività?','Riesci a recuperare con il riposo?']
  const microDEn = ['Do you feel emotionally exhausted most of the time?','Do you feel cynical or detached from your work?','Do you have reduced effectiveness or productivity?','Are you able to recover with rest?']

  const microEIt = ['Quanto spesso bevi/usi sostanze in quantità che ti preoccupano?','Hai mai tentato di ridurre e non ci sei riuscito/a?','Il consumo interferisce con il lavoro/relazioni?','Sei interessato/a a ricevere supporto per ridurre il consumo?']
  const microEEn = ['How often do you drink/use substances in quantities that worry you?','Have you ever tried to cut down and failed?','Does your consumption interfere with work/relationships?','Are you interested in receiving support to reduce your consumption?']

  const microFIt = ["Hai difficoltà a mantenere l'attenzione in molte attività quotidiane?","Hai difficoltà a organizzare o completare compiti?","Hai iperattività o agitazione che interferisce con il lavoro/relazioni?","Ricevi supporto o strategie per la gestione (es. coaching, adattamenti)?"]
  const microFEn = ['Do you have difficulty maintaining attention in many daily activities?','Do you have difficulty organizing or completing tasks?','Do you have hyperactivity or agitation that interferes with work/relationships?','Do you receive support or management strategies (e.g., coaching, accommodations)?']

  const microGIt = ["Hai pensieri intrusivi ricorrenti che non riesci a controllare?","Metti in atto rituali per ridurre l'ansia?","Quante ore al giorno impieghi in questi rituali?","I sintomi limitano il tuo funzionamento sociale o lavorativo?"]
  const microGEn = ['Do you have recurring intrusive thoughts that you cannot control?','Do you perform rituals to reduce anxiety?','How many hours per day do you spend on these rituals? (0 = 0h → 5 = >3h)','Do the symptoms limit your social or work functioning?']

  const texts = {
    it: {
      title: 'Sezione 4 — PsychoOmics (Benessere mentale e stress)',
      intro: 'Esplorazione dello stato psicologico attuale, dei livelli di stress percepito e del benessere emotivo generale.',
      triageTitle: 'Procedura di triage (critica): ideazione suicidaria & rischio imminente',
      triageText: "Le tue risposte indicano che potresti essere in una situazione di rischio. Se ti senti in pericolo ora, chiama immediatamente il 112 (o il numero di emergenza locale). Se vuoi, possiamo metterti in contatto con un professionista/servizio di supporto.",
      triageReasonsTitle: 'Motivi rilevati:',
      triageCall: 'Chiama 112',
      triageContact: 'Contatta servizio di supporto',
      triageConsent: "Acconsento all'invio di un alert al team clinico con i dati necessari per il follow-up (privacy e consenso locali applicati)",
      prelimQuestion1: '1. Ti è mai stata fatta diagnosi di uno dei seguenti disturbi? (seleziona tutte le opzioni che si applicano)',
      prelimAltroPlaceholder: 'Specificare',
      treatmentQ: '2. Sei attualmente seguito/a da un professionista per la salute mentale?',
      recentStressQ: '3. Negli ultimi 12 mesi hai vissuto eventi stressanti importanti?',
      recentStressPlaceholder: 'Descrivi (facoltativo)',
      wellbeingTitle: 'Benessere psicologico',
      wellbeingHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      microA_Title: 'Micro A — Ansia / Attacchi di panico',
      microB_Title: "Micro B — Depressione / Disturbi dell'umore",
      microC_Title: 'Micro C — PTSD / Trauma',
      microD_Title: 'Micro D — Burnout / Stress lavoro-correlato',
      microE_Title: 'Micro E — Dipendenze',
      microF_Title: 'Micro F — ADHD / Neurodivergenza',
      microG_Title: 'Micro G — Disturbo Ossessivo-Compulsivo (DOC)',
      stressTitle: 'Stress percepito',
      stressHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      back: 'Torna nella sezione precedente',
      continue: 'Continua',
      successTitle: 'Fantastico! Sezione PsychoOmics completata 🧠',
      proceed: 'Passa alla sezione successiva',
      errors: {
        wellbeing: 'Rispondi a tutte le domande sul benessere',
        stress: 'Rispondi a tutte le domande sullo stress',
        microA: 'Completa il micro A',
        microB: 'Completa il micro B',
        microC: 'Completa il micro C',
        microD: 'Completa il micro D',
        microE: 'Completa il micro E',
        microF: 'Completa il micro F',
        microG: 'Completa il micro G'
      }
    },
    en: {
      title: 'Section 4 – PsychoOmics (Mental Well-being and Stress)',
      intro: 'Exploration of current psychological state, perceived stress levels, and overall emotional wellbeing.',
      triageTitle: 'Triage procedure (critical): suicidal ideation & imminent risk',
      triageText: 'Your responses indicate you may be at risk. If you are in danger now, call your local emergency number immediately. If you want, we can connect you to a professional/support service.',
      triageReasonsTitle: 'Reasons detected:',
      triageCall: 'Call emergency',
      triageContact: 'Contact support service',
      triageConsent: 'I consent to sending an alert to the clinical team with the necessary data for follow-up (local privacy/consent rules apply)',
      prelimQuestion1: '1. Have you ever been diagnosed with any of the following disorders? (select all that apply)',
      prelimAltroPlaceholder: 'Specify',
      treatmentQ: '2. Are you currently receiving mental health treatment from a professional?',
      recentStressQ: '3. Have you experienced any major stressful events in the last 12 months?',
      recentStressPlaceholder: 'Describe (optional)',
      wellbeingTitle: 'Psychological well-being',
      wellbeingHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      microA_Title: 'MICRO A — Anxiety / Panic attacks',
      microB_Title: 'MICRO B — Depression / Mood disorders',
      microC_Title: 'MICRO C — PTSD / Trauma',
      microD_Title: 'MICRO D — Burnout / Work-related stress',
      microE_Title: 'MICRO E — Addictions',
      microF_Title: 'MICRO F — ADHD / Neurodiversity',
      microG_Title: 'MICRO G — Obsessive-Compulsive Disorder (OCD)',
      stressTitle: 'Perceived Stress',
      stressHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      back: 'Return to previous section',
      continue: 'Continue',
      successTitle: 'Great! PsychoOmics section completed 🧠',
      proceed: 'Go to next section',
      errors: {
        wellbeing: 'Answer all wellbeing questions',
        stress: 'Answer all stress questions',
        microA: 'Complete micro A',
        microB: 'Complete micro B',
        microC: 'Complete micro C',
        microD: 'Complete micro D',
        microE: 'Complete micro E',
        microF: 'Complete micro F',
        microG: 'Complete micro G'
      }
    }
  }

  const t = texts[language] || texts.it

  const [state, setState] = useState({
    prelim: initial.prelim || [],
    prelimAltro: initial.prelimAltro || '',
    treatment: initial.treatment || 'no',
    recentStress: initial.recentStress || 'no',
    recentStressDetails: initial.recentStressDetails || '',
    wellbeing: initial.wellbeing || {},
    micro: initial.micro || {},
  })
  const [errors, setErrors] = useState({})
  const [inlineMessage, setInlineMessage] = useState('')

  // triage state
  const [triageActive, setTriageActive] = useState(false)
  const [triageReasons, setTriageReasons] = useState([])
  const [triageConsent, setTriageConsent] = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  // pagination and overlay state
  const [chunkIndex, setChunkIndex] = useState(0)
  const SECTION_PAGE_SIZE = 5
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedResult, setSavedResult] = useState(null)
  const formRef = React.useRef(null)
  const [activeMicro, setActiveMicro] = useState(null)
  const [microQueue, setMicroQueue] = useState([])
  const [resumeChunkIndex, setResumeChunkIndex] = useState(0)

  useEffect(() => { onChange(state) }, [state])

  const togglePrelim = (id) => {
    setState(s => {
      const prev = s.prelim || []
      // handle none / prefer not
      if (id === 'p_none') return { ...s, prelim: ['p_none'] }
      if (id === 'p_pref_no') return { ...s, prelim: ['p_pref_no'] }
      let next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      next = next.filter(x => x !== 'p_none' && x !== 'p_pref_no')
      return { ...s, prelim: next }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setState(s => ({ ...s, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleScale = (id, val) => {
    setState(s => ({ ...s, wellbeing: { ...s.wellbeing, [id]: val } }))
    setErrors(prev => ({ ...prev, wellbeing: undefined }))
  }
  const handleMicroScale = (group, qid, val) => {
    setState(s => ({ ...s, micro: { ...s.micro, [group]: { ...s.micro[group], [qid]: val } } }))
  }
  const handleMicroYesNo = (group, qid, val) => {
    setState(s => ({ ...s, micro: { ...s.micro, [group]: { ...s.micro[group], [qid]: val } } }))
  }

  // detection of triage (suicidal ideation / intent / recent self-harm)
  const detectTriage = (s) => {
    const reasons = []
    const mB = s.micro && s.micro.B ? s.micro.B : {}
    const b3scale = Number(mB.B3_scale)
    if (!Number.isNaN(b3scale) && b3scale >= 4) reasons.push(language === 'en' ? 'High frequency of hopelessness/ideation (B3 scale)' : 'Frequenza elevata di pensieri di inutilità/ideazione (B3 scale)')
    const textToSearch = `${s.prelimAltro || ''} ${s.recentStressDetails || ''}`.toLowerCase()
    if (textToSearch.includes('suic') || textToSearch.includes('uccid') || textToSearch.includes('tagli') || textToSearch.includes('farmi male') || textToSearch.includes('kill') || textToSearch.includes('suicid')) {
      reasons.push(language === 'en' ? 'Reference to ideation or self-harm in free text' : 'Riferimento a ideazione o autolesionismo nel testo libero')
    }
    if (s.micro) {
      Object.entries(s.micro).forEach(([group, obj]) => {
        if (!obj || typeof obj !== 'object') return
        Object.entries(obj).forEach(([k, v]) => {
          const valStr = String(v || '').toLowerCase()
          if (k.toLowerCase().includes('suic') || k.toLowerCase().includes('self') || valStr.includes('suic') || valStr.includes('farmi male') || valStr.includes('uccid') || valStr.includes('kill')) {
            reasons.push(language === 'en' ? `Reference in ${group}.${k}` : `Riferimento in ${group}.${k}`)
          }
        })
      })
    }
    return reasons.length ? reasons : null
  }

  // Helpers to determine micro activations
  const hasPrelim = (key) => state.prelim && state.prelim.includes(key)
  const activeMicroA = hasPrelim('p_ansia') || hasPrelim('p_panico')
  const activeMicroB = hasPrelim('p_depressione') || hasPrelim('p_bipolare')
  const activeMicroC = hasPrelim('p_ptsd')
  const activeMicroD = hasPrelim('p_burnout')
  const activeMicroE = hasPrelim('p_dipendenze')
  const activeMicroF = hasPrelim('p_adhd') || hasPrelim('p_autismo')
  const activeMicroG = hasPrelim('p_doc')

  const microList = [
    { id: 'A', active: activeMicroA, size: 5, validate: () => {
      const m = state.micro.A || {}
      if (!m.A1 || !m.A3 || !m.A4 || !m.A5 || (m.A2 !== 'yes' && m.A2 !== 'no')) return t.errors.microA
      return null
    }},
    { id: 'B', active: activeMicroB, size: 5, validate: () => {
      const m = state.micro.B || {}
      // B3 is now a scale stored in B3_scale
      if (!m.B1 || !m.B2 || (!m.B3_scale && m.B3_scale !== 0) || !m.B4 || (m.B5 !== 'yes' && m.B5 !== 'no')) return t.errors.microB
      return null
    }},
    { id: 'C', active: activeMicroC, size: (language === 'en' ? microCEn : microCIt).length, validate: () => {
      const m = state.micro.C || {}
      for (let i = 1; i <= (language === 'en' ? microCEn.length : microCIt.length); i++) if (!m[`C${i}`]) return t.errors.microC
      return null
    }},
    { id: 'D', active: activeMicroD, size: (language === 'en' ? microDEn : microDIt).length, validate: () => {
      const m = state.micro.D || {}
      for (let i = 1; i <= (language === 'en' ? microDEn.length : microDIt.length); i++) if (!m[`D${i}`]) return t.errors.microD
      return null
    }},
    { id: 'E', active: activeMicroE, size: (language === 'en' ? microEEn : microEIt).length, validate: () => {
      const m = state.micro.E || {}
      for (let i = 1; i <= (language === 'en' ? microEEn.length : microEIt.length); i++) if (!m[`E${i}`]) return t.errors.microE
      return null
    }},
    { id: 'F', active: activeMicroF, size: (language === 'en' ? microFEn : microFIt).length, validate: () => {
      const m = state.micro.F || {}
      for (let i = 1; i <= (language === 'en' ? microFEn.length : microFIt.length); i++) if (!m[`F${i}`]) return t.errors.microF
      return null
    }},
    { id: 'G', active: activeMicroG, size: (language === 'en' ? microGEn : microGIt).length, validate: () => {
      const m = state.micro.G || {}
      for (let i = 1; i <= (language === 'en' ? microGEn.length : microGIt.length); i++) if (!m[`G${i}`]) return t.errors.microG
      return null
    }}
  ]

  const validate = () => {
    const e = {}
    // wellbeing required
    const missing = wellbeingQs.filter(q => !state.wellbeing[q.id])
    if (missing.length) e.wellbeing = `${t.errors.wellbeing} (${missing.length} ${language === 'en' ? 'missing' : 'mancanti'})`

    // stress required (s1..s4)
    const stressIds = ['s1', 's2', 's3', 's4']
    const missingStress = stressIds.filter(id => !state.wellbeing[id])
    if (missingStress.length) e.stress = `${t.errors.stress} (${missingStress.length} ${language === 'en' ? 'missing' : 'mancanti'})`

    // micro validations if active
    microList.forEach(m => {
      if (m.active) {
        const err = m.validate()
        if (err) e[`micro${m.id}`] = err
      }
    })

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSendAlert = () => {
    // save alert locally (real implementation should call backend and follow privacy rules)
    const payload = {
      timestamp: new Date().toISOString(),
      reasons: triageReasons,
      consent: triageConsent,
      section: 'section4',
    }
    try { localStorage.setItem('triage_alert', JSON.stringify(payload)) } catch (err) { console.error(err) }
    setAlertSent(true)
  }

  const handleTriageProceed = () => {
    // user chooses to proceed despite triage (we still include triage info in saved state)
    const nextState = { ...state, triage: { triggered: true, reasons: triageReasons, alertSent } }
    try { localStorage.setItem('questionnaire_section4', JSON.stringify(nextState)) } catch (err) {}
    setTriageActive(false)
    // call onFinish with triage metadata attached
    onFinish(nextState)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isCurrentSliceComplete()) return
    if (!validate()) { setInlineMessage(language === 'en' ? 'Please answer all the required questions before continuing.' : 'Rispondi a tutte le domande obbligatorie prima di continuare.'); return }
    setInlineMessage('')
    const reasons = detectTriage(state)
    if (reasons && reasons.length) { setTriageReasons(reasons); setTriageActive(true); return }
    try { localStorage.setItem('questionnaire_section4', JSON.stringify(state)) } catch {}
    setSavedResult(state)
    setShowOverlay(true)
  }

  // Build combined array for pagination (standard only)
  const buildCombined = () => {
    const combined = []
    combined.push({ id: 'prelim', type: 'multiselect' })
    combined.push({ id: 'treatment', type: 'treatment' })
    combined.push({ id: 'recentStress', type: 'recentStress' })
    wellbeingQs.forEach(q => combined.push({ ...q, type: 'scale', source: 'wellbeing' }))
    const stressList = language === 'en' ? [
      {id: 's1', text: 'I feel tense or stressed.'},
      {id: 's2', text: 'I sometimes feel overwhelmed by difficulties.'},
      {id: 's3', text: 'I feel in control of important situations in my life.'},
      {id: 's4', text: 'I am able to effectively manage my daily responsibilities.'}
    ] : [
      {id: 's1', text: 'Mi sento teso/a o stressato/a.'},
      {id: 's2', text: 'Mi capita di sentirmi sopraffatto/a dalle difficoltà.'},
      {id: 's3', text: 'Mi sento in controllo delle situazioni importanti della mia vita.'},
      {id: 's4', text: 'Riesco a gestire in modo efficace le mie responsabilità quotidiane'}
    ]
    stressList.forEach(s => combined.push({ ...s, type: 'scale', source: 'stress' }))
    return combined
  }

  const combined = buildCombined()
  const total = combined.length

  const buildUnits = (items) => {
    const units = []
    for (let i = 0; i < items.length; i += SECTION_PAGE_SIZE) units.push(items.slice(i, i + SECTION_PAGE_SIZE))
    return units
  }

  const units = buildUnits(combined)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  const enqueueMicros = () => {
    const queue = microList.filter(m => m.active && m.validate()).map(m => m.id)
    if (queue.length) {
      setResumeChunkIndex(ci)
      setMicroQueue(queue)
      setActiveMicro(queue[0])
      return true
    }
    return false
  }

  const handleNextChunk = () => {
    if (!isCurrentSliceComplete()) return
    if (enqueueMicros()) return
    setChunkIndex(p => Math.min(totalChunks - 1, p + 1))
  }

  const handleFinishMain = () => {
    if (!isCurrentSliceComplete()) return
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
    const currentCfg = microList.find(m => m.id === activeMicro)
    const errMsg = currentCfg?.validate()
    if (errMsg) { setErrors(prev => ({ ...prev, [`micro${activeMicro}`]: errMsg })); setInlineMessage(language === 'en' ? 'Please complete this micro-survey before continuing.' : 'Completa questo micro-questionario prima di continuare.'); return }
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

  const isCurrentSliceComplete = () => {
     const e = {}
     for (const q of slice) {
      if (q.type === 'multiselect' && q.id === 'prelim') {
        if (!state.prelim || state.prelim.length === 0) e.prelim = language === 'en' ? 'Select at least one option (or None/Prefer not to answer)' : 'Seleziona almeno un’opzione (o Nessuna / Preferisco non rispondere)'
      }
       if (q.type === 'treatment' && !state.treatment) e.treatment = language === 'en' ? 'Select treatment option' : 'Seleziona un\'opzione di trattamento'
       if (q.type === 'recentStress' && !state.recentStress) e.recentStress = language === 'en' ? 'Answer recent stress' : 'Rispondi alla domanda sugli eventi recenti'
       if (q.type === 'scale' && !state.wellbeing[q.id]) {
         if (q.source === 'stress') e.stress = t.errors.stress
         else e.wellbeing = t.errors.wellbeing
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

  const renderMicroBlock = (type) => {
    if (type === 'A') {
      return (
        <div className="micro-survey" key="microA">
          <h5>{t.microA_Title}</h5>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '1. Does anxiety significantly interfere with your work or daily activities?' : '1. L\u2019ansia interferisce in modo significativo con il lavoro o le attività quotidiane?'}</label>
            <ScaleSelector questionId="A1" value={state.micro.A?.A1} onChange={(id, val) => handleMicroScale('A', 'A1', val)} options={scaleOptions} />
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '2. Have you ever had sudden attacks of intense fear with physical symptoms?' : '2. Hai mai avuto attacchi improvvisi di paura intensa con sintomi fisici?'}</label>
            <div className="radio-row">
              <div className="radio-item">
                <input id="A2_yes" className="radio-input" type="radio" name="A2" checked={state.micro.A?.A2 === 'yes'} onChange={() => handleMicroYesNo('A', 'A2', 'yes')} />
                <label htmlFor="A2_yes" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? 'Yes' : 'Sì'}</span></label>
              </div>
              <div className="radio-item">
                <input id="A2_no" className="radio-input" type="radio" name="A2" checked={state.micro.A?.A2 === 'no'} onChange={() => handleMicroYesNo('A', 'A2', 'no')} />
                <label htmlFor="A2_no" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? 'No' : 'No'}</span></label>
              </div>
            </div>
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '3. How often do you avoid situations because you fear having an anxiety attack?' : '3. Quanto spesso eviti situazioni per paura di avere un attacco di ansia?'}</label>
            <ScaleSelector questionId="A3" value={state.micro.A?.A3} onChange={(id, val) => handleMicroScale('A', 'A3', val)} options={scaleOptions} />
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '4. Do you have helpful strategies or treatments for managing anxiety?' : '4. Hai strategie o trattamenti utili per gestire l\u2019ansia?'}</label>
            <ScaleSelector questionId="A4" value={state.micro.A?.A4} onChange={(id, val) => handleMicroScale('A', 'A4', val)} options={scaleOptions} />
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '5. Do you feel that your anxiety has worsened in the last 3 months?' : '5. Ritieni che l\u2019ansia sia peggiorata negli ultimi 3 mesi?'}</label>
            <ScaleSelector questionId="A5" value={state.micro.A?.A5} onChange={(id, val) => handleMicroScale('A', 'A5', val)} options={scaleOptions} />
          </div>
          {errors.microA && <div className="error">{errors.microA}</div>}
        </div>
      )
    }
    if (type === 'B') {
      return (
        <div className="micro-survey" key="microB">
          <h5>{t.microB_Title}</h5>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '1. Do you feel lacking in energy or motivation most days?' : '1. Ti senti privo/a di energia o motivazione per la maggior parte dei giorni?'}</label>
            <ScaleSelector questionId="B1" value={state.micro.B?.B1} onChange={(id, val) => handleMicroScale('B', 'B1', val)} options={scaleOptions} />
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '2. Do you have difficulty enjoying activities that you used to enjoy?' : '2. Hai difficoltà a provare piacere nelle attività che prima gradivi?'}</label>
            <ScaleSelector questionId="B2" value={state.micro.B?.B2} onChange={(id, val) => handleMicroScale('B', 'B2', val)} options={scaleOptions} />
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '3. Do you have recurring thoughts that life is not worth living?' : '3. Hai pensieri ricorrenti che la vita non valga la pena?'}</label>
            <div style={{ marginTop: 8 }}>
              <ScaleSelector questionId="B3_scale" value={state.micro.B?.B3_scale} onChange={(id, val) => handleMicroScale('B', 'B3_scale', val)} options={scaleOptions} />
            </div>
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '4. Do you have trouble falling asleep, staying asleep, or do you sleep too much?' : '4. Hai difficoltà a dormire per rimanere sveglio/a o dormire troppo?'}</label>
            <ScaleSelector questionId="B4" value={state.micro.B?.B4} onChange={(id, val) => handleMicroScale('B', 'B4', val)} options={scaleOptions} />
          </div>
          <div className="form-row">
            <label className="question-label">{language === 'en' ? '5. Have these symptoms persisted for more than 2 weeks?' : '5. Questi sintomi sono persistenti da più di 2 settimane?'}</label>
            <div className="radio-row">
              <div className="radio-item">
                <input id="B5_yes" className="radio-input" type="radio" name="B5" checked={state.micro.B?.B5 === 'yes'} onChange={() => handleMicroYesNo('B', 'B5', 'yes')} />
                <label htmlFor="B5_yes" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? 'Yes' : 'Sì'}</span></label>
              </div>
              <div className="radio-item">
                <input id="B5_no" className="radio-input" type="radio" name="B5" checked={state.micro.B?.B5 === 'no'} onChange={() => handleMicroYesNo('B', 'B5', 'no')} />
                <label htmlFor="B5_no" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? 'No' : 'No'}</span></label>
              </div>
            </div>
          </div>
          {errors.microB && <div className="error">{errors.microB}</div>}
        </div>
      )
    }
    if (type === 'C') {
      return (
        <div className="micro-survey" key="microC">
          <h5>{t.microC_Title}</h5>
          {(language === 'en' ? microCEn : microCIt).map((txt, i) => (
            <div className="form-row" key={i}>
              <label className="question-label">{`${i+1}. ${txt}`}</label>
              <ScaleSelector questionId={`C${i+1}`} value={state.micro.C?.[`C${i+1}`]} onChange={(id, val) => handleMicroScale('C', `C${i+1}`, val)} options={scaleOptions} />
            </div>
          ))}
          {errors.microC && <div className="error">{errors.microC}</div>}
        </div>
      )
    }
    if (type === 'D') {
      return (
        <div className="micro-survey" key="microD">
          <h5>{t.microD_Title}</h5>
          {(language === 'en' ? microDEn : microDIt).map((txt, i) => (
            <div className="form-row" key={i}>
              <label className="question-label">{`${i+1}. ${txt}`}</label>
              <ScaleSelector questionId={`D${i+1}`} value={state.micro.D?.[`D${i+1}`]} onChange={(id, val) => handleMicroScale('D', `D${i+1}`, val)} options={scaleOptions} />
            </div>
          ))}
          {errors.microD && <div className="error">{errors.microD}</div>}
        </div>
      )
    }
    if (type === 'E') {
      return (
        <div className="micro-survey" key="microE">
          <h5>{t.microE_Title}</h5>
          {(language === 'en' ? microEEn : microEIt).map((txt, i) => (
            <div className="form-row" key={i}>
              <label className="question-label">{`${i+1}. ${txt}`}</label>
              <ScaleSelector questionId={`E${i+1}`} value={state.micro.E?.[`E${i+1}`]} onChange={(id, val) => handleMicroScale('E', `E${i+1}`, val)} options={scaleOptions} />
            </div>
          ))}
          {errors.microE && <div className="error">{errors.microE}</div>}
        </div>
      )
    }
    if (type === 'F') {
      return (
        <div className="micro-survey" key="microF">
          <h5>{t.microF_Title}</h5>
          {(language === 'en' ? microFEn : microFIt).map((txt, i) => (
            <div className="form-row" key={i}>
              <label className="question-label">{`${i+1}. ${txt}`}</label>
              <ScaleSelector questionId={`F${i+1}`} value={state.micro.F?.[`F${i+1}`]} onChange={(id, val) => handleMicroScale('F', `F${i+1}`, val)} options={scaleOptions} />
            </div>
          ))}
          {errors.microF && <div className="error">{errors.microF}</div>}
        </div>
      )
    }
    if (type === 'G') {
      return (
        <div className="micro-survey" key="microG">
          <h5>{t.microG_Title}</h5>
          {(language === 'en' ? microGEn : microGIt).map((txt, i) => (
            <div className="form-row" key={i}>
              <label className="question-label">{`${i+1}. ${txt}`}</label>
              <ScaleSelector questionId={`G${i+1}`} value={state.micro.G?.[`G${i+1}`]} onChange={(id, val) => handleMicroScale('G', `G${i+1}`, val)} options={scaleOptions} />
            </div>
          ))}
          {errors.microG && <div className="error">{errors.microG}</div>}
        </div>
      )
    }
    return null
  }

  // smooth scroll into view when chunk changes
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex, activeMicro])

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit} noValidate ref={formRef}>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {/* Triage UI as overlay */}
      {triageActive && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 12 }}>
          <div className="modal-card" style={{ width: 'min(780px, 95%)', background: 'linear-gradient(180deg, #1a1a2e, #1f2438)', color: '#f7f7fb', padding: 24, borderRadius: 16, boxShadow: '0 16px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h4 style={{ margin: '0 0 8px', color: '#fff' }}>{t.triageTitle}</h4>
                <p style={{ color: 'rgba(247,247,251,0.85)', margin: 0 }}>{t.triageText}</p>
              </div>
              <button type="button" onClick={() => setTriageActive(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }} aria-label="Close triage">×</button>
            </div>

            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <strong>{t.triageReasonsTitle}</strong>
              <ul style={{ margin: '6px 0 0 18px', color: 'rgba(247,247,251,0.9)' }}>
                {triageReasons.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <a href="tel:112" className="btn-primary" style={{ textDecoration: 'none' }}>{t.triageCall}</a>
              <button type="button" className="btn-primary" onClick={() => { window.open('https://www.salute.gov.it/servizi','_blank') }}>{t.triageContact}</button>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={triageConsent} onChange={(e) => setTriageConsent(e.target.checked)} />
                <span style={{ color: 'rgba(247,247,251,0.9)' }}>{t.triageConsent}</span>
              </label>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary" onClick={() => { setTriageActive(false); }}>{language === 'en' ? 'Close (return to questionnaire)' : 'Chiudi (torna al questionario)'}</button>
              <button type="button" className="btn-primary" onClick={handleSendAlert} disabled={!triageConsent || alertSent}>{alertSent ? (language === 'en' ? 'Alert sent' : 'Alert inviato') : (language === 'en' ? 'Send alert to clinical team' : 'Invia alert al team clinico')}</button>
              <button type="button" className="btn-primary" onClick={handleTriageProceed}>{language === 'en' ? 'Proceed anyway (I read the information)' : 'Procedi comunque (ho letto le informazioni)'}</button>
            </div>

            <p style={{ marginTop: 12, color: 'rgba(247,247,251,0.7)' }}><em>{language === 'en' ? 'Important: define local procedures and privacy/consent regulations before activating real contacts.' : 'Importante: definire procedure locali e normative di privacy/consenso prima di attivare contatti reali.'}</em></p>
          </div>
        </div>
      )}

      {/* Render only the current chunk */}
      {!activeMicro && slice.map((q) => {
        if (q.type === 'multiselect' && q.id === 'prelim') {
          return (
            <div className="form-row" key={q.id}>
              <label>{t.prelimQuestion1}</label>
              <div className="multi-grid">
                {(language === 'en' ? prelimEn : prelimIt).map(opt => (
                  <label key={opt.id} className="checkbox-item">
                    <input type="checkbox" checked={state.prelim.includes(opt.id)} onChange={() => togglePrelim(opt.id)} />
                    <span className="checkbox-text">{opt.text}</span>
                    {opt.id === 'p_altro' && state.prelim.includes('p_altro') && (
                      <input name="prelimAltro" placeholder={t.prelimAltroPlaceholder} value={state.prelimAltro} onChange={handleChange} style={{ marginLeft: 8 }} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )
        }

        if (q.type === 'treatment') {
          return (
            <div className="form-row" key={q.id}>
              <label>{t.treatmentQ}</label>
              <div className="radio-row">
                {treatmentOptions.map(opt => (
                  <div className="radio-item" key={opt.value}>
                    <input id={`treatment_${opt.value}`} className="radio-input" type="radio" name="treatment" value={opt.value} checked={state.treatment === opt.value} onChange={handleChange} />
                    <label htmlFor={`treatment_${opt.value}`} className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{opt.label}</span></label>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        if (q.type === 'recentStress') {
          return (
            <div className="form-row" key={q.id}>
              <label>{t.recentStressQ}</label>
              <div className="radio-row">
                <div className="radio-item">
                  <input id="recent_yes" className="radio-input" type="radio" name="recentStress" value="yes" checked={state.recentStress === 'yes'} onChange={handleChange} />
                  <label htmlFor="recent_yes" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? 'Yes' : 'Sì'}</span></label>
                </div>
                <div className="radio-item">
                  <input id="recent_no" className="radio-input" type="radio" name="recentStress" value="no" checked={state.recentStress === 'no'} onChange={handleChange} />
                  <label htmlFor="recent_no" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{language === 'en' ? 'No' : 'No'}</span></label>
                </div>
              </div>
              {state.recentStress === 'yes' && (
                <div style={{ marginTop: 8 }}>
                  <textarea name="recentStressDetails" placeholder={t.recentStressPlaceholder} value={state.recentStressDetails} onChange={handleChange} rows={3} style={{ width: '100%', padding: 8, borderRadius: 8 }} />
                </div>
              )}
            </div>
          )
        }

        if (q.type === 'scale') {
          const group = q.source === 'wellbeing' ? 'wellbeing' : (q.source === 'stress' ? 'wellbeing' : 'wellbeing')
          const showHeader = q.source === 'wellbeing' && q.id === wellbeingQs[0].id
          const showStressHeader = q.source === 'stress' && q.id === 's1'
          return (
            <div className="form-row" key={q.id}>
              {showHeader && <><h4>{t.wellbeingTitle}</h4><p className="small-muted">{t.wellbeingHint}</p></>}
              {showStressHeader && <><h4>{t.stressTitle}</h4><p className="small-muted">{t.stressHint}</p></>}
              <label className="question-label">{q.text}</label>
              <ScaleSelector questionId={q.id} value={state.wellbeing[q.id]} onChange={handleScale} options={scaleOptions} />
            </div>
          )
        }

        return null
      })}

      {activeMicro && renderMicroBlock(activeMicro)}

      {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}

      {/* pager info and controls (based on units) */}
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

      {/* errors */}
      {errors.wellbeing && <div className="error">{errors.wellbeing}</div>}
      {errors.microA && <div className="error">{errors.microA}</div>}
      {errors.microB && <div className="error">{errors.microB}</div>}
      {activeMicro && (errors.microC || errors.microD || errors.microE || errors.microF || errors.microG) && (
        <div className="error">{errors.microC || errors.microD || errors.microE || errors.microF || errors.microG}</div>
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
            <p style={{ color: '#444', marginBottom: 18 }}>{language === 'en' ? 'You completed the Psycho section.' : 'Hai completato la Sezione PsychoOmics.'}</p>
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
