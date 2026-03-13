import React, { useEffect, useMemo, useState } from 'react'
import './AvatarSelectionModal.css'
import { X, RefreshCcw } from 'lucide-react'

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/micah/svg?seed='

function randomSeed() {
  return Math.random().toString(36).slice(2, 10)
}

function buildUrl(seed, filter, beard, glasses) {
  let url = `${DICEBEAR_BASE}${seed}`
  if (filter === 'male') {
    url += '&hair=dougFunny,fonze,mrT,dannyPhantom,turban'
  } else if (filter === 'female') {
    url += '&hair=pixie,dannyPhantom,full,turban&earringsProbability=100'
  }
  const facialProb = beard ? 100 : 0
  const glassesProb = glasses ? 100 : 0
  url += `&facialHairProbability=${facialProb}&glassesProbability=${glassesProb}`
  return url
}

export default function AvatarSelectionModal({
  current,
  isOpen,
  onClose,
  onSave,
  disabled,
  fallbackSeed,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(current || '')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | male | female
  const [beard, setBeard] = useState(false)
  const [glasses, setGlasses] = useState(false)

  const generateSuggestions = (nextFilter = filter, nextBeard = beard, nextGlasses = glasses) => {
    const list = Array.from({ length: 6 }, () => buildUrl(randomSeed(), nextFilter, nextBeard, nextGlasses))
    setSuggestions(list)
  }

  useEffect(() => {
    if (isOpen) {
      setSelected(current || buildUrl(fallbackSeed || 'marione', filter, beard, glasses))
      setError('')
      generateSuggestions(filter, beard, glasses)
    }
  }, [isOpen, current, fallbackSeed, filter, beard, glasses])

  const handleSave = () => {
    if (!selected) {
      setError('Seleziona un avatar prima di salvare')
      return
    }
    onSave(selected)
  }

  const handleFilter = (next) => {
    setFilter(next)
    const url = buildUrl(fallbackSeed || 'marione', next, beard, glasses)
    setSelected(url)
    generateSuggestions(next, beard, glasses)
  }

  const handleBeard = (next) => {
    setBeard(next)
    const url = buildUrl(fallbackSeed || 'marione', filter, next, glasses)
    setSelected(url)
    generateSuggestions(filter, next, glasses)
  }

  const handleGlasses = (next) => {
    setGlasses(next)
    const url = buildUrl(fallbackSeed || 'marione', filter, beard, next)
    setSelected(url)
    generateSuggestions(filter, beard, next)
  }

  if (!isOpen) return null

  return (
    <div className="avatar-modal-backdrop" role="dialog" aria-modal="true">
      <div className="avatar-modal">
        <div className="avatar-modal-header">
          <h3>Scegli il tuo avatar</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Chiudi"><X size={18} /></button>
        </div>
        <div className="avatar-modal-body">
          <div className="avatar-large">
            <img src={selected || buildUrl(fallbackSeed || 'marione', filter, beard, glasses)} alt="Avatar selezionato" />
          </div>
          <p className="avatar-hint">Consiglio: imposta il tuo nome per avere un avatar coerente.</p>

          <div className="avatar-filters" role="group" aria-label="Filtro avatar">
            <button
              type="button"
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilter('all')}
            >Tutti</button>
            <button
              type="button"
              className={`filter-btn ${filter === 'male' ? 'active' : ''}`}
              onClick={() => handleFilter('male')}
            >Uomo</button>
            <button
              type="button"
              className={`filter-btn ${filter === 'female' ? 'active' : ''}`}
              onClick={() => handleFilter('female')}
            >Donna</button>
          </div>

          <div className="avatar-filters" role="group" aria-label="Opzioni barba e occhiali">
            <button
              type="button"
              className={`filter-btn ${beard ? 'active' : ''}`}
              onClick={() => handleBeard(true)}
            >Con barba</button>
            <button
              type="button"
              className={`filter-btn ${!beard ? 'active' : ''}`}
              onClick={() => handleBeard(false)}
            >Senza barba</button>
            <button
              type="button"
              className={`filter-btn ${glasses ? 'active' : ''}`}
              onClick={() => handleGlasses(true)}
            >Occhiali</button>
            <button
              type="button"
              className={`filter-btn ${!glasses ? 'active' : ''}`}
              onClick={() => handleGlasses(false)}
            >Senza occhiali</button>
          </div>

          <div className="avatar-grid">
            {suggestions.map((url) => (
              <button
                key={url}
                type="button"
                className={`avatar-thumb ${selected === url ? 'selected' : ''}`}
                onClick={() => setSelected(url)}
              >
                <img src={url} alt="Suggerimento avatar" />
              </button>
            ))}
          </div>
          {error && <div className="avatar-error" role="alert">{error}</div>}
          <div className="avatar-actions">
            <button className="btn-secondary" type="button" onClick={() => generateSuggestions()}>
              <RefreshCcw size={14} /> Genera altri
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn-secondary" type="button" onClick={onClose}>Annulla</button>
            <button className="btn-primary" type="button" onClick={handleSave} disabled={disabled}>Salva</button>
          </div>
        </div>
      </div>
    </div>
  )
}
