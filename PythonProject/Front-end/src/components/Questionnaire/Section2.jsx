import React, { useState, useEffect, useContext } from 'react'
import './Section1.css'
import ScaleSelector from './ScaleSelector'
import { LanguageContext } from '../../LanguageContext'
import AllergyInput from './AllergyInput'

export default function Section2({ initial = {}, onChange = () => {}, onPrev = () => {}, onFinish = () => {}, allergyVariant = 'soft' }) {
  const { language } = useContext(LanguageContext)

  const medasIt = [
    { id: 'm1', text: 'Consumo quotidianamente olio d\u2019oliva (almeno 2\u20133 cucchiai al giorno).' },
    { id: 'm2', text: 'Mangio verdura o insalata a pranzo e a cena.' },
    { id: 'm3', text: 'Mangio almeno 2 porzioni di frutta al giorno.' },
    { id: 'm4', text: 'Limito il consumo di carne rossa o salumi.' },
    { id: 'm5', text: 'Evito burro, panna o margarina nei miei piatti abituali.' },
    { id: 'm6', text: 'Evito bevande zuccherate (bibite, cola, t\u00e8 freddo industriale, ecc.).' },
    { id: 'm7', text: 'Bevo vino in quantit\u00e0 moderate (1 bicchiere al giorno o meno).' },
    { id: 'm8', text: 'Consumo legumi (fagioli, ceci, lenticchie, piselli) pi\u00f9 volte a settimana.' },
    { id: 'm9', text: 'Mangio pesce o frutti di mare pi\u00f9 volte a settimana.' },
    { id: 'm9a', text: 'Integro correttamente la mia dieta con micronutrienti (es. B12, ferro, omega-3) se necessario.', veganOnly: true },
    { id: 'm10', text: 'Limito il consumo di dolci o prodotti da forno industriali.' },
    { id: 'm11', text: 'Preferisco carne bianca o pollame rispetto a carne rossa.' },
    { id: 'm11a', text: 'Consumo regolarmente fonti vegetali di proteine (legumi, tofu, tempeh, seitan).', veganOnly: true },
    { id: 'm12', text: 'Consumo frutta secca (noci, mandorle, nocciole) alcune volte a settimana.' },
  ]

  const medasEn = [
    { id: 'm1', text: 'I use olive oil daily (at least 2–3 tablespoons per day).' },
    { id: 'm2', text: 'I eat vegetables or salad for lunch and dinner.' },
    { id: 'm3', text: 'I eat at least 2 portions of fruit per day.' },
    { id: 'm4', text: 'I limit my consumption of red meat or cured meats.' },
    { id: 'm5', text: "I avoid butter, cream, or margarine in my usual dishes." },
    { id: 'm6', text: 'I avoid sugary drinks (soft drinks, cola, industrial iced tea, etc.).' },
    { id: 'm7', text: 'I drink wine in moderation (1 glass per day or less).' },
    { id: 'm8', text: 'I eat legumes (beans, chickpeas, lentils, peas) several times a week.' },
    { id: 'm9', text: 'I eat fish or seafood several times a week.' },
    { id: 'm9a', text: 'Vegan/Vegetarian: I supplement my diet with micronutrients (e.g., B12, iron, omega-3) as needed.', veganOnly: true },
    { id: 'm10', text: 'I limit my intake of sweets or processed baked goods.' },
    { id: 'm11', text: 'I prefer white meat or poultry over red meat.' },
    { id: 'm11a', text: 'Vegan/Vegetarian: I regularly consume plant-based sources of protein (legumes, tofu, tempeh, seitan).', veganOnly: true },
    { id: 'm12', text: 'I eat nuts (walnuts, almonds, hazelnuts) several times a week.' },
  ]

  const behaviorsIt = [
    { id: 'b1', text: 'Faccio colazione ogni mattina.' },
    { id: 'b2', text: 'Bevo almeno 1,5 litri d\u2019acqua al giorno.' },
    { id: 'b3', text: 'Aggiungo sale extra ai piatti gi\u00e0 pronti.', inverted: true },
    { id: 'b4', text: 'Bevo bevande zuccherate o gassate.', inverted: true },
    { id: 'b5', text: 'Consumo cibi pronti o fast food.', inverted: true },
    { id: 'b6', text: 'Mangio frutta o verdura in almeno due pasti della giornata.' },
  ]

  const behaviorsEn = [
    { id: 'b1', text: 'I eat breakfast every morning.' },
    { id: 'b2', text: 'I drink at least 1.5 liters of water per day.' },
    { id: 'b3', text: 'I add extra salt to ready-made meals. (Reverse response)', inverted: true },
    { id: 'b4', text: 'I drink sugary or carbonated drinks. (Reverse response)', inverted: true },
    { id: 'b5', text: 'I eat ready meals or fast food. (Reverse response)', inverted: true },
    { id: 'b6', text: 'I eat fruit or vegetables in at least two meals a day.' },
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

  const medas = language === 'en' ? medasEn : medasIt
  const behaviors = language === 'en' ? behaviorsEn : behaviorsIt
  const scaleOptions = language === 'en' ? scaleOptionsEn : scaleOptionsIt

  const texts = {
    it: {
      title: 'Sezione 2 — NutriOmics (Dieta)',
      intro: 'Indagine sulle abitudini alimentari e comportamenti legati all\'alimentazione.',
      dietLabel: 'Dieta',
      dietVegan: 'Sono vegano',
      dietVegetarian: 'Sono vegetariano',
      dietNo: 'No',
      allergyQ: 'Sei allergico a qualcosa?',
      allergyYes: 'Sì',
      allergyNo: 'No',
      allergyDetails: 'Specificare le allergie',
      medasHint: 'Per ogni voce scegli: Mai, Raramente, Qualche volta, Spesso, Sempre',
      behaviorsTitle: 'Comportamenti alimentari generali',
      behaviorsHint: 'Stessa scala; alcuni elementi sono inversi.',
      veganOnlyNote: ' (solo per vegani/vegetariani)',
      invertedNote: ' (risposta inversa)',
      back: 'Torna indietro',
      continue: 'Continua',
      successTitle: 'Fantastico! Sezione Nutrizione completata 🍎',
      proceed: 'Passa alla sezione successiva',
      errors: {
        diet: 'Seleziona un tipo di dieta',
        allergy: 'Rispondi alla domanda sulle allergie',
        allergyDetails: 'Specificare le allergie',
        responses: 'Rispondi a tutte le domande'
      }
    },
    en: {
      title: 'Section 2 — NutriOmics (Diet)',
      intro: 'Survey on eating habits, frequency of consumption of specific food groups, and behaviors related to nutrition.',
      dietLabel: 'Diet',
      dietVegan: 'I am vegan',
      dietVegetarian: 'I am vegetarian',
      dietNo: 'No',
      allergyQ: 'Are you allergic to anything?',
      allergyYes: 'Yes',
      allergyNo: 'No',
      allergyDetails: 'Yes (open answer), no (go to next question)',
      medasHint: 'For each item choose: Never, Rarely, Sometimes, Often, Always',
      behaviorsTitle: 'General eating habits',
      behaviorsHint: 'Same scale; some items are reverse-scored.',
      veganOnlyNote: ' (vegan/vegetarian only)',
      invertedNote: ' (reverse-scored)',
      back: 'Back',
      continue: 'Continue',
      successTitle: 'Great! Nutrition section completed 🍎',
      proceed: 'Go to next section',
      errors: {
        diet: 'Select a diet type',
        allergy: 'Answer the allergy question',
        allergyDetails: 'Please specify the allergies',
        responses: 'Answer all the questions'
      }
    }
  }

  const t = texts[language] || texts.it

  const [state, setState] = useState({ diet: initial.diet || '', allergy: initial.allergy || '', allergyDetails: initial.allergyDetails || '', responses: initial.responses || {} })
  const [errors, setErrors] = useState({})
  const [inlineMessage, setInlineMessage] = useState('')
  const [showOverlay, setShowOverlay] = useState(false)
  const [savedResult, setSavedResult] = useState(null)
  const formRef = React.useRef(null)

  // pagination for questions (5 per chunk)
  const SECTION_PAGE_SIZE = 5
  const [chunkIndex, setChunkIndex] = useState(0)

  // clamp/reset chunkIndex when diet/allergy change (avoid setState during render)
  useEffect(() => {
    // compute total based on current diet/allergy
    const medasFilteredLen = medas.filter(q => !(q.veganOnly && state.diet === 'no')).length
    let totalLen = medasFilteredLen + behaviors.length + 2 // diet + allergy
    if (state.allergy === 'yes') totalLen += 1 // allergyDetails
    const maxIdx = Math.max(0, Math.ceil(totalLen / SECTION_PAGE_SIZE) - 1)
    // reset to first chunk for better UX when meta questions change
    setChunkIndex(0)
    // ensure chunkIndex isn't out of bounds (will be 0 after reset)
  }, [state.diet, state.allergy])

  useEffect(() => {
    onChange(state)
  }, [state])

  // scroll form into view when chunk changes
  useEffect(() => {
    try {
      if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [chunkIndex])

  const handleChange = (e) => {
    const { name, value } = e.target
    // if switching diet to no, remove veganOnly responses
    if (name === 'diet' && value === 'no') {
      const veganIds = medas.filter(q => q.veganOnly).map(q => q.id)
      setState(s => {
        const cleaned = { ...s, [name]: value }
        const responses = { ...cleaned.responses }
        veganIds.forEach(id => { if (responses[id]) delete responses[id] })
        cleaned.responses = responses
        return cleaned
      })
      setErrors(prev => ({ ...prev, [name]: undefined, responses: undefined }))
      return
    }
    setState(s => ({ ...s, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleScale = (id, val) => {
    setState(s => ({ ...s, responses: { ...s.responses, [id]: val } }))
    setErrors(prev => ({ ...prev, responses: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!state.diet) e.diet = t.errors.diet
    if (!state.allergy) e.allergy = t.errors.allergy
    if (state.allergy === 'yes' && !state.allergyDetails) e.allergyDetails = t.errors.allergyDetails

    const applicable = [...medas.filter(q => !q.veganOnly), ...medas.filter(q => q.veganOnly && state.diet !== 'no'), ...behaviors]
    const missing = applicable.filter(q => !state.responses[q.id])
    if (missing.length > 0) e.responses = `${t.errors.responses} (${missing.length} ${language === 'en' ? 'missing' : 'mancanti'})`

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      setInlineMessage(language === 'en' ? 'Please answer all the required questions before continuing.' : 'Rispondi a tutte le domande obbligatorie prima di continuare.')
      return
    }
    setInlineMessage('')
    {
       // normalize inverted
       const original = { ...state.responses }
       const normalized = { ...original }
       behaviors.forEach(b => { if (b.inverted && normalized[b.id]) normalized[b.id] = 6 - normalized[b.id] })
       const toSave = { ...state, responsesOriginal: original, responsesNormalized: normalized }
       try { localStorage.setItem('questionnaire_section2', JSON.stringify(toSave)) } catch {}
       // show confirmation overlay; call onFinish only when user clicks proceed
       setSavedResult(toSave)
       setShowOverlay(true)
    }
  }

  const handleProceed = () => {
    setShowOverlay(false)
    if (savedResult) onFinish(savedResult)
  }

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit} noValidate ref={formRef}>
      <h3>{t.title}</h3>
      <p className="section-intro">{t.intro}</p>

      {/* Questions are combined (diet, allergy, optional allergyDetails, MEDAS then behaviors) and paginated in chunks */}
      {(() => {
        const medasFiltered = medas.filter(q => !(q.veganOnly && state.diet === 'no'))
        // Build combined questions array where each item has a `type` to decide rendering
        const combined = []
        combined.push({ id: 'diet', type: 'diet' })
        combined.push({ id: 'allergy', type: 'allergy' })
        if (state.allergy === 'yes') combined.push({ id: 'allergyDetails', type: 'text', label: t.allergyDetails })
        medasFiltered.forEach(m => combined.push({ ...m, type: 'scale', source: 'medas' }))
        behaviors.forEach(b => combined.push({ ...b, type: 'scale', source: 'behaviors' }))

        // Build units: group non-micro items into chunks, treat any micro* item as single unit
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
        const ci = Math.min(chunkIndex, Math.max(0, totalChunks - 1))
        const slice = units[ci] || []

        const isSliceComplete = () => {
          const missingErrors = {}
          const clearKeys = []
          slice.forEach(q => {
            if (q.type === 'diet') {
              if (!state.diet) missingErrors.diet = t.errors.diet; else clearKeys.push('diet')
            } else if (q.type === 'allergy') {
              if (!state.allergy) missingErrors.allergy = t.errors.allergy; else clearKeys.push('allergy')
            } else if (q.type === 'text') {
              if (!state.allergyDetails) missingErrors.allergyDetails = t.errors.allergyDetails; else clearKeys.push('allergyDetails')
            } else if (q.type === 'scale') {
              if (!(q.veganOnly && state.diet === 'no')) {
                if (!state.responses[q.id]) missingErrors.responses = t.errors.responses
                else clearKeys.push('responses')
              }
            }
          })
          setErrors(prev => {
            const next = { ...prev }
            clearKeys.forEach(k => { if (next[k]) delete next[k] })
            Object.entries(missingErrors).forEach(([k, v]) => { next[k] = v })
            return next
          })
          if (Object.keys(missingErrors).length) {
            setInlineMessage(language === 'en' ? 'Please answer all the questions on this page before proceeding.' : 'Rispondi a tutte le domande di questa pagina per procedere.')
          } else {
            setInlineMessage('')
          }
          return Object.keys(missingErrors).length === 0
        }

        return (
          <div>
            {slice.map((q, idx) => {
              const prev = idx > 0 ? slice[idx - 1] : null
              const showMedasHeader = q.type === 'scale' && q.source === 'medas' && (!prev || prev.source !== 'medas')
              const showBehaviorsHeader = q.type === 'scale' && q.source === 'behaviors' && (!prev || prev.source !== 'behaviors')

              return (
                <React.Fragment key={q.id}>
                  {showMedasHeader && (
                    <>
                      <h4> {language === 'en' ? 'Eating habits (MEDAS)' : 'Abitudini alimentari (MEDAS)'} </h4>
                      <p className="small-muted">{t.medasHint}</p>
                    </>
                  )}
                  {showBehaviorsHeader && (
                    <>
                      <h4>{t.behaviorsTitle}</h4>
                      <p className="small-muted">{t.behaviorsHint}</p>
                    </>
                  )}

                  {q.type === 'diet' && (
                    <div className="form-row" key={q.id}>
                      <label>{t.dietLabel}</label>
                      <div className="radio-row">
                        <div className="radio-item">
                          <input id="diet_vegan" className="radio-input" type="radio" name="diet" value="vegan" checked={state.diet === 'vegan'} onChange={handleChange} />
                          <label htmlFor="diet_vegan" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{t.dietVegan}</span></label>
                        </div>
                        <div className="radio-item">
                          <input id="diet_vegetarian" className="radio-input" type="radio" name="diet" value="vegetarian" checked={state.diet === 'vegetarian'} onChange={handleChange} />
                          <label htmlFor="diet_vegetarian" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{t.dietVegetarian}</span></label>
                        </div>
                        <div className="radio-item">
                          <input id="diet_no" className="radio-input" type="radio" name="diet" value="no" checked={state.diet === 'no'} onChange={handleChange} />
                          <label htmlFor="diet_no" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{t.dietNo}</span></label>
                        </div>
                      </div>
                      {errors.diet && <div className="error">{errors.diet}</div>}
                    </div>
                  )}

                  {q.type === 'allergy' && (
                    <div className="form-row" key={q.id}>
                      <label>{t.allergyQ}</label>
                      <div className="radio-row">
                        <div className="radio-item">
                          <input id="allergy_yes" className="radio-input" type="radio" name="allergy" value="yes" checked={state.allergy === 'yes'} onChange={handleChange} />
                          <label htmlFor="allergy_yes" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{t.allergyYes}</span></label>
                        </div>
                        <div className="radio-item">
                          <input id="allergy_no" className="radio-input" type="radio" name="allergy" value="no" checked={state.allergy === 'no'} onChange={handleChange} />
                          <label htmlFor="allergy_no" className="radio-label-wrapper"><span className="radio-custom" aria-hidden="true"></span><span className="radio-label">{t.allergyNo}</span></label>
                        </div>
                      </div>
                      {errors.allergy && <div className="error">{errors.allergy}</div>}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <div className="form-row" key={q.id}>
                      <label htmlFor="allergyDetails">{q.label}
                        <AllergyInput id="allergyDetails" name="allergyDetails" value={state.allergyDetails} onChange={handleChange} placeholder={q.label} variant={allergyVariant} />
                      </label>
                      {errors.allergyDetails && <div className="error">{errors.allergyDetails}</div>}
                    </div>
                  )}

                  {q.type === 'scale' && (
                    <div className="form-row" key={q.id}>
                      <label className="question-label">{q.text}{q.veganOnly ? t.veganOnlyNote : ''}{q.inverted ? t.invertedNote : ''}</label>
                      <ScaleSelector questionId={q.id} value={state.responses[q.id]} onChange={handleScale} options={scaleOptions} disabled={q.veganOnly && state.diet === 'no'} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}

            {inlineMessage && <div className="error" style={{ marginTop: 8 }}>{inlineMessage}</div>}

            {/* pager info for this section */}
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

          </div>
        )
      })()}

      {showOverlay && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-card" style={{ width: 'min(560px,90%)', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 12px', color: '#111' }}>{t.successTitle}</h2>
            <p style={{ color: '#444', marginBottom: 18 }}>{language === 'en' ? 'You completed the Nutrition section.' : 'Hai completato la Sezione Nutrizione.'}</p>
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
