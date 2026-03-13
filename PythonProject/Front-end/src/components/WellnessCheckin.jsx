import React, { useState, useEffect } from 'react'
import './WellnessCheckin.css'

const WELLNESS_ACTIVITIES = {
  CALM: [
    { title: 'Box Breathing', desc: 'Respira 4s in, 4s trattieni, 4s out, 4s trattenimento per 2 minuti.', duration: '2 min' },
    { title: 'Respirazione diaframmatica', desc: 'Appoggia una mano sul petto e una sull\'addome, respira lentamente contando fino a 4.', duration: '3 min' },
    { title: 'Ancoraggio visivo', desc: 'Fissa un punto e respira profondamente, concentrandoti sul corpo.', duration: '3 min' }
  ],
  DECOMPRESS: [
    { title: 'Camminata breve', desc: 'Fai una passeggiata di 5-10 minuti a passo sostenuto.', duration: '5-10 min' },
    { title: 'Stretching semplice', desc: 'Esegui 4 esercizi di allungamento per collo/spalle/schiena.', duration: '5 min' },
    { title: 'Disconnessione rapida', desc: 'Metti via il telefono per 10 minuti e concentrati sul respiro.', duration: '10 min' }
  ],
  ENERGIZE: [
    { title: 'Micro-movimento', desc: 'Fai 2 minuti di jumping jacks o marcia sul posto per aumentare l\'energia.', duration: '2 min' },
    { title: 'Acqua e respiro', desc: 'Bevi un bicchiere d\'acqua e fai 6 respiri profondi.', duration: '2 min' },
    { title: 'Pausa gratitudine', desc: 'Annota 3 cose positive accadute oggi.', duration: '3 min' }
  ],
  GROWTH: [
    { title: 'Mindful learning', desc: 'Leggi un breve articolo utile e prendi 1 nota pratica.', duration: '10 min' },
    { title: 'Obiettivo piccolo', desc: 'Scegli un compito piccolo e fallo ora (5-10 min).', duration: '10 min' },
    { title: 'Rifocalizza', desc: 'Fai una semplice lista prioritaria per i prossimi 30 minuti.', duration: '5 min' }
  ]
}

function pickOne(category) {
  const arr = WELLNESS_ACTIVITIES[category] || []
  if (!arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

function calculateIntervention(stress, anxiety, coping) {
  // stress, anxiety, coping are 1-10 integers
  if (anxiety > 7 || stress > 8) {
    return pickOne('CALM')
  }
  if (stress > 5) {
    return pickOne('DECOMPRESS')
  }
  if (stress <= 5 && coping < 5) {
    return pickOne('ENERGIZE')
  }
  return pickOne('GROWTH')
}

export default function WellnessCheckin({ onDone, initialMetrics = null, readOnly = false, onAcknowledge = null }) {
  const [stress, setStress] = useState(5)
  const [anxiety, setAnxiety] = useState(5)
  const [coping, setCoping] = useState(5)
  const [result, setResult] = useState(null)
  const [acknowledged, setAcknowledged] = useState(false)

  // If initialMetrics provided or readOnly mode, prefill values and compute result
  useEffect(() => {
    if (initialMetrics) {
      const s = Number(initialMetrics.stressLevel || initialMetrics.stress || 5)
      const a = Number(initialMetrics.anxietyLevel || initialMetrics.anxiety || 5)
      const c = Number(initialMetrics.copingAbility || initialMetrics.coping || 5)
      setStress(s)
      setAnxiety(a)
      setCoping(c)
      if (readOnly) {
        const intervention = calculateIntervention(s, a, c)
        setResult(intervention)
      }
    }
  }, [initialMetrics, readOnly])

  const handleGetAdvice = () => {
    // warn the user that submitting will lock the answers for today
    const msg = 'Attenzione: una volta inviato, non potrai più modificare la risposta per oggi. Rispondi sinceramente. Vuoi procedere?'
    if (!window.confirm(msg)) {
      return
    }
    // ensure numeric values
    const s = Number(stress)
    const a = Number(anxiety)
    const c = Number(coping)
    const intervention = calculateIntervention(s, a, c)
    setResult(intervention)
    // pass numeric mood metrics to parent so it can persist them correctly
    if (!readOnly && onDone && typeof onDone === 'function') {
      const moodMetrics = {
        stressLevel: s,
        anxietyLevel: a,
        copingAbility: c,
      }
      try {
        onDone({ moodMetrics, intervention })
      } catch (err) {
        // swallow errors from parent callback to avoid breaking UI
        console.error('WellnessCheckin onDone callback error:', err)
      }
    }
  }

  const handleDone = () => {
    if (readOnly) {
      // show a simple internal acknowledgement state and call optional callback
      setAcknowledged(true)
      if (onAcknowledge && typeof onAcknowledge === 'function') {
        try { onAcknowledge() } catch (e) { console.warn('onAcknowledge error', e) }
      }
      return
    }

    // normal flow: close result and reset
    setResult(null)
  }

  if (readOnly) {
    // In read-only mode: only show the advice or acknowledgment message
    return (
      <div className="wellness-checkin card">
        {!acknowledged ? (
          <div className="wellness-result">
            <h3>{result ? result.title : 'Consiglio'}</h3>
            <p className="wc-desc">{result ? result.desc : 'Grazie per aver risposto.'}</p>
            {result && <div className="wc-meta">Durata stimata: <strong>{result.duration}</strong></div>}
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={handleDone}>Fatto ✅</button>
            </div>
          </div>
        ) : (
          <div className="wellness-ack card" style={{ textAlign: 'center', padding: 20 }}>
            <h3>Ottimo lavoro! 🎉</h3>
            <p>Grazie per aver completato il micro-intervento.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="wellness-checkin card">
      {!result ? (
        <div className="wellness-form">
          <h2>Quiz rapido</h2>
          <p style={{ marginTop: 0 }}>Rispondi rapidamente per ottenere un micro-intervento giornaliero.</p>

          <label className="wc-row">
            <div className="wc-label">Livello di Stress</div>
            <input type="range" min="1" max="10" value={stress} onChange={e => setStress(Number(e.target.value))} />
            <div className="wc-value">{stress}</div>
          </label>

          <label className="wc-row">
            <div className="wc-label">Livello di Ansia</div>
            <input type="range" min="1" max="10" value={anxiety} onChange={e => setAnxiety(Number(e.target.value))} />
            <div className="wc-value">{anxiety}</div>
          </label>

          <label className="wc-row">
            <div className="wc-label">Capacità di gestire (Coping)</div>
            <input type="range" min="1" max="10" value={coping} onChange={e => setCoping(Number(e.target.value))} />
            <div className="wc-value">{coping}</div>
          </label>

          <div style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={handleGetAdvice}>Ottieni il mio consiglio</button>
          </div>
        </div>
      ) : (
        <div className="wellness-result">
          <h3>{result.title}</h3>
          <p className="wc-desc">{result.desc}</p>
          <div className="wc-meta">Durata stimata: <strong>{result.duration}</strong></div>
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={handleDone}>Fatto ✅</button>
          </div>
        </div>
      )}
    </div>
  )
}
