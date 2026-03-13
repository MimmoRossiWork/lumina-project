import React, { useEffect, useState, useContext, useMemo } from 'react'
import { createPortal } from 'react-dom'
import './Results.css'
import { AuthContext } from '../AuthContext'

export default function Results() {
  const [data, setData] = useState(null)
  const [modal, setModal] = useState({ open: false, key: null, payload: null })
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: '', success: false })
  const { user, setUser, completeQuestionnaire } = useContext(AuthContext)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  useEffect(() => {
    const summary = localStorage.getItem('questionnaire_results')
    if (summary) setData(JSON.parse(summary))
  }, [])

  // Lock scroll
  useEffect(() => {
    if (modal.open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = 'unset' }
    }
  }, [modal.open])

  const perSection = useMemo(() => data?.perSection || null, [data])
  const finalScore = data?.finalScore ?? 0
  const category = data?.category ?? 'N/D'

  // Calcolo sezioni critiche per sidebar
  const negativeSections = useMemo(() => {
    if (!perSection) return []
    return Object.entries(perSection)
      .filter(([_, v]) => v && typeof v.score === 'number' && v.score < 50)
      .map(([k, v]) => ({ key: k, score: v.score }))
  }, [perSection])

  const buildDetailsFor = (key) => {
    const ps = perSection[key]
    const score = ps?.score ?? null
    const title = key.replace('section', 'Sezione ')

    let explanation = "Dati non disponibili."
    let suggestion = "Monitoraggio consigliato."

    if (score !== null) {
      if (score >= 70) {
        explanation = "Punteggio ottimale. Le tue abitudini in quest'area sono solide."
        suggestion = "Continua così, non sono necessari interventi immediati."
      } else if (score >= 50) {
        explanation = "Punteggio discreto. Ci sono margini di miglioramento."
        suggestion = "Considera piccoli cambiamenti graduali nel tuo stile di vita."
      } else {
        explanation = "Punteggio critico. Questa area richiede attenzione specifica."
        suggestion = "Si consiglia un approfondimento o una consulenza professionale."
      }
    }

    return { title, score, explanation, suggestion }
  }

  const openModal = (key) => {
    const payload = buildDetailsFor(key)
    setModal({ open: true, key, payload })
  }

  const ModalPortal = () => {
    if (!modal.open || !modal.payload) return null
    const { title, score, explanation, suggestion } = modal.payload

    return createPortal(
      <div className="popup-overlay" onClick={() => setModal({ open: false, key: null, payload: null })}>
        <div className="popup-content" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setModal({ open: false, key: null, payload: null })}>✕</button>

          <div style={{borderBottom: '1px solid #E7E5E4', paddingBottom: '16px'}}>
            <h3 style={{margin: 0, fontSize: '24px'}}>{title}</h3>
            {score !== null && <div style={{marginTop: '8px', color: 'var(--primary-green)', fontWeight: '800', fontSize: '1.2rem'}}>{score} / 100</div>}
          </div>

          <div className="modal-grid">
            <div>
              <h5 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '13px'}}>Analisi</h5>
              <p style={{fontSize: '1.1rem', lineHeight: '1.6'}}>{explanation}</p>
            </div>
            <div style={{background: '#FAFAF9', padding: '20px', borderRadius: '16px'}}>
              <h5 style={{marginTop: 0, color: 'var(--primary-green)', fontSize: '13px'}}>COSA FARE</h5>
              <p style={{margin: 0, fontSize: '1rem'}}>{suggestion}</p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (!perSection) return <div className="results-page"><p>Caricamento...</p></div>

  return (
    <div className="results-page">
      <div className="results-container">
        <h2>I tuoi Risultati</h2>

        <div className="results-grid">
          <aside className="summary-aside">
            <h3>Punteggio Totale</h3>
            <div className="final-score">{finalScore}</div>
            <div className="category-label">{category}</div>

            {negativeSections.length > 0 && (
              <div style={{textAlign: 'left', marginTop: '24px', borderTop: '1px solid #E7E5E4', paddingTop: '16px'}}>
                <h5 style={{fontSize: '12px', color: 'var(--status-critical-text)'}}>AREE CRITICHE:</h5>
                <ul style={{padding: 0, listStyle: 'none'}}>
                  {negativeSections.map(ns => (
                    <li key={ns.key} style={{fontSize: '14px', marginBottom: '4px', fontWeight: '600'}}>
                      ⚠️ {ns.key.replace('section', 'Sez. ')} ({ns.score})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <div className="sections-list">
            {Object.entries(perSection).map(([k, v]) => {
              const score = v?.score ?? 0
              const isCritical = score < 50
              const isMonitor = score >= 50 && score < 70

              return (
                <div
                  key={k}
                  className={`section-card ${isCritical ? 'critical' : ''} ${isMonitor ? 'monitor' : ''}`}
                  onClick={() => openModal(k)}
                >
                  <h4>{k.replace('section', 'Sezione ')}</h4>
                  <div className="score-val">{score} <span style={{fontSize: '1rem', fontWeight: '400', opacity: 0.6}}>/ 100</span></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ModalPortal />
    </div>
  )
}