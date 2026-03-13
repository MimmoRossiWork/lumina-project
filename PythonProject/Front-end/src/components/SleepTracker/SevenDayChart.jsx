import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

export default function SevenDayChart({ history = [] }) {
  const [collapsed, setCollapsed] = useState(false)
  const last7 = history.slice(0, 7).reverse()
  const data = last7.map((e) => ({ date: format(new Date(e.date), 'dd/MM'), value: e.score || e.computedScore || 0 }))

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Ultimi 7 giorni</h3>
        <button
          className="btn-icon"
          onClick={() => setCollapsed(c => !c)}
          aria-expanded={!collapsed}
          title={collapsed ? 'Apri' : 'Riduci'}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}
        >
          {collapsed ? '▾' : '▴'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ width: '100%', height: 120 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="#57534E" />
              <YAxis stroke="#57534E" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
