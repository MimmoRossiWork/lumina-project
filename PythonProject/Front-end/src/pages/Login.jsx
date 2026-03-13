import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
import { AuthContext } from '../AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useContext(AuthContext)

  // Read API base URL from Vite env; fallback to local backend
  const API_BASE = import.meta.env.VITE_API_URL || 'https://lumina-project-b1a9.onrender.com'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const emailTrim = email.trim().toLowerCase()
    if (!emailTrim || !password) {
      setError('Inserisci email e password')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, password })
      })

      if (res.status === 200) {
        const data = await res.json()
        // merge with any locally cached user info (scores/completion) if same id
        let merged = { ...data }
        try {
          const prevRaw = localStorage.getItem('lumina_user')
          if (prevRaw) {
            const prev = JSON.parse(prevRaw)
            if (prev && (prev.id === data.id || prev._id === data.id)) {
              merged = { ...prev, ...data }
            }
          }
        } catch (_) { /* ignore */ }
        setUser(merged)
        const hasScore = typeof merged.totalScore === 'number' && merged.totalScore > 0
        const completed = merged.questionnaireCompleted === true
        navigate(hasScore || completed ? '/home' : '/welcome')
        return
      }

      if (res.status === 401) {
        setError('Email o password errata')
        return
      }

      const err = await res.json().catch(() => ({}))
      setError(err.detail || 'Errore durante il login')
    } catch (e) {
      setError('Impossibile contattare il server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <main className="login-simple" role="main" aria-labelledby="login-title">
        <section className="login-card-simple" aria-label="Accesso">
          <h1 id="login-title">Accedi a Lumina</h1>
          <p className="login-intro">Benvenuto — inserisci le credenziali per accedere al tuo spazio.</p>

          <form className="login-form-simple" onSubmit={handleSubmit} noValidate>
            <label className="label">
              <div className="label-text">Email</div>
              <input
                type="email"
                className="input-simple"
                placeholder="es. nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
            </label>

            <label className="label">
              <div className="label-text">Password</div>
              <input
                type="password"
                className="input-simple"
                placeholder="Inserisci la password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="btn-simple" type="submit" disabled={loading}>{loading ? 'Accesso...' : 'Accedi'}</button>

            <div className="login-footer-simple">
              <span>Non hai un account?</span>
              <Link className="link-simple" to="/register">Registrati</Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
