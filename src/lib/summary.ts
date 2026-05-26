import type { ApplicationState, Card, CardState, Concept, SessionLog } from '../types'
import { isMastered } from './srs'

export interface StruggleCard {
  prompt: string
  lapses: number
}

export interface ConceptStruggle {
  concept: Concept
  cards: StruggleCard[]
}

export interface ParentSummary {
  generatedAt: string
  weekStartISO: string

  streak: { current: number; longest: number }
  weeklyActivity: { sessionCount: number; totalMinutes: number }

  justUnlocked: Concept[]
  workingOn: Concept[]
  strugglingWith: ConceptStruggle[]
  masteredThisWeek: Concept[]
  masteredAllTime: Concept[]

  totalConcepts: number
  totalCardsMastered: number
  daysActive: number

  conversationStarter: { conceptTitle: string; question: string } | null
}

export function buildParentSummary(
  concepts: Concept[],
  cards: Card[],
  cardStates: Record<string, CardState>,
  appStates: Record<string, ApplicationState>,
  sessionLogs: SessionLog[],
  streak: { current: number; longest: number }
): ParentSummary {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekStartISO = weekAgo.toISOString().slice(0, 10)

  // Index cards by concept for quick lookup
  const cardsByConcept = new Map<string, Card[]>()
  for (const card of cards) {
    const arr = cardsByConcept.get(card.concept_id) ?? []
    arr.push(card)
    cardsByConcept.set(card.concept_id, arr)
  }

  // Compute per-concept status (topological: prereqs assumed earlier in array)
  type ConceptStatus = 'locked' | 'untouched' | 'in_progress' | 'mastered'
  const status = new Map<string, ConceptStatus>()
  for (const concept of concepts) {
    const conceptCards = cardsByConcept.get(concept.id) ?? []
    if (conceptCards.length === 0) {
      status.set(concept.id, 'locked')
      continue
    }
    const touched = conceptCards.some((c) => cardStates[c.id])
    if (!touched) {
      const depsOk =
        concept.depends_on.length === 0 ||
        concept.depends_on.every((d) => status.get(d) === 'mastered')
      status.set(concept.id, depsOk ? 'untouched' : 'locked')
      continue
    }
    const masteredCount = conceptCards.filter((c) => {
      const s = cardStates[c.id]
      return s && isMastered(s)
    }).length
    const appOk = concept.application_id
      ? appStates[concept.application_id]?.passed === true
      : true
    if (masteredCount / conceptCards.length >= 0.8 && appOk) {
      status.set(concept.id, 'mastered')
    } else {
      status.set(concept.id, 'in_progress')
    }
  }

  const justUnlocked = concepts.filter((c) => status.get(c.id) === 'untouched')
  const workingOn = concepts.filter((c) => status.get(c.id) === 'in_progress')
  const masteredAllTime = concepts.filter((c) => status.get(c.id) === 'mastered')

  // Struggle: lapse_count >= 2 on a card = she's forgotten / misanswered it 2+ times
  const struggleMap = new Map<string, StruggleCard[]>()
  for (const card of cards) {
    const state = cardStates[card.id]
    if (!state) continue
    if (state.lapse_count >= 2) {
      const arr = struggleMap.get(card.concept_id) ?? []
      arr.push({ prompt: card.prompt, lapses: state.lapse_count })
      struggleMap.set(card.concept_id, arr)
    }
  }
  const strugglingWith: ConceptStruggle[] = []
  for (const [conceptId, struggleCards] of struggleMap) {
    const concept = concepts.find((c) => c.id === conceptId)
    if (concept) strugglingWith.push({ concept, cards: struggleCards })
  }

  // Mastered this week: any card on this concept last reviewed within the week AND concept is mastered now
  const masteredThisWeek = masteredAllTime.filter((concept) => {
    const conceptCards = cardsByConcept.get(concept.id) ?? []
    return conceptCards.some((card) => {
      const state = cardStates[card.id]
      if (!state?.last_reviewed_at) return false
      return state.last_reviewed_at.slice(0, 10) >= weekStartISO
    })
  })

  // Weekly activity from session logs
  const weeklyLogs = sessionLogs.filter((log) => log.date >= weekStartISO)
  const weeklyActivity = {
    sessionCount: weeklyLogs.length,
    totalMinutes: Math.round(
      weeklyLogs.reduce((sum, l) => sum + l.duration_seconds, 0) / 60
    ),
  }

  const totalCardsMastered = Object.values(cardStates).filter(isMastered).length
  const daysActive = new Set(sessionLogs.map((l) => l.date)).size

  // Conversation starter: pick from "working on" if any, else "mastered this week"
  let conversationStarter: ParentSummary['conversationStarter'] = null
  const target = workingOn.length > 0 ? workingOn : masteredThisWeek
  if (target.length > 0) {
    const concept = target[0]
    const conceptCards = cardsByConcept.get(concept.id) ?? []
    // Prefer explain/scenario cards (more conversational)
    const card =
      conceptCards.find((c) => c.type === 'explain' || c.type === 'scenario') ??
      conceptCards[0]
    if (card) {
      conversationStarter = { conceptTitle: concept.title, question: card.prompt }
    }
  }

  return {
    generatedAt: now.toISOString(),
    weekStartISO,
    streak,
    weeklyActivity,
    justUnlocked,
    workingOn,
    strugglingWith,
    masteredThisWeek,
    masteredAllTime,
    totalConcepts: concepts.length,
    totalCardsMastered,
    daysActive,
    conversationStarter,
  }
}

export function summaryToPlainText(s: ParentSummary, name: string): string {
  const lines: string[] = []
  const today = s.generatedAt.slice(0, 10)
  lines.push(`MONEY SCHOOL — Parent Summary for ${name || 'your learner'}`)
  lines.push(`Week of ${s.weekStartISO} to ${today}`)
  lines.push('')
  lines.push(`Streak: ${s.streak.current} day${s.streak.current === 1 ? '' : 's'} (longest: ${s.streak.longest})`)
  lines.push(`This week: ${s.weeklyActivity.sessionCount} session${s.weeklyActivity.sessionCount === 1 ? '' : 's'}, ${s.weeklyActivity.totalMinutes} min total`)
  lines.push('')

  if (s.justUnlocked.length > 0) {
    lines.push('JUST UNLOCKED (ready to learn next):')
    s.justUnlocked.slice(0, 5).forEach((c) => lines.push(`  - ${c.title}: ${c.summary}`))
    lines.push('')
  }

  if (s.workingOn.length > 0) {
    lines.push('CURRENTLY WORKING ON:')
    s.workingOn.slice(0, 8).forEach((c) => lines.push(`  - ${c.title}`))
    lines.push('')
  }

  if (s.strugglingWith.length > 0) {
    lines.push('STRUGGLING WITH:')
    s.strugglingWith.slice(0, 5).forEach(({ concept, cards }) =>
      lines.push(`  - ${concept.title} (${cards.length} card${cards.length === 1 ? '' : 's'} she keeps missing)`)
    )
    lines.push('')
  }

  if (s.masteredThisWeek.length > 0) {
    lines.push('MASTERED THIS WEEK:')
    s.masteredThisWeek.forEach((c) => lines.push(`  + ${c.title}`))
    lines.push('')
  }

  lines.push('ALL-TIME PROGRESS:')
  lines.push(`  ${s.masteredAllTime.length} of ${s.totalConcepts} concepts mastered`)
  lines.push(`  ${s.totalCardsMastered} individual cards locked in`)
  lines.push(`  ${s.daysActive} day${s.daysActive === 1 ? '' : 's'} active total`)
  lines.push('')

  if (s.conversationStarter) {
    lines.push('CONVERSATION STARTER (something to ask her):')
    lines.push(`  Topic: ${s.conversationStarter.conceptTitle}`)
    lines.push(`  "${s.conversationStarter.question}"`)
  }

  return lines.join('\n')
}
