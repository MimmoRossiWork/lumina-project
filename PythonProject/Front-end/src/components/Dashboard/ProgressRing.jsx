import React from 'react'

export default function ProgressRing({ size = 88, stroke = 10, progress = 65, label = 'Metric' }) {
  const normalizedRadius = (size - stroke) / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference
  return (
    <div className="progress-ring" style={{ width: size }}>
      <svg height={size} width={size}>
        <g transform={`translate(${size/2}, ${size/2})`}>
          <circle r={normalizedRadius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle r={normalizedRadius} fill="transparent" stroke="#2e2d88" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} transform={`rotate(-90)`} />
          <text x="0" y="0" fill="#fff" fontSize={14} textAnchor="middle" dominantBaseline="central">{progress}%</text>
        </g>
      </svg>
      <div className="progress-label">{label}</div>
    </div>
  )
}

