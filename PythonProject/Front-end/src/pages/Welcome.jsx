import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../AuthContext'
import { Unlock, Clock } from 'lucide-react'
import './Welcome.css'

export default function OnboardingWelcome() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  useEffect(() => {
    // redirect to login if not authenticated
    if (!user) navigate('/')
    // if questionnaire already completed, redirect to home
    if (user && user.questionnaireCompleted) navigate('/home')
  }, [user])

  const handleStartSurvey = () => {
    navigate('/questionnaire')
  }

  return (
    <div className="onboarding-root">
      <div className="onboarding-card">
        {/* Progress */}
        <div className="progress">
          <div className="progress-label">Step 1: Account Creato ✅</div>
          <div className="progress-bar" role="progressbar" aria-valuenow={20} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: '20%' }}></div>
          </div>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="hero-icon">
            <Unlock size={64} />
          </div>

          <h1 className="hero-title">Benvenuto a bordo! Il tuo account è attivo.</h1>

          <p className="hero-body">
            Per costruire il tuo Gemello Digitale e offrirti consigli davvero su misura, LUMINA ha bisogno di conoscerti. Rispondi a queste domande per calibrare il sistema: è un passaggio unico che farai solo adesso. Una volta completato, avrai accesso immediato alla tua dashboard personalizzata.
          </p>
        </div>

        {/* Footer actions */}
        <div className="actions">
          <button
            onClick={handleStartSurvey}
            className="primary-btn"
            aria-label="Inizia il sondaggio"
          >
            Attiva il mio Profilo
          </button>

          <div className="time-badge">
            <Clock size={14} />
            <span>Tempo stimato: 5-7 min</span>
          </div>
        </div>
      </div>
    </div>
  )
}
