import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function CyclesChart({ entry }) {
  // Expect entry to include minutes for light/deep/rem
  const data = entry ? [
    { name: 'Light', value: entry.lightMinutes || 0 },
    { name: 'Deep', value: entry.deepMinutes || 0 },
    { name: 'REM', value: entry.remMinutes || 0 },
  ] : []

  return (
    <section className="card">
      <h3>Analisi dei cicli</h3>
      <div style={{ width: '100%', height: 140 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#57534E" />
            <YAxis stroke="#57534E" />
            <Tooltip />
            <Bar dataKey="value" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

