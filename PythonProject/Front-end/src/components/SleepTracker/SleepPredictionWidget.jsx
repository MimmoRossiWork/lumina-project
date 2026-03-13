import React, { useEffect, useState } from 'react'
import axios from 'axios' // Assicurati di avere axios o usa fetch
import { format } from 'date-fns'

export default function SleepPredictionWidget({ userId }) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  // Mapping emozioni per UI
  const emotionMap = {
    joy: { label: 'Serenità', icon: '🙂' },
    sadness: { label: 'Tristezza', icon: '😢' },
    anger: { label: 'Rabbia', icon: '😠' },
    fear: { label: 'Ansia/Paura', icon: '😨' },
    neutral: { label: 'Neutrale', icon: '😐' }
  }

  useEffect(() => {
    if (!userId) return

    const fetchPrediction = async () => {
      try {
        // Chiama il tuo endpoint
        const res = await axios.get(`https://lumina-project-b1a9.onrender.com/api/v1/predict/sleep-risk/${userId}`)
        setPrediction(res.data)
      } catch (error) {
        console.error("Errore fetch predizione sonno:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [userId])

  if (loading) {
    return <div className="prediction-card pred-skeleton"></div>
  }

  if (!prediction) return null

  const isRisk = prediction.risk_score === 1
  const { stress, caffeine, steps, ai_emotion, calories_intake } = prediction.factors || {}

  // Recupera label emozione
  const emotionObj = emotionMap[ai_emotion] || emotionMap.neutral

  return (
    <div className={`prediction-card ${isRisk ? 'risk-high' : 'risk-low'}`}>

      {/* Header */}
      <div className="pred-header">
        <div className="pred-icon-bg">
          {isRisk ? '⚠️' : '🌙'}
        </div>
        <div className="pred-title">
          <h4>Previsione AI per stanotte</h4>
          <h3>{isRisk ? 'Rischio Disturbi' : 'Sonno Ottimale'}</h3>
        </div>
      </div>

      {/* Messaggio Principale */}
      <div className="pred-message">
        {prediction.message}
      </div>

      {/* Toggle Dettagli */}
      <button
        className="pred-toggle-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span>{showDetails ? 'Nascondi analisi' : 'Perché questa previsione?'}</span>
        <span style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {/* Griglia Dettagli (Fattori) */}
      {showDetails && (
        <div className="pred-factors">
          <div className="factors-grid">

            {/* Stress */}
            <div className={`factor-chip ${stress >= 7 ? 'alert' : ''}`}>
              <span className="factor-label">Livello Stress</span>
              <span className="factor-value">{stress}/10</span>
            </div>

            {/* Emozione */}
            <div className={`factor-chip ${['anger', 'fear', 'sadness'].includes(ai_emotion) ? 'alert' : ''}`}>
              <span className="factor-label">Mood Rilevato</span>
              <span className="factor-value">{emotionObj.icon} {emotionObj.label}</span>
            </div>

            {/* Caffè */}
            <div className={`factor-chip ${caffeine >= 3 ? 'alert' : ''}`}>
              <span className="factor-label">Caffeina</span>
              <span className="factor-value">{caffeine} tazze</span>
            </div>

            {/* Attività Fisica */}
            <div className="factor-chip">
              <span className="factor-label">Movimento</span>
              <span className="factor-value">{steps > 0 ? `${steps} passi` : 'Sedentario'}</span>
            </div>

             {/* Calorie (Opzionale, mostriamo se alte) */}
             {calories_intake > 2500 && (
              <div className="factor-chip alert">
                <span className="factor-label">Calorie</span>
                <span className="factor-value">{calories_intake} kcal (Pesante)</span>
              </div>
            )}

          </div>

          <div style={{ marginTop: 12, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Analisi basata sui dati di oggi ({format(new Date(), 'dd MMM')})
          </div>
        </div>
      )}
    </div>
  )
}