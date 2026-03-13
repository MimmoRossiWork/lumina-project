import React, { useEffect, useState, useRef } from 'react'

const SUGGESTIONS = {
  respiri: {
    activities: ['Esegui 3 minuti di Box Breathing', 'Prova la respirazione 4-4-4 (3 min)'],
    breathing: ['Inspira 4s, trattieni 4s, espira 4s', 'Respira profondamente per 3 minuti'],
    gratitudePhrases: ['Sono grato per il mio respiro', "Apprezzo questo momento di calma"]
  },
  camminata: {
    activities: ['Passeggiata 10 minuti all\'aperto (mindful)', 'Camminata consapevole (5 min)'],
    breathing: ['Cammina e respira profondamente: inspira 3 passi, espira 3 passi'],
    gratitudePhrases: ['Grazie per il tempo all\'aperto', 'Grazie per le mie gambe che mi portano']
  },
  journaling: {
    activities: ['Scrivi 5 minuti quello che senti', 'Fai un journaling delle emozioni (2-5 min)'],
    breathing: ['Respira 3 volte prima di scrivere per centrarti'],
    gratitudePhrases: ['Sono grato per questo momento di introspezione']
  },
  stretching: {
    activities: ['5 minuti di stretching per collo e spalle', 'Sequenza rapida di mobilità'],
    breathing: ['Allunga e respira profondamente durante ogni movimento'],
    gratitudePhrases: ['Grazie per il mio corpo che si muove']
  },
  gratitudine: {
    activities: ['Scrivi 1 cosa positiva di oggi', 'Condividi una piccola gratitudine con qualcuno'],
    breathing: ['Respira e ripeti una frase di gratitudine'],
    gratitudePhrases: ['Sono grato per...', 'Grazie per...']
  },
  stress_support: {
    activities: ['Contatta una persona di fiducia', 'Se necessario cerca supporto professionale (linee d\'aiuto)'],
    breathing: ['Tecnica Box Breathing o 5-5 respirazione lenta'],
    gratitudePhrases: ['Posso chiedere aiuto quando ne ho bisogno']
  }
}

export default function JoyModal({ open, entry, date, onClose, onSave, onDelete, moodInfluence }) {
  const [emoji, setEmoji] = useState(entry && entry.emoji ? entry.emoji : '')
  const [joys, setJoys] = useState((entry && entry.joys) || [])
  const [newJoy, setNewJoy] = useState('')
  const [details, setDetails] = useState((entry && entry.details) || { activities: [], breathing: [], gratitudePhrases: [] })
  const contentRef = useRef(null)
  const firstFocusRef = useRef(null)

  useEffect(() => {
    // sync when entry changes
    setEmoji(entry && entry.emoji ? entry.emoji : '')
    setJoys((entry && entry.joys) || [])
    setDetails((entry && entry.details) || { activities: [], breathing: [], gratitudePhrases: [] })
    setNewJoy('')
  }, [entry])

  useEffect(() => {
    if (!open) return
    // focus the first input when modal opens
    const timer = setTimeout(() => {
      try { if (firstFocusRef.current) firstFocusRef.current.focus() } catch (e) { /* ignore */ }
    }, 0)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        try { onClose && onClose() } catch (err) {}
      } else if (e.key === 'Tab') {
        // simple focus trap
        const content = contentRef.current
        if (!content) return
        const focusable = content.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => { clearTimeout(timer); document.removeEventListener('keydown', handleKeyDown) }
  }, [open, onClose])

  if (!open) return null

  const pickSuggestions = () => {
    const pick = (moodInfluence && moodInfluence.pick) || 'gratitudine'
    const key = pick === 'respirazione' ? 'respiri'
      : pick === 'camminata' ? 'camminata'
      : pick === 'journaling' ? 'journaling'
      : pick === 'stretching' ? 'stretching'
      : pick === 'gratitudine' ? 'gratitudine'
      : pick === 'support' ? 'stress_support'
      : 'gratitudine'

    return SUGGESTIONS[key] || SUGGESTIONS.gratitudine
  }

  const suggestions = pickSuggestions()

  const addNewJoy = () => {
    if (!newJoy.trim()) return
    setJoys(j => [...j, newJoy.trim()])
    setNewJoy('')
  }

  const removeJoyAt = (idx) => setJoys(j => j.filter((_,i)=>i!==idx))

  const addSuggestionToJoys = (s) => setJoys(j => [...j, s])
  const addSuggestionToActivities = (s) => setDetails(d => ({ ...d, activities: [...(d.activities||[]), s] }))

  const resetLocalState = () => {
    setEmoji('')
    setJoys([])
    setNewJoy('')
    setDetails({ activities: [], breathing: [], gratitudePhrases: [] })
  }

  const handleSave = () => {
    const payload = { emoji: emoji || '🙂', joys, details }
    try { onSave && onSave(payload) } catch (e) { console.warn('onSave failed', e) }
    // reset local state so inputs are cleared next time modal opens for a different date
    resetLocalState()
    // close modal
    try { onClose && onClose() } catch (e) { /* ignore */ }
  }

  const handleDelete = () => {
    try { onDelete && onDelete() } catch (e) { console.warn('onDelete failed', e) }
    // also reset and close
    resetLocalState()
    try { onClose && onClose() } catch (e) { /* ignore */ }
  }

  return (
    <div className="joy-modal" role="dialog" aria-modal>
      <div className="joy-overlay" onClick={onClose} />
      <div className="joy-content" ref={contentRef}>
        <button className="joy-close" onClick={onClose} aria-label="Chiudi">✕</button>
        <h3>{date}</h3>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="joy-emoji" style={{ fontSize: 36 }}>{emoji || '—'}</div>
          <input ref={firstFocusRef} placeholder="Faccina (es. 🙂 o 😄)" value={emoji} onChange={(e)=>setEmoji(e.target.value)} style={{ fontSize: 18 }} />
        </div>

        <div className="joy-section">
          <h4>Le tue piccole gioie</h4>
          <ul>
            {joys.map((j,i)=> (
              <li key={i} style={{ display: 'flex', gap:8, alignItems:'center' }}>
                <span style={{ flex:1 }}>{j}</span>
                <button className="btn" onClick={()=>removeJoyAt(i)}>Rimuovi</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap:8, marginTop:8 }}>
            <input placeholder="Aggiungi una piccola gioia" value={newJoy} onChange={(e)=>setNewJoy(e.target.value)} />
            <button className="btn" onClick={addNewJoy}>Aggiungi</button>
          </div>
        </div>

        <div className="joy-section">
          <h4>Suggerimenti personalizzati (strategia stress e coping)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap:8 }}>
            <div>
              <strong>Attività consigliate</strong>
              <ul>
                {(suggestions.activities || []).map((s,i)=> <li key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>{s} <button className="btn" onClick={()=>addSuggestionToActivities(s)}>Aggiungi</button></li>)}
              </ul>
            </div>
            <div>
              <strong>Respirazione / Frasi utili</strong>
              <ul>
                {(suggestions.breathing || []).map((s,i)=> <li key={"b"+i} style={{ display: 'flex', justifyContent: 'space-between' }}>{s} <button className="btn" onClick={()=>addSuggestionToActivities(s)}>Aggiungi</button></li>)}
                {(suggestions.gratitudePhrases || []).map((s,i)=> <li key={"g"+i} style={{ display: 'flex', justifyContent: 'space-between' }}>{s} <button className="btn" onClick={()=>addSuggestionToJoys(s)}>Aggiungi come gioia</button></li>)}
              </ul>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn primary" onClick={handleSave}>Salva</button>
          <button className="btn danger" onClick={handleDelete} >Elimina</button>
          <button className="btn" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}
