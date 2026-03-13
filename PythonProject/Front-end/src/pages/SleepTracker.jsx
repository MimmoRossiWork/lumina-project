import React, { useEffect, useState, useRef, useMemo } from 'react'
import './SleepTracker.css'
import { calculateSleepEfficiency } from '../utils/sleepUtils'
import SleepCalendar, { Sleep7DayChart } from '../components/SleepTracker/SleepCalendar'
import AdvicePanel from '../components/SleepTracker/AdvicePanel'
import { differenceInMinutes, parseISO, format, addDays, formatISO } from 'date-fns'
import { AuthContext } from '../AuthContext'
import SleepPredictionWidget from '../components/SleepTracker/SleepPredictionWidget'
import { saveDailySleep, getDailyLogByDate, getDailyLogsRange, clearDailySleep } from '../utils/api'

const STORAGE_KEY = 'sleepEntries_v1'
const CLEANED_FLAG = 'sleepEntries_cleaned_v1'
const BACKUP_KEY = 'sleepEntries_backup_v1'

// Helper per riallineare le date server (UTC) alla data locale: aggiunge +1 giorno
const normalizeServerDateKey = (rawKey) => {
  try {
    // Manteniamo la data così com'è (YYYY-MM-DD) per evitare shift dovuti al parsing e ai fusi orari
    const base = (rawKey || '').slice(0, 10)
    return base
  } catch (e) {
    return (rawKey || '').slice(0, 10)
  }
}

function formatDurationMinutes(mins) {
  if (!mins || mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function SleepTracker() {
  const { user } = React.useContext(AuthContext) || { user: null }

  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (err) {
      console.warn('localStorage read failed', err)
      return []
    }
  })

  // One-time cleanup: remove example entries on first page load (only once)
  useEffect(() => {
    try {
      const cleaned = localStorage.getItem(CLEANED_FLAG)
      if (cleaned) return
      // apply cleanup to currently loaded entries
      setEntries((prev) => {
        const filtered = (prev || []).filter((en) => {
          try {
            const isExample = !!en.example
            return !isExample
          } catch {
            return true
          }
        })
        // if different, we'll save via existing effect
        return filtered
      })
      localStorage.setItem(CLEANED_FLAG, '1')
    } catch (err) {
      console.warn('cleanup examples failed', err)
    }
  }, [])

  const [runningStart, setRunningStart] = useState(null)
  const [now, setNow] = useState(Date.now())
  const nowRef = useRef(now)
  nowRef.current = now

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (err) {
      console.warn('localStorage write failed', err)
    }
  }, [entries])

  // Toast / notifiche semplici
  const [toast, setToast] = useState({ msg: '', type: 'info', visible: false })
  const showToast = (msg, type = 'info', ms = 3000) => {
    try {
      setToast({ msg, type, visible: true })
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), ms)
    } catch (e) { /* ignore */ }
  }

  // Conflict modal state (detailed message when duplicate/overlap detected)
  const [conflictModal, setConflictModal] = useState({ visible: false, title: '', message: '', onConfirm: null })
  const showConflictModal = (title, message, onConfirm = null) => {
    setConflictModal({ visible: true, title, message, onConfirm })
  }
  const closeConflictModal = () => setConflictModal({ visible: false, title: '', message: '', onConfirm: null })

  const handleStart = () => {
    setRunningStart(new Date().toISOString())
  }
  const handleStop = () => {
    if (!runningStart) return
    const wake = new Date().toISOString()
    // Reuse handleAddEntry to enforce duplicate prevention and consistent saving
    handleAddEntry({ start: runningStart, wake, awakenings: 0 })
    setRunningStart(null)
  }

  const handleDelete = (id) => {
    if (!confirm('Eliminare questa voce?')) return
    setEntries((e) => {
      const toRemove = (e||[]).find(x=>x.id===id)
      if (toRemove) backupEntries([toRemove])
      return (e||[]).filter((x) => x.id !== id)
    })
  }

  // Aggiunge una entry proveniente dal calendario (manualmente)
  const handleAddEntry = ({ start, wake, awakenings = 0 }, force = false) => {
    try {
      const startISO = start || new Date().toISOString()
      const wakeISO = wake || startISO

      // Prevent duplicate entries: same day and same time (HH:mm)
      try {
        const newDt = parseISO(startISO)
        const newEndDt = parseISO(wakeISO)
        if (isNaN(newDt) || isNaN(newEndDt)) {
          // if parse fails, proceed with fallback behavior
        } else {
          const newDay = format(newDt, 'yyyy-MM-dd')
          const newTime = format(newDt, 'HH:mm')

          // find exact duplicate
          const exact = (entries || []).find((en) => {
            try {
              const s = en.start || en.date
              if (!s) return false
              const d = parseISO(s)
              return format(d, 'yyyy-MM-dd') === newDay && format(d, 'HH:mm') === newTime
            } catch { return false }
          })

          // find overlapping intervals on the same day
          const overlapEntries = (entries || []).filter((en) => {
            try {
              const s = parseISO(en.start || en.date)
              const e = parseISO(en.wake || en.end || en.start)
              if (isNaN(s) || isNaN(e)) return false
              // consider overlap by absolute time (this covers intervals crossing midnight)
              // overlap check: newStart < e && s < newEnd
              return (newDt < e) && (s < newEndDt)
            } catch { return false }
          })

          if ((exact || overlapEntries.length > 0) && !force) {
            // prepare a detailed message
            let msg = ''
            if (exact) msg += `Esiste già una registrazione nello stesso giorno e orario: ${format(parseISO(exact.start || exact.date), 'HH:mm')}\n`;
            if (overlapEntries.length > 0) {
              msg += `La nuova registrazione si sovrappone con ${overlapEntries.length} registrazione(i) esistente(i):\n`
              overlapEntries.forEach((en, i) => {
                try {
                  const s = format(parseISO(en.start || en.date), 'HH:mm')
                  const e = format(parseISO(en.wake || en.end || en.start), 'HH:mm')
                  msg += `• ${s} - ${e}\n`
                } catch { /* ignore formatting errors */ }
              })
            }
            msg += '\nVuoi forzare l\'inserimento comunque?'
            // show modal; if user confirms, call handleAddEntry with force=true
            showConflictModal('Conflitto registrazione', msg, () => handleAddEntry({ start: startISO, wake: wakeISO, awakenings }, true))
            return
          }
        }
      } catch (e) {
        // if parse fails, continue and let other validations surface
      }

      const entry = {
        id: Date.now(),
        date: startISO,
        start: startISO,
        wake: wakeISO,
        awakenings: Number(awakenings) || 0,
        factors: {},
        score: calculateSleepEfficiency({ start: startISO, wake: wakeISO, awakenings: Number(awakenings) || 0 })
      }
      setEntries((e) => [entry, ...(e || [])].slice(0, 60))
      showToast('Registrazione aggiunta', 'success')
    } catch (err) {
      console.warn('add entry failed', err)
      showToast('Impossibile aggiungere la registrazione', 'error')
    }
  }

  // Rimuove tutte le voci (pulizia completa)
  const clearAllEntries = () => {
    if (!confirm('Eliminare tutte le registrazioni del sonno? Questa operazione è irreversibile.')) return
    setEntries((prev) => {
      if ((prev||[]).length) backupEntries(prev)
      return []
    })
    try { localStorage.setItem(CLEANED_FLAG, '1') } catch {}
  }

  // Backup / restore helper for entries
  const backupEntries = (items = []) => {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ ts: Date.now(), items }))
      showToast('Backup creato', 'info')
    } catch (e) { console.warn('backup failed', e) }
  }

  const restoreLastBackup = () => {
    try {
      const raw = localStorage.getItem(BACKUP_KEY)
      if (!raw) { showToast('Nessun backup disponibile', 'error'); return }
      const obj = JSON.parse(raw)
      const items = obj && obj.items ? obj.items : []
      if (!items.length) { showToast('Backup vuoto', 'error'); return }
      setEntries((prev) => {
        // avoid duplicates by id
        const ids = new Set((prev||[]).map(p=>p.id))
        const merged = [...items.filter(i => !ids.has(i.id)), ...(prev || [])]
        return merged.slice(0, 200)
      })
      localStorage.removeItem(BACKUP_KEY)
      showToast('Backup ripristinato', 'success')
    } catch (e) { console.warn('restore failed', e); showToast('Ripristino fallito', 'error') }
  }

  // compute live duration when running (use date-fns for consistent minute computation)
  const liveMinutes = runningStart ? Math.max(0, differenceInMinutes(new Date(), parseISO(runningStart))) : 0

  // New: hide history by default to avoid showing examples; user can toggle
  // Show history by default so user's entries are visible; user can still toggle
  //  const [showHistory, setShowHistory] = useState(true)
  // Cronologia sempre visibile; il toggle è stato rimosso

  // Monthly data state (needs to be declared before grouped useMemo)
  const [monthlyData, setMonthlyData] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Refs e stato per posizionamento dinamico del badge emoji
  const chartSectionRef = useRef(null) // ref al <section> contenitore
  const chartInnerRef = useRef(null) // ref alla div che contiene il grafico
  const badgeRef = useRef(null)
  const [badgeLeftPx, setBadgeLeftPx] = useState(null)
  const [badgePlacement, setBadgePlacement] = useState({ mode: 'right', left: null })

  // grouped map used by Sleep7DayChart if we render it here
  const grouped = useMemo(() => {
    const map = {}
    try {
      ;(entries || []).forEach((en) => {
        try {
          const d = en.start ? format(parseISO(en.start), 'yyyy-MM-dd') : format(new Date(en.date || en.start), 'yyyy-MM-dd')
          map[d] = map[d] || []
          map[d].push(en)
        } catch (e) { /* ignore malformed entries */ }
      })

      // include server monthly data with calculatedScore
      Object.entries(monthlyData || {}).forEach(([dateKey, val]) => {
        const sleep = val?.inputs?.sleep || val?.sleep
        if (sleep) {
          try {
            const normalizedKey = normalizeServerDateKey(dateKey)
            const hasTimes = sleep.bedTime && sleep.wakeTime
            const startISO = hasTimes ? combineDateTimeISO(normalizedKey, sleep.bedTime) : `${normalizedKey}T00:00:00`
            const wakeISO = hasTimes ? combineDateTimeISO(normalizedKey, sleep.wakeTime) : `${normalizedKey}T00:30:00`
            const startDt = parseISO(startISO)
            let wakeDt = parseISO(wakeISO)
            if (wakeDt <= startDt) wakeDt = new Date(wakeDt.getTime() + 24 * 60 * 60 * 1000)
            const score = typeof sleep.calculatedScore === 'number'
              ? sleep.calculatedScore
              : calculateSleepEfficiency({ start: startISO, wake: formatISO(wakeDt), awakenings: Number(sleep.awakenings || 0) })
            map[normalizedKey] = map[normalizedKey] || []
            map[normalizedKey].push({
              start: startISO,
              wake: wakeDt.toISOString(),
              awakenings: sleep.awakenings || 0,
              score,
              date: startISO,
              dateKey: normalizedKey,
            })
          } catch (e) { /* ignore server parse errors */ }
        }
      })
    } catch (e) { /* ignore */ }
    return map
  }, [entries, monthlyData])

  // grouped per il grafico 7 giorni: costruito solo sugli ultimi 7 giorni usando monthlyData (calculatedScore) e entries locali
  const grouped7 = useMemo(() => {
    const map = {}
    const today = new Date()
    const last7 = []
    for (let i = 0; i < 7; i++) {
      last7.push(format(addDays(today, -i), 'yyyy-MM-dd'))
    }

    last7.forEach((key) => {
      // server data
      const val = monthlyData?.[key]
      const sleep = val?.inputs?.sleep || val?.sleep
      if (sleep && typeof sleep.calculatedScore === 'number') {
        map[key] = map[key] || []
        map[key].push({ score: sleep.calculatedScore })
      }
      // local entries (eventuali)
      const localItems = grouped?.[key] || []
      if (localItems.length) {
        map[key] = map[key] || []
        localItems.forEach((it) => map[key].push({ score: it.score }))
      }
    })
    return map
  }, [grouped, monthlyData])

  // Media ultimi 7 giorni per emoji
  const avgLast7 = useMemo(() => {
    try {
      const vals = Object.values(grouped7 || {}).flat().map((v) => Number(v.score) || 0).filter((v) => !Number.isNaN(v))
      if (!vals.length) return null
      return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
    } catch (e) { return null }
  }, [grouped7])

  // Calcola la posizione in px del badge in base alla posizione reale del grafico
  useEffect(() => {
    if (typeof window === 'undefined') return
    let mounted = true
    const update = () => {
      try {
        const section = chartSectionRef.current
        const chart = chartInnerRef.current
        const badgeEl = badgeRef.current
        if (!section || !chart || !badgeEl) return
        const secRect = section.getBoundingClientRect()
        const chartRect = chart.getBoundingClientRect()
        const badgeRect = badgeEl.getBoundingClientRect()
        const badgeW = Math.max(120, Math.round(badgeRect.width || 120))
        // If narrow viewport, force right-edge placement to avoid overlap
        const vw = window.innerWidth || document.documentElement.clientWidth
        const availableRight = Math.max(0, secRect.right - chartRect.right)
        if (vw <= 767) {
          // mobile: pin the badge to the right edge inside the section (right: 16px)
          if (mounted) {
            setBadgePlacement({ mode: 'rightEdge', right: 16 })
            setBadgeLeftPx(null)
          }
        } else if (availableRight >= badgeW + 24) {
           // posiziona a destra, centrato verticalmente
           const leftPx = Math.round(chartRect.right - secRect.left + 12)
           if (mounted) {
             setBadgePlacement({ mode: 'right', left: leftPx })
             setBadgeLeftPx(leftPx)
           }
         } else {
           // poco spazio: posiziona sotto il grafico, centrato orizzontalmente nella sezione
           const centerPx = Math.round(secRect.width / 2)
           if (mounted) {
             setBadgePlacement({ mode: 'below', left: centerPx })
             setBadgeLeftPx(centerPx)
           }
         }
       } catch (e) {
         // ignore
       }
     }
     // initial and on resize
     update()
     const ro = new ResizeObserver(() => update())
     try { if (chartInnerRef.current) ro.observe(chartInnerRef.current) } catch (e) { /* ignore */ }
     window.addEventListener('resize', update)
     return () => { mounted = false; try { ro.disconnect() } catch {} ; window.removeEventListener('resize', update) }
   }, [grouped7, monthlyData, avgLast7, currentMonth])

  // --- NEW: Beverage (coffee) state moved to parent ---
  const BEV_STORAGE_KEY = 'sleepBeverages_v1'
  const BEV_BACKUP_KEY = 'sleepBeverages_backup_v1'
  const BEV_SETTINGS_KEY = 'sleepBeverages_settings_v1'
  const DEFAULT_MAX_COFFEE = 3
  const [beverageMap, setBeverageMap] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(BEV_STORAGE_KEY)) || {}
      // migrate a few legacy shapes to the new { coffeeTimes: [...] } shape
      const migrated = {}
      Object.keys(raw).forEach(k => {
        const v = raw[k]
        // Already an object (likely new or partially new)
        if (v && typeof v === 'object') {
          if (Array.isArray(v.coffeeTimes)) {
            migrated[k] = v
          } else if (typeof v.coffee === 'number' && v.coffee > 0) {
            migrated[k] = { ...v, coffeeTimes: Array(v.coffee).fill('08:00') }
          } else {
            // keep object as-is (may be empty or contain other beverage info)
            migrated[k] = v
          }
        } else if (typeof v === 'number' && v > 0) {
          // legacy stored as a plain number -> convert
          migrated[k] = { coffeeTimes: Array(v).fill('08:00') }
        } else if (typeof v === 'string' && v.trim() !== '' && /^\d+$/.test(v.trim())) {
          // legacy numeric string
          const n = parseInt(v.trim(), 10)
          migrated[k] = { coffeeTimes: Array(n).fill('08:00') }
        } else {
          // unknown shape: keep as-is so we don't destroy data
          migrated[k] = v
        }
      })
      return migrated
    } catch (e) { console.warn('read beverageMap failed', e); return {} }
  })
  const [beverageBackup, setBeverageBackup] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BEV_BACKUP_KEY)) || null } catch (e) { console.warn('read bev backup failed', e); return null }
  })
  const [lateCoffeeHour, setLateCoffeeHour] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(BEV_SETTINGS_KEY)) || {}; return s.lateCoffeeHour ?? 15 } catch (e) { console.warn('read bev settings failed', e); return 15 }
  })

  useEffect(() => {
    try { localStorage.setItem(BEV_STORAGE_KEY, JSON.stringify(beverageMap)) } catch (e) { console.warn('save beverageMap failed', e) }
  }, [beverageMap])

  useEffect(() => {
    try { localStorage.setItem(BEV_BACKUP_KEY, JSON.stringify(beverageBackup)) } catch (e) { /* ignore */ }
  }, [beverageBackup])

  useEffect(() => {
    try { localStorage.setItem(BEV_SETTINGS_KEY, JSON.stringify({ lateCoffeeHour })) } catch (e) { console.warn('save bev settings failed', e) }
  }, [lateCoffeeHour])

  const saveDayBev = (dateKey, dayBev) => {
    if (!dateKey) return
    const next = { ...beverageMap, [dateKey]: dayBev }
    setBeverageMap(next)
    showToast(`Consumo salvato per ${format(parseISO(dateKey), 'dd MMM yyyy')}`, 'success')
  }

  const clearDayBev = (dateKey) => {
    if (!dateKey) return
    try {
      const existing = beverageMap[dateKey]
      if (existing) {
        const backupObj = { ts: Date.now(), date: dateKey, data: existing }
        localStorage.setItem(BEV_BACKUP_KEY, JSON.stringify(backupObj))
        setBeverageBackup(backupObj)
      }
    } catch (e) { console.warn('bev backup failed', e) }
    const next = { ...beverageMap }
    delete next[dateKey]
    setBeverageMap(next)
    showToast('Consumo giornaliero rimosso', 'info')
  }

  const restoreLastBeverageBackup = () => {
    try {
      const raw = localStorage.getItem(BEV_BACKUP_KEY)
      if (!raw) { showToast('Nessun backup bevande disponibile', 'error'); return }
      const obj = JSON.parse(raw)
      if (!obj || !obj.date) { showToast('Backup bevande invalido', 'error'); return }
      const next = { ...beverageMap, [obj.date]: obj.data }
      setBeverageMap(next)
      localStorage.removeItem(BEV_BACKUP_KEY)
      setBeverageBackup(null)
      showToast('Consumo bevande ripristinato', 'success')
    } catch (e) { console.warn('restore bev backup failed', e); showToast('Ripristino bevande fallito', 'error') }
  }

  // compute helper for coffee info
  const getCoffeeInfo = (dateKey) => {
    const stored = (beverageMap && beverageMap[dateKey]) ? beverageMap[dateKey] : {}
    const storedTimes = Array.isArray(stored.coffeeTimes) ? stored.coffeeTimes : []
    const coffeeCount = storedTimes.length || (typeof stored.coffee === 'number' ? stored.coffee : 0)
    const lateList = (storedTimes || []).filter(tm => {
      try { return parseInt(tm.split(':')[0], 10) >= Number(lateCoffeeHour) } catch (e) { return false }
    })
    return { coffeeTimes: storedTimes, coffeeCount, lateList, isLate: lateList.length > 0, stored }
  }

  // New: selected date state lifted to parent to show beverage block
  const [selectedDate, setSelectedDate] = useState(null)

  // --- Modal states & local form state for inline modals (Registra Sonno / Aggiungi Caffè)
  const [sleepModalOpen, setSleepModalOpen] = useState(false)
  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false)
  const [bedTime, setBedTime] = useState('22:30')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [awakenings, setAwakenings] = useState(0)
  const [coffeeTime, setCoffeeTime] = useState(() => {
    const d = new Date(); const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`
  })

  // Helper: combine a dateKey (yyyy-MM-dd) and a time (HH:mm) into ISO string
  const combineDateTimeISO = (dateKey, timeStr) => {
    try {
      const cleanTime = timeStr || '00:00'
      // return local datetime string without converting to UTC to avoid day shifts
      return `${dateKey}T${cleanTime}:00`
    } catch (e) { return `${dateKey || format(new Date(), 'yyyy-MM-dd')}T00:00:00` }
  }

  const openSleepModal = () => {
    setSleepModalOpen(true)
    setTimeout(() => {
      const el = document.querySelector('#sleep-bedtime')
      if (el && typeof el.focus === 'function') el.focus()
    }, 50)
  }
  const closeSleepModal = () => setSleepModalOpen(false)

  const openCoffeeModal = () => {
    setCoffeeModalOpen(true)
    setTimeout(() => {
      const el = document.querySelector('#coffee-time')
      if (el && typeof el.focus === 'function') el.focus()
    }, 50)
  }
  const closeCoffeeModal = () => setCoffeeModalOpen(false)

  // ESC handler for modals
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (sleepModalOpen) closeSleepModal()
        if (coffeeModalOpen) closeCoffeeModal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sleepModalOpen, coffeeModalOpen])

  const [serverEntries, setServerEntries] = useState({})
  const [serverLoading, setServerLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  // Monthly data state
  const monthBounds = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    // include i 6 giorni precedenti per coprire l'ultima settimana anche a cavallo mese
    const start = addDays(monthStart, -6)
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    const fmt = (d) => format(d, 'yyyy-MM-dd')
    return { startStr: fmt(start), endStr: fmt(end) }
  }, [currentMonth])

  // fetch month range when month changes
  useEffect(() => {
    if (!user || !user.id) return
    let active = true
    setServerLoading(true)
    setServerError('')
    getDailyLogsRange(user.id, monthBounds.startStr, monthBounds.endStr)
      .then((res) => {
        if (!active) return
        const raw = res?.data ?? res
        // adattati a varie forme di risposta (array diretto, {logs:[]}, {data:[]}, {data:{logs:[]}}, map)
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.logs)
            ? raw.logs
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(raw?.data?.logs)
                ? raw.data.logs
                : null

        let normalized = {}
        if (list) {
          normalized = list.reduce((acc, item) => {
            const rawKey = (item?.date || item?._id || '')
            const key = normalizeServerDateKey(rawKey)
            if (key) acc[key] = item
            return acc
          }, {})
        } else if (raw && typeof raw === 'object') {
          normalized = Object.entries(raw).reduce((acc, [k, v]) => {
            const key = normalizeServerDateKey(k)
            acc[key] = v
            return acc
          }, {})
        }
        console.log('[SleepTracker] range fetch', { start: monthBounds.startStr, end: monthBounds.endStr, keys: Object.keys(normalized), raw })
        setMonthlyData(normalized)
      })
      .catch((err) => {
        if (!active) return
        console.warn('fetch monthly logs failed', err)
        setServerError('Dati non disponibili per il mese')
      })
      .finally(() => { if (active) setServerLoading(false) })
    return () => { active = false }
  }, [monthBounds.startStr, monthBounds.endStr, user])

  useEffect(() => {
    const key = selectedDate || format(new Date(), 'yyyy-MM-dd')
    if (monthlyData && monthlyData[key]) {
      setServerEntries((prev) => ({ ...prev, [key]: monthlyData[key].inputs || {} }))
    }
  }, [selectedDate, monthlyData])

  const refetchMonth = () => {
    if (!user || !user.id) return
    getDailyLogsRange(user.id, monthBounds.startStr, monthBounds.endStr)
      .then((res) => {
        const raw = res?.data ?? res
        // adattati a varie forme di risposta (array diretto, {logs:[]}, {data:[]}, {data:{logs:[]}}, map)
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.logs)
            ? raw.logs
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(raw?.data?.logs)
                ? raw.data.logs
                : null

        let normalized = {}
        if (list) {
          normalized = list.reduce((acc, item) => {
            const rawKey = (item?.date || item?._id || '')
            const key = normalizeServerDateKey(rawKey)
            if (key) acc[key] = item
            return acc
          }, {})
        } else if (raw && typeof raw === 'object') {
          normalized = Object.entries(raw).reduce((acc, [k, v]) => {
            const key = normalizeServerDateKey(k)
            acc[key] = v
            return acc
          }, {})
        }
        console.log('[SleepTracker] range fetch', { start: monthBounds.startStr, end: monthBounds.endStr, keys: Object.keys(normalized), raw })
        setMonthlyData(normalized)
      })
      .catch((err) => console.warn('refetch month failed', err))
  }

  const handleSaveSleep = async ({ bedTime: newBed, wakeTime: newWake, awakenings: newAwakenings }) => {
    if (!user || !user.id) {
      showToast('Devi essere autenticato', 'error')
      return
    }
    const dateKey = selectedDate || format(new Date(), 'yyyy-MM-dd')
    const existingCoffee = (serverEntries[dateKey]?.sleep?.coffeeLog) || []

    const payload = {
      userId: user.id,
      mood: null,
      sleepHours: null,
      sport: null,
      sleep: {
        bedTime: newBed,
        wakeTime: newWake,
        awakenings: Number(newAwakenings) || 0,
        coffeeLog: existingCoffee,
      },
      date: dateKey,
    }

    try {
      await saveDailySleep(payload)
      setServerEntries((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
          sleep: { ...payload.sleep },
        },
      }))
      setMonthlyData((prev) => ({
        ...prev,
        [dateKey]: { ...(prev[dateKey] || {}), inputs: { ...(prev[dateKey]?.inputs || {}), sleep: payload.sleep } }
      }))
      refetchMonth()
      showToast('Sonno salvato', 'success')
      closeSleepModal()
    } catch (e) {
      console.warn('save sleep failed', e)
      showToast(e.message || 'Errore nel salvataggio', 'error')
    }
  }

  const handleSaveCoffee = async (newTime) => {
    if (!user || !user.id) {
      showToast('Devi essere autenticato', 'error')
      return
    }
    const dateKey = selectedDate || format(new Date(), 'yyyy-MM-dd')
    const existingSleep = serverEntries[dateKey]?.sleep || {}
    const currentCoffee = Array.isArray(existingSleep.coffeeLog) ? existingSleep.coffeeLog.slice() : []
    const nextCoffee = currentCoffee.concat({ time: newTime })

    const payload = {
      userId: user.id,
      mood: null,
      sleepHours: null,
      sport: null,
      sleep: {
        bedTime: existingSleep.bedTime || bedTime,
        wakeTime: existingSleep.wakeTime || wakeTime,
        awakenings: Number(existingSleep.awakenings ?? awakenings ?? 0),
        coffeeLog: nextCoffee,
      },
      date: dateKey,
    }

    try {
      await saveDailySleep(payload)
      setServerEntries((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] || {}),
          sleep: { ...payload.sleep },
        },
      }))
      setMonthlyData((prev) => ({
        ...prev,
        [dateKey]: { ...(prev[dateKey] || {}), inputs: { ...(prev[dateKey]?.inputs || {}), sleep: payload.sleep } }
      }))
      refetchMonth()
      showToast('Caffè salvato', 'success')
      closeCoffeeModal()
    } catch (e) {
      console.warn('save coffee failed', e)
      showToast(e.message || 'Errore nel salvataggio', 'error')
    }
  }

  const submitSleepModal = (e) => {
    e && e.preventDefault && e.preventDefault()
    try {
      handleSaveSleep({ bedTime, wakeTime, awakenings })
    } catch (err) {
      console.warn('submitSleepModal failed', err)
      showToast('Errore durante il salvataggio sonno', 'error')
    }
  }

  const submitCoffeeModal = (e) => {
    e && e.preventDefault && e.preventDefault()
    try {
      const timeVal = coffeeTime || '08:00'
      handleSaveCoffee(timeVal)
    } catch (err) {
      console.warn('submitCoffeeModal failed', err)
      showToast('Errore durante il salvataggio caffè', 'error')
    }
  }

  return (
    <div className="sleep-page new-sleep">
      <div className="page-header">
        <h1 className="small-title" style={{ position: 'relative' }}>
          Sleep Tracker
          <span className="zzz-container" aria-hidden style={{ position: 'absolute', right: -6, top: -18 }}>
            <span className="zzz z1">z</span>
            <span className="zzz z2">z</span>
            <span className="zzz z3">z</span>
          </span>
        </h1>
      </div>

      <div className="sleep-grid">
        <div className="col-left">
          <section className="card chart-card" style={{ position: 'relative' }} ref={chartSectionRef}>
            <h3 style={{ margin: 0, marginBottom: 16 }}>Qualità sonno (ultimi 7 giorni)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
              <div style={{ flex: '0 0 62%', minWidth: 0, maxWidth: '62%', paddingRight: 8 }} ref={chartInnerRef}>
                <Sleep7DayChart grouped={grouped7} />
              </div>
               {/* Badge positioned centrally but shifted to the right of the chart */}
               <div ref={badgeRef} className="sleep-badge" style={{
                 position: 'absolute',
                 /* if rightEdge mode, use right offset to pin to the section's right */
                 right: badgePlacement.mode === 'rightEdge' && badgePlacement.right ? `${badgePlacement.right}px` : undefined,
                 left: badgePlacement.mode !== 'rightEdge' ? (badgePlacement.left !== null ? `${badgePlacement.left}px` : 'calc(62% + 12px)') : undefined,
                 top: badgePlacement.mode === 'right' ? '50%' : (badgePlacement.mode === 'below' ? 'calc(100% + 12px)' : '50%'),
                 transform: badgePlacement.mode === 'right' ? 'translate(-50%, -50%)' : (badgePlacement.mode === 'below' ? 'translate(-50%, 0)' : 'translate(-50%, -50%)'),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 10px',
                  borderRadius: '16px',
                  background: avgLast7 === null ? 'rgba(156, 163, 175, 0.08)'
                    : avgLast7 <= 59 ? 'rgba(239, 68, 68, 0.08)'
                    : avgLast7 <= 79 ? 'rgba(245, 158, 11, 0.08)'
                    : 'rgba(16, 185, 129, 0.08)',
                  minWidth: '120px',
                  boxShadow: avgLast7 >= 80 ? '0 8px 20px rgba(16, 185, 129, 0.12)' : '0 4px 12px rgba(120, 113, 108, 0.06)',
                  zIndex: 3,
                  pointerEvents: 'none'
                }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: avgLast7 === null ? '#9CA3AF'
                    : avgLast7 <= 59 ? '#EF4444'
                    : avgLast7 <= 79 ? '#F59E0B'
                    : '#10B981',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {avgLast7 === null ? 'Inizia oggi!' : avgLast7 <= 59 ? 'Puoi migliorare!' : avgLast7 <= 79 ? 'Bel lavoro!' : 'Fantastico!'}
                </span>
                <span style={{
                  fontSize: '3.2rem',
                  lineHeight: 1,
                  animation: avgLast7 >= 80 ? 'pulse 2s ease-in-out infinite' : 'none',
                  transition: 'transform 0.3s ease'
                }}>
                  {avgLast7 === null ? '😶' : avgLast7 <= 59 ? '😴' : avgLast7 <= 79 ? '🙂' : '🚀'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: avgLast7 === null ? '#9CA3AF'
                      : avgLast7 <= 59 ? '#EF4444'
                      : avgLast7 <= 79 ? '#F59E0B'
                      : '#10B981'
                  }}>
                    {avgLast7 === null ? '—' : `${avgLast7}%`}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600
                  }}>
                    {avgLast7 === null ? 'Nessun dato' : avgLast7 <= 59 ? 'Da migliorare' : avgLast7 <= 79 ? 'Buono' : 'Ottimo'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Nuovo calendario per la visione mensile delle registrazioni */}

          <SleepCalendar
            entries={entries}
            onRemoveEntry={async (entryId) => {
              try {
                // try to find matching dailyLogId in monthlyData for the selected day
                const dateKey = selectedDate || format(new Date(), 'yyyy-MM-dd')
                const logId = monthlyData?.[dateKey]?.dailyLogId
                if (!user || !user.id || !logId) {
                  showToast('Nessun log da eliminare', 'error')
                  return
                }
                await clearDailySleep(logId, user.id)
                // aggiorna stato locale: rimuovi sleep dal giorno
                setMonthlyData((prev) => {
                  const next = { ...(prev || {}) }
                  const day = next[dateKey]
                  if (day && day.inputs) {
                    const copyInputs = { ...day.inputs }
                    delete copyInputs.sleep
                    next[dateKey] = { ...day, inputs: copyInputs }
                  }
                  return next
                })
                setServerEntries((prev) => {
                  const next = { ...(prev || {}) }
                  if (next[dateKey]) {
                    const copy = { ...next[dateKey] }
                    delete copy.sleep
                    next[dateKey] = copy
                  }
                  return next
                })
                showToast('Registrazione sonno rimossa', 'success')
              } catch (e) {
                console.warn('clear sleep failed', e)
                showToast('Errore durante la rimozione', 'error')
              }
            }}
            onAddEntry={handleAddEntry}
            onShowToast={showToast}
            beverageMap={beverageMap}
            lateCoffeeHour={lateCoffeeHour}
            selectedDate={selectedDate}
            onSelectDate={(iso) => setSelectedDate(iso)}
            onOpenSleepModal={openSleepModal}
            onOpenCoffeeModal={openCoffeeModal}
            monthlyData={monthlyData}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
          />

        </div>

        <aside className="col-right">

          {/* Card Unificata: Riepilogo Giornata + Consigli Intelligenti */}
          {user && user.id && (
              <SleepPredictionWidget userId={user.id} />
          )}
          {(() => {
            const dateKey = selectedDate || format(new Date(), 'yyyy-MM-dd')
            const dayEntries = (entries || []).filter((en) => {
              try {
                const d = en.start ? format(parseISO(en.start), 'yyyy-MM-dd') : format(new Date(en.date || en.start), 'yyyy-MM-dd')
                return d === dateKey
              } catch (e) { return false }
            })
            const serverDay = monthlyData[dateKey]?.inputs || serverEntries[dateKey] || {}
            const serverSleep = serverDay.sleep
            const hasSleep = dayEntries.length > 0 || !!serverSleep
            const { coffeeCount, coffeeTimes, lateList, isLate } = getCoffeeInfo(dateKey)
            const hasCoffee = coffeeCount > 0 || (serverSleep && Array.isArray(serverSleep.coffeeLog) && serverSleep.coffeeLog.length > 0)

            // Calcolo qualità media e durata
            let avgScore = 0
            let totalDuration = 0
            let totalAwakenings = 0
            let serverSleepScore = null
            let serverSleepDuration = 0
            if (hasSleep) {
              dayEntries.forEach(en => {
                try {
                  const startDt = parseISO(en.start || en.date)
                  const wakeDt = parseISO(en.wake || en.end || en.start)
                  totalDuration += differenceInMinutes(wakeDt, startDt)
                  avgScore += (en.score || 0)
                  totalAwakenings += (en.awakenings || 0)
                } catch (e) { /* skip */ }
              })
              if (serverSleep && serverSleep.bedTime && serverSleep.wakeTime) {
                try {
                  const s = combineDateTimeISO(dateKey, serverSleep.bedTime)
                  const w = combineDateTimeISO(dateKey, serverSleep.wakeTime)
                  const sDt = parseISO(s)
                  let wDt = parseISO(w)
                  if (wDt <= sDt) {
                    wDt = new Date(wDt.getTime() + 24 * 60 * 60 * 1000)
                  }
                  serverSleepDuration = differenceInMinutes(wDt, sDt)
                  totalDuration += serverSleepDuration
                  if (typeof serverSleep.calculatedScore === 'number') {
                    serverSleepScore = serverSleep.calculatedScore
                  } else {
                    serverSleepScore = calculateSleepEfficiency({ start: s, wake: formatISO(wDt), awakenings: Number(serverSleep.awakenings || 0) })
                  }
                  avgScore += serverSleepScore
                  totalAwakenings += Number(serverSleep.awakenings || 0)
                } catch (e) { /* ignore */ }
              }
              const divisor = dayEntries.length + (serverSleepScore !== null ? 1 : 0)
              avgScore = divisor > 0 ? Math.round(avgScore / divisor) : 0
            }

            // Genera consigli intelligenti con priorità
            const adviceList = []

            // 🔴 CRITICI (priority 1)
            if (hasSleep && totalDuration < 300) {
              adviceList.push({ text: `Sonno troppo breve (${formatDurationMinutes(totalDuration)}). Obiettivo minimo: 5-6 ore.`, priority: 1, icon: '🔴', type: 'critical' })
            }
            if (hasSleep && totalAwakenings > 3) {
              adviceList.push({ text: `Troppi risvegli (${totalAwakenings}). Controlla ambiente (temperatura, rumore, luce).`, priority: 1, icon: '🔴', type: 'critical' })
            }
            if (isLate) {
              adviceList.push({ text: `Caffè troppo tardi (${lateList.join(', ')}). Evita caffeina dopo le ${lateCoffeeHour}:00.`, priority: 1, icon: '🔴', type: 'critical' })
            }

            // 🟠 ATTENZIONE (priority 2)
            if (hasSleep && totalDuration >= 300 && totalDuration < 360) {
              adviceList.push({ text: `Sonno sufficiente ma breve (${formatDurationMinutes(totalDuration)}). Prova ad aggiungere 1-2 ore.`, priority: 2, icon: '🟠', type: 'warning' })
            }
            if (hasSleep && avgScore < 70) {
              adviceList.push({ text: `Qualità sonno da migliorare (${avgScore}%). Mantieni orari regolari e rilassati prima di dormire.`, priority: 2, icon: '🟠', type: 'warning' })
            }
            if (coffeeCount > 3) {
              adviceList.push({ text: `Consumo caffè elevato (${coffeeCount} al giorno). Limite consigliato: 3.`, priority: 2, icon: '🟠', type: 'warning' })
            }

            // 🟢 POSITIVI (priority 3)
            if (hasSleep && avgScore >= 80) {
              adviceList.push({ text: `Ottima qualità del sonno (${avgScore}%)! Continua così.`, priority: 3, icon: '🟢', type: 'success' })
            }
            if (hasSleep && totalDuration >= 420 && totalDuration <= 540) {
              adviceList.push({ text: `Durata ideale (${formatDurationMinutes(totalDuration)}). Perfetto per il recupero.`, priority: 3, icon: '🟢', type: 'success' })
            }
            if (hasSleep && totalAwakenings <= 1) {
              adviceList.push({ text: `Sonno continuo (${totalAwakenings} risveglio/i). Ottimo!`, priority: 3, icon: '🟢', type: 'success' })
            }

            // Suggerimento dedicato in base al punteggio medio
            if (hasSleep) {
              if (avgScore >= 0 && avgScore <= 59) {
                adviceList.push({ text: 'Prova a fare un riposino di 20 minuti nel primo pomeriggio o vai a letto un\'ora prima stasera.', priority: 1, icon: '🔴', type: 'critical' })
              } else if (avgScore >= 60 && avgScore <= 79) {
                adviceList.push({ text: "Cerca di evitare schermi o caffeina stasera per trasformare questo 'Buono' in 'Ottimo'!", priority: 2, icon: '🟠', type: 'warning' })
              } else if (avgScore >= 80) {
                adviceList.push({ text: 'Continua così! Mantenere questa regolarità è la chiave per il benessere a lungo termine.', priority: 3, icon: '🟢', type: 'success' })
              }
            }

            // Ordina per priorità
            adviceList.sort((a, b) => a.priority - b.priority)

            // Badge qualità
            const qualityBadge = avgScore >= 80 ? { text: 'Ottimo', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
              : avgScore >= 70 ? { text: 'Buono', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' }
              : avgScore >= 50 ? { text: 'Sufficiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
              : avgScore > 0 ? { text: 'Da migliorare', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
              : null

            // Stato per collassare consigli generici
            const [showGeneric, setShowGeneric] = React.useState(false)

            return (
              <section className="card unified-panel">
                {/* Header con badge qualità */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>📅 {selectedDate ? format(parseISO(dateKey), 'dd MMM yyyy') : 'Oggi'}</h3>
                  {qualityBadge && hasSleep && (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: qualityBadge.color,
                      background: qualityBadge.bg
                    }}>
                      {qualityBadge.text}
                    </span>
                  )}
                </div>

                {/* Sezione Dati */}
                {(hasSleep || hasCoffee) && (
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
                    {hasSleep && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Qualità sonno</span>
                      </div>
                    )}
                     {/* Sonno */}
                     {hasSleep && (
                       <div className="detail-section" style={{ marginBottom: 12 }}>
                        {dayEntries.map((en, idx) => {
                          try {
                            const startDt = parseISO(en.start || en.date)
                            const wakeDt = parseISO(en.wake || en.end || en.start)
                            const durationMins = differenceInMinutes(wakeDt, startDt)
                            const score = en.score || calculateSleepEfficiency(en)
                            return (
                              <div key={idx} style={{ background: 'var(--input-bg)', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600 }}>{format(startDt, 'HH:mm')} → {format(wakeDt, 'HH:mm')}</span>
                                  <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>{score}%</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                  Durata: {formatDurationMinutes(durationMins)} • Risvegli: {en.awakenings || 0}
                                </div>
                              </div>
                            )
                          } catch (e) { return null }
                        })}
                        {serverSleep && (
                          <div style={{ background: 'var(--input-bg)', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600 }}>{serverSleep.bedTime} → {serverSleep.wakeTime}</span>
                              <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>
                                {serverSleepScore !== null ? `${serverSleepScore}%` : 'Saved'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              Durata: {serverSleepDuration ? formatDurationMinutes(serverSleepDuration) : '—'} • Risvegli: {serverSleep.awakenings || 0}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Caffè */}
                    {(hasCoffee || (serverSleep && serverSleep.coffeeLog && serverSleep.coffeeLog.length)) && (
                      <div className="detail-section">
                        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 8, color: 'var(--text-dark)' }}>☕ Caffè</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {coffeeTimes.map((t, idx) => (
                            <div key={idx} style={{ background: 'var(--input-bg)', padding: '4px 10px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600 }}>
                              {t}
                            </div>
                          ))}
                          {serverSleep && Array.isArray(serverSleep.coffeeLog) && serverSleep.coffeeLog.map((c, idx) => (
                            <div key={`srv-${idx}`} style={{ background: 'var(--input-bg)', padding: '4px 10px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600 }}>
                              {c.time}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state dati */}
                {!hasSleep && !hasCoffee && (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0', marginBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
                    Nessun dato registrato. Usa i pulsanti nel calendario per iniziare.
                  </div>
                )}

                {/* Sezione Consigli Intelligenti */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 12, color: 'var(--text-dark)' }}>💡 Consigli per {selectedDate ? 'questo giorno' : 'oggi'}</h4>

                  {/* Consigli prioritizzati */}
                  {adviceList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {adviceList.map((adv, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: 8,
                            padding: 10,
                            borderRadius: 8,
                            background: adv.type === 'critical' ? 'rgba(239, 68, 68, 0.08)'
                              : adv.type === 'warning' ? 'rgba(245, 158, 11, 0.08)'
                              : 'rgba(16, 185, 129, 0.08)',
                            borderLeft: `3px solid ${adv.type === 'critical' ? '#ef4444' : adv.type === 'warning' ? '#f59e0b' : '#10b981'}`
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{adv.icon}</span>
                          <span style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-dark)' }}>{adv.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>
                      {hasSleep || hasCoffee ? 'Tutto ok! Nessuna criticità rilevata.' : 'Registra i tuoi dati per ricevere consigli personalizzati.'}
                    </div>
                  )}

                  {/* Consigli Generici (Collassabili) */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => setShowGeneric(!showGeneric)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ transform: showGeneric ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}>▶</span>
                      Best Practices (suggerimenti generici)
                    </button>
                    {showGeneric && (
                      <ul style={{ marginTop: 8, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <li>Mantieni orari regolari per andare a letto e svegliarsi</li>
                        <li>Evita schermi e luci blu 1 ora prima di dormire</li>
                        <li>Limita caffeina dopo le 15:00</li>
                        <li>Crea un ambiente buio, fresco e silenzioso</li>
                        <li>Evita pasti pesanti e alcol la sera</li>
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )
          })()}

        </aside>
      </div>

      {/* Conflict modal (detailed) */}
      {conflictModal.visible && (
        <div className="modal-overlay" onClick={closeConflictModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #e5e5e5'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#000000' }}>{conflictModal.title}</div>
            <pre style={{ whiteSpace: 'pre-wrap', marginBottom: 12, color: '#000000', fontFamily: 'Inter, Arial, sans-serif' }}>{conflictModal.message}</pre>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => { closeConflictModal() }}
                style={{ backgroundColor: '#f5f5f5', color: '#000000', borderColor: '#e5e5e5' }}
              >Annulla</button>
              <button
                className="btn"
                onClick={() => { try { if (typeof conflictModal.onConfirm === 'function') conflictModal.onConfirm() } finally { closeConflictModal() } }}
                style={{ backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000', fontWeight: '600' }}
              >Forza inserimento</button>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Modal (inline) */}
      {sleepModalOpen && (
        <div className="modal-backdrop" onClick={closeSleepModal}>
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-label="Registra Sonno" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Registra Sonno</h3>
            <form onSubmit={submitSleepModal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label>Orario di coricamento
                <input id="sleep-bedtime" type="time" value={bedTime} onChange={(e)=>setBedTime(e.target.value)} />
              </label>
              <label>Orario di sveglia
                <input type="time" value={wakeTime} onChange={(e)=>setWakeTime(e.target.value)} />
              </label>
              <label>Numero risvegli
                <input type="number" min={0} value={awakenings} onChange={(e)=>setAwakenings(Number(e.target.value||0))} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn" onClick={closeSleepModal}>Annulla</button>
                <button type="submit" className="btn primary">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coffee Modal (inline) */}
      {coffeeModalOpen && (
        <div className="modal-backdrop" onClick={closeCoffeeModal}>
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-label="Aggiungi Caffè" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Aggiungi Caffè</h3>
            <form onSubmit={submitCoffeeModal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label>Orario
                <input id="coffee-time" type="time" value={coffeeTime} onChange={(e)=>setCoffeeTime(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn" onClick={closeCoffeeModal}>Annulla</button>
                <button type="submit" className="btn primary">Aggiungi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast element */}
      <div className={`toast ${toast.type} ${toast.visible ? 'show' : ''}`} role="status" aria-live="polite">
        {toast.msg}
      </div>
    </div>
  )
}

// Small helper component inside same file to edit coffee times
function CoffeeTimesEditor({ initialTimes = [], onSave, onClear }) {
  const [times, setTimes] = useState(initialTimes || [])
  const [newTime, setNewTime] = useState('08:00')
  // removed closed state and auto-close behavior to allow more than 3 entries
  useEffect(() => setTimes(initialTimes || []), [initialTimes])

  useEffect(() => {
    // keep controlled input in sync when initialTimes change
    if (!initialTimes || initialTimes.length === 0) setNewTime('08:00')
  }, [initialTimes])

  const isValidTime = (v) => {
    if (typeof v !== 'string') return false
    const m = v.match(/^(\d{2}):(\d{2})$/)
    if (!m) return false
    const hh = Number(m[1]); const mm = Number(m[2])
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59
  }

  const handleAdd = (e) => {
    e.preventDefault()
    const val = (newTime || '').trim()
    if (!val || !isValidTime(val)) return
    // avoid exact duplicates
    if (times.includes(val)) {
      // still call onSave to ensure parent persistence if needed
      try { if (typeof onSave === 'function') onSave(times) } catch (err) { console.warn('auto-save duplicate failed', err) }
      return
    }
    const next = [...times, val]
    setTimes(next)
    // auto-save to parent so beverageMap updates immediately
    try { if (typeof onSave === 'function') onSave(next) } catch (e) { console.warn('auto-save add failed', e) }
    // reset input to a sensible default
    setNewTime('08:00')
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="time"
          id="_coffee_time_input"
          value={newTime}
          onChange={(ev) => setNewTime(ev.target.value)}
          style={{ padding: '6px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'transparent' }}
        />
        <button className="btn small" onClick={handleAdd} disabled={!isValidTime(newTime)}>Aggiungi</button>
        {/* Removed the "Svuota" button to keep the block minimal as requested */}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {times.map((t, idx) => (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem' }}>{t}</div>
            <button className="btn small danger" onClick={(e) => {
              e.preventDefault();
              const next = times.filter((_,i)=>i!==idx);
              setTimes(next);
              try { if (typeof onSave === 'function') onSave(next) } catch (err) { console.warn('auto-save remove failed', err) }
            }} aria-label={`Rimuovi orario ${t}`}>x</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn small" onClick={() => onSave(times)} disabled={times.length === 0}>Salva consumo</button>
        <button className="btn small danger" onClick={() => { onClear(); setTimes([]) }}>Rimuovi consumo</button>
      </div>
    </div>
  )
}
