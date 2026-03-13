import React, { useState, useEffect } from 'react'

const DEFAULT = { caffeina: false, alcol: false, esercizio: false, stress: false }

export default function FactorsChecklist({ onChange, initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial })

  useEffect(() => { if (onChange) onChange(state) }, [state, onChange])

  return (
    <section className="card">
      <h3>Fattori esterni</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.keys(state).map((k) => (
          <label key={k} style={{ color: '#D9E8FF' }}>
            <input type="checkbox" checked={state[k]} onChange={(e) => setState(s => ({ ...s, [k]: e.target.checked }))} /> {k.charAt(0).toUpperCase() + k.slice(1)}
          </label>
        ))}
      </div>
    </section>
  )
}
