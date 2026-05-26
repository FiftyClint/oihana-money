import { useStore } from '../lib/store'
import { isMastered } from '../lib/srs'

interface SessionStats {
  reviews: number
  correct: number
  incorrect: number
  newConcepts: string[]
}

export default function EndSession({
  stats,
  durationSec,
  onDone,
}: {
  stats: SessionStats
  durationSec: number
  onDone: () => void
}) {
  const concepts = useStore((s) => s.getConcepts())
  const cards = useStore((s) => s.getCards())
  const cardStates = useStore((s) => s.card_states)
  const appStates = useStore((s) => s.application_states)
  const streak = useStore((s) => s.current_streak)
  const totalSessionCount = useStore((s) => s.session_logs.length + 1) // +1 for the one ending now

  const newConceptTitles = stats.newConcepts
    .map((id) => concepts.find((c) => c.id === id)?.title)
    .filter(Boolean) as string[]

  // Compute mastered concept count (so we can detect milestones)
  const masteredConceptCount = (() => {
    let count = 0
    for (const concept of concepts) {
      const conceptCards = cards.filter((c) => c.concept_id === concept.id)
      if (conceptCards.length === 0) continue
      const mastered = conceptCards.filter((c) => {
        const s = cardStates[c.id]
        return s ? isMastered(s) : false
      }).length
      const appOk = concept.application_id
        ? appStates[concept.application_id]?.passed === true
        : true
      if (mastered / conceptCards.length >= 0.8 && appOk) count++
    }
    return count
  })()

  const milestone = pickMilestone({
    sessionNumber: totalSessionCount,
    streak,
    masteredConceptCount,
    totalConcepts: concepts.length,
  })

  const minutes = Math.max(1, Math.round(durationSec / 60))
  const accuracy = stats.reviews > 0
    ? Math.round((stats.correct / stats.reviews) * 100)
    : 0

  return (
    <div className="card space-y-4 text-center mt-4">
      <div className="text-5xl">{milestone ? milestone.emoji : '🎉'}</div>
      <div>
        <div className="text-2xl font-bold">
          {milestone ? milestone.headline : 'Nice work.'}
        </div>
        <div className="text-slate-600 dark:text-slate-400 mt-1">
          {minutes} minute{minutes === 1 ? '' : 's'} · {stats.reviews} cards
        </div>
      </div>

      {milestone && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 text-left">
          <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            Milestone
          </div>
          <div className="text-slate-900 dark:text-slate-100">{milestone.body}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-left">
        <Stat label="Cards practiced" value={String(stats.reviews)} />
        <Stat label="Got it / easy" value={`${accuracy}%`} />
      </div>

      {newConceptTitles.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 text-left">
          <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            Unlocked today
          </div>
          <ul className="text-slate-900 dark:text-slate-100">
            {newConceptTitles.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="btn-primary w-full" onClick={onDone}>
        Done
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  )
}

interface Milestone {
  emoji: string
  headline: string
  body: string
}

/**
 * Pick the most-impressive applicable milestone for this session-end.
 * Streak milestones beat concept milestones beat session-count milestones.
 * Returns null if no special milestone is hit (default celebration applies).
 */
function pickMilestone(ctx: {
  sessionNumber: number
  streak: number
  masteredConceptCount: number
  totalConcepts: number
}): Milestone | null {
  // All concepts mastered — biggest moment in the app
  if (ctx.masteredConceptCount === ctx.totalConcepts && ctx.totalConcepts > 0) {
    return {
      emoji: '🏆',
      headline: 'You finished the whole thing.',
      body: `Every concept mastered. You now know more about money and investing than most adults. Seriously.`,
    }
  }
  // Streak milestones (these hit at most once per day)
  if (ctx.streak === 30) {
    return {
      emoji: '🌟',
      headline: '30-day streak.',
      body: `A whole month, every day. This isn't a phase anymore — it's a habit. The compound interest on showing up.`,
    }
  }
  if (ctx.streak === 14) {
    return {
      emoji: '🔥',
      headline: 'Two-week streak.',
      body: `14 days in a row. Most people who try a learning app quit by day 3. You're not most people.`,
    }
  }
  if (ctx.streak === 7) {
    return {
      emoji: '🔥',
      headline: 'A full week.',
      body: `7 days in a row. The habit's forming. Keep going.`,
    }
  }
  if (ctx.streak === 3) {
    return {
      emoji: '🔥',
      headline: '3 days in a row.',
      body: `That's when daily things start to stick. Tomorrow makes 4.`,
    }
  }
  // Concept-mastered milestones
  if (ctx.masteredConceptCount === 10) {
    return {
      emoji: '🎯',
      headline: '10 concepts mastered.',
      body: `You're past the basics. The rest is building on what you already know.`,
    }
  }
  if (ctx.masteredConceptCount === 5) {
    return {
      emoji: '🎯',
      headline: '5 concepts down.',
      body: `Real, stuck-in-your-head knowledge — not just stuff you read once. The hard part is just starting; you started.`,
    }
  }
  if (ctx.masteredConceptCount === 1) {
    return {
      emoji: '✓',
      headline: 'First concept mastered.',
      body: `You just locked something in long-term. Most people never make it past concept one. You did.`,
    }
  }
  // First session ever
  if (ctx.sessionNumber === 1) {
    return {
      emoji: '👋',
      headline: 'Your first session.',
      body: `That's the hardest one. Show up tomorrow and you've already done better than most.`,
    }
  }
  return null
}
