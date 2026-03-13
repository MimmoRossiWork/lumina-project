import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function SleepScoreCard({ score = 0, entry }) {
  const duration = entry ? Math.round((new Date(entry.wake) - new Date(entry.start)) / 60000) : 0
  const data = [ { name: 'Score', value: score }, { name: 'Resto', value: Math.max(0, 100 - score) } ]

  return (
    <section className="card">
      <h3>Sleep Score</h3>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={40} outerRadius={60} startAngle={90} endAngle={-270}>
              {data.map((d, i) => (
                <Cell key={i} fill={i === 0 ? '#7C6BFF' : 'rgba(255,255,255,0.06)'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{score}%</div>
        <div style={{ color: '#B8C6E6' }}>{duration} minuti</div>
      </div>
    </section>
  )
}

