const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function saveWellbeing(payload, debug = false) {
  const url = new URL(`${API_BASE}/api/v1/wellbeing/`)
  if (debug) url.searchParams.set('debug', 'true')
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to save wellbeing: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function getWellbeingByDate(userId, date) {
  const url = new URL(`${API_BASE}/api/v1/wellbeing/by-date`)
  url.searchParams.set('userId', userId)
  url.searchParams.set('date', date)
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to fetch wellbeing: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function saveDailySleep(payload) {
  const res = await fetch(`${API_BASE}/api/v1/checkin/raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to save daily sleep: ${res.status} ${txt}`)
  }
  return res.json().catch(() => ({}))
}

export async function getDailyLogByDate(userId, date) {
  const url = new URL(`${API_BASE}/api/v1/checkin/by-date`)
  url.searchParams.set('userId', userId)
  url.searchParams.set('date', date)
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to fetch daily log: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function getDailyLogsRange(userId, startDate, endDate) {
  const url = new URL(`${API_BASE}/api/v1/checkin/range`)
  url.searchParams.set('userId', userId)
  url.searchParams.set('start_date', startDate)
  url.searchParams.set('end_date', endDate)
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to fetch daily logs range: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function clearDailySleep(dailyLogId, userId) {
  const res = await fetch(`${API_BASE}/api/v1/checkin/sleep/clear`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dailyLogId, userId }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to clear sleep: ${res.status} ${txt}`)
  }
  return res.json().catch(() => ({}))
}
