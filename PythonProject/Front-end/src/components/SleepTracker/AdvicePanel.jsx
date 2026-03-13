import React from 'react'

export default function AdvicePanel({ entry }) {
  if (!entry) return (
    <section className="card">
      <h3>Consigli</h3>
      <p>Nessun dato recente. Inserisci la tua ultima notte per ricevere consigli.</p>
    </section>
  )

  const adv = []
  if (entry.factors?.caffeina) adv.push('Hai bevuto caffè, prova a evitarlo dopo le 16:00')
  if (entry.factors?.alcol) adv.push("L'alcol può frammentare il sonno: limita il consumo prima di coricarti")
  if ((entry.awakenings || 0) > 2) adv.push("Troppi risvegli: valuta la qualità dell'ambiente del sonno")

  // small heuristic: short sleep
  const durationMins = Math.round((new Date(entry.wake) - new Date(entry.start)) / 60000)
  if (durationMins < 360) adv.push('Hai dormito meno di 6 ore: cerca di aggiungere tempo al riposo')

  return (
    <section className="card">
      <h3>Consigli personalizzati</h3>
      <ul>
        {adv.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
    </section>
  )
}
