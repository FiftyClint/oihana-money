import type { CardState, ReviewGrade } from '../types'

export const EASE_FLOOR = 1.3
export const EASE_DEFAULT = 2.5
export const MASTERY_INTERVAL_DAYS = 30
export const MASTERY_CONSECUTIVE_GOOD = 3

export function newCardState(card_id: string): CardState {
  return {
    card_id,
    ease: EASE_DEFAULT,
    interval_days: 0,
    due_date: todayISO(),
    lapse_count: 0,
    consecutive_good: 0,
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isDue(state: CardState, today = todayISO()): boolean {
  return state.due_date <= today
}

/**
 * Apply an SM-2 grade. Returns a NEW state (immutable).
 */
export function applyGrade(state: CardState, grade: ReviewGrade): CardState {
  const next: CardState = { ...state, last_reviewed_at: new Date().toISOString() }
  switch (grade) {
    case 'again': {
      next.interval_days = 0
      next.ease = Math.max(EASE_FLOOR, state.ease - 0.2)
      next.lapse_count = state.lapse_count + 1
      next.consecutive_good = 0
      next.due_date = todayISO() // re-show immediately (today)
      break
    }
    case 'hard': {
      next.interval_days = Math.max(1, Math.round(state.interval_days * 1.2))
      next.ease = Math.max(EASE_FLOOR, state.ease - 0.15)
      next.consecutive_good = 0
      next.due_date = addDays(todayISO(), next.interval_days)
      break
    }
    case 'good': {
      if (state.interval_days === 0) {
        next.interval_days = 1
      } else {
        next.interval_days = Math.max(1, Math.round(state.interval_days * state.ease))
      }
      next.consecutive_good = state.consecutive_good + 1
      next.due_date = addDays(todayISO(), next.interval_days)
      break
    }
    case 'easy': {
      if (state.interval_days === 0) {
        next.interval_days = 4
      } else {
        next.interval_days = Math.max(
          1,
          Math.round(state.interval_days * state.ease * 1.3)
        )
      }
      next.ease = state.ease + 0.15
      next.consecutive_good = state.consecutive_good + 1
      next.due_date = addDays(todayISO(), next.interval_days)
      break
    }
  }
  return next
}

export function isMastered(state: CardState): boolean {
  return (
    state.consecutive_good >= MASTERY_CONSECUTIVE_GOOD &&
    state.interval_days >= MASTERY_INTERVAL_DAYS
  )
}

/**
 * Interleave: shuffle the queue so no two consecutive cards share a concept
 * (when avoidable). Greedy algorithm; falls back to original order if forced.
 */
export function interleaveByConcept<T extends { concept_id: string }>(items: T[]): T[] {
  if (items.length <= 1) return items.slice()
  // Group by concept
  const groups = new Map<string, T[]>()
  for (const it of items) {
    const arr = groups.get(it.concept_id) ?? []
    arr.push(it)
    groups.set(it.concept_id, arr)
  }
  const result: T[] = []
  let lastConcept = ''
  while (result.length < items.length) {
    // Find biggest pile whose concept != lastConcept
    let pick: string | null = null
    let pickSize = -1
    for (const [cid, arr] of groups) {
      if (arr.length === 0) continue
      if (cid === lastConcept && groups.size > 1) {
        // try to skip; check if any other non-empty pile exists
        const otherExists = [...groups.entries()].some(
          ([c, a]) => c !== cid && a.length > 0
        )
        if (otherExists) continue
      }
      if (arr.length > pickSize) {
        pick = cid
        pickSize = arr.length
      }
    }
    if (pick == null) break
    const arr = groups.get(pick)!
    result.push(arr.shift()!)
    lastConcept = pick
  }
  return result
}
