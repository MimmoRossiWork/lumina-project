import React, { useState, useEffect, useContext, useRef } from 'react'
import './Section2Clinical.css'
import ScaleSelector from './ScaleSelector'
import { LanguageContext } from '../../LanguageContext'

export default function Section2Clinical({ initial = {}, onPrev = () => {}, onFinish = () => {}, onChange = () => {} }) {
  const { language } = useContext(LanguageContext)

  // pagination: uniform chunks of 5 questions
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)
  const formRef = useRef(null)

  const questionsIt = [
    { id: 'q1', text: 'Sento di non riuscire a smettere di mangiare o di non controllare cosa e quanto mangio.' },
    { id: 'q2', text: 'Provo un forte senso di colpa dopo aver mangiato.' },
    { id: 'q3', text: 'Evito di mangiare anche quando ho fame.' },
    { id: 'q4', text: 'Mangio grandi quantità di cibo in poco tempo.' },
    { id: 'q5', text: 'Ho molto paura di ingrassare.' },
    { id: 'q6', text: 'Il pensiero del cibo o delle calorie occupa gran parte della mia giornata.' },
    { id: 'q7', text: 'Sento che il cibo controlla la mia vita.' },
    { id: 'q8', text: 'Faccio ginnastica o sport unicamente per bruciare calorie.' },
    { id: 'q9', text: 'Vomito o uso lassativi dopo aver mangiato per controllare il peso.' },
    { id: 'q10', text: 'Mangio quando mi sento ansioso/a, depresso/a o solo/a.' },
  ]

  const questionsEn = [
    { id: 'q1', text: "Behavior and control: I feel like I can't stop eating or control what and how much I eat" },
    { id: 'q2', text: 'I feel very guilty after eating' },
    { id: 'q3', text: 'I avoid eating even when I am hungry' },
    { id: 'q4', text: 'I eat large amounts of food in a short period of time' },
    { id: 'q5', text: 'Obsession with food and body: I am very afraid of gaining weight' },
    { id: 'q6', text: 'Thoughts about food or calories occupy a large part of my day' },
    { id: 'q7', text: 'I feel that food controls my life.' },
    { id: 'q8', text: 'I exercise or play sports solely to burn calories' },
    { id: 'q9', text: 'I vomit or use laxatives after eating to control my weight' },
    { id: 'q10', text: 'I eat when I feel anxious, depressed, or lonely.' },
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

  const questions = language === 'en' ? questionsEn : questionsIt
  const scaleOptions = language === 'en' ? scaleOptionsEn : scaleOptionsIt

  const texts = {
    it: {
      title: 'Sezione 2.2 — NutriOmics (Valutazione clinica DCA)',
      intro: 'Approfondimento per valutare la presenza di segnali di disturbo del comportamento alimentare. Le risposte sono confidenziali.',
      missing: 'Rispondi a tutte le domande',
      redFlagTitle: 'Avviso di sicurezza',
      redFlagText: 'I tuoi risultati indicano segni compatibili con un disturbo del comportamento alimentare. Questo può richiedere una valutazione specialistica.',
      redFlagAction: 'Ho capito, procedi',
      back: 'Back',
      finish: 'Finish Section 2.2'
    },
    en: {
      title: 'Section 2.2 — NutriOmics (Clinical assessment ED)',
      intro: 'In-depth assessment to screen for indicators of eating disorders. Responses are confidential.',
      missing: 'Answer all the questions',
      redFlagTitle: 'Safety notice',
      redFlagText: 'Your results indicate signs compatible with an eating disorder. This may require specialist assessment.',
      redFlagAction: "I understand, proceed",
      back: 'Back',
      finish: 'Finish Section 2.2'
    }
  }
  const t = texts[language] || texts.it

  const [state, setState] = useState({ answers: initial.answers || {} })
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [inlineMessage, setInlineMessage] = useState('')

  useEffect(() => { onChange(state) }, [state])

  // scroll into view when chunk changes
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const handleSelect = (id, val) => {
    setState(s => ({ ...s, answers: { ...s.answers, [id]: val } }))
    setError(null)
  }

  // build uniform units (chunks) from questions
  const buildUnits = (items) => {
    const units = []
    for (let i = 0; i < items.length; i += SECTION_PAGE_SIZE) {
      units.push(items.slice(i, i + SECTION_PAGE_SIZE))
    }
    return units
  }

  const units = buildUnits(questions)
  const totalChunks = Math.max(1, units.length)
  const ci = Math.min(Math.max(0, chunkIndex), Math.max(0, totalChunks - 1))
  const slice = units[ci] || []

  function computeResults(answers) {
    // original numeric values
    const origVals = questions.map(q => Number(answers[q.id] || 0))
    if (origVals.length !== questions.length || origVals.some(n => n < 1 || n > 5)) return null

    // normalized (inverted): mai=5, sempre=1 => normalized = 6 - orig
    const normVals = origVals.map(v => 6 - v)

    const meanNorm = normVals.reduce((a,b) => a + b, 0) / normVals.length
    const score = Math.round(25 * (meanNorm - 1))

    // keep original sum for clinical thresholds (higher original sum -> higher risk)
    const sumOrig = origVals.reduce((a,b) => a + b, 0)

    // interpretation by score (0-100) based on normalized mean
    let category = null
    if (score >= 60) category = language === 'en' ? 'Low risk — probably bad habits' : 'Rischio basso — probabilmente cattive abitudini'
    else if (score >= 40) category = language === 'en' ? 'Moderate risk — possible dysfunctional behaviours' : 'Rischio moderato — comportamenti disfunzionali possibili'
    else category = language === 'en' ? 'High risk — probable eating disorder' : 'Rischio elevato — possibile disturbo alimentare'

    // interpretation by original sum (10-50): higher sum means higher risk
    let sumCategory = null
    if (sumOrig >= 30) sumCategory = language === 'en' ? 'High Risk (>=30) — Clinical Red Flag' : 'Rischio Alto (>=30) — Red Flag Clinica'
    else if (sumOrig >= 20) sumCategory = language === 'en' ? 'Moderate Risk (20-29) — Emotional Eater' : 'Rischio Moderato (20-29) — Emotional Eater'
    else sumCategory = language === 'en' ? 'Low Risk (10-19) — Bad Habits' : 'Rischio Basso (10-19) — Cattive Abitudini'

    // Red flag override: if q1 or q9 original >=4 immediate high risk
    const redFlag = (Number(answers['q1']) >= 4) || (Number(answers['q9']) >= 4)

    return { mean: meanNorm, score, sum: sumOrig, category, sumCategory, redFlag }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const missing = questions.filter(q => !state.answers[q.id])
    if (missing.length) { setError(`${t.missing} (${missing.length} ${language === 'en' ? 'missing' : 'mancanti'})`); setInlineMessage(language === 'en' ? 'Please answer all the questions before continuing.' : 'Rispondi a tutte le domande prima di continuare.'); return }
    setInlineMessage('')

    const res = computeResults(state.answers)
    const finalObj = { answers: state.answers, ...res }
    setResult(finalObj)

    try { localStorage.setItem('questionnaire_section2_clinical', JSON.stringify(finalObj)) } catch {}

    // if redFlag, show modal and wait for confirmation before calling onFinish
    if (finalObj.redFlag) {
      setShowModal(true)
      return
    }

    // otherwise proceed immediately
    onFinish(finalObj)
  }

  const confirmProceed = () => {
    setShowModal(false)
    if (result) onFinish(result)
  }

  const isSliceComplete = () => {
    const missing = slice.filter(q => !state.answers[q.id])
    if (missing.length) {
      setError(`${t.missing} (${missing.length} ${language === 'en' ? 'missing' : 'mancanti'})`)
      setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
      return false
    }
    setInlineMessage('')
    return true
  }

  return (
    <>
      <form className="questionnaire-form clinical" onSubmit={handleSubmit} ref={formRef}>
        <h3>{t.title}</h3>
        <p className="section-intro">{t.intro}</p>

        {slice.map(q => (
          <div className="form-row" key={q.id}>
            <label className="question-label">{q.text}</label>
            <ScaleSelector questionId={q.id} value={state.answers[q.id]} onChange={handleSelect} options={scaleOptions} />
          </div>
        ))}

        {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}
         {error && <div className="error">{error}</div>}

        {result && (
          <div className="clinical-result">
            <h4>{language === 'en' ? 'Quick result' : 'Risultato rapido'}</h4>
            <div>Mean: {result.mean.toFixed(2)}</div>
            <div>Score (0-100): {result.score}</div>
            <div>Sum: {result.sum}</div>
            <div>{language === 'en' ? 'Interpretation (score):' : 'Interpretazione (score):'} {result.category}</div>
            <div>{language === 'en' ? 'Interpretation (sum):' : 'Interpretazione (sum):'} {result.sumCategory}</div>
            {result.redFlag && <div className="redflag">{language === 'en' ? 'Red Flag activated — recommend specialist assessment' : 'Red Flag attivata — raccomandare valutazione specialistica'}</div>}
          </div>
        )}

        {/* pager info and controls (only when more than one chunk) */}
        {totalChunks > 1 && (
          <div className="section-pager" style={{ marginTop: 12 }}>
            <div className="pager-info">Pagina {ci + 1} di {totalChunks} — Elementi in pagina: {slice.length}</div>
            <div className="pager-controls">
              {ci > 0 ? (
                <button type="button" className="pager-btn" onClick={() => setChunkIndex(ci - 1)}>Indietro</button>
              ) : <div style={{ width: 86 }} />}

              {ci < totalChunks - 1 ? (
                <button type="button" className="pager-btn" onClick={() => { if (isSliceComplete()) setChunkIndex(ci + 1) }}>Avanti</button>
              ) : (
                <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{t.finish}</button>
              )}
            </div>
          </div>
        )}

        {/* fallback actions when only one chunk (small screens / few questions) */}
        {totalChunks === 1 && (
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onPrev}>{t.back}</button>
            <button type="submit" className="btn-primary" onClick={(e) => { if (!isSliceComplete()) { e.preventDefault(); return } }}>{t.finish}</button>
          </div>
        )}
      </form>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t.redFlagTitle}</h3>
            <p>{t.redFlagText}</p>
            <p>{language === 'en' ? 'If you are in danger or need immediate assistance, contact local emergency services or a healthcare professional.' : 'Se ti senti in pericolo o hai bisogno di assistenza immediata, contatta i servizi di emergenza locali o un professionista sanitario.'}</p>
            <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>{language === 'en' ? 'Go back' : 'Torna indietro'}</button>
              <button className="btn-primary" onClick={confirmProceed}>{t.redFlagAction}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
