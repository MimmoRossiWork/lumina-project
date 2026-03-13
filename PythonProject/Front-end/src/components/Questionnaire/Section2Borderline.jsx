import React, { useState, useEffect, useContext } from 'react'
import './Section2Borderline.css'
import ScaleSelector from './ScaleSelector'
import { LanguageContext } from '../../LanguageContext'

export default function Section2Borderline({ initial = {}, onPrev = () => {}, onFinish = () => {}, onChange = () => {} }) {
  const { language } = useContext(LanguageContext)

  const questionsIt = [
    { id: 't1', text: 'Ricorro a cibi pronti, snack confezionati o fast-food per mancanza di tempo.' },
    { id: 't2', text: 'Tendo a mangiare in modo disordinato (saltare pasti, mangiare velocemente) a causa dello stress o del lavoro.' },
    { id: 't3', text: 'Ho difficoltà a pianificare la spesa o a organizzare i pasti in anticipo.' },
    { id: 't4', text: 'Trovo faticoso o complicato cucinare ingredienti freschi (verdure, legumi) ogni giorno.' },
  ]

  const questionsEn = [
    { id: 't1', text: 'I resort to ready meals, packaged snacks, or fast food due to lack of time.' },
    { id: 't2', text: 'I tend to eat in a disorderly manner (skipping meals, eating quickly) due to stress or work.' },
    { id: 't3', text: "I find it difficult to plan my shopping or organize meals in advance." },
    { id: 't4', text: 'I find it tiring or complicated to cook fresh ingredients (vegetables, legumes) every day.' },
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

  const questions = language === 'en' ? questionsEn : questionsIt
  const scaleOptions = language === 'en' ? scaleEn : scaleIt

  const texts = {
    it: {
      title: 'Sezione 2.1 — NutriOmics (Borderline)',
      intro: 'Risposte aggiuntive per approfondire abitudini critiche.',
      errorMissing: 'Rispondi a tutte le domande',
      back: 'Torna indietro',
      continue: 'Continua'
    },
    en: {
      title: 'Section 2.1 — NutriOmics (Borderline)',
      intro: 'Additional responses to explore potentially critical habits.',
      errorMissing: 'Answer all the questions',
      back: 'Back',
      continue: 'Continue'
    }
  }
  const t = texts[language] || texts.it

  const [state, setState] = useState({ answers: initial.answers || {} })
  const [error, setError] = useState(null)

  useEffect(() => { onChange(state) }, [state])

  const handleSelect = (id, val) => {
    setState(s => ({ ...s, answers: { ...s.answers, [id]: val } }))
    setError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const missing = questions.filter(q => !state.answers[q.id])
    if (missing.length) { setError(`${t.errorMissing} (${missing.length} ${language === 'en' ? 'missing' : 'mancanti'})`); return }

    // valore considerato: il più alto tra le risposte
    const vals = Object.values(state.answers).map(v => Number(v))
    const max = Math.max(...vals)
    // find which question(s) have that value (pick first)
    const maxEntry = questions.find(q => Number(state.answers[q.id]) === max) || null
    const toSave = { ...state, max, maxId: maxEntry ? maxEntry.id : null, maxLabel: maxEntry ? maxEntry.text : null }
    try { localStorage.setItem('questionnaire_section2_borderline', JSON.stringify(toSave)) } catch {}
    onFinish(toSave)
  }

  return (
    <form className="questionnaire-form borderline" onSubmit={handleSubmit}>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {questions.map(q => (
        <div className="form-row" key={q.id}>
          <label className="question-label">{q.text}</label>
          <ScaleSelector questionId={q.id} value={state.answers[q.id]} onChange={handleSelect} options={scaleOptions} />
        </div>
      ))}

      {error && <div className="error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onPrev}>{t.back}</button>
        <button type="submit" className="btn-primary">{t.continue}</button>
      </div>
    </form>
  )
}
