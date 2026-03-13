import React, { useState, useEffect, useMemo, useRef, useContext } from 'react'
import './FitTracker.css'
import './FoodTracker.css'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import WaterTracker from '../components/FoodTracker/WaterTracker'
import { AuthContext } from '../AuthContext'

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://127.0.0.1:8000'

const STORAGE_KEY = 'foodtracker_entries'
const STORAGE_GOAL = 'foodtracker_goal'
const STORAGE_WATER = 'foodtracker_water'
const STORAGE_WATER_GOAL = 'foodtracker_water_goal'
const STORAGE_DATE = 'foodtracker_last_date'
const STORAGE_HISTORY = 'foodtracker_history_cache'

const getToday = () => new Date().toISOString().slice(0, 10)

// Database semplice di alimenti: calorie per porzione, categoria e macronutrienti (proteine, carboidrati, grassi)
const FOOD_DB = {
  Mela: { kcal: 95, kcalPer100: 52, category: 'frutta', protein: 0.5, carbs: 25, fats: 0.3 },
  Banana: { kcal: 105, kcalPer100: 89, category: 'frutta', protein: 1.3, carbs: 27, fats: 0.3 },
  Yogurt: { kcal: 120, kcalPer100: 59, category: 'latticini', protein: 8, carbs: 12, fats: 4 },
  Latte: { kcal: 122, kcalPer100: 64, category: 'latticini', protein: 8, carbs: 12, fats: 5 },
  Formaggio: { kcal: 113, kcalPer100: 402, category: 'latticini', protein: 7, carbs: 1, fats: 9 },
  Pane: { kcal: 80, kcalPer100: 265, category: 'cereali', protein: 3, carbs: 15, fats: 1 },
  'Pane integrale': { kcal: 70, kcalPer100: 247, category: 'cereali', protein: 3, carbs: 13, fats: 1 },
  Riso: { kcal: 206, kcalPer100: 130, category: 'cereali', protein: 4, carbs: 45, fats: 0.4 },
  Pasta: { kcal: 220, kcalPer100: 157, category: 'cereali', protein: 8, carbs: 43, fats: 1.3 },
  Cereali: { kcal: 120, kcalPer100: 379, category: 'cereali', protein: 3, carbs: 23, fats: 1.5 },
  Pesce: { kcal: 200, kcalPer100: 206, category: 'pesce', protein: 22, carbs: 0, fats: 12 },
  Tonno: { kcal: 150, kcalPer100: 132, category: 'pesce', protein: 28, carbs: 0, fats: 1 },
  Salmone: { kcal: 208, kcalPer100: 208, category: 'pesce', protein: 20, carbs: 0, fats: 13 },
  Merluzzo: { kcal: 90, kcalPer100: 82, category: 'pesce', protein: 18, carbs: 0, fats: 1 },
  Pollo: { kcal: 165, kcalPer100: 239, category: 'carne bianca', protein: 31, carbs: 0, fats: 4 },
  Tacchino: { kcal: 135, kcalPer100: 135, category: 'carne bianca', protein: 29, carbs: 0, fats: 1.5 },
  'Pollo fritto': { kcal: 320, kcalPer100: 320, category: 'fast food', protein: 25, carbs: 10, fats: 20 },
  Hamburger: { kcal: 295, kcalPer100: 295, category: 'carne rossa', protein: 17, carbs: 30, fats: 12 },
  Bistecca: { kcal: 250, kcalPer100: 217, category: 'carne rossa', protein: 26, carbs: 0, fats: 15 },
  Salsiccia: { kcal: 290, kcalPer100: 301, category: 'carne rossa', protein: 12, carbs: 1, fats: 26 },
  'Prosciutto cotto': { kcal: 120, kcalPer100: 145, category: 'salumi/processati', protein: 16, carbs: 1, fats: 6 },
  'Prosciutto crudo': { kcal: 160, kcalPer100: 240, category: 'salumi/processati', protein: 25, carbs: 0, fats: 9 },
  Salame: { kcal: 230, kcalPer100: 336, category: 'salumi/processati', protein: 16, carbs: 0, fats: 19 },
  Mortadella: { kcal: 200, kcalPer100: 311, category: 'salumi/processati', protein: 11, carbs: 2, fats: 17 },
  Wurstel: { kcal: 150, kcalPer100: 283, category: 'salumi/processati', protein: 12, carbs: 2, fats: 12 },
  'Hot dog': { kcal: 250, kcalPer100: 290, category: 'fast food', protein: 10, carbs: 20, fats: 15 },
  Kebab: { kcal: 350, kcalPer100: 250, category: 'fast food', protein: 20, carbs: 30, fats: 18 },
  Nuggets: { kcal: 270, kcalPer100: 280, category: 'fast food', protein: 15, carbs: 20, fats: 15 },
  Pizza: { kcal: 285, kcalPer100: 266, category: 'fast food', protein: 12, carbs: 33, fats: 10 },
  Patatine: { kcal: 152, kcalPer100: 536, category: 'fast food', protein: 2, carbs: 15, fats: 10 },
  Cioccolato: { kcal: 230, kcalPer100: 546, category: 'dolci', protein: 2, carbs: 25, fats: 14 },
  Biscotti: { kcal: 160, kcalPer100: 450, category: 'dolci', protein: 2, carbs: 22, fats: 7 },
  Uova: { kcal: 78, kcalPer100: 155, category: 'carne bianca', protein: 6, carbs: 0.6, fats: 5 },
  Ceci: { kcal: 164, kcalPer100: 164, category: 'legumi', protein: 9, carbs: 27, fats: 2.6 },
  Lenticchie: { kcal: 230, kcalPer100: 116, category: 'legumi', protein: 9, carbs: 20, fats: 0.4 },
  Fagioli: { kcal: 215, kcalPer100: 127, category: 'legumi', protein: 13, carbs: 40, fats: 1 },
  Insalata: { kcal: 15, kcalPer100: 15, category: 'verdura', protein: 1, carbs: 3, fats: 0.1 },
  Broccoli: { kcal: 55, kcalPer100: 34, category: 'verdura', protein: 4, carbs: 11, fats: 0.6 },
  Spinaci: { kcal: 40, kcalPer100: 23, category: 'verdura', protein: 5, carbs: 6, fats: 0.4 },
  Carote: { kcal: 50, kcalPer100: 41, category: 'verdura', protein: 1, carbs: 12, fats: 0.2 },
}

const DEFAULT_GOAL = 2000
// Normalizziamo il pasto finale a 'Snack' (invece di 'Spuntino')
const MEALS = ['Colazione', 'Pranzo', 'Cena', 'Snack']

const FOOD_HINTS = {
  mela: "Ricca di fibre e ottima per la digestione.",
  banana: "Fonte di potassio e energia rapida.",
  yogurt: "Contiene probiotici utili per l'intestino.",
  pane: "Fonte di carboidrati, meglio scegliere integrale.",
  riso: "Buona fonte di energia, preferire porzioni moderate.",
  pesce: "Ricco di proteine e acidi grassi omega-3.",
  pollo: "Proteine magre, ottimo per il recupero muscolare.",
  insalata: "Basso contenuto calorico e ricca di vitamine.",
  cioccolato: "Gustoso ma ricco di zuccheri e grassi, consumare con moderazione.",
  pizza: "Alto contenuto di sodio e grassi, consumare con moderazione.",
  patatine: "Alto contenuto di sale e grassi saturi, evitare il consumo frequente.",
}

const TIPS = [
  'Bevi un bicchiere d\'acqua prima dei pasti per favorire la sazietà.',
  'Preferisci frutta fresca come spuntino invece di snack industriali.',
  'Aggiungi una fonte di proteine a ogni pasto per aumentare il senso di sazietà.',
  'Scegli cereali integrali per un rilascio energetico più lento.',
  'Prova a preparare porzioni controllate per evitare eccessi.',
  'Bilancia il piatto: metà verdure, un quarto proteine e un quarto carboidrati.'
]

const CATEGORY_RULES = [
  { category: 'fast food', keywords: ['fritto', 'fried', 'nugget', 'patatine', 'fast food', 'kebab', 'hot dog', 'tempura'] },
  { category: 'dolci', keywords: ['cioc', 'bisc', 'dolce', 'torta', 'dessert'] },
  { category: 'carne rossa', keywords: ['hamburger', 'burger', 'manzo', 'bovino', 'bistecca', 'salsiccia', 'agnello', 'vitello'] },
  { category: 'carne bianca', keywords: ['pollo', 'tacchino', 'coniglio'] },
  { category: 'pesce', keywords: ['pesce', 'salmone', 'tonno', 'merluzzo'] },
  { category: 'salumi/processati', keywords: ['salume', 'salame', 'prosciutto', 'wurstel', 'mortadella'] },
  { category: 'cereali', keywords: ['pane', 'riso', 'pasta', 'cereali', 'farro', 'orzo'] },
  { category: 'frutta', keywords: ['mela', 'banana', 'pera', 'arancia', 'fragola', 'uva', 'pesca', 'albicocca'] },
  { category: 'verdura', keywords: ['insalata', 'carota', 'zucchina', 'pomodoro', 'broccolo', 'spinac', 'cavolo'] },
  { category: 'latticini', keywords: ['latte', 'yogurt', 'formaggio', 'burro'] },
  { category: 'legumi', keywords: ['fagioli', 'ceci', 'lenticchie', 'piselli'] },
]

const classifyCategory = (name) => {
  const k = (name || '').toLowerCase()
  const found = CATEGORY_RULES.find(({ keywords }) => keywords.some(word => k.includes(word)))
  return found ? found.category : 'altro'
}

function generateDescription(name) {
  if (!name) return ''
  const key = name.trim().toLowerCase()
  for (const k of Object.keys(FOOD_HINTS)) {
    if (key.includes(k)) return FOOD_HINTS[k]
  }
  if (key.includes('process') || key.includes('processato') || key.includes('conserv') || key.includes('fast') || key.includes('industrial')) {
    return "Cibo processato: alto contenuto di sale/grassi; consumare con moderazione."
  }
  return "Fonte di energia e nutrienti; preferire porzioni bilanciate e ingredienti freschi."
}

// Helper per formattare i numeri con massimo 1 decimale per la presentazione
const fmt1 = (v) => {
  if (v === null || v === undefined || v === '') return '0.0'
  const n = Number(v)
  if (Number.isNaN(n)) return '0.0'
  return n.toFixed(1)
}

function CustomSelect({ options = [], value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const ref = useRef(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const prevValue = useRef(value)
  const closeTimer = useRef(null)
  const isOpenRef = useRef(open)

  // keep ref in sync with open state so the document listener sees the current value
  useEffect(() => { isOpenRef.current = open }, [open])

  // helpers to animate open/close (arrow functions to satisfy lint rules)
  const startOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setClosing(false)
    setOpen(true)
  }
  const startClose = (delay = 180) => {
    setClosing(true)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
      closeTimer.current = null
    }, delay)
  }

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
    setHighlightedIndex(options.indexOf(value))
  }, [value, options])

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
        setHighlightedIndex((prev) => Math.min(options.length - 1, prev + 1))
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex((prev) => Math.max(0, prev - 1))
        e.preventDefault()
      } else if (e.key === 'Enter') {
        const v = options[highlightedIndex]
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
              className={`custom-option ${opt === value ? 'selected' : ''} ${i === highlightedIndex ? 'highlight' : ''}`}
              onClick={() => { onChange(opt); startClose() }}
            >
              <span>{opt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function FoodTracker() {
  const { user } = useContext(AuthContext)
  const [currentDate, setCurrentDate] = useState(getToday)
  const [loadingDay, setLoadingDay] = useState(false)
  const [history, setHistory] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_HISTORY); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })
  const [historyOpen, setHistoryOpen] = useState(false)
  const historyLoading = useRef(false)
  const flatHistory = useMemo(() => {
    const rows = []
    for (const day of history) {
      const foods = (day.foods && day.foods.length > 0) ? day.foods : [{ name: '—', calories: '—' }]
      foods.forEach((f, idx) => {
        rows.push({
          date: day.date,
          food: f.name,
          calories: f.calories,
          water: idx === 0 ? day.waterGlasses : '',
        })
      })
    }
    return rows
  }, [history])

  // entries
  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      // Migrazione semplice: mappa eventuali 'Spuntino' in 'Snack'
      if (Array.isArray(parsed)) {
        return parsed.map(e => ({ ...e, meal: e.meal === 'Spuntino' ? 'Snack' : e.meal }))
      }
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  // settings
  const [dailyGoal, setDailyGoal] = useState(() => {
    try {
      const g = localStorage.getItem(STORAGE_GOAL)
      return g ? Number(g) : DEFAULT_GOAL
    } catch {
      return DEFAULT_GOAL
    }
  })
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(dailyGoal)

  // water goal (persistito)
  const [waterGoal, setWaterGoal] = useState(() => {
    try {
      const gw = localStorage.getItem(STORAGE_WATER_GOAL)
      return gw ? Number(gw) : 8
    } catch { return 8 }
  })
  const [editingWaterGoal, setEditingWaterGoal] = useState(false)
  const [waterGoalInput, setWaterGoalInput] = useState(waterGoal)

  // water tracker (0-8)
  const [water, setWater] = useState(() => {
    try {
      const w = localStorage.getItem(STORAGE_WATER)
      return w ? Number(w) : 0
    } catch { return 0 }
  })

  // sync current day from backend when logged in (initial and when date changes)
  useEffect(() => {
    if (!user?.id) return
    const controller = new AbortController()
    async function loadDay(dateStr) {
      setLoadingDay(true)
      try {
        const res = await fetch(`${API_BASE}/api/v1/food/day?userId=${user.id}&date=${dateStr}`, { signal: controller.signal })
        const data = await res.json()
        if (data?.foodEntries) {
          setEntries(data.foodEntries.map(e => ({
            id: `${data.date}-${e.name}-${Math.random()}`,
            name: e.name,
            calories: e.calories,
            protein: e.protein,
            carbs: e.carbs,
            fats: e.fat,
            quantity: e.quantity,
            gramsPerUnit: null,
            totalGrams: e.unit === 'g' ? e.quantity : null,
            meal: e.meal,
            description: '',
            time: new Date().toISOString(),
            category: e.category,
          })))
          setWater(data.waterGlasses ?? 0)
          setDailyGoal(data?.dailyTotals?.calorie_target || dailyGoal)
        }
      } catch (err) { void err } finally { setLoadingDay(false) }
    }
    loadDay(getToday())
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // refresh history (latest 7 days) when user or date changes or entries change
  const fetchHistory = async () => {
    if (!user?.id || historyLoading.current) return
    historyLoading.current = true
    try {
      const res = await fetch(`${API_BASE}/api/v1/food/history?userId=${user.id}&limit=7`)
      const data = await res.json()
      if (data?.days) {
        setHistory(data.days)
        try { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(data.days)) } catch { /* ignore */ }
      }
    } catch (err) { void err } finally { historyLoading.current = false }
  }

  useEffect(() => { fetchHistory() }, [user?.id, currentDate, entries.length])

  // reset entries/water when stored date differs from today (initial load)
  useEffect(() => {
    const today = getToday()
    const savedDate = localStorage.getItem(STORAGE_DATE)
    if (savedDate !== today) {
      setEntries([])
      setWater(0)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
        localStorage.setItem(STORAGE_WATER, '0')
        localStorage.setItem(STORAGE_DATE, today)
      } catch { /* ignore */ }
    }
    setCurrentDate(today)
  }, [])

  // watch for day change while the page stays open; reset when day rolls over
  useEffect(() => {
    const id = setInterval(() => {
      const today = getToday()
      if (today !== currentDate) {
        setCurrentDate(today)
        setEntries([])
        setWater(0)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
          localStorage.setItem(STORAGE_WATER, '0')
          localStorage.setItem(STORAGE_DATE, today)
        } catch { /* ignore */ }
        if (user?.id) {
          fetch(`${API_BASE}/api/v1/food/day?userId=${user.id}&date=${today}`)
            .then(() => fetchHistory())
            .catch(() => {})
        }
      }
    }, 60000)
    return () => clearInterval(id)
  }, [currentDate, user?.id])

  // persist entries, goal, water
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch (err) { void err } }, [entries])
  useEffect(() => { try { localStorage.setItem(STORAGE_GOAL, String(dailyGoal)) } catch (err) { void err } }, [dailyGoal])
  useEffect(() => { try { localStorage.setItem(STORAGE_WATER, String(water)) } catch (err) { void err } }, [water])
  useEffect(() => { try { localStorage.setItem(STORAGE_WATER_GOAL, String(waterGoal)) } catch (err) { void err } }, [waterGoal])

  // Stati del form e suggerimenti (necessari per il calcolo e per evitare ReferenceError)
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [gramsPerUnit, setGramsPerUnit] = useState('')
  const [gramsTouched, setGramsTouched] = useState(false)
  const [gramsAutoCalculated, setGramsAutoCalculated] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [meal, setMeal] = useState(MEALS[0])
  const [tip, setTip] = useState('')

  // Consiglio del giorno casuale (usiamo requestAnimationFrame per evitare setState sync in effect)
  useEffect(() => { requestAnimationFrame(() => setTip(TIPS[Math.floor(Math.random() * TIPS.length)])) }, [])

  // derived totals
  const totalCalories = useMemo(() => entries.reduce((s, e) => s + Number(e.calories || 0), 0), [entries])
  const totalProtein = useMemo(() => entries.reduce((s, e) => s + Number(e.protein || 0), 0), [entries])
  const totalCarbs = useMemo(() => entries.reduce((s, e) => s + Number(e.carbs || 0), 0), [entries])
  const totalFats = useMemo(() => entries.reduce((s, e) => s + Number(e.fats || 0), 0), [entries])

  // interactive filters (per grafici)
  const [filterMeal, setFilterMeal] = useState(null) // e.g. 'Pranzo'
  const [filterMacro, setFilterMacro] = useState(null) // e.g. 'Proteine'

  // entries to display in diary after filters
  const filteredEntries = useMemo(() => {
    if (filterMeal) return entries.filter(e => e.meal === filterMeal)
    if (filterMacro) {
      const key = filterMacro === 'Proteine' ? 'protein' : filterMacro === 'Carboidrati' ? 'carbs' : 'fats'
      return entries.filter(e => Number(e[key] || 0) > 0)
    }
    return entries
  }, [entries, filterMeal, filterMacro])

  // pie chart data by meal
  const pieData = useMemo(() => {
    const map = {}
    for (const m of MEALS) map[m] = 0
    for (const e of entries) map[e.meal] = (map[e.meal] || 0) + Number(e.calories || 0)
    return MEALS.map((m) => ({ name: m, value: map[m] }))
  }, [entries])

  // macro pie chart data (grams) - valori arrotondati a 1 decimale per la visualizzazione
  const macroPieData = useMemo(() => {
    const total = totalProtein + totalCarbs + totalFats
    return [
      { name: 'Proteine', value: Number(totalProtein.toFixed(1)), percent: total ? Math.round((totalProtein / total) * 100) : 0 },
      { name: 'Carboidrati', value: Number(totalCarbs.toFixed(1)), percent: total ? Math.round((totalCarbs / total) * 100) : 0 },
      { name: 'Grassi', value: Number(totalFats.toFixed(1)), percent: total ? Math.round((totalFats / total) * 100) : 0 },
    ]
  }, [totalProtein, totalCarbs, totalFats])

  // (waterData ora gestito nel componente WaterTracker)

  // suggestions update
  useEffect(() => {
    const q = name.trim().toLowerCase()
    if (!q) {
      requestAnimationFrame(() => { setSuggestions([]); setShowSuggestions(false) })
      return
    }
    const list = Object.keys(FOOD_DB).filter((k) => k.toLowerCase().includes(q)).slice(0, 8)
    requestAnimationFrame(() => { setSuggestions(list); setShowSuggestions(list.length > 0) })
  }, [name])

  const handleSelectSuggestion = (s) => {
    setName(s)
    const info = FOOD_DB[s]
    if (info) {
      setCalories(String(info.kcal))
      setProtein(String(info.protein || ''))
      setCarbs(String(info.carbs || ''))
      // default gramsPerUnit: 100g per unit when kcalPer100 known
      setGramsPerUnit(info.kcalPer100 ? '100' : '')
      setQuantity(1)
      setGramsTouched(false)
      setGramsAutoCalculated(true)
    }
    setShowSuggestions(false)
  }

  // Se l'utente inserisce le calorie ma non i grammi per unità, prova a calcolare i grammiPerUnit
  useEffect(() => {
    try {
      const c = Number(String(calories).replace(/[^0-9.]/g, ''))
      if (gramsTouched) return // non sovrascrivere se l'utente ha modificato grammi
      if (!name || !c || Number.isNaN(c) || c <= 0) return
      const key = Object.keys(FOOD_DB).find(k => k.toLowerCase() === name.trim().toLowerCase())
      if (!key) return
      const kcalPer100 = FOOD_DB[key].kcalPer100
      if (!kcalPer100 || kcalPer100 <= 0) return
      // Only auto-calc gramsPerUnit when it hasn't been auto-calculated already
      if (gramsPerUnit && gramsAutoCalculated) return
      const q = Number(quantity) || 1
      // gramsPerUnit = (calories / (kcalPer100 * quantity)) * 100
      const gramsCalc = Math.round((c / (kcalPer100 * q)) * 100)
      if (gramsCalc > 0) requestAnimationFrame(() => { setGramsPerUnit(String(gramsCalc)); setGramsAutoCalculated(true) })
    } catch (err) {
      void err
    }
  }, [calories, name, gramsTouched, gramsAutoCalculated, gramsPerUnit, quantity])

  const handleAdd = (ev) => {
    ev.preventDefault()
    const n = name.trim()
    // parse values
    let q = Number(quantity) || 1
    let gPer = Number(String(gramsPerUnit).replace(/[^0-9.]/g, ''))
    let totalGrams = gPer ? gPer * q : 0
    let p = protein ? Number(protein) : 0
    let cb = carbs ? Number(carbs) : 0
    let f = 0

    // if grams provided and DB has kcalPer100, calculate calories from grams
    let c = Number(String(calories).replace(/[^0-9.]/g, ''))
    const key = Object.keys(FOOD_DB).find(k => k.toLowerCase() === n.toLowerCase())
    if (gPer > 0 && key && FOOD_DB[key].kcalPer100) {
      // total grams = gramsPerUnit * quantity
      totalGrams = gPer * q
      c = (totalGrams / 100) * FOOD_DB[key].kcalPer100
      // populate macros proportionally from DB using total grams (always compute from grams to reflect total)
      p = (FOOD_DB[key].protein || 0) * (totalGrams / 100)
      cb = (FOOD_DB[key].carbs || 0) * (totalGrams / 100)
      f = (FOOD_DB[key].fats || 0) * (totalGrams / 100)
    } else {
      // fallback: if no grams or DB entry, keep previous behavior (use c or KB)
      if ((!c || Number.isNaN(c) || c <= 0) && key) c = FOOD_DB[key].kcal
      // try to fill macros from DB even if grams missing
      if (key) {
        if (!p) p = FOOD_DB[key].protein || 0
        if (!cb) cb = FOOD_DB[key].carbs || 0
        if (!f) f = FOOD_DB[key].fats || 0
      }
    }

    if (!n || !c || Number.isNaN(c) || c <= 0) return
    const desc = generateDescription(n)
    const entry = {
      id: Date.now() + Math.random(),
      name: n,
      calories: Math.round(c),
      description: desc,
      time: new Date().toISOString(),
      meal,
      protein: Math.round(p * 10) / 10,
      carbs: Math.round(cb * 10) / 10,
      fats: Math.round(f * 10) / 10,
      quantity: q,
      gramsPerUnit: gPer || null,
      totalGrams: totalGrams || null,
      category: (() => {
        if (key) return FOOD_DB[key].category
        return classifyCategory(n)
      })(),
    }
    setEntries(prev => [entry, ...prev])
    // fire-and-forget salvataggio backend
    if (user?.id) {
      const payload = {
        userId: user.id,
        date: currentDate,
        entry: {
          name: n,
          quantity: q,
          unit: gPer > 0 ? 'g' : 'unit',
          meal,
          calories: Math.round(c),
          protein: Number(Math.round(p * 10) / 10),
          carbs: Number(Math.round(cb * 10) / 10),
          fat: Number(Math.round(f * 10) / 10),
          foodId: null,
          category: classifyCategory(n),
        },
      }
      fetch(`${API_BASE}/api/v1/food/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(() => fetchHistory()).catch(() => {})
    }
  }

  const handleRemove = (id) => setEntries(prev => prev.filter(it => it.id !== id))
  const handleClear = () => {
     setEntries([])
     setWater(0)
     // remove current day from backend if logged in
     if (user?.id) {
       const payload = {
         userId: user.id,
         date: currentDate,
       }
       fetch(`${API_BASE}/api/v1/food/day`, {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
       }).then(() => fetchHistory()).catch(() => {})
     }
   }

   const persistWater = (nextWater) => {
     if (!user?.id) return
     const payload = {
       userId: user.id,
       date: currentDate,
       waterGlasses: nextWater,
     }
     fetch(`${API_BASE}/api/v1/food/water`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
     }).then(() => fetchHistory()).catch(() => {})
   }

  // toggleWater logic è ora gestita nel componente WaterTracker

  const progressPct = Math.min(100, Math.round((totalCalories / (dailyGoal || 1)) * 100))

  // pie colors
  const PIE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa']

  // preview derived from gramsPerUnit, quantity e DB
  const preview = useMemo(() => {
    try {
      const n = name.trim()
      const key = Object.keys(FOOD_DB).find(k => k.toLowerCase() === n.toLowerCase())
      const q = Number(quantity) || 1
      const gPer = Number(String(gramsPerUnit).replace(/[^0-9.]/g, ''))
      const totalG = gPer ? gPer * q : 0
      if (key && gPer > 0 && FOOD_DB[key].kcalPer100) {
        const kcal = (totalG / 100) * FOOD_DB[key].kcalPer100
        const p = (FOOD_DB[key].protein || 0) * (totalG / 100)
        const cb = (FOOD_DB[key].carbs || 0) * (totalG / 100)
        const f = (FOOD_DB[key].fats || 0) * (totalG / 100)
        return { totalGrams: Math.round(totalG), kcal: Math.round(kcal), protein: Math.round(p*10)/10, carbs: Math.round(cb*10)/10, fats: Math.round(f*10)/10 }
      }
      // fallback: if user entered macros manually, scale them by quantity
      const manualP = Number(protein)
      const manualC = Number(carbs)
      const manualCalories = Number(String(calories).replace(/[^0-9.]/g, ''))
      if ((manualP || manualC) && q > 0) {
        return { totalGrams: totalG > 0 ? Math.round(totalG) : null, kcal: manualCalories ? Math.round(manualCalories * q) : null, protein: manualP ? Math.round(manualP * q*10)/10 : null, carbs: manualC ? Math.round(manualC * q*10)/10 : null, fats: null }
      }
      if (manualCalories && q > 0) {
        return { totalGrams: totalG > 0 ? Math.round(totalG) : null, kcal: Math.round(manualCalories * q), protein: null, carbs: null, fats: null }
      }
      return null
    } catch (err) { void err; return null }
  }, [name, gramsPerUnit, quantity, protein, carbs, calories])

  return (
    <div className="food-root fit-root">
      <header className="food-header">
        <h1>Diario Alimentare</h1>
      </header>

      <div className="tip">Consiglio del giorno: <strong>{tip}</strong></div>

      <main className="food-main">
         <section className="card food-input-card">
           <form onSubmit={handleAdd} className="food-form" autoComplete="off">
             <div className="food-input-row">
               <label className="field" style={{ flex: 1 }}>
                 <span>Alimento</span>
                 <div className="autocomplete-wrap">
                   <input
                     type="text"
                     value={name}
                     onChange={(e) => { setName(e.target.value); setGramsTouched(false); }}
                     onFocus={() => setShowSuggestions(suggestions.length > 0)}
                     onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                     placeholder="Esempio: Mela"
                     aria-label="Nome alimento"
                   />
                   {showSuggestions && suggestions.length > 0 && (
                     <ul className="suggestions">
                       {suggestions.map(s => (
                         <li key={s} onMouseDown={() => handleSelectSuggestion(s)}>{s} — {FOOD_DB[s]?.kcal ?? ''} kcal</li>
                       ))}
                     </ul>
                   )}
                 </div>
               </label>

               <div className="qty-grams-row">
                 <label className="field small qty-field">
                   <span>Quantità</span>
                   <div className="stepper" style={{ justifyContent: 'flex-start' }}>
                     <button type="button" className="stepper-btn" onClick={() => setQuantity(q => Math.max(1, Number(q) - 1))} aria-label="Decrementa quantità"><span className="stepper-symbol">−</span></button>
                     <input type="text" value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} aria-label="Quantità" />
                     <button type="button" className="stepper-btn" onClick={() => setQuantity(q => Number(q) + 1)} aria-label="Incrementa quantità"><span className="stepper-symbol">+</span></button>
                   </div>
                 </label>

                 <label className="field small grams-field">
                    <span>Grammi (g)</span>
                    <input type="number" inputMode="numeric" value={gramsPerUnit} onChange={(e) => { setGramsPerUnit(e.target.value); setGramsTouched(true); setGramsAutoCalculated(false) }} placeholder="es. 100" aria-label="Grammi per unità" />
                  </label>

                  {/* Grassi rimosso: calorie e macro saranno calcolati dal DB sui grammi totali */}
                </div>
              </div>

              {preview && (
                <div className="preview-card" style={{ marginTop: 8 }}>
                 <div className="preview-left">Anteprima porzione</div>
                 <div className="preview-body">
                   <div className="preview-item preview-grams">{preview.totalGrams ? `${preview.totalGrams} g` : ''}</div>
                   <div className="preview-item preview-kcal">{preview.kcal ? `${preview.kcal} kcal` : ''}</div>
                   <div className="preview-item preview-protein">{preview.protein ? `${preview.protein}g P` : ''}</div>
                   <div className="preview-item preview-carbs">{preview.carbs ? `${preview.carbs}g C` : ''}</div>
                   <div className="preview-item preview-fats">{preview.fats ? `${preview.fats}g F` : ''}</div>
                 </div>
                </div>
              )}

              <label className="field">
                <span>Pasto</span>
                <CustomSelect options={MEALS} value={meal} onChange={setMeal} ariaLabel="Seleziona pasto" />
              </label>

              <div className="food-form-actions">
                <button type="submit" className="btn primary">Aggiungi</button>
                <button type="button" className="btn reset-btn" style={{ backgroundColor: '#0b0b0b', color: '#ffffff', borderColor: '#0b0b0b', opacity: 1 }} onClick={() => { setName(''); setCalories(''); setProtein(''); setCarbs(''); setQuantity(1); setGramsPerUnit(''); setGramsTouched(false); }}>Reset</button>
              </div>
            </form>
          </section>
          <aside className="card food-summary">
            <div className="card-title">Obiettivo giornaliero</div>
            <div className="goal-row">
              <div className="goal-info">{totalCalories} / {dailyGoal} kcal</div>
              <div className="goal-edit">
                {editingGoal ? (
                  <>
                    <input type="number" value={goalInput} onChange={(e) => setGoalInput(Number(e.target.value))} />
                    <button className="btn small" onClick={() => { setDailyGoal(Number(goalInput) || DEFAULT_GOAL); setEditingGoal(false) }}>Salva</button>
                  </>
                ) : (
                  <button className="btn small" onClick={() => { setGoalInput(dailyGoal); setEditingGoal(true) }}>Modifica obiettivo</button>
                )}
              </div>
            </div>

            <div className="progress-wrap">
              <div className="progress-bar" aria-hidden>
                <div className={`progress-fill ${progressPct >= 100 ? 'over' : ''}`} style={{ width: `${progressPct}%` }} />
              </div>
              <div className="progress-pct">{progressPct}%</div>
            </div>

            <div className="macros-summary">
              {[
                { key: 'Proteine', value: totalProtein, color: '#34d399' },
                { key: 'Carboidrati', value: totalCarbs, color: '#60a5fa' },
                { key: 'Grassi', value: totalFats, color: '#f97316' },
              ].map((m) => (
                <div key={m.key} className={`meal-legend-item ${filterMacro === m.key ? 'active' : ''}`} onClick={() => setFilterMacro(prev => (prev === m.key ? null : m.key))} style={{ cursor: 'pointer', width: '100%' }}>
                  <span className="dot" style={{ background: m.color }} />
                  <div className="legend-text" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div className="legend-name">{m.key}</div>
                    <div className="legend-value">{fmt1(m.value)} g</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                className="btn reset-btn"
                style={{ backgroundColor: '#0b0b0b', color: '#ffffff', borderColor: '#0b0b0b' }}
                onClick={handleClear}
                disabled={entries.length === 0 && water === 0}
              >
                Reset giornata
              </button>
            </div>
          </aside>

         <section className="card food-diary">
            <div className="card-title">Diario</div>
            {filteredEntries.length === 0 ? (
              <div className="empty">Nessun alimento inserito (o nessun risultato per il filtro selezionato).</div>
            ) : (
              <ul className="entries">
                {filteredEntries.map((it) => (
                  <li key={it.id} className={`entry ${it.category || 'neutral'}`}>
                    <div className="entry-main">
                      <div>
                        <div className="entry-name">{it.name}</div>
                        <div className="entry-desc">{it.description}</div>
                      </div>
                      <div className="entry-side">
                        <div className="entry-cal">{it.calories} kcal</div>
                        <div className="entry-portion">
                          {it.totalGrams ? `${it.totalGrams} g` : (it.gramsPerUnit ? `${it.gramsPerUnit} g` : '')}
                          {it.quantity && it.quantity > 1 ? `  (${it.gramsPerUnit || ''}g × ${it.quantity})` : ''}
                        </div>
                        <div className="entry-meal">{it.meal}</div>
                      </div>
                    </div>

                    <div className="entry-meta">
                      <time>{new Date(it.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      <div className="entry-macros">{it.protein != null ? `${Number(it.protein).toFixed(1)}g P` : ''} {it.carbs != null ? `${Number(it.carbs).toFixed(1)}g C` : ''} {it.fats != null ? `${Number(it.fats).toFixed(1)}g F` : ''}</div>
                      <button className="btn small" onClick={() => handleRemove(it.id)}>Rimuovi</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

         {/* WaterTracker: componente separato per gestione acqua (Aggiungi, Reset) */}
         <WaterTracker
           water={water}
           setWater={(w) => { const v = typeof w === 'function' ? w(water) : w; setWater(v); persistWater(v); }}
           waterGoal={waterGoal}
           setWaterGoal={setWaterGoal}
           editingWaterGoal={editingWaterGoal}
           setEditingWaterGoal={setEditingWaterGoal}
           waterGoalInput={waterGoalInput}
           setWaterGoalInput={setWaterGoalInput}
         />

         {/* Storico giornate */}
         {user?.id && (
           <section className="card food-history">
             <div className="card-title history-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <span>Storico giorni recenti</span>
                 <span className="history-badge" style={{ background: '#0b0b0b', color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>{history.length}</span>
               </div>
               <button
                 type="button"
                 className="btn small"
                 style={{ background: '#111', color: '#fff', borderColor: '#111' }}
                 onClick={() => setHistoryOpen(o => !o)}
               >
                 {historyOpen ? 'Nascondi ▲' : 'Mostra ▼'}
               </button>
             </div>
             {historyOpen && (
               flatHistory.length === 0 ? (
                 <div className="empty">Nessun dato storico disponibile.</div>
               ) : (
                 <div className="history-table">
                   <div className="history-row history-header">
                     <div>Data</div>
                     <div>Alimento</div>
                     <div>Calorie</div>
                     <div>Acqua</div>
                   </div>
                   {flatHistory.map((row, idx) => (
                     <div className="history-row" key={`${row.date}-${idx}`}>
                       <div className="history-date">{row.date}</div>
                       <div className="history-foods">
                         <div className="history-food-chip">{row.food}</div>
                       </div>
                       <div className="history-calories">{row.calories === '—' ? '—' : `${row.calories} kcal`}</div>
                       <div className="history-water">{row.water !== '' ? `${row.water} bicchieri` : ''}</div>
                     </div>
                   ))}
                 </div>
               )
             )}
           </section>
         )}

         <section className="food-charts-grid">
           {/* Suddivisione Pasti */}
           <div className="card chart-card">
             <div className="chart-header"><div className="chart-title">Suddivisione Pasti</div></div>
             <div className="chart-wrapper meal-chart">
               <div className="chart-canvas">
                 {totalCalories > 0 ? (
                   <>
                     <ResponsiveContainer width="100%" height={180}>
                       <PieChart>
                         <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={52} paddingAngle={4} stroke="#111" strokeWidth={1}>
                           {pieData.map((entry, idx) => (
                             <Cell key={`m-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} opacity={filterMeal && filterMeal !== entry.name ? 0.4 : 1} cursor={entry.value > 0 ? 'pointer' : 'default'} onClick={() => { if (entry.value > 0) setFilterMeal(prev => prev === entry.name ? null : entry.name) }} />
                           ))}
                         </Pie>
                         <Tooltip />
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="chart-center"><div className="chart-center-value">{totalCalories} kcal</div><div className="chart-center-sub">Totale</div></div>
                   </>
                 ) : (
                   <div className="chart-empty">Aggiungi alimenti per visualizzare il grafico.</div>
                 )}
               </div>

               <div className="meal-legend" style={{ marginTop: 8 }}>
                 {pieData.map((p, i) => (
                   <div
                     key={p.name}
                     className={`meal-legend-item ${filterMeal === p.name ? 'active' : ''}`}
                     onClick={() => setFilterMeal(prev => prev === p.name ? null : p.name)}
                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterMeal(prev => prev === p.name ? null : p.name) }}
                     tabIndex={0}
                     role="button"
                     style={{ cursor: p.value > 0 ? 'pointer' : 'default', width: '100%' }}
                   >
                     <span className="dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                     <div className="legend-text" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><div className="legend-name">{p.name}</div><div className="legend-value">{p.value} kcal</div></div>
                   </div>
                 ))}
               </div>
             </div>
           </div>

           {/* Macronutrienti */}
           <div className="card chart-card">
             <div className="chart-header"><div className="chart-title">Macronutrienti</div></div>
             <div className="chart-wrapper macro-chart" style={{ position: 'relative' }}>
               <div className="chart-canvas">
                 {(totalProtein + totalCarbs + totalFats) > 0 ? (
                   <>
                     <ResponsiveContainer width="100%" height={180}>
                       <PieChart>
                         <Pie data={macroPieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={52} paddingAngle={4} stroke="#111" strokeWidth={1}>
                           {macroPieData.map((entry, idx) => (
                             <Cell key={`mac-${idx}`} fill={['#34d399', '#60a5fa', '#f97316'][idx % 3]} opacity={filterMacro && filterMacro !== entry.name ? 0.4 : 1} cursor={entry.value > 0 ? 'pointer' : 'default'} onClick={() => { if (entry.value > 0) setFilterMacro(prev => prev === entry.name ? null : entry.name) }} />
                           ))}
                         </Pie>
                         <Tooltip formatter={(val) => `${val} g`} />
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="chart-center"><div className="chart-center-value">{fmt1(totalProtein + totalCarbs + totalFats)} g</div><div className="chart-center-sub">Macro totali</div></div>
                   </>
                 ) : (
                   <div className="chart-empty">Nessun dato sui macronutrienti.</div>
                 )}
               </div>
             </div>
             <div className="macro-legend">
               {macroPieData.map((m, i) => (
                 <div
                   key={m.name}
                   className={`macro-legend-item ${filterMacro === m.name ? 'active' : ''}`}
                   onClick={() => setFilterMacro(prev => prev === m.name ? null : m.name)}
                   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterMacro(prev => prev === m.name ? null : m.name) }}
                   tabIndex={0}
                   role="button"
                   style={{ cursor: 'pointer' }}
                 >
                   <span className="dot" style={{ background: ['#34d399', '#60a5fa', '#f97316'][i] }} />
                   <div className="legend-text"><div className="legend-name">{m.name}</div><div className="legend-value">{fmt1(m.value)} g — {m.percent}%</div></div>
                 </div>
               ))}
             </div>
           </div>
         </section>
       </main>
     </div>
   )
 }
