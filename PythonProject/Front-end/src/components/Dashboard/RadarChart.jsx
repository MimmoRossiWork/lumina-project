import React from 'react'

const DEFAULT_LABELS = ['Nutri', 'Physio', 'Psycho', 'Health', 'Socio', 'Life']

export default function RadarChart({ data = [75, 60, 80, 70, 55, 65], labels = DEFAULT_LABELS, size = 300 }) {
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size / 2 - 36
  const points = data.map((v, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
    const r = (Math.max(0, Math.min(100, v)) / 100) * maxRadius
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

  // helper to draw grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((f, idx) => {
    const r = maxRadius * f
    const ringPoints = labels.map((_, i) => {
      const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
    return (
      <polygon key={idx} points={ringPoints} fill="none" stroke="rgba(87, 83, 78, 0.25)" strokeWidth="1" />
    )
  })

  const axes = labels.map((lab, i) => {
    const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2
    const x = cx + maxRadius * Math.cos(angle)
    const y = cy + maxRadius * Math.sin(angle)
    const lx = cx + (maxRadius + 18) * Math.cos(angle)
    const ly = cy + (maxRadius + 18) * Math.sin(angle)
    return (
      <g key={i}>
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(87, 83, 78, 0.25)" strokeWidth="1" />
        <text x={lx} y={ly} fill="#292524" fontSize={13} fontWeight="600" textAnchor={Math.abs(Math.cos(angle)) < 0.5 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end') } dominantBaseline="central">
          {lab}
        </text>
      </g>
    )
  })

  return (
    <div className="radar-chart" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id="radarFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <g>
          {rings}
          {axes}
          <polygon points={points} fill="url(#radarFill)" fillOpacity="0.5" stroke="#059669" strokeWidth="2.5" />
          {data.map((v, i) => {
            const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
            const r = (Math.max(0, Math.min(100, v)) / 100) * maxRadius
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            return <circle key={i} cx={x} cy={y} r={5} fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
          })}
        </g>
      </svg>
    </div>
  )
}
