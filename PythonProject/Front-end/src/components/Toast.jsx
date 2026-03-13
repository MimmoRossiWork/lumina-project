import React, { useEffect } from 'react'

export default function Toast({ message, type = 'info', open, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => { if (onClose) onClose() }, duration)
    return () => clearTimeout(t)
  }, [open, duration, onClose])

  if (!open) return null
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#064e3b'
  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 4000 }}>
      <div style={{ background: bg, color: '#fff', padding: '10px 16px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} role="status">
        {message}
      </div>
    </div>
  )
}
