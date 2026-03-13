import { differenceInMinutes, parseISO, addMinutes, formatISO } from 'date-fns'

export function calculateSleepEfficiency(entry) {
  try {
    const start = parseISO(entry.start)
    const wake = parseISO(entry.wake)
    let duration = differenceInMinutes(wake, start)
    if (duration <= 0) return 0

    const awakenings = Number(entry.awakenings) || 0
    // subtract an average penalty (minutes) per awakening as before
    const AWAKENING_PENALTY_MIN = 10
    const adjusted = Math.max(0, duration - awakenings * AWAKENING_PENALTY_MIN)

    // Duration-based factor:
    // - ideal window: between MIN_DURATION and MAX_DURATION (inclusive) -> factor = 1
    // - below MIN_DURATION -> factor scales linearly from 0 (at 0 min) to 1 (at MIN_DURATION)
    // - above MAX_DURATION -> factor decreases linearly from 1 (at MAX_DURATION) to 0 (at MAX_PENALIZE_LIMIT)
    const MIN_DURATION = 6 * 60 // 6 hours in minutes
    const MAX_DURATION = 12 * 60 // 12 hours in minutes
    const MAX_PENALIZE_LIMIT = 24 * 60 // cap at 24h for scaling

    let durationFactor = 1
    if (duration < MIN_DURATION) {
      durationFactor = Math.max(0, duration / MIN_DURATION)
    } else if (duration > MAX_DURATION) {
      // scale down from MAX_DURATION -> MAX_PENALIZE_LIMIT
      const over = Math.min(duration, MAX_PENALIZE_LIMIT) - MAX_DURATION
      const range = MAX_PENALIZE_LIMIT - MAX_DURATION
      durationFactor = Math.max(0, 1 - (over / range))
    }

    const awakeningsFactor = adjusted / duration
    const combined = awakeningsFactor * durationFactor
    return Math.round(combined * 100)

  } catch (e) {
    return 0
  }
}

export function suggestSmartAlarms(startISO, cycles = 90, targetCycles = 5) {
  try {
    const start = parseISO(startISO)
    const suggestions = []
    // start suggesting from 3 cycles (light sleep exit) up to targetCycles
    for (let i = 3; i <= targetCycles; i++) {
      const mins = i * cycles
      suggestions.push(formatISO(addMinutes(start, mins)))
    }
    return suggestions
  } catch (e) {
    return []
  }
}
