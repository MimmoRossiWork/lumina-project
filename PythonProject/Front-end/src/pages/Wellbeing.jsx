import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react'
import './Wellbeing.css'
import { format, subDays, eachDayOfInterval, startOfToday } from 'date-fns'
import CalendarJoy from '../components/CalendarJoy'
import JoyModal from '../components/JoyModal'
import DiaryModal from '../components/DiaryModal'
import WellnessCheckin from '../components/WellnessCheckin'
import { loadJoys, saveJoys, setJoyForDate, removeJoyForDate } from '../utils/joyStore'
import { loadDiary, saveDiary, setNoteForDate, removeNoteForDate } from '../utils/diaryStore'
import Toast from '../components/Toast'
import generatePlan from '../utils/planGenerator'
import { saveWellbeing, getWellbeingByDate, getDailyLogsRange, getDailyLogByDate } from '../utils/api'
import { AuthContext } from '../AuthContext'

function BoxBreathing({ running }) {
  const [phase, setPhase] = useState(0) // 0-in,1-hold,2-out,3-hold

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setPhase(p => (p + 1) % 4), 4000)
    return () => clearInterval(id)
  }, [running])

  const text = ['Inspira 4s', 'Trattieni 4s', 'Espira 4s', 'Trattieni 4s'][phase]

  return (
    <div className="box-breathing">
      <div className="breathing-circle" data-phase={phase} />
      <div className="breathing-label">{text}</div>
    </div>
  )
}

export default function Wellbeing() {
  const [showSOS, setShowSOS] = useState(false)
  const [sosSoundOn, setSosSoundOn] = useState(false)
  const [showGrounding, setShowGrounding] = useState(false)

  useEffect(() => {
    let ctx, node
    if (sosSoundOn) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        const bufferSize = 2 * ctx.sampleRate
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1
        node = ctx.createBufferSource()
        node.buffer = noiseBuffer
        const gain = ctx.createGain()
        gain.gain.value = 0.05
        node.loop = true
        node.connect(gain).connect(ctx.destination)
        node.start()
      } catch (e) { console.warn('audio failed', e) }
    }
    return () => { try { if (node) node.stop(); if (ctx) ctx.close() } catch (e) { console.warn('audio cleanup failed', e) } }
  }, [sosSoundOn])

  const [diary, setDiary] = useState(() => loadDiary())
   const [weeklyLogs, setWeeklyLogs] = useState({})
   const [logsLoaded, setLogsLoaded] = useState(false)
   const [selectedDiaryDay, setSelectedDiaryDay] = useState(null)
   const [diaryModalOpen, setDiaryModalOpen] = useState(false)
   const [selectedDiaryLog, setSelectedDiaryLog] = useState(null)

   // Auth context must be declared before hooks that reference userId in dependency arrays
   const { user } = useContext(AuthContext)
   const userId = user?.id || user?._id || localStorage.getItem('userId') || ''

   // Produce weekDays as UTC YYYY-MM-DD strings to match the DB 'date' keys (stored at midnight UTC)
   const weekDays = useMemo(() => {
     const out = []
     const now = new Date()
     const todayUtcStr = now.toISOString().slice(0,10) // YYYY-MM-DD in UTC
     for (let i = 6; i >= 0; i--) {
       const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
       out.push(dt.toISOString().slice(0,10))
     }
     return out
   }, [])

   // Load weekly logs from backend and populate weeklyLogs + diary
   const loadWeeklyLogs = useCallback(async () => {
     if (!userId) return
     try {
       const start = weekDays[0]
       const end = weekDays[weekDays.length - 1]
       const res = await getDailyLogsRange(userId, start, end)
       const payload = res?.data ?? res

       const map = {}

       // If payload is an object mapping dates to entries (preferred)
       if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
         Object.entries(payload).forEach(([dateKey, entry]) => {
           try {
             // entry expected to be { dailyLogId, inputs }
             const inputs = entry?.inputs || {}
             const mindset = inputs?.mindset || inputs?.moodMetrics || entry?.mindset || null
             map[dateKey] = { dailyLogId: entry.dailyLogId || entry.id || null, inputs: { ...inputs, mindset } }
             console.log('[Wellbeing] import range date', dateKey, 'mindset keys=', Object.keys(mindset || {}))
           } catch (e) { console.warn('parse range entry failed', e) }
         })
       } else if (Array.isArray(payload)) {
         // If payload is an array of docs
         payload.forEach(item => {
           try {
             const iso = item?.date || item?.createdAt || null
             let key = null
             if (typeof iso === 'string' && iso.length >= 10) key = iso.slice(0, 10)
             else if (iso instanceof Date) key = iso.toISOString().slice(0, 10)
             else {
               const dt = iso ? new Date(iso) : null
               if (dt && !isNaN(dt.getTime())) key = dt.toISOString().slice(0, 10)
             }
             if (!key) return
             const inputs = item?.inputs || {}
             const mindset = inputs?.mindset || inputs?.moodMetrics || item?.mindset || null
             map[key] = { dailyLogId: item._id || item.id || null, inputs: { ...inputs, mindset } }
             console.log('[Wellbeing] import range array item', key, 'mindset keys=', Object.keys(mindset || {}))
           } catch (e) { console.warn('parse range array item failed', e) }
         })
       } else {
         console.warn('[Wellbeing] unexpected range payload shape', payload)
       }

       console.log('[Wellbeing] fetched range', { start, end, keys: Object.keys(map), raw: map })
       setWeeklyLogs(map)
       setLogsLoaded(true)
       setDiary(prev => {
         const next = { ...prev }
         Object.keys(map).forEach(k => {
           try {
             const note = map[k]?.inputs?.mindset?.journalNote || map[k]?.inputs?.mindset?.dailyNote || ''
             if (note) next[k] = note
           } catch (e) { /* ignore */ }
         })
         try { saveDiary(next) } catch (e) {}
         return next
       })
     } catch (e) {
       console.warn('loadWeeklyLogs failed', e)
     }
   }, [userId, weekDays])

   useEffect(() => { if (userId) loadWeeklyLogs() }, [userId, loadWeeklyLogs])

   const [joys, setJoys] = useState(() => loadJoys())
   const [selectedJoyDay, setSelectedJoyDay] = useState(null)
   const [joyModalOpen, setJoyModalOpen] = useState(false)

   useEffect(() => { try { saveJoys(joys) } catch (e) { console.warn('save joys failed', e) } }, [joys])
   useEffect(() => { try { saveDiary(diary) } catch (e) { console.warn('save diary failed', e) } }, [diary])

   const handleDayClick = async (dateKey) => {
     setSelectedDiaryDay(dateKey)
     setSelectedDiaryLog(null)
     console.log('[Wellbeing] handleDayClick for', dateKey)

     // Try to fetch authoritative daily_log from checkin endpoint
     try {
       const res = await getDailyLogByDate(userId, dateKey)
       console.log('[Wellbeing] getDailyLogByDate response', res)
       if (res && res.exists) {
         const inputs = res.inputs || {}
         console.log('[Wellbeing] fetched inputs keys:', Object.keys(inputs), 'mindset keys:', Object.keys(inputs?.mindset || {}))
         const mindset = inputs?.mindset || inputs?.moodMetrics || null
         const entry = { dailyLogId: res.dailyLogId || res.id || null, inputs: { ...inputs, mindset } }
         setWeeklyLogs(prev => ({ ...prev, [dateKey]: entry }))
         setSelectedDiaryLog(entry)
         setDiary(prev => ({ ...prev, [dateKey]: mindset?.journalNote || prev[dateKey] || '' }))
         setDiaryModalOpen(true)
         return
       }
     } catch (e) {
       console.warn('[Wellbeing] authoritative daily_log fetch failed', e)
     }

     // If authoritative fetch failed, fallback to cached weeklyLogs or wellbeing endpoint
     const cached = weeklyLogs && weeklyLogs[dateKey]
     if (cached) {
       setSelectedDiaryLog(cached)
       setDiaryModalOpen(true)
       return
     }

     try {
       const res2 = await getWellbeingByDate(userId, dateKey)
       console.log('[Wellbeing] fallback getWellbeingByDate', res2)
       if (res2) {
         const prevMindset = weeklyLogs[dateKey]?.inputs?.mindset
         const rawMindset = res2?.inputs?.mindset || res2?.moodMetrics || res2?.mindset || null
         const mindset = prevMindset ? { ...prevMindset, ...rawMindset } : rawMindset
         const entry = { dailyLogId: res2.id || res2.dailyLogId, inputs: { mindset } }
         setWeeklyLogs(prev => ({ ...prev, [dateKey]: entry }))
         setSelectedDiaryLog(entry)
         setDiary(prev => ({ ...prev, [dateKey]: res2.dailyNote || mindset?.journalNote || '' }))
         setDiaryModalOpen(true)
         return
       }
     } catch (e) {
       console.warn('[Wellbeing] fallback wellbeing fetch failed', e)
     }

     // No data; open modal empty
     setSelectedDiaryLog(null)
     setDiaryModalOpen(true)
   }

   const handleDiaryClose = () => { setDiaryModalOpen(false); setSelectedDiaryDay(null); setSelectedDiaryLog(null) }
   const handleDiarySave = async (note) => {
     const targetDate = selectedDiaryDay || format(startOfToday(), 'yyyy-MM-dd')
     setDiary(prev => setNoteForDate(prev, targetDate, note))
     setDiaryModalOpen(false)
     setSelectedDiaryLog(null)
     // salva nel DB per la data selezionata, senza toccare l'entry odierna se diversa
     await saveEntry(note, targetDate)
   }
   const handleDiaryDelete = async () => {
     const targetDate = selectedDiaryDay || format(startOfToday(), 'yyyy-MM-dd')
     setDiary(prev => removeNoteForDate(prev, targetDate))
     setDiaryModalOpen(false)
     setSelectedDiaryLog(null)
     // cancella la nota nel DB per quella data lasciando intatti gli altri dati
     await saveEntry('', targetDate)
   }

   const handleJoyClose = () => { setJoyModalOpen(false); setSelectedJoyDay(null) }
   const handleSaveFromModal = (payload) => { setJoys(prev => setJoyForDate(prev, selectedJoyDay, payload)); setJoyModalOpen(false); setSelectedJoyDay(null) }
   const handleDeleteFromModal = () => { setJoys(prev => removeJoyForDate(prev, selectedJoyDay)); setJoyModalOpen(false); setSelectedJoyDay(null) }

   // Handler per WellnessCheckin -> persist moodMetrics into daily_logs
   const handleWellnessDone = async (payload) => {
     // payload expected: { moodMetrics: {stressLevel, anxietyLevel, copingAbility}, intervention }
     if (!payload || !payload.moodMetrics) {
       showToast('Nessun dato inviato', 'danger')
       return
     }
     const mm = payload.moodMetrics
     // ensure numeric
     const s = Number(mm.stressLevel || 5)
     const a = Number(mm.anxietyLevel || 5)
     const c = Number(mm.copingAbility || 5)

     // update local state so UI reflects the saved values
     setAnswers(prev => ({ ...prev, stress: s, anxiety: a, coping: c }))
     setAnswered({ stress: true, anxiety: true, coping: true })

     // build payload explicitly and call API directly to avoid race conditions
     const dateKey = format(startOfToday(), 'yyyy-MM-dd')
     const payloadToSend = {
       userId,
       date: dateKey,
       moodMetrics: {
         stressLevel: s,
         anxietyLevel: a,
         copingAbility: c,
       },
       dailyNote: diary[dateKey] || '',
     }

     setSaving(true)
     try {
       // persist immediately (no debug) so answering the quiz saves to DB
       const res = await saveWellbeing(payloadToSend)
       // update local diary state
       setDiary(prev => ({ ...prev, [dateKey]: payloadToSend.dailyNote }))
       // mark that we have an entry so the quiz becomes read-only
       setWellbeingEntry(res)
       setAnswered({ stress: true, anxiety: true, coping: true })
       showToast('Ottimo lavoro! Dati salvati', 'success')
       if (payload.intervention && payload.intervention.title) {
         showToast(payload.intervention.title, 'info', 2500)
       }
     } catch (e) {
       console.warn('save wellbeing from wellnessCheckin failed', e)
       showToast('Errore salvataggio wellbeing', 'danger')
     } finally {
       setSaving(false)
     }
   }

   const quizQuestions = [
     { key: 'stress', q: 'Quanto stress senti oggi (1-10)?', type: 'scale', min: 1, max: 10 },
     { key: 'anxiety', q: 'Quanto ti senti ansioso o preoccupato (1-10)?', type: 'scale', min: 1, max: 10 },
     { key: 'coping', q: 'Quanto ti senti capace di gestire lo stress (1-10)?', type: 'scale', min: 1, max: 10 },
   ]
   const [answers, setAnswers] = useState({})
   const [wellbeingEntry, setWellbeingEntry] = useState(null)
   const [plan, setPlan] = useState(null)
   const [expandedDay, setExpandedDay] = useState(null)
   const [showPlanPanel, setShowPlanPanel] = useState(true)

   const [planExcluded, setPlanExcluded] = useState(() => {
     try { return JSON.parse(localStorage.getItem('well_plan_excluded') || '{}') } catch { return {} }
   })
   useEffect(() => { try { localStorage.setItem('well_plan_excluded', JSON.stringify(planExcluded)) } catch { /* ignore */ } }, [planExcluded])

   const [toast, setToast] = useState({ open: false, message: '', type: 'info', duration: 2000 })
   const showToast = (message, type = 'info', duration = 2000) => {
     setToast({ open: true, message, type, duration })
   }

   const [saving, setSaving] = useState(false)
   const [answered, setAnswered] = useState({})

   const loadEntry = useCallback(async () => {
     if (!userId) return
     const today = format(startOfToday(), 'yyyy-MM-dd')
     try {
       const data = await getWellbeingByDate(userId, today)
       if (!data) return
       setAnswers({
         stress: data?.moodMetrics?.stressLevel ?? 5,
         anxiety: data?.moodMetrics?.anxietyLevel ?? 5,
         coping: data?.moodMetrics?.copingAbility ?? 5,
       })
       setWellbeingEntry(data)
       setAnswered({ stress: true, anxiety: true, coping: true })
       setDiary(prev => ({ ...prev, [today]: data?.dailyNote || '' }))
       setPlan(null)
     } catch (e) { console.warn('load wellbeing failed', e) }
   }, [userId, setDiary])

   useEffect(() => { loadEntry() }, [loadEntry])

   const saveEntry = async (overrideNote, targetDate) => {
     if (!userId) { showToast('Utente non loggato', 'danger'); return }
     const dateKey = targetDate || format(startOfToday(), 'yyyy-MM-dd')
     const payload = {
       userId,
       date: dateKey,
       moodMetrics: {
         stressLevel: Number(answers.stress || 5),
         anxietyLevel: Number(answers.anxiety || 5),
         copingAbility: Number(answers.coping || 5),
       },
       dailyNote: overrideNote ?? (diary[dateKey] || ''),
     }
     setSaving(true)
     try {
       const res = await saveWellbeing(payload)
       const prevMindset = weeklyLogs[dateKey]?.inputs?.mindset
       const rawMindset = res?.inputs?.mindset || res?.mindset || res?.moodMetrics || payload.moodMetrics
       const mindset = prevMindset ? { ...prevMindset, ...rawMindset } : rawMindset
       const entry = { dailyLogId: res?.id || res?.dailyLogId || null, inputs: { mindset } }
       console.log('[Wellbeing] saveEntry merged mindset', mindset)
       setWeeklyLogs(prev => ({ ...prev, [dateKey]: entry }))
       setDiary(prev => ({ ...prev, [dateKey]: res.dailyNote || payload.dailyNote || '' }))
       try { saveDiary({ ...loadDiary(), [dateKey]: (overrideNote !== undefined ? overrideNote : (res.dailyNote || payload.dailyNote || '')) }) } catch (e) {}
       showToast('Salvato su wellbeing', 'success')
     } catch (e) {
       console.warn('save wellbeing failed', e)
       showToast('Errore salvataggio wellbeing', 'danger')
     } finally {
       setSaving(false)
     }
   }

   const submitQuiz = () => {
     const required = ['stress', 'anxiety', 'coping']
     const allAnswered = required.every(k => answered[k])
     if (!allAnswered) { showToast('Rispondi prima alle domande', 'danger'); return }

     const s = Number(answers.stress || 5)
     const a = Number(answers.anxiety || 5)
     const c = Number(answers.coping || 5)
     const items = generatePlan({ stress: s, anxiety: a, coping: c })
     setPlan(items)
     setShowPlanPanel(false)
     showToast('Piano 7 giorni generato', 'success', 2500)
   }

   const toggleExpandDay = (index) => setExpandedDay(prev => prev === index ? null : index)
   const toggleExcludeDay = (index) => setPlanExcluded(prev => ({ ...prev, [index]: !prev[index] }))
   const handleAnswerChange = (key, value) => {
     setAnswers(a => ({ ...a, [key]: value }))
     setAnswered(prev => ({ ...prev, [key]: true }))
   }

   const moodInfluence = useMemo(() => {
     const stress = Number(answers.stress || 0)
     const anxiety = Number(answers.anxiety || 0)
     if (stress >= 7 || anxiety >= 7) return { tone: 'calm', pick: 'respirazione' }
     if (stress >= 5) return { tone: 'soft', pick: 'camminata' }
     return { tone: 'neutral', pick: 'gratitudine' }
   }, [answers])

   return (
     <div className="wellbeing-page">
       <header className="page-head" style={{ textAlign: 'center' }}>
         <h1>Armonia</h1>
       </header>

       {/* Reordered: SOS card first, then Quiz, then Weekly Check-in */}

       <section className="card info-card">
         <h2>Ansia, stress e tensione</h2>
         <p>Riconosci i segnali prima che diventino troppo intensi.</p>
         <ul className="info-list">
           <li><strong>Corpo:</strong> respiro corto, battito accelerato, stomaco in blocco, tensione a spalle/collo/mascella.</li>
           <li><strong>Emozioni:</strong> irritabilità, sentirsi sopraffatti o sempre “in allerta”.</li>
           <li><strong>Pensieri:</strong> ruminazione, pensieri veloci o catastrofici, fatica a concentrarsi.</li>
           <li><strong>Comportamento:</strong> procrastinazione, fame nervosa o perdita di appetito, difficoltà a riposare.</li>
         </ul>
         <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
           <button className="sos-btn" onClick={() => setShowSOS(true)}>SOS Calma</button>
           <button className="sos-btn" onClick={() => setShowGrounding(true)}>SOS Grounding</button>
         </div>
       </section>

       <WellnessCheckin
         onDone={handleWellnessDone}
         initialMetrics={wellbeingEntry?.moodMetrics || null}
         readOnly={Boolean(wellbeingEntry)}
         onAcknowledge={() => showToast('Ottimo lavoro! 🎉', 'success')}
       />

       <section className="card">
         <h2>Check-in settimanale</h2>
         <p>Apri un giorno per scrivere una nota o aggiungere piccole gioie.</p>
         <CalendarJoy days={weekDays} joys={joys} notes={diary} logs={weeklyLogs} logsLoaded={logsLoaded} selected={selectedDiaryDay} onDayClick={handleDayClick} />
       </section>

       {joyModalOpen && (
         <JoyModal open={joyModalOpen} entry={joys[selectedJoyDay]} date={selectedJoyDay} onClose={handleJoyClose} onSave={handleSaveFromModal} onDelete={handleDeleteFromModal} moodInfluence={moodInfluence} />
       )}

       {diaryModalOpen && (
         <DiaryModal open={diaryModalOpen} date={selectedDiaryDay} note={diary[selectedDiaryDay]} log={selectedDiaryLog || weeklyLogs[selectedDiaryDay] || null} onClose={handleDiaryClose} onSave={handleDiarySave} onDelete={handleDiaryDelete} />
       )}

       {showSOS && (
         <div className="sos-modal" role="dialog" aria-modal>
           <div className="sos-overlay" onClick={() => { setShowSOS(false); setSosSoundOn(false) }} />
           <div className="sos-content">
             <button className="sos-close" onClick={() => { setShowSOS(false); setSosSoundOn(false) }} aria-label="Chiudi">✕</button>
             <h2>SOS Calma</h2>
             <p>Segui il cerchio per respirare: Inspira 4s, Trattieni 4s, Espira 4s, Trattieni 4s</p>
             <div style={{ marginTop: 12 }}>
               <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                 <input type="checkbox" checked={sosSoundOn} onChange={(e) => setSosSoundOn(e.target.checked)} /> Sottofondo rumore bianco
               </label>
             </div>
             <div style={{ marginTop: 18 }}>
               <BoxBreathing running={showSOS} />
             </div>
           </div>
         </div>
       )}

       {showGrounding && (
         <div className="sos-modal" role="dialog" aria-modal>
           <div className="sos-overlay" onClick={() => setShowGrounding(false)} />
           <div className="sos-content">
             <button className="sos-close" onClick={() => setShowGrounding(false)} aria-label="Chiudi">✕</button>
             <h2>SOS Grounding</h2>
             <p>Tecnica 5-4-3-2-1 per tornare al presente.</p>
             <ul className="info-list">
               <li>5 cose che vedi</li>
               <li>4 cose che puoi toccare</li>
               <li>3 suoni che senti</li>
               <li>2 odori che riconosci</li>
               <li>1 gusto o respiro profondo</li>
             </ul>
             <div style={{ marginTop: 12 }}>
               <button className="btn" onClick={() => setShowGrounding(false)}>Chiudi</button>
             </div>
           </div>
         </div>
       )}

       <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, open: false })} duration={toast.duration} />

       <div style={{ height: 40 }} />
     </div>
   )
}

