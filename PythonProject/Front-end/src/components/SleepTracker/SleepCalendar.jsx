import React, { useMemo, useState, useEffect } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, subMonths, addMonths, parseISO, differenceInMinutes } from 'date-fns'

// --- Nuovo grafico ultimi 7 giorni (ricostruito) ---
const Sleep7DayChart = ({ grouped }) => {
  const days = useMemo(() => {
    const arr = []
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i)
      arr.push({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'dd/MM') })
    }
    return arr
  }, [])

  const values = useMemo(() => days.map(({ key }) => {
    const items = grouped?.[key] || []
    if (!items.length) return null
    const sum = items.reduce((acc, it) => acc + (Number(it.score) || 0), 0)
    return Math.round(sum / items.length)
  }), [days, grouped])

  const width = 360
  const height = 140
  const padding = { top: 12, right: 12, bottom: 26, left: 32 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const yFor = (v) => {
    if (v === null || typeof v === 'undefined') return null
    const ratio = Math.min(Math.max(v, 0), 100) / 100
    return padding.top + (1 - ratio) * innerH
  }
  const xFor = (i) => padding.left + (i / (days.length - 1 || 1)) * innerW

  const pathD = values.reduce((acc, v, i) => {
    const y = yFor(v)
    if (y === null) return acc
    const x = xFor(i)
    return `${acc}${acc ? ' L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }, '')

  const allMissing = values.every(v => v === null)

  return (
    <div style={{ margin: 0, padding: 0, width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%' }} aria-hidden preserveAspectRatio="xMinYMid meet">
        {[0, 25, 50, 75, 100].map((g) => {
          const y = yFor(g)
          return (
            <g key={g}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(87,83,78,0.12)" />
              <text x={6} y={y + 4} fontSize={10} fill="#57534E">{g}</text>
            </g>
          )
        })}

        {!allMissing && pathD && (
          <path d={pathD} fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" />
        )}

        {values.map((v, i) => {
          const y = yFor(v)
          const x = xFor(i)
          return (
            <g key={i}>
              {v !== null && <circle cx={x} cy={y} r={4} fill="#059669" stroke="rgba(120,113,108,0.25)" />}
              <text x={x} y={height - 6} fontSize={10} textAnchor="middle" fill="#57534E">{days[i].label}</text>
              <title>{v === null ? `${days[i].label}: nessun dato` : `${days[i].label}: ${v}%`}</title>
            </g>
          )
        })}

        {allMissing && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#57534E" fontSize={12}>
            Nessun dato negli ultimi 7 giorni
          </text>
        )}
      </svg>
    </div>
  )
}
// --- fine Sleep7DayChart ---

export default function SleepCalendar({ entries = [], onRemoveEntry, onAddEntry, onShowToast, beverageMap = {}, lateCoffeeHour = 15, selectedDate: selectedDateProp, onSelectDate, onOpenSleepModal, onOpenCoffeeModal, monthlyData = {}, currentMonth: currentMonthProp, setCurrentMonth: setCurrentMonthProp }) {
  const [currentMonthState, setCurrentMonthState] = useState(new Date())
  const currentMonth = currentMonthProp || currentMonthState
  const setCurrentMonth = setCurrentMonthProp || setCurrentMonthState
  const [selectedDateInternal, setSelectedDateInternal] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [startTime, setStartTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [awakeningsInput, setAwakeningsInput] = useState(0)

  // Modal state per messaggi centrati
  const [modal, setModal] = useState({ visible: false, message: '', type: 'info' })

  const showModal = (message, type = 'info') => {
    setModal({ visible: true, message, type })
  }

  const closeModal = () => {
    setModal({ visible: false, message: '', type: 'info' })
  }

  // filter out entries explicitly marked as example; avoid hiding real user entries
  const serverEntries = useMemo(() => {
    const list = []
    Object.entries(monthlyData || {}).forEach(([dateKey, val]) => {
      const inputs = val?.inputs || {}
      const sleep = inputs.sleep
      if (sleep && sleep.bedTime && sleep.wakeTime) {
        list.push({
          id: `srv-${dateKey}`,
          start: `${dateKey}T${sleep.bedTime}:00`,
          wake: `${dateKey}T${sleep.wakeTime}:00`,
          awakenings: sleep.awakenings || 0,
          score: null,
          date: `${dateKey}T${sleep.bedTime}:00`,
          dateKey,
        })
      }
    })
    return list
  }, [monthlyData])

  // merge local and server entries
  const combinedEntries = useMemo(() => [...entries, ...serverEntries], [entries, serverEntries])

  const realEntries = useMemo(() => combinedEntries.filter(e => !e.example), [combinedEntries])

  // group entries by day string (yyyy-MM-dd)
  const grouped = useMemo(() => {
    const map = {}
    realEntries.forEach((en) => {
      const d = en.dateKey || (en.start ? format(parseISO(en.start), 'yyyy-MM-dd') : format(new Date(en.date || en.start), 'yyyy-MM-dd'))
      map[d] = map[d] || []
      map[d].push(en)
    })
    return map
  }, [realEntries])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const weeks = []
  let day = startDate
  while (day <= endDate) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1))
  const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1))

  const dayKey = (d) => format(d, 'yyyy-MM-dd')

  // helper to check if an ISO date-key is in the future (compares yyyy-MM-dd strings)
  const isFutureKey = (iso) => {
    try {
      if (!iso) return false
      return iso > dayKey(new Date())
    } catch (e) {
      console.warn('isFutureKey failed', e)
      return false
    }
  }

  // helper to show toast via callback or fallback to modal centrato
  const notify = (msg, type = 'info') => {
    if (typeof onShowToast === 'function') onShowToast(msg, type)
    else showModal(msg, type)
  }

  const monthLabel = format(monthStart, 'MMMM yyyy')

  // displayDate: usa la data selezionata o oggi come fallback
  const selectedDate = typeof selectedDateProp !== 'undefined' ? selectedDateProp : selectedDateInternal
  const displayDate = selectedDate || dayKey(new Date())

  // flags per UI: la data mostrata o selezionata è nel futuro?
  const displayIsFuture = isFutureKey(displayDate)
  const selectedIsFuture = selectedDate ? isFutureKey(selectedDate) : false

  const handleSelectDate = (iso) => {
    // if selecting a future date, inform the user and keep the UI in a non-editable state
    if (isFutureKey(iso)) {
      notify('Hai selezionato una data futura: non puoi aggiungere registrazioni o modificare consumi per questa data', 'error')
      // still set selected for viewing, but ensure forms/inputs are closed/disabled
      if (typeof onSelectDate === 'function') onSelectDate(iso)
      else setSelectedDateInternal(iso)
      setShowAddForm(false)
      return
    }

    if (typeof onSelectDate === 'function') onSelectDate(iso)
    else setSelectedDateInternal(iso)
  }

  useEffect(() => {
    // nothing to persist here in the stripped calendar - beverage persistence moved to parent when needed
  }, [])

  return (
    // apply font-family to all text inside the calendar and use inline styles for button colors
    <div className="sleep-calendar card" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn ghost" onClick={prevMonth} aria-label="Mese precedente">‹</button>
          <div style={{ fontWeight: 700 }}>{monthLabel}</div>
          <button className="btn ghost" onClick={nextMonth} aria-label="Mese successivo">›</button>
        </div>
        <div className="calendar-hint">Seleziona un giorno per i dettagli</div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map((d) => <div key={d} className="weekday">{d}</div>)}
        </div>

        <div className="calendar-weeks">
          {weeks.map((week, wi) => (
            <div key={wi} className="calendar-week">
              {week.map((d) => {
                const iso = dayKey(d)
                const has = !!grouped[iso]
                const bev = (beverageMap && beverageMap[iso]) ? beverageMap[iso] : null
                const hasBev = !!bev && ((Array.isArray(bev.coffeeTimes) && bev.coffeeTimes.length > 0) || (typeof bev.coffee === 'number' && bev.coffee > 0))
                const dayEntries = grouped[iso] || []
                const avgScore = dayEntries.length ? Math.round(dayEntries.reduce((s, e) => s + (e.score || 0), 0) / dayEntries.length) : null
                // prepare badge tooltip and late-coffee flag (coffee only)
                const coffeeCount = bev && Array.isArray(bev.coffeeTimes) ? bev.coffeeTimes.length : (bev && typeof bev.coffee === 'number' ? bev.coffee : 0)
                const badgeTooltip = coffeeCount ? `${coffeeCount} caffè${Array.isArray(bev && bev.coffeeTimes) && bev.coffeeTimes.length ? ' (' + (bev.coffeeTimes || []).join(', ') + ')' : ''}` : 'Nessun consumo registrato'
                const isLateCoffee = bev && Array.isArray(bev.coffeeTimes) && bev.coffeeTimes.some((tm) => {
                  try { const hour = parseInt(tm.split(':')[0], 10); return !isNaN(hour) && hour >= Number(lateCoffeeHour) } catch (e) { console.warn('parse coffee time failed', e); return false }
                })
                 return (
                   <button
                     key={iso}
                     type="button"
                     className={`day-cell ${isSameMonth(d, monthStart) ? '' : 'muted'} ${has ? 'has-entry' : ''} ${selectedDate === iso ? 'selected' : ''}`}
                     onClick={() => handleSelectDate(iso)}
                     aria-pressed={selectedDate === iso}
                     title={has ? `${dayEntries.length} registrazione(i)` : 'Nessuna registrazione'}
                   >
                     <div className="day-number">{format(d, 'd')}</div>
                     {has && (
                       <div className="day-dot" aria-hidden="true" style={{ background: avgScore >= 80 ? '#10b981' : avgScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                     )}
                     {hasBev && (
                       <div className={`day-badge ${isLateCoffee ? 'late' : ''}`} aria-hidden="true" title={badgeTooltip}>
                         {coffeeCount ? `☕${coffeeCount}` : '☕'}
                       </div>
                     )}
                   </button>
                 )
               })}
            </div>
          ))}
        </div>
      </div>

      {/* ALERT FUTURO: modal globale centrato nella pagina (overlay fullscreen) */}
      {displayIsFuture && (
        <div className="modal-overlay" onClick={() => { /* click outside -> do nothing specific */ }}>
          <div className="modal-content modal-future-content" onClick={(e) => e.stopPropagation()} role="alert">
            <div className="modal-future-title">Data futura selezionata</div>
            <div className="modal-future-body">Non è possibile registrare dati o consumi per date future ({format(parseISO(displayDate), 'dd MMM yyyy')}). Seleziona una data odierna o passata per aggiungere registrazioni.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={() => { if (typeof onSelectDate === 'function') { onSelectDate(null); setCurrentMonth(new Date()); notify('Vista impostata a oggi', 'info') } else { setSelectedDateInternal(null); setCurrentMonth(new Date()); notify('Vista impostata a oggi', 'info') } }}
                style={{ backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' }}
              >Vai a oggi</button>
              <button
                className="btn ghost"
                onClick={() => { const todayKey = dayKey(new Date()); if (typeof onSelectDate === 'function') { onSelectDate(todayKey); setCurrentMonth(new Date()); notify('Selezionata la data odierna', 'info') } else { setSelectedDateInternal(todayKey); setCurrentMonth(new Date()); notify('Selezionata la data odierna', 'info') } }}
                style={{ backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' }}
              >Seleziona oggi</button>
            </div>
          </div>
        </div>
      )}

      <div className="calendar-details" style={{ marginTop: 10 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{format(parseISO(displayDate), 'dd MMM yyyy')}{!selectedDate && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.6)', fontWeight:400 }}>(Oggi)</span>}</div>

          { (grouped[displayDate] || []).length === 0 ? (
            <div className="empty">Nessuna registrazione per questo giorno</div>
          ) : (
            <ul className="entries-list">
              { (grouped[displayDate] || []).map((en) => {
                 let durationMins = 0
                 try {
                   durationMins = differenceInMinutes(parseISO(en.wake || en.end || en.start), parseISO(en.start || en.date))
                   if (isNaN(durationMins) || durationMins < 0) durationMins = 0
                 } catch (e) {
                   console.warn('compute duration failed', e)
                   durationMins = 0
                 }
                 return (
                   <li key={en.id} className="entry-row">
                     <div className="entry-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div className="entry-date">{en.start ? new Date(en.start).toLocaleTimeString() : new Date(en.date).toLocaleTimeString()}</div>
                         <div className="entry-duration">{en.awakenings} risvegli • {en.score}% efficienza • {durationMins} minuti</div>
                       </div>
                       <div style={{ marginLeft: 12 }}>
                         {onRemoveEntry && (
                           <button className="btn ghost" onClick={() => { if (confirm('Eliminare questa registrazione?')) onRemoveEntry(en.id) }} aria-label="Elimina registrazione">Elimina</button>
                         )}
                       </div>
                     </div>
                   </li>
                 )
               })}
            </ul>
          )}

          {/* Pulsanti azione: Registra Sonno e Aggiungi Caffè */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {onOpenSleepModal && (
              <button
                className="btn primary"
                onClick={() => {
                  if (displayIsFuture) {
                    notify('Non è possibile registrare sonno per date future', 'error')
                    return
                  }
                  onOpenSleepModal()
                }}
                disabled={displayIsFuture}
                aria-label="Registra Sonno"
                style={{ flex: '1 1 auto', minWidth: '140px' }}
              >
                🌙 Registra Sonno
              </button>
            )}
            {onOpenCoffeeModal && (
              <button
                className="btn ghost"
                onClick={() => {
                  if (displayIsFuture) {
                    notify('Non è possibile registrare caffè per date future', 'error')
                    return
                  }
                  onOpenCoffeeModal()
                }}
                disabled={displayIsFuture}
                aria-label="Aggiungi Caffè"
                style={{ flex: '1 1 auto', minWidth: '140px' }}
              >
                ☕ Aggiungi Caffè
              </button>
            )}
          </div>

          {/* Pulsante e form rimossi: ora si usano i modali principali sopra */}

          {false && showAddForm && onAddEntry && (
            <form onSubmit={(e) => {
              e.preventDefault()
              if (displayIsFuture) { notify('Impossibile creare registrazioni per date future', 'error'); return }
              try {
                const startDt = new Date(`${displayDate}T${startTime}`)
                let wakeDt = new Date(`${displayDate}T${wakeTime}`)
                if (isNaN(startDt) || isNaN(wakeDt)) { notify('Orari non validi', 'error'); return }
                // se wake è <= start, si assume il giorno successivo
                if (wakeDt <= startDt) {
                  wakeDt = new Date(wakeDt.getTime() + 24 * 60 * 60 * 1000)
                }
                const duration = differenceInMinutes(wakeDt, startDt)
                // limiti: almeno 5 minuti, al massimo 24 ore (1440 minuti)
                if (duration < 5) { notify('La durata deve essere almeno 5 minuti', 'error'); return }
                if (duration > 24 * 60) { notify('Durata troppo lunga (max 24 ore)', 'error'); return }
                const startISO = startDt.toISOString()
                const wakeISO = wakeDt.toISOString()
                onAddEntry({ start: startISO, wake: wakeISO, awakenings: Number(awakeningsInput) || 0 })
                // reset form
                setShowAddForm(false)
                notify('Registrazione aggiunta', 'success')
              } catch {
                notify('Impossibile creare la registrazione: controlla i valori', 'error')
              }
            }} style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Ora coricamento</span>
                  <input type="time" value={startTime} onChange={(ev) => setStartTime(ev.target.value)} style={{ padding: '8px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Ora sveglia</span>
                  <input type="time" value={wakeTime} onChange={(ev) => setWakeTime(ev.target.value)} style={{ padding: '8px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Risvegli</span>
                  <input type="number" min={0} value={awakeningsInput} onChange={(ev) => setAwakeningsInput(Number(ev.target.value) || 0)} style={{ width: 80, padding: '8px' }} />
                </label>
                <button
                  className="btn"
                  type="submit"
                  disabled={displayIsFuture}
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderColor: '#000000',
                    padding: '8px 16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >Salva</button>
              </div>
            </form>
          )}

          {/* Beverage UI moved to parent; this calendar only shows badges on days via the beverageMap prop */}
        </div>
      </div>

      {/* Modal centrato per messaggi */}
      {modal.visible && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface-white, #FFFFFF)',
              borderRadius: 'var(--radius-card, 24px)',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(120, 113, 108, 0.25), 0 8px 20px rgba(120, 113, 108, 0.15)',
              animation: 'slideIn 300ms cubic-bezier(.2,.9,.3,1)',
              position: 'relative'
            }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: modal.type === 'error' ? '#DC2626' : modal.type === 'success' ? '#059669' : '#292524',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {modal.type === 'error' ? '⚠️ Attenzione' : modal.type === 'success' ? '✅ Successo' : 'ℹ️ Informazione'}
            </div>
            <div style={{
              fontSize: '15px',
              color: '#57534E',
              lineHeight: '1.6',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              {modal.message}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn primary"
                onClick={closeModal}
                style={{
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#000000',
                  borderColor: '#000000',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// export named per riutilizzo del grafico in altre pagine
export { Sleep7DayChart }
