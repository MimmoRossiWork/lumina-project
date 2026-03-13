import React, { useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function AdaptiveCard({ title, type = 'likert', onAnswered, trendData = [3,3,3,3,3,3,3] }) {
  const [value, setValue] = useState(null)
  const emojis = ['😞','😕','😐','🙂','😊']
  const handle = (v) => {
    setValue(v)
    if (typeof onAnswered === 'function') onAnswered(v)
  }

  const chartData = Array.isArray(trendData) ? trendData.map((v, i) => ({ x: i, y: Number(v) || 0 })) : []

  return (
    <div className="adaptive-card">
      <h4>{title}</h4>

      {/* show likert emojis unless this is a trend card that has been answered */}
      {!(type === 'trend' && value) && (
        <div className="likert">
          {emojis.map((e, idx) => (
            <button key={idx} className={`likert-btn ${value === idx+1 ? 'active' : ''}`} onClick={() => handle(idx+1)} aria-pressed={value===idx+1}>{e}</button>
          ))}
        </div>
      )}

      {/* if answered and this is a trend card, show sparkline */}
      {type === 'trend' && value && (
        <div className="sparkline-container">
          <ResponsiveContainer width="100%" height={64}>
            <LineChart data={chartData} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
              <Line type="monotone" dataKey="y" stroke="#5c0c93" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="sparkline-footer">Ultimi 7 giorni</div>
        </div>
      )}

      {value && type !== 'trend' && (
        <div className="suggestion">Grazie! Suggerimento: prova a fare una breve pausa di 5 minuti.</div>
      )}

      {type === 'trend' && value && (
        <div className="suggestion">Grazie! I tuoi ultimi 7 giorni sono mostrati sopra.</div>
      )}
    </div>
  )
}
