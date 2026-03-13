const KEY = 'well_joys'

export function loadJoys() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // normalize: ensure object map
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return {}
  } catch (e) {
    console.warn('loadJoys failed', e)
    return {}
  }
}

export function saveJoys(map) {
  try {
    if (!map || typeof map !== 'object') map = {}
    localStorage.setItem(KEY, JSON.stringify(map))
    return true
  } catch (e) {
    console.warn('saveJoys failed', e)
    return false
  }
}

export function setJoyForDate(map, date, entry) {
  try {
    const base = (map && typeof map === 'object' && !Array.isArray(map)) ? map : {}
    const next = { ...base, [date]: entry }
    saveJoys(next)
    return next
  } catch (e) {
    console.warn('setJoyForDate failed', e)
    return map || {}
  }
}

export function removeJoyForDate(map, date) {
  try {
    const base = (map && typeof map === 'object' && !Array.isArray(map)) ? { ...map } : {}
    if (base && Object.prototype.hasOwnProperty.call(base, date)) {
      delete base[date]
      saveJoys(base)
    }
    return base
  } catch (e) {
    console.warn('removeJoyForDate failed', e)
    return map || {}
  }
}
