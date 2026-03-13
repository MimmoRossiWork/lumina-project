import React, { useState, useRef, useEffect, useContext } from 'react'
import ReactDOM from 'react-dom'
import './Navbar.css'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LanguageContext } from '../LanguageContext'
import { AuthContext } from '../AuthContext'
import { Edit3 } from 'lucide-react'

export default function Navbar({
  mainPages = [
    { name: 'Home', href: '/home' },
    { name: 'Dieta', href: '/foodtracker' },
    { name: 'Attività fisica', href: '/fittracker' },
    { name: 'Sonno', href: '/sleeptracker' },
    { name: 'Benessere', href: '/wellbeing' },
  ],
  secondaryPages = [
    { name: 'Impostazioni', href: '/settings' },
    { name: 'FAQ', href: '/faq' },
  ],
  profileIcon = null,
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const menuCardRef = useRef(null)
  const { language, setLanguage } = useContext(LanguageContext)
  const { user, isAuthenticated, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Check if click is on the overlay backdrop (not on the card)
        if (e.target.classList.contains('mobile-menu-overlay')) {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset scroll position when menu opens
  useEffect(() => {
    if (open && menuCardRef.current) {
      menuCardRef.current.scrollTop = 0
    }
  }, [open])

  const handleLogout = () => {
    logout()
    // redirect to login
    navigate('/')
  }

  const toggleLanguage = () => setLanguage((l) => (l === 'it' ? 'en' : 'it'))

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
  const avatarUrl = user?.avatarUrl

  return (
    <header className="navbar">
      <div className="left" ref={dropdownRef}>
        <Link to="/" className="logo" aria-label="Home">Lumina</Link>

        {/* Desktop dropdown button - visible only on desktop
        <button
          className="dropdown-btn desktop-only"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          Menu ▾
        </button>
*/}
        {/* Mobile hamburger - visible only on mobile */}
        <button
          className="dropdown-btn mobile-only"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          ☰
        </button>

        {/* Desktop dropdown - only secondary pages */}
        {open && (
          <ul className="dropdown-menu desktop-only" role="menu">
            {secondaryPages.map((p) => (
              <li key={p.href} role="none">
                <Link role="menuitem" to={p.href} onClick={() => setOpen(false)}>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Mobile portal overlay - all pages */}
        {open && ReactDOM.createPortal(
          <div className="mobile-menu-overlay mobile-only" role="menu">
            <div className="mobile-menu-card" ref={menuCardRef}>
              {/* Close button (X) */}
              <button
                className="menu-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Chiudi menu"
              >
                ✕
              </button>

              {/* Menu header */}
              <div className="mobile-menu-header">
                <h2>Menu</h2>
              </div>

              {/* Menu items */}
              <ul className="mobile-menu-list">
                {mainPages.concat(secondaryPages).map((p) => (
                  <li key={p.href} role="none">
                    <Link role="menuitem" to={p.href} onClick={() => setOpen(false)}>
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
      </div>

      <nav className="center" aria-label="main navigation">
        {mainPages.map((p) => (
          <NavLink key={p.href} to={p.href} className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            {p.name}
          </NavLink>
        ))}
      </nav>

      <div className="right">

        {/* Language selector: placed before profile */}
        <div className="lang-select" title={language === 'it' ? 'Italiano' : 'English'}>
          <button onClick={toggleLanguage} className="lang-btn">{language === 'it' ? 'ITA' : 'ENG'}</button>
        </div>

        {/* Login / Logout */}
        {isAuthenticated ? (
          <>
            <button className="logout-btn" onClick={handleLogout} title="Logout">Logout</button>
            <Link to="/profile" className="profile-link" aria-label="Profilo">
              <div className="navbar-user">{user?.name || user?.email || 'Profilo'}</div>
              <div className="avatar-wrapper">
                {avatarUrl ? (
                  <img className="profile-img" src={avatarUrl} alt="profile" />
                ) : (
                  <div className="profile-placeholder" aria-hidden>{userInitial}</div>
                )}
                <div className="avatar-overlay">
                  <Edit3 size={16} />
                </div>
              </div>
            </Link>
          </>
        ) : (
          <Link to="/" className="login-link">Accedi</Link>
        )}

        {/* remove standalone profile placeholder when authenticated link is shown */}
        {!isAuthenticated && !profileIcon && <div className="profile-placeholder">👤</div>}
      </div>
    </header>
  )
}