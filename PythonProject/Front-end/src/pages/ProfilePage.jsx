import React, { useContext, useMemo, useState } from 'react'
import './ProfilePage.css'
import { AuthContext } from '../AuthContext'
import { Flame, ShieldCheck, Activity, Link2, Edit3 } from 'lucide-react'
import AvatarSelectionModal from '../components/AvatarSelectionModal'

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayStep, setOverlayStep] = useState('auth') // 'auth' | 'edit'
  const [password, setPassword] = useState('')
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const API_BASE = useMemo(() => import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000', [])

  const handleOpenOverlay = () => {
    setShowOverlay(true)
    setOverlayStep('auth')
    setPassword('')
    setError('')
  }

  const handleCloseOverlay = () => {
    setShowOverlay(false)
    setOverlayStep('auth')
    setPassword('')
    setError('')
    setEditForm({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      password: '',
      confirm: '',
    })
  }

  const userId = user?.id || user?._id

  const handleVerifyPassword = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Inserisci la password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      })
      if (res.ok) {
        setOverlayStep('edit')
        setPassword('')
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.detail || 'Password non valida')
    } catch (err) {
      setError('Errore di rete, riprova')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    const emailTrim = editForm.email.trim()
    const nameTrim = editForm.name.trim()
    const surnameTrim = editForm.surname.trim()

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailTrim && !emailRe.test(emailTrim)) {
      setError('Email non valida')
      return
    }
    if (editForm.password && editForm.password.length < 8) {
      setError('La password deve avere almeno 8 caratteri')
      return
    }
    if (editForm.password !== editForm.confirm) {
      setError('Le password non coincidono')
      return
    }

    const payload = {
      userId,
    }
    if (nameTrim !== user?.name) payload.name = nameTrim
    if (surnameTrim !== user?.surname) payload.surname = surnameTrim
    if (emailTrim && emailTrim !== user?.email) payload.email = emailTrim
    if (editForm.password) payload.password = editForm.password

    if (Object.keys(payload).length === 1) {
      setError('Nessuna modifica da salvare')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/update-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError((data && data.detail) || 'Errore durante l\'aggiornamento')
        return
      }
      // aggiorna contesto utente con la response
      setUser((prev) => ({ ...(prev || {}), ...data }))
      handleCloseOverlay()
    } catch (err) {
      setError('Errore di rete, riprova')
    } finally {
      setLoading(false)
    }
  }

  const onEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const avatarUrl = user?.avatarUrl || ''
  const seedFallback = (user?.name && user.name.trim()) ? user.name.trim() : 'marione'

  const handleSaveAvatar = async (newUrl) => {
    setError('')
    if (!userId) {
      setError('Utente non presente in sessione')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/update-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatarUrl: newUrl }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError((data && data.detail) || 'Errore durante l\'aggiornamento')
        return
      }
      setUser((prev) => ({ ...(prev || {}), ...data }))
      setShowAvatarModal(false)
    } catch (err) {
      setError('Errore di rete, riprova')
    } finally {
      setLoading(false)
    }
  }

  const displayName = user?.name || 'Utente Lumina'
  const email = user?.email || '—'
  const height = user?.height ?? '—'
  const weight = user?.weight ?? '—'
  const totalScore = typeof user?.totalScore === 'number' ? user.totalScore : '—'
  const level = user?.level || 'Livello 1'
  const xp = typeof user?.xp === 'number' ? user.xp : 0
  const levelProgress = Math.max(0, Math.min(100, xp))
  const xpToNext = Math.max(0, 100 - Math.round(levelProgress))

  return (
    <div className="profile-root">
      <AvatarSelectionModal
        current={avatarUrl}
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSave={handleSaveAvatar}
        disabled={loading}
        fallbackSeed={seedFallback}
      />
      {showOverlay && (
        <div className="overlay-backdrop">
          <div className="overlay-card" role="dialog" aria-modal="true">
            {overlayStep === 'auth' ? (
              <form onSubmit={handleVerifyPassword} className="overlay-form">
                <h3>Verifica password</h3>
                <p className="overlay-text">Per la tua sicurezza ti chiediamo di inserire la password per modificare i tuoi dati.</p>
                <input
                  type="password"
                  className="overlay-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                {error && <div className="overlay-error" role="alert">{error}</div>}
                <div className="overlay-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseOverlay}>Annulla</button>
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verifico...' : 'Continua'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdate} className="overlay-form">
                <h3>Modifica dati</h3>
                <div className="grid-2">
                  <label className="overlay-label">
                    <span>Nome</span>
                    <input type="text" className="overlay-input" value={editForm.name} onChange={(e) => onEditChange('name', e.target.value)} />
                  </label>
                  <label className="overlay-label">
                    <span>Cognome</span>
                    <input type="text" className="overlay-input" value={editForm.surname} onChange={(e) => onEditChange('surname', e.target.value)} />
                  </label>
                </div>
                <label className="overlay-label">
                  <span>Email</span>
                  <input type="email" className="overlay-input" value={editForm.email} onChange={(e) => onEditChange('email', e.target.value)} />
                </label>
                <label className="overlay-label">
                  <span>Nuova password (opzionale)</span>
                  <input type="password" className="overlay-input" value={editForm.password} onChange={(e) => onEditChange('password', e.target.value)} />
                </label>
                <label className="overlay-label">
                  <span>Conferma password</span>
                  <input type="password" className="overlay-input" value={editForm.confirm} onChange={(e) => onEditChange('confirm', e.target.value)} />
                </label>
                {error && <div className="overlay-error" role="alert">{error}</div>}
                <div className="overlay-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseOverlay}>Annulla</button>
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvo...' : 'Salva'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <div className="profile-grid">
        <section className="card header-card">
          <div className="header-left">
            <div className="avatar editable" aria-hidden onClick={() => setShowAvatarModal(true)}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <span>{displayName?.[0] ? displayName[0].toUpperCase() : 'U'}</span>
              )}
              <div className="avatar-overlay">
                <Edit3 size={16} />
              </div>
            </div>
            <div className="header-text">
              <div className="name-row">
                <h2>{displayName}</h2>
              </div>
              <div className="email">{email}</div>
              <div className="score">Lumina Score: <strong>{totalScore}</strong></div>
            </div>
          </div>

        </section>

        <section className="card stats-card">
          <div className="stat">
            <Flame size={24} />
            <div>
              <div className="stat-label">Giorni consecutivi (Streak)</div>
              <div className="stat-value">7</div>
            </div>
          </div>
          <div className="stat">
            <Activity size={24} />
            <div>
              <div className="stat-label">Check-up totali</div>
              <div className="stat-value">12</div>
            </div>
          </div>
        </section>

        <section className="card info-card">
          <h3>Dati profilo</h3>
          <div className="info-row">
            <span>Nome</span>
            <strong>{displayName}</strong>
          </div>
          <div className="info-row">
            <span>Email</span>
            <strong>{email}</strong>
          </div>
          <div className="info-row">
            <span>Altezza</span>
            <strong>{height}</strong>
          </div>
          <div className="info-row">
            <span>Peso</span>
            <strong>{weight}</strong>
          </div>
        </section>



        <section className="card security-card">
          <div className="security-top">
            <ShieldCheck size={20} />
            <div>
              <h3>Sicurezza</h3>
              <p>Proteggi i tuoi dati sensibili.</p>
            </div>
          </div>
          <button className="secure-btn" type="button" onClick={handleOpenOverlay}>Modifica Dati Sensibili 🔒</button>
          <button className="secondary-btn" type="button">Vedi storico valutazioni</button>
        </section>
      </div>
    </div>
  )
}
