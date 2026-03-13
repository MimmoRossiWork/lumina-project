import React from 'react'
import { createPortal } from 'react-dom'

function BarContent({ percent, sectionLabel, current, sectionTotal, step, total }) {
  return (
    <div className="progress-row" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="progress-info">{sectionLabel && typeof current === 'number' && typeof sectionTotal === 'number' ? `${sectionLabel}: ${current} / ${sectionTotal}` : `Sezione ${step} di ${total}`}</div>
      <div className="progress"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

export default function ProgressBar({ step = 1, total = 6, sectionLabel = null, current = null, sectionTotal = null }) {
  const percent = sectionLabel && typeof current === 'number' && typeof sectionTotal === 'number'
    ? Math.round((sectionTotal === 0 ? 0 : (current / sectionTotal) * 100))
    : Math.round((step / total) * 100)

  // If document available, render into body to avoid containment by transformed parents
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(<BarContent percent={percent} sectionLabel={sectionLabel} current={current} sectionTotal={sectionTotal} step={step} total={total} />, document.body)
  }
  // Fallback for SSR / tests
  return <BarContent percent={percent} sectionLabel={sectionLabel} current={current} sectionTotal={sectionTotal} step={step} total={total} />
}
