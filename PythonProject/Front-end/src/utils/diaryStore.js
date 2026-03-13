const KEY = 'well_diary'

export function loadDiary() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return {}
  } catch (e) {
    console.warn('loadDiary failed', e)
    return {}
  }
}

export function saveDiary(map) {
  try {
    if (!map || typeof map !== 'object') map = {}
    localStorage.setItem(KEY, JSON.stringify(map))
    return true
  } catch (e) {
    console.warn('saveDiary failed', e)
    return false
  }
}

export function setNoteForDate(map, date, note) {
  try {
    const base = (map && typeof map === 'object' && !Array.isArray(map)) ? map : {}
    const next = { ...base }
    if (note && note.trim()) next[date] = note.trim()
    else delete next[date]
    saveDiary(next)
    return next
  } catch (e) {
    console.warn('setNoteForDate failed', e)
    return map || {}
  }
}

export function removeNoteForDate(map, date) {
  try {
    const base = (map && typeof map === 'object' && !Array.isArray(map)) ? { ...map } : {}
    if (base && Object.prototype.hasOwnProperty.call(base, date)) {
      delete base[date]
      saveDiary(base)
    }
    return base
  } catch (e) {
    console.warn('removeNoteForDate failed', e)
    return map || {}
  }
}

