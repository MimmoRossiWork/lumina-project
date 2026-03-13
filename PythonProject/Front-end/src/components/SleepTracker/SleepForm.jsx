import React, { useState, useEffect } from 'react'
import { calculateSleepEfficiency, suggestSmartAlarms } from '../../utils/sleepUtils'

export default function SleepForm({ onSave, initial }) {
  const [start, setStart] = useState(initial?.start || '')
  const [wake, setWake] = useState(initial?.wake || '')
  const [awakenings, setAwakenings] = useState(initial?.awakenings || 0)
  const [alarms, setAlarms] = useState([])

  useEffect(() => {
    if (start) setAlarms(suggestSmartAlarms(start))
  }, [start])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!start || !wake) return alert('Inserisci orario di coricamento e di sveglia')
    const entry = { id: Date.now(), date: new Date().toISOString(), start, wake, awakenings, factors: {}, score: calculateSleepEfficiency({ start, wake, awakenings }) }
    onSave(entry)
  }

  return (
    <section className="card sleep-form">
      <h3>Registra notte</h3>
      <form onSubmit={handleSubmit}>
        <label>Ora di andata a letto</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />

        <label>Ora di sveglia</label>
        <input type="datetime-local" value={wake} onChange={(e) => setWake(e.target.value)} />

        <label>Numero di risvegli</label>
        <input type="number" value={awakenings} min={0} onChange={(e) => setAwakenings(Number(e.target.value) || 0)} />

        {alarms.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#B8C6E6' }}>Suggerimenti sveglia (cicli 90 min):</div>
            <ul>
              {alarms.map((a) => <li key={a}>{new Date(a).toLocaleString()}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn primary" type="submit">Salva</button>
        </div>
      </form>
    </section>
  )
}
