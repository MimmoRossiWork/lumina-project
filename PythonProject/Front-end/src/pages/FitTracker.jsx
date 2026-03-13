import React, { useState, useMemo, useEffect, useRef, useContext } from 'react'
import { Clock, Activity, Check } from 'lucide-react'
import './FitTracker.css'
import { AuthContext } from '../AuthContext'

const API_BASE = import.meta?.env?.VITE_API_BASE || 'https://lumina-project-b1a9.onrender.com'

const ACTIVITY_META = {
  Corsa: { met: 10, message: "Ogni chilometro ti rende più forte della tua scusa migliore!" },
  "Camminata veloce": { met: 3.5, message: "Un passo alla volta, stai costruendo una versione migliore di te." },
  Ciclismo: { met: 8, message: "La vita è come andare in bicicletta: per mantenere l'equilibrio devi muoverti." },
  Nuoto: { met: 9, message: "Scivola nell'acqua e lascia che lo stress affondi." },
  "Allenamento pesi": { met: 6, message: "Il dolore di oggi è la forza di domani!" },
}

const STORAGE_KEYS = {
  steps: 'fittracker_steps',
  activity: 'fittracker_activity',
  minutes: 'fittracker_minutes',
  weight: 'fittracker_weight',
}
const STORAGE_DATE = 'fittracker_last_date'

function CustomSelect({ options = [], value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const ref = useRef(null)
  const highlighted = useRef(0)
  const prevValue = useRef(value)
  const closeTimer = useRef(null)
  const isOpenRef = useRef(open)

  // keep ref in sync with open state so the document listener sees the current value
  useEffect(() => { isOpenRef.current = open }, [open])

  useEffect(() => {
    function onDoc(e) {
      // only start closing if the dropdown is currently open
      if (ref.current && !ref.current.contains(e.target) && isOpenRef.current) {
        // animate close instead of immediate unmount
        startClose()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    highlighted.current = options.indexOf(value)
  }, [value, options])

  // helpers to animate open/close
  const startOpen = () => {
    clearTimeout(closeTimer.current)
    setClosing(false)
    setOpen(true)
  }
  const startClose = (delay = 180) => {
    // if already closing, restart timer
    setClosing(true)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, delay)
  }

  // Close dropdown if the selected value changes (covers click and keyboard selection)
  useEffect(() => {
    if (open && prevValue.current !== value) {
      startClose()
    }
    prevValue.current = value
  }, [value, open])

  const toggle = () => {
    if (open) startClose()
    else startOpen()
  }

  const handleKey = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { startOpen(); return }
    if (open) {
      if (e.key === 'ArrowDown') {
        highlighted.current = Math.min(options.length - 1, highlighted.current + 1)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        highlighted.current = Math.max(0, highlighted.current - 1)
        e.preventDefault()
      } else if (e.key === 'Enter') {
        const v = options[highlighted.current]
        if (v) onChange(v)
        startClose()
      } else if (e.key === 'Escape') {
        startClose()
      }
    }
  }

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
        onKeyDown={handleKey}
      >
        <span className="custom-select-value">{value}</span>
        <svg className={`custom-caret ${open ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {(open || closing) && (
        <ul className={`custom-options ${open && !closing ? 'open' : ''} ${closing ? 'closing' : ''}`} role="listbox" tabIndex={-1} aria-label={ariaLabel}>
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`custom-option ${opt === value ? 'selected' : ''} ${i === highlighted.current ? 'highlight' : ''}`}
              onClick={() => { onChange(opt); startClose() }}
            >
              <span>{opt}</span>
              {opt === value ? <Check size={14} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Hook per animare numeri (count-up / smooth interpolation)
function useAnimatedNumber(target, duration = 700) {
  const [display, setDisplay] = useState(target)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(target)
  const changedRef = useRef(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    // cancel running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const from = Number(fromRef.current) || 0
    const to = Number(target) || 0
    // if values are equal just set immediately (no animation)
    if (from === to) {
      setDisplay(to)
      // briefly pulse if change happened
      if (changedRef.current) {
        setPulse(true)
        const t = setTimeout(() => setPulse(false), Math.max(300, duration))
        return () => clearTimeout(t)
      }
      return
    }
    changedRef.current = true
    setPulse(true)
    startRef.current = null
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(1, elapsed / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const cur = from + (to - from) * eased
      setDisplay(cur)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        // end animation
        fromRef.current = to
        // remove pulse after short timeout so CSS can animate
        setTimeout(() => setPulse(false), 250)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [target, duration])

  // keep fromRef in sync for next animation start
  useEffect(() => { fromRef.current = Number(target) || 0 }, [])

  return [display, pulse]
}

export default function FitTracker() {
  const { user } = useContext(AuthContext)
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  // steps initial as empty string so when user types it doesn't start from 0
  const [steps, setSteps] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEYS.steps)
    return v != null ? v : ''
  })
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [serverTotals, setServerTotals] = useState({ caloriesBurned: undefined, activeMinutes: undefined })
  const [dayRolled, setDayRolled] = useState(false)

  // heading animation refs / state
  const headingRef = useRef(null)
  const ecgSvgRef = useRef(null)
  const timerRef = useRef(null)
  const [headingActive, setHeadingActive] = useState(false)
  const [svgWidth, setSvgWidth] = useState(220)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [activity, setActivity] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEYS.activity)
    return v || 'Corsa'
  })
  const [minutes, setMinutes] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEYS.minutes)
    return v ? Number(v) : 30
  })
  const [weight, setWeight] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEYS.weight)
    return v ? Number(v) : 70
  })

  // helper: reset all day states (steps + activity block) on date rollover
  const resetForNewDay = (newDate) => {
    setCurrentDate(newDate)
    setSteps('')
    setExercises([])
    setServerTotals({ caloriesBurned: undefined, activeMinutes: undefined })
    setActivity('Corsa')
    setMinutes(30)
    // keep last known weight
    setDayRolled(true)
    try {
      localStorage.setItem(STORAGE_KEYS.steps, '')
      localStorage.setItem(STORAGE_KEYS.activity, 'Corsa')
      localStorage.setItem(STORAGE_KEYS.minutes, '30')
      // do not override stored weight
      localStorage.setItem(STORAGE_DATE, newDate)
    } catch { /* ignore */ }
    setTimeout(() => setDayRolled(false), 3500)
  }

  // derived values
  const numericSteps = useMemo(() => Number(steps) || 0, [steps])
  const distanceKm = useMemo(() => numericSteps / 1000 * 0.7, [numericSteps])
  const stepProgress = useMemo(() => Math.min(100, Math.round(numericSteps / 10000 * 100)), [numericSteps])

  // pulse derived (avoid setState inside effect)
  const pulse = stepProgress >= 90 && stepProgress > 0

  // calories from steps: heuristic 0.04 kcal per step
  const stepsCalories = useMemo(() => numericSteps * 0.04, [numericSteps])

  const activityCalories = useMemo(() => {
    const meta = ACTIVITY_META[activity] || { met: 3.5 }
    const met = meta.met
    const mins = Number(minutes) || 0
    const cals = met * 3.5 * (Number(weight) || 70) / 200 * mins
    return cals
  }, [activity, minutes, weight])

  const totalCalories = useMemo(() => serverTotals?.caloriesBurned ?? (stepsCalories + activityCalories), [serverTotals, stepsCalories, activityCalories])

  const motivMsg = ACTIVITY_META[activity] ? ACTIVITY_META[activity].message : ''

  // Recommended calorie estimate based on weight (simple multiplier to match user example: 70kg -> ~800)
  const recommendedCalories = useMemo(() => Math.round((Number(weight) || 70) * 11.43), [weight])

  // Persist any changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.steps, String(steps))
      localStorage.setItem(STORAGE_KEYS.activity, String(activity))
      localStorage.setItem(STORAGE_KEYS.minutes, String(minutes))
      localStorage.setItem(STORAGE_KEYS.weight, String(weight))
    } catch {
      // ignore storage errors (e.g., private mode)
    }
  }, [steps, activity, minutes, weight])

  // New: animated values for smoother UI feedback
  const [animStepsCalories, stepsPulse] = useAnimatedNumber(stepsCalories, 700)
  const [animActivityCalories, activityPulse] = useAnimatedNumber(activityCalories, 700)
  const [animTotalCalories, totalPulse] = useAnimatedNumber(totalCalories, 700)
  const [animDistanceKm] = useAnimatedNumber(distanceKm, 700)

  // animate motivation text when activity changes
  const [activityAnim, setActivityAnim] = useState(false)
  useEffect(() => {
    setActivityAnim(true)
    const t = setTimeout(() => setActivityAnim(false), 3000)
    return () => clearTimeout(t)
  }, [activity])

  // New: measure svg width for runner travel calculation
  useEffect(() => {
    function update() {
      const w = ecgSvgRef.current?.getBoundingClientRect().width || 220
      setSvgWidth(w)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Trigger heading animation (used on click/touch)
  const triggerHeadingAnim = () => {
    if (prefersReducedMotion) return
    setHeadingActive(true)
    clearTimeout(timerRef.current)
    // duration slightly longer than CSS transitions (match ~1100-1300ms)
    timerRef.current = setTimeout(() => setHeadingActive(false), 1400)
  }

  // cleanup timer on unmount
  useEffect(() => () => { clearTimeout(timerRef.current) }, [])

  // helper steppers
  const clamp = (v, min = 0, max = 1000000) => Math.max(min, Math.min(max, v))

  const persistSteps = (nextSteps) => {
    if (!user?.id) return
    const caloriesFromSteps = (Number(nextSteps) || 0) * 0.04
    const payload = {
      userId: user.id,
      date: currentDate,
      count: Number(nextSteps) || 0,
      caloriesFromSteps,
    }
    fetch(`${API_BASE}/api/v1/fit/steps`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(() => fetchDay())
      .catch(() => {})
  }

  // Nuova funzione: reset dei passi (azzera anche nel DB)
  const resetSteps = () => {
    // aggiornamento UI/localStorage immediato
    setSteps('')
    try { localStorage.setItem(STORAGE_KEYS.steps, '') } catch {}

    if (!user?.id) return
    const payload = {
      userId: user.id,
      date: currentDate,
      count: 0,
      caloriesFromSteps: 0,
    }
    fetch(`${API_BASE}/api/v1/fit/steps`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(() => fetchDay(currentDate))
      .then(() => {
        // notify other parts of the app (Home widget) that steps changed
        try {
          window.dispatchEvent(new CustomEvent('fittracker:updated', { detail: { steps: 0, date: currentDate } }))
        } catch (e) {
          // ignore dispatch errors
        }
      })
      .catch(() => {})
  }

  const incSteps = (delta = 100) => {
    const base = Number(steps) || 0
    const next = clamp(base + delta)
    setSteps(String(next))
    persistSteps(next)
  }
  const decSteps = (delta = 100) => {
    const base = Number(steps) || 0
    const next = clamp(base - delta)
    setSteps(String(next))
    persistSteps(next)
  }

  const incMinutes = (delta = 5) => setMinutes((m) => clamp(Number(m) + delta, 0, 1440))
  const decMinutes = (delta = 5) => setMinutes((m) => clamp(Number(m) - delta, 0, 1440))

  const incWeight = (delta = 1) => setWeight((w) => clamp(Number(w) + delta, 30, 300))
  const decWeight = (delta = 1) => setWeight((w) => clamp(Number(w) - delta, 30, 300))

  // input handlers: keep only digits for steps and remove leading zeros
  const handleStepsChange = (value) => {
    const cleaned = String(value).replace(/\D+/g, '')
    // remove leading zeros so input doesn't start with 0
    const noLeading = cleaned.replace(/^0+(?=\d)/, '')
    setSteps(noLeading)
    persistSteps(noLeading)
  }

  const persistExercise = () => {
    if (!user?.id) return
    const caloriesCalculated = Math.round(activityCalories)
    const payload = {
      userId: user.id,
      date: currentDate,
      exercise: {
        activityId: null,
        name: activity,
        durationMinutes: Number(minutes) || 0,
        inputWeight: Number(weight) || null,
        caloriesCalculated,
        time: new Date().toISOString().slice(11, 16),
      },
    }
    fetch(`${API_BASE}/api/v1/fit/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(() => fetchDay())
      .catch(() => {})
  }

  const deleteExercise = (index) => {
    if (!user?.id) return
    fetch(`${API_BASE}/api/v1/fit/exercise`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, date: currentDate, index })
    })
      .then(() => fetchDay(currentDate))
      .catch(() => {})
  }

  const fetchDay = (dateStr = currentDate) => {
    if (!user?.id) return
    setLoading(true)
    fetch(`${API_BASE}/api/v1/fit/day/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, date: dateStr })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('fetch day failed')
        const data = await res.json()
        setSteps(String(data.steps?.count ?? ''))
        setExercises(data.exercises || [])
        setServerTotals(data.dailyTotals || { caloriesBurned: undefined, activeMinutes: undefined })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDay(currentDate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentDate])

  useEffect(() => {
    const savedDate = localStorage.getItem(STORAGE_DATE)
    const todayStr = new Date().toISOString().slice(0, 10)
    if (savedDate !== todayStr) {
      resetForNewDay(todayStr)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const todayStr = new Date().toISOString().slice(0, 10)
      if (todayStr !== currentDate) {
        resetForNewDay(todayStr)
        fetchDay(todayStr)
      }
    }, 60000)
    return () => clearInterval(id)
  }, [currentDate])

  return (
    <div className={`fit-root`}>
      <header className="fit-header">
        {dayRolled && <div className="info-banner">Nuovo giorno: dati azzerati e sincronizzati.</div>}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1
            ref={headingRef}
            className={`ecg-heading ${headingActive ? 'active' : ''}`}
            aria-label="Il Mio Fitness Tracker"
            onMouseEnter={() => { if (!prefersReducedMotion) setHeadingActive(true) }}
            onMouseLeave={() => { if (!prefersReducedMotion) setHeadingActive(false) }}
            onClick={triggerHeadingAnim}
            onTouchStart={() => triggerHeadingAnim()}
          >
             <span className="heading-text">Il Mio Fitness Tracker</span>
            {/* SVG ECG: apparirà e verrà animato al passaggio del mouse */}
            <svg ref={ecgSvgRef} className="ecg-svg" viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="ecg-path"
                d="M0 12 L18 12 L26 6 L34 20 L42 12 L66 12 L74 6 L82 20 L90 12 L110 12 L118 6 L126 20 L134 12 L200 12"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDashoffset: 0 }}
              />
            </svg>
            {/* small heart that appears near the title on hover */}
            <svg className="ecg-heart" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 21s-7-4.35-9-7.11C0.9 10.54 3 7 6.5 7c2 0 3.5 1.5 5.5 3.5C13 8.5 14.5 7 16.5 7 20 7 22.1 10.54 21 13.89 19 16.65 12 21 12 21z" fill="currentColor" />
            </svg>
            {/* small runner stick-figure that travels across the ECG when active */}
            <svg
              className="ecg-runner"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
              style={{
                transform: `translateX(${Math.max(6, (svgWidth - 24) * (Math.min(100, Math.max(0, (Number(stepProgress) || 0))) / 100))}px)`,
                opacity: prefersReducedMotion ? 0 : 1,
                transition: prefersReducedMotion ? 'none' : 'transform 1100ms cubic-bezier(.2,.9,.3,1), opacity 260ms ease'
              }}
            >
               <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                 <circle cx="4" cy="4" r="2" fill="currentColor" />
                 <path d="M6 6 L9 8 L11 7" />
                 <path d="M9 8 L10 12" />
                 <path d="M10 12 L8 14" />
                 <path d="M11 9 L13 10" />
               </g>
             </svg>
          </h1>
           </div>
         <div className="fit-date"><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {new Date().toLocaleDateString()}</div>
         </div>
       </header>

       <main className="fit-main">
        <section className="card steps-card">
          <div className="card-title"><Activity size={16} style={{ marginRight: 8 }} /> Contapassi</div>

          <label className="field">
            <span>Passi</span>
            <div className="stepper">
              <button type="button" className="stepper-btn" onClick={() => decSteps(100)} aria-label="Decrementa passi"><span className="stepper-symbol">−</span></button>
               <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Inserisci passi"
                value={steps}
                onChange={(e) => handleStepsChange(e.target.value)}
                aria-label="Inserisci passi"
              />
              <button type="button" className="stepper-btn" onClick={() => incSteps(100)} aria-label="Incrementa passi"><span className="stepper-symbol">+</span></button>
             </div>
          </label>

          <div className="distance">Distanza stimata: <strong>{Number(animDistanceKm).toFixed(2)} km</strong></div>

          <div className="progress-wrap" aria-hidden>
            <div className="progress-bar">
              <div className={`progress-fill ${pulse ? 'pulse' : ''}`} style={{ width: `${stepProgress}%` }} />
            </div>
            <div className="progress-meta">{numericSteps.toLocaleString()} / 10.000 passi ({stepProgress}%)</div>
            {/* Reset button aligned under the progress text */}
            <div className="reset-wrap">
              <button id="reset-steps-btn" data-testid="reset-steps" type="button" className="btn small" onClick={resetSteps} aria-label="Reset passi">Reset passi</button>
            </div>
          </div>
        </section>

        <section className="card activity-card">
          <div className="card-title">Tracking Attività</div>

          <label className="field">
            <span>Attività</span>
            <CustomSelect options={Object.keys(ACTIVITY_META)} value={activity} onChange={setActivity} ariaLabel="Seleziona attività" />
          </label>

          <label className="field">
            <span>Durata (minuti)</span>
            <div className="stepper">
              <button type="button" className="stepper-btn" onClick={() => decMinutes(5)} aria-label="Decrementa minuti"><span className="stepper-symbol">−</span></button>
               <input type="number" min="0" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
              <button type="button" className="stepper-btn" onClick={() => incMinutes(5)} aria-label="Incrementa minuti"><span className="stepper-symbol">+</span></button>
             </div>
           </label>

          <label className="field">
            <span>Peso (kg)</span>
            <div className="stepper">
              <button type="button" className="stepper-btn" onClick={() => decWeight(1)} aria-label="Decrementa peso"><span className="stepper-symbol">−</span></button>
               <input type="number" min="30" max="300" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              <button type="button" className="stepper-btn" onClick={() => incWeight(1)} aria-label="Incrementa peso"><span className="stepper-symbol">+</span></button>
             </div>
             <div className="recommended-calories">Stima consumo consigliato: <strong>{recommendedCalories} kcal</strong></div>
           </label>

          <div className="calcs">
            <div>Calorie attività: <strong className={`count-up ${activityPulse ? 'flash' : ''}`}>{Number(animActivityCalories).toFixed(0)}</strong> kcal</div>
            <div className={`motivation ${activityAnim ? 'fade-in' : ''}`}>{motivMsg}</div>
            <div style={{ marginTop: 10 }}>
              <button type="button" className="btn primary" onClick={persistExercise} disabled={!user?.id}>Salva attività nel diario</button>
            </div>
          </div>
        </section>

        <aside className="card results-card">
          <div className="card-title">Dashboard Risultati 🎯</div>
          <div className="result-row">
            <div>Calorie passi</div>
            <div><strong className={`count-up ${stepsPulse ? 'flash' : ''}`}>{Number(animStepsCalories).toFixed(0)} kcal</strong></div>
          </div>
          <div className="result-row">
            <div>Calorie attività</div>
            <div><strong className={`count-up ${activityPulse ? 'flash' : ''}`}>{Number(animActivityCalories).toFixed(0)} kcal</strong></div>
          </div>

          <hr />

          <div className={`result-total ${totalPulse ? 'flash' : ''}`}>
            Totale giornaliero: <strong className={`count-up ${totalPulse ? 'flash' : ''}`}>{Number(totalCalories).toFixed(0)} kcal</strong>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Attivi: {Number(serverTotals.activeMinutes || 0).toFixed(0)} min</div>
          </div>

          <div className="card-title" style={{ marginTop: 16 }}>Attività di oggi</div>
          {loading ? (
            <div className="empty">Caricamento...</div>
          ) : (exercises && exercises.length > 0 ? (
            <ul className="entries">
              {exercises.map((ex, idx) => (
                <li key={`${ex.name}-${idx}`} className="entry neutral">
                  <div className="entry-main">
                    <div>
                      <div className="entry-name">{ex.name}</div>
                      <div className="entry-desc">Durata: {ex.durationMinutes} min — Peso: {ex.inputWeight ?? '-'} kg</div>
                    </div>
                    <div className="entry-side">
                      <div className="entry-cal">{ex.caloriesCalculated} kcal</div>
                      <div className="entry-meal">Ora: {ex.time || '-'}</div>
                    </div>
                  </div>
                  <div className="entry-meta" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn small" onClick={() => deleteExercise(idx)}>Elimina</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">Nessuna attività salvata per oggi.</div>
          ))}
         </aside>
       </main>

     </div>
   )
 }
