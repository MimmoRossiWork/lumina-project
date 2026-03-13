import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import RadarChart from '../components/Dashboard/RadarChart'
import AdaptiveCard from '../components/Dashboard/AdaptiveCard'
import { AuthContext } from '../AuthContext'


// Frasi motivazionali per il saluto
const MOTIVATIONAL_PHRASES = [
  'Ogni piccolo passo conta nel tuo percorso di benessere.',
  'Oggi è un nuovo giorno per prenderti cura di te.',
  'Il tuo benessere è la priorità più importante.',
  'Sii gentile con te stesso, stai facendo del tuo meglio.',
  'La costanza è la chiave del successo.',
]

// Componente per le card del check-in con animazione fade-out
function CheckInCard({ title, type = 'mood', onAnswer }) {
  const [answered, setAnswered] = useState(false)
  const [fading, setFading] = useState(false)
  const [value, setValue] = useState(null)

  const handleAnswer = (val) => {
    setValue(val)
    setFading(true)
    setTimeout(() => {
      setAnswered(true)
      if (onAnswer) onAnswer(val)
    }, 300)
  }

  if (answered) {
    return (
      <div className="checkin-card saved">
        <div className="saved-message">✓ Salvato</div>
      </div>
    )
  }

  return (
    <div className={`checkin-card ${fading ? 'fading' : ''}`}>
      <h4>{title}</h4>
      {type === 'mood' && (
        <div className="mood-buttons">
          {['😞', '😕', '😐', '🙂', '😊'].map((emoji, idx) => (
            <button key={idx} className="mood-btn" onClick={() => handleAnswer(idx + 1)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
      {type === 'energy' && (
          <div className="sleep-input"> {/* Puoi rinominare la classe CSS se vuoi, o tenere sleep-input per lo stile */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
              <span>Scarico 🪫</span>
              <span>Carico ⚡</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              defaultValue="5"
              onChange={(e) => setValue(e.target.value)}
              onMouseUp={() => handleAnswer(Number(value || 5))}
              onTouchEnd={() => handleAnswer(Number(value || 5))}
              onBlur={() => handleAnswer(Number(value || 5))}
              className="sleep-slider" // Riutilizza lo stile dello slider
            />
            <div className="sleep-value">{value || 5} / 10</div>
            <button className="submit-btn" onClick={() => handleAnswer(value || 5)}>
              Conferma
            </button>
          </div>
        )}
      {type === 'sport' && (
        <div className="sport-buttons">
          <button className="sport-btn yes" onClick={() => handleAnswer('yes')}>
            Sì ✓
          </button>
          <button className="sport-btn no" onClick={() => handleAnswer('no')}>
            No
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useContext(AuthContext)
  const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  // Usa la data locale (en-CA => YYYY-MM-DD) per evitare sfasamenti UTC
  const getTodayLocal = () => new Date().toLocaleDateString('en-CA')

  const getTodayStored = () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const checkIns = JSON.parse(localStorage.getItem('daily_checkins') || '{}')
      const todayAnswers = checkIns[today] || {}
      const completed =
        todayAnswers.mood !== undefined &&
        todayAnswers.sleep !== undefined &&
        todayAnswers.sport !== undefined
      return { todayAnswers, completed }
    } catch (e) {
      return { todayAnswers: {}, completed: false }
    }
  }

  const { todayAnswers: initialAnswers, completed: initialCompleted } = getTodayStored()

  const [storedTodayAnswers, setStoredTodayAnswers] = useState(initialAnswers)

  const sample = [75, 60, 80, 70, 55, 65]
  const [data, setData] = useState(sample)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [motivationalPhrase] = useState(
    MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]
  )

  // Stati per i mini-widget tracker
  const [trackerData, setTrackerData] = useState({
    food: { current: 0, goal: 2000 },
    fit: { steps: 0 },
    sleep: { hours: 0 },
    mind: { level: 'N/A' },
  })

  // Stati per il check-in
  const [checkinValues, setCheckinValues] = useState({
    mood: initialAnswers.mood ?? null,
    sleep: initialAnswers.sleep ?? null,
    sport: initialAnswers.sport ?? null,
  })
  const [checkinError, setCheckinError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTodayCheckin, setHasTodayCheckin] = useState(initialCompleted)
  const [checkinVersion, setCheckinVersion] = useState(0)
  const [isEditingCheckin, setIsEditingCheckin] = useState(false)

  // Funzioni per salvare i dati del check-in
  const saveCheckIn = (type, value) => {
    const today = new Date().toISOString().split('T')[0]
    const checkIns = JSON.parse(localStorage.getItem('daily_checkins') || '{}')
    if (!checkIns[today]) checkIns[today] = {}
    checkIns[today][type] = value
    localStorage.setItem('daily_checkins', JSON.stringify(checkIns))

    const nextValues = { ...checkinValues, [type]: value }
    setCheckinValues(nextValues)
    setCheckinError('')
  }

  const submitDailyCheckIn = async (values) => {
    if (!user || !user.id) return
    // map `values.sleep` (from the UI/localStorage) to `sleepHours` expected by the API
    const payload = {
      userId: user.id,
      mood: Number(values.mood),
      sleepHours: Number(values.sleep),
      sport: values.sport === true || values.sport === 'yes',
    }
    // validate required numeric fields
    if (Number.isNaN(payload.mood) || Number.isNaN(payload.sleepHours)) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/checkin/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Errore durante il salvataggio del check-in')
      }
      await res.json().catch(() => ({}))
      setLastUpdated(new Date().toLocaleString())
      // update local stored answers consistently using `sleep` key
      setStoredTodayAnswers({ mood: payload.mood, sleep: payload.sleepHours, sport: payload.sport })
      setHasTodayCheckin(true)
      setIsEditingCheckin(false)
    } catch (e) {
      setCheckinError(e.message || 'Errore durante il salvataggio')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Carica dati dai tracker
  useEffect(() => {
    const loadTrackerData = () => {
      try {
        const foodEntries = JSON.parse(localStorage.getItem('foodtracker_entries') || '[]')
        const today = getTodayLocal()
        const todayEntries = foodEntries.filter(e => e.date === today)
        const totalCal = todayEntries.reduce((sum, e) => sum + (e.kcal || 0), 0)
        const goal = parseInt(localStorage.getItem('foodtracker_goal') || '2000')
        const steps = parseInt(localStorage.getItem('fittracker_steps') || '0')
        const sleepEntries = JSON.parse(localStorage.getItem('sleepEntries_v1') || '[]')
        const lastSleep = sleepEntries.length > 0 ? sleepEntries[sleepEntries.length - 1] : null
        const sleepHours = lastSleep?.duration ? Math.round(lastSleep.duration / 60) : 0
        const joys = JSON.parse(localStorage.getItem('joyData') || '{}')
        const todayMood = joys[today] || null
        const moodLabels = { very_bad: '😞', bad: '😕', neutral: '😐', good: '🙂', very_good: '😄' }
        const moodLevel = todayMood ? moodLabels[todayMood] || 'N/A' : 'N/A'

        setTrackerData({
          food: { current: Math.round(totalCal), goal },
          fit: { steps },
          sleep: { hours: sleepHours },
          mind: { level: moodLevel },
        })
      } catch (e) {
        console.warn('Failed to load tracker data', e)
      }
    }

    const fetchFoodFromBackend = async () => {
      if (!user?.id) return
      try {
        const today = getTodayLocal()
        const res = await fetch(`${API_BASE}/api/v1/food/day/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, date: today })
        })
        if (!res.ok) {
          console.warn('Home: food day query failed', res.status)
          return
        }
        const data = await res.json()
        // prova a leggere direttamente i totali, se 0 prova a sommare le entries di risposta
        const apiCalories = Math.round(data?.dailyTotals?.calories || 0)
        let calories = apiCalories
        if (!calories && Array.isArray(data?.entries)) {
          calories = Math.round(data.entries.reduce((sum, e) => sum + Number(e?.calories || e?.kcal || 0), 0))
        }
        const goal = parseInt(localStorage.getItem('foodtracker_goal') || '2000')
        setTrackerData(prev => ({
          ...prev,
          food: { current: calories, goal }
        }))
      } catch (err) {
        console.warn('Home: failed to fetch food day', err)
      }
    }

    loadTrackerData()
    fetchFoodFromBackend()
    const onFocus = () => { loadTrackerData(); fetchFoodFromBackend() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user?.id])

  // Listen for fittracker updates (dispatched when steps are reset/updated)
  useEffect(() => {
    const onFitUpdated = (e) => {
      try {
        const detail = e?.detail || {}
        const steps = Number(detail.steps || 0)
        // update only the fit widget (keep other trackerData fields intact)
        setTrackerData(prev => ({ ...prev, fit: { steps } }))
        // also sync localStorage for consistency
        try { localStorage.setItem('fittracker_steps', String(steps)) } catch {}
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('fittracker:updated', onFitUpdated)
    return () => window.removeEventListener('fittracker:updated', onFitUpdated)
  }, [])

  // Estrae i valori numerici dalle risposte del questionario
  const extractNumericResponses = (sectionObj) => {
    if (!sectionObj || typeof sectionObj !== 'object') return []
    const nums = []
    Object.values(sectionObj).forEach((val) => {
      const n = Number(val)
      if (!Number.isNaN(n) && n >= 1 && n <= 5) nums.push(n)
    })
    return nums
  }

  function computeScoreForSection(sectionObj) {
    const nums = extractNumericResponses(sectionObj)
    if (!nums || nums.length === 0) return null
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length
    let score = Math.round(25 * (mean - 1))
    if (score < 0) score = 0
    if (score > 100) score = 100
    return score
  }

  const sectionOrder = ['section2','section3','section4','section5','section6','section7']

  const loadAndCompute = () => {
    try {
      const raw = localStorage.getItem('questionnaire_allSections')
      if (!raw) return
      const all = JSON.parse(raw)
      if (!all || typeof all !== 'object') return
      const computed = sectionOrder.map(id => computeScoreForSection(all[id]))
      const hasAny = computed.some(v => typeof v === 'number')
      if (hasAny) {
        const normalized = computed.map(v => (typeof v === 'number' ? v : 0))
        setData(normalized)
        setLastUpdated(new Date().toLocaleString())
      }
    } catch (e) {
      console.warn('Home: failed to load questionnaire data', e)
    }
  }

  useEffect(() => {
    loadAndCompute()
    const onStorage = (ev) => { if (ev.key === 'questionnaire_allSections') loadAndCompute() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', loadAndCompute)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', loadAndCompute)
    }
  }, [])

  useEffect(() => {
    const { mood, sleep, sport } = checkinValues
    if ((isEditingCheckin || !hasTodayCheckin) && mood !== null && sleep !== null && sport !== null && !isSubmitting) {
      submitDailyCheckIn({ mood, sleep, sport })
    }
  }, [checkinValues, hasTodayCheckin, isEditingCheckin])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const checkIns = JSON.parse(localStorage.getItem('daily_checkins') || '{}')
    const todayAnswers = checkIns[today] || {}
    const completed =
      todayAnswers.mood !== undefined && todayAnswers.sleep !== undefined && todayAnswers.sport !== undefined
    if (completed) {
      setCheckinValues({
        mood: todayAnswers.mood,
        sleep: todayAnswers.sleep,
        sport: todayAnswers.sport,
      })
      setHasTodayCheckin(true)
    }
  }, [])

  const fetchTodayStatus = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/checkin/status/today?userId=${userId}`)
      if (!res.ok) return { exists: false }
      return await res.json()
    } catch (e) {
      return { exists: false }
    }
  }

  useEffect(() => {
    const syncFromBackend = async () => {
      if (!user || !user.id) return
      const status = await fetchTodayStatus(user.id)
      if (status && status.exists) {
        const inputs = status.inputs || {}
        setStoredTodayAnswers({
          mood: inputs.mood ?? null,
          sleep: inputs.sleepHours ?? null,
          sport: inputs.sport ?? null,
        })
        setCheckinValues({
          mood: inputs.mood ?? null,
          sleep: inputs.sleepHours ?? null,
          sport: inputs.sport ?? null,
        })
        setHasTodayCheckin(true)
        setIsEditingCheckin(false)
        setCheckinVersion((v) => v + 1)
        return
      }
      setHasTodayCheckin(false)
      setStoredTodayAnswers({ mood: null, sleep: null, sport: null })
    }
    syncFromBackend()
  }, [user?.id])

const [showChartInfo, setShowChartInfo] = useState(false)

// 2. DEFINIZIONE DELLE SEZIONI (Mapping)
  // Assicurati che questi titoli corrispondano all'ordine del tuo questionario
  // L'ordine in `sectionOrder` era: 2, 3, 4, 5, 6, 7
  const chartSections = [
    { label: 'Nutri', desc: 'Qualità e abitudini alimentari' },
    { label: 'Physio', desc: 'Movimento e stile di vita attivo' },
    { label: 'Psycho', desc: 'Gestione ansia e benessere mentale' },
    { label: 'Health', desc: 'Salute percepita' },
    { label: 'Socio', desc: 'Relazioni e ambiente circostante' },
    { label: 'Life', desc: 'Percezione fisica e vitale' }
  ]

  return (
    <div className="home-root">
      {/* SEZIONE A: Saluto personalizzato (senza card bianca) */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          Buongiorno {user?.name || 'Utente'} ☀️
        </h1>
        <p className="welcome-subtitle">{motivationalPhrase}</p>
      </div>

      {/* SEZIONE B: Check-in quotidiano */}
      <div className="section-card checkin-section">
        <h2 className="section-title">Il tuo Check-in</h2>
        {hasTodayCheckin ? (
          <div className="checkin-banner">
            <p>Hai già completato il check-in di oggi, ottimo lavoro! Se vuoi aggiornare le risposte, puoi farlo ora.</p>
            <button
              type="button"
              className="edit-checkin-btn"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                const checkIns = JSON.parse(localStorage.getItem('daily_checkins') || '{}')
                if (checkIns[today]) delete checkIns[today]
                localStorage.setItem('daily_checkins', JSON.stringify(checkIns))
                setIsEditingCheckin(true)
                setCheckinValues({ mood: null, sleep: null, sport: null })
                setCheckinVersion((v) => v + 1)
              }}
            >
              Modifica risposte
            </button>
          </div>
        ) : null}
        {isEditingCheckin || !hasTodayCheckin ? (
          <>
            <div className="checkin-grid">
              <CheckInCard
                key={`mood-${checkinVersion}`}
                title="Come ti senti oggi?"
                type="mood"
                onAnswer={(val) => saveCheckIn('mood', val)}
              />
              <CheckInCard
                  key={`energy-${checkinVersion}`}
                  title="Quanto ti senti energico?"
                  type="energy"
                  // store under the `sleep` key so localStorage and submit use the same field name
                  onAnswer={(val) => saveCheckIn('sleep', val)}
                />
              <CheckInCard
                key={`sport-${checkinVersion}`}
                title="Hai fatto sport?"
                type="sport"
                onAnswer={(val) => saveCheckIn('sport', val === 'yes' ? true : val === 'no' ? false : val)}
              />
            </div>
            {isEditingCheckin && (
              <button
                type="button"
                className="cancel-checkin-btn"
                onClick={() => {
                  const completed =
                    storedTodayAnswers.mood !== undefined && storedTodayAnswers.mood !== null &&
                    storedTodayAnswers.sleep !== undefined && storedTodayAnswers.sleep !== null &&
                    storedTodayAnswers.sport !== undefined && storedTodayAnswers.sport !== null

                  setCheckinValues({
                    mood: storedTodayAnswers.mood ?? null,
                    sleep: storedTodayAnswers.sleep ?? null,
                    sport: storedTodayAnswers.sport ?? null,
                  })
                  setHasTodayCheckin(completed)
                  setIsEditingCheckin(false)
                  setCheckinError('')
                  setCheckinVersion((v) => v + 1)
                }}
              >
                Annulla
              </button>
            )}
            {checkinError && <p className="checkin-error">{checkinError}</p>}
          </>
        ) : null}
      </div>

      {/* SEZIONE C: Grafico Radar + Consigli */}
      <div className="section-card graph-section">
        <div className="graph-layout">

          {/* COLONNA SINISTRA MODIFICATA */}
          <div className="graph-left">
            <h2 className="section-title">Il tuo Digital Twin</h2>

            {/* Il Grafico */}
            <RadarChart data={data} size={280} />

            {lastUpdated && <p className="last-update">Ultimo aggiornamento: {lastUpdated}</p>}

            {/* 3. PULSANTE "DIMMI DI PIÙ" */}
            <button
              className="chart-info-toggle"
              onClick={() => setShowChartInfo(!showChartInfo)}
            >
              {showChartInfo ? 'Nascondi dettagli ▲' : 'Dimmi di più su questo grafico ℹ️'}
            </button>

            {/* 4. BOX ESPLICATIVO A COMPARSA */}
            {showChartInfo && (
              <div className="chart-explanation-box">
                <h4>Come leggere il Digital Twin?</h4>
                <p>
                  Questo grafico rappresenta il tuo <strong>equilibrio olistico</strong>.
                  Più l'area colorata è ampia e uniforme verso l'esterno, più il tuo benessere è bilanciato.
                </p>
                <ul className="chart-legend-list">
                  {chartSections.map((section, index) => (
                    <li key={index} className="legend-item">
                      <div className="legend-number">{index + 1}</div>
                      <div className="legend-text">
                        <strong>{section.label}:</strong> {section.desc}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="graph-right">
            <h3>💡 Consiglio del giorno</h3>
            <p>Oggi sei in equilibrio generale ma potresti migliorare la qualità del sonno. Suggerimento: prova una breve camminata pomeridiana.</p>
          </div>

        </div>
      </div>

      {/* SEZIONE D: Mini-Widget Tracker */}
      <div className="section-card widgets-section">
        <h2 className="section-title">Accesso Rapido</h2>
        <div className="widgets-grid">
          <Link to="/foodtracker" className="mini-widget food-widget">
            <div className="widget-icon">🍎</div>
            <div className="widget-label">Food</div>
            <div className="widget-value">
              {`${trackerData.food.current ?? 0} / ${trackerData.food.goal ?? 2000} kcal`}
            </div>
          </Link>

          <Link to="/fittracker" className="mini-widget fit-widget">
            <div className="widget-icon">🏃</div>
            <div className="widget-label">Fit</div>
            <div className="widget-value">
              {trackerData.fit.steps > 0
                ? `${trackerData.fit.steps} passi`
                : 'Nessun dato'}
            </div>
          </Link>

          <Link to="/sleeptracker" className="mini-widget sleep-widget">
            <div className="widget-icon">😴</div>
            <div className="widget-label">Sleep</div>
            <div className="widget-value">
              {trackerData.sleep.hours > 0
                ? `${trackerData.sleep.hours}h`
                : 'Nessun dato'}
            </div>
          </Link>

          {trackerData.food.current > 0 ? (
            <Link to="/wellbeing" className="mini-widget mind-widget">
              <div className="widget-icon">🧠</div>
              <div className="widget-label">Mind</div>
              <div className="widget-value">
                {trackerData.mind.level !== 'N/A'
                  ? trackerData.mind.level
                  : 'Nessun dato'}
              </div>
            </Link>
          ) : (
            <Link to="/wellbeing" className="mini-widget mind-widget">
              <div className="widget-icon">🧠</div>
              <div className="widget-label">Mind</div>
              <div className="widget-value">Nessun dato</div>
            </Link>
          )}
        </div>
      </div>

    </div>
  )
}
