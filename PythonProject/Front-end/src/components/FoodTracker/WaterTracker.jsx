import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function WaterTracker({ water, setWater, waterGoal, setWaterGoal, editingWaterGoal, setEditingWaterGoal, waterGoalInput, setWaterGoalInput }) {
  const drank = Math.max(0, Math.min(waterGoal, Number(water || 0)))
  const waterData = [
    { name: 'Bevuto', value: drank },
    { name: 'Rimanente', value: Math.max(0, waterGoal - drank) }
  ]

  const handleAdd = () => {
    setWater((w) => Math.min((waterGoal || 1), (Number(w) || 0) + 1))
  }
  const handleReset = () => setWater(0)

  const toggleGlass = (i) => {
    if ((Number(water) || 0) === i + 1) setWater(i)
    else setWater(i + 1)
  }

  return (
    <section className="card water-card">
      <div className="card-title">Acqua</div>
      <div className="water-wrap" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Render chart column centered */}
        <div style={{ flex: '0 1 240px', minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* wrapper con dimensioni fisse per centrare il grafico e permettere overlay */}
          <div style={{ width: 160, height: 160, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={waterData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={2}>
                  {waterData.map((d, i) => (
                    <Cell key={`w-${i}`} fill={i === 0 ? '#60a5fa' : 'rgba(255,255,255,0.06)'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Chart center overlay, posizionato sopra il grafico */}
            <div className="chart-center" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div className="chart-center-value">{water} / {waterGoal}</div>
              <div className="chart-center-sub">Bicchieri</div>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: 220 }} className="water-summary">
          <div className="water-glasses" style={{ marginBottom: 8 }}>
            {[...Array(waterGoal)].map((_, i) => (
              <button
                key={i}
                type="button"
                className={`glass ${i < water ? 'filled' : ''}`}
                onClick={() => toggleGlass(i)}
                aria-label={`Bicchiere ${i+1}`}
                aria-pressed={i < water}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  {/* Outline of a glass */}
                  <path className="cup-outline" d="M7 3h10l-1.2 12.6a3.5 3.5 0 0 1-3.8 3.4 3.5 3.5 0 0 1-3.8-3.4L7 3z" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                  {/* Liquid shape - its fill will be styled via CSS for filled/empty states */}
                  <path className="cup-liquid" d="M8.2 14.5c1 0.8 2.6 0.8 3.6 0.1 0.9-0.7 2.2-0.7 3.1-0.1v2.2a1.6 1.6 0 0 1-1.6 1.6h-5.5a1.6 1.6 0 0 1-1.6-1.6v-2.2z" fill="currentColor" opacity="0.06" />
                </svg>
              </button>
            ))}
          </div>
          <div className="water-count">{water} / {waterGoal} bicchieri</div>
          <div className="water-bar"><div className="water-fill" style={{ width: `${(water / (waterGoal || 1)) * 100}%` }} /></div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn primary" onClick={handleAdd} disabled={Number(water) >= Number(waterGoal)}>Aggiungi</button>
            <button className="btn" onClick={handleReset} disabled={Number(water) === 0}>Reset</button>
          </div>

          <div className="water-goal-edit" style={{ marginTop: 8 }}>
            {editingWaterGoal ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" value={waterGoalInput} onChange={(e) => setWaterGoalInput(Number(e.target.value) || 1)} style={{ width: 80, padding: 6, borderRadius: 6 }} />
                <button className="btn small" onClick={() => { setWaterGoal(Number(waterGoalInput) || 1); setEditingWaterGoal(false) }}>Salva</button>
              </div>
            ) : (
              <button className="btn small" onClick={() => { setWaterGoalInput(waterGoal); setEditingWaterGoal(true) }}>Modifica obiettivo acqua</button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
