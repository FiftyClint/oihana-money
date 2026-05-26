import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import type { Card, Concept, Application } from '../types'
import { interleaveByConcept } from '../lib/srs'
import CardView from './CardView'
import ApplicationView from './Application'
import EndSession from './EndSession'

type Step =
  | { kind: 'intro'; concept?: Concept }
  | { kind: 'review'; card: Card }
  | { kind: 'teach'; concept: Concept }
  | { kind: 'new-card'; card: Card; concept: Concept }
  | { kind: 'app'; application: Application }
  | { kind: 'end' }

export default function Session({
  minutes,
  onExit,
}: {
  minutes: 5 | 8 | 15
  onExit: () => void
}) {
  const buildSessionQueue = useStore((s) => s.buildSessionQueue)
  const markConceptSeen = useStore((s) => s.markConceptSeen)
  const reviewCard = useStore((s) => s.reviewCard)
  const recordApplication = useStore((s) => s.recordApplication)
  const endSession = useStore((s) => s.endSession)
  const setSettings = useStore((s) => s.setSettings)

  const [startedAt] = useState<number>(Date.now())
  const [stats, setStats] = useState<{
    reviews: number
    correct: number
    incorrect: number
    newConcepts: string[]
  }>({ reviews: 0, correct: 0, incorrect: 0, newConcepts: [] })

  // Build the queue ONCE per session (frozen for the duration)
  const queue = useMemo<Step[]>(() => {
    const q = buildSessionQueue(minutes)
    const steps: Step[] = []
    steps.push({ kind: 'intro', concept: q.newConcept })
    // interleave reviews
    const interleaved = interleaveByConcept(q.reviews)
    for (const card of interleaved) {
      steps.push({ kind: 'review', card })
    }
    if (q.newConcept) {
      steps.push({ kind: 'teach', concept: q.newConcept })
      for (const card of q.newConceptCards) {
        steps.push({ kind: 'new-card', card, concept: q.newConcept })
      }
    }
    if (q.application) {
      steps.push({ kind: 'app', application: q.application })
    }
    steps.push({ kind: 'end' })
    return steps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [idx, setIdx] = useState(0)
  const step = queue[idx]

  useEffect(() => {
    setSettings({ preferred_session_minutes: minutes })
  }, [minutes, setSettings])

  const totalCards = queue.filter((s) => s.kind === 'review' || s.kind === 'new-card').length
  const cardsDone =
    queue.slice(0, idx).filter((s) => s.kind === 'review' || s.kind === 'new-card').length
  const progressPct = step.kind === 'end' ? 100 : Math.round((idx / Math.max(1, queue.length - 1)) * 100)

  const advance = () => setIdx((i) => Math.min(i + 1, queue.length - 1))

  if (step.kind === 'intro') {
    return (
      <Frame
        progressPct={progressPct}
        onExit={onExit}
        cardsDone={cardsDone}
        totalCards={totalCards}
      >
        <div className="card space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {minutes}-minute session
          </div>
          <div className="text-2xl font-semibold leading-snug">
            {step.concept ? (
              <>Today: <span className="text-emerald-600 dark:text-emerald-400">{step.concept.title}</span></>
            ) : (
              <>Today: review what you've learned.</>
            )}
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            Tap <span className="font-medium">Start</span> when you're ready. You can quit any time.
          </div>
          <button className="btn-primary w-full" onClick={advance}>Start</button>
        </div>
      </Frame>
    )
  }

  if (step.kind === 'review') {
    return (
      <Frame progressPct={progressPct} onExit={onExit} cardsDone={cardsDone} totalCards={totalCards}>
        <CardView
          card={step.card}
          onGrade={(grade) => {
            reviewCard(step.card.id, grade)
            setStats((s) => ({
              ...s,
              reviews: s.reviews + 1,
              correct: s.correct + (grade === 'good' || grade === 'easy' ? 1 : 0),
              incorrect: s.incorrect + (grade === 'again' ? 1 : 0),
            }))
            advance()
          }}
        />
      </Frame>
    )
  }

  if (step.kind === 'teach') {
    // First-touch: mark the concept's cards as seen so future sessions show them
    return (
      <Frame progressPct={progressPct} onExit={onExit} cardsDone={cardsDone} totalCards={totalCards}>
        <div className="card space-y-3">
          <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">New concept</div>
          <div className="text-2xl font-semibold leading-snug">{step.concept.title}</div>
          <div className="text-slate-800 dark:text-slate-200 leading-relaxed">{step.concept.summary}</div>
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <span className="font-medium text-slate-700 dark:text-slate-200">Why it matters: </span>
            {step.concept.why_it_matters}
          </div>
          <button
            className="btn-primary w-full"
            onClick={() => {
              markConceptSeen(step.concept.id)
              setStats((s) => ({ ...s, newConcepts: [...s.newConcepts, step.concept!.id] }))
              advance()
            }}
          >
            Got it — let's practice
          </button>
        </div>
      </Frame>
    )
  }

  if (step.kind === 'new-card') {
    return (
      <Frame progressPct={progressPct} onExit={onExit} cardsDone={cardsDone} totalCards={totalCards}>
        <CardView
          card={step.card}
          onGrade={(grade) => {
            reviewCard(step.card.id, grade)
            setStats((s) => ({
              ...s,
              reviews: s.reviews + 1,
              correct: s.correct + (grade === 'good' || grade === 'easy' ? 1 : 0),
              incorrect: s.incorrect + (grade === 'again' ? 1 : 0),
            }))
            advance()
          }}
        />
      </Frame>
    )
  }

  if (step.kind === 'app') {
    return (
      <Frame progressPct={progressPct} onExit={onExit} cardsDone={cardsDone} totalCards={totalCards}>
        <ApplicationView
          application={step.application}
          onComplete={(passed) => {
            recordApplication(step.application.id, passed)
            advance()
          }}
        />
      </Frame>
    )
  }

  // end
  const durationSec = Math.round((Date.now() - startedAt) / 1000)
  return (
    <EndSession
      stats={stats}
      durationSec={durationSec}
      onDone={() => {
        endSession({
          date: new Date().toISOString().slice(0, 10),
          duration_seconds: durationSec,
          reviews_completed: stats.reviews,
          correct_count: stats.correct,
          incorrect_count: stats.incorrect,
          new_concepts_introduced: stats.newConcepts,
        })
        onExit()
      }}
    />
  )
}

function Frame({
  children,
  progressPct,
  onExit,
  cardsDone,
  totalCards,
}: {
  children: React.ReactNode
  progressPct: number
  onExit: () => void
  cardsDone: number
  totalCards: number
}) {
  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="text-slate-500 dark:text-slate-400 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          aria-label="Exit session"
        >
          ✕
        </button>
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {cardsDone}/{totalCards}
        </div>
      </div>
      {children}
    </div>
  )
}
