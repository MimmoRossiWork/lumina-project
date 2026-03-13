import React from 'react'

const EMOTION_COLORS = {
  joy: '#059669', // green
  sadness: '#3b82f6', // blue
  anger: '#ef4444', // red
  fear: '#7c3aed', // purple
  default: '#e5e7eb', // gray
}

export default function CalendarJoy({ days = [], joys = {}, notes = {}, logs = {}, logsLoaded = false, onDayClick, selected }) {
  const todayUtc = new Date().toISOString().slice(0,10)

  if (logsLoaded) {
    try {
      console.log('[CalendarJoy] logsLoaded, days count=', days.length, 'logs keys=', Object.keys(logs))
    } catch (e) {}
  }

  return (
    <div className="calendar-joy" role="grid" aria-label="Calendario delle gioie">
      {days.map(d => {
        // d is expected to be YYYY-MM-DD
        const entry = joys && joys[d]
        const note = notes && notes[d]
        const log = logs && logs[d]
        const mindset = log?.inputs?.mindset || null
        const emotion = (mindset && mindset.aiEmotion) ? String(mindset.aiEmotion).toLowerCase() : null
        const isToday = (d === todayUtc)
        const hasContent = Boolean(entry || note || log)
        const emotionClass = emotion ? ` emotion-${emotion}` : ''
        const cls = `day-cell ${isToday ? 'today' : ''} ${hasContent ? 'filled' : 'empty'} ${selected === d ? 'selected' : ''}${emotionClass}`
        const ariaLabelEmotion = emotion ? ` Emzione rilevata: ${emotion}.` : ''
        const label = `${d}${note ? ': Nota presente' : entry && entry.emoji ? `: ${entry.emoji}` : ': Nessuna voce'} ${ariaLabelEmotion}`
        const bg = emotion ? (EMOTION_COLORS[emotion] || EMOTION_COLORS.default) : undefined
        const excerpt = note ? (note.length > 30 ? note.slice(0,30) + '…' : note) : (entry && entry.joys && entry.joys.length ? entry.joys[0] : '')
        const dayNum = (typeof d === 'string' && d.length >= 10) ? String(Number(d.slice(8,10))) : d

        if (logsLoaded) {
          try {
            console.log(`[CalendarJoy] day=${d} emotion=${emotion} hasContent=${hasContent} logPresent=${!!log}`)
          } catch (e) {}
        }

        // Inline style: subtle background for the day cell when emotion present
        const cellStyle = {}
        if (bg) {
          cellStyle.backgroundColor = bg
          cellStyle.color = '#ffffff'
          cellStyle.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'
        }

        return (
          <div
            key={d}
            role="button"
            tabIndex={0}
            className={cls}
            onClick={() => onDayClick && onDayClick(d)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDayClick && onDayClick(d) } }}
            aria-label={label}
            title={excerpt}
            style={cellStyle}
          >
            <div className="day-num" aria-hidden>{dayNum}</div>
            {emotion && (
              <div className="emotion-badge" style={{ backgroundColor: bg }} aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}
