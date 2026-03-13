import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.css'
import { AuthContext } from '../AuthContext'
import AllergyInput from '../components/Questionnaire/AllergyInput'

export default function Register() {
  const navigate = useNavigate()
  const { setUser } = useContext(AuthContext)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accept, setAccept] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Read API base URL from Vite env; fallback to local backend
  const API_BASE = import.meta.env.VITE_API_URL || 'https://lumina-project-b1a9.onrender.com'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // client-side validations before sending to server
    const emailTrim = email.trim().toLowerCase()
    const nameTrim = firstName.trim()
    const surnameTrim = lastName.trim()

    // simple email regex
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(emailTrim)) {
      setError('Inserisci un indirizzo email valido')
      return
    }

    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri')
      return
    }

    if (password !== confirm) {
      setError('Le password non corrispondono')
      return
    }
    if (!accept) {
      setError('Devi accettare i termini e le condizioni')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameTrim, surname: surnameTrim, email: emailTrim, password })
      })

      if (res.status === 201) {
        // Try to parse response body: if API returns created user, use it for auto-login
        const created = await res.json().catch(() => null)
        const userObj = created && (created.email || created.id) ? { ...created, questionnaireCompleted: false } : null
        if (userObj) {
          setUser(userObj)
          navigate('/welcome')
          return
        }

        // Otherwise attempt to login using credentials
        try {
          const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailTrim, password })
          })
          if (loginRes.status === 200) {
            const loginData = await loginRes.json()
            // mark questionnaire as not completed for new user
            setUser({ ...loginData, questionnaireCompleted: false })
            navigate('/welcome')
            return
          }
        } catch (e) {
          // ignore, fallback to redirect to login
        }

        // fallback: registration succeeded but auto-login failed -> go to login page
        navigate('/login')
        return
      }

      if (res.status === 409) {
        setError('Questa email è già registrata')
        return
      }

      if (res.status === 503) {
        setError('Server non disponibile. Riprova più tardi')
        return
      }

      // other errors: FastAPI often returns a JSON with `detail` which may be an array of validation errors
      const data = await res.json().catch(() => ({}))

      // If detail is an array of validation error objects or strings, transform to readable string(s)
      if (Array.isArray(data.detail)) {
        const messages = data.detail.map((err) => String(err))
        setError(messages.join(' | '))
      } else {
        setError((data && (data.detail || data.error)) || 'Errore durante la registrazione')
      }
    } catch (err) {
      setError('Impossibile contattare il server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-root" style={{ backgroundColor: 'var(--bg-warm)', backgroundImage: 'none' }}>
      <main className="register-simple" role="main" aria-labelledby="register-title">
        <section className="register-card" aria-label="Registrazione">
          <h1 id="register-title">Crea un account</h1>
          <p className="register-intro">Un profilo ti permette di salvare i tuoi progressi e ricevere suggerimenti personalizzati.</p>

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            <div className="name-row">
              <label className="label">
                <div className="label-text">Nome</div>
                <AllergyInput
                  className="input-simple"
                  placeholder="es. Mario"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  aria-label="Nome"
                  variant="soft"
                />
              </label>

              <label className="label">
                <div className="label-text">Cognome</div>
                <AllergyInput
                  className="input-simple"
                  placeholder="es. Rossi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  aria-label="Cognome"
                  variant="soft"
                />
              </label>
            </div>

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
                placeholder="Crea una password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
            </label>

            <label className="label">
              <div className="label-text">Conferma Password</div>
              <input
                type="password"
                className="input-simple"
                placeholder="Ripeti la password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                aria-label="Conferma Password"
              />
            </label>

            <label className="tos">
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
              <span className="tos-text">Accetto i <a href="#">termini e le condizioni</a></span>
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="btn-simple" type="submit" disabled={loading}>{loading ? 'Registrazione...' : 'Registrati'}</button>

            <div className="register-footer">
              <span>Hai già un account?</span>
              <Link to="/" className="link-simple">Accedi</Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
