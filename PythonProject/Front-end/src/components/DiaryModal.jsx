import React, { useEffect, useRef, useState } from 'react'
import { parseISO, format } from 'date-fns'
import itLocale from 'date-fns/locale/it'
import './DiaryModal.css'
import { getDailyLogByDate } from '../utils/api'

export default function DiaryModal({ open, date, note = '', log = null, onClose, onSave, onDelete }) {
  const [value, setValue] = useState(note || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef(null)
  const [fetchedLog, setFetchedLog] = useState(null)

  // DEBUG: print incoming props to help trace why READ view may not appear
  try {
    console.log('[DiaryModal] props -> open=', open, 'date=', date, 'note_len=', (note || '').length)
    console.log('[DiaryModal] props -> log =', log)
    try { console.log('[DiaryModal] props -> log (stringified) =', JSON.stringify(log, null, 2)) } catch (e) { /* ignore stringify errors */ }
  } catch (e) { /* ignore console errors */ }

  useEffect(() => {
    const t = setTimeout(() => setValue(note || ''), 0)
    return () => clearTimeout(t)
  }, [note])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      if (ref.current) {
        try { ref.current.focus() } catch { /* ignore focus errors */ }
      }
    }, 0)
    const handleKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose && onClose() } }
    document.addEventListener('keydown', handleKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', handleKey) }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    // if log exists but lacks AI fields, try to fetch authoritative version
    const checkAndFetch = async () => {
      try {
        const baseLog = log || null
        const mindset = baseLog?.inputs?.mindset || baseLog?.mindset || null
        const hasAI = mindset && (mindset.aiEmotion !== undefined || (Array.isArray(mindset.aiTags) && mindset.aiTags.length > 0))
        if (!hasAI) {
          const userId = localStorage.getItem('userId') || ''
          if (!userId) return
          try {
            const res = await getDailyLogByDate(userId, (typeof date === 'string' ? date : (date?.slice ? date.slice(0,10) : '')))
            console.log('[DiaryModal] fetched authoritative daily_log:', res)
            if (res && res.exists) {
              setFetchedLog({ dailyLogId: res.dailyLogId || res.id || null, inputs: res.inputs || {} })
            }
          } catch (e) {
            console.warn('[DiaryModal] failed to fetch authoritative daily_log', e)
          }
        }
      } catch (e) { /* ignore */ }
    }
    checkAndFetch()
  }, [open, log, date])

  if (!open) return null

  // Use fetchedLog if available, otherwise use provided log
  const effectiveLog = fetchedLog || log

  // Helpers for AI labels/colors (soft)
  const emotionMap = {
    joy: { label: 'Gioia', bg: '#D1FAE5' },
    sadness: { label: 'Tristezza', bg: '#DBEAFE' },
    anger: { label: 'Rabbia', bg: '#FFE4E6' },
    fear: { label: 'Paura', bg: '#F5E9FF' },
  }

  // Tolerant extraction: support several shapes returned by backend or by local updates
  const mindset = (effectiveLog && (effectiveLog.inputs?.mindset || effectiveLog.mindset || effectiveLog.moodMetrics || effectiveLog.inputs?.moodMetrics)) || null
  // If backend didn't provide mindset but we have a local note prop, treat as readable
  const hasMindset = Boolean(
    mindset && (
      mindset.journalNote !== undefined ||
      mindset.aiEmotion !== undefined ||
      (Array.isArray(mindset.aiTags) && mindset.aiTags.length > 0)
    )
  ) || Boolean(note && String(note).trim().length > 0)

  try {
    console.log('[DiaryModal] extracted mindset =', mindset, 'hasMindset =', hasMindset)
    if (mindset) {
      try {
        console.log('[DiaryModal] mindset details -> aiEmotion=', mindset.aiEmotion, 'aiTags=', JSON.stringify(mindset.aiTags), 'journalNote=', mindset.journalNote)
      } catch (e) {}
    }
  } catch (e) {}

  const formatDateIt = (d) => {
    try {
      const dt = typeof d === 'string' ? parseISO(d) : d
      return format(dt, 'd MMMM yyyy', { locale: itLocale })
    } catch (e) {
      return d
    }
  }

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
    } catch (e) {
      console.warn('DiaryModal save failed', e)
    } finally {
      setSaving(false)
    }
  }

  // Read-only view when there's a saved log with mindset
  if (hasMindset && !editing) {
    const emotionKey = (mindset?.aiEmotion || '').toLowerCase()
    const em = emotionMap[emotionKey] || { label: 'Non rilevata', bg: '#F3F4F6' }
    const tags = Array.isArray(mindset?.aiTags) ? mindset.aiTags : []
    const displayDate = formatDateIt(log?.date || date)
    const displayNote = (mindset && (mindset.journalNote || mindset.journalNote === '')) ? (mindset.journalNote || '') : (note || '')
    return (
      <div className="diary-modal" role="dialog" aria-modal>
        <div className="diary-overlay" onClick={onClose} />
        <div className="diary-content diary-read">
          <button className="diary-close" onClick={onClose} aria-label="Chiudi">✕</button>
          <div className="diary-header">
            <h3>{displayDate}</h3>
          </div>
          <div className="diary-body">
            <p className="diary-text">{displayNote}</p>
            <div className="diary-ai-row">
              <div className="ai-emotion" style={{ background: em.bg, color: '#292524' }}>
                Emozione rilevata: {em.label}
              </div>
              <div className="ai-tags">
                {tags.length ? tags.map((t, i) => (
                  <span key={i} className="tag-pill">{t}</span>
                )) : <span className="tag-empty">Nessun tag rilevato</span>}
              </div>
            </div>
          </div>
          <div className="diary-actions">
            <button className="btn" onClick={() => { setEditing(true); setValue(mindset.journalNote || '') }}>Modifica</button>
            <button className="btn" onClick={onClose}>Chiudi</button>
          </div>
        </div>
      </div>
    )
  }

  // Edit mode (or no existing mindset): same textarea form
  return (
    <div className="diary-modal" role="dialog" aria-modal>
      <div className="diary-overlay" onClick={onClose} />
      <div className="diary-content">
        <button className="diary-close" onClick={onClose} aria-label="Chiudi">✕</button>
        <h3>Nota per {date}</h3>
        <textarea ref={ref} placeholder="Scrivi una breve nota (massimo 200 caratteri)" value={value} onChange={(e)=>setValue(e.target.value)} maxLength={200} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn primary" onClick={handleSave} disabled={value.trim().length===0 || saving}>{saving ? 'Salvando...' : 'Salva'}</button>
          <button className="btn" onClick={() => { setValue(''); onDelete && onDelete(); }}>Elimina</button>
          <button className="btn" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}
